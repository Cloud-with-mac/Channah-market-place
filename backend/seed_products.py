"""
Script to seed the database with categories and products
Run: python seed_products.py
"""
import asyncio
from datetime import datetime
from sqlalchemy import select
from app.core.database import engine, AsyncSessionLocal
from app.core.security import get_password_hash
from app.models.user import User, UserRole, AuthProvider
from app.models.vendor import Vendor, VendorStatus
from app.models.category import Category


# Sample Categories (no images - vendors will upload products with images)
CATEGORIES = [
    {
        "name": "Electronics",
        "slug": "electronics",
        "description": "Electronic devices and gadgets",
        "icon": "Laptop",
        "is_featured": True,
        "image_url": None,
    },
    {
        "name": "Fashion",
        "slug": "fashion",
        "description": "Clothing, shoes, and accessories",
        "icon": "Shirt",
        "is_featured": True,
        "image_url": None,
    },
    {
        "name": "Home & Garden",
        "slug": "home-garden",
        "description": "Home decor and garden supplies",
        "icon": "Home",
        "is_featured": True,
        "image_url": None,
    },
    {
        "name": "Sports & Outdoors",
        "slug": "sports-outdoors",
        "description": "Sports equipment and outdoor gear",
        "icon": "Trophy",
        "is_featured": True,
        "image_url": None,
    },
    {
        "name": "Books & Media",
        "slug": "books-media",
        "description": "Books, ebooks, and audiobooks",
        "icon": "BookOpen",
        "is_featured": True,
        "image_url": None,
    },
    {
        "name": "Health & Beauty",
        "slug": "health-beauty",
        "description": "Health products and beauty items",
        "icon": "Heart",
        "is_featured": True,
        "image_url": None,
    },
]

# No sample products - vendors will upload their own products


async def seed_database():
    async with AsyncSessionLocal() as db:
        print("Starting database seed...")

        # 1. Create or get vendor user
        result = await db.execute(
            select(User).where(User.email == "vendor@markethub.com")
        )
        vendor_user = result.scalar_one_or_none()

        if not vendor_user:
            vendor_user = User(
                email="vendor@markethub.com",
                password_hash=get_password_hash("vendor123"),
                first_name="Demo",
                last_name="Vendor",
                role=UserRole.VENDOR,
                auth_provider=AuthProvider.LOCAL,
                is_active=True,
                is_verified=True,
            )
            db.add(vendor_user)
            await db.flush()
            print("[OK] Created vendor user: vendor@markethub.com / vendor123")
        else:
            print("[OK] Vendor user already exists")

        # 2. Create or get vendor profile
        result = await db.execute(
            select(Vendor).where(Vendor.user_id == vendor_user.id)
        )
        vendor = result.scalar_one_or_none()

        if not vendor:
            vendor = Vendor(
                user_id=vendor_user.id,
                business_name="Channah Store",
                slug="channah-store",
                description="Premium products for every need",
                business_email="vendor@markethub.com",
                business_phone="+1234567890",
                status=VendorStatus.APPROVED,
                commission_rate=10.0,
            )
            db.add(vendor)
            await db.flush()
            print("[OK] Created vendor profile: Channah Store")
        else:
            print("[OK] Vendor profile already exists")

        # 3. Create categories
        category_map = {}
        for cat_data in CATEGORIES:
            result = await db.execute(
                select(Category).where(Category.slug == cat_data["slug"])
            )
            category = result.scalar_one_or_none()

            if not category:
                category = Category(
                    name=cat_data["name"],
                    slug=cat_data["slug"],
                    description=cat_data["description"],
                    icon=cat_data["icon"],
                    is_featured=cat_data["is_featured"],
                    image_url=cat_data["image_url"],
                    is_active=True,
                )
                db.add(category)
                await db.flush()
                print(f"[OK] Created category: {cat_data['name']}")
            else:
                print(f"[OK] Category exists: {cat_data['name']}")

            category_map[cat_data["slug"]] = category

        # Products are not seeded - vendors will upload their own products

        await db.commit()
        print("\n[SUCCESS] Database seeding completed successfully!")
        print(f"   - {len(CATEGORIES)} categories")
        print("   - 0 products (vendors will upload their own)")
        print("\nVendor credentials: vendor@markethub.com / vendor123")


if __name__ == "__main__":
    asyncio.run(seed_database())
