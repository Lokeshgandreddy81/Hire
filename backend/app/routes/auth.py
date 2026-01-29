from datetime import datetime
from fastapi import APIRouter, HTTPException, status
from app.models.user import OTPRequest, OTPVerify, Token
from app.services.otp_service import generate_otp, verify_otp
from app.core.security import create_access_token
from app.db.mongo import get_db

router = APIRouter()

@router.post("/send-otp")
async def send_otp_route(request: OTPRequest):
    generate_otp(request.identifier)
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
