import { useId, type ReactNode } from "react"

import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

/**
 * Rótulo + controle + ajuda + erro, com os ids ligados para leitores de tela.
 * O filho recebe `id`, `aria-invalid` e `aria-describedby` pela função render.
 */
export function Campo({ rotulo, ajuda, erro, className, children }: {
  rotulo: string
  ajuda?: string
  erro?: string
  className?: string
  children: (props: { id: string; "aria-invalid": boolean; "aria-describedby"?: string }) => ReactNode
}) {
  const id = useId()
  const descId = `${id}-desc`
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>{rotulo}</Label>
      {children({ id, "aria-invalid": !!erro, "aria-describedby": erro || ajuda ? descId : undefined })}
      {erro
        ? <p id={descId} role="alert" className="text-xs text-destructive">{erro}</p>
        : ajuda && <p id={descId} className="text-xs text-muted-foreground">{ajuda}</p>}
    </div>
  )
}
