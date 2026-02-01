from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import Optional
from uuid import UUID, uuid4

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.cart import Cart, CartItem
from app.models.product import Product, ProductVariant, ProductStatus
from app.schemas.cart import (
    CartItemCreate, CartItemUpdate, CartResponse, CartItemResponse,
    ApplyCouponRequest, CartItemProductResponse
)
from app.schemas.common import MessageResponse

router = APIRouter()


async def get_or_create_cart(
    user: Optional[User],
    session_id: Optional[str],
    db: AsyncSession
) -> Cart:
    """Get existing cart or create a new one"""
    cart = None

    if user:
        result = await db.execute(
            select(Cart)
            .where(Cart.user_id == user.id)
            .options(selectinload(Cart.items).selectinload(CartItem.product).selectinload(Product.images),
            selectinload(Cart.items).selectinload(CartItem.product).selectinload(Product.vendor))
        )
        cart = result.scalar_one_or_none()

        if not cart:
            cart = Cart(user_id=user.id)
            db.add(cart)
            await db.flush()
    elif session_id:
        result = await db.execute(
            select(Cart)
            .where(Cart.session_id == session_id)
            .options(selectinload(Cart.items).selectinload(CartItem.product).selectinload(Product.images),
            selectinload(Cart.items).selectinload(CartItem.product).selectinload(Product.vendor))
        )
        cart = result.scalar_one_or_none()

        if not cart:
            cart = Cart(session_id=session_id)
            db.add(cart)
            await db.flush()

    return cart


def serialize_cart(cart: Cart) -> CartResponse:
    """Serialize cart to response"""
    items = []
    for item in cart.items:
        product = item.product
        items.append(CartItemResponse(
            id=item.id,
            product_id=item.product_id,
            variant_id=item.variant_id,
            quantity=item.quantity,
            price=item.price,
            total=item.price * item.quantity,
            custom_options=None,
            product=CartItemProductResponse(
                id=product.id,
                name=product.name,
                slug=product.slug,
                price=product.price,
                primary_image=product.images[0].url if product.images and len(product.images) > 0 else None,
                quantity=product.quantity,
                vendor_name=product.vendor.business_name if product.vendor else "Unknown",
                shipping_cost=product.shipping_cost or 0
            ),
            variant_name=None,
            created_at=item.created_at
        ))

    subtotal = sum(item.price * item.quantity for item in cart.items)

    return CartResponse(
        id=cart.id,
        user_id=cart.user_id,
        session_id=cart.session_id,
        items=items,
        item_count=sum(item.quantity for item in cart.items),
        subtotal=subtotal,
        discount_amount=cart.discount_amount,
        total=max(subtotal - cart.discount_amount, 0),
        coupon_code=cart.coupon_code,
        updated_at=cart.updated_at
    )


