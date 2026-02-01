import asyncio
import uuid
import sys
sys.path.insert(0, '.')
from app.core.database import AsyncSessionLocal
from sqlalchemy import text


new_parents = [
    ('Jewelry & Watches', 'jewelry-watches', '💎', 'Fine jewelry, watches, and accessories', True, 16),
    ('Office & School Supplies', 'office-school-supplies', '📎', 'Office equipment, stationery, and school essentials', False, 17),
    ('Toys & Games', 'toys-games', '🎮', 'Toys, games, puzzles, and entertainment', True, 18),
    ('Furniture & Decor', 'furniture-decor', '🪑', 'Home and office furniture, decorations', True, 19),
    ('Electrical & Lighting', 'electrical-lighting', '💡', 'Electrical equipment, lighting, and accessories', False, 20),
]

new_subcategories = {
    'jewelry-watches': [
        'Diamond Jewelry', 'Gold Jewelry', 'Silver Jewelry', 'Luxury Watches',
        'Fashion Watches', 'Earrings', 'Necklaces & Pendants', 'Bracelets & Bangles',
        'Rings', 'Wedding Jewelry',
    ],
    'office-school-supplies': [
        'Printers & Scanners', 'Office Furniture', 'Writing Instruments', 'Paper Products',
        'Filing & Storage', 'Presentation Supplies', 'Desk Accessories', 'School Bags',
        'Art Supplies', 'Calculators & Electronics',
    ],
    'toys-games': [
        'Action Figures', 'Board Games', 'Building Blocks', 'Dolls & Accessories',
        'Educational Toys', 'Outdoor Play', 'Puzzles', 'Remote Control Toys',
        'Video Games & Consoles', 'Stuffed Animals',
    ],
    'furniture-decor': [
        'Living Room Furniture', 'Bedroom Furniture', 'Dining Furniture', 'Outdoor Furniture',
        'Storage & Organization', 'Wall Art & Decor', 'Rugs & Carpets', 'Curtains & Blinds',
        'Shelving & Bookcases', 'Bathroom Furniture',
    ],
    'electrical-lighting': [
        'LED Lighting', 'Chandeliers', 'Outdoor Lighting', 'Solar Lighting',
        'Switches & Sockets', 'Wiring & Cables', 'Circuit Breakers', 'Generators',
        'Transformers', 'Smart Lighting',
    ],
}

existing_extras = {
    'electronics': [
        'Drones & Accessories', 'Smart Home Devices', 'Projectors', 'Power Banks', 'Computer Components',
    ],
    'fashion-apparel': [
        'Sportswear', 'Formal Wear', 'Swimwear', 'Maternity Wear', 'Traditional Clothing',
    ],
    'home-garden': [
        'Cleaning Supplies', 'Bathroom Accessories', 'BBQ & Grilling', 'Pest Control', 'Home Improvement',
    ],
    'health-beauty': [
        'Oral Care', 'Men Grooming', 'Nail Care', 'Medical Devices', 'Weight Management',
    ],
    'sports-outdoors': [
        'Water Sports', 'Martial Arts', 'Golf Equipment', 'Winter Sports', 'Hunting & Shooting',
    ],
    'automotive': [
        'Car Audio', 'Car Lighting', 'Motorcycle Parts', 'Car Cleaning', 'GPS & Navigation',
    ],
    'food-beverages': [
        'Organic Foods', 'Spices & Herbs', 'Frozen Foods', 'Baby Food', 'Gourmet Foods',
    ],
    'baby-kids': [
        'Nursery Furniture', 'Baby Safety', 'Kids Clothing', 'School Supplies', 'Baby Feeding',
    ],
    'books-stationery': [
        'E-Books', 'Magazines', 'Gift Wrapping', 'Calendars & Planners', 'Craft Supplies',
    ],
    'pet-supplies': [
        'Aquarium Supplies', 'Reptile Supplies', 'Pet Health', 'Pet Clothing', 'Pet Training',
    ],
    'industrial-tools': [
        'Welding Equipment', 'Woodworking Tools', 'Plumbing Tools', 'Electrical Tools', 'Industrial Chemicals',
    ],
    'agriculture': [
        'Greenhouse Supplies', 'Animal Feed', 'Farm Machinery', 'Poultry Equipment', 'Aquaculture',
    ],
    'packaging-printing': [
        'Gift Boxes', 'Shipping Supplies', 'Labels & Tags', 'Printing Machinery', 'Packaging Design',
    ],
    'textiles-fabrics': [
        'Denim Fabric', 'Silk Fabric', 'Cotton Fabric', 'Leather & Faux Leather', 'Embroidery Supplies',
    ],
    'minerals-energy': [
        'Precious Metals', 'Industrial Minerals', 'Renewable Energy', 'Oil & Gas Equipment', 'Battery & Storage',
    ],
}


