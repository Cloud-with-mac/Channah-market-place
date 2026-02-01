import asyncio
import sys
sys.path.insert(0, '.')
from app.core.database import AsyncSessionLocal
from sqlalchemy import text

async def check():
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            text("SELECT slug, image_url FROM categories WHERE image_url LIKE '%localhost%' OR image_url LIKE '%_next%'")
        )
        rows = result.fetchall()
        print(f"Categories with bad image URLs: {len(rows)}")
        for r in rows:
            print(f"  {r[0]}: {r[1][:80]}...")

if __name__ == "__main__":
    asyncio.run(check())
