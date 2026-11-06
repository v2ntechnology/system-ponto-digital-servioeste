import { CheckCircle2, ChevronDown, Circle, CircleDot, Map } from "lucide-react"
import { useState } from "react"

import { Cabecalho } from "@/components/layout/Cabecalho"
import { Badge } from "@/components/ui/badge"
import { Carregando, ErroCarga } from "@/components/ui/estados"
import { cn } from "@/lib/utils"

import { usePlano } from "./api"
import { Barra } from "./Barra"
import { DevShell } from "./DevShell"
import { contar, faseAtual, tarefasDa } from "./progresso"
import { NOME_ETAPA } from "./rotulos"
import type { FeaturePlano } from "./tipos"

function Fases({ f }: { f: FeaturePlano }) {
  const atual = faseAtual(f)
  return (
    <ol className="mt-4 space-y-2 border-t pt-4">
      {f.fases.map((fase) => {
        const { feitas, total } = contar(fase.tarefas)
        const concluida = feitas === total && total > 0
        const emAndamento = fase === atual
        const Icone = concluida ? CheckCircle2 : emAndamento ? CircleDot : Circle
        return (
          <li key={fase.numero} className={cn("rounded-lg p-3", emAndamento && "border border-brand/40 bg-brand/5")}>
            <div className="flex flex-wrap items-center gap-2">
              <Icone className={cn("size-4 shrink-0", concluida || emAndamento ? "text-brand" : "text-muted-foreground")} />
              <span className="text-sm font-medium">Fase {fase.numero}: {fase.titulo}</span>
              {fase.parte && <Badge>{fase.parte.split(":")[0]}</Badge>}
              {emAndamento && <Badge variant="brand">Próxima</Badge>}
            </div>
            <Barra feitas={feitas} total={total} className="mt-2 pl-6" />
            {fase.pontoDeControle && (emAndamento || concluida) && (
              <p className="mt-2 pl-6 text-xs text-muted-foreground"><strong>Ponto de controle:</strong> {fase.pontoDeControle}</p>
            )}
          </li>
        )
      })}
    </ol>
  )
}

function CartaoFeature({ f, aberta, onAlternar }: { f: FeaturePlano; aberta: boolean; onAlternar: () => void }) {
  const { feitas, total } = contar(tarefasDa(f))
  const temFases = f.fases.length > 0
  return (
    <li className="rounded-xl border bg-background p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 font-medium">
            <span className="tabular-nums text-muted-foreground">{f.numero}</span> {f.titulo}
            <Badge variant={f.etapa === "nao_iniciada" ? "default" : "brand"}>{NOME_ETAPA[f.etapa]}</Badge>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{f.objetivo}</p>
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>Depende de: {f.dependeDe.length ? f.dependeDe.join(", ") : "nenhuma"}</span>
            {f.pendencias.length > 0 && <span>Pendências: {f.pendencias.join(", ")}</span>}
            {f.pastaSpec && <span>Spec: <code>{f.pastaSpec}</code></span>}
          </p>
        </div>
        {temFases && (
          <button type="button" onClick={onAlternar} aria-expanded={aberta}
            className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs hover:bg-accent">
            Fases <ChevronDown className={cn("size-3.5 transition-transform", aberta && "rotate-180")} />
          </button>
        )}
      </div>
      {total > 0 && <Barra feitas={feitas} total={total} className="mt-3" />}
      {temFases && aberta && <Fases f={f} />}
    </li>
  )
}

export function PlanoPage() {
  const { data, isLoading, error, refetch } = usePlano()
  const [abertas, setAbertas] = useState<Record<string, boolean>>({})
  const features = data?.features ?? []
  const emAndamento = features.find((f) => f.etapa !== "nao_iniciada" && faseAtual(f))

  return (
    <DevShell>
      <Cabecalho icone={Map} titulo="Plano de desenvolvimento"
        descricao="As 9 features do briefing e o andamento de cada uma no Spec Kit. Lido de docs/briefing e de specs/*/tasks.md." />
      <div className="space-y-4 p-5 sm:p-6">
        {isLoading ? <Carregando /> : error ? <ErroCarga mensagem={error.message} onTentarDeNovo={() => refetch()} /> : <>
          {emAndamento && (
            <div className="rounded-xl border border-brand/40 bg-brand/5 p-4 text-sm">
              Em andamento: <strong>{emAndamento.numero} {emAndamento.titulo}</strong>, próxima fase{" "}
              <strong>{faseAtual(emAndamento)?.numero}: {faseAtual(emAndamento)?.titulo}</strong>.
            </div>
          )}
          <ul className="space-y-3">
            {features.map((f) => (
              <CartaoFeature key={f.numero} f={f} aberta={abertas[f.numero] ?? f === emAndamento}
                onAlternar={() => setAbertas((a) => ({ ...a, [f.numero]: !(a[f.numero] ?? f === emAndamento) }))} />
            ))}
          </ul>
        </>}
      </div>
    </DevShell>
  )
}
