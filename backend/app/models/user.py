from pydantic import BaseModel
from typing import Optional, List

class OTPRequest(BaseModel):
    identifier: str  # Email or Phone

class OTPVerify(BaseModel):
    identifier: str
    otp: str
    role: str = "candidate"

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    user_id: Optional[str] = None

class UserBase(BaseModel):
    email: str
    role: str

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: Optional[str] = None
