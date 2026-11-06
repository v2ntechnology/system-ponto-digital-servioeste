import { CircleAlert, Inbox, Loader2, type LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/** Estados padrão de toda lista e tela de dados (Princípio XII): carregando, vazio e erro. */

export function Carregando({ texto = "Carregando…", className }: { texto?: string; className?: string }) {
  return (
    <div role="status" className={cn("flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground", className)}>
      <Loader2 className="size-4 animate-spin" /> {texto}
    </div>
  )
}

export function Vazio({ titulo, descricao, icone: Icone = Inbox, acao, className }: {
  titulo: string
  descricao?: string
  icone?: LucideIcon
  acao?: ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col items-center px-4 py-16 text-center", className)}>
      <span className="grid size-12 place-items-center rounded-2xl border bg-background">
        <Icone className="size-5 text-muted-foreground" />
      </span>
      <p className="mt-4 font-medium">{titulo}</p>
      {descricao && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{descricao}</p>}
      {acao && <div className="mt-5">{acao}</div>}
    </div>
  )
}

export function ErroCarga({ mensagem, onTentarDeNovo, className }: {
  mensagem?: string
  onTentarDeNovo?: () => void
  className?: string
}) {
  return (
    <div role="alert" className={cn("flex flex-col items-center px-4 py-16 text-center", className)}>
      <span className="grid size-12 place-items-center rounded-2xl border border-destructive/30 bg-destructive/10">
        <CircleAlert className="size-5 text-destructive" />
      </span>
      <p className="mt-4 font-medium">Não foi possível carregar</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{mensagem ?? "Tente de novo em instantes."}</p>
      {onTentarDeNovo && <Button variant="outline" size="sm" className="mt-5" onClick={onTentarDeNovo}>Tentar de novo</Button>}
    </div>
  )
}
