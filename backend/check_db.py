"""
Script to check database state
Run: python check_db.py
"""
import asyncio
from sqlalchemy import select, func
from app.core.database import AsyncSessionLocal
from app.models.category import Category
from app.models.product import Product
from app.models.vendor import Vendor
from app.models.user import User


async def check_database():
    async with AsyncSessionLocal() as db:
        print("=" * 50)
        print("DATABASE STATUS CHECK")
        print("=" * 50)

        # Count categories
        result = await db.execute(select(func.count(Category.id)))
        cat_count = result.scalar()
        print(f"\nCategories: {cat_count}")

        # List categories
        result = await db.execute(select(Category))
        categories = result.scalars().all()
        for cat in categories:
            print(f"  - {cat.name} (slug: {cat.slug}, active: {cat.is_active})")

        # Count products
        result = await db.execute(select(func.count(Product.id)))
        prod_count = result.scalar()
        print(f"\nProducts: {prod_count}")

        # Count vendors
        result = await db.execute(select(func.count(Vendor.id)))
        vendor_count = result.scalar()
        print(f"\nVendors: {vendor_count}")

        # Count users
        result = await db.execute(select(func.count(User.id)))
        user_count = result.scalar()
        print(f"\nUsers: {user_count}")

        print("\n" + "=" * 50)


if __name__ == "__main__":
    asyncio.run(check_database())
