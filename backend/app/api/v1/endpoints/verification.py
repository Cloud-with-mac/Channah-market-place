from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.core.security import get_current_user, get_current_vendor, get_current_admin
from app.models.user import User
from app.models.vendor import Vendor
from app.models.verification import VerificationApplication, VerificationDocument

router = APIRouter()


# ============ Pydantic Schemas ============

VALID_BADGE_LEVELS = {"BRONZE", "SILVER", "GOLD"}
VALID_APPLICATION_STATUSES = {"PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"}
VALID_DOCUMENT_TYPES = {
    "BUSINESS_LICENSE", "TAX_CERTIFICATE", "INCORPORATION",
    "ID_PROOF", "ADDRESS_PROOF", "BANK_STATEMENT"
}

BADGE_TRUST_SCORES = {
    "BRONZE": 40,
    "SILVER": 70,
    "GOLD": 100,
}


class VerificationApplyRequest(BaseModel):
    badge_level: str = Field(..., description="BRONZE, SILVER, or GOLD")


class VerificationDocumentCreate(BaseModel):
    application_id: str
    document_type: str = Field(..., description="BUSINESS_LICENSE, TAX_CERTIFICATE, INCORPORATION, ID_PROOF, ADDRESS_PROOF, BANK_STATEMENT")
    file_url: str
    file_name: str


class ReviewApplicationRequest(BaseModel):
    status: str = Field(..., description="APPROVED or REJECTED")
    reviewer_notes: Optional[str] = None


class VerificationDocumentResponse(BaseModel):
    id: str
    document_type: str
    file_url: str
    file_name: str
    status: str
    notes: Optional[str]
    created_at: str


class VerificationApplicationResponse(BaseModel):
    id: str
    vendor_id: str
    badge_level: str
    status: str
    reviewer_notes: Optional[str]
    reviewed_by: Optional[str]
    reviewed_at: Optional[str]
    created_at: str
    updated_at: str
    documents: List[VerificationDocumentResponse] = []


class VendorBadgeResponse(BaseModel):
    vendor_id: str
    business_name: str
    badge_level: Optional[str]
    trust_score: int
    verification_status: str
    verified_at: Optional[str]


# ============ Helper ============

def _application_to_response(app: VerificationApplication) -> dict:
    return {
        "id": str(app.id),
        "vendor_id": str(app.vendor_id),
        "badge_level": app.badge_level,
        "status": app.status,
        "reviewer_notes": app.reviewer_notes,
        "reviewed_by": str(app.reviewed_by) if app.reviewed_by else None,
        "reviewed_at": app.reviewed_at.isoformat() if app.reviewed_at else None,
        "created_at": app.created_at.isoformat(),
        "updated_at": app.updated_at.isoformat(),
        "documents": [
            {
                "id": str(doc.id),
                "document_type": doc.document_type,
                "file_url": doc.file_url,
                "file_name": doc.file_name,
                "status": doc.status,
                "notes": doc.notes,
                "created_at": doc.created_at.isoformat(),
            }
            for doc in (app.documents or [])
        ],
    }


# ============ Vendor Endpoints ============

@router.post("/apply", response_model=VerificationApplicationResponse, status_code=status.HTTP_201_CREATED)
async def apply_for_verification(
    data: VerificationApplyRequest,
    current_user: User = Depends(get_current_vendor),
    db: AsyncSession = Depends(get_db),
):
    """Vendor submits a verification application for a badge level."""
    badge = data.badge_level.upper()
    if badge not in VALID_BADGE_LEVELS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid badge level. Must be one of: {', '.join(VALID_BADGE_LEVELS)}"
        )

    # Get vendor
    result = await db.execute(select(Vendor).where(Vendor.user_id == current_user.id))
    vendor = result.scalar_one_or_none()
    if not vendor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vendor profile not found")

    # Check for existing pending/under-review application
    result = await db.execute(
        select(VerificationApplication).where(
            VerificationApplication.vendor_id == vendor.id,
            VerificationApplication.status.in_(["PENDING", "UNDER_REVIEW"]),
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have a pending verification application"
        )

    application = VerificationApplication(
        vendor_id=vendor.id,
        badge_level=badge,
        status="PENDING",
    )
    db.add(application)

    # Update vendor verification_status to PENDING
    vendor.verification_status = "PENDING"

    await db.commit()
    await db.refresh(application)

    # Eagerly load documents for response
    result = await db.execute(
        select(VerificationApplication)
        .where(VerificationApplication.id == application.id)
        .options(selectinload(VerificationApplication.documents))
    )
    application = result.scalar_one()

    return _application_to_response(application)


@router.get("/status")
async def get_verification_status(
    current_user: User = Depends(get_current_vendor),
    db: AsyncSession = Depends(get_db),
):
    """Get current vendor's verification status and badge info."""
    result = await db.execute(select(Vendor).where(Vendor.user_id == current_user.id))
    vendor = result.scalar_one_or_none()
    if not vendor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vendor profile not found")

    # Get latest application
    result = await db.execute(
        select(VerificationApplication)
        .where(VerificationApplication.vendor_id == vendor.id)
        .options(selectinload(VerificationApplication.documents))
        .order_by(VerificationApplication.created_at.desc())
        .limit(1)
    )
    latest_app = result.scalar_one_or_none()

    return {
        "vendor_id": str(vendor.id),
        "badge_level": vendor.badge_level,
        "trust_score": vendor.trust_score,
        "verification_status": vendor.verification_status,
        "verified_at": vendor.verified_at.isoformat() if vendor.verified_at else None,
        "latest_application": _application_to_response(latest_app) if latest_app else None,
    }


@router.post("/documents", response_model=VerificationDocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_verification_document(
    data: VerificationDocumentCreate,
    current_user: User = Depends(get_current_vendor),
    db: AsyncSession = Depends(get_db),
):
    """Add a verification document to an application (URL-based; actual upload handled elsewhere)."""
    doc_type = data.document_type.upper()
    if doc_type not in VALID_DOCUMENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid document type. Must be one of: {', '.join(VALID_DOCUMENT_TYPES)}"
        )

    # Get vendor
    result = await db.execute(select(Vendor).where(Vendor.user_id == current_user.id))
    vendor = result.scalar_one_or_none()
    if not vendor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vendor profile not found")

    # Verify the application belongs to this vendor and is still open
    result = await db.execute(
        select(VerificationApplication).where(
            VerificationApplication.id == data.application_id,
            VerificationApplication.vendor_id == vendor.id,
            VerificationApplication.status.in_(["PENDING", "UNDER_REVIEW"]),
        )
    )
    application = result.scalar_one_or_none()
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found or already closed"
        )

    document = VerificationDocument(
        application_id=application.id,
        document_type=doc_type,
        file_url=data.file_url,
        file_name=data.file_name,
        status="PENDING",
    )
    db.add(document)
    await db.commit()
    await db.refresh(document)

    return {
        "id": str(document.id),
        "document_type": document.document_type,
        "file_url": document.file_url,
        "file_name": document.file_name,
        "status": document.status,
        "notes": document.notes,
        "created_at": document.created_at.isoformat(),
    }


