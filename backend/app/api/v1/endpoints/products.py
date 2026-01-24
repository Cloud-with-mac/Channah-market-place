from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_
from sqlalchemy.orm import selectinload
from typing import List, Optional
from uuid import UUID
from decimal import Decimal
from slugify import slugify
import json

from app.core.database import get_db
from app.core.security import get_current_user, get_current_vendor, get_approved_vendor, get_current_admin
from app.models.user import User
from app.models.vendor import Vendor, VendorStatus
from app.models.product import Product, ProductImage, ProductVariant, ProductAttribute, ProductStatus
from app.models.category import Category
from app.schemas.product import (
    ProductCreate, ProductUpdate, ProductResponse, ProductListResponse,
    ProductSearchQuery, ProductImageCreate, ProductVariantCreate,
    CategoryFiltersResponse, FilterSection, FilterOptionItem, VendorFilterOption
)
from app.schemas.common import MessageResponse, PaginatedResponse

router = APIRouter()


@router.get("/", response_model=List[ProductListResponse])
async def list_products(
    skip: int = 0,
    limit: int = 20,
    category: Optional[str] = None,
    category_id: Optional[UUID] = None,
    vendor_id: Optional[UUID] = None,
    min_price: Optional[Decimal] = None,
    max_price: Optional[Decimal] = None,
    in_stock: Optional[bool] = None,
    on_sale: Optional[bool] = None,
    featured: Optional[bool] = None,
    min_rating: Optional[float] = None,
    brands: Optional[str] = None,  # Comma-separated brand names
    sizes: Optional[str] = None,  # Comma-separated sizes
    colors: Optional[str] = None,  # Comma-separated colors
    sellers: Optional[str] = None,  # Comma-separated vendor IDs
    attributes: Optional[str] = None,  # JSON string of {attr_name: [values]}
    sort_by: str = "created_at",
    sort_order: str = "desc",
    db: AsyncSession = Depends(get_db)
):
    """List products with filters"""
    import json

    query = select(Product).where(Product.status == ProductStatus.ACTIVE)

    # Filter by category slug (joins with Category table)
    if category:
        # Get category and its subcategories
        cat_result = await db.execute(
            select(Category).where(Category.slug == category)
        )
        cat = cat_result.scalar_one_or_none()
        if cat:
            # Include subcategories in the filter
            sub_result = await db.execute(
                select(Category.id).where(Category.parent_id == cat.id)
            )
            category_ids = [cat.id] + [row[0] for row in sub_result.all()]
            query = query.where(Product.category_id.in_(category_ids))
    elif category_id:
        query = query.where(Product.category_id == category_id)

    if vendor_id:
        query = query.where(Product.vendor_id == vendor_id)
    if min_price:
        query = query.where(Product.price >= min_price)
    if max_price:
        query = query.where(Product.price <= max_price)
    if in_stock:
        query = query.where(Product.quantity > 0)
    if on_sale:
        query = query.where(
            Product.compare_at_price.isnot(None),
            Product.compare_at_price > Product.price
        )
    if featured:
        query = query.where(Product.is_featured == True)
    if min_rating:
        query = query.where(Product.rating >= min_rating)

    # Filter by sellers (vendor IDs)
    if sellers:
        seller_ids = [UUID(s.strip()) for s in sellers.split(",") if s.strip()]
        if seller_ids:
            query = query.where(Product.vendor_id.in_(seller_ids))

    # Get products first, then filter by attributes
    query = query.options(
        selectinload(Product.images),
        selectinload(Product.vendor),
        selectinload(Product.category),
        selectinload(Product.attributes)
    )

    # Sorting
    sort_column = getattr(Product, sort_by, Product.created_at)
    if sort_order == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())

    result = await db.execute(query)
    products = result.scalars().all()

    # Filter by attributes (Brand, Size, Color, etc.)
    filtered_products = products

    # Parse attribute filters
    brand_list = [b.strip() for b in brands.split(",")] if brands else []
    size_list = [s.strip() for s in sizes.split(",")] if sizes else []
    color_list = [c.strip() for c in colors.split(",")] if colors else []

    # Parse additional attributes JSON
    attr_filters = {}
    if attributes:
        try:
            attr_filters = json.loads(attributes)
        except json.JSONDecodeError:
            pass

    # Add specific filters to attr_filters
    if brand_list:
        attr_filters["Brand"] = brand_list
    if size_list:
        attr_filters["Size"] = size_list
    if color_list:
        attr_filters["Color"] = color_list

    # Apply attribute filters
    if attr_filters:
        def matches_attributes(product, filters):
            product_attrs = {attr.name: attr.value for attr in product.attributes}
            for attr_name, values in filters.items():
                if attr_name in product_attrs:
                    if product_attrs[attr_name] not in values:
                        return False
                else:
                    # Product doesn't have this attribute, exclude it
                    return False
            return True

        filtered_products = [p for p in products if matches_attributes(p, attr_filters)]

    # Apply pagination after filtering
    total_filtered = len(filtered_products)
    filtered_products = filtered_products[skip:skip + limit]

    return [
        ProductListResponse(
            id=p.id,
            name=p.name,
            slug=p.slug,
            price=p.price,
            compare_at_price=p.compare_at_price,
            currency=p.currency,
            quantity=p.quantity,
            status=p.status.value,
            rating=p.rating,
            review_count=p.review_count,
            primary_image=p.images[0].url if p.images else None,
            vendor_name=p.vendor.business_name if p.vendor else None,
            category_name=p.category.name if p.category else None
        )
        for p in filtered_products
    ]


