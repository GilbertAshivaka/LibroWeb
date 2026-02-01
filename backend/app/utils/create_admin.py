"""
Create initial admin user for Libro Web Platform.
Run: python -m app.utils.create_admin
"""
import asyncio
import sys
from getpass import getpass

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

sys.path.insert(0, '.')

from app.database import async_session_maker
from app.models.admin_user import AdminUser
from app.utils.security import get_password_hash


async def create_admin():
    print("\n=== Libro Web - Create Admin User ===\n")
    
    email = input("Email: ").strip()
    if not email:
        print("Error: Email is required")
        return
    
    password = getpass("Password: ")
    if len(password) < 8:
        print("Error: Password must be at least 8 characters")
        return
    
    password_confirm = getpass("Confirm Password: ")
    if password != password_confirm:
        print("Error: Passwords do not match")
        return
    
    full_name = input("Full Name (optional): ").strip() or None
    
    async with async_session_maker() as session:
        # Check if email exists
        result = await session.execute(
            select(AdminUser).where(AdminUser.email == email)
        )
        if result.scalar_one_or_none():
            print(f"Error: User with email '{email}' already exists")
            return
        
        # Create admin user
        admin = AdminUser(
            email=email,
            hashed_password=get_password_hash(password),
            full_name=full_name,
            role="super_admin",
            is_active=True,
        )
        session.add(admin)
        await session.commit()
        
        print(f"\n✓ Admin user created successfully!")
        print(f"  Email: {email}")
        print(f"  Role: Super Admin")
        print(f"\nYou can now login at the admin portal.\n")


if __name__ == "__main__":
    asyncio.run(create_admin())
