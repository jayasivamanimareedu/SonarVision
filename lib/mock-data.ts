// Frontend mock dataset used as a fallback when the FastAPI backend is not
// reachable (e.g. inside the v0 in-browser preview). The real backend returns
// identical shapes. All values here are SIMULATED for demonstration only.

import type { AnalyticsSummary, Detection, DetectionLabel, ScanDetail, ScanSummary } from "./types"

const LABELS: DetectionLabel[] = ["debris", "anomaly", "geological", "unknown"]

// Deterministic pseudo-random generator so the mock data is stable per render.
function seeded(seed: number) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

function makeDetections(scanId: number, count: number): Detection[] {
  const rand = seeded(scanId * 97 + 13)
  const detections: Detection[] = []
  for (let i = 0; i < count; i++) {
    const label = LABELS[Math.floor(rand() * LABELS.length)]
    const w = 0.06 + rand() * 0.16
    const h = 0.06 + rand() * 0.16
    detections.push({
      id: scanId * 100 + i,
      scan_id: scanId,
      label,
      class_id: LABELS.indexOf(label),
      confidence: Math.round((0.45 + rand() * 0.52) * 1000) / 1000,
      bbox: {
        x: Math.round((0.02 + rand() * (1 - w - 0.04)) * 1000) / 1000,
        y: Math.round((0.02 + rand() * (1 - h - 0.04)) * 1000) / 1000,
        w: Math.round(w * 1000) / 1000,
        h: Math.round(h * 1000) / 1000,
      },
    })
  }
  return detections
}

const SAMPLE_FILES = [
  "sss_survey_bay01.png",
  "sss_survey_bay02.png",
  "harbor_transect_a.png",
  "harbor_transect_b.png",
  "reef_line_north.png",
  "reef_line_south.png",
  "channel_pass_01.png",
  "wreck_site_scan.png",
]
const FREQS = ["high", "medium", "low"]

export const MOCK_SCANS: ScanSummary[] = SAMPLE_FILES.map((filename, i) => {
  const id = i + 1
  const count = 2 + ((i * 3 + 2) % 5)
  const daysAgo = (i * 37) % 12
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return {
    id,
    filename,
    status: "completed",
    sonar_frequency: FREQS[i % FREQS.length],
    detector_backend: "mock",
    uploaded_at: date.toISOString(),
    detection_count: count,
  }
})

const SAMPLE_IMAGES = ["/sonar/sss-seafloor-01.png", "/sonar/sss-wreck-02.png"]

export function mockScanDetail(id: number): ScanDetail {
  const summary = MOCK_SCANS.find((s) => s.id === id) ?? MOCK_SCANS[0]
  return {
    id: summary.id,
    filename: summary.filename,
    image_url: SAMPLE_IMAGES[(summary.id - 1) % SAMPLE_IMAGES.length],
    status: summary.status,
    sonar_frequency: summary.sonar_frequency,
    detector_backend: summary.detector_backend,
    notes: "Simulated demonstration scan.",
    uploaded_at: summary.uploaded_at,
    detections: makeDetections(summary.id, summary.detection_count),
  }
}

export function mockAllDetections(): Detection[] {
  return MOCK_SCANS.flatMap((s) => makeDetections(s.id, s.detection_count))
}

export function mockAnalytics(): AnalyticsSummary {
  const all = mockAllDetections()
  const class_distribution: Record<string, number> = {}
  for (const d of all) class_distribution[d.label] = (class_distribution[d.label] ?? 0) + 1

  const avg_confidence =
    Math.round((all.reduce((sum, d) => sum + d.confidence, 0) / all.length) * 1000) / 1000

  const byDay: Record<string, number> = {}
  for (const s of MOCK_SCANS) {
    const day = s.uploaded_at.slice(0, 10)
    byDay[day] = (byDay[day] ?? 0) + s.detection_count
  }
  const detections_over_time = Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }))

  const buckets: Record<string, number> = {}
  for (const d of all) {
    const low = Math.floor(d.confidence * 10) / 10
    const key = `${low.toFixed(1)}-${(low + 0.1).toFixed(1)}`
    buckets[key] = (buckets[key] ?? 0) + 1
  }
  const confidence_histogram = Object.entries(buckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([range, count]) => ({ range, count }))

  return {
    total_scans: MOCK_SCANS.length,
    total_detections: all.length,
    class_distribution,
    avg_confidence,
    detections_over_time,
    confidence_histogram,
  }
}
