import { FileMinus, FilePen, FilePlus, FileSymlink, History } from "lucide-react"
import { useState } from "react"

import { Cabecalho } from "@/components/layout/Cabecalho"
import { Badge } from "@/components/ui/badge"
import { Carregando, ErroCarga, Vazio } from "@/components/ui/estados"
import { Tabs } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

import { useHistorico } from "./api"
import { DevShell } from "./DevShell"
import { NOME_STATUS_ARQUIVO, NOME_TIPO_COMMIT } from "./rotulos"
import type { Commit, StatusArquivo } from "./tipos"

type Filtro = "todos" | "nova" | "atualizado" | "apagado" | "documentacao"

const ICONE_STATUS = { adicionado: FilePlus, modificado: FilePen, apagado: FileMinus, renomeado: FileSymlink }
const COR_STATUS: Record<StatusArquivo, string> = {
  adicionado: "text-brand", modificado: "text-muted-foreground", apagado: "text-destructive", renomeado: "text-muted-foreground",
}

const dia = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
const hora = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" })
const semPrefixo = (m: string) => m.replace(/^[a-z]+(\([^)]*\))?!?:\s*/, "")

function filtrar(c: Commit, f: Filtro) {
  if (f === "todos") return true
  if (f === "apagado") return c.arquivos.some((a) => a.status === "apagado")
  return c.tipo === f
}

function CartaoCommit({ c }: { c: Commit }) {
  const conta = (s: StatusArquivo) => c.arquivos.filter((a) => a.status === s).length
  return (
    <li className="rounded-xl border bg-background p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={c.tipo === "nova" ? "brand" : "outline"}>{NOME_TIPO_COMMIT[c.tipo]}</Badge>
        <span className="font-medium">{semPrefixo(c.mensagem)}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground tabular-nums">
        {hora.format(new Date(c.data))} · {c.autor} · <code>{c.curto}</code>
      </p>
      <div className="mt-2 flex flex-wrap gap-2 text-xs">
        {(["adicionado", "modificado", "apagado", "renomeado"] as const).map((s) => conta(s) > 0 && (
          <span key={s} className={cn("inline-flex items-center gap-1", COR_STATUS[s])}>
            {(() => { const I = ICONE_STATUS[s]; return <I className="size-3.5" /> })()}
            {conta(s)} {NOME_STATUS_ARQUIVO[s].toLowerCase()}{conta(s) > 1 ? "s" : ""}
          </span>
        ))}
      </div>
      {c.arquivos.length > 0 && (
        <details className="mt-2">
          <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">Ver arquivos</summary>
          <ul className="mt-2 space-y-1 text-xs">
            {c.arquivos.map((a, i) => {
              const I = ICONE_STATUS[a.status]
              return (
                <li key={i} className={cn("flex items-start gap-1.5 break-all", COR_STATUS[a.status])}>
                  <I className="mt-0.5 size-3.5 shrink-0" />
                  <span><span className="font-medium">{NOME_STATUS_ARQUIVO[a.status]}:</span>{" "}
                    {a.anterior ? `${a.anterior} → ${a.caminho}` : a.caminho}</span>
                </li>
              )
            })}
          </ul>
        </details>
      )}
    </li>
  )
}

export function HistoricoPage() {
  const { data = [], isLoading, error, refetch } = useHistorico()
  const [filtro, setFiltro] = useState<Filtro>("todos")
  const lista = data.filter((c) => filtrar(c, filtro))
  const porDia = new Map<string, Commit[]>()
  for (const c of lista) {
    const d = dia.format(new Date(c.data))
    porDia.set(d, [...(porDia.get(d) ?? []), c])
  }
  const n = (f: Filtro) => data.filter((c) => filtrar(c, f)).length

  return (
    <DevShell>
      <Cabecalho icone={History} titulo="Histórico de atualizações"
        descricao="Lido do git: feat = nova funcionalidade; fix, refactor, perf e style = atualizado; arquivos removidos aparecem como apagados." />
      <div className="space-y-5 p-5 sm:p-6">
        <Tabs value={filtro} onChange={setFiltro} abas={[
          { value: "todos", label: "Todos", count: n("todos") },
          { value: "nova", label: "Novas funcionalidades", count: n("nova") },
          { value: "atualizado", label: "Atualizados", count: n("atualizado") },
          { value: "apagado", label: "Com arquivos apagados", count: n("apagado") },
          { value: "documentacao", label: "Documentação", count: n("documentacao") },
        ]} />
        {isLoading ? <Carregando /> : error ? <ErroCarga mensagem={error.message} onTentarDeNovo={() => refetch()} />
          : lista.length === 0 ? <Vazio icone={History} titulo="Nada neste filtro" />
          : [...porDia.entries()].map(([d, commits]) => (
            <section key={d} aria-label={d} className="space-y-2">
              <h2 className="text-sm font-medium capitalize text-muted-foreground">{d}</h2>
              <ul className="space-y-2">{commits.map((c) => <CartaoCommit key={c.hash} c={c} />)}</ul>
            </section>
          ))}
      </div>
    </DevShell>
  )
}
