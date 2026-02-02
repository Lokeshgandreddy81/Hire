import logging
from datetime import datetime, timezone, timedelta
from typing import Any

from fastapi import APIRouter, HTTPException, status, Depends, Request, BackgroundTasks
from bson import ObjectId

from app.schemas.auth import OTPRequest, OTPVerify, Token, UserRole, TokenRefreshRequest
from app.services.otp_service import generate_otp, verify_otp, send_otp_via_provider
from app.core.security import create_access_token, create_refresh_token, get_token_hash, get_current_user
from app.core.logging import log_event, increment_metric
from app.db.mongo import get_db
from app.services.rate_limiter import check_otp_send_limit, check_otp_verify_limit, check_refresh_token_limit
from app.core.config import settings

# =============================================================================
# CONFIGURATION
# =============================================================================
router = APIRouter()
logger = logging.getLogger("AuthRouter")

# =============================================================================
# ENDPOINTS
# =============================================================================

@router.post("/send-otp")
async def send_otp_route(
    request: OTPRequest, 
    background_tasks: BackgroundTasks,
    req: Request
):
    """
    Generates and sends an OTP.
    Security: Rate limited (3 req / 5 min).
    Performance: Sending happens in background.
    """
    request_id = getattr(req.state, "request_id", None)
    
    # 1. Rate Limit Check (Cook Operational Discipline)
    await check_otp_send_limit(request.identifier)
    
    # 2. Generate Logic
    # (Assuming generate_otp handles storage in Redis/Memory)
    otp_code = await generate_otp(request.identifier)
    
    # 3. Async Delivery (Fire & Forget)
    # Don't make the user wait for Twilio/SendGrid
    background_tasks.add_task(send_otp_via_provider, request.identifier, otp_code)
    
    increment_metric("otp.sent")
    log_event("otp_sent", request_id=request_id, identifier=request.identifier)
    
    # In Dev mode, we might return the OTP for testing, but in Prod NEVER.
    return {"message": "OTP sent successfully", "identifier": request.identifier}


@router.post("/verify-otp", response_model=Token)
async def verify_otp_route(request: OTPVerify):
    """
    Verifies OTP and issues JWT (Access + Refresh).
    Logic: Upsert User (Create if new, Login if exists).
    """
    # 1. Rate Limit Check
    await check_otp_verify_limit(request.identifier)
    
    # 2. Verify Code
    if not await verify_otp(request.identifier, request.otp):
        increment_metric("otp.verify.fail")
        log_event("otp_failure", identifier=request.identifier, reason="invalid_code")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid OTP or expired.",
        )
    
    db = get_db()
    
    # 2. Find or Create User
    # CRITICAL FIX: Query by 'identifier', not 'email' (since it could be phone)
    user = await db["users"].find_one({"identifier": request.identifier})
    
    is_new_user = False
    
    if not user:
        is_new_user = True
        # Use .value to get string from enum for MongoDB storage
        role_value = request.role.value if hasattr(request.role, 'value') else str(request.role)
        new_user = {
            "identifier": request.identifier,
            "role": role_value,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_login": datetime.now(timezone.utc).isoformat()
        }
        result = await db["users"].insert_one(new_user)
        user_id = str(result.inserted_id)
        current_role = role_value
    else:
        user_id = str(user["_id"])
        # Use existing role from DB, don't overwrite with request
        current_role = user.get("role", request.role)
        
        # Update login time
        await db["users"].update_one(
            {"_id": user["_id"]},
            {"$set": {"last_login": datetime.now(timezone.utc).isoformat()}}
        )
    

    # 3. Generate Tokens
    access_token = create_access_token(data={
        "sub": request.identifier, 
        "role": current_role, 
        "id": user_id
    })
    
    refresh_token = create_refresh_token(data={
        "sub": request.identifier,
        "role": current_role,
        "id": user_id
    })
    
    # 4. Store Refresh Token Hash
    rt_hash = get_token_hash(refresh_token)
    await db["refresh_tokens"].insert_one({
        "user_id": user_id,
        "token_hash": rt_hash,
        "created_at": datetime.now(timezone.utc),
        "expires_at": datetime.now(timezone.utc) + timedelta(days=getattr(settings, 'REFRESH_TOKEN_EXPIRE_DAYS', 30)),
        "revoked": False
    })
    
    increment_metric("auth.login.success")
    if is_new_user:
        increment_metric("auth.signup")
    log_event("login_success", user_id=user_id, is_new=is_new_user)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "role": current_role,
        "user_id": user_id,
        "is_new_user": is_new_user
    }


