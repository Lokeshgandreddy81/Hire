from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum

class UserRole(str, Enum):
    employee = "employee"
    employer = "employer"

class OTPRequest(BaseModel):
    identifier: str = Field(..., min_length=5, max_length=100)

class OTPVerify(BaseModel):
    identifier: str = Field(..., min_length=5, max_length=100)
    otp: str = Field(..., min_length=4, max_length=10)
    role: UserRole = UserRole.employee

class Token(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    role: str
    user_id: str
    is_new_user: Optional[bool] = False

class TokenRefreshRequest(BaseModel):
    refresh_token: str
