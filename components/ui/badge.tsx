import type * as React from "react"
import { cn } from "@/lib/utils"

type BadgeVariant = "default" | "secondary" | "outline" | "success" | "warning" | "destructive"

const variantClasses: Record<BadgeVariant, string> = {
  default: "border-transparent bg-primary/15 text-primary",
  secondary: "border-transparent bg-secondary text-secondary-foreground",
  outline: "border-border text-foreground",
  success: "border-transparent bg-[oklch(0.7_0.15_150)]/15 text-[oklch(0.8_0.15_150)]",
  warning: "border-transparent bg-accent/15 text-accent",
  destructive: "border-transparent bg-destructive/15 text-destructive",
}

export function Badge({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"span"> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-xs font-medium",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  )
}
