from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID
from app.schemas.common import BaseSchema


class AddressCreate(BaseModel):
    label: Optional[str] = Field(None, max_length=100)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = None
    address_line1: str = Field(..., min_length=1, max_length=255)
    address_line2: Optional[str] = Field(None, max_length=255)
    city: str = Field(..., min_length=1, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    postal_code: str = Field(..., min_length=1, max_length=20)
    country: str = Field(..., min_length=1, max_length=100)
    is_default_shipping: bool = False
    is_default_billing: bool = False


class AddressUpdate(BaseModel):
    label: Optional[str] = Field(None, max_length=100)
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = None
    address_line1: Optional[str] = Field(None, min_length=1, max_length=255)
    address_line2: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, min_length=1, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    postal_code: Optional[str] = Field(None, min_length=1, max_length=20)
    country: Optional[str] = Field(None, min_length=1, max_length=100)
    is_default_shipping: Optional[bool] = None
    is_default_billing: Optional[bool] = None


class AddressResponse(BaseSchema):
    id: UUID
    user_id: UUID
    label: Optional[str]
    first_name: str
    last_name: str
    phone: Optional[str]
    address_line1: str
    address_line2: Optional[str]
    city: str
    state: Optional[str]
    postal_code: str
    country: str
    is_default_shipping: bool
    is_default_billing: bool
    created_at: datetime
    updated_at: datetime

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"

    @property
    def full_address(self) -> str:
        parts = [self.address_line1]
        if self.address_line2:
            parts.append(self.address_line2)
        parts.append(f"{self.city}, {self.state or ''} {self.postal_code}".strip())
        parts.append(self.country)
        return ", ".join(parts)
