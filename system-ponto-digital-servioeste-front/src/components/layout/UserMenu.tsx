import { LogOut, Menu, Monitor, Moon, Settings, Sun } from "lucide-react"
import { useEffect, useId, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import { useEu, useLogout } from "@/features/auth/useAuth"
import { NOME_PERFIL } from "@/lib/permissoes"
import { useTheme } from "@/lib/theme"
import { cn } from "@/lib/utils"

const TEMAS = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Escuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Monitor },
] as const

const itemClass = "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent"

/** Menu hambúrguer da barra do topo (padrão do Hub): configurações, tema e sair. */
export function UserMenu() {
  const [aberto, setAberto] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const menuId = useId()
  const { theme, setTheme } = useTheme()
  const { data: eu } = useEu()
  const logout = useLogout()
  const navigate = useNavigate()

  useEffect(() => {
    if (!aberto) return
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setAberto(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberto(false)
    }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [aberto])

  return (
    <div ref={ref} className="relative">
      <button type="button" aria-label="Menu" aria-expanded={aberto} aria-controls={menuId} onClick={() => setAberto((v) => !v)}
        className={cn("grid size-9 place-items-center rounded-full border transition-colors hover:bg-accent", aberto && "bg-accent")}>
        <Menu className="size-4" />
      </button>

      {aberto && (
        <div id={menuId} className="absolute right-0 top-full z-50 mt-2 w-60 rounded-xl border bg-popover p-1.5 shadow-lg">
          {eu && (
            <div className="px-3 pb-2 pt-1.5">
              <p className="truncate text-sm font-medium">{eu.nome}</p>
              <p className="truncate text-xs text-muted-foreground">{eu.email} · {NOME_PERFIL[eu.perfil]}</p>
            </div>
          )}
          <Link to="/configuracoes" className={itemClass} onClick={() => setAberto(false)}>
            <Settings className="size-4 text-brand" /> Configurações
          </Link>

          <div className="my-1.5 border-t" />
          <p className="px-3 pb-1.5 pt-1 text-xs text-muted-foreground">Tema</p>
          <div className="grid grid-cols-3 gap-1 px-1.5 pb-1.5" role="radiogroup" aria-label="Tema">
            {TEMAS.map(({ value, label, icon: Icon }) => (
              <button key={value} type="button" role="radio" aria-checked={theme === value} onClick={() => setTheme(value)}
                className={cn("flex flex-col items-center gap-1 rounded-lg border py-2 text-xs transition-colors",
                  theme === value ? "border-brand bg-brand text-brand-foreground" : "hover:bg-accent")}>
                <Icon className="size-4" /> {label}
              </button>
            ))}
          </div>

          <div className="my-1.5 border-t" />
          <button type="button" className={itemClass} disabled={logout.isPending}
            onClick={() => logout.mutate(undefined, { onSettled: () => navigate("/login", { replace: true }) })}>
            <LogOut className="size-4 text-muted-foreground" /> Sair
          </button>
        </div>
      )}
    </div>
  )
}
