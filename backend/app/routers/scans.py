"""Scan routes: upload an SSS image, run detection, list and fetch scans."""
import json
import shutil
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import UPLOADS_DIR
from app.database import get_db
from app.models import Detection, Scan
from app.schemas import DetectionOut, ScanDetail, ScanSummary
from app.services.detector import get_detector
from app.services.geotagging import geotag_detection, validate_metadata

router = APIRouter(prefix="/api/scans", tags=["scans"])

ALLOWED_CONTENT_TYPES = {"image/png", "image/jpeg", "image/jpg", "image/webp"}


def _image_url(request: Request, scan: Scan) -> str:
    """Absolute URL the frontend can use to render the uploaded image."""
    return str(request.base_url).rstrip("/") + f"/storage/uploads/{Path(scan.image_path).name}"


@router.post("", response_model=ScanDetail)
async def create_scan(
    request: Request,
    file: UploadFile = File(...),
    sonar_frequency: str = Form("high"),
    notes: str = Form(""),
    metadata_file: UploadFile | None = File(None),
    db: Session = Depends(get_db),
) -> ScanDetail:
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=415, detail="Unsupported image type.")

    # Metadata is supplied as a JSON file by the frontend. Keep the raw file
    # alongside the sonar image so the later geotagging/YOLO pipeline has the
    # original navigation information available without changing the response
    # contract used by the current dashboard.
    metadata = None
    if metadata_file is not None:
        if not (metadata_file.filename or "").lower().endswith(".json"):
            raise HTTPException(status_code=415, detail="Metadata must be a JSON file.")
        try:
            metadata = json.loads((await metadata_file.read()).decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            raise HTTPException(status_code=400, detail="Invalid metadata JSON.")
        try:
            validate_metadata(metadata)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    # Persist the uploaded file with a collision-proof name.
    ext = Path(file.filename or "upload.png").suffix or ".png"
    stored_name = f"{uuid.uuid4().hex}{ext}"
    dest = UPLOADS_DIR / stored_name
    with dest.open("wb") as out:
        shutil.copyfileobj(file.file, out)

    if metadata is not None:
        metadata_path = dest.with_suffix(".json")
        metadata_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")

    # Run the active detector (mock now, YOLO later - same interface).
    detector = get_detector()
    results = detector.detect(str(dest))

    scan = Scan(
        filename=file.filename or stored_name,
        image_path=str(dest),
        status="completed",
        sonar_frequency=sonar_frequency,
        detector_backend=detector.backend_name,
        notes=notes,
    )
    db.add(scan)
    db.flush()  # assign scan.id before creating detections

    try:
        for r in results:
            geotag = (
                geotag_detection(
                    metadata,
                    bbox_x=r.bbox_x,
                    bbox_y=r.bbox_y,
                    bbox_w=r.bbox_w,
                    bbox_h=r.bbox_h,
                )
                if metadata is not None
                else None
            )

            db.add(
                Detection(
                    scan_id=scan.id,
                    label=r.label,
                    class_id=r.class_id,
                    confidence=r.confidence,
                    bbox_x=r.bbox_x,
                    bbox_y=r.bbox_y,
                    bbox_w=r.bbox_w,
                    bbox_h=r.bbox_h,
                    latitude=geotag.latitude if geotag else None,
                    longitude=geotag.longitude if geotag else None,
                    bbox_width_px=geotag.bbox_width_px if geotag else None,
                    bbox_height_px=geotag.bbox_height_px if geotag else None,
                )
            )
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Geolocation failed: {exc}") from exc
    db.commit()
    db.refresh(scan)

    return ScanDetail(
        id=scan.id,
        filename=scan.filename,
        image_url=_image_url(request, scan),
        status=scan.status,
        sonar_frequency=scan.sonar_frequency,
        detector_backend=scan.detector_backend,
        notes=scan.notes,
        uploaded_at=scan.uploaded_at,
        detections=[DetectionOut.from_orm_model(d) for d in scan.detections],
    )


@router.get("", response_model=list[ScanSummary])
def list_scans(db: Session = Depends(get_db)) -> list[ScanSummary]:
    rows = db.execute(
        select(Scan, func.count(Detection.id))
        .outerjoin(Detection, Detection.scan_id == Scan.id)
        .group_by(Scan.id)
        .order_by(Scan.uploaded_at.desc())
    ).all()

    return [
        ScanSummary(
            id=scan.id,
            filename=scan.filename,
            status=scan.status,
            sonar_frequency=scan.sonar_frequency,
            detector_backend=scan.detector_backend,
            uploaded_at=scan.uploaded_at,
            detection_count=count,
        )
        for scan, count in rows
    ]


@router.get("/{scan_id}", response_model=ScanDetail)
def get_scan(scan_id: int, request: Request, db: Session = Depends(get_db)) -> ScanDetail:
    scan = db.get(Scan, scan_id)
    if scan is None:
        raise HTTPException(status_code=404, detail="Scan not found.")

    return ScanDetail(
        id=scan.id,
        filename=scan.filename,
        image_url=_image_url(request, scan),
        status=scan.status,
        sonar_frequency=scan.sonar_frequency,
        detector_backend=scan.detector_backend,
        notes=scan.notes,
        uploaded_at=scan.uploaded_at,
        detections=[DetectionOut.from_orm_model(d) for d in scan.detections],
    )
