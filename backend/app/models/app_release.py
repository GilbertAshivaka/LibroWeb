"""
App release model for managing Libro desktop app downloads.
"""
from sqlalchemy import Column, Integer, String, Text, Boolean, BigInteger, DateTime
from sqlalchemy.sql import func
from app.database import Base


class AppRelease(Base):
    """Libro desktop app release for downloads."""
    
    __tablename__ = "app_releases"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    version = Column(String(20), unique=True, nullable=False, index=True)  # e.g., "1.0.0", "2.1.0-beta"
    release_name = Column(String(255))  # e.g., "Libro 2.1 - Aurora Release"
    release_notes = Column(Text)
    file_name = Column(String(255), nullable=False)  # e.g., "Libro-2.1.0-Setup.exe"
    file_path = Column(String(500), nullable=False)  # Relative path in uploads dir
    file_size = Column(BigInteger, nullable=False)  # Size in bytes
    checksum_sha256 = Column(String(64))  # SHA256 hash for integrity
    platform = Column(String(20), default="windows")  # 'windows', 'macos', 'linux'
    min_os_version = Column(String(20))  # e.g., "Windows 10"
    is_latest = Column(Boolean, default=False)
    is_beta = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    download_count = Column(Integer, default=0)
    release_date = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<AppRelease {self.version}>"
