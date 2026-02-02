"""
Script to reset products and re-seed categories
Run: python reset_and_seed.py
"""
import asyncio
import os
from sqlalchemy import delete, select, text
from app.core.database import AsyncSessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.user import User, UserRole, AuthProvider
from app.models.vendor import Vendor, VendorStatus
from app.models.category import Category
from app.models.product import Product, ProductImage, ProductVariant, ProductAttribute, ProductStatus


# Categories with subcategories
CATEGORIES = [
    {
        "name": "Electronics",
        "slug": "electronics",
        "description": "Electronic devices and gadgets",
        "icon": "Laptop",
        "is_featured": True,
        "children": [
            {"name": "Phones & Tablets", "slug": "phones-tablets", "description": "Smartphones and tablets"},
            {"name": "Computers & Laptops", "slug": "computers-laptops", "description": "Desktop and laptop computers"},
            {"name": "TV & Audio", "slug": "tv-audio", "description": "Televisions and audio equipment"},
            {"name": "Cameras & Photography", "slug": "cameras-photography", "description": "Cameras and accessories"},
            {"name": "Wearable Tech", "slug": "wearable-tech", "description": "Smartwatches and fitness trackers"},
        ],
    },
    {
        "name": "Fashion",
        "slug": "fashion",
        "description": "Clothing, shoes, and accessories",
        "icon": "Shirt",
        "is_featured": True,
        "children": [
            {"name": "Men's Clothing", "slug": "mens-clothing", "description": "Clothing for men"},
            {"name": "Women's Clothing", "slug": "womens-clothing", "description": "Clothing for women"},
            {"name": "Shoes", "slug": "shoes", "description": "Footwear for all"},
            {"name": "Bags & Accessories", "slug": "bags-accessories", "description": "Bags, belts, and accessories"},
            {"name": "Jewelry", "slug": "fashion-jewelry", "description": "Fashion jewelry and accessories"},
        ],
    },
    {
        "name": "Home & Garden",
        "slug": "home-garden",
        "description": "Home decor and garden supplies",
        "icon": "Home",
        "is_featured": True,
        "children": [
            {"name": "Furniture", "slug": "furniture", "description": "Home and office furniture"},
            {"name": "Kitchen & Dining", "slug": "kitchen-dining", "description": "Kitchen appliances and dining"},
            {"name": "Bedding & Bath", "slug": "bedding-bath", "description": "Bedding, towels, and bath accessories"},
            {"name": "Garden & Outdoor", "slug": "garden-outdoor", "description": "Garden tools and outdoor decor"},
            {"name": "Lighting", "slug": "lighting", "description": "Indoor and outdoor lighting"},
        ],
    },
    {
        "name": "Sports & Outdoors",
        "slug": "sports-outdoors",
        "description": "Sports equipment and outdoor gear",
        "icon": "Trophy",
        "is_featured": True,
        "children": [
            {"name": "Exercise & Fitness", "slug": "exercise-fitness", "description": "Gym and fitness equipment"},
            {"name": "Outdoor Recreation", "slug": "outdoor-recreation", "description": "Camping, hiking, and outdoor gear"},
            {"name": "Team Sports", "slug": "team-sports", "description": "Equipment for team sports"},
            {"name": "Sportswear", "slug": "sportswear", "description": "Athletic clothing and shoes"},
            {"name": "Cycling", "slug": "cycling", "description": "Bikes, helmets, and cycling gear"},
            {"name": "Water Sports", "slug": "water-sports", "description": "Swimming, surfing, and water gear"},
        ],
    },
    {
        "name": "Books & Media",
        "slug": "books-media",
        "description": "Books, ebooks, and audiobooks",
        "icon": "BookOpen",
        "is_featured": True,
        "children": [
            {"name": "Fiction", "slug": "fiction", "description": "Fiction books and novels"},
            {"name": "Non-Fiction", "slug": "non-fiction", "description": "Non-fiction and educational books"},
            {"name": "Textbooks", "slug": "textbooks", "description": "Academic and school textbooks"},
            {"name": "Magazines", "slug": "magazines", "description": "Magazines and periodicals"},
        ],
    },
    {
        "name": "Health & Beauty",
        "slug": "health-beauty",
        "description": "Health products and beauty items",
        "icon": "Heart",
        "is_featured": True,
        "children": [
            {"name": "Skincare", "slug": "skincare", "description": "Skincare products and treatments"},
            {"name": "Haircare", "slug": "haircare", "description": "Hair products and styling tools"},
            {"name": "Makeup", "slug": "makeup", "description": "Cosmetics and makeup products"},
            {"name": "Vitamins & Supplements", "slug": "vitamins-supplements", "description": "Health supplements"},
            {"name": "Fragrances", "slug": "fragrances", "description": "Perfumes and fragrances"},
        ],
    },
    {
        "name": "Art & Crafts",
        "slug": "art-crafts",
        "description": "Art supplies and craft materials",
        "icon": "Palette",
        "is_featured": True,
        "children": [
            {"name": "Painting", "slug": "painting", "description": "Paints, canvases, and brushes"},
            {"name": "Drawing", "slug": "drawing", "description": "Pencils, pens, and sketchbooks"},
            {"name": "Sewing & Knitting", "slug": "sewing-knitting", "description": "Fabrics, yarn, and sewing supplies"},
            {"name": "Scrapbooking", "slug": "scrapbooking", "description": "Scrapbook supplies and stickers"},
            {"name": "Beading & Jewelry Making", "slug": "beading-jewelry-making", "description": "Beads, wire, and jewelry tools"},
        ],
    },
    {
        "name": "Automotive",
        "slug": "automotive",
        "description": "Car parts and accessories",
        "icon": "Car",
        "is_featured": True,
        "children": [
            {"name": "Car Parts", "slug": "car-parts", "description": "Replacement parts and components"},
            {"name": "Car Accessories", "slug": "car-accessories", "description": "Interior and exterior accessories"},
            {"name": "Tools & Equipment", "slug": "auto-tools", "description": "Automotive tools and equipment"},
        ],
    },
    {
        "name": "Baby & Kids",
        "slug": "baby-kids",
        "description": "Baby products and kids toys",
        "icon": "Baby",
        "is_featured": True,
        "children": [
            {"name": "Baby Clothing", "slug": "baby-clothing", "description": "Clothes for babies and toddlers"},
            {"name": "Feeding", "slug": "feeding", "description": "Bottles, formula, and feeding accessories"},
            {"name": "Toys", "slug": "kids-toys", "description": "Toys for children of all ages"},
            {"name": "Strollers & Car Seats", "slug": "strollers-car-seats", "description": "Strollers, car seats, and carriers"},
        ],
    },
    {
        "name": "Bags & Luggage",
        "slug": "bags-luggage",
        "description": "Bags, backpacks, and travel luggage",
        "icon": "Briefcase",
        "is_featured": True,
        "children": [
            {"name": "Backpacks", "slug": "backpacks", "description": "School, travel, and hiking backpacks"},
            {"name": "Handbags", "slug": "handbags", "description": "Women's handbags and purses"},
            {"name": "Travel Luggage", "slug": "travel-luggage", "description": "Suitcases and travel bags"},
            {"name": "Laptop Bags", "slug": "laptop-bags", "description": "Laptop bags and sleeves"},
            {"name": "Wallets", "slug": "wallets", "description": "Wallets and cardholders"},
        ],
    },
    {
        "name": "Computers & Tablets",
        "slug": "computers-tablets",
        "description": "Computers, tablets, and accessories",
        "icon": "Monitor",
        "is_featured": True,
        "children": [
            {"name": "Laptops", "slug": "laptops", "description": "Laptop computers"},
            {"name": "Desktops", "slug": "desktops", "description": "Desktop computers"},
            {"name": "Tablets", "slug": "tablets", "description": "Tablets and e-readers"},
            {"name": "Computer Accessories", "slug": "computer-accessories", "description": "Keyboards, mice, and peripherals"},
        ],
    },
    {
        "name": "Food & Beverages",
        "slug": "food-beverages",
        "description": "Food items and drinks",
        "icon": "Coffee",
        "is_featured": False,
        "children": [
            {"name": "Snacks", "slug": "snacks", "description": "Chips, nuts, and snack foods"},
            {"name": "Drinks", "slug": "drinks", "description": "Soft drinks, juices, and water"},
            {"name": "Coffee & Tea", "slug": "coffee-tea", "description": "Coffee beans, tea, and accessories"},
            {"name": "Cooking Ingredients", "slug": "cooking-ingredients", "description": "Spices, sauces, and cooking essentials"},
            {"name": "Organic & Health Foods", "slug": "organic-health-foods", "description": "Organic and health-conscious food products"},
        ],
    },
    {
        "name": "Jewelry & Watches",
        "slug": "jewelry-watches",
        "description": "Fine jewelry and watches",
        "icon": "Watch",
        "is_featured": False,
        "children": [
            {"name": "Necklaces & Pendants", "slug": "necklaces-pendants", "description": "Necklaces, pendants, and chains"},
            {"name": "Rings", "slug": "rings", "description": "Engagement, wedding, and fashion rings"},
            {"name": "Earrings", "slug": "earrings", "description": "Studs, hoops, and drop earrings"},
            {"name": "Bracelets", "slug": "bracelets", "description": "Bracelets and bangles"},
            {"name": "Watches", "slug": "watches", "description": "Men's and women's watches"},
        ],
    },
    {
        "name": "Office Supplies",
        "slug": "office-supplies",
        "description": "Office and school supplies",
        "icon": "FileText",
        "is_featured": False,
        "children": [
            {"name": "Writing & Correction", "slug": "writing-correction", "description": "Pens, pencils, and correction supplies"},
            {"name": "Paper Products", "slug": "paper-products", "description": "Notebooks, printer paper, and envelopes"},
            {"name": "Desk Accessories", "slug": "desk-accessories", "description": "Organizers, staplers, and desk items"},
            {"name": "Printers & Ink", "slug": "printers-ink", "description": "Printers, ink cartridges, and toner"},
        ],
    },
    {
        "name": "Pet Supplies",
        "slug": "pet-supplies",
        "description": "Pet food and accessories",
        "icon": "PawPrint",
        "is_featured": False,
        "children": [
            {"name": "Dog Supplies", "slug": "dog-supplies", "description": "Food, toys, and accessories for dogs"},
            {"name": "Cat Supplies", "slug": "cat-supplies", "description": "Food, toys, and accessories for cats"},
            {"name": "Fish & Aquarium", "slug": "fish-aquarium", "description": "Fish food, tanks, and accessories"},
            {"name": "Bird Supplies", "slug": "bird-supplies", "description": "Cages, food, and accessories for birds"},
            {"name": "Pet Grooming", "slug": "pet-grooming", "description": "Grooming tools and shampoos"},
        ],
    },
    {
        "name": "Tools & Hardware",
        "slug": "tools-hardware",
        "description": "Tools and hardware equipment",
        "icon": "Wrench",
        "is_featured": False,
        "children": [
            {"name": "Power Tools", "slug": "power-tools", "description": "Drills, saws, and power equipment"},
            {"name": "Hand Tools", "slug": "hand-tools", "description": "Hammers, screwdrivers, and wrenches"},
            {"name": "Electrical", "slug": "electrical", "description": "Wiring, switches, and electrical supplies"},
            {"name": "Plumbing", "slug": "plumbing", "description": "Pipes, fittings, and plumbing tools"},
            {"name": "Safety Equipment", "slug": "safety-equipment", "description": "Gloves, goggles, and safety gear"},
        ],
    },
    {
        "name": "Toys & Games",
        "slug": "toys-games",
        "description": "Toys, games, and entertainment",
        "icon": "Gamepad",
        "is_featured": False,
        "children": [
            {"name": "Action Figures", "slug": "action-figures", "description": "Action figures and collectibles"},
            {"name": "Board Games", "slug": "board-games", "description": "Board games and card games"},
            {"name": "Building Toys", "slug": "building-toys", "description": "LEGO, blocks, and building sets"},
            {"name": "Dolls & Plush", "slug": "dolls-plush", "description": "Dolls, plush toys, and stuffed animals"},
            {"name": "Puzzles", "slug": "puzzles", "description": "Jigsaw puzzles and brain teasers"},
            {"name": "Video Games", "slug": "video-games", "description": "Video games and gaming accessories"},
        ],
    },
    {
        "name": "Musical Instruments",
        "slug": "musical-instruments",
        "description": "Musical instruments and equipment",
        "icon": "Music",
        "is_featured": False,
        "children": [
            {"name": "Guitars", "slug": "guitars", "description": "Acoustic and electric guitars"},
            {"name": "Keyboards & Pianos", "slug": "keyboards-pianos", "description": "Digital pianos and keyboards"},
            {"name": "Drums & Percussion", "slug": "drums-percussion", "description": "Drum kits and percussion instruments"},
            {"name": "Wind Instruments", "slug": "wind-instruments", "description": "Flutes, saxophones, and trumpets"},
            {"name": "DJ & Studio Equipment", "slug": "dj-studio-equipment", "description": "Mixers, turntables, and studio gear"},
        ],
    },
]


