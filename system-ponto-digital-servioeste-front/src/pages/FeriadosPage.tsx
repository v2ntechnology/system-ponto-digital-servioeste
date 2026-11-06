import type { Feriado } from "@/contracts"
import { CalendarDays, Pencil, Plus, Power } from "lucide-react"
import { useState } from "react"

import { AppShell } from "@/components/layout/AppShell"
import { Cabecalho } from "@/components/layout/Cabecalho"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Confirmar } from "@/components/ui/confirmar"
import { Carregando, ErroCarga, Vazio } from "@/components/ui/estados"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { useToast } from "@/components/ui/toast"
import { useEu } from "@/features/auth/useAuth"
import { useUnidades } from "@/features/estrutura/api"
import { useAlterarFeriado, useFeriados } from "@/features/feriados/api"
import { FeriadoForm } from "@/features/feriados/FeriadoForm"
import { descreverAbrangencia, podeEditarFeriado } from "@/features/feriados/regras"
import { usePermissao } from "@/lib/permissoes"
import { cn } from "@/lib/utils"

const mes = new Intl.DateTimeFormat("pt-BR", { month: "long" })
const diaSemana = new Intl.DateTimeFormat("pt-BR", { weekday: "short" })
const dataLocal = (iso: string) => new Date(`${iso}T12:00:00`)

type Dialogo = { tipo: "form"; feriado?: Feriado } | { tipo: "ativo"; feriado: Feriado } | null

function ConfirmarAtivo({ f, onFechar }: { f: Feriado; onFechar: () => void }) {
  const alterar = useAlterarFeriado()
  const avisar = useToast()
  return (
    <Confirmar titulo={f.ativo ? "Desativar feriado?" : "Reativar feriado?"}
      descricao={f.ativo
        ? `"${f.nome}" deixa de valer no cálculo de jornada. Períodos já fechados não mudam, e o registro continua guardado.`
        : `"${f.nome}" volta a valer.`}
      rotulo={f.ativo ? "Desativar" : "Reativar"} perigo={f.ativo} pendente={alterar.isPending} erro={alterar.error?.message}
      onFechar={onFechar}
      onConfirmar={() => alterar.mutate({ id: f.id, ativo: !f.ativo }, { onSuccess: () => { avisar(f.ativo ? "Feriado desativado." : "Feriado reativado."); onFechar() } })} />
  )
}

