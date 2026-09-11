// Shared types mirroring the FastAPI backend contract (backend/app/schemas.py).
// Keeping these in sync means a real YOLO backend drops in with no frontend edits.

export type DetectionLabel = string

export interface BoundingBox {
  x: number // normalized 0-1
  y: number
  w: number
  h: number
}

export interface Detection {
  id: number
  scan_id: number
  label: DetectionLabel
  class_id: number
  confidence: number
  bbox: BoundingBox
  latitude?: number
  longitude?: number
  bbox_width_px?: number
  bbox_height_px?: number
}

export interface ScanSummary {
  id: number
  filename: string
  status: string
  sonar_frequency: string
  detector_backend: string
  uploaded_at: string
  detection_count: number
}

export interface ScanDetail {
  id: number
  filename: string
  image_url: string
  status: string
  sonar_frequency: string
  detector_backend: string
  notes: string
  uploaded_at: string
  detections: Detection[]
}

export interface AnalyticsSummary {
  total_scans: number
  total_detections: number
  class_distribution: Record<string, number>
  avg_confidence: number
  detections_over_time: { date: string; count: number }[]
  confidence_histogram: { range: string; count: number }[]
}

export const CLASS_LABELS: Record<DetectionLabel, string> = {
  debris: "Marine Debris",
  anomaly: "Anomaly",
  geological: "Geological",
  unknown: "Unclassified",
}

export const CLASS_COLOR_VAR: Record<DetectionLabel, string> = {
  debris: "var(--class-debris)",
  anomaly: "var(--class-anomaly)",
  geological: "var(--class-geological)",
  unknown: "var(--class-unknown)",
}
