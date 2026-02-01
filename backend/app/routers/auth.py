"""
Authentication router.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.admin_user import AdminUserLogin, Token, AdminUserResponse
from app.services.auth_service import AuthService
from app.routers.deps import get_current_user
from app.models.admin_user import AdminUser

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=Token)
async def login(
    data: AdminUserLogin,
    db: AsyncSession = Depends(get_db)
):
    """
    Authenticate admin user and return JWT token.
    """
    auth_service = AuthService(db)
    token = await auth_service.authenticate(data.username, data.password)
    
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return token


@router.get("/me", response_model=AdminUserResponse)
async def get_current_user_info(
    current_user: AdminUser = Depends(get_current_user)
):
    """
    Get current authenticated user information.
    """
    return AdminUserResponse.model_validate(current_user)


@router.post("/logout")
async def logout(
    current_user: AdminUser = Depends(get_current_user)
):
    """
    Logout current user (client should discard the token).
    """
    # In a stateless JWT setup, we just return success
    # Client is responsible for discarding the token
    return {"message": "Successfully logged out"}
