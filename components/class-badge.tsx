import { CLASS_COLOR_VAR, CLASS_LABELS, type DetectionLabel } from "@/lib/types"

export function ClassBadge({ label }: { label: DetectionLabel }) {
  const color = CLASS_COLOR_VAR[label as keyof typeof CLASS_COLOR_VAR] ?? "var(--class-unknown)"
  const displayLabel = CLASS_LABELS[label as keyof typeof CLASS_LABELS] ?? label
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-xs font-medium"
      style={{
        color,
        borderColor: `color-mix(in oklch, ${color} 40%, transparent)`,
        backgroundColor: `color-mix(in oklch, ${color} 12%, transparent)`,
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {displayLabel}
    </span>
  )
}
