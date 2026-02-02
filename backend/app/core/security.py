import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any

from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from bson import ObjectId

from app.core.config import settings
from app.db.mongo import get_db

# =============================================================================
# CONFIGURATION
# =============================================================================
logger = logging.getLogger("SecurityModule")

# Password Hashing (Bcrypt is standard/safe)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Bearer Token Scheme
security = HTTPBearer()

# =============================================================================
# UTILITIES: PASSWORD & TOKEN
# =============================================================================

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a raw password against a hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Generates a secure password hash."""
    return pwd_context.hash(password)

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Creates a JWT access token.
    Operational Discipline: Uses UTC timezone explicitly.
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    
    try:
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return encoded_jwt
    except Exception as e:
        logger.error(f"Token Creation Failed: {e}")
        raise HTTPException(status_code=500, detail="Could not generate token")

def create_refresh_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Creates a long-lived JWT refresh token.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode.update({"exp": expire, "type": "refresh"})
    
    try:
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return encoded_jwt
    except Exception as e:
        logger.error(f"Refresh Token Creation Failed: {e}")
        raise HTTPException(status_code=500, detail="Could not generate refresh token")

def get_token_hash(token: str) -> str:
    """
    Returns SHA256 hash of the token for storage.
    We generally store a hash of the refresh token to prevent use if DB is compromised.
    """
    import hashlib
    return hashlib.sha256(token.encode()).hexdigest()

# =============================================================================
# AUTHENTICATION DEPENDENCY (The Gatekeeper)
# =============================================================================

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict[str, Any]:
    """
    Validates JWT and checks User existence in DB.
    Security Principle: Never trust a token blindly; the user might be banned.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # 1. Decode Token
        token = credentials.credentials
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        
        user_id: str = payload.get("id")
        identifier: str = payload.get("sub")
        role: str = payload.get("role", "candidate")

        if user_id is None or identifier is None:
            logger.warning("Token missing critical claims (id or sub)")
            raise credentials_exception

        # 2. Database Verification (The "Production" Step)
        # We verify the user actually exists and is active.
        db = get_db()
        try:
            oid = ObjectId(user_id)
            # Projection: Fetch minimal data for speed
            user = await db["users"].find_one(
                {"_id": oid}, 
                {"_id": 1, "is_active": 1, "role": 1}
            )
            
            if not user:
                logger.warning(f"Token valid but user {user_id} not found in DB (Deleted?)")
                raise credentials_exception
                
            # Optional: Check if banned/inactive
            if user.get("is_active") is False:
                logger.warning(f"User {user_id} is inactive but tried to login")
                raise HTTPException(status_code=403, detail="User account is inactive")

        except Exception as db_e:
            # Handle InvalidId or DB connection issues
            logger.error(f"Auth DB Check Failed: {db_e}")
            raise credentials_exception

        return {
            "id": user_id,
            "identifier": identifier,
            "role": role # Trust token role or DB role? Usually DB is safer, but token is faster.
        }

    except JWTError as e:
        logger.info(f"JWT Error: {e}")
        raise credentials_exception
    except Exception as e:
        logger.error(f"Unexpected Auth Error: {e}")
        raise credentials_exception

# =============================================================================
# WEBSOCKET AUTH HELPER
# =============================================================================

def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decodes JWT for WebSocket connections (where HTTP Depends doesn't work).
    Returns None if invalid.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("id") is None:
            return None
        return payload
    except JWTError:
        return None