def slugify(name):
    return name.lower().replace(' & ', '-').replace(' ', '-').replace("'", '')


async def seed():
    async with AsyncSessionLocal() as db:
        # 1. Add 5 new parent categories
        for name, slug, icon, desc, featured, sort in new_parents:
            pid = str(uuid.uuid4())
            await db.execute(text(
                "INSERT OR IGNORE INTO categories (id, name, slug, icon, description, sort_order, is_active, is_featured, created_at, updated_at) "
                "VALUES (:id, :name, :slug, :icon, :desc, :sort, 1, :feat, datetime('now'), datetime('now'))"
            ), {'id': pid, 'name': name, 'slug': slug, 'icon': icon, 'desc': desc, 'sort': sort, 'feat': 1 if featured else 0})
        print("Added 5 new parent categories")

        # 2. Add subcategories for new parents
        count = 0
        for parent_slug, subs in new_subcategories.items():
            result = await db.execute(text("SELECT id FROM categories WHERE slug = :slug"), {'slug': parent_slug})
            row = result.first()
            if not row:
                print(f"Parent not found: {parent_slug}")
                continue
            pid = str(row[0])
            for i, name in enumerate(subs):
                sid = str(uuid.uuid4())
                slug = slugify(name)
                await db.execute(text(
                    "INSERT OR IGNORE INTO categories (id, name, slug, parent_id, sort_order, is_active, is_featured, created_at, updated_at) "
                    "VALUES (:id, :name, :slug, :pid, :sort, 1, 0, datetime('now'), datetime('now'))"
                ), {'id': sid, 'name': name, 'slug': slug, 'pid': pid, 'sort': i + 1})
                count += 1
        print(f"Added {count} subcategories for new parents")

        # 3. Add 5 more subcategories to existing 15 parents
        count = 0
        for parent_slug, subs in existing_extras.items():
            result = await db.execute(text("SELECT id FROM categories WHERE slug = :slug"), {'slug': parent_slug})
            row = result.first()
            if not row:
                print(f"Parent not found: {parent_slug}")
                continue
            pid = str(row[0])
            for i, name in enumerate(subs):
                sid = str(uuid.uuid4())
                slug = slugify(name)
                await db.execute(text(
                    "INSERT OR IGNORE INTO categories (id, name, slug, parent_id, sort_order, is_active, is_featured, created_at, updated_at) "
                    "VALUES (:id, :name, :slug, :pid, :sort, 1, 0, datetime('now'), datetime('now'))"
                ), {'id': sid, 'name': name, 'slug': slug, 'pid': pid, 'sort': i + 6})
                count += 1
        print(f"Added {count} extra subcategories to existing parents")

        await db.commit()
        print("\nDone! Final counts:")

        # Verify
        result = await db.execute(text("SELECT id, name, parent_id FROM categories ORDER BY parent_id NULLS FIRST, sort_order"))
        rows = result.fetchall()
        parents = [r for r in rows if r[2] is None]
        children = [r for r in rows if r[2] is not None]
        print(f"Total: {len(rows)} ({len(parents)} parents, {len(children)} children)")
        for p in parents:
            kids = [r for r in children if str(r[2]) == str(p[0])]
            print(f"  {p[1]}: {len(kids)} subcategories")


if __name__ == "__main__":
    asyncio.run(seed())
