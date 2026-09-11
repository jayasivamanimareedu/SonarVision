import Link from "next/link"
import { Activity, Layers, ScanLine, ShieldAlert, Target, Upload } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { DataSourceBadge } from "@/components/data-source-badge"
import { ClassBadge } from "@/components/class-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getAnalytics, getScans } from "@/lib/api-client"
import { CLASS_LABELS, type DetectionLabel } from "@/lib/types"

export default async function DashboardPage() {
  const [{ data: analytics, source }, { data: scans }] = await Promise.all([
    getAnalytics(),
    getScans(),
  ])

  const recentScans = scans.slice(0, 5)
  const anomalyCount = analytics.class_distribution["anomaly"] ?? 0
  const classes = Object.entries(analytics.class_distribution) as [DetectionLabel, number][]
  const maxClass = Math.max(1, ...classes.map(([, c]) => c))

  return (
    <div>
      <PageHeader
        title="Operations Dashboard"
        description="Automated marine debris and anomaly detection from Side-Scan Sonar imagery. This prototype runs on simulated detections until a trained model is connected."
        actions={<DataSourceBadge source={source} />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Scans" value={analytics.total_scans} icon={ScanLine} hint="Processed surveys" />
        <StatCard label="Total Detections" value={analytics.total_detections} icon={Target} hint="Across all scans" />
        <StatCard label="Anomalies Flagged" value={anomalyCount} icon={ShieldAlert} hint="Require review" />
        <StatCard
          label="Avg Confidence"
          value={(analytics.avg_confidence * 100).toFixed(1)}
          unit="%"
          icon={Activity}
          hint="Model output score"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Scans</CardTitle>
            <Link href="/history" className="text-xs font-medium text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="pb-2 font-medium">Scan</th>
                    <th className="pb-2 font-medium">Frequency</th>
                    <th className="pb-2 font-medium">Detections</th>
                    <th className="pb-2 text-right font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentScans.map((scan) => (
                    <tr key={scan.id} className="text-foreground">
                      <td className="py-3">
                        <Link href={`/history/${scan.id}`} className="font-mono text-xs hover:text-primary">
                          {scan.filename}
                        </Link>
                      </td>
                      <td className="py-3 capitalize text-muted-foreground">{scan.sonar_frequency}</td>
                      <td className="py-3 font-mono tabular-nums">{scan.detection_count}</td>
                      <td className="py-3 text-right">
                        <Badge variant="success">{scan.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Detection Classes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {classes.map(([label, count]) => (
              <div key={label}>
                <div className="mb-1.5 flex items-center justify-between">
                  <ClassBadge label={label} />
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">{count}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${(count / maxClass) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link href="/analysis">
          <Card className="group h-full transition-colors hover:border-primary/40">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 ring-1 ring-primary/20">
                <Upload className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Analyze a Sonar Image</p>
                <p className="text-sm text-muted-foreground">Upload an SSS image and run detection</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/detections">
          <Card className="group h-full transition-colors hover:border-primary/40">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 ring-1 ring-primary/20">
                <Layers className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Review Detections</p>
                <p className="text-sm text-muted-foreground">Browse and filter all detection results</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
