"""
Authentication service for admin portal.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from datetime import datetime, timezone
from app.models.admin_user import AdminUser, AdminRole
from app.schemas.admin_user import AdminUserCreate, Token, AdminUserResponse
from app.utils.security import hash_password, verify_password, create_access_token


class AuthService:
    """Service for authentication operations."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create_user(self, data: AdminUserCreate) -> AdminUser:
        """Create a new admin user."""
        user = AdminUser(
            username=data.username,
            email=data.email,
            password_hash=hash_password(data.password),
            full_name=data.full_name,
            role=data.role,
        )
        self.db.add(user)
        await self.db.flush()
        await self.db.refresh(user)
        return user
    
    async def get_user_by_username(self, username: str) -> Optional[AdminUser]:
        """Get user by username."""
        result = await self.db.execute(
            select(AdminUser).where(AdminUser.username == username)
        )
        return result.scalar_one_or_none()
    
    async def get_user_by_id(self, user_id: int) -> Optional[AdminUser]:
        """Get user by ID."""
        result = await self.db.execute(
            select(AdminUser).where(AdminUser.id == user_id)
        )
        return result.scalar_one_or_none()
    
    async def authenticate(self, username: str, password: str) -> Optional[Token]:
        """Authenticate a user and return a token."""
        user = await self.get_user_by_username(username)
        
        if not user:
            return None
        
        if not user.is_active:
            return None
        
        if not verify_password(password, user.password_hash):
            return None
        
        # Update last login
        user.last_login = datetime.now(timezone.utc)
        await self.db.flush()
        
        # Create access token
        token_data = {
            "sub": str(user.id),
            "username": user.username,
            "role": user.role.value,
        }
        access_token = create_access_token(token_data)
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            user=AdminUserResponse.model_validate(user)
        )
    
    async def get_all_users(self) -> list[AdminUser]:
        """Get all admin users."""
        result = await self.db.execute(
            select(AdminUser).order_by(AdminUser.created_at.desc())
        )
        return list(result.scalars().all())
    
    async def update_user(
        self, 
        user_id: int, 
        **kwargs
    ) -> Optional[AdminUser]:
        """Update an admin user."""
        user = await self.get_user_by_id(user_id)
        if not user:
            return None
        
        if 'password' in kwargs:
            kwargs['password_hash'] = hash_password(kwargs.pop('password'))
        
        for field, value in kwargs.items():
            if hasattr(user, field):
                setattr(user, field, value)
        
        await self.db.flush()
        await self.db.refresh(user)
        return user
    
    async def delete_user(self, user_id: int) -> bool:
        """Delete an admin user."""
        user = await self.get_user_by_id(user_id)
        if not user:
            return False
        
        await self.db.delete(user)
        await self.db.flush()
        return True


async def create_default_admin(db: AsyncSession):
    """Create a default super admin if none exists."""
    result = await db.execute(
        select(AdminUser).where(AdminUser.role == AdminRole.SUPER_ADMIN)
    )
    existing = result.scalar_one_or_none()
    
    if not existing:
        admin = AdminUser(
            username="admin",
            email="admin@libro.local",
            password_hash=hash_password("admin123"),  # Change in production!
            full_name="System Administrator",
            role=AdminRole.SUPER_ADMIN,
        )
        db.add(admin)
        await db.commit()
        print("Default admin created: username='admin', password='admin123'")
