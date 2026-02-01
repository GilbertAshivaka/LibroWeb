"""
Admin users router.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.admin_user import AdminUserCreate, AdminUserUpdate, AdminUserResponse
from app.services.auth_service import AuthService
from app.routers.deps import get_current_user, require_super_admin
from app.models.admin_user import AdminUser

router = APIRouter(prefix="/admin-users", tags=["Admin Users"])


@router.get("/", response_model=list[AdminUserResponse])
async def list_admin_users(
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(require_super_admin)
):
    """
    List all admin users (super admin only).
    """
    auth_service = AuthService(db)
    users = await auth_service.get_all_users()
    return [AdminUserResponse.model_validate(u) for u in users]


@router.post("/", response_model=AdminUserResponse, status_code=status.HTTP_201_CREATED)
async def create_admin_user(
    data: AdminUserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(require_super_admin)
):
    """
    Create a new admin user (super admin only).
    """
    auth_service = AuthService(db)
    
    # Check if username exists
    existing = await auth_service.get_user_by_username(data.username)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )
    
    user = await auth_service.create_user(data)
    return AdminUserResponse.model_validate(user)


@router.get("/{user_id}", response_model=AdminUserResponse)
async def get_admin_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(require_super_admin)
):
    """
    Get admin user by ID (super admin only).
    """
    auth_service = AuthService(db)
    user = await auth_service.get_user_by_id(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return AdminUserResponse.model_validate(user)


@router.patch("/{user_id}", response_model=AdminUserResponse)
async def update_admin_user(
    user_id: int,
    data: AdminUserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(require_super_admin)
):
    """
    Update an admin user (super admin only).
    """
    auth_service = AuthService(db)
    
    update_data = data.model_dump(exclude_unset=True)
    user = await auth_service.update_user(user_id, **update_data)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return AdminUserResponse.model_validate(user)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_admin_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(require_super_admin)
):
    """
    Delete an admin user (super admin only).
    Cannot delete yourself.
    """
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    auth_service = AuthService(db)
    deleted = await auth_service.delete_user(user_id)
    
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
