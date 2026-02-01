"""
Authentication dependencies.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.database import get_db
from app.utils.security import decode_access_token
from app.models.admin_user import AdminUser, AdminRole
from app.services.auth_service import AuthService

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> AdminUser:
    """Get current authenticated user from JWT token."""
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )
    
    auth_service = AuthService(db)
    user = await auth_service.get_user_by_id(int(user_id))
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled",
        )
    
    return user


async def get_current_active_user(
    current_user: AdminUser = Depends(get_current_user)
) -> AdminUser:
    """Ensure user is active."""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    return current_user


def require_role(*roles: AdminRole):
    """Dependency factory to require specific roles."""
    async def role_checker(
        current_user: AdminUser = Depends(get_current_user)
    ) -> AdminUser:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires one of roles: {[r.value for r in roles]}"
            )
        return current_user
    return role_checker


# Convenience dependencies
require_admin = require_role(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
require_super_admin = require_role(AdminRole.SUPER_ADMIN)
