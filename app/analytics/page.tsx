import { Gauge, Layers, Target, TrendingUp } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { DataSourceBadge } from "@/components/data-source-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AnalyticsCharts } from "@/components/analytics-charts"
import { getAnalytics } from "@/lib/api-client"

export default async function AnalyticsPage() {
  const { data: analytics, source } = await getAnalytics()

  const topClass =
    Object.entries(analytics.class_distribution).sort(([, a], [, b]) => b - a)[0]?.[0] ?? "n/a"

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Aggregate trends across all processed scans. All figures derive from simulated detections in this prototype."
        actions={<DataSourceBadge source={source} />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Scans" value={analytics.total_scans} icon={Layers} />
        <StatCard label="Total Detections" value={analytics.total_detections} icon={Target} />
        <StatCard label="Avg Confidence" value={(analytics.avg_confidence * 100).toFixed(1)} unit="%" icon={Gauge} />
        <StatCard label="Top Class" value={topClass} icon={TrendingUp} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Detections Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <AnalyticsCharts type="timeline" data={analytics.detections_over_time} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Class Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <AnalyticsCharts type="classes" data={analytics.class_distribution} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Confidence Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <AnalyticsCharts type="confidence" data={analytics.confidence_histogram} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
