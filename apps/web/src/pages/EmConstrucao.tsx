import { Hammer, type LucideIcon } from "lucide-react"

import { AppShell } from "@/components/layout/AppShell"
import { Cabecalho } from "@/components/layout/Cabecalho"
import { Vazio } from "@/components/ui/estados"

/** Tela provisória enquanto a fase correspondente da feature 001 não é implementada. */
export function EmConstrucao({ titulo, icone, fase }: { titulo: string; icone?: LucideIcon; fase: string }) {
  return (
    <AppShell>
      <Cabecalho icone={icone} titulo={titulo} />
      <Vazio icone={Hammer} titulo="Tela em construção" descricao={`Esta tela chega na ${fase} da feature 001.`} />
    </AppShell>
  )
}
