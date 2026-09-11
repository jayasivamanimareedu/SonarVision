import { Database, FlaskConical } from "lucide-react"
import { Badge } from "@/components/ui/badge"

// Communicates transparently whether data came from the live FastAPI backend
// or the built-in simulated dataset. Never implies real detection accuracy.
export function DataSourceBadge({ source }: { source: "backend" | "mock" }) {
  if (source === "backend") {
    return (
      <Badge variant="success" title="Served by the FastAPI backend">
        <Database className="h-3 w-3" />
        Live API
      </Badge>
    )
  }
  return (
    <Badge variant="warning" title="Simulated data — no trained model connected">
      <FlaskConical className="h-3 w-3" />
      Simulated Data
    </Badge>
  )
}
