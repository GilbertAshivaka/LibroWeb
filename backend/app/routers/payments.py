"""
Payments router.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional
from app.database import get_db
from app.models.payment import Payment, PaymentStatus
from app.schemas.payment import PaymentCreate, PaymentUpdate, PaymentResponse
from app.routers.deps import get_current_user, require_admin
from app.models.admin_user import AdminUser

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.get("/", response_model=dict)
async def list_payments(
    page: int = 1,
    page_size: int = 20,
    organization_id: Optional[int] = None,
    status_filter: Optional[PaymentStatus] = None,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """
    List all payments with pagination.
    """
    query = select(Payment)
    count_query = select(func.count(Payment.id))
    
    if organization_id:
        query = query.where(Payment.organization_id == organization_id)
        count_query = count_query.where(Payment.organization_id == organization_id)
    
    if status_filter:
        query = query.where(Payment.status == status_filter)
        count_query = count_query.where(Payment.status == status_filter)
    
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    offset = (page - 1) * page_size
    query = query.order_by(Payment.payment_date.desc())
    query = query.offset(offset).limit(page_size)
    
    result = await db.execute(query)
    payments = result.scalars().all()
    
    return {
        "items": [PaymentResponse.model_validate(p) for p in payments],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": (total + page_size - 1) // page_size
    }


@router.post("/", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
async def record_payment(
    data: PaymentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(require_admin)
):
    """
    Record a new payment (admin only).
    """
    payment = Payment(
        organization_id=data.organization_id,
        license_id=data.license_id,
        amount=data.amount,
        currency=data.currency,
        payment_method=data.payment_method,
        transaction_id=data.transaction_id,
        status=data.status,
        notes=data.notes,
    )
    db.add(payment)
    await db.flush()
    await db.refresh(payment)
    return PaymentResponse.model_validate(payment)


@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment(
    payment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(get_current_user)
):
    """
    Get payment by ID.
    """
    result = await db.execute(
        select(Payment).where(Payment.id == payment_id)
    )
    payment = result.scalar_one_or_none()
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    
    return PaymentResponse.model_validate(payment)


@router.patch("/{payment_id}", response_model=PaymentResponse)
async def update_payment(
    payment_id: int,
    data: PaymentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(require_admin)
):
    """
    Update a payment record (admin only).
    """
    result = await db.execute(
        select(Payment).where(Payment.id == payment_id)
    )
    payment = result.scalar_one_or_none()
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(payment, field, value)
    
    await db.flush()
    await db.refresh(payment)
    return PaymentResponse.model_validate(payment)
