"use client"

import dynamic from "next/dynamic"
import { MapPin, Navigation } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { CLASS_LABELS, type Detection } from "@/lib/types"

const LeafletMap = dynamic(() => import("@/components/leaflet-detection-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[420px] items-center justify-center rounded-lg border border-border bg-secondary/30 text-sm text-muted-foreground">
      Loading detection map…
    </div>
  ),
})

export function DetectionMap({ detections }: { detections: Detection[] }) {
  const geotagged = detections.filter(
    (d) => Number.isFinite(d.latitude) && Number.isFinite(d.longitude),
  )

  if (geotagged.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="flex min-h-[300px] flex-col items-center justify-center px-6 py-12 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground">Geographic Detection Map</p>
            <p className="mt-2 max-w-md text-xs leading-relaxed text-muted-foreground">
              Detection coordinates will appear here after the geotagging engine calculates latitude and longitude from the sonar metadata and model detections.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-md border border-border bg-secondary/40 px-3 py-2 text-[11px] text-muted-foreground">
              <Navigation className="h-3.5 w-3.5 text-primary" />
              Awaiting geotagged detections
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <LeafletMap detections={geotagged} />

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {geotagged.map((d, index) => (
          <div key={d.id} className="rounded-md border border-border bg-secondary/30 px-3 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-foreground">
                Detection {index + 1}
              </span>
              <span className="font-mono text-xs text-primary">
                {(d.confidence * 100).toFixed(1)}%
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{CLASS_LABELS[d.label as keyof typeof CLASS_LABELS] ?? d.label}</p>
            <p className="mt-1 font-mono text-[11px] tabular-nums text-foreground">
              {d.latitude!.toFixed(6)}, {d.longitude!.toFixed(6)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