@router.get("/", response_model=CartResponse)
async def get_cart(
    request: Request,
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current cart"""
    session_id = request.cookies.get("cart_session")

    cart = await get_or_create_cart(current_user, session_id, db)
    await db.commit()

    if not cart:
        raise HTTPException(status_code=400, detail="Could not get or create cart")

    return serialize_cart(cart)


@router.post("/items", response_model=CartResponse)
async def add_to_cart(
    item_data: CartItemCreate,
    request: Request,
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Add item to cart"""
    session_id = request.cookies.get("cart_session") or str(uuid4())

    cart = await get_or_create_cart(current_user, session_id, db)

    if not cart:
        raise HTTPException(status_code=400, detail="Could not get or create cart")

    # Check product exists and is active
    result = await db.execute(
        select(Product)
        .where(Product.id == item_data.product_id, Product.status == ProductStatus.ACTIVE)
        .options(selectinload(Product.images), selectinload(Product.vendor))
    )
    product = result.scalar_one_or_none()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Check stock
    if product.track_inventory and product.quantity < item_data.quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock")

    # Check for existing cart item
    existing_result = await db.execute(
        select(CartItem).where(
            CartItem.cart_id == cart.id,
            CartItem.product_id == item_data.product_id,
            CartItem.variant_id == item_data.variant_id if item_data.variant_id else CartItem.variant_id.is_(None)
        )
    )
    existing_item = existing_result.scalar_one_or_none()

    if existing_item:
        # Update quantity
        new_quantity = existing_item.quantity + item_data.quantity
        if product.track_inventory and product.quantity < new_quantity:
            raise HTTPException(status_code=400, detail="Insufficient stock")
        existing_item.quantity = new_quantity
    else:
        # Add new item
        price = product.price
        if item_data.variant_id:
            variant_result = await db.execute(
                select(ProductVariant).where(ProductVariant.id == item_data.variant_id)
            )
            variant = variant_result.scalar_one_or_none()
            if variant:
                price = variant.price

        cart_item = CartItem(
            cart_id=cart.id,
            product_id=item_data.product_id,
            variant_id=item_data.variant_id,
            quantity=item_data.quantity,
            price=price
        )
        db.add(cart_item)

    await db.commit()

    # Reload cart
    result = await db.execute(
        select(Cart)
        .where(Cart.id == cart.id)
        .options(selectinload(Cart.items).selectinload(CartItem.product).selectinload(Product.images),
            selectinload(Cart.items).selectinload(CartItem.product).selectinload(Product.vendor))
    )
    cart = result.scalar_one()

    return serialize_cart(cart)


@router.put("/items/{item_id}", response_model=CartResponse)
async def update_cart_item(
    item_id: UUID,
    item_data: CartItemUpdate,
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update cart item quantity"""
    result = await db.execute(
        select(CartItem)
        .where(CartItem.id == item_id)
        .options(selectinload(CartItem.product))
    )
    cart_item = result.scalar_one_or_none()

    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    # Verify ownership
    cart_result = await db.execute(select(Cart).where(Cart.id == cart_item.cart_id))
    cart = cart_result.scalar_one()

    if current_user and cart.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Check stock
    if cart_item.product.track_inventory and cart_item.product.quantity < item_data.quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock")

    cart_item.quantity = item_data.quantity
    await db.commit()

    # Reload cart
    result = await db.execute(
        select(Cart)
        .where(Cart.id == cart.id)
        .options(selectinload(Cart.items).selectinload(CartItem.product).selectinload(Product.images),
            selectinload(Cart.items).selectinload(CartItem.product).selectinload(Product.vendor))
    )
    cart = result.scalar_one()

    return serialize_cart(cart)


@router.delete("/items/{item_id}", response_model=CartResponse)
async def remove_from_cart(
    item_id: UUID,
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Remove item from cart"""
    result = await db.execute(select(CartItem).where(CartItem.id == item_id))
    cart_item = result.scalar_one_or_none()

    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    cart_id = cart_item.cart_id

    # Verify ownership
    cart_result = await db.execute(select(Cart).where(Cart.id == cart_id))
    cart = cart_result.scalar_one()

    if current_user and cart.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    await db.delete(cart_item)
    await db.commit()

    # Reload cart
    result = await db.execute(
        select(Cart)
        .where(Cart.id == cart_id)
        .options(selectinload(Cart.items).selectinload(CartItem.product).selectinload(Product.images),
            selectinload(Cart.items).selectinload(CartItem.product).selectinload(Product.vendor))
    )
    cart = result.scalar_one()

    return serialize_cart(cart)


@router.delete("/", response_model=MessageResponse)
async def clear_cart(
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Clear all items from cart"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")

    result = await db.execute(
        select(Cart).where(Cart.user_id == current_user.id)
    )
    cart = result.scalar_one_or_none()

    if cart:
        # Delete all items
        await db.execute(
            CartItem.__table__.delete().where(CartItem.cart_id == cart.id)
        )
        cart.coupon_code = None
        cart.discount_amount = 0
        await db.commit()

    return MessageResponse(message="Cart cleared successfully")


@router.post("/coupon", response_model=CartResponse)
async def apply_coupon(
    coupon_data: ApplyCouponRequest,
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Apply coupon to cart"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")

    result = await db.execute(
        select(Cart)
        .where(Cart.user_id == current_user.id)
        .options(selectinload(Cart.items).selectinload(CartItem.product).selectinload(Product.images),
            selectinload(Cart.items).selectinload(CartItem.product).selectinload(Product.vendor))
    )
    cart = result.scalar_one_or_none()

    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")

    # TODO: Validate coupon code against coupons table
    # For now, apply a simple discount
    if coupon_data.coupon_code.upper() == "SAVE10":
        subtotal = sum(item.price * item.quantity for item in cart.items)
        cart.coupon_code = coupon_data.coupon_code.upper()
        cart.discount_amount = subtotal * 0.10
        await db.commit()
        await db.refresh(cart)
    else:
        raise HTTPException(status_code=400, detail="Invalid coupon code")

    return serialize_cart(cart)


@router.delete("/coupon", response_model=CartResponse)
async def remove_coupon(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Remove coupon from cart"""
    result = await db.execute(
        select(Cart)
        .where(Cart.user_id == current_user.id)
        .options(selectinload(Cart.items).selectinload(CartItem.product).selectinload(Product.images),
            selectinload(Cart.items).selectinload(CartItem.product).selectinload(Product.vendor))
    )
    cart = result.scalar_one_or_none()

    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")

    cart.coupon_code = None
    cart.discount_amount = 0
    await db.commit()
    await db.refresh(cart)

    return serialize_cart(cart)


@router.post("/merge", response_model=CartResponse)
async def merge_cart(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Merge guest cart with user cart after login"""
    # Get guest cart
    guest_result = await db.execute(
        select(Cart)
        .where(Cart.session_id == session_id)
        .options(selectinload(Cart.items))
    )
    guest_cart = guest_result.scalar_one_or_none()

    if not guest_cart:
        # No guest cart to merge, just return user cart
        user_result = await db.execute(
            select(Cart)
            .where(Cart.user_id == current_user.id)
            .options(selectinload(Cart.items).selectinload(CartItem.product).selectinload(Product.images),
            selectinload(Cart.items).selectinload(CartItem.product).selectinload(Product.vendor))
        )
        user_cart = user_result.scalar_one_or_none()
        if user_cart:
            return serialize_cart(user_cart)
        raise HTTPException(status_code=404, detail="No cart found")

    # Get or create user cart
    user_result = await db.execute(
        select(Cart)
        .where(Cart.user_id == current_user.id)
        .options(selectinload(Cart.items))
    )
    user_cart = user_result.scalar_one_or_none()

    if not user_cart:
        # Transfer guest cart to user
        guest_cart.user_id = current_user.id
        guest_cart.session_id = None
        await db.commit()
        await db.refresh(guest_cart)
        return serialize_cart(guest_cart)

    # Merge items
    for guest_item in guest_cart.items:
        existing = None
        for user_item in user_cart.items:
            if user_item.product_id == guest_item.product_id and user_item.variant_id == guest_item.variant_id:
                existing = user_item
                break

        if existing:
            existing.quantity += guest_item.quantity
        else:
            new_item = CartItem(
                cart_id=user_cart.id,
                product_id=guest_item.product_id,
                variant_id=guest_item.variant_id,
                quantity=guest_item.quantity,
                price=guest_item.price
            )
            db.add(new_item)

    # Delete guest cart
    await db.delete(guest_cart)
    await db.commit()

    # Reload user cart
    result = await db.execute(
        select(Cart)
        .where(Cart.id == user_cart.id)
        .options(selectinload(Cart.items).selectinload(CartItem.product).selectinload(Product.images),
            selectinload(Cart.items).selectinload(CartItem.product).selectinload(Product.vendor))
    )
    user_cart = result.scalar_one()

    return serialize_cart(user_cart)
