"""Ultralytics YOLO detector used by the DRISHTI FastAPI backend."""
from __future__ import annotations

from pathlib import Path

from app.config import BASE_DIR
from app.services.detector import AbstractDetector, DetectionResult


class YoloDetector(AbstractDetector):
    """Run a trained Ultralytics YOLO model and return normalized detections."""

    def __init__(self, weights_path: str, confidence_threshold: float = 0.4) -> None:
        self._weights_path = Path(weights_path)
        if not self._weights_path.is_absolute():
            self._weights_path = BASE_DIR / self._weights_path
        self._confidence_threshold = confidence_threshold

        if not self._weights_path.is_file():
            raise FileNotFoundError(
                f"YOLO weights not found: {self._weights_path}. "
                "Place the model at backend/weights/drishti_sss.pt or set "
                "YOLO_WEIGHTS_PATH in backend/.env."
            )

        try:
            from ultralytics import YOLO
        except ImportError as exc:
            raise RuntimeError(
                "The YOLO backend requires the 'ultralytics' package. "
                "Install backend/requirements.txt before starting FastAPI."
            ) from exc

        self._model = YOLO(str(self._weights_path))

    @property
    def backend_name(self) -> str:
        return "yolo"

    def detect(self, image_path: str) -> list[DetectionResult]:
        predictions = self._model.predict(
            source=image_path,
            conf=self._confidence_threshold,
            verbose=False,
        )[0]

        # Ultralytics exposes the trained class names on model.names. Use those
        # names instead of assuming a fixed taxonomy, because the supplied
        # model has its own four-class marine-target taxonomy.
        names = getattr(self._model, "names", {})
        image_height, image_width = predictions.orig_shape
        if not image_width or not image_height:
            raise ValueError("YOLO did not provide valid source image dimensions.")

        results: list[DetectionResult] = []
        for box in predictions.boxes:
            class_id = int(box.cls[0])
            confidence = float(box.conf[0])
            x1, y1, x2, y2 = [float(v) for v in box.xyxy[0].tolist()]

            # Clamp coordinates to the image before normalizing.
            x1 = max(0.0, min(x1, float(image_width)))
            y1 = max(0.0, min(y1, float(image_height)))
            x2 = max(x1, min(x2, float(image_width)))
            y2 = max(y1, min(y2, float(image_height)))

            label = names.get(class_id, str(class_id)) if isinstance(names, dict) else str(class_id)

            results.append(
                DetectionResult(
                    label=str(label),
                    class_id=class_id,
                    confidence=round(confidence, 4),
                    bbox_x=round(x1 / image_width, 6),
                    bbox_y=round(y1 / image_height, 6),
                    bbox_w=round((x2 - x1) / image_width, 6),
                    bbox_h=round((y2 - y1) / image_height, 6),
                )
            )

        return results
