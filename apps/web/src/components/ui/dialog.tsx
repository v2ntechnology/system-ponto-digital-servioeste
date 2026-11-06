import { X } from "lucide-react"
import { useEffect, useId, useRef, type ReactNode } from "react"
import { createPortal } from "react-dom"

import { cn } from "@/lib/utils"

type DialogProps = {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  className?: string
}

/** Diálogo modal: fecha com Esc ou clicando fora, foca o primeiro campo e devolve o foco ao fechar. */
export function Dialog({ open, onClose, title, description, children, footer, className }: DialogProps) {
  const titleId = useId()
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const anterior = document.activeElement as HTMLElement | null
    const primeiro = panel.current?.querySelector<HTMLElement>("input, select, textarea, button:not([data-fechar])")
    primeiro?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = overflow
      anterior?.focus()
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onMouseDown={onClose}>
      <div ref={panel} role="dialog" aria-modal="true" aria-labelledby={titleId}
        onMouseDown={(e) => e.stopPropagation()}
        className={cn("no-scrollbar flex max-h-[90dvh] w-full max-w-lg flex-col rounded-2xl border bg-popover text-popover-foreground shadow-xl", className)}>
        <header className="flex items-start justify-between gap-4 border-b p-5">
          <div>
            <h2 id={titleId} className="text-lg font-medium tracking-tight">{title}</h2>
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
          </div>
          <button type="button" data-fechar aria-label="Fechar" onClick={onClose}
            className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground">
            <X className="size-4" />
          </button>
        </header>
        <div className="no-scrollbar overflow-y-auto p-5">{children}</div>
        {footer && <footer className="flex flex-wrap justify-end gap-2 border-t p-4">{footer}</footer>}
      </div>
    </div>,
    document.body,
  )
}
