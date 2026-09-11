import type { LucideIcon } from "lucide-react"
import { LayoutDashboard, ScanLine, Target, History, ChartBar, Map, Settings } from "lucide-react"

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  description: string
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, description: "Operational overview" },
  { href: "/analysis", label: "Sonar Analysis", icon: ScanLine, description: "Upload & detect" },
  { href: "/detections", label: "Detection Results", icon: Target, description: "All detections" },
  { href: "/map", label: "Detection Map", icon: Map, description: "Geotagged detections" },
  { href: "/history", label: "Scan History", icon: History, description: "Past scans" },
  { href: "/analytics", label: "Analytics", icon: ChartBar, description: "Trends & stats" },
  { href: "/settings", label: "Settings", icon: Settings, description: "Configuration" },
]
