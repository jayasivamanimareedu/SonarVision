"use client"

import type React from "react"
import { useCallback, useRef, useState } from "react"
import {
  Check,
  Download,
  FileJson,
  ImageIcon,
  Loader2,
  ScanLine,
  Upload,
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { DataSourceBadge } from "@/components/data-source-badge"
import { SonarOverlay } from "@/components/sonar-overlay"
import { DetectionMap } from "@/components/detection-map"
import { DetectionReport } from "@/components/detection-report"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { uploadScan } from "@/lib/api-client"
import type { ScanDetail } from "@/lib/types"
import { cn } from "@/lib/utils"

const SAMPLES = [
  { url: "/sonar/sss-seafloor-01.png", name: "sss_seafloor_survey.png" },
  { url: "/sonar/sss-wreck-02.png", name: "sss_wreck_site.png" },
]

function downloadBlob(content: BlobPart, filename: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export default function AnalysisPage() {
  const [result, setResult] = useState<ScanDetail | null>(null)
  const [source, setSource] = useState<"backend" | "mock">("mock")
  const [loading, setLoading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [frequency, setFrequency] = useState("high")
  const [metadataFile, setMetadataFile] = useState<File | null>(null)
  const [metadataFileName, setMetadataFileName] = useState("")
  const [exportOpen, setExportOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleMetadataFile = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      if (file.type !== "application/json" && !file.name.toLowerCase().endsWith(".json")) {
        alert("Please select a valid JSON file.")
        event.target.value = ""
        return
      }

      try {
        const text = await file.text()
        const metadata = JSON.parse(text)
        const required = [
          "ship_latitude",
          "ship_longitude",
          "towfish_heading",
          "layback_m",
          "towfish_altitude_m",
          "sonar_range_m",
          "image_width",
          "image_height",
          "starboard_is_right",
        ]

        const missing = required.filter((key) => metadata[key] === undefined)
        if (missing.length > 0) {
          alert(`Metadata JSON is missing: ${missing.join(", ")}`)
          event.target.value = ""
          return
        }

        setMetadataFile(file)
        setMetadataFileName(file.name)
      } catch {
        alert("The selected file is not valid JSON.")
        event.target.value = ""
      }
    },
    [],
  )

  const runDetection = useCallback(
    async (file: File) => {
      if (!metadataFile) {
        alert("Please upload the survey metadata JSON file first.")
        return
      }

      setLoading(true)
      setResult(null)

      try {
        const { data, source } = await uploadScan(file, {
          sonarFrequency: frequency,
          metadataFile,
        })
        setResult(data)
        setSource(source)
      } finally {
        setLoading(false)
      }
    },
    [frequency, metadataFile],
  )

  const runSample = useCallback(
    async (url: string, name: string) => {
      if (!metadataFile) {
        alert("Please upload the survey metadata JSON file first.")
        return
      }

      setLoading(true)
      setResult(null)

      try {
        const response = await fetch(url)
        const blob = await response.blob()
        const file = new File([blob], name, { type: blob.type })
        const { data, source } = await uploadScan(file, {
          sonarFrequency: frequency,
          metadataFile,
        })
        setResult({ ...data, image_url: url })
        setSource(source)
      } finally {
        setLoading(false)
      }
    },
    [frequency, metadataFile],
  )

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) runDetection(file)
  }

  const downloadJson = useCallback(() => {
    if (!result) return

    // Deliberately omit internal normalized bbox coordinates from the user-facing report.
    const payload = {
      scan_id: result.id,
      filename: result.filename,
      status: result.status,
      sonar_frequency: result.sonar_frequency,
      detector_backend: result.detector_backend,
      uploaded_at: result.uploaded_at,
      detections: result.detections.map((d, index) => ({
        detection_number: index + 1,
        classification: d.label,
        class_id: d.class_id,
        confidence_percent: Number((d.confidence * 100).toFixed(2)),
        latitude: d.latitude ?? null,
        longitude: d.longitude ?? null,
        bounding_dimensions: {
          width_px: d.bbox_width_px ?? null,
          height_px: d.bbox_height_px ?? null,
          width_normalized: d.bbox.w,
          height_normalized: d.bbox.h,
        },
      })),
    }

    downloadBlob(JSON.stringify(payload, null, 2), `drishti-scan-${result.id}.json`, "application/json")
    setExportOpen(false)
  }, [result])

  const downloadCsv = useCallback(() => {
    if (!result) return

    const header = [
      "Detection #",
      "Classification",
      "Class ID",
      "Confidence (%)",
      "Latitude",
      "Longitude",
      "Bounding Width (px)",
      "Bounding Height (px)",
      "Bounding Width (normalized)",
      "Bounding Height (normalized)",
    ]
    const rows = result.detections.map((d, index) =>
      [
        index + 1,
        d.label,
        d.class_id,
        (d.confidence * 100).toFixed(2),
        d.latitude ?? "",
        d.longitude ?? "",
        d.bbox_width_px ?? "",
        d.bbox_height_px ?? "",
        d.bbox.w,
        d.bbox.h,
      ]
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(","),
    )

    downloadBlob([header.join(","), ...rows].join("\n"), `drishti-scan-${result.id}.csv`, "text/csv;charset=utf-8")
    setExportOpen(false)
  }, [result])

  const createAnnotatedCanvas = useCallback(async () => {
    if (!result) return null

    const image = new Image()
    image.crossOrigin = "anonymous"
    image.src = result.image_url

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(new Error("Unable to load image for export."))
    })

    const canvas = document.createElement("canvas")
    canvas.width = image.naturalWidth || image.width
    canvas.height = image.naturalHeight || image.height

    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Canvas is unavailable.")

    ctx.drawImage(image, 0, 0, canvas.width, canvas.height)

    result.detections.forEach((d) => {
      const x = d.bbox.x * canvas.width
      const y = d.bbox.y * canvas.height
      const w = d.bbox.w * canvas.width
      const h = d.bbox.h * canvas.height

      ctx.lineWidth = Math.max(2, canvas.width / 700)
      ctx.strokeStyle = "#7C3AED"
      ctx.strokeRect(x, y, w, h)

      const label = `${d.label} ${(d.confidence * 100).toFixed(0)}%`
      ctx.font = `${Math.max(12, canvas.width / 90)}px sans-serif`
      const metrics = ctx.measureText(label)
      const labelHeight = Math.max(18, canvas.width / 70)

      ctx.fillStyle = "#7C3AED"
      ctx.fillRect(x, Math.max(0, y - labelHeight), metrics.width + 10, labelHeight)
      ctx.fillStyle = "#FFFFFF"
      ctx.fillText(label, x + 5, Math.max(13, y - 5))
    })

    return canvas
  }, [result])

  const downloadAnnotatedImage = useCallback(async () => {
    try {
      const canvas = await createAnnotatedCanvas()
      if (!canvas) return

      canvas.toBlob((blob) => {
        if (!blob) return
        downloadBlob(blob, `drishti-annotated-${result?.id ?? "scan"}.png`, "image/png")
      }, "image/png")
    } catch {
      alert("The annotated image could not be exported. Try again after the detection image is fully loaded.")
    } finally {
      setExportOpen(false)
    }
  }, [createAnnotatedCanvas, result])

  return (
    <div>
      <PageHeader
        title="Sonar Image Analysis"
        description="Upload Side-Scan Sonar imagery and its survey metadata to run automated marine debris and anomaly detection."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upload Image</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                role="button"
                tabIndex={0}
                onClick={() => inputRef.current?.click()}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragging(true)
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                className={cn(
                  "flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-4 py-8 text-center transition-colors",
                  dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/40",
                )}
              >
                <Upload className="mb-2 h-6 w-6 text-primary" />
                <p className="text-sm font-medium text-foreground">Drop image or click to browse</p>
                <p className="mt-1 text-xs text-muted-foreground">PNG, JPG or WEBP</p>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) runDetection(file)
                  }}
                />
              </div>

              <div>
                <label htmlFor="freq" className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Sonar Frequency
                </label>
                <select
                  id="freq"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full rounded-md border border-input bg-secondary px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="high">High (fine detail)</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low (wide swath)</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Survey Metadata</CardTitle>
              <p className="text-xs text-muted-foreground">
                Upload the survey navigation and sonar metadata JSON file.
              </p>
            </CardHeader>
            <CardContent>
              <label
                htmlFor="metadata-file"
                className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-secondary/30 px-6 py-8 text-center transition-colors hover:border-primary/50 hover:bg-secondary/50"
              >
                <FileJson className="mb-3 h-8 w-8 text-primary" />
                <span className="text-sm font-medium text-foreground">Upload Metadata JSON</span>
                <span className="mt-1 text-xs text-muted-foreground">
                  Select a .json file containing survey parameters
                </span>
                <input
                  id="metadata-file"
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={handleMetadataFile}
                />
              </label>

              {metadataFileName ? (
                <div className="mt-3 flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-2">
                  <Check className="h-4 w-4 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-foreground">{metadataFileName}</p>
                    <p className="text-[11px] text-muted-foreground">Survey metadata loaded</p>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sample Images</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {SAMPLES.map((s) => (
                <button
                  key={s.url}
                  type="button"
                  onClick={() => runSample(s.url, s.name)}
                  className="group relative overflow-hidden rounded-md border border-border transition-colors hover:border-primary/50"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.url || "/placeholder.svg"} alt={s.name} className="aspect-video w-full object-cover" />
                  <span className="absolute inset-x-0 bottom-0 flex items-center gap-1 bg-background/80 px-2 py-1 text-[10px] text-foreground">
                    <ImageIcon className="h-3 w-3" />
                    Use sample
                  </span>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="min-h-[400px]">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Detection Output</CardTitle>
              <div className="flex items-center gap-2">
                {result ? <DataSourceBadge source={source} /> : null}
                {result ? (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setExportOpen((value) => !value)}
                      className="inline-flex items-center gap-2 rounded-md border border-border bg-secondary px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary/80"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Export
                    </button>
                    {exportOpen ? (
                      <div className="absolute right-0 top-full z-20 mt-2 w-48 rounded-md border border-border bg-card p-1 shadow-lg">
                        <button
                          type="button"
                          onClick={downloadJson}
                          className="block w-full rounded px-3 py-2 text-left text-xs hover:bg-secondary"
                        >
                          Download JSON
                        </button>
                        <button
                          type="button"
                          onClick={downloadCsv}
                          className="block w-full rounded px-3 py-2 text-left text-xs hover:bg-secondary"
                        >
                          Download CSV
                        </button>
                        <button
                          type="button"
                          onClick={downloadAnnotatedImage}
                          className="block w-full rounded px-3 py-2 text-left text-xs hover:bg-secondary"
                        >
                          Download Annotated PNG
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </CardHeader>
            <CardContent>
              {loading && (
                <div className="flex h-80 flex-col items-center justify-center gap-3 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm">Running detection…</p>
                </div>
              )}

              {!loading && !result && (
                <div className="flex h-80 flex-col items-center justify-center gap-3 text-center text-muted-foreground">
                  <ScanLine className="h-10 w-10 text-muted-foreground/50" />
                  <p className="max-w-xs text-sm">
                    Upload a sonar image and survey metadata JSON to see detected debris and anomalies overlaid on the imagery.
                  </p>
                </div>
              )}

              {!loading && result && (
                <div className="space-y-4">
                  <SonarOverlay imageUrl={result.image_url} detections={result.detections} alt={result.filename} />
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Geographic Detection Map
                    </p>
                    <DetectionMap detections={result.detections} />
                  </div>
                  <DetectionReport
                    detections={result.detections}
                    scanId={result.id}
                    filename={result.filename}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
