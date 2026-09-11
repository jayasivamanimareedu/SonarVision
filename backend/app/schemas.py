"""Pydantic request/response schemas (the public API contract)."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class BoundingBox(BaseModel):
    """Normalized bounding box, values in 0-1 relative to image dimensions."""
    x: float
    y: float
    w: float
    h: float


class DetectionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    scan_id: int
    label: str
    class_id: int
    confidence: float
    bbox: BoundingBox
    latitude: float | None = None
    longitude: float | None = None
    bbox_width_px: float | None = None
    bbox_height_px: float | None = None

    @classmethod
    def from_orm_model(cls, d) -> "DetectionOut":
        return cls(
            id=d.id,
            scan_id=d.scan_id,
            label=d.label,
            class_id=d.class_id,
            confidence=d.confidence,
            bbox=BoundingBox(x=d.bbox_x, y=d.bbox_y, w=d.bbox_w, h=d.bbox_h),
            latitude=d.latitude,
            longitude=d.longitude,
            bbox_width_px=d.bbox_width_px,
            bbox_height_px=d.bbox_height_px,
        )


class ScanSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    filename: str
    status: str
    sonar_frequency: str
    detector_backend: str
    uploaded_at: datetime
    detection_count: int


class ScanDetail(BaseModel):
    id: int
    filename: str
    image_url: str
    status: str
    sonar_frequency: str
    detector_backend: str
    notes: str
    uploaded_at: datetime
    detections: list[DetectionOut]


class AnalyticsSummary(BaseModel):
    total_scans: int
    total_detections: int
    class_distribution: dict[str, int]
    avg_confidence: float
    detections_over_time: list[dict]
    confidence_histogram: list[dict]
