"""SQLAlchemy ORM models: Scan and Detection."""
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Scan(Base):
    __tablename__ = "scans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    filename: Mapped[str] = mapped_column(String(255))
    image_path: Mapped[str] = mapped_column(String(512))
    status: Mapped[str] = mapped_column(String(32), default="completed")
    sonar_frequency: Mapped[str] = mapped_column(String(32), default="high")
    detector_backend: Mapped[str] = mapped_column(String(32), default="mock")
    notes: Mapped[str] = mapped_column(Text, default="")
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)

    detections: Mapped[list["Detection"]] = relationship(
        back_populates="scan",
        cascade="all, delete-orphan",
    )


class Detection(Base):
    __tablename__ = "detections"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    scan_id: Mapped[int] = mapped_column(ForeignKey("scans.id"), index=True)
    label: Mapped[str] = mapped_column(String(64))
    class_id: Mapped[int] = mapped_column(Integer)
    confidence: Mapped[float] = mapped_column(Float)
    # Normalized bounding box (0-1) so the frontend can scale to any render size.
    bbox_x: Mapped[float] = mapped_column(Float)
    bbox_y: Mapped[float] = mapped_column(Float)
    bbox_w: Mapped[float] = mapped_column(Float)
    bbox_h: Mapped[float] = mapped_column(Float)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    bbox_width_px: Mapped[float | None] = mapped_column(Float, nullable=True)
    bbox_height_px: Mapped[float | None] = mapped_column(Float, nullable=True)

    scan: Mapped["Scan"] = relationship(back_populates="detections")
