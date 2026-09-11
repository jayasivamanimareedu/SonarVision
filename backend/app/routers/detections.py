"""Detection routes: list/filter detections across all scans."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Detection
from app.schemas import DetectionOut

router = APIRouter(prefix="/api/detections", tags=["detections"])


@router.get("", response_model=list[DetectionOut])
def list_detections(
    label: str | None = Query(None, description="Filter by class label."),
    min_confidence: float = Query(0.0, ge=0.0, le=1.0),
    db: Session = Depends(get_db),
) -> list[DetectionOut]:
    stmt = select(Detection).where(Detection.confidence >= min_confidence)
    if label:
        stmt = stmt.where(Detection.label == label)
    stmt = stmt.order_by(Detection.confidence.desc())

    rows = db.execute(stmt).scalars().all()
    return [DetectionOut.from_orm_model(d) for d in rows]
