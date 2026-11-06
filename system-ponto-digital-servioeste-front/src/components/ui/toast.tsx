import { CheckCircle2, CircleAlert, X } from "lucide-react"
import { createContext, useCallback, useContext, useState, type ReactNode } from "react"

import { cn } from "@/lib/utils"

type Aviso = { id: number; texto: string; tipo: "sucesso" | "erro" }
type Ctx = (texto: string, tipo?: Aviso["tipo"]) => void

const ToastContext = createContext<Ctx | null>(null)
let proximoId = 1

/** Avisos curtos no canto da tela ("Funcionário salvo"). Somem sozinhos em 4 s. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([])

  const fechar = useCallback((id: number) => setAvisos((l) => l.filter((a) => a.id !== id)), [])
  const avisar = useCallback<Ctx>((texto, tipo = "sucesso") => {
    const id = proximoId++
    setAvisos((l) => [...l, { id, texto, tipo }])
    setTimeout(() => fechar(id), 4000)
  }, [fechar])

  return (
    <ToastContext.Provider value={avisar}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2">
        {avisos.map((a) => (
          <div key={a.id} role={a.tipo === "erro" ? "alert" : "status"}
            className="pointer-events-auto flex items-start gap-3 rounded-xl border bg-popover p-3 text-sm shadow-lg">
            {a.tipo === "erro"
              ? <CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
              : <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand" />}
            <p className="flex-1">{a.texto}</p>
            <button type="button" aria-label="Fechar aviso" onClick={() => fechar(a.id)}
              className={cn("text-muted-foreground hover:text-foreground")}>
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast fora do ToastProvider")
  return ctx
}
