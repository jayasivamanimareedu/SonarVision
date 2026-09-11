import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { AppShell } from "@/components/app-shell"
import "./globals.css"

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

export const metadata: Metadata = {
  title: "DRISHTI — Marine Debris & Anomaly Detection",
  description:
    "AI-powered automated underwater marine debris and anomaly detection using Side-Scan Sonar imagery. SIH 2026 prototype (PS 260057).",
  generator: "v0.app",
}

export const viewport = {
  themeColor: "#0a1420",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`dark bg-background ${geistSans.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased">
        <Suspense fallback={null}>
          <AppShell>{children}</AppShell>
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}
