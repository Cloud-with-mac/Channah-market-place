from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.address import Address
from app.schemas.address import AddressCreate, AddressUpdate, AddressResponse
from app.schemas.common import MessageResponse

router = APIRouter()


@router.get("/", response_model=List[AddressResponse])
async def get_addresses(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all addresses for current user"""
    result = await db.execute(
        select(Address)
        .where(Address.user_id == current_user.id)
        .order_by(Address.is_default_shipping.desc(), Address.created_at.desc())
    )
    addresses = result.scalars().all()

    return [AddressResponse.model_validate(a) for a in addresses]


@router.get("/{address_id}", response_model=AddressResponse)
async def get_address(
    address_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get address by ID"""
    result = await db.execute(
        select(Address).where(Address.id == address_id, Address.user_id == current_user.id)
    )
    address = result.scalar_one_or_none()

    if not address:
        raise HTTPException(status_code=404, detail="Address not found")

    return AddressResponse.model_validate(address)


@router.post("/", response_model=AddressResponse, status_code=status.HTTP_201_CREATED)
async def create_address(
    address_data: AddressCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new address"""
    # If this is set as default, unset other defaults
    if address_data.is_default_shipping:
        await db.execute(
            Address.__table__.update()
            .where(Address.user_id == current_user.id)
            .values(is_default_shipping=False)
        )
    if address_data.is_default_billing:
        await db.execute(
            Address.__table__.update()
            .where(Address.user_id == current_user.id)
            .values(is_default_billing=False)
        )

    address = Address(
        user_id=current_user.id,
        label=address_data.label,
        first_name=address_data.first_name,
        last_name=address_data.last_name,
        phone=address_data.phone,
        address_line1=address_data.address_line1,
        address_line2=address_data.address_line2,
        city=address_data.city,
        state=address_data.state,
        postal_code=address_data.postal_code,
        country=address_data.country,
        is_default_shipping=address_data.is_default_shipping,
        is_default_billing=address_data.is_default_billing
    )
    db.add(address)
    await db.commit()
    await db.refresh(address)

    return AddressResponse.model_validate(address)


@router.put("/{address_id}", response_model=AddressResponse)
async def update_address(
    address_id: UUID,
    address_data: AddressUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update an address"""
    result = await db.execute(
        select(Address).where(Address.id == address_id, Address.user_id == current_user.id)
    )
    address = result.scalar_one_or_none()

    if not address:
        raise HTTPException(status_code=404, detail="Address not found")

    update_data = address_data.model_dump(exclude_unset=True)

    # If setting as default, unset other defaults
    if update_data.get("is_default_shipping"):
        await db.execute(
            Address.__table__.update()
            .where(Address.user_id == current_user.id, Address.id != address_id)
            .values(is_default_shipping=False)
        )
    if update_data.get("is_default_billing"):
        await db.execute(
            Address.__table__.update()
            .where(Address.user_id == current_user.id, Address.id != address_id)
            .values(is_default_billing=False)
        )

    for field, value in update_data.items():
        setattr(address, field, value)

    await db.commit()
    await db.refresh(address)

    return AddressResponse.model_validate(address)


@router.delete("/{address_id}", response_model=MessageResponse)
async def delete_address(
    address_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete an address"""
    result = await db.execute(
        select(Address).where(Address.id == address_id, Address.user_id == current_user.id)
    )
    address = result.scalar_one_or_none()

    if not address:
        raise HTTPException(status_code=404, detail="Address not found")

    await db.delete(address)
    await db.commit()

    return MessageResponse(message="Address deleted successfully")


@router.put("/{address_id}/default-shipping", response_model=AddressResponse)
async def set_default_shipping(
    address_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Set address as default shipping"""
    result = await db.execute(
        select(Address).where(Address.id == address_id, Address.user_id == current_user.id)
    )
    address = result.scalar_one_or_none()

    if not address:
        raise HTTPException(status_code=404, detail="Address not found")

    # Unset other defaults
    await db.execute(
        Address.__table__.update()
        .where(Address.user_id == current_user.id)
        .values(is_default_shipping=False)
    )

    address.is_default_shipping = True
    await db.commit()
    await db.refresh(address)

    return AddressResponse.model_validate(address)


@router.put("/{address_id}/default-billing", response_model=AddressResponse)
async def set_default_billing(
    address_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Set address as default billing"""
    result = await db.execute(
        select(Address).where(Address.id == address_id, Address.user_id == current_user.id)
    )
    address = result.scalar_one_or_none()

    if not address:
        raise HTTPException(status_code=404, detail="Address not found")

    # Unset other defaults
    await db.execute(
        Address.__table__.update()
        .where(Address.user_id == current_user.id)
        .values(is_default_billing=False)
    )

    address.is_default_billing = True
    await db.commit()
    await db.refresh(address)

    return AddressResponse.model_validate(address)
