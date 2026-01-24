"""
Script to clear all mock/dummy products from the database
Run: python clear_products.py
"""
import asyncio
from sqlalchemy import delete
from app.core.database import AsyncSessionLocal
from app.models.product import Product, ProductImage


async def clear_products():
    async with AsyncSessionLocal() as db:
        print("Clearing all products from database...")

        # First delete all product images
        result = await db.execute(delete(ProductImage))
        images_deleted = result.rowcount
        print(f"[OK] Deleted {images_deleted} product images")

        # Then delete all products
        result = await db.execute(delete(Product))
        products_deleted = result.rowcount
        print(f"[OK] Deleted {products_deleted} products")

        await db.commit()
        print("\n[SUCCESS] All mock products have been cleared!")
        print("Vendors can now upload their own products.")


if __name__ == "__main__":
    asyncio.run(clear_products())