@router.post("/refresh", response_model=Token)
async def refresh_token_route(payload: TokenRefreshRequest):
    """
    Rotate Refresh Token.
    Validates old refresh token, revokes it, and issues a new pair.
    """
    from jose import jwt, JWTError
    
    db = get_db()
    
    try:
        # 0. Decode to get user_id for rate limiting
        decoded = jwt.decode(payload.refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = decoded.get("id")
        
        if user_id:
            await check_refresh_token_limit(user_id)
        
        # 1. Decode & Validate Structure
        decoded = jwt.decode(payload.refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if decoded.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
            
        user_id = decoded.get("id")
        identifier = decoded.get("sub")
        role = decoded.get("role")
        
        if not user_id or not identifier:
            raise HTTPException(status_code=401, detail="Invalid token claims")
            
        # 2. Check DB for Revocation/Existence
        rt_hash = get_token_hash(payload.refresh_token)
        stored_token = await db["refresh_tokens"].find_one({
            "token_hash": rt_hash,
            "user_id": user_id
        })
        
        if not stored_token or stored_token.get("revoked", True):
            # SECURITY WARNING: Reuse detection could trigger here (lock account?)
            log_event("refresh_reuse_attempt", user_id=user_id)
            raise HTTPException(status_code=401, detail="Token revoked or invalid")
            
        # 3. Revoke Old Token
        await db["refresh_tokens"].update_one(
            {"_id": stored_token["_id"]},
            {"$set": {"revoked": True}}
        )
        
        # 4. Issue New Pair
        new_access_token = create_access_token(data={"sub": identifier, "role": role, "id": user_id})
        new_refresh_token = create_refresh_token(data={"sub": identifier, "role": role, "id": user_id})
        
        # 5. Store New Hash
        new_rt_hash = get_token_hash(new_refresh_token)
        await db["refresh_tokens"].insert_one({
            "user_id": user_id,
            "token_hash": new_rt_hash,
            "created_at": datetime.now(timezone.utc),
            "expires_at_date": datetime.now(timezone.utc) + timedelta(days=getattr(settings, 'REFRESH_TOKEN_EXPIRE_DAYS', 30)),
            "revoked": False
        })
        
        increment_metric("auth.refresh.success")
        return {
            "access_token": new_access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer",
            "role": role,
            "user_id": user_id
        }
        
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        logger.error(f"Refresh Failed: {e}")
        raise HTTPException(status_code=500, detail="Refresh failed")


@router.post("/logout")
async def logout(payload: TokenRefreshRequest):
    """
    Revokes the Refresh Token.
    """
    db = get_db()
    rt_hash = get_token_hash(payload.refresh_token)
    
    await db["refresh_tokens"].update_one(
        {"token_hash": rt_hash},
        {"$set": {"revoked": True}}
    )
    
    return {"status": "success", "message": "Logged out"}



@router.delete("/account")
async def delete_account(current_user: dict = Depends(get_current_user)):
    """
    GDPR-Compliant Account Deletion.
    Permanently removes all user data.
    """
    db = get_db()
    user_id = current_user.get("id")
    
    try:
        oid = ObjectId(user_id)
        
        # 1. Delete User
        await db["users"].delete_one({"_id": oid})
        
        # 2. Delete Related Data (Using string ID as foreign key)
        # Note: In a real microservice, we'd emit a "USER_DELETED" event
        await db["profiles"].delete_many({"user_id": user_id})
        await db["applications"].delete_many({"user_id": user_id})
        await db["chats"].delete_many({"user_id": user_id})
        await db["job_matches"].delete_many({"user_id": user_id})
        
        log_event("account_deleted", user_id=user_id)
        
        return {"status": "success", "message": "Account permanently deleted"}
        
    except Exception as e:
        logger.error(f"Deletion failed: {e}")
        raise HTTPException(status_code=500, detail="Deletion failed")