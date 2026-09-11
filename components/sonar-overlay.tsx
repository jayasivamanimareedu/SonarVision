"use client"

import { useState } from "react"
import { CLASS_COLOR_VAR, CLASS_LABELS, type Detection } from "@/lib/types"

// Renders a sonar image with normalized bounding boxes overlaid. Because boxes
// are normalized (0-1), they scale correctly to any rendered image size.
export function SonarOverlay({
  imageUrl,
  detections,
  alt,
}: {
  imageUrl: string
  detections: Detection[]
  alt: string
}) {
  const [hovered, setHovered] = useState<number | null>(null)

  return (
    <div className="relative w-full overflow-hidden rounded-lg border border-border bg-black">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageUrl || "/placeholder.svg"} alt={alt} className="block w-full select-none" />

      <div className="pointer-events-none absolute inset-0">
        {detections.map((d) => {
          const color = CLASS_COLOR_VAR[d.label]
          const dim = hovered !== null && hovered !== d.id
          return (
            <div
              key={d.id}
              className="pointer-events-auto absolute transition-opacity"
              style={{
                left: `${d.bbox.x * 100}%`,
                top: `${d.bbox.y * 100}%`,
                width: `${d.bbox.w * 100}%`,
                height: `${d.bbox.h * 100}%`,
                border: `1.5px solid ${color}`,
                boxShadow: `0 0 0 1px color-mix(in oklch, ${color} 30%, transparent)`,
                opacity: dim ? 0.25 : 1,
              }}
              onMouseEnter={() => setHovered(d.id)}
              onMouseLeave={() => setHovered(null)}
            >
              <span
                className="absolute -top-5 left-0 whitespace-nowrap rounded px-1 py-0.5 font-mono text-[10px] font-semibold"
                style={{ backgroundColor: color, color: "#FFFFFF" }}
              >
                {CLASS_LABELS[d.label]} {(d.confidence * 100).toFixed(0)}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
