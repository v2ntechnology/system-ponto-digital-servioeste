import "@testing-library/jest-dom/vitest"

import { cleanup } from "@testing-library/react"
import { setupServer } from "msw/node"
import { afterAll, afterEach, beforeAll } from "vitest"

import { resetarBanco } from "@/mocks/dados"
import { handlers } from "@/mocks/handlers"

// jsdom não implementa matchMedia (usado pelo tema "sistema").
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false, media: query, onchange: null,
    addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {},
    dispatchEvent: () => false,
  }),
})

// O React Router cria Requests de navegação com o AbortSignal do jsdom, que o Request nativo do Node recusa.
// Nos testes o cancelamento não importa: removemos o signal só aí.
const RequestNativo = globalThis.Request
globalThis.Request = class extends RequestNativo {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    if (init?.signal) {
      const { signal: _signal, ...resto } = init
      void _signal
      super(input, resto)
    } else {
      super(input, init)
    }
  }
} as typeof Request

// Os testes de tela usam os mesmos handlers simulados do `make front-mock`, rodando no Node.
export const servidor = setupServer(...handlers)

beforeAll(() => servidor.listen({ onUnhandledRequest: "error" }))
afterEach(() => {
  cleanup()
  servidor.resetHandlers()
  sessionStorage.clear()
  resetarBanco()
})
afterAll(() => servidor.close())
