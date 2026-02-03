from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, UploadFile, File, Request, Response
from fastapi.security import OAuth2PasswordRequestForm
from slowapi import Limiter
from slowapi.util import get_remote_address
import uuid
import os
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from datetime import datetime, timedelta
import secrets

from app.core.database import get_db
from app.core.security import (
    verify_password, get_password_hash, create_access_token,
    create_refresh_token, decode_token, get_current_user, create_csrf_token
)
from app.core.config import settings
from app.models.user import User, UserRole, AuthProvider
from app.models.cart import Cart
from app.schemas.user import (
    UserCreate, UserLogin, UserResponse, TokenResponse,
    PasswordReset, PasswordResetConfirm, PasswordChange, RefreshTokenRequest
)
from app.schemas.common import MessageResponse

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


def set_auth_cookies(response: Response, access_token: str, refresh_token: str, user_id: str):
    """Set HTTP-only cookies for access and refresh tokens, and CSRF token"""
    # Access token cookie (short-lived)
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,  # Cannot be accessed by JavaScript
        secure=not settings.DEBUG,  # Only sent over HTTPS in production
        samesite="lax",  # CSRF protection
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )

    # Refresh token cookie (long-lived)
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=not settings.DEBUG,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/api/v1/auth",  # Only sent to auth endpoints
    )

    # CSRF token cookie (NOT httponly - JS needs to read it to send in headers)
    csrf_token = create_csrf_token(user_id)
    response.set_cookie(
        key="csrf_token",
        value=csrf_token,
        httponly=False,  # JS needs to read this
        secure=not settings.DEBUG,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )


def clear_auth_cookies(response: Response):
    """Clear authentication cookies"""
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/api/v1/auth")
    response.delete_cookie(key="csrf_token", path="/")


def verify_image_magic_bytes(contents: bytes) -> bool:
    """Verify file is actually an image by checking magic bytes."""
    signatures = {
        b'\xff\xd8\xff': 'image/jpeg',      # JPEG
        b'\x89PNG\r\n\x1a\n': 'image/png',  # PNG
        b'GIF87a': 'image/gif',              # GIF87a
        b'GIF89a': 'image/gif',              # GIF89a
        b'RIFF': 'image/webp',               # WebP (starts with RIFF)
    }
    for sig in signatures:
        if contents[:len(sig)] == sig:
            return True
    return False


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def register(
    request: Request,
    response: Response,
    user_data: UserCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """Register a new user"""
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create user
    user = User(
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        phone=user_data.phone,
        role=UserRole.CUSTOMER,
        auth_provider=AuthProvider.LOCAL,
        verification_token=secrets.token_urlsafe(32)
    )
    db.add(user)
    await db.flush()

    # Create empty cart for user
    cart = Cart(user_id=user.id)
    db.add(cart)
    await db.commit()
    await db.refresh(user)

    # Send welcome email + notification in background
    background_tasks.add_task(
        _send_welcome_background, user.id, user.email, user.first_name
    )

    # Generate tokens
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    # Create UserResponse directly for new users (no vendor yet)
    user_response = UserResponse(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        phone=user.phone,
        avatar_url=user.avatar_url,
        role=user.role.value if hasattr(user.role, 'value') else user.role,
        is_active=user.is_active,
        is_verified=user.is_verified,
        is_vendor=False,
        vendor_id=None,
        vendor_slug=None,
        created_at=user.created_at,
        last_login=user.last_login,
    )

    # SECURITY FIX: Set HTTP-only cookies instead of returning tokens in response
    # This prevents XSS attacks from stealing tokens
    # Also sets CSRF token for protection against CSRF attacks
    set_auth_cookies(response, access_token, refresh_token, str(user.id))

    return TokenResponse(
        access_token="",  # Empty - token is in HTTP-only cookie
        refresh_token="",  # Empty - token is in HTTP-only cookie
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=user_response
    )


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
async def login(
    request: Request,
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """Login with email and password"""
    result = await db.execute(
        select(User)
        .options(selectinload(User.vendor))
        .where(User.email == form_data.username)
    )
    user = result.scalar_one_or_none()

    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled"
        )

    # Update last login
    user.last_login = datetime.utcnow()
    await db.commit()

    # Generate tokens
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    # SECURITY FIX: Set HTTP-only cookies and CSRF token
    set_auth_cookies(response, access_token, refresh_token, str(user.id))

    return TokenResponse(
        access_token="",  # Empty - token is in HTTP-only cookie
        refresh_token="",  # Empty - token is in HTTP-only cookie
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(user)
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """Refresh access token using HTTP-only cookie"""
    # SECURITY FIX: Read refresh token from HTTP-only cookie instead of request body
    refresh_token_value = request.cookies.get("refresh_token")

    if not refresh_token_value:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not found"
        )

    payload = decode_token(refresh_token_value)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

    user_id = payload.get("sub")
    result = await db.execute(
        select(User)
        .options(selectinload(User.vendor))
        .where(User.id == user_id)
    )
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )

    # Generate new tokens
    new_access_token = create_access_token(data={"sub": str(user.id)})
    new_refresh_token = create_refresh_token(data={"sub": str(user.id)})

    # SECURITY FIX: Set new tokens and CSRF token in HTTP-only cookies
    set_auth_cookies(response, new_access_token, new_refresh_token, str(user.id))

    return TokenResponse(
        access_token="",  # Empty - token is in HTTP-only cookie
        refresh_token="",  # Empty - token is in HTTP-only cookie
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(user)
    )


