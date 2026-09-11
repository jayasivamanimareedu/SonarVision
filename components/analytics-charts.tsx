"use client"

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { CLASS_COLOR_VAR, CLASS_LABELS, type DetectionLabel } from "@/lib/types"

const AXIS_COLOR = "oklch(0.68 0.02 220)"
const GRID_COLOR = "oklch(0.3 0.03 240)"

const tooltipStyle = {
  backgroundColor: "oklch(0.2 0.025 240)",
  border: "1px solid oklch(0.3 0.03 240)",
  borderRadius: "0.5rem",
  color: "oklch(0.92 0.01 220)",
  fontSize: "12px",
}

export function AnalyticsCharts({
  type,
  data,
}: {
  type: "timeline" | "classes" | "confidence"
  data: any
}) {
  if (type === "timeline") {
    return (
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="fillDetections" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="oklch(0.72 0.14 200)" stopOpacity={0.5} />
              <stop offset="95%" stopColor="oklch(0.72 0.14 200)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" stroke={AXIS_COLOR} tick={{ fontSize: 11 }} tickLine={false} />
          <YAxis stroke={AXIS_COLOR} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: GRID_COLOR }} />
          <Area
            type="monotone"
            dataKey="count"
            stroke="oklch(0.72 0.14 200)"
            strokeWidth={2}
            fill="url(#fillDetections)"
            name="Detections"
          />
        </AreaChart>
      </ResponsiveContainer>
    )
  }

  if (type === "classes") {
    const entries = Object.entries(data) as [DetectionLabel, number][]
    const pieData = entries.map(([label, value]) => ({
      name: CLASS_LABELS[label] ?? label,
      value,
      color: CLASS_COLOR_VAR[label] ?? "oklch(0.6 0.02 240)",
    }))
    return (
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={2}>
            {pieData.map((entry) => (
              <Cell key={entry.name} fill={entry.color} stroke="oklch(0.2 0.025 240)" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <XAxis dataKey="range" stroke={AXIS_COLOR} tick={{ fontSize: 11 }} tickLine={false} />
        <YAxis stroke={AXIS_COLOR} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "oklch(0.26 0.03 240)" }} />
        <Bar dataKey="count" fill="oklch(0.72 0.14 200)" radius={[4, 4, 0, 0]} name="Detections" />
      </BarChart>
    </ResponsiveContainer>
  )
}
