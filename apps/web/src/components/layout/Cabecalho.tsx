import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

/** Título padrão de cada tela: ícone verde, título, descrição e ações à direita. */
export function Cabecalho({ icone: Icone, titulo, descricao, acoes }: {
  icone?: LucideIcon
  titulo: string
  descricao?: string
  acoes?: ReactNode
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b p-5 sm:p-6">
      <div className="min-w-0">
        <h1 className="flex items-center gap-2 text-xl font-medium tracking-tight sm:text-2xl">
          {Icone && <Icone className="size-5 shrink-0 text-brand" />} {titulo}
        </h1>
        {descricao && <p className="mt-1 text-sm text-muted-foreground">{descricao}</p>}
      </div>
      {acoes && <div className="flex flex-wrap gap-2">{acoes}</div>}
    </header>
  )
}
