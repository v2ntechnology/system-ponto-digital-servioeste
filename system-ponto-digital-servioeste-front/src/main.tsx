import "@fontsource/rubik/400.css"
import "@fontsource/rubik/500.css"
import "./index.css"

import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import { App } from "@/App"
import { Providers } from "@/Providers"

/**
 * Dados simulados (Princípio XII): só em desenvolvimento e só com VITE_MOCK=true.
 * No build de produção `import.meta.env.DEV` vira `false`, o bloco some e o código do MSW não entra no pacote
 * (conferido por `make check-no-mocks`).
 */
async function iniciarDadosSimulados() {
  if (import.meta.env.DEV && import.meta.env.VITE_MOCK === "true") {
    const { worker } = await import("./mocks/browser")
    await worker.start({ onUnhandledRequest: "bypass", quiet: true })
    console.info("[Ponto] Dados simulados ligados (VITE_MOCK=true).")
  }
}

iniciarDadosSimulados().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <Providers>
        <App />
      </Providers>
    </StrictMode>,
  )
})
