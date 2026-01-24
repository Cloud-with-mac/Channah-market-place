"""
Script to reset products and re-seed categories
Run: python reset_and_seed.py
"""
import asyncio
from sqlalchemy import delete, select
from app.core.database import AsyncSessionLocal
from app.core.security import get_password_hash
from app.models.user import User, UserRole, AuthProvider
from app.models.vendor import Vendor, VendorStatus
from app.models.category import Category
from app.models.product import Product, ProductImage, ProductVariant, ProductAttribute


# Categories (no images - vendors will upload products with images)
CATEGORIES = [
    {
        "name": "Electronics",
        "slug": "electronics",
        "description": "Electronic devices and gadgets",
        "icon": "Laptop",
        "is_featured": True,
    },
    {
        "name": "Fashion",
        "slug": "fashion",
        "description": "Clothing, shoes, and accessories",
        "icon": "Shirt",
        "is_featured": True,
    },
    {
        "name": "Home & Garden",
        "slug": "home-garden",
        "description": "Home decor and garden supplies",
        "icon": "Home",
        "is_featured": True,
    },
    {
        "name": "Sports & Outdoors",
        "slug": "sports-outdoors",
        "description": "Sports equipment and outdoor gear",
        "icon": "Trophy",
        "is_featured": True,
    },
    {
        "name": "Books & Media",
        "slug": "books-media",
        "description": "Books, ebooks, and audiobooks",
        "icon": "BookOpen",
        "is_featured": True,
    },
    {
        "name": "Health & Beauty",
        "slug": "health-beauty",
        "description": "Health products and beauty items",
        "icon": "Heart",
        "is_featured": True,
    },
    {
        "name": "Art & Crafts",
        "slug": "art-crafts",
        "description": "Art supplies and craft materials",
        "icon": "Palette",
        "is_featured": True,
    },
    {
        "name": "Automotive",
        "slug": "automotive",
        "description": "Car parts and accessories",
        "icon": "Car",
        "is_featured": True,
    },
    {
        "name": "Baby & Kids",
        "slug": "baby-kids",
        "description": "Baby products and kids toys",
        "icon": "Baby",
        "is_featured": True,
    },
    {
        "name": "Bags & Luggage",
        "slug": "bags-luggage",
        "description": "Bags, backpacks, and travel luggage",
        "icon": "Briefcase",
        "is_featured": True,
    },
    {
        "name": "Computers & Tablets",
        "slug": "computers-tablets",
        "description": "Computers, tablets, and accessories",
        "icon": "Monitor",
        "is_featured": True,
    },
    {
        "name": "Food & Beverages",
        "slug": "food-beverages",
        "description": "Food items and drinks",
        "icon": "Coffee",
        "is_featured": False,
    },
    {
        "name": "Jewelry & Watches",
        "slug": "jewelry-watches",
        "description": "Fine jewelry and watches",
        "icon": "Watch",
        "is_featured": False,
    },
    {
        "name": "Office Supplies",
        "slug": "office-supplies",
        "description": "Office and school supplies",
        "icon": "FileText",
        "is_featured": False,
    },
    {
        "name": "Pet Supplies",
        "slug": "pet-supplies",
        "description": "Pet food and accessories",
        "icon": "PawPrint",
        "is_featured": False,
    },
    {
        "name": "Tools & Hardware",
        "slug": "tools-hardware",
        "description": "Tools and hardware equipment",
        "icon": "Wrench",
        "is_featured": False,
    },
    {
        "name": "Toys & Games",
        "slug": "toys-games",
        "description": "Toys, games, and entertainment",
        "icon": "Gamepad",
        "is_featured": False,
    },
    {
        "name": "Musical Instruments",
        "slug": "musical-instruments",
        "description": "Musical instruments and equipment",
        "icon": "Music",
        "is_featured": False,
    },
]


async def reset_and_seed():
    async with AsyncSessionLocal() as db:
        print("=" * 50)
        print("STEP 1: Clearing all products...")
        print("=" * 50)

        # Delete in correct order to avoid FK issues
        await db.execute(delete(ProductAttribute))
        print("[OK] Deleted product attributes")

        await db.execute(delete(ProductVariant))
        print("[OK] Deleted product variants")

        await db.execute(delete(ProductImage))
        print("[OK] Deleted product images")

        await db.execute(delete(Product))
        print("[OK] Deleted all products")

        await db.commit()

        print("\n" + "=" * 50)
        print("STEP 2: Re-seeding categories...")
        print("=" * 50)

        # Create or update categories
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
                    image_url=None,  # No image - vendors upload their own
                    is_active=True,
                )
                db.add(category)
                print(f"[OK] Created category: {cat_data['name']}")
            else:
                # Update existing category to remove any image
                category.image_url = None
                print(f"[OK] Category exists: {cat_data['name']}")

        await db.commit()

        print("\n" + "=" * 50)
        print("STEP 3: Ensuring demo vendor exists...")
        print("=" * 50)

        # Check/create vendor user
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

        # Check/create vendor profile
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
            print("[OK] Created vendor profile: Channah Store")
        else:
            print("[OK] Vendor profile already exists")

        await db.commit()

        print("\n" + "=" * 50)
        print("SUCCESS! Database reset complete.")
        print("=" * 50)
        print(f"\n- {len(CATEGORIES)} categories ready")
        print("- 0 products (vendors will upload their own)")
        print("\nVendor credentials: vendor@markethub.com / vendor123")
        print("\nNOTE: Clear your browser cache or hard refresh (Ctrl+Shift+R)")


if __name__ == "__main__":
    asyncio.run(reset_and_seed())
