import type { ReactNode } from "react"

import { TopBar } from "@/components/layout/TopBar"

/** Moldura das telas logadas (HubShell do Servioeste Hub): barra do topo + painel principal arredondado. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-dvh flex-col gap-3 bg-background p-3 sm:px-5">
      <TopBar className="px-1 pt-1" />
      <main className="no-scrollbar min-h-0 min-w-0 flex-1 overflow-y-auto rounded-2xl border bg-card">
        {children}
      </main>
    </div>
  )
}
