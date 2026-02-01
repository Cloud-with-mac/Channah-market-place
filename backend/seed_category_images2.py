import asyncio
import sys
sys.path.insert(0, '.')
from app.core.database import AsyncSessionLocal
from sqlalchemy import text

category_images = {
    'laptops-computers': 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=200&h=200&fit=crop',
    'audio-equipment': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop',
    'cameras-photography': 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=200&h=200&fit=crop',
    'wearable-technology': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&h=200&fit=crop',
    'furniture': 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200&h=200&fit=crop',
    'kitchen-dining': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&h=200&fit=crop',
    'bedding-bath': 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=200&h=200&fit=crop',
    'garden-outdoor': 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=200&h=200&fit=crop',
    'hair-care': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200&h=200&fit=crop',
    'makeup-cosmetics': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200&h=200&fit=crop',
    'health-supplements': 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=200&h=200&fit=crop',
    'outdoor-recreation': 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=200&h=200&fit=crop',
    'car-parts-accessories': 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=200&h=200&fit=crop',
    'snacks-confectionery': 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=200&h=200&fit=crop',
    'spices-seasonings': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=200&h=200&fit=crop',
    'canned-packaged': 'https://images.unsplash.com/photo-1534483509719-8a40e3a22e63?w=200&h=200&fit=crop',
    'baby-gear-furniture': 'https://images.unsplash.com/photo-1586105449897-20b5efeb3233?w=200&h=200&fit=crop',
    'kids-education': 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=200&h=200&fit=crop',
    'non-fiction-books': 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200&h=200&fit=crop',
    'art-craft-supplies': 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=200&h=200&fit=crop',
    'journals-notebooks': 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=200&h=200&fit=crop',
    'fish-aquatics': 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=200&h=200&fit=crop',
    'industrial-materials': 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=200&h=200&fit=crop',
    'measuring-instruments': 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=200&h=200&fit=crop',
    'farming-equipment': 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=200&h=200&fit=crop',
    'fertilizers-soil': 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=200&h=200&fit=crop',
    'irrigation-systems': 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=200&h=200&fit=crop',
    'livestock-supplies': 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=200&h=200&fit=crop',
    'packaging-materials': 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=200&h=200&fit=crop',
    'printing-equipment': 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=200&h=200&fit=crop',
    'bags-pouches': 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=200&h=200&fit=crop',
    'boxes-cartons': 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=200&h=200&fit=crop',
    'cotton-fabrics': 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=200&h=200&fit=crop',
    'silk-satin': 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=200&h=200&fit=crop',
    'polyester-synthetic': 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=200&h=200&fit=crop',
    'yarn-thread': 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=200&h=200&fit=crop',
    'leather-fur': 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=200&h=200&fit=crop',
    'solar-equipment': 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=200&h=200&fit=crop',
    'mining-products': 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=200&h=200&fit=crop',
    'petroleum-products': 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=200&h=200&fit=crop',
    'natural-stones': 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=200&h=200&fit=crop',
    'metal-alloys': 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=200&h=200&fit=crop',
    'vintage-clothing': 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=200&h=200&fit=crop',
    'tennis-equipment': 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=200&h=200&fit=crop',
    'ev-accessories': 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=200&h=200&fit=crop',
    'snacks-chips': 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=200&h=200&fit=crop',
    'kids-room-decor': 'https://images.unsplash.com/photo-1586105449897-20b5efeb3233?w=200&h=200&fit=crop',
    'eco-packaging': 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=200&h=200&fit=crop',
}

async def seed():
    async with AsyncSessionLocal() as db:
        updated = 0
        for slug, image_url in category_images.items():
            result = await db.execute(
                text("UPDATE categories SET image_url = :url WHERE slug = :slug AND (image_url IS NULL OR image_url = '')"),
                {'url': image_url, 'slug': slug}
            )
            if result.rowcount > 0:
                updated += 1
        await db.commit()
        print(f"Updated {updated} more categories")

        result = await db.execute(
            text("SELECT COUNT(*) FROM categories WHERE image_url IS NULL OR image_url = ''")
        )
        remaining = result.scalar()
        print(f"Remaining without images: {remaining}")

if __name__ == "__main__":
    asyncio.run(seed())
