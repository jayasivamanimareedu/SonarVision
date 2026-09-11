import type { LucideIcon } from "lucide-react"
import { Card } from "@/components/ui/card"

export function StatCard({
  label,
  value,
  unit,
  icon: Icon,
  hint,
}: {
  label: string
  value: string | number
  unit?: string
  icon: LucideIcon
  hint?: string
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 font-mono text-3xl font-semibold tabular-nums text-foreground">
            {value}
            {unit ? <span className="ml-1 text-base text-muted-foreground">{unit}</span> : null}
          </p>
          {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 ring-1 ring-primary/20">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
    </Card>
  )
}
