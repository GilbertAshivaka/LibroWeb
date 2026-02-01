"""
Audit log router.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import Optional
from datetime import datetime
from pydantic import BaseModel

from app.database import get_db
from app.models.audit_log import AuditLog
from app.routers.deps import get_current_user, require_super_admin
from app.models.admin_user import AdminUser

router = APIRouter(prefix="/audit", tags=["Audit Log"])


class AuditLogResponse(BaseModel):
    """Audit log entry response."""
    id: int
    admin_username: Optional[str]
    action: str
    entity_type: Optional[str]
    entity_id: Optional[int]
    old_values: Optional[dict]
    new_values: Optional[dict]
    ip_address: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


@router.get("/logs", response_model=dict)
async def get_audit_logs(
    page: int = 1,
    page_size: int = 50,
    action: Optional[str] = None,
    entity_type: Optional[str] = None,
    admin_user_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(require_super_admin)
):
    """
    Get audit logs (super admin only).
    """
    query = select(AuditLog).options(selectinload(AuditLog.admin_user))
    count_query = select(func.count(AuditLog.id))
    
    if action:
        query = query.where(AuditLog.action.ilike(f"%{action}%"))
        count_query = count_query.where(AuditLog.action.ilike(f"%{action}%"))
    
    if entity_type:
        query = query.where(AuditLog.entity_type == entity_type)
        count_query = count_query.where(AuditLog.entity_type == entity_type)
    
    if admin_user_id:
        query = query.where(AuditLog.admin_user_id == admin_user_id)
        count_query = count_query.where(AuditLog.admin_user_id == admin_user_id)
    
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    offset = (page - 1) * page_size
    query = query.order_by(AuditLog.created_at.desc())
    query = query.offset(offset).limit(page_size)
    
    result = await db.execute(query)
    logs = result.scalars().all()
    
    items = []
    for log in logs:
        items.append({
            "id": log.id,
            "admin_username": log.admin_user.username if log.admin_user else None,
            "action": log.action,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "old_values": log.old_values,
            "new_values": log.new_values,
            "ip_address": log.ip_address,
            "created_at": log.created_at
        })
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": (total + page_size - 1) // page_size
    }
