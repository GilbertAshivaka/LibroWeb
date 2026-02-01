"""
Initialize database tables.
Run: python -m app.utils.init_db
"""
import asyncio
import sys

sys.path.insert(0, '.')

from app.database import engine, Base
from app.models import *  # Import all models


async def init_db():
    print("Creating database tables...")
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    print("✓ Database tables created successfully!")


if __name__ == "__main__":
    asyncio.run(init_db())
