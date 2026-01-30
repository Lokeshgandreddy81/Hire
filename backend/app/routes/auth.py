from datetime import datetime
from fastapi import APIRouter, HTTPException, status, Depends, Request
from app.models.user import OTPRequest, OTPVerify, Token
from app.services.otp_service import generate_otp, verify_otp
from app.core.security import create_access_token, get_current_user
from app.core.logging import log_event
from app.db.mongo import get_db
from app.middleware.rate_limiter import check_otp_rate_limit
from bson import ObjectId

router = APIRouter()

@router.post("/send-otp")
async def send_otp_route(req: Request, request: OTPRequest):
    request_id = getattr(req.state, "request_id", None)
    check_otp_rate_limit(request.identifier)
    generate_otp(request.identifier)
    log_event("otp_sent", request_id=request_id)
    return {"message": "OTP sent successfully", "identifier": request.identifier}

@router.post("/verify-otp", response_model=Token)
async def verify_otp_route(request: OTPVerify):
    is_valid = verify_otp(request.identifier, request.otp)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid OTP or expired",
        )
    
    db = get_db()
    users_collection = db["users"]
    user = await users_collection.find_one({"email": request.identifier})
    
    user_id = ""
    if not user:
        new_user = {
            "email": request.identifier,
            "role": request.role,
            "created_at": datetime.utcnow().isoformat()
        }
        result = await users_collection.insert_one(new_user)
        user_id = str(result.inserted_id)
    else:
        user_id = str(user["_id"])
    
    # Generate Token
    access_token = create_access_token(data={"sub": request.identifier, "role": request.role, "id": user_id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": request.role,
        "user_id": user_id
    }


@router.delete("/account")
async def delete_account(current_user: dict = Depends(get_current_user)):
    """Delete account and related data. Launch requirement: account deletion with confirmation (client confirms)."""
    db = get_db()
    user_id = current_user.get("id")
    try:
        oid = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user id")
    # Delete user and related data (profiles, applications, chats where user is participant)
    await db["users"].delete_one({"_id": oid})
    await db["profiles"].delete_many({"user_id": user_id})
    await db["applications"].delete_many({"user_id": user_id})
    await db["chats"].delete_many({"user_id": user_id})
    await db["job_matches"].delete_many({"user_id": user_id})
    return {"status": "success", "message": "Account deleted"}
