from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field, EmailStr, validator

# =============================================================================
# ENUMS (Strict Type Definitions)
# =============================================================================

class UserRole(str, Enum):
    CANDIDATE = "candidate"
    EMPLOYER = "employer"
    ADMIN = "admin"

# =============================================================================
# AUTHENTICATION SCHEMAS
# =============================================================================

class OTPRequest(BaseModel):
    identifier: str = Field(
        ..., 
        min_length=3, 
        max_length=100, 
        description="User's Email or Phone Number",
        example="user@example.com"
    )

    @validator("identifier")
    def validate_identifier(cls, v):
        """Sanity check: Must contain @ for email or digits for phone"""
        v = v.strip().lower()
        if "@" not in v:
            # Assume phone number: Strip special chars
            clean_phone = "".join(filter(str.isdigit, v))
            if len(clean_phone) < 7:
                raise ValueError("Invalid phone number format")
        return v

class OTPVerify(BaseModel):
    identifier: str = Field(..., description="The identifier used to request OTP")
    otp: str = Field(..., min_length=4, max_length=6, description="The 4-6 digit code received")
    role: UserRole = Field(
        default=UserRole.CANDIDATE, 
        description="Role context for login (defaults to candidate)"
    )

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: str
    is_new_user: bool = False  # Helpful for UI to trigger onboarding flow

# =============================================================================
# USER MODELS
# =============================================================================

class UserBase(BaseModel):
    identifier: str
    role: UserRole
    is_active: bool = True

class UserCreate(UserBase):
    """Internal schema for DB creation"""
    pass

class UserResponse(UserBase):
    """Safe response model (excludes internal flags if any)"""
    id: str

    class Config:
        # Pydantic V1/V2 compatibility for ORM modes
        from_attributes = True
        populate_by_name = True