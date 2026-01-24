"""
Script to create an admin user for the marketplace
Run: python create_admin.py
"""
import asyncio
from sqlalchemy import select
from app.core.database import engine, AsyncSessionLocal
from app.core.security import get_password_hash
from app.models.user import User, UserRole, AuthProvider


async def create_admin_user():
    async with AsyncSessionLocal() as db:
        # Check if admin exists
        result = await db.execute(
            select(User).where(User.email == "admin@markethub.com")
        )
        existing_admin = result.scalar_one_or_none()

        if existing_admin:
            print(f"Admin user already exists: {existing_admin.email}")
            print(f"Role: {existing_admin.role}")
            return

        # Create admin user
        admin = User(
            email="admin@markethub.com",
            password_hash=get_password_hash("admin123"),
            first_name="Admin",
            last_name="User",
            role=UserRole.ADMIN,
            auth_provider=AuthProvider.LOCAL,
            is_active=True,
            is_verified=True,
        )
        db.add(admin)
        await db.commit()

        print("Admin user created successfully!")
        print("Email: admin@markethub.com")
        print("Password: admin123")
        print("Role: admin")


if __name__ == "__main__":
    asyncio.run(create_admin_user())
