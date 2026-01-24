"""
Script to clear all users from the database.
Run this from the backend directory: python clear_users.py
Works with both SQLite and PostgreSQL.
"""
import asyncio
from sqlalchemy import text
from app.core.database import engine


async def clear_users():
    """Clear all users and related data from the database."""
    print("Connecting to database...")

    try:
        async with engine.begin() as conn:
            print("Connected! Clearing data...\n")

            # Delete in order due to foreign key constraints
            tables_to_clear = [
                ("cart_items", "cart items"),
                ("carts", "carts"),
                ("wishlists", "wishlists"),
                ("notifications", "notifications"),
                ("reviews", "reviews"),
                ("order_items", "order items"),
                ("order_status_history", "order status history"),
                ("payments", "payments"),
                ("orders", "orders"),
                ("addresses", "addresses"),
                ("payment_methods", "payment methods"),
                ("messages", "messages"),
                ("conversations", "conversations"),
                ("vendor_payouts", "vendor payouts"),
                ("product_attributes", "product attributes"),
                ("product_images", "product images"),
                ("product_variants", "product variants"),
                ("products", "products"),
                ("vendors", "vendors"),
                ("categories", "categories"),
                ("users", "users"),
            ]

            for table_name, display_name in tables_to_clear:
                try:
                    await conn.execute(text(f"DELETE FROM {table_name}"))
                    print(f"  Cleared {display_name}")
                except Exception as e:
                    if "no such table" in str(e).lower() or "does not exist" in str(e).lower():
                        print(f"  Skipped {display_name} (table doesn't exist)")
                    else:
                        print(f"  Warning: Could not clear {display_name}: {e}")

        print("\nDatabase cleared successfully!")

    except Exception as e:
        print(f"\nError: {e}")
        print("\nMake sure your .env file has the correct DATABASE_URL")


if __name__ == "__main__":
    print("Clearing all data from database...\n")
    asyncio.run(clear_users())
