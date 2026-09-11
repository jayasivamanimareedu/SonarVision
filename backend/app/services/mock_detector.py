"""MockDetector: produces simulated detections for the prototype.

IMPORTANT: These results are randomly generated placeholders. They do NOT come
from any trained model and must never be presented as real detection accuracy.
The purpose is purely to exercise the full API + UI pipeline until a real YOLO
model is plugged in via YoloDetector.
"""
import hashlib
import random

from app.services.detector import CLASS_MAP, AbstractDetector, DetectionResult


class MockDetector(AbstractDetector):
    def __init__(self, confidence_threshold: float = 0.4) -> None:
        self._confidence_threshold = confidence_threshold

    @property
    def backend_name(self) -> str:
        return "mock"

    def detect(self, image_path: str) -> list[DetectionResult]:
        # Seed the RNG from the file path so the same image yields stable,
        # repeatable mock detections across requests.
        seed = int(hashlib.sha256(image_path.encode()).hexdigest(), 16) % (2**32)
        rng = random.Random(seed)

        num_detections = rng.randint(2, 6)
        results: list[DetectionResult] = []

        for _ in range(num_detections):
            class_id = rng.choice(list(CLASS_MAP.keys()))
            confidence = round(rng.uniform(0.45, 0.97), 3)
            if confidence < self._confidence_threshold:
                continue

            # Normalized box that stays within image bounds.
            w = round(rng.uniform(0.06, 0.22), 3)
            h = round(rng.uniform(0.06, 0.22), 3)
            x = round(rng.uniform(0.02, 1 - w - 0.02), 3)
            y = round(rng.uniform(0.02, 1 - h - 0.02), 3)

            results.append(
                DetectionResult(
                    label=CLASS_MAP[class_id],
                    class_id=class_id,
                    confidence=confidence,
                    bbox_x=x,
                    bbox_y=y,
                    bbox_w=w,
                    bbox_h=h,
                )
            )

        return results
