/// <reference types="vitest/config" />
import { readFileSync } from "node:fs"
import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, type Plugin } from "vite"

import { areaDev } from "./dev-tools/plugin"

/**
 * Serve o service worker do MSW só no servidor de desenvolvimento, direto do node_modules.
 * Assim o arquivo nunca fica em public/ e nunca vai para o build de produção (Princípio XII).
 */
function mswSoEmDev(): Plugin {
  const arquivo = path.resolve(__dirname, "node_modules/msw/lib/mockServiceWorker.js")
  return {
    name: "msw-so-em-dev",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/mockServiceWorker.js", (_req, res) => {
        res.setHeader("Content-Type", "application/javascript")
        res.setHeader("Service-Worker-Allowed", "/")
        res.end(readFileSync(arquivo))
      })
    },
  }
}

export default defineConfig({
  // areaDev: telas internas em /dev (plano, board, histórico, dúvidas do RH, conceitos). Só no servidor de dev.
  plugins: [react(), tailwindcss(), mswSoEmDev(), areaDev(path.resolve(__dirname, ".."))],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: {
    // Portas do Ponto não batem com Radar (5173) e Hub (5174): os três rodam juntos.
    port: 5175,
    strictPort: true,
    // Em dev, /api vai para a API no Docker (8002). Em produção quem faz isso é o Caddy.
    proxy: { "/api": "http://127.0.0.1:8002" },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    css: false,
    passWithNoTests: true,
  },
})