@router.get("/featured", response_model=List[ProductListResponse])
async def get_featured_products(
    limit: int = 12,
    db: AsyncSession = Depends(get_db)
):
    """Get featured products"""
    result = await db.execute(
        select(Product)
        .where(Product.status == ProductStatus.ACTIVE, Product.is_featured == True)
        .options(selectinload(Product.images), selectinload(Product.vendor))
        .order_by(Product.sales_count.desc())
        .limit(limit)
    )
    products = result.scalars().all()

    return [
        ProductListResponse(
            id=p.id,
            name=p.name,
            slug=p.slug,
            price=p.price,
            compare_at_price=p.compare_at_price,
            currency=p.currency,
            quantity=p.quantity,
            status=p.status.value,
            rating=p.rating,
            review_count=p.review_count,
            primary_image=p.images[0].url if p.images else None,
            vendor_name=p.vendor.business_name if p.vendor else None,
            category_name=None
        )
        for p in products
    ]


@router.get("/new-arrivals", response_model=List[ProductListResponse])
async def get_new_arrivals(
    limit: int = 12,
    db: AsyncSession = Depends(get_db)
):
    """Get new arrival products"""
    result = await db.execute(
        select(Product)
        .where(Product.status == ProductStatus.ACTIVE)
        .options(selectinload(Product.images), selectinload(Product.vendor))
        .order_by(Product.created_at.desc())
        .limit(limit)
    )
    products = result.scalars().all()

    return [
        ProductListResponse(
            id=p.id,
            name=p.name,
            slug=p.slug,
            price=p.price,
            compare_at_price=p.compare_at_price,
            currency=p.currency,
            quantity=p.quantity,
            status=p.status.value,
            rating=p.rating,
            review_count=p.review_count,
            primary_image=p.images[0].url if p.images else None,
            vendor_name=p.vendor.business_name if p.vendor else None,
            category_name=None
        )
        for p in products
    ]


