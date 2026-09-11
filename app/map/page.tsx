"use client"

import useSWR from "swr"
import { MapPinned, Target } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { DataSourceBadge } from "@/components/data-source-badge"
import { DetectionMap } from "@/components/detection-map"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getDetections } from "@/lib/api-client"

export default function DetectionMapPage() {
  const { data, isLoading } = useSWR("detection-map", () => getDetections())
  const detections = data?.data ?? []
  const geotagged = detections.filter(
    (d) => Number.isFinite(d.latitude) && Number.isFinite(d.longitude),
  )

  return (
    <div>
      <PageHeader
        title="Detection Map"
        description="Geographic view of sonar detections. Locations are populated by the geotagging engine from survey metadata."
        actions={data ? <DataSourceBadge source={data.source} /> : null}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 ring-1 ring-primary/20">
              <MapPinned className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Geotagged detections</p>
              <p className="font-mono text-xl font-semibold text-foreground">{isLoading ? "—" : geotagged.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total detections</p>
              <p className="font-mono text-xl font-semibold text-foreground">{isLoading ? "—" : detections.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Geographic Detection Map</CardTitle>
        </CardHeader>
        <CardContent>
          <DetectionMap detections={detections} />
        </CardContent>
      </Card>
    </div>
  )
}
