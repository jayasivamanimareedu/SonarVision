import { Cpu, Database, Info, Server, Sliders } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

function Row({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-3 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={mono ? "font-mono text-sm text-foreground" : "text-sm text-foreground"}>{value}</span>
    </div>
  )
}

export default function SettingsPage() {
  const apiConfigured = Boolean(process.env.NEXT_PUBLIC_API_BASE_URL)

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Configuration for the DRISHTI prototype. The detector backend is the single switch that swaps simulated detections for a real trained model."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center gap-2">
            <Cpu className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Detection Model</CardTitle>
          </CardHeader>
          <CardContent>
            <Row label="Active backend" value="mock" />
            <Row label="Model status" value="Not connected" />
            <Row label="Confidence threshold" value="0.40" />
            <Row label="Target classes" value="debris, anomaly, geological, unknown" />
            <div className="mt-4 flex items-start gap-2 rounded-md border border-accent/30 bg-accent/10 p-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <p className="text-xs leading-relaxed text-foreground">
                Detections are simulated. To connect a real model, implement <code className="font-mono">YoloDetector</code> in
                the backend and set <code className="font-mono">DETECTOR_BACKEND=yolo</code>. No frontend changes are required.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center gap-2">
            <Server className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Backend Connection</CardTitle>
          </CardHeader>
          <CardContent>
            <Row label="API base URL" value={process.env.NEXT_PUBLIC_API_BASE_URL || "not set"} />
            <div className="flex items-center justify-between border-b border-border py-3">
              <span className="text-sm text-muted-foreground">Data source</span>
              {apiConfigured ? (
                <Badge variant="success">Live API configured</Badge>
              ) : (
                <Badge variant="warning">Simulated fallback</Badge>
              )}
            </div>
            <Row label="Framework" value="FastAPI + SQLite" />
            <Row label="Detection endpoint" value="POST /api/scans" />
            <div className="mt-4 flex items-start gap-2 rounded-md border border-border bg-secondary/40 p-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="text-xs leading-relaxed text-muted-foreground">
                Set <code className="font-mono">NEXT_PUBLIC_API_BASE_URL</code> to your running FastAPI server (e.g.
                http://localhost:8000). When unset, the UI uses the built-in simulated dataset.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center gap-2">
            <Sliders className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Sonar Defaults</CardTitle>
          </CardHeader>
          <CardContent>
            <Row label="Default frequency" value="high" />
            <Row label="Coordinate system" value="normalized (0-1)" />
            <Row label="Accepted formats" value="PNG, JPG, WEBP" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">About</CardTitle>
          </CardHeader>
          <CardContent>
            <Row label="Project" value="DRISHTI" />
            <Row label="Problem statement" value="PS 260057" />
            <Row label="Event" value="SIH 2026" mono={false} />
            <Row label="Version" value="0.1.0 (prototype)" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