@router.get("/best-sellers", response_model=List[ProductListResponse])
async def get_best_sellers(
    limit: int = 12,
    db: AsyncSession = Depends(get_db)
):
    """Get best selling products"""
    result = await db.execute(
        select(Product)
        .where(Product.status == ProductStatus.ACTIVE)
        .options(selectinload(Product.images), selectinload(Product.vendor))
        .order_by(Product.sales_count.desc())
        .limit(limit)
    )
    products = result.scalars().all()

    return [
        ProductListResponse(
            id=p.id,
            name=p.name,
            slug=p.slug,
            price=p.price,
            compare_at_price=p.compare_at_price,
            currency=p.currency,
            quantity=p.quantity,
            status=p.status.value,
            rating=p.rating,
            review_count=p.review_count,
            primary_image=p.images[0].url if p.images else None,
            vendor_name=p.vendor.business_name if p.vendor else None,
            category_name=None
        )
        for p in products
    ]


@router.get("/filters/{category_slug}", response_model=CategoryFiltersResponse)
async def get_category_filters(
    category_slug: str,
    db: AsyncSession = Depends(get_db)
):
    """Get available filter options for a category"""
    from collections import defaultdict

    # Get category
    cat_result = await db.execute(
        select(Category).where(Category.slug == category_slug)
    )
    category = cat_result.scalar_one_or_none()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )

    # Get all subcategory IDs (including this category)
    category_ids = [category.id]
    sub_result = await db.execute(
        select(Category.id).where(Category.parent_id == category.id)
    )
    category_ids.extend([row[0] for row in sub_result.all()])

    # Get all active products in this category tree
    products_query = (
        select(Product)
        .where(
            Product.status == ProductStatus.ACTIVE,
            Product.category_id.in_(category_ids)
        )
        .options(
            selectinload(Product.attributes),
            selectinload(Product.vendor)
        )
    )
    result = await db.execute(products_query)
    products = result.scalars().all()

    # Calculate filter options
    price_min = Decimal("0")
    price_max = Decimal("0")
    attribute_values = defaultdict(lambda: defaultdict(int))  # {attr_name: {value: count}}
    vendor_counts = defaultdict(lambda: {"name": "", "rating": 0.0, "count": 0})
    rating_counts = {5: 0, 4: 0, 3: 0, 2: 0, 1: 0}
    has_on_sale = False
    in_stock_count = 0

    for product in products:
        # Price range
        if price_min == 0 or product.price < price_min:
            price_min = product.price
        if product.price > price_max:
            price_max = product.price

        # On sale check
        if product.compare_at_price and product.compare_at_price > product.price:
            has_on_sale = True

        # In stock count
        if product.quantity > 0:
            in_stock_count += 1

        # Rating distribution
        product_rating = int(product.rating) if product.rating else 0
        if product_rating >= 1:
            rating_counts[min(product_rating, 5)] += 1

        # Vendor/Seller
        if product.vendor:
            vendor_id = str(product.vendor.id)
            vendor_counts[vendor_id]["name"] = product.vendor.business_name
            vendor_counts[vendor_id]["rating"] = product.vendor.rating or 0.0
            vendor_counts[vendor_id]["count"] += 1

        # Attribute values (Size, Color, Material, Brand, etc.)
        for attr in product.attributes:
            if attr.is_visible:
                attribute_values[attr.name][attr.value] += 1

    # Build attribute filter sections
    attribute_filters = []

    # Define common attribute types and their display order
    common_attrs = ["Brand", "Size", "Color", "Material", "Style", "Pattern", "Fit", "Gender"]

    for attr_name in common_attrs:
        if attr_name in attribute_values:
            values = attribute_values[attr_name]
            options = [
                FilterOptionItem(value=val, label=val, count=count)
                for val, count in sorted(values.items(), key=lambda x: (-x[1], x[0]))
            ]
            if options:
                attribute_filters.append(FilterSection(
                    key=attr_name.lower().replace(" ", "_"),
                    label=attr_name,
                    type="checkbox",
                    options=options[:20]  # Limit to top 20 options
                ))

    # Add any other attributes not in common list
    for attr_name, values in attribute_values.items():
        if attr_name not in common_attrs:
            options = [
                FilterOptionItem(value=val, label=val, count=count)
                for val, count in sorted(values.items(), key=lambda x: (-x[1], x[0]))
            ]
            if options and len(options) <= 30:  # Only show if reasonable number of options
                attribute_filters.append(FilterSection(
                    key=attr_name.lower().replace(" ", "_"),
                    label=attr_name,
                    type="checkbox",
                    options=options[:20]
                ))

    # Build vendor filter options
    vendors = [
        VendorFilterOption(
            id=UUID(vid),
            name=data["name"],
            rating=data["rating"],
            count=data["count"]
        )
        for vid, data in sorted(vendor_counts.items(), key=lambda x: -x[1]["count"])
    ][:15]  # Limit to top 15 vendors

    return CategoryFiltersResponse(
        category_id=category.id,
        category_name=category.name,
        price_min=price_min if price_min > 0 else Decimal("0"),
        price_max=price_max if price_max > 0 else Decimal("10000"),
        attribute_filters=attribute_filters,
        vendors=vendors,
        rating_counts=rating_counts,
        has_on_sale=has_on_sale,
        has_free_shipping=False,  # Could be computed based on shipping settings
        in_stock_count=in_stock_count,
        total_count=len(products)
    )


