import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { DataSourceBadge } from "@/components/data-source-badge"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getScans } from "@/lib/api-client"

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default async function HistoryPage() {
  const { data: scans, source } = await getScans()

  return (
    <div>
      <PageHeader
        title="Scan History"
        description="Every processed Side-Scan Sonar survey and its detection count. Select a scan to review its overlay and detections."
        actions={<DataSourceBadge source={source} />}
      />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Filename</th>
                  <th className="px-5 py-3 font-medium">Uploaded</th>
                  <th className="px-5 py-3 font-medium">Frequency</th>
                  <th className="px-5 py-3 font-medium">Detector</th>
                  <th className="px-5 py-3 font-medium">Detections</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {scans.map((scan) => (
                  <tr key={scan.id} className="group transition-colors hover:bg-secondary/40">
                    <td className="px-5 py-3">
                      <Link href={`/history/${scan.id}`} className="font-mono text-xs text-foreground group-hover:text-primary">
                        {scan.filename}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{formatDate(scan.uploaded_at)}</td>
                    <td className="px-5 py-3 capitalize text-muted-foreground">{scan.sonar_frequency}</td>
                    <td className="px-5 py-3">
                      <Badge variant="secondary">{scan.detector_backend}</Badge>
                    </td>
                    <td className="px-5 py-3 font-mono tabular-nums text-foreground">{scan.detection_count}</td>
                    <td className="px-5 py-3">
                      <Badge variant="success">{scan.status}</Badge>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link href={`/history/${scan.id}`} className="inline-flex text-muted-foreground group-hover:text-primary">
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
