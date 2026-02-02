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

SUBCATEGORIES = [
    # Electronics
    {"name": "Smartphones", "slug": "smartphones", "parent_slug": "electronics", "description": "Mobile phones and accessories", "icon": "Smartphone"},
    {"name": "Laptops & Computers", "slug": "laptops-computers", "parent_slug": "electronics", "description": "Laptops, desktops and accessories", "icon": "Laptop"},
    {"name": "Audio & Headphones", "slug": "audio-headphones", "parent_slug": "electronics", "description": "Speakers, headphones and earbuds", "icon": "Headphones"},
    {"name": "Cameras", "slug": "cameras", "parent_slug": "electronics", "description": "Digital cameras and accessories", "icon": "Camera"},
    {"name": "Gaming", "slug": "gaming", "parent_slug": "electronics", "description": "Gaming consoles and accessories", "icon": "Gamepad"},
    {"name": "TV & Video", "slug": "tv-video", "parent_slug": "electronics", "description": "Televisions and video equipment", "icon": "Monitor"},
    # Fashion
    {"name": "Men's Clothing", "slug": "mens-clothing", "parent_slug": "fashion", "description": "Clothing for men", "icon": "Shirt"},
    {"name": "Women's Clothing", "slug": "womens-clothing", "parent_slug": "fashion", "description": "Clothing for women", "icon": "Shirt"},
    {"name": "Shoes", "slug": "shoes", "parent_slug": "fashion", "description": "Footwear for all", "icon": "Shoe"},
    {"name": "Bags & Accessories", "slug": "bags-accessories", "parent_slug": "fashion", "description": "Bags, watches, jewelry and more", "icon": "ShoppingBag"},
    {"name": "Kids' Fashion", "slug": "kids-fashion", "parent_slug": "fashion", "description": "Clothing for kids", "icon": "Shirt"},
    # Home & Garden
    {"name": "Furniture", "slug": "furniture", "parent_slug": "home-garden", "description": "Indoor and outdoor furniture", "icon": "Armchair"},
    {"name": "Kitchen & Dining", "slug": "kitchen-dining", "parent_slug": "home-garden", "description": "Kitchen appliances and dining", "icon": "ChefHat"},
    {"name": "Bedding & Bath", "slug": "bedding-bath", "parent_slug": "home-garden", "description": "Bedding, towels, bath accessories", "icon": "Bed"},
    {"name": "Lighting", "slug": "lighting", "parent_slug": "home-garden", "description": "Indoor and outdoor lighting", "icon": "Lamp"},
    {"name": "Garden & Outdoor", "slug": "garden-outdoor", "parent_slug": "home-garden", "description": "Garden tools and outdoor decor", "icon": "Flower"},
    # Sports & Outdoors
    {"name": "Fitness Equipment", "slug": "fitness-equipment", "parent_slug": "sports-outdoors", "description": "Gym and fitness gear", "icon": "Dumbbell"},
    {"name": "Outdoor Recreation", "slug": "outdoor-recreation", "parent_slug": "sports-outdoors", "description": "Camping, hiking, outdoor activities", "icon": "Mountain"},
    {"name": "Team Sports", "slug": "team-sports", "parent_slug": "sports-outdoors", "description": "Football, basketball, and more", "icon": "Trophy"},
    {"name": "Cycling", "slug": "cycling", "parent_slug": "sports-outdoors", "description": "Bikes and cycling accessories", "icon": "Bike"},
    # Books & Media
    {"name": "Fiction", "slug": "fiction", "parent_slug": "books-media", "description": "Novels and fiction books", "icon": "BookOpen"},
    {"name": "Non-Fiction", "slug": "non-fiction", "parent_slug": "books-media", "description": "Educational and informational", "icon": "BookOpen"},
    {"name": "Textbooks", "slug": "textbooks", "parent_slug": "books-media", "description": "Academic and school textbooks", "icon": "BookOpen"},
    {"name": "Music & Movies", "slug": "music-movies", "parent_slug": "books-media", "description": "CDs, DVDs, vinyl and streaming", "icon": "Music"},
    # Health & Beauty
    {"name": "Skincare", "slug": "skincare", "parent_slug": "health-beauty", "description": "Face and body skincare products", "icon": "Heart"},
    {"name": "Hair Care", "slug": "hair-care", "parent_slug": "health-beauty", "description": "Shampoos, conditioners and styling", "icon": "Scissors"},
    {"name": "Makeup", "slug": "makeup", "parent_slug": "health-beauty", "description": "Cosmetics and beauty tools", "icon": "Sparkles"},
    {"name": "Health & Wellness", "slug": "health-wellness", "parent_slug": "health-beauty", "description": "Vitamins, supplements and health", "icon": "Heart"},
    {"name": "Fragrances", "slug": "fragrances", "parent_slug": "health-beauty", "description": "Perfumes and body sprays", "icon": "Droplet"},
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

        # 3. Create subcategories
        for sub_data in SUBCATEGORIES:
            parent = category_map.get(sub_data["parent_slug"])
            if not parent:
                print(f"[SKIP] Parent not found for subcategory: {sub_data['name']}")
                continue

            result = await db.execute(
                select(Category).where(Category.slug == sub_data["slug"])
            )
            subcategory = result.scalar_one_or_none()

            if not subcategory:
                subcategory = Category(
                    name=sub_data["name"],
                    slug=sub_data["slug"],
                    description=sub_data.get("description"),
                    icon=sub_data.get("icon"),
                    parent_id=parent.id,
                    is_featured=False,
                    is_active=True,
                )
                db.add(subcategory)
                await db.flush()
                print(f"  [OK] Created subcategory: {sub_data['name']} -> {sub_data['parent_slug']}")
            else:
                # Update parent_id if not set
                if not subcategory.parent_id:
                    subcategory.parent_id = parent.id
                    print(f"  [OK] Updated parent for: {sub_data['name']}")
                else:
                    print(f"  [OK] Subcategory exists: {sub_data['name']}")

            category_map[sub_data["slug"]] = subcategory

        # Products are not seeded - vendors will upload their own products

        await db.commit()
        print("\n[SUCCESS] Database seeding completed successfully!")
        print(f"   - {len(CATEGORIES)} categories + {len(SUBCATEGORIES)} subcategories")
        print("   - 0 products (vendors will upload their own)")
        print("\nVendor credentials: vendor@markethub.com / vendor123")


if __name__ == "__main__":
    asyncio.run(seed_database())
