import asyncio
import hashlib
import sys
sys.path.insert(0, '.')
from app.core.database import AsyncSessionLocal
from sqlalchemy import text


async def fix():
    async with AsyncSessionLocal() as db:
        # Get all categories
        result = await db.execute(text("SELECT id, slug, name FROM categories"))
        rows = result.fetchall()

        updated = 0
        for row in rows:
            cat_id, slug, name = row
            # Generate a consistent seed number from the slug
            seed = int(hashlib.md5(slug.encode()).hexdigest()[:8], 16) % 1000
            image_url = f"https://picsum.photos/seed/{slug}/200/200"

            await db.execute(
                text("UPDATE categories SET image_url = :url WHERE id = :id"),
                {'url': image_url, 'id': cat_id}
            )
            updated += 1

        await db.commit()
        print(f"Updated {updated} categories with picsum.photos images")


if __name__ == "__main__":
    asyncio.run(fix())
