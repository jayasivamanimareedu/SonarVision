"use client"

import useSWR from "swr"
import { useState } from "react"
import { Filter, Loader2 } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { DataSourceBadge } from "@/components/data-source-badge"
import { DetectionReport } from "@/components/detection-report"
import { Card, CardContent } from "@/components/ui/card"
import { getDetections } from "@/lib/api-client"
import { CLASS_LABELS } from "@/lib/types"
import { cn } from "@/lib/utils"

const LABEL_FILTERS: ({ value: string; label: string })[] = [
  { value: "", label: "All Classes" },
  { value: "debris", label: CLASS_LABELS.debris },
  { value: "anomaly", label: CLASS_LABELS.anomaly },
  { value: "geological", label: CLASS_LABELS.geological },
  { value: "unknown", label: CLASS_LABELS.unknown },
]

const CONFIDENCE_STEPS = [0, 0.5, 0.7, 0.9]

export default function DetectionsPage() {
  const [label, setLabel] = useState("")
  const [minConfidence, setMinConfidence] = useState(0)

  const { data, isLoading } = useSWR(["detections", label, minConfidence], () =>
    getDetections({ label: label || undefined, minConfidence }),
  )

  const detections = data?.data ?? []

  return (
    <div>
      <PageHeader
        title="Detection Results"
        description="All detections across processed scans. Filter by class and confidence threshold. Values are simulated until a trained model is connected."
        actions={data ? <DataSourceBadge source={data.source} /> : null}
      />

      <Card className="mb-6">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 overflow-x-auto">
            <Filter className="h-4 w-4 shrink-0 text-muted-foreground" />
            {LABEL_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setLabel(f.value)}
                className={cn(
                  "whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  label === f.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Min confidence</span>
            {CONFIDENCE_STEPS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setMinConfidence(c)}
                className={cn(
                  "rounded-md px-2.5 py-1.5 font-mono text-xs transition-colors",
                  minConfidence === c
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground",
                )}
              >
                {c === 0 ? "Any" : `${c * 100}%`}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="flex h-40 items-center justify-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </CardContent>
        </Card>
      ) : (
        <DetectionReport detections={detections} />
      )}
    </div>
  )
}
