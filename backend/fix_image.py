import asyncio
import sys
sys.path.insert(0, '.')
from app.core.database import AsyncSessionLocal
from sqlalchemy import text

async def fix():
    async with AsyncSessionLocal() as db:
        await db.execute(
            text("UPDATE categories SET image_url = :url WHERE slug = 'men-clothing'"),
            {'url': 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=200&h=200&fit=crop'}
        )
        await db.commit()
        print("Fixed men-clothing image URL")

if __name__ == "__main__":
    asyncio.run(fix())
