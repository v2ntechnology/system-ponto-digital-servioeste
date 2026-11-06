import { ShieldOff } from "lucide-react"
import type { ReactNode } from "react"
import { Link } from "react-router-dom"

import { AppShell } from "@/components/layout/AppShell"
import { Vazio } from "@/components/ui/estados"
import { usePermissao, type Permissao } from "@/lib/permissoes"

/** Mostra a tela só para quem tem a permissão. A API também recusa: isto é só para a interface não enganar. */
export function RequirePermissao({ permissao, children }: { permissao: Permissao; children: ReactNode }) {
  const permitido = usePermissao(permissao)
  if (permitido) return <>{children}</>
  return (
    <AppShell>
      <Vazio icone={ShieldOff} titulo="Sem acesso" descricao="Seu perfil não tem permissão para abrir esta tela."
        acao={<Link to="/" className="inline-flex h-8 items-center rounded-lg border px-3 text-xs font-medium hover:bg-accent">Voltar ao início</Link>} />
    </AppShell>
  )
}
