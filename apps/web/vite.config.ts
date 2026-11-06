/// <reference types="vitest/config" />
import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
