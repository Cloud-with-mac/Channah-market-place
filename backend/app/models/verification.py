import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.types import GUID


class VerificationApplication(Base):
    __tablename__ = "verification_applications"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    vendor_id = Column(GUID(), ForeignKey("vendors.id", ondelete="CASCADE"), nullable=False)

    # What badge level the vendor is applying for
    badge_level = Column(String(20), nullable=False)  # BRONZE, SILVER, GOLD

    # Application status
    status = Column(String(20), default="PENDING", nullable=False)  # PENDING, UNDER_REVIEW, APPROVED, REJECTED

    # Review info
    reviewer_notes = Column(Text, nullable=True)
    reviewed_by = Column(GUID(), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    vendor = relationship("Vendor", backref="verification_applications")
    reviewer = relationship("User", foreign_keys=[reviewed_by])
    documents = relationship("VerificationDocument", back_populates="application", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<VerificationApplication {self.id} - {self.badge_level} - {self.status}>"


class VerificationDocument(Base):
    __tablename__ = "verification_documents"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    application_id = Column(GUID(), ForeignKey("verification_applications.id", ondelete="CASCADE"), nullable=False)

    # Document details
    document_type = Column(String(50), nullable=False)  # BUSINESS_LICENSE, TAX_CERTIFICATE, INCORPORATION, ID_PROOF, ADDRESS_PROOF, BANK_STATEMENT
    file_url = Column(String(500), nullable=False)
    file_name = Column(String(255), nullable=False)

    # Document review status
    status = Column(String(20), default="PENDING", nullable=False)  # PENDING, VERIFIED, REJECTED
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    application = relationship("VerificationApplication", back_populates="documents")

    def __repr__(self):
        return f"<VerificationDocument {self.id} - {self.document_type}>"
