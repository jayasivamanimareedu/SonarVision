"""Detector abstraction.

This is the seam that lets a real YOLO model replace the mock detector without
touching routers, schemas, or the frontend. Every detector returns the same
`DetectionResult` shape.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class DetectionResult:
    """A single detection in normalized (0-1) coordinates.

    Keeping coordinates normalized means the frontend can scale boxes to any
    rendered image size without knowing the original pixel dimensions.
    """
    label: str
    class_id: int
    confidence: float
    bbox_x: float
    bbox_y: float
    bbox_w: float
    bbox_h: float


# The class taxonomy the prototype targets. A real model must emit these same
# labels/ids (or this map must be updated to match the model's classes).
CLASS_MAP: dict[int, str] = {
    0: "debris",
    1: "anomaly",
    2: "geological",
    3: "unknown",
}


class AbstractDetector(ABC):
    """Interface every detector implementation must satisfy."""

    @abstractmethod
    def detect(self, image_path: str) -> list[DetectionResult]:
        """Run detection on the image at `image_path` and return results."""
        raise NotImplementedError

    @property
    @abstractmethod
    def backend_name(self) -> str:
        """Short identifier stored alongside each scan (e.g. 'mock', 'yolo')."""
        raise NotImplementedError


def get_detector() -> AbstractDetector:
    """Factory that returns the active detector based on config.

    This is the ONLY place that decides which detector runs. Flip
    `settings.detector_backend` to 'yolo' once YoloDetector is implemented.
    """
    from app.config import settings

    if settings.detector_backend == "yolo":
        from app.services.yolo_detector import YoloDetector

        return YoloDetector(
            weights_path=settings.yolo_weights_path,
            confidence_threshold=settings.confidence_threshold,
        )

    from app.services.mock_detector import MockDetector

    return MockDetector(confidence_threshold=settings.confidence_threshold)
