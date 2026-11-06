import "@fontsource/rubik/400.css"
import "@fontsource/rubik/500.css"
import "./index.css"

import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import { ThemeProvider } from "@/lib/theme"

// Esqueleto da Fase 1. A Fase 2 acrescenta rotas, TanStack Query e o MSW (só em dev com VITE_MOCK=true).
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <main className="grid min-h-dvh place-items-center bg-background p-4 text-foreground">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl border bg-background">
            <img src="/favicon.svg" alt="" className="size-5" />
          </span>
          <span className="text-[15px] font-medium tracking-tight">
            Servioeste <span className="text-muted-foreground">Ponto</span>
          </span>
        </div>
      </main>
    </ThemeProvider>
  </StrictMode>,
)