async def reset_and_seed():
    # Ensure all new columns exist by recreating tables
    # Import all models so Base.metadata is complete
    import app.models  # noqa
    try:
        from app.models.rfq import RFQ, RFQQuote  # noqa
    except Exception:
        pass
    try:
        from app.models.verification import VerificationApplication, VerificationDocument  # noqa
    except Exception:
        pass

    print("=" * 50)
    print("STEP 0: Updating database schema...")
    print("=" * 50)

    # For SQLite, add missing columns gracefully
    async with engine.begin() as conn:
        # Try adding new vendor columns if they don't exist
        for col, col_type, default in [
            ("badge_level", "VARCHAR", "NULL"),
            ("trust_score", "INTEGER", "0"),
            ("verification_status", "VARCHAR", "'UNVERIFIED'"),
        ]:
            try:
                await conn.execute(text(f"ALTER TABLE vendors ADD COLUMN {col} {col_type} DEFAULT {default}"))
                print(f"[OK] Added column vendors.{col}")
            except Exception:
                print(f"[--] Column vendors.{col} already exists")

        # Create any new tables (RFQ, Verification, etc.)
        await conn.run_sync(Base.metadata.create_all)
        print("[OK] All tables synced")

    async with AsyncSessionLocal() as db:
        print("\n" + "=" * 50)
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

        # Delete existing categories to avoid duplicates
        await db.execute(delete(Category))
        await db.commit()
        print("[OK] Cleared existing categories")

        # Create categories with subcategories
        for cat_data in CATEGORIES:
            category = Category(
                name=cat_data["name"],
                slug=cat_data["slug"],
                description=cat_data["description"],
                icon=cat_data.get("icon"),
                is_featured=cat_data.get("is_featured", False),
                image_url=None,
                is_active=True,
            )
            db.add(category)
            await db.flush()  # Get the ID
            print(f"[OK] Created category: {cat_data['name']}")

            # Create subcategories
            for child in cat_data.get("children", []):
                sub = Category(
                    parent_id=category.id,
                    name=child["name"],
                    slug=child["slug"],
                    description=child.get("description", ""),
                    icon=cat_data.get("icon"),
                    is_featured=False,
                    image_url=None,
                    is_active=True,
                )
                db.add(sub)
                print(f"  [OK] Created subcategory: {child['name']}")

        await db.commit()

        print("\n" + "=" * 50)
        print("STEP 3: Creating test vendors...")
        print("=" * 50)

        VENDORS = [
            {"email": "vendor@markethub.com", "first": "Demo", "last": "Vendor", "biz": "Channah Store", "slug": "channah-store", "desc": "Premium products for every need", "phone": "+1234567890", "commission": 10.0},
            {"email": "techzone@test.com", "first": "James", "last": "Chen", "biz": "TechZone Electronics", "slug": "techzone-electronics", "desc": "Your one-stop shop for cutting-edge electronics and gadgets", "phone": "+1234567891", "commission": 8.0},
            {"email": "fashionista@test.com", "first": "Amara", "last": "Okafor", "biz": "Fashionista Boutique", "slug": "fashionista-boutique", "desc": "Trendy fashion and accessories for every style", "phone": "+1234567892", "commission": 12.0},
            {"email": "homeessentials@test.com", "first": "Sarah", "last": "Williams", "biz": "Home Essentials Co", "slug": "home-essentials-co", "desc": "Quality furniture, decor, and home improvement products", "phone": "+1234567893", "commission": 10.0},
            {"email": "sportspro@test.com", "first": "David", "last": "Martinez", "biz": "SportsPro Gear", "slug": "sportspro-gear", "desc": "Professional sports equipment and outdoor adventure gear", "phone": "+1234567894", "commission": 9.0},
            {"email": "wellness@test.com", "first": "Fatima", "last": "Al-Rashid", "biz": "Wellness & Glow", "slug": "wellness-and-glow", "desc": "Natural beauty, skincare, and health products", "phone": "+1234567895", "commission": 11.0},
            {"email": "bookworm@test.com", "first": "Emily", "last": "Thompson", "biz": "BookWorm Paradise", "slug": "bookworm-paradise", "desc": "Books, media, and educational materials for all ages", "phone": "+1234567896", "commission": 7.0},
            {"email": "petpalace@test.com", "first": "Michael", "last": "Brown", "biz": "Pet Palace", "slug": "pet-palace", "desc": "Everything your furry friends need and more", "phone": "+1234567897", "commission": 10.0},
            {"email": "toolmaster@test.com", "first": "Robert", "last": "Johnson", "biz": "ToolMaster Pro", "slug": "toolmaster-pro", "desc": "Professional tools and hardware for every project", "phone": "+1234567898", "commission": 9.0},
            {"email": "kidsworld@test.com", "first": "Lisa", "last": "Park", "biz": "Kids World", "slug": "kids-world", "desc": "Toys, games, and everything for babies and children", "phone": "+1234567899", "commission": 10.0},
        ]

        vendors = []
        for v in VENDORS:
            result = await db.execute(select(User).where(User.email == v["email"]))
            user = result.scalar_one_or_none()
            if not user:
                user = User(email=v["email"], password_hash=get_password_hash("vendor123"), first_name=v["first"], last_name=v["last"], role=UserRole.VENDOR, auth_provider=AuthProvider.LOCAL, is_active=True, is_verified=True)
                db.add(user)
                await db.flush()
            result = await db.execute(select(Vendor).where(Vendor.user_id == user.id))
            vendor = result.scalar_one_or_none()
            if not vendor:
                vendor = Vendor(user_id=user.id, business_name=v["biz"], slug=v["slug"], description=v["desc"], business_email=v["email"], business_phone=v["phone"], status=VendorStatus.APPROVED, commission_rate=v["commission"])
                db.add(vendor)
                await db.flush()
            vendors.append(vendor)
            print(f"[OK] Vendor: {v['biz']} ({v['email']} / vendor123)")

        await db.commit()

        print("\n" + "=" * 50)
        print("STEP 4: Seeding sample products...")
        print("=" * 50)

        # Re-fetch categories from DB to get current IDs
        cat_result = await db.execute(select(Category).where(Category.parent_id != None))
        subcategories = {c.slug: c for c in cat_result.scalars().all()}

        # Also get top-level categories for any that have no subcategories
        top_result = await db.execute(select(Category).where(Category.parent_id == None))
        top_categories = {c.slug: c for c in top_result.scalars().all()}

        from products_data import PRODUCTS

        product_count = 0
        for idx, prod_data in enumerate(PRODUCTS):
            cat = subcategories.get(prod_data["category_slug"])
            if not cat:
                print(f"  [SKIP] Category not found: {prod_data['category_slug']}")
                continue

            # Distribute products across all vendors (round-robin)
            assigned_vendor = vendors[idx % len(vendors)]

            product = Product(
                vendor_id=assigned_vendor.id,
                category_id=cat.id,
                name=prod_data["name"],
                slug=prod_data["slug"],
                description=prod_data.get("description", ""),
                price=prod_data["price"],
                compare_at_price=prod_data.get("compare_at_price"),
                currency="GBP",
                quantity=prod_data.get("quantity", 10),
                status=ProductStatus.ACTIVE,
                is_featured=prod_data.get("is_featured", False),
                rating=prod_data.get("rating", 0),
                review_count=prod_data.get("review_count", 0),
                shipping_cost=prod_data.get("shipping_cost", 0),
            )
            db.add(product)
            await db.flush()

            # Add product image
            if prod_data.get("image"):
                img = ProductImage(
                    product_id=product.id,
                    url=prod_data["image"],
                    alt_text=prod_data["name"],
                    sort_order=0,
                    is_primary=True,
                )
                db.add(img)

            product_count += 1
            print(f"  [OK] Created product: {prod_data['name']}")

        await db.commit()

        print("\n" + "=" * 50)
        print("SUCCESS! Database reset complete.")
        print("=" * 50)
        print(f"\n- {len(CATEGORIES)} categories ready")
        print(f"- {len(vendors)} vendors created")
        print(f"- {product_count} products seeded")
        print("\nVendor credentials (all password: vendor123):")
        for v in VENDORS:
            print(f"  - {v['email']} ({v['biz']})")
        print("\nNOTE: Clear your browser cache or hard refresh (Ctrl+Shift+R)")


if __name__ == "__main__":
    asyncio.run(reset_and_seed())
