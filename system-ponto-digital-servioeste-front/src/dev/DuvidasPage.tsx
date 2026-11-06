import { CheckCircle2, MessageCircleQuestion, Search } from "lucide-react"
import { useState } from "react"

import { Cabecalho } from "@/components/layout/Cabecalho"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Carregando, ErroCarga, Vazio } from "@/components/ui/estados"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Tabs } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/toast"

import { usePendencias, useResponderPendencia } from "./api"
import { DevShell } from "./DevShell"
import type { Pendencia } from "./tipos"

type Filtro = "pendentes" | "respondidas" | "todas"

function Item({ p }: { p: Pendencia }) {
  const [texto, setTexto] = useState(p.resposta)
  const responder = useResponderPendencia()
  const avisar = useToast()
  const mudou = texto.trim() !== p.resposta.trim()
  const id = `resp-${p.codigo}`

  return (
    <li className="rounded-xl border bg-background p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium tabular-nums">{p.codigo}</span>
        <Badge variant={p.prazo.includes("desenvolvimento") ? "destructive" : "outline"}>{p.prazo}</Badge>
        {p.resposta && <Badge variant="brand"><CheckCircle2 className="size-3" /> Respondida</Badge>}
      </div>
      <p className="mt-2 text-sm">{p.pergunta}</p>
      {p.features.length > 0 && <p className="mt-1 text-xs text-muted-foreground">Afeta: {p.features.join(" · ")}</p>}
      <div className="mt-3 space-y-2">
        <Label htmlFor={id} className="text-xs text-muted-foreground">Resposta do RH</Label>
        <Textarea id={id} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Anote a resposta da reunião…" />
        <div className="flex items-center justify-end gap-2">
          {responder.isError && <p role="alert" className="text-xs text-destructive">{responder.error.message}</p>}
          <Button size="sm" disabled={!mudou || responder.isPending}
            onClick={() => responder.mutate({ codigo: p.codigo, resposta: texto }, { onSuccess: () => avisar(`${p.codigo} salva em pendencias.md.`) })}>
            {responder.isPending ? "Salvando…" : "Salvar resposta"}
          </Button>
        </div>
      </div>
    </li>
  )
}

export function DuvidasPage() {
  const { data = [], isLoading, error, refetch } = usePendencias()
  const [filtro, setFiltro] = useState<Filtro>("pendentes")
  const [prazo, setPrazo] = useState("")
  const [busca, setBusca] = useState("")
  const prazos = [...new Set(data.map((p) => p.prazo))]
  const termo = busca.trim().toLowerCase()
  const lista = data.filter((p) =>
    (filtro === "todas" || (filtro === "respondidas" ? !!p.resposta : !p.resposta))
    && (!prazo || p.prazo === prazo)
    && (!termo || `${p.codigo} ${p.pergunta} ${p.resposta}`.toLowerCase().includes(termo)))
  const grupos = [...new Set(lista.map((p) => p.grupo))]
  const respondidas = data.filter((p) => p.resposta).length

  return (
    <DevShell>
      <Cabecalho icone={MessageCircleQuestion} titulo="Dúvidas do RH"
        descricao="Perguntas de docs/briefing/pendencias.md (mesmos códigos do .docx). A resposta é gravada direto no arquivo." />
      <div className="space-y-5 p-5 sm:p-6">
        <div className="rounded-xl border border-brand/40 bg-brand/5 p-4 text-sm">
          <strong>{respondidas} de {data.length}</strong> respondidas. Depois da reunião: atualize <code>decisoes.md</code> com o que
          mudou e faça o commit de <code>pendencias.md</code>.
        </div>
        <div className="grid gap-3 sm:grid-cols-[auto_1fr_1fr] sm:items-end">
          <Tabs value={filtro} onChange={setFiltro} abas={[
            { value: "pendentes", label: "Pendentes", count: data.length - respondidas },
            { value: "respondidas", label: "Respondidas", count: respondidas },
            { value: "todas", label: "Todas", count: data.length },
          ]} />
          <div className="space-y-1.5">
            <Label htmlFor="d-prazo">Prazo</Label>
            <Select id="d-prazo" value={prazo} onChange={(e) => setPrazo(e.target.value)}>
              <option value="">Todos</option>
              {prazos.map((p) => <option key={p} value={p}>{p}</option>)}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="d-busca">Buscar</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="d-busca" className="pl-9" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="RH-03, CNPJ, banco de horas…" />
            </div>
          </div>
        </div>
        {isLoading ? <Carregando /> : error ? <ErroCarga mensagem={error.message} onTentarDeNovo={() => refetch()} />
          : lista.length === 0 ? <Vazio icone={MessageCircleQuestion} titulo="Nenhuma pergunta neste filtro" />
          : grupos.map((g) => (
            <section key={g} aria-label={g} className="space-y-2">
              <h2 className="font-medium">{g}</h2>
              <ul className="space-y-2">{lista.filter((p) => p.grupo === g).map((p) => <Item key={`${p.codigo}-${p.resposta}`} p={p} />)}</ul>
            </section>
          ))}
      </div>
    </DevShell>
  )
}
