"""
Downloads router - handles app releases and file downloads.
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import StreamingResponse, FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import os
import aiofiles
import hashlib
from app.database import get_db
from app.schemas.app_release import (
    AppReleaseCreate, AppReleaseUpdate, AppReleaseResponse, AppReleasePublic, VersionCheck
)
from app.services.release_service import ReleaseService, calculate_file_checksum
from app.routers.deps import get_current_user, require_admin
from app.models.admin_user import AdminUser
from app.config import settings

router = APIRouter(prefix="/downloads", tags=["Downloads"])

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(os.path.join(settings.UPLOAD_DIR, "releases"), exist_ok=True)


# ============================================
# Public Endpoints (No Auth Required)
# ============================================

@router.get("/latest", response_model=AppReleasePublic)
async def get_latest_release(
    include_beta: bool = False,
    db: AsyncSession = Depends(get_db)
):
    """
    Get the latest release information for download page.
    No authentication required.
    """
    release_service = ReleaseService(db)
    release = await release_service.get_latest(include_beta=include_beta)
    
    if not release:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No releases available"
        )
    
    return AppReleasePublic.model_validate(release)


@router.get("/check-version", response_model=VersionCheck)
async def check_version(
    current_version: str,
    include_beta: bool = False,
    db: AsyncSession = Depends(get_db)
):
    """
    Check for updates (called by Qt app).
    Returns latest version info and download URL.
    """
    release_service = ReleaseService(db)
    version_info = await release_service.check_version(
        current_version=current_version,
        include_beta=include_beta
    )
    
    if not version_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No releases available"
        )
    
    return version_info


@router.get("/file/{version}")
async def download_file(
    version: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Download the installer file for a specific version.
    Supports HTTP Range requests for resume capability.
    No authentication required.
    """
    release_service = ReleaseService(db)
    release = await release_service.get_by_version(version)
    
    if not release or not release.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Release not found"
        )
    
    file_path = os.path.join(settings.UPLOAD_DIR, release.file_path)
    
    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found on server"
        )
    
    # Increment download count
    await release_service.increment_download_count(release.id)
    
    # Return file with proper headers for resume support
    return FileResponse(
        path=file_path,
        filename=release.file_name,
        media_type="application/octet-stream",
        headers={
            "Accept-Ranges": "bytes",
            "Content-Disposition": f'attachment; filename="{release.file_name}"',
            "X-Checksum-SHA256": release.checksum_sha256 or "",
        }
    )


# ============================================
# Admin Endpoints (Auth Required)
# ============================================

@router.get("/", response_model=dict)
async def list_releases(
    page: int = 1,
    page_size: int = 20,
    is_active: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """
    List all releases (admin view).
    """
    release_service = ReleaseService(db)
    releases, total = await release_service.get_all(
        page=page,
        page_size=page_size,
        is_active=is_active
    )
    
    return {
        "items": [AppReleaseResponse.model_validate(r) for r in releases],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": (total + page_size - 1) // page_size
    }


@router.post("/", response_model=AppReleaseResponse, status_code=status.HTTP_201_CREATED)
async def create_release(
    version: str = Form(...),
    release_name: Optional[str] = Form(None),
    release_notes: Optional[str] = Form(None),
    platform: str = Form("windows"),
    min_os_version: Optional[str] = Form(None),
    is_beta: bool = Form(False),
    is_latest: bool = Form(False),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(require_admin)
):
    """
    Upload a new app release (admin only).
    Handles large file uploads with streaming.
    """
    # Check if version already exists
    release_service = ReleaseService(db)
    existing = await release_service.get_by_version(version)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Release version {version} already exists"
        )
    
    # Save file
    file_name = file.filename or f"Libro-{version}-Setup.exe"
    safe_version = version.replace(".", "-")
    file_path = f"releases/{safe_version}/{file_name}"
    full_path = os.path.join(settings.UPLOAD_DIR, file_path)
    
    # Create directory
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    
    # Stream file to disk with checksum calculation
    sha256_hash = hashlib.sha256()
    file_size = 0
    
    async with aiofiles.open(full_path, 'wb') as out_file:
        while chunk := await file.read(1024 * 1024):  # 1MB chunks
            await out_file.write(chunk)
            sha256_hash.update(chunk)
            file_size += len(chunk)
    
    checksum = sha256_hash.hexdigest()
    
    # Create release data
    release_data = AppReleaseCreate(
        version=version,
        release_name=release_name,
        release_notes=release_notes,
        platform=platform,
        min_os_version=min_os_version,
        is_beta=is_beta
    )
    
    # If setting as latest, update the release after creation
    release = await release_service.create(
        data=release_data,
        file_name=file_name,
        file_path=file_path,
        file_size=file_size,
        checksum=checksum
    )
    
    if is_latest:
        await release_service.update(release.id, AppReleaseUpdate(is_latest=True))
        await db.refresh(release)
    
    return AppReleaseResponse.model_validate(release)


@router.get("/{release_id}", response_model=AppReleaseResponse)
async def get_release(
    release_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """
    Get a specific release by ID.
    """
    release_service = ReleaseService(db)
    release = await release_service.get_by_id(release_id)
    
    if not release:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Release not found"
        )
    
    return AppReleaseResponse.model_validate(release)


@router.patch("/{release_id}", response_model=AppReleaseResponse)
async def update_release(
    release_id: int,
    data: AppReleaseUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(require_admin)
):
    """
    Update a release (admin only).
    """
    release_service = ReleaseService(db)
    release = await release_service.update(release_id, data)
    
    if not release:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Release not found"
        )
    
    return AppReleaseResponse.model_validate(release)


@router.delete("/{release_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_release(
    release_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(require_admin)
):
    """
    Delete a release and its file (admin only).
    """
    release_service = ReleaseService(db)
    deleted = await release_service.delete(release_id)
    
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Release not found"
        )
