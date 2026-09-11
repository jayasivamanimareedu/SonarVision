"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, Radar, X } from "lucide-react"
import { NAV_ITEMS } from "@/lib/nav"
import { cn } from "@/lib/utils"

function BrandMark() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/15 ring-1 ring-primary/30">
        <Radar className="h-5 w-5 text-primary" />
      </div>
      <div className="flex flex-col leading-none">
        <span className="font-mono text-sm font-bold tracking-widest text-foreground">DRISHTI</span>
        <span className="mt-0.5 text-[10px] text-muted-foreground">Sonar Intelligence</span>
      </div>
    </div>
  )
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground ring-1 ring-primary/25"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
            )}
          >
            <Icon className={cn("h-4.5 w-4.5 shrink-0", active ? "text-primary" : "")} />
            <span className="flex flex-col">
              <span className="font-medium leading-tight">{item.label}</span>
            </span>
          </Link>
        )
      })}
    </nav>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar p-4 lg:flex">
        <div className="px-2 py-2">
          <BrandMark />
        </div>
        <div className="mt-6 flex-1 overflow-y-auto">
          <NavLinks />
        </div>
        <div className="rounded-md border border-sidebar-border bg-card/50 p-3">
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            SIH 2026 Prototype · PS 260057. Detections shown are simulated until a trained model is
            connected.
          </p>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-sidebar/95 px-4 backdrop-blur lg:hidden">
        <BrandMark />
        <button
          type="button"
          aria-label="Toggle navigation"
          onClick={() => setMobileOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-foreground"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-20 lg:hidden">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-x-0 top-14 border-b border-border bg-sidebar p-4">
            <NavLinks onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <main className="flex-1 px-4 pb-12 pt-20 sm:px-6 lg:px-8 lg:pt-8">{children}</main>
      </div>
    </div>
  )
}