@router.post("/password-reset", response_model=MessageResponse)
@limiter.limit("3/minute")
async def request_password_reset(
    request: Request,
    data: PasswordReset,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """Request password reset"""
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if user:
        # Generate reset token
        user.reset_token = secrets.token_urlsafe(32)
        user.reset_token_expires = datetime.utcnow() + timedelta(hours=1)
        await db.commit()

        # Send reset email in background
        from app.services.notifications import trigger_password_reset_email
        background_tasks.add_task(
            trigger_password_reset_email,
            user.email, user.first_name, user.reset_token,
        )

    # Always return success to prevent email enumeration
    return MessageResponse(message="If the email exists, a reset link has been sent")


@router.post("/password-reset/confirm", response_model=MessageResponse)
async def confirm_password_reset(
    data: PasswordResetConfirm,
    db: AsyncSession = Depends(get_db)
):
    """Confirm password reset with token"""
    result = await db.execute(
        select(User).where(
            User.reset_token == data.token,
            User.reset_token_expires > datetime.utcnow()
        )
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )

    # Update password
    user.password_hash = get_password_hash(data.password)
    user.reset_token = None
    user.reset_token_expires = None
    await db.commit()

    return MessageResponse(message="Password has been reset successfully")


@router.post("/password-change", response_model=MessageResponse)
async def change_password(
    data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Change password for authenticated user"""
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )

    current_user.password_hash = get_password_hash(data.new_password)
    await db.commit()

    return MessageResponse(message="Password changed successfully")


@router.post("/verify-email/{token}", response_model=MessageResponse)
async def verify_email(
    token: str,
    db: AsyncSession = Depends(get_db)
):
    """Verify email with token"""
    result = await db.execute(select(User).where(User.verification_token == token))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification token"
        )

    user.is_verified = True
    user.verification_token = None
    await db.commit()

    return MessageResponse(message="Email verified successfully")


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user profile"""
    return UserResponse.model_validate(current_user)


@router.post("/me/avatar", response_model=UserResponse)
async def update_avatar(
    avatar: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Upload/update user avatar"""
    ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    MAX_AVATAR_SIZE = 5 * 1024 * 1024  # 5MB

    # Validate file type
    if avatar.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image type. Allowed: JPG, PNG, GIF, WebP"
        )

    # Read and validate file size
    contents = await avatar.read()
    if len(contents) > MAX_AVATAR_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File too large. Maximum size: 5MB"
        )

    # Verify magic bytes match an actual image
    if not verify_image_magic_bytes(contents):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File content does not match a valid image format"
        )

    # Create uploads directory if it doesn't exist
    upload_dir = f"uploads/avatars/{current_user.id}"
    os.makedirs(upload_dir, exist_ok=True)

    # Generate unique filename
    ext = avatar.filename.split(".")[-1] if "." in avatar.filename else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = f"{upload_dir}/{filename}"

    # Save file locally
    with open(filepath, "wb") as f:
        f.write(contents)

    # Update user's avatar_url
    avatar_url = f"/uploads/avatars/{current_user.id}/{filename}"
    current_user.avatar_url = avatar_url
    await db.commit()
    await db.refresh(current_user)

    return UserResponse.model_validate(current_user)


@router.post("/logout", response_model=MessageResponse)
async def logout(response: Response, current_user: User = Depends(get_current_user)):
    """Logout user and clear authentication cookies"""
    # SECURITY FIX: Clear HTTP-only cookies on logout
    clear_auth_cookies(response)
    # In a production app, you might want to blacklist the token in a database
    return MessageResponse(message="Logged out successfully")


@router.delete("/delete-account", response_model=MessageResponse)
async def delete_account(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Permanently delete user account and all associated data.
    This action cannot be undone.
    """
    # Delete user's cart
    from app.models.cart import CartItem
    await db.execute(
        CartItem.__table__.delete().where(
            CartItem.cart_id.in_(
                select(Cart.id).where(Cart.user_id == current_user.id)
            )
        )
    )
    await db.execute(Cart.__table__.delete().where(Cart.user_id == current_user.id))

    # Delete user's wishlist items
    from app.models.wishlist import Wishlist
    await db.execute(Wishlist.__table__.delete().where(Wishlist.user_id == current_user.id))

    # Delete user's reviews
    from app.models.review import Review
    await db.execute(Review.__table__.delete().where(Review.user_id == current_user.id))

    # Delete user's addresses
    from app.models.address import Address
    await db.execute(Address.__table__.delete().where(Address.user_id == current_user.id))

    # Delete user's notifications
    from app.models.notification import Notification
    await db.execute(Notification.__table__.delete().where(Notification.user_id == current_user.id))

    # Note: Orders are kept for record-keeping but anonymized
    from app.models.order import Order
    await db.execute(
        Order.__table__.update()
        .where(Order.user_id == current_user.id)
        .values(
            shipping_first_name="[Deleted]",
            shipping_last_name="User",
            shipping_email="deleted@example.com",
            shipping_phone=None
        )
    )

    # If user is a vendor, handle vendor data
    from app.models.vendor import Vendor
    result = await db.execute(select(Vendor).where(Vendor.user_id == current_user.id))
    vendor = result.scalar_one_or_none()
    if vendor:
        # Mark products as inactive instead of deleting
        from app.models.product import Product
        await db.execute(
            Product.__table__.update()
            .where(Product.vendor_id == vendor.id)
            .values(status="deleted")
        )
        # Delete vendor profile
        await db.delete(vendor)

    # Finally, delete the user
    await db.delete(current_user)
    await db.commit()

    return MessageResponse(message="Your account has been permanently deleted")


@router.get("/csrf-token")
async def get_csrf_token(request: Request):
    """
    Get CSRF token for authenticated users.
    The CSRF token is already set as a cookie on login, but this endpoint
    allows clients to retrieve it if needed (e.g., after page refresh).
    """
    csrf_token = request.cookies.get("csrf_token")
    if not csrf_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No CSRF token found. Please login first."
        )
    return {"csrf_token": csrf_token}


# ---------------------------------------------------------------------------
# Background task helpers
# ---------------------------------------------------------------------------

async def _send_welcome_background(user_id, email: str, first_name: str):
    """Run welcome notification + email in a background task with its own DB session."""
    from app.core.database import AsyncSessionLocal as async_session_factory
    from app.services.notifications import notify_welcome

    async with async_session_factory() as db:
        try:
            await notify_welcome(db, user_id, email, first_name)
            await db.commit()
        except Exception as exc:
            import logging
            logging.getLogger(__name__).error("Welcome email background task failed: %s", exc)
