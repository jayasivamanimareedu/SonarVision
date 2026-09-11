"""Seed the SQLite database with mock scans and detections.

Run once so the Dashboard, Scan History, and Analytics pages have data to show
before any image is uploaded:

    python -m app.seed

All data here is simulated for demonstration only.
"""
import random
from datetime import datetime, timedelta, timezone

from app.database import SessionLocal, init_db
from app.models import Detection, Scan
from app.services.detector import CLASS_MAP

SAMPLE_FILENAMES = [
    "sss_survey_bay01.png",
    "sss_survey_bay02.png",
    "harbor_transect_a.png",
    "harbor_transect_b.png",
    "reef_line_north.png",
    "reef_line_south.png",
    "channel_pass_01.png",
    "wreck_site_scan.png",
]
FREQUENCIES = ["high", "medium", "low"]


def run_seed() -> None:
    init_db()
    db = SessionLocal()
    rng = random.Random(2026)

    try:
        # Avoid double-seeding.
        if db.query(Scan).count() > 0:
            print("Database already has scans; skipping seed.")
            return

        now = datetime.now(timezone.utc)

        for i, filename in enumerate(SAMPLE_FILENAMES):
            scan = Scan(
                filename=filename,
                image_path=f"storage/uploads/{filename}",
                status="completed",
                sonar_frequency=rng.choice(FREQUENCIES),
                detector_backend="mock",
                notes="Simulated seed scan for demonstration.",
                uploaded_at=now - timedelta(days=rng.randint(0, 12), hours=rng.randint(0, 23)),
            )
            db.add(scan)
            db.flush()

            for _ in range(rng.randint(2, 6)):
                class_id = rng.choice(list(CLASS_MAP.keys()))
                w = round(rng.uniform(0.06, 0.22), 3)
                h = round(rng.uniform(0.06, 0.22), 3)
                db.add(
                    Detection(
                        scan_id=scan.id,
                        label=CLASS_MAP[class_id],
                        class_id=class_id,
                        confidence=round(rng.uniform(0.45, 0.97), 3),
                        bbox_x=round(rng.uniform(0.02, 1 - w - 0.02), 3),
                        bbox_y=round(rng.uniform(0.02, 1 - h - 0.02), 3),
                        bbox_w=w,
                        bbox_h=h,
                    )
                )

        db.commit()
        print(f"Seeded {len(SAMPLE_FILENAMES)} scans with mock detections.")
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
