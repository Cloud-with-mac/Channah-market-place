#!/usr/bin/env python
"""Script to create users with different roles"""
import asyncio
import sys
sys.path.insert(0, '.')

from app.core.database import AsyncSessionLocal
from app.core.security import get_password_hash
from app.models.user import User, UserRole, AuthProvider
from sqlalchemy import select


async def create_user(
    email: str,
    password: str,
    first_name: str = "New",
    last_name: str = "User",
    role: str = "admin"
):
    """Create a user with specified role"""
    # Map role string to enum
    role_map = {
        "admin": UserRole.ADMIN,
        "vendor": UserRole.VENDOR,
        "customer": UserRole.CUSTOMER,
    }

    if role.lower() not in role_map:
        print(f"Invalid role: {role}. Use: admin, vendor, or customer")
        return

    user_role = role_map[role.lower()]

    async with AsyncSessionLocal() as db:
        # Check if user already exists
        result = await db.execute(select(User).where(User.email == email))
        existing_user = result.scalar_one_or_none()

        if existing_user:
            print(f"User already exists: {email}")
            update = input("Update password and role? (y/n): ").strip().lower()
            if update == 'y':
                existing_user.password_hash = get_password_hash(password)
                existing_user.role = user_role
                existing_user.is_active = True
                existing_user.is_verified = True
                await db.commit()
                print(f"User updated: {email} (role: {role})")
            return

        # Create new user
        user = User(
            email=email,
            password_hash=get_password_hash(password),
            first_name=first_name,
            last_name=last_name,
            role=user_role,
            auth_provider=AuthProvider.LOCAL,
            is_active=True,
            is_verified=True,
        )
        db.add(user)
        await db.commit()

        print(f"\n{'='*50}")
        print("User created successfully!")
        print(f"{'='*50}")
        print(f"Email:    {email}")
        print(f"Password: {password}")
        print(f"Role:     {role}")
        print(f"{'='*50}")


def main():
    print("\n=== Create New User ===\n")

    email = input("Email: ").strip()
    if not email:
        print("Email is required")
        return

    password = input("Password (min 8 chars, uppercase, lowercase, digit): ").strip()
    if len(password) < 8:
        print("Password must be at least 8 characters")
        return

    first_name = input("First Name [New]: ").strip() or "New"
    last_name = input("Last Name [User]: ").strip() or "User"
    role = input("Role (admin/vendor/customer) [admin]: ").strip() or "admin"

    asyncio.run(create_user(email, password, first_name, last_name, role))


if __name__ == "__main__":
    if len(sys.argv) >= 3:
        # Command line mode: python create_user.py email password [first_name] [last_name] [role]
        email = sys.argv[1]
        password = sys.argv[2]
        first_name = sys.argv[3] if len(sys.argv) > 3 else "New"
        last_name = sys.argv[4] if len(sys.argv) > 4 else "User"
        role = sys.argv[5] if len(sys.argv) > 5 else "admin"
        asyncio.run(create_user(email, password, first_name, last_name, role))
    else:
        # Interactive mode
        main()
