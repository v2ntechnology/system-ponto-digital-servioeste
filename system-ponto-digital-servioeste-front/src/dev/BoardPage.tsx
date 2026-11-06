import { KanbanSquare, Search } from "lucide-react"
import { useState } from "react"

import { Cabecalho } from "@/components/layout/Cabecalho"
import { Badge } from "@/components/ui/badge"
import { Carregando, ErroCarga, Vazio } from "@/components/ui/estados"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"

import { usePlano } from "./api"
import { DevShell } from "./DevShell"
import { faseAtual } from "./progresso"
import type { Fase, FeaturePlano, Tarefa } from "./tipos"

type Coluna = { id: string; titulo: string; descricao: string; tarefas: Tarefa[] }

function Cartao({ t, fases, historias }: { t: Tarefa; fases: Fase[]; historias: Record<string, string> }) {
  const fase = fases.find((f) => f.numero === t.fase)
  return (
    <li className="rounded-lg border bg-background p-3 text-sm">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="font-medium tabular-nums">{t.id}</span>
        {t.historia && <Badge variant="brand" title={historias[t.historia]}>{t.historia}</Badge>}
        {t.paralela && <Badge title="Pode ser feita em paralelo">P</Badge>}
      </div>
      <p className="mt-1.5 line-clamp-3 text-muted-foreground" title={t.descricao}>{t.descricao}</p>
      {fase && <p className="mt-2 text-xs text-muted-foreground">Fase {fase.numero}: {fase.titulo}</p>}
    </li>
  )
}

export function BoardPage() {
  const { data, isLoading, error, refetch } = usePlano()
  const comTarefas = (data?.features ?? []).filter((f) => f.fases.length > 0)
  const [numero, setNumero] = useState("")
  const [historia, setHistoria] = useState("")
  const [busca, setBusca] = useState("")
  const feature: FeaturePlano | undefined = comTarefas.find((f) => f.numero === numero) ?? comTarefas[0]

  let colunas: Coluna[] = []
  if (feature) {
    const atual = faseAtual(feature)
    const termo = busca.trim().toLowerCase()
    const todas = feature.fases.flatMap((f) => f.tarefas).filter((t) =>
      (!historia || t.historia === historia) && (!termo || `${t.id} ${t.descricao}`.toLowerCase().includes(termo)))
    colunas = [
      { id: "afazer", titulo: "A fazer", descricao: "Próximas fases", tarefas: todas.filter((t) => !t.feita && t.fase !== atual?.numero) },
      { id: "andamento", titulo: "Em andamento", descricao: atual ? `Fase ${atual.numero}: ${atual.titulo}` : "—", tarefas: todas.filter((t) => !t.feita && t.fase === atual?.numero) },
      { id: "feito", titulo: "Feito", descricao: "Marcadas [X] no tasks.md", tarefas: todas.filter((t) => t.feita).reverse() },
    ]
  }

  return (
    <DevShell>
      <Cabecalho icone={KanbanSquare} titulo="Board"
        descricao="Tarefas do tasks.md da feature. Uma tarefa vai para Feito quando é marcada [X] no arquivo." />
      <div className="space-y-4 p-5 sm:p-6">
        {isLoading ? <Carregando /> : error ? <ErroCarga mensagem={error.message} onTentarDeNovo={() => refetch()} />
          : !feature ? <Vazio icone={KanbanSquare} titulo="Nenhuma feature com tarefas" descricao="Rode /speckit-tasks em uma feature." />
          : <>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="b-feature">Feature</Label>
                <Select id="b-feature" value={feature.numero} onChange={(e) => setNumero(e.target.value)}>
                  {comTarefas.map((f) => <option key={f.numero} value={f.numero}>{f.numero} {f.titulo}</option>)}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="b-historia">História</Label>
                <Select id="b-historia" value={historia} onChange={(e) => setHistoria(e.target.value)}>
                  <option value="">Todas</option>
                  {Object.entries(feature.historias).map(([id, nome]) => <option key={id} value={id}>{id}: {nome}</option>)}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="b-busca">Buscar</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="b-busca" className="pl-9" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="T042, formulário…" />
                </div>
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              {colunas.map((c) => (
                <section key={c.id} aria-label={c.titulo} className="flex max-h-[70dvh] flex-col rounded-xl border bg-muted/30">
                  <header className="border-b p-3">
                    <h2 className="flex items-center justify-between font-medium">
                      {c.titulo} <span className="text-sm tabular-nums text-muted-foreground">{c.tarefas.length}</span>
                    </h2>
                    <p className="truncate text-xs text-muted-foreground">{c.descricao}</p>
                  </header>
                  <ul className="no-scrollbar flex-1 space-y-2 overflow-y-auto p-3">
                    {c.tarefas.map((t) => <Cartao key={t.id} t={t} fases={feature.fases} historias={feature.historias} />)}
                    {c.tarefas.length === 0 && <li className="py-6 text-center text-xs text-muted-foreground">Nada aqui.</li>}
                  </ul>
                </section>
              ))}
            </div>
          </>}
      </div>
    </DevShell>
  )
}
