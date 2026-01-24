"""
Check categories in detail
"""
import asyncio
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.category import Category


async def check_categories():
    async with AsyncSessionLocal() as db:
        print("=" * 60)
        print("DETAILED CATEGORY CHECK")
        print("=" * 60)

        result = await db.execute(select(Category))
        categories = result.scalars().all()

        for cat in categories:
            print(f"\nCategory: {cat.name}")
            print(f"  ID: {cat.id}")
            print(f"  Slug: {cat.slug}")
            print(f"  Parent ID: {cat.parent_id}")
            print(f"  Is Active: {cat.is_active}")
            print(f"  Is Featured: {cat.is_featured}")

        # Count top-level categories
        result = await db.execute(
            select(Category).where(Category.parent_id == None, Category.is_active == True)
        )
        top_level = result.scalars().all()
        print(f"\n\nTop-level active categories (parent_id=None): {len(top_level)}")
        for cat in top_level:
            print(f"  - {cat.name}")


if __name__ == "__main__":
    asyncio.run(check_categories())
