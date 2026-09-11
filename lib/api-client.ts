// API client for the DRISHTI FastAPI backend.
//
// Strategy: try the real backend first. If it is unreachable (e.g. inside the
// v0 in-browser preview where the Python service is not running), transparently
// fall back to the local mock dataset so the UI always renders. When you run
// the FastAPI backend locally, set NEXT_PUBLIC_API_BASE_URL and the app uses it.

import type { AnalyticsSummary, Detection, ScanDetail, ScanSummary } from "./types"
import { MOCK_SCANS, mockAllDetections, mockAnalytics, mockScanDetail } from "./mock-data"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? ""

// Short timeout so preview fallback is snappy when no backend exists.
async function tryFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
  if (!API_BASE_URL) return null
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 2500)
    const res = await fetch(`${API_BASE_URL}${path}`, { ...init, signal: controller.signal })
    clearTimeout(timeout)
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

export interface DataSourceResult<T> {
  data: T
  source: "backend" | "mock"
}

export async function getScans(): Promise<DataSourceResult<ScanSummary[]>> {
  const data = await tryFetch<ScanSummary[]>("/api/scans")
  return data ? { data, source: "backend" } : { data: MOCK_SCANS, source: "mock" }
}

export async function getScan(id: number): Promise<DataSourceResult<ScanDetail>> {
  const data = await tryFetch<ScanDetail>(`/api/scans/${id}`)
  return data ? { data, source: "backend" } : { data: mockScanDetail(id), source: "mock" }
}

export async function getDetections(params?: {
  label?: string
  minConfidence?: number
}): Promise<DataSourceResult<Detection[]>> {
  const search = new URLSearchParams()
  if (params?.label) search.set("label", params.label)
  if (params?.minConfidence != null) search.set("min_confidence", String(params.minConfidence))
  const qs = search.toString()
  const data = await tryFetch<Detection[]>(`/api/detections${qs ? `?${qs}` : ""}`)
  if (data) return { data, source: "backend" }

  // Mock filtering mirrors the backend query params.
  let all = mockAllDetections()
  if (params?.label) all = all.filter((d) => d.label === params.label)
  if (params?.minConfidence != null) all = all.filter((d) => d.confidence >= params.minConfidence!)
  all.sort((a, b) => b.confidence - a.confidence)
  return { data: all, source: "mock" }
}

export async function getAnalytics(): Promise<DataSourceResult<AnalyticsSummary>> {
  const data = await tryFetch<AnalyticsSummary>("/api/analytics/summary")
  return data ? { data, source: "backend" } : { data: mockAnalytics(), source: "mock" }
}

// Upload returns a mock detection result in preview mode. When a real backend
// is configured it performs the multipart upload and returns real results.
export async function uploadScan(
  file: File,
  opts?: { sonarFrequency?: string; notes?: string; metadataFile?: File },
): Promise<DataSourceResult<ScanDetail>> {
  if (API_BASE_URL) {
    try {
      const form = new FormData()
      form.append("file", file)
      form.append("sonar_frequency", opts?.sonarFrequency ?? "high")
      form.append("notes", opts?.notes ?? "")
      if (opts?.metadataFile) {
        form.append("metadata_file", opts.metadataFile)
      }
      const res = await fetch(`${API_BASE_URL}/api/scans`, { method: "POST", body: form })
      if (res.ok) return { data: (await res.json()) as ScanDetail, source: "backend" }
    } catch {
      // fall through to mock
    }
  }

  // Preview fallback: build a mock detection over the just-uploaded image so the
  // overlay demo works without a backend. Uses an object URL for the preview.
  const objectUrl = URL.createObjectURL(file)
  const base = mockScanDetail(Math.floor(Math.random() * MOCK_SCANS.length) + 1)
  return {
    data: {
      ...base,
      id: Date.now(),
      filename: file.name,
      image_url: objectUrl,
      notes: opts?.notes ?? "",
      sonar_frequency: opts?.sonarFrequency ?? "high",
      uploaded_at: new Date().toISOString(),
    },
    source: "mock",
  }
}
