"""Application configuration.

Central place for tunable settings. The `detector_backend` flag is the single
switch that decides whether the app uses the mock detector or a real YOLO model.
"""
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent
STORAGE_DIR = BASE_DIR / "storage"
UPLOADS_DIR = STORAGE_DIR / "uploads"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "DRISHTI Detection API"
    app_version: str = "0.1.0"

    # Database
    database_url: str = f"sqlite:///{BASE_DIR / 'drishti.db'}"

    # CORS - the Next.js frontend origin(s)
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # Detector selection. "mock" is active for the prototype.
    # Set to "yolo" once app/services/yolo_detector.py is implemented.
    detector_backend: str = "yolo"

    # Default confidence threshold applied to detections (0-1).
    confidence_threshold: float = 0.4

    # Path to YOLO weights (used only when detector_backend == "yolo").
    yolo_weights_path: str = "weights/drishti_sss.pt"


settings = Settings()

# Ensure storage directories exist at import time.
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
