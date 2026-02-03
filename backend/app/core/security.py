from datetime import datetime, timedelta
from typing import Optional, Union
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.config import settings
from app.core.database import get_db

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_PREFIX}/auth/login", auto_error=False)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Generate password hash"""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(data: dict) -> str:
    """Create JWT refresh token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    """Decode and validate JWT token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None


async def get_current_user(
    request: Request,
    token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    """
    Get current authenticated user from HTTP-only cookie or Authorization header.
    SECURITY FIX: Prioritizes HTTP-only cookie, falls back to header for API clients.
    """
    from app.models.user import User

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # SECURITY FIX: Try to get token from HTTP-only cookie first (more secure)
    token_value = request.cookies.get("access_token")

    # Fallback to Authorization header for API clients (mobile, etc.)
    if not token_value:
        token_value = token

    if not token_value:
        raise credentials_exception

    payload = decode_token(token_value)
    if payload is None:
        raise credentials_exception

    user_id: str = payload.get("sub")
    token_type: str = payload.get("type")

    if user_id is None or token_type != "access":
        raise credentials_exception

    result = await db.execute(
        select(User)
        .options(selectinload(User.vendor))
        .where(User.id == user_id)
    )
    user = result.scalar_one_or_none()

    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    return user


async def get_current_active_user(current_user = Depends(get_current_user)):
    """Ensure user is active"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


async def get_current_vendor(current_user = Depends(get_current_user)):
    """Ensure user is a vendor (regardless of approval status)"""
    if current_user.role not in ["vendor", "admin"]:
        raise HTTPException(status_code=403, detail="Not a vendor")
    return current_user


async def get_approved_vendor(
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Ensure user is an approved vendor - blocks pending/rejected/suspended vendors"""
    from app.models.vendor import Vendor, VendorStatus

    if current_user.role == "admin":
        return current_user

    if current_user.role != "vendor":
        raise HTTPException(status_code=403, detail="Not a vendor")

    # Check vendor approval status
    result = await db.execute(
        select(Vendor).where(Vendor.user_id == current_user.id)
    )
    vendor = result.scalar_one_or_none()

    if not vendor:
        raise HTTPException(status_code=403, detail="Vendor profile not found")

    if vendor.status == VendorStatus.PENDING:
        raise HTTPException(
            status_code=403,
            detail="Your vendor account is pending approval. Please wait for admin review."
        )
    elif vendor.status == VendorStatus.REJECTED:
        raise HTTPException(
            status_code=403,
            detail="Your vendor application was rejected. Please contact support."
        )
    elif vendor.status == VendorStatus.SUSPENDED:
        raise HTTPException(
            status_code=403,
            detail="Your vendor account has been suspended. Please contact support."
        )
    elif vendor.status != VendorStatus.APPROVED:
        raise HTTPException(status_code=403, detail="Vendor account not approved")

    return current_user


async def get_current_admin(current_user = Depends(get_current_user)):
    """Ensure user is an admin"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


def get_optional_current_user(token: Optional[str] = Depends(oauth2_scheme)):
    """Get current user if authenticated, None otherwise"""
    if token is None:
        return None
    try:
        payload = decode_token(token)
        if payload is None:
            return None
        return payload.get("sub")
    except:
        return None
