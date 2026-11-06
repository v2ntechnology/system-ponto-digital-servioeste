import { BookOpen, Search } from "lucide-react"
import { useState } from "react"

import { Cabecalho } from "@/components/layout/Cabecalho"
import { Carregando, ErroCarga, Vazio } from "@/components/ui/estados"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { useGlossario } from "./api"
import { DevShell } from "./DevShell"
import { Markdown } from "./Markdown"

export function ConceitosPage() {
  const { data = [], isLoading, error, refetch } = useGlossario()
  const [busca, setBusca] = useState("")
  const termo = busca.trim().toLowerCase()
  const lista = data.filter((t) => !termo || `${t.titulo} ${t.resumo} ${t.corpo}`.toLowerCase().includes(termo))

  return (
    <DevShell>
      <Cabecalho icone={BookOpen} titulo="Conceitos"
        descricao="Glossário do projeto em linguagem simples (docs/briefing/glossario.md). Bom para explicar ao RH." />
      <div className="space-y-5 p-5 sm:p-6">
        <div className="max-w-md space-y-1.5">
          <Label htmlFor="c-busca">Buscar</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="c-busca" className="pl-9" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="NSR, AFD, escopo…" />
          </div>
        </div>
        {isLoading ? <Carregando /> : error ? <ErroCarga mensagem={error.message} onTentarDeNovo={() => refetch()} />
          : lista.length === 0 ? <Vazio icone={BookOpen} titulo="Nenhum conceito encontrado" />
          : <>
            <nav aria-label="Índice" className="flex flex-wrap gap-1.5">
              {lista.map((t) => (
                <a key={t.id} href={`#${t.id}`} className="rounded-full border px-2.5 py-0.5 text-xs hover:border-brand hover:text-brand">{t.titulo}</a>
              ))}
            </nav>
            <ul className="space-y-3">
              {lista.map((t) => (
                <li key={t.id} id={t.id} className="scroll-mt-4 rounded-xl border bg-background p-5">
                  <h2 className="text-lg font-medium tracking-tight">{t.titulo}</h2>
                  <div className="mt-1 text-muted-foreground"><Markdown texto={t.resumo} /></div>
                  {t.corpo && <div className="mt-4 border-t pt-4"><Markdown texto={t.corpo} /></div>}
                </li>
              ))}
            </ul>
          </>}
      </div>
    </DevShell>
  )
}
