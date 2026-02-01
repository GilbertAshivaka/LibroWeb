"""
Release service for managing app downloads.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional
import os
import hashlib
import aiofiles
from app.models.app_release import AppRelease
from app.schemas.app_release import AppReleaseCreate, AppReleaseUpdate, VersionCheck
from app.config import settings


class ReleaseService:
    """Service for app release operations."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create(
        self, 
        data: AppReleaseCreate,
        file_name: str,
        file_path: str,
        file_size: int,
        checksum: Optional[str] = None
    ) -> AppRelease:
        """Create a new app release."""
        release = AppRelease(
            version=data.version,
            release_name=data.release_name,
            release_notes=data.release_notes,
            platform=data.platform,
            min_os_version=data.min_os_version,
            is_beta=data.is_beta,
            file_name=file_name,
            file_path=file_path,
            file_size=file_size,
            checksum_sha256=checksum,
        )
        self.db.add(release)
        await self.db.flush()
        await self.db.refresh(release)
        return release
    
    async def get_by_id(self, id: int) -> Optional[AppRelease]:
        """Get release by ID."""
        result = await self.db.execute(
            select(AppRelease).where(AppRelease.id == id)
        )
        return result.scalar_one_or_none()
    
    async def get_by_version(self, version: str) -> Optional[AppRelease]:
        """Get release by version."""
        result = await self.db.execute(
            select(AppRelease).where(AppRelease.version == version)
        )
        return result.scalar_one_or_none()
    
    async def get_latest(self, include_beta: bool = False) -> Optional[AppRelease]:
        """Get the latest release."""
        query = select(AppRelease).where(
            AppRelease.is_active == True,
            AppRelease.is_latest == True
        )
        
        if not include_beta:
            query = query.where(AppRelease.is_beta == False)
        
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
    
    async def get_all(
        self,
        page: int = 1,
        page_size: int = 20,
        is_active: Optional[bool] = None,
    ) -> tuple[list[AppRelease], int]:
        """Get paginated list of releases."""
        query = select(AppRelease)
        count_query = select(func.count(AppRelease.id))
        
        if is_active is not None:
            query = query.where(AppRelease.is_active == is_active)
            count_query = count_query.where(AppRelease.is_active == is_active)
        
        total_result = await self.db.execute(count_query)
        total = total_result.scalar()
        
        offset = (page - 1) * page_size
        query = query.order_by(AppRelease.release_date.desc())
        query = query.offset(offset).limit(page_size)
        
        result = await self.db.execute(query)
        releases = result.scalars().all()
        
        return list(releases), total
    
    async def update(self, id: int, data: AppReleaseUpdate) -> Optional[AppRelease]:
        """Update a release."""
        release = await self.get_by_id(id)
        if not release:
            return None
        
        update_data = data.model_dump(exclude_unset=True)
        
        # If setting as latest, unset other latest flags
        if update_data.get('is_latest'):
            await self.db.execute(
                select(AppRelease).where(AppRelease.is_latest == True)
            )
            # Unset all other is_latest
            result = await self.db.execute(
                select(AppRelease).where(
                    AppRelease.is_latest == True,
                    AppRelease.id != id
                )
            )
            for other in result.scalars().all():
                other.is_latest = False
        
        for field, value in update_data.items():
            setattr(release, field, value)
        
        await self.db.flush()
        await self.db.refresh(release)
        return release
    
    async def increment_download_count(self, id: int) -> None:
        """Increment the download count for a release."""
        release = await self.get_by_id(id)
        if release:
            release.download_count += 1
            await self.db.flush()
    
    async def check_version(self, current_version: str, include_beta: bool = False) -> Optional[VersionCheck]:
        """Check for updates (called by Qt app)."""
        latest = await self.get_latest(include_beta)
        
        if not latest:
            return None
        
        # Simple version comparison (could be enhanced)
        is_current_supported = True  # Could add logic to deprecate old versions
        
        return VersionCheck(
            latest_version=latest.version,
            current_version_supported=is_current_supported,
            download_url=f"/api/v1/downloads/file/{latest.version}",
            file_size=latest.file_size,
            checksum_sha256=latest.checksum_sha256,
            release_notes=latest.release_notes,
            is_mandatory_update=False
        )
    
    async def delete(self, id: int) -> bool:
        """Delete a release (also removes file)."""
        release = await self.get_by_id(id)
        if not release:
            return False
        
        # Remove file if exists
        full_path = os.path.join(settings.UPLOAD_DIR, release.file_path)
        if os.path.exists(full_path):
            os.remove(full_path)
        
        await self.db.delete(release)
        await self.db.flush()
        return True


async def calculate_file_checksum(file_path: str) -> str:
    """Calculate SHA256 checksum of a file."""
    sha256_hash = hashlib.sha256()
    async with aiofiles.open(file_path, "rb") as f:
        while chunk := await f.read(8192):
            sha256_hash.update(chunk)
    return sha256_hash.hexdigest()