@router.get("/{slug_or_id}", response_model=ProductResponse)
async def get_product(
    slug_or_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get product by slug or ID"""
    # Try to parse as UUID first (for vendor dashboard)
    product = None
    is_uuid_lookup = False

    try:
        product_id = UUID(slug_or_id)
        is_uuid_lookup = True
        result = await db.execute(
            select(Product)
            .where(Product.id == product_id)
            .options(
                selectinload(Product.images),
                selectinload(Product.variants),
                selectinload(Product.attributes),
                selectinload(Product.vendor),
                selectinload(Product.category)
            )
        )
        product = result.scalar_one_or_none()
    except (ValueError, AttributeError):
        pass

    # If not found by UUID or not a valid UUID, search by slug
    if not product:
        result = await db.execute(
            select(Product)
            .where(Product.slug == slug_or_id, Product.status == ProductStatus.ACTIVE)
            .options(
                selectinload(Product.images),
                selectinload(Product.variants),
                selectinload(Product.attributes),
                selectinload(Product.vendor),
                selectinload(Product.category)
            )
        )
        product = result.scalar_one_or_none()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    # Increment view count only for public slug-based access
    if not is_uuid_lookup:
        product.view_count += 1
        await db.commit()

    return ProductResponse.model_validate(product)


# Vendor endpoints

@router.get("/vendor/my-products", response_model=List[ProductListResponse])
async def get_my_products(
    skip: int = 0,
    limit: int = 20,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_vendor),
    db: AsyncSession = Depends(get_db)
):
    """Get current vendor's products"""
    vendor_result = await db.execute(select(Vendor).where(Vendor.user_id == current_user.id))
    vendor = vendor_result.scalar_one_or_none()

    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")

    query = select(Product).where(Product.vendor_id == vendor.id)

    if status:
        query = query.where(Product.status == status)

    query = query.options(
        selectinload(Product.images)
    ).order_by(Product.created_at.desc()).offset(skip).limit(limit)

    result = await db.execute(query)
    products = result.scalars().all()

    return [
        ProductListResponse(
            id=p.id,
            name=p.name,
            slug=p.slug,
            price=p.price,
            compare_at_price=p.compare_at_price,
            currency=p.currency,
            quantity=p.quantity,
            status=p.status.value,
            rating=p.rating,
            review_count=p.review_count,
            primary_image=p.images[0].url if p.images else None,
            vendor_name=vendor.business_name,
            category_name=None
        )
        for p in products
    ]


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    product_data: ProductCreate,
    current_user: User = Depends(get_approved_vendor),
    db: AsyncSession = Depends(get_db)
):
    """Create a new product (requires approved vendor status)"""
    vendor_result = await db.execute(select(Vendor).where(Vendor.user_id == current_user.id))
    vendor = vendor_result.scalar_one_or_none()

    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")

    if vendor.status != VendorStatus.APPROVED:
        raise HTTPException(status_code=403, detail="Vendor not approved")

    # Generate unique slug
    base_slug = slugify(product_data.name)
    slug = base_slug
    counter = 1
    while True:
        result = await db.execute(select(Product).where(Product.slug == slug))
        if not result.scalar_one_or_none():
            break
        slug = f"{base_slug}-{counter}"
        counter += 1

    # Create product
    product = Product(
        vendor_id=vendor.id,
        category_id=product_data.category_id,
        name=product_data.name,
        slug=slug,
        description=product_data.description,
        short_description=product_data.short_description,
        sku=product_data.sku,
        barcode=product_data.barcode,
        price=product_data.price,
        compare_at_price=product_data.compare_at_price,
        cost_price=product_data.cost_price,
        quantity=product_data.quantity,
        low_stock_threshold=product_data.low_stock_threshold,
        track_inventory=product_data.track_inventory,
        allow_backorder=product_data.allow_backorder,
        weight=product_data.weight,
        length=product_data.length,
        width=product_data.width,
        height=product_data.height,
        requires_shipping=product_data.requires_shipping,
        is_digital=product_data.is_digital,
        meta_title=product_data.meta_title,
        meta_description=product_data.meta_description,
        tags=product_data.tags,
        status=ProductStatus.PENDING if not vendor.auto_approve_products else ProductStatus.ACTIVE
    )
    db.add(product)
    await db.flush()

    # Add images
    if product_data.images:
        for i, img in enumerate(product_data.images):
            image = ProductImage(
                product_id=product.id,
                url=img.url,
                alt_text=img.alt_text,
                sort_order=i,
                is_primary=img.is_primary or i == 0
            )
            db.add(image)

    # Add variants
    if product_data.variants:
        for var in product_data.variants:
            variant = ProductVariant(
                product_id=product.id,
                name=var.name,
                sku=var.sku,
                price=var.price,
                compare_at_price=var.compare_at_price,
                quantity=var.quantity,
                options=json.dumps(var.options) if var.options else None,
                image_url=var.image_url
            )
            db.add(variant)

    # Add attributes
    if product_data.attributes:
        for attr in product_data.attributes:
            attribute = ProductAttribute(
                product_id=product.id,
                name=attr.name,
                value=attr.value,
                is_visible=attr.is_visible
            )
            db.add(attribute)

    await db.commit()
    await db.refresh(product)

    # Reload with relationships
    result = await db.execute(
        select(Product)
        .where(Product.id == product.id)
        .options(
            selectinload(Product.images),
            selectinload(Product.variants),
            selectinload(Product.attributes),
            selectinload(Product.vendor),
            selectinload(Product.category)
        )
    )
    product = result.scalar_one()

    return ProductResponse.model_validate(product)


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: UUID,
    product_data: ProductUpdate,
    current_user: User = Depends(get_approved_vendor),
    db: AsyncSession = Depends(get_db)
):
    """Update a product (requires approved vendor status)"""
    vendor_result = await db.execute(select(Vendor).where(Vendor.user_id == current_user.id))
    vendor = vendor_result.scalar_one_or_none()

    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")

    result = await db.execute(
        select(Product)
        .where(Product.id == product_id, Product.vendor_id == vendor.id)
        .options(
            selectinload(Product.images),
            selectinload(Product.variants),
            selectinload(Product.attributes),
            selectinload(Product.vendor),
            selectinload(Product.category)
        )
    )
    product = result.scalar_one_or_none()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Extract image_urls and variants before updating other fields
    image_urls = product_data.image_urls
    primary_image = product_data.primary_image
    variants = product_data.variants

    # Update basic product fields (exclude image and variant fields)
    update_data = product_data.model_dump(exclude_unset=True, exclude={'image_urls', 'primary_image', 'variants'})
    for field, value in update_data.items():
        setattr(product, field, value)

    # Handle image updates if image_urls provided
    if image_urls is not None:
        # Delete existing images
        for img in product.images:
            await db.delete(img)

        # Add new images
        for i, url in enumerate(image_urls):
            is_primary = (url == primary_image) if primary_image else (i == 0)
            image = ProductImage(
                product_id=product.id,
                url=url,
                sort_order=i,
                is_primary=is_primary
            )
            db.add(image)

    # Handle variant updates if variants provided
    if variants is not None:
        # Delete existing variants
        for var in product.variants:
            await db.delete(var)

        # Add new variants
        for var in variants:
            variant = ProductVariant(
                product_id=product.id,
                name=var.name,
                sku=var.sku,
                price=var.price,
                compare_at_price=var.compare_at_price,
                quantity=var.quantity,
                options=json.dumps(var.options) if var.options else None,
                image_url=var.image_url
            )
            db.add(variant)

    await db.commit()

    # Reload product with fresh data
    result = await db.execute(
        select(Product)
        .where(Product.id == product_id)
        .options(
            selectinload(Product.images),
            selectinload(Product.variants),
            selectinload(Product.attributes),
            selectinload(Product.vendor),
            selectinload(Product.category)
        )
    )
    product = result.scalar_one()

    return ProductResponse.model_validate(product)


