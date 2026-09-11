"use client"

import { useEffect } from "react"
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet"
import L from "leaflet"
import type { Detection } from "@/lib/types"
import { CLASS_LABELS } from "@/lib/types"

import "leaflet/dist/leaflet.css"

function FitBounds({ detections }: { detections: Detection[] }) {
  const map = useMap()

  useEffect(() => {
    const positions = detections.map((d) => [d.latitude!, d.longitude!] as [number, number])
    if (positions.length === 0) return

    if (positions.length === 1) {
      map.setView(positions[0], 16, { animate: false })
      return
    }

    const bounds = L.latLngBounds(positions)
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 17, animate: false })
  }, [detections, map])

  return null
}

export default function LeafletDetectionMap({ detections }: { detections: Detection[] }) {
  const center: [number, number] = [detections[0].latitude!, detections[0].longitude!]

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <MapContainer center={center} zoom={15} scrollWheelZoom className="h-[420px] w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitBounds detections={detections} />

        {detections.map((d) => (
          <CircleMarker
            key={d.id}
            center={[d.latitude!, d.longitude!]}
            radius={9}
            pathOptions={{
              color: "#7C3AED",
              fillColor: "#7C3AED",
              fillOpacity: 0.8,
              weight: 2,
            }}
          >
            <Popup>
              <div className="min-w-[150px] text-sm">
                <p className="font-semibold">{CLASS_LABELS[d.label as keyof typeof CLASS_LABELS] ?? d.label}</p>
                <p className="mt-1">Confidence: {(d.confidence * 100).toFixed(1)}%</p>
                <p className="mt-1 font-mono text-xs">
                  {d.latitude!.toFixed(6)}, {d.longitude!.toFixed(6)}
                </p>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  )
}
