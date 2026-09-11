"""Analytics routes: aggregate stats for the Analytics page."""
from collections import Counter, defaultdict

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Detection, Scan
from app.schemas import AnalyticsSummary

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/summary", response_model=AnalyticsSummary)
def analytics_summary(db: Session = Depends(get_db)) -> AnalyticsSummary:
    scans = db.execute(select(Scan)).scalars().all()
    detections = db.execute(select(Detection)).scalars().all()

    class_distribution = Counter(d.label for d in detections)

    avg_confidence = (
        round(sum(d.confidence for d in detections) / len(detections), 3)
        if detections
        else 0.0
    )

    # Detections grouped by upload day.
    per_day: dict[str, int] = defaultdict(int)
    for scan in scans:
        day = scan.uploaded_at.strftime("%Y-%m-%d")
        per_day[day] += len(scan.detections)
    detections_over_time = [
        {"date": day, "count": count} for day, count in sorted(per_day.items())
    ]

    # Confidence histogram in 0.1-wide buckets.
    buckets: dict[str, int] = defaultdict(int)
    for d in detections:
        low = int(d.confidence * 10) / 10
        label = f"{low:.1f}-{low + 0.1:.1f}"
        buckets[label] += 1
    confidence_histogram = [
        {"range": rng, "count": buckets[rng]} for rng in sorted(buckets)
    ]

    return AnalyticsSummary(
        total_scans=len(scans),
        total_detections=len(detections),
        class_distribution=dict(class_distribution),
        avg_confidence=avg_confidence,
        detections_over_time=detections_over_time,
        confidence_histogram=confidence_histogram,
    )