@router.delete("/{product_id}", response_model=MessageResponse)
async def delete_product(
    product_id: UUID,
    current_user: User = Depends(get_approved_vendor),
    db: AsyncSession = Depends(get_db)
):
    """Delete a product (requires approved vendor status)"""
    vendor_result = await db.execute(select(Vendor).where(Vendor.user_id == current_user.id))
    vendor = vendor_result.scalar_one_or_none()

    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")

    result = await db.execute(
        select(Product).where(Product.id == product_id, Product.vendor_id == vendor.id)
    )
    product = result.scalar_one_or_none()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    await db.delete(product)
    await db.commit()

    return MessageResponse(message="Product deleted successfully")


@router.put("/{product_id}/images", response_model=ProductResponse)
async def update_product_images(
    product_id: UUID,
    images: List[ProductImageCreate],
    current_user: User = Depends(get_current_vendor),
    db: AsyncSession = Depends(get_db)
):
    """Update product images"""
    vendor_result = await db.execute(select(Vendor).where(Vendor.user_id == current_user.id))
    vendor = vendor_result.scalar_one_or_none()

    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")

    result = await db.execute(
        select(Product)
        .where(Product.id == product_id, Product.vendor_id == vendor.id)
        .options(selectinload(Product.images))
    )
    product = result.scalar_one_or_none()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Delete existing images
    for img in product.images:
        await db.delete(img)

    # Add new images
    for i, img in enumerate(images):
        image = ProductImage(
            product_id=product.id,
            url=img.url,
            alt_text=img.alt_text,
            sort_order=i,
            is_primary=img.is_primary or i == 0
        )
        db.add(image)

    await db.commit()
    await db.refresh(product)

    return ProductResponse.model_validate(product)


@router.put("/{product_id}/inventory", response_model=MessageResponse)
async def update_inventory(
    product_id: UUID,
    quantity: int,
    current_user: User = Depends(get_current_vendor),
    db: AsyncSession = Depends(get_db)
):
    """Update product inventory"""
    vendor_result = await db.execute(select(Vendor).where(Vendor.user_id == current_user.id))
    vendor = vendor_result.scalar_one_or_none()

    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")

    result = await db.execute(
        select(Product).where(Product.id == product_id, Product.vendor_id == vendor.id)
    )
    product = result.scalar_one_or_none()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product.quantity = quantity

    # Update status based on stock
    if quantity == 0 and product.status == ProductStatus.ACTIVE:
        product.status = ProductStatus.OUT_OF_STOCK
    elif quantity > 0 and product.status == ProductStatus.OUT_OF_STOCK:
        product.status = ProductStatus.ACTIVE

    await db.commit()

    return MessageResponse(message="Inventory updated successfully")