export function FeriadosPage() {
  const anoAtual = new Date().getFullYear()
  const [ano, setAno] = useState(anoAtual)
  const [unidadeId, setUnidadeId] = useState("")
  const [mostrarInativos, setMostrarInativos] = useState(false)
  const [dialogo, setDialogo] = useState<Dialogo>(null)
  const { data: eu } = useEu()
  const { data: unidades = [] } = useUnidades()
  const podeCadastrar = usePermissao("feriado.editar")
  const { data = [], isLoading, error, refetch } = useFeriados(ano, unidadeId || undefined)

  const lista = data.filter((f) => mostrarInativos || f.ativo)
  const porMes = new Map<number, Feriado[]>()
  for (const f of lista) {
    const m = dataLocal(f.data).getMonth()
    porMes.set(m, [...(porMes.get(m) ?? []), f])
  }
  const editavel = (f: Feriado) => !!eu && podeCadastrar && podeEditarFeriado(eu, f, unidades)

  return (
    <AppShell>
      <Cabecalho icone={CalendarDays} titulo="Feriados"
        descricao="Calendário usado no cálculo de jornada. Cada feriado vale só para as unidades da sua abrangência."
        acoes={podeCadastrar && <Button onClick={() => setDialogo({ tipo: "form" })}><Plus /> Novo feriado</Button>} />
      <div className="space-y-5 p-5 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-[10rem_1fr_auto] sm:items-end">
          <div className="space-y-1.5">
            <Label htmlFor="f-ano">Ano</Label>
            <Select id="f-ano" value={String(ano)} onChange={(e) => setAno(Number(e.target.value))}>
              {[anoAtual - 1, anoAtual, anoAtual + 1, anoAtual + 2].map((a) => <option key={a} value={a}>{a}</option>)}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="f-unidade">Ver o calendário de</Label>
            <Select id="f-unidade" value={unidadeId} onChange={(e) => setUnidadeId(e.target.value)}>
              <option value="" data-detalhe="Todos os feriados do seu escopo">Todas as unidades</option>
              {unidades.map((u) => <option key={u.id} value={u.id} data-detalhe={`${u.endereco.cidade}/${u.endereco.uf}`}>{u.nome}</option>)}
            </Select>
          </div>
          {!unidadeId && (
            <label className="flex items-center gap-2 pb-2.5 text-sm text-muted-foreground">
              <Checkbox checked={mostrarInativos} onChange={(e) => setMostrarInativos(e.target.checked)} /> Mostrar inativos
            </label>
          )}
        </div>
        {unidadeId && (
          <p className="text-sm text-muted-foreground">
            Calendário efetivo da unidade: nacionais, estaduais da UF, municipais do município e os da própria unidade.
          </p>
        )}

        {isLoading ? <Carregando /> : error ? <ErroCarga mensagem={error.message} onTentarDeNovo={() => refetch()} />
          : lista.length === 0 ? <Vazio icone={CalendarDays} titulo={`Nenhum feriado em ${ano}`}
              acao={podeCadastrar && <Button onClick={() => setDialogo({ tipo: "form" })}><Plus /> Novo feriado</Button>} />
          : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[...porMes.entries()].map(([m, feriados]) => (
                <section key={m} aria-label={mes.format(new Date(ano, m, 1))} className="rounded-xl border bg-background">
                  <h2 className="border-b px-4 py-2.5 text-sm font-medium capitalize">{mes.format(new Date(ano, m, 1))}</h2>
                  <ul className="divide-y">
                    {feriados.map((f) => (
                      <li key={f.id} className={cn("flex items-start gap-3 px-4 py-3", !f.ativo && "opacity-60")}>
                        <div className="w-10 shrink-0 text-center">
                          {/* Como na folhinha: feriado nacional em vermelho. */}
                          <p className={cn("text-lg font-medium leading-none tabular-nums", f.abrangencia === "nacional" && "text-destructive")}>
                            {f.data.slice(8, 10)}
                          </p>
                          <p className="text-xs text-muted-foreground">{diaSemana.format(dataLocal(f.data)).replace(".", "")}</p>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={cn("text-sm font-medium", !f.ativo && "line-through")}>{f.nome}</p>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            <Badge variant={f.abrangencia === "nacional" ? "destructive" : "brand"}>{descreverAbrangencia(f, unidades)}</Badge>
                            {!f.ativo && <Badge>Inativo</Badge>}
                          </div>
                        </div>
                        {editavel(f) && (
                          <div className="flex shrink-0 gap-0.5">
                            <Button variant="ghost" size="icon" className="size-8" aria-label={`Editar ${f.nome}`} title="Editar"
                              onClick={() => setDialogo({ tipo: "form", feriado: f })}><Pencil /></Button>
                            <Button variant="ghost" size="icon" className="size-8" aria-label={`${f.ativo ? "Desativar" : "Reativar"} ${f.nome}`}
                              title={f.ativo ? "Desativar" : "Reativar"} onClick={() => setDialogo({ tipo: "ativo", feriado: f })}><Power /></Button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
      </div>
      {dialogo?.tipo === "form" && <FeriadoForm feriado={dialogo.feriado} anoInicial={ano} onFechar={() => setDialogo(null)} />}
      {dialogo?.tipo === "ativo" && <ConfirmarAtivo f={dialogo.feriado} onFechar={() => setDialogo(null)} />}
    </AppShell>
  )
}
