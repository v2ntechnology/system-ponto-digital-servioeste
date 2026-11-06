import { useEffect, useState } from "react"
import { NavLink } from "react-router-dom"

import { UserMenu } from "@/components/layout/UserMenu"
import { Avatar } from "@/components/ui/avatar"
import { useEu } from "@/features/auth/useAuth"
import { fmtTime } from "@/lib/format"
import { NOME_PERFIL, pode, type Permissao } from "@/lib/permissoes"
import { cn } from "@/lib/utils"

/** Abas da barra do topo. Cada uma só aparece para quem tem a permissão. */
const NAV: { to: string; label: string; permissao: Permissao }[] = [
  { to: "/funcionarios", label: "Funcionários", permissao: "funcionario.ler" },
  { to: "/estrutura", label: "Estrutura", permissao: "estrutura.ler" },
  { to: "/feriados", label: "Feriados", permissao: "estrutura.ler" },
  { to: "/usuarios", label: "Usuários", permissao: "usuario.gerenciar" },
  { to: "/auditoria", label: "Auditoria", permissao: "auditoria.ler" },
]

function useRelogio() {
  const [agora, setAgora] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setAgora(new Date()), 15_000)
    return () => clearInterval(id)
  }, [])
  return agora
}

/** Barra do topo (padrão do Hub): a pessoa à esquerda, as abas em pílula no meio, relógio e menu à direita.
 *  No celular as abas descem para uma linha própria e rolam na horizontal. */
export function TopBar({ className }: { className?: string }) {
  const { data: eu } = useEu()
  const agora = useRelogio()
  const abas = NAV.filter((n) => pode(eu, n.permissao))

  return (
    <header className={cn("flex flex-wrap items-center justify-between gap-3 md:grid md:grid-cols-[1fr_auto_1fr]", className)}>
      <div className="flex min-w-0 items-center gap-3 justify-self-start">
        <Avatar name={eu?.nome ?? ""} className="size-10" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{eu?.nome}</p>
          <p className="text-xs text-muted-foreground">{eu ? NOME_PERFIL[eu.perfil] : ""}</p>
        </div>
      </div>

      <nav aria-label="Principal"
        className="no-scrollbar order-last flex w-full items-center gap-1 overflow-x-auto rounded-full bg-foreground/5 p-1 text-sm md:order-none md:col-start-2 md:w-auto">
        {abas.map((n) => (
          <NavLink key={n.to} to={n.to}
            className={({ isActive }) => cn(
              "whitespace-nowrap rounded-full px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground sm:px-4",
              isActive && "bg-brand font-medium text-brand-foreground hover:text-brand-foreground",
            )}>
            {n.label}
          </NavLink>
        ))}
      </nav>

      <div className="flex items-center gap-3 justify-self-end">
        <span className="hidden text-sm tabular-nums sm:inline">{fmtTime(agora)}</span>
        <UserMenu />
      </div>
    </header>
  )
}
