"""
Core config - re-export from app.config for convenience.
"""
from app.config import settings, Settings, get_settings

__all__ = ["settings", "Settings", "get_settings"]
