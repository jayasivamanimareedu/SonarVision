"use client"

import { CircleAlert, MapPin } from "lucide-react"

import { ClassBadge } from "@/components/class-badge"
import { Card, CardContent } from "@/components/ui/card"
import type { Detection } from "@/lib/types"

interface DetectionReportProps {
  detections: Detection[]
  scanId?: number
  filename?: string
}

export function DetectionReport({ detections }: DetectionReportProps) {
  if (detections.length === 0) {
    return (
      <Card>
        <CardContent className="flex min-h-[150px] flex-col items-center justify-center text-center">
          <CircleAlert className="h-8 w-8 text-muted-foreground/50" />
          <p className="mt-3 text-sm font-medium text-foreground">No hazards detected</p>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            The detection engine did not return any objects for this scan.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div>
      <div className="mb-3">
        <p className="text-sm font-semibold text-foreground">Detection Brief</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Quick report for each detected hazard.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {detections.map((d, index) => {
          const geotagged = Number.isFinite(d.latitude) && Number.isFinite(d.longitude)

          return (
            <Card key={d.id} className="overflow-hidden border-border/80 bg-card/80">
              <CardContent className="p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="font-mono text-sm font-semibold text-foreground">
                    Detection #{index + 1}
                  </p>
                  <ClassBadge label={d.label} />
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Class:</span>
                    <span className="font-medium text-foreground">{d.label}</span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Confidence:</span>
                    <span className="font-mono font-medium tabular-nums text-foreground">
                      {(d.confidence * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div className="border-t border-border/70 pt-2">
                    {geotagged ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-4">
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 text-primary" />
                            Latitude:
                          </span>
                          <span className="font-mono text-xs tabular-nums text-foreground">
                            {d.latitude!.toFixed(6)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 text-primary" />
                            Longitude:
                          </span>
                          <span className="font-mono text-xs tabular-nums text-foreground">
                            {d.longitude!.toFixed(6)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Location awaiting geotagging.</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
