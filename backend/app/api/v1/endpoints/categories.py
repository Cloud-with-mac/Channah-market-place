from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import List, Optional
from uuid import UUID
from slugify import slugify

from app.core.database import get_db
from app.core.security import get_current_admin
from app.models.user import User
from app.models.category import Category
from app.models.product import Product, ProductStatus
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse, CategoryTreeResponse, CategoryDetailResponse, CategoryChildResponse
from app.schemas.common import MessageResponse

router = APIRouter()


@router.get("/", response_model=List[CategoryResponse])
async def list_categories(
    parent_id: Optional[UUID] = None,
    active_only: bool = True,
    db: AsyncSession = Depends(get_db)
):
    """List categories"""
    query = select(Category)

    if parent_id:
        query = query.where(Category.parent_id == parent_id)
    else:
        query = query.where(Category.parent_id == None)

    if active_only:
        query = query.where(Category.is_active == True)

    query = query.order_by(Category.sort_order, Category.name)
    result = await db.execute(query)
    categories = result.scalars().all()

    return [CategoryResponse.model_validate(c) for c in categories]


@router.get("/tree", response_model=List[CategoryTreeResponse])
async def get_category_tree(
    db: AsyncSession = Depends(get_db)
):
    """Get full category tree with product counts"""
    # Get all categories
    result = await db.execute(
        select(Category)
        .where(Category.is_active == True)
        .order_by(Category.sort_order, Category.name)
    )
    all_categories = result.scalars().all()

    # Get product counts
    count_result = await db.execute(
        select(Product.category_id, func.count(Product.id))
        .where(Product.status == ProductStatus.ACTIVE)
        .group_by(Product.category_id)
    )
    product_counts = dict(count_result.all())

    # Build tree
    def build_tree(parent_id=None):
        children = []
        for cat in all_categories:
            if cat.parent_id == parent_id:
                child_tree = build_tree(cat.id)
                child_count = product_counts.get(cat.id, 0)
                # Add children's counts
                for child in child_tree:
                    child_count += child.product_count

                children.append(CategoryTreeResponse(
                    id=cat.id,
                    parent_id=cat.parent_id,
                    name=cat.name,
                    slug=cat.slug,
                    description=cat.description,
                    image_url=cat.image_url,
                    icon=cat.icon,
                    meta_title=cat.meta_title,
                    meta_description=cat.meta_description,
                    sort_order=cat.sort_order,
                    is_active=cat.is_active,
                    is_featured=cat.is_featured,
                    created_at=cat.created_at,
                    children=child_tree,
                    product_count=child_count
                ))
        return children

    return build_tree()


@router.get("/featured", response_model=List[CategoryResponse])
async def get_featured_categories(
    limit: int = 8,
    db: AsyncSession = Depends(get_db)
):
    """Get featured categories"""
    result = await db.execute(
        select(Category)
        .where(Category.is_active == True, Category.is_featured == True)
        .order_by(Category.sort_order)
        .limit(limit)
    )
    categories = result.scalars().all()

    return [CategoryResponse.model_validate(c) for c in categories]


@router.get("/{slug}", response_model=CategoryDetailResponse)
async def get_category(
    slug: str,
    db: AsyncSession = Depends(get_db)
):
    """Get category by slug with children"""
    result = await db.execute(
        select(Category).where(Category.slug == slug, Category.is_active == True)
    )
    category = result.scalar_one_or_none()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )

    # Fetch children (subcategories)
    children_result = await db.execute(
        select(Category)
        .where(Category.parent_id == category.id, Category.is_active == True)
        .order_by(Category.sort_order, Category.name)
    )
    children = children_result.scalars().all()

    # Get product counts for children
    product_counts = {}
    if children:
        count_result = await db.execute(
            select(Product.category_id, func.count(Product.id))
            .where(Product.status == ProductStatus.ACTIVE)
            .where(Product.category_id.in_([c.id for c in children]))
            .group_by(Product.category_id)
        )
        product_counts = dict(count_result.all())

    # Build response with children
    children_response = [
        CategoryChildResponse(
            id=c.id,
            parent_id=c.parent_id,
            name=c.name,
            slug=c.slug,
            description=c.description,
            image_url=c.image_url,
            icon=c.icon,
            is_active=c.is_active,
            product_count=product_counts.get(c.id, 0)
        )
        for c in children
    ]

    return CategoryDetailResponse(
        id=category.id,
        parent_id=category.parent_id,
        name=category.name,
        slug=category.slug,
        description=category.description,
        image_url=category.image_url,
        icon=category.icon,
        meta_title=category.meta_title,
        meta_description=category.meta_description,
        sort_order=category.sort_order,
        is_active=category.is_active,
        is_featured=category.is_featured,
        created_at=category.created_at,
        children=children_response
    )


@router.get("/{slug}/subcategories", response_model=List[CategoryResponse])
async def get_subcategories(
    slug: str,
    db: AsyncSession = Depends(get_db)
):
    """Get subcategories of a category"""
    parent_result = await db.execute(
        select(Category).where(Category.slug == slug)
    )
    parent = parent_result.scalar_one_or_none()

    if not parent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )

    result = await db.execute(
        select(Category)
        .where(Category.parent_id == parent.id, Category.is_active == True)
        .order_by(Category.sort_order, Category.name)
    )
    categories = result.scalars().all()

    return [CategoryResponse.model_validate(c) for c in categories]


# Admin endpoints

@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    category_data: CategoryCreate,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Create a new category (admin only)"""
    # Generate unique slug
    base_slug = slugify(category_data.name)
    slug = base_slug
    counter = 1
    while True:
        result = await db.execute(select(Category).where(Category.slug == slug))
        if not result.scalar_one_or_none():
            break
        slug = f"{base_slug}-{counter}"
        counter += 1

    category = Category(
        parent_id=category_data.parent_id,
        name=category_data.name,
        slug=slug,
        description=category_data.description,
        image_url=category_data.image_url,
        icon=category_data.icon,
        meta_title=category_data.meta_title,
        meta_description=category_data.meta_description,
        sort_order=category_data.sort_order,
        is_active=category_data.is_active,
        is_featured=category_data.is_featured
    )
    db.add(category)
    await db.commit()
    await db.refresh(category)

    return CategoryResponse.model_validate(category)


@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: UUID,
    category_data: CategoryUpdate,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Update a category (admin only)"""
    result = await db.execute(select(Category).where(Category.id == category_id))
    category = result.scalar_one_or_none()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )

    update_data = category_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(category, field, value)

    await db.commit()
    await db.refresh(category)

    return CategoryResponse.model_validate(category)


@router.delete("/{category_id}", response_model=MessageResponse)
async def delete_category(
    category_id: UUID,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Delete a category (admin only)"""
    result = await db.execute(select(Category).where(Category.id == category_id))
    category = result.scalar_one_or_none()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )

    # Check for subcategories
    sub_result = await db.execute(
        select(func.count(Category.id)).where(Category.parent_id == category_id)
    )
    if sub_result.scalar() > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete category with subcategories"
        )

    # Check for products
    prod_result = await db.execute(
        select(func.count(Product.id)).where(Product.category_id == category_id)
    )
    if prod_result.scalar() > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete category with products"
        )

    await db.delete(category)
    await db.commit()

    return MessageResponse(message="Category deleted successfully")
