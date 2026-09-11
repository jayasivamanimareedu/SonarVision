import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { DataSourceBadge } from "@/components/data-source-badge"
import { SonarOverlay } from "@/components/sonar-overlay"
import { DetectionMap } from "@/components/detection-map"
import { DetectionReport } from "@/components/detection-report"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getScan } from "@/lib/api-client"

export default async function ScanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data: scan, source } = await getScan(Number(id))

  return (
    <div>
      <Link
        href="/history"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Scan History
      </Link>

      <PageHeader
        title={scan.filename}
        description={`Uploaded ${new Date(scan.uploaded_at).toLocaleString()} · ${scan.sonar_frequency} frequency · detector: ${scan.detector_backend}`}
        actions={<DataSourceBadge source={source} />}
      />

      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Geographic Detection Map</CardTitle>
          </CardHeader>
          <CardContent>
            <DetectionMap detections={scan.detections} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SonarOverlay imageUrl={scan.image_url} detections={scan.detections} alt={`Sonar scan ${scan.filename}`} />
          <p className="mt-2 text-xs text-muted-foreground">
            Detected objects are highlighted on the sonar imagery. Geographic coordinates are shown when the geotagging engine provides them.
          </p>
        </div>

        <div className="lg:col-span-3">
          <DetectionReport
            detections={scan.detections}
            scanId={scan.id}
            filename={scan.filename}
          />
        </div>
      </div>
    </div>
  )
}
