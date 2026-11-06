// MSW no navegador. Só é importado por main.tsx dentro de `if (import.meta.env.DEV && VITE_MOCK === "true")`.
import { setupWorker } from "msw/browser"

import { handlers } from "./handlers"

export const worker = setupWorker(...handlers)