# ============ Admin Endpoints ============

@router.get("/applications", response_model=List[VerificationApplicationResponse])
async def list_verification_applications(
    status_filter: Optional[str] = Query(default=None, alias="status"),
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin: list all verification applications."""
    query = select(VerificationApplication).options(selectinload(VerificationApplication.documents))

    if status_filter:
        query = query.where(VerificationApplication.status == status_filter.upper())

    query = query.order_by(VerificationApplication.created_at.desc()).offset(skip).limit(limit)

    result = await db.execute(query)
    applications = result.scalars().all()

    return [_application_to_response(app) for app in applications]


@router.put("/applications/{application_id}/review", response_model=VerificationApplicationResponse)
async def review_application(
    application_id: str,
    data: ReviewApplicationRequest,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin: approve or reject a verification application."""
    review_status = data.status.upper()
    if review_status not in {"APPROVED", "REJECTED"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Status must be APPROVED or REJECTED"
        )

    result = await db.execute(
        select(VerificationApplication)
        .where(VerificationApplication.id == application_id)
        .options(selectinload(VerificationApplication.documents))
    )
    application = result.scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    if application.status not in ("PENDING", "UNDER_REVIEW"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Application has already been reviewed"
        )

    # Update application
    application.status = review_status
    application.reviewer_notes = data.reviewer_notes
    application.reviewed_by = current_user.id
    application.reviewed_at = datetime.utcnow()

    # If approved, update vendor badge and trust info
    if review_status == "APPROVED":
        result = await db.execute(select(Vendor).where(Vendor.id == application.vendor_id))
        vendor = result.scalar_one_or_none()
        if vendor:
            vendor.badge_level = application.badge_level
            vendor.trust_score = BADGE_TRUST_SCORES.get(application.badge_level, 0)
            vendor.verification_status = "VERIFIED"
            vendor.verified_at = datetime.utcnow()
    elif review_status == "REJECTED":
        result = await db.execute(select(Vendor).where(Vendor.id == application.vendor_id))
        vendor = result.scalar_one_or_none()
        if vendor and vendor.verification_status == "PENDING":
            vendor.verification_status = "UNVERIFIED"

    await db.commit()
    await db.refresh(application)

    return _application_to_response(application)


# ============ Public Endpoints ============

@router.get("/vendors/{vendor_id}/badge", response_model=VendorBadgeResponse)
async def get_vendor_badge(
    vendor_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Public: get a vendor's badge and trust information."""
    from uuid import UUID as PyUUID

    vendor = None
    try:
        vid = PyUUID(vendor_id)
        result = await db.execute(select(Vendor).where(Vendor.id == vid))
        vendor = result.scalar_one_or_none()
    except (ValueError, AttributeError):
        pass

    if not vendor:
        result = await db.execute(select(Vendor).where(Vendor.slug == vendor_id))
        vendor = result.scalar_one_or_none()

    if not vendor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vendor not found")

    return {
        "vendor_id": str(vendor.id),
        "business_name": vendor.business_name,
        "badge_level": vendor.badge_level,
        "trust_score": vendor.trust_score,
        "verification_status": vendor.verification_status,
        "verified_at": vendor.verified_at.isoformat() if vendor.verified_at else None,
    }
