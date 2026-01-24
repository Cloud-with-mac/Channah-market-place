from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from app.schemas.common import BaseSchema


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = None

    @validator('password')
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain an uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain a lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain a digit')
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = None
    avatar_url: Optional[str] = None


class UserResponse(BaseSchema):
    id: UUID
    email: str
    first_name: str
    last_name: str
    phone: Optional[str]
    avatar_url: Optional[str]
    role: str
    is_active: bool
    is_verified: bool
    is_vendor: bool = False
    vendor_id: Optional[UUID] = None
    vendor_slug: Optional[str] = None
    created_at: datetime
    last_login: Optional[datetime]

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    @classmethod
    def model_validate(cls, obj, **kwargs):
        # Check if user has a vendor relationship
        is_vendor = False
        vendor_id = None
        vendor_slug = None

        # Safely try to access vendor relationship
        # This handles cases where the relationship is lazy-loaded
        try:
            vendor = getattr(obj, 'vendor', None)
            if vendor is not None:
                # User has a vendor profile
                # Only consider them a vendor if their application is approved
                vendor_status = getattr(vendor, 'status', None)
                if vendor_status == 'approved':
                    is_vendor = True
                    vendor_id = getattr(vendor, 'id', None)
                    vendor_slug = getattr(vendor, 'slug', None)
        except Exception:
            # If we can't access the vendor relationship, just skip it
            pass

        # Create the base response
        data = {
            'id': obj.id,
            'email': obj.email,
            'first_name': obj.first_name,
            'last_name': obj.last_name,
            'phone': obj.phone,
            'avatar_url': obj.avatar_url,
            'role': obj.role.value if hasattr(obj.role, 'value') else obj.role,
            'is_active': obj.is_active,
            'is_verified': obj.is_verified,
            'is_vendor': is_vendor,
            'vendor_id': vendor_id,
            'vendor_slug': vendor_slug,
            'created_at': obj.created_at,
            'last_login': obj.last_login,
        }

        return cls(**data)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


class PasswordReset(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    password: str = Field(..., min_length=8)


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class OAuthCallback(BaseModel):
    code: str
    state: Optional[str] = None
