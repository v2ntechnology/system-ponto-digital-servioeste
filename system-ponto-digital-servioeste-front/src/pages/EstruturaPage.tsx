import type { Empresa, Estabelecimento, Setor, Unidade } from "@/contracts"
import { Building2, Landmark, MapPin, Pencil, Plus, Power } from "lucide-react"
import { useState } from "react"

import { AppShell } from "@/components/layout/AppShell"
import { Cabecalho } from "@/components/layout/Cabecalho"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Confirmar } from "@/components/ui/confirmar"
import { Carregando, ErroCarga, Vazio } from "@/components/ui/estados"
import { useToast } from "@/components/ui/toast"
import {
  useAlterarEmpresa, useAlterarEstabelecimento, useAlterarSetor, useAlterarUnidade, useEstrutura,
} from "@/features/estrutura/api"
import { EmpresaForm } from "@/features/estrutura/EmpresaForm"
import { EstabelecimentoForm } from "@/features/estrutura/EstabelecimentoForm"
import { SetorForm } from "@/features/estrutura/SetorForm"
import { UnidadeForm } from "@/features/estrutura/UnidadeForm"
import { formatarIdentificador, NOME_IDENTIFICADOR } from "@/lib/cnpj"
import { usePermissao } from "@/lib/permissoes"
import { cn } from "@/lib/utils"

type Dialogo =
  | { tipo: "empresa"; empresa?: Empresa }
  | { tipo: "estabelecimento"; empresaId: string; estabelecimento?: Estabelecimento }
  | { tipo: "unidade"; empresaId: string; unidade?: Unidade; estabelecimentoId?: string }
  | { tipo: "setor"; unidade: Unidade; setor?: Setor }
  | { tipo: "ativar"; alvo: "empresa" | "estabelecimento" | "unidade" | "setor"; id: string; nome: string; ativo: boolean }
  | null

const NOME_ALVO = { empresa: "a empresa", estabelecimento: "o estabelecimento", unidade: "a unidade", setor: "o setor" }

function Identificador({ tipo, valor }: { tipo: Estabelecimento["tipo_identificador"]; valor: string }) {
  return (
    <span className="text-xs text-muted-foreground tabular-nums">
      {NOME_IDENTIFICADOR[tipo]} {formatarIdentificador(tipo, valor)}
    </span>
  )
}

function Acao({ rotulo, icone: Icone, onClick }: { rotulo: string; icone: typeof Pencil; onClick: () => void }) {
  return (
    <Button variant="ghost" size="icon" aria-label={rotulo} title={rotulo} onClick={onClick} className="size-8">
      <Icone />
    </Button>
  )
}

/** Desativar/reativar com confirmação. Nada com histórico é apagado (FR-015). */
function ConfirmarAtivo({ d, onFechar }: { d: Extract<Dialogo, { tipo: "ativar" }>; onFechar: () => void }) {
  const mutacoes = {
    empresa: useAlterarEmpresa(), estabelecimento: useAlterarEstabelecimento(), unidade: useAlterarUnidade(), setor: useAlterarSetor(),
  }
  const m = mutacoes[d.alvo]
  const avisar = useToast()
  const desativar = d.ativo
  return (
    <Confirmar
      titulo={`${desativar ? "Desativar" : "Reativar"} ${NOME_ALVO[d.alvo]}?`}
      descricao={desativar
        ? `"${d.nome}" deixa de aparecer nas escolhas do dia a dia. Nada é apagado: o histórico e os registros continuam guardados.`
        : `"${d.nome}" volta a aparecer nas escolhas do dia a dia.`}
      rotulo={desativar ? "Desativar" : "Reativar"} perigo={desativar} pendente={m.isPending} erro={m.error?.message}
      onFechar={onFechar}
      onConfirmar={() => m.mutate({ id: d.id, ativo: !d.ativo }, {
        onSuccess: () => {
          avisar(desativar ? "Desativado." : "Reativado.")
          onFechar()
        },
      })} />
  )
}

export function EstruturaPage() {
  const { empresas, estabelecimentos, unidades, setores, carregando, erro, recarregar } = useEstrutura()
  const editar = usePermissao("estrutura.editar")
  const [mostrarInativos, setMostrarInativos] = useState(false)
  const [dialogo, setDialogo] = useState<Dialogo>(null)
  const fechar = () => setDialogo(null)

  const filtrar = <T extends { ativo: boolean }>(lista: T[]) => (mostrarInativos ? lista : lista.filter((x) => x.ativo))
  const ativar = (alvo: "empresa" | "estabelecimento" | "unidade" | "setor", x: { id: string; ativo: boolean }, nome: string) =>
    setDialogo({ tipo: "ativar", alvo, id: x.id, ativo: x.ativo, nome })

  return (
    <AppShell>
      <Cabecalho icone={Building2} titulo="Estrutura"
        descricao="Empresas, estabelecimentos (CNPJs), unidades e setores. Cada estabelecimento tem a sua própria numeração legal das batidas (NSR)."
        acoes={editar && <Button onClick={() => setDialogo({ tipo: "empresa" })}><Plus /> Nova empresa</Button>} />

      <div className="space-y-5 p-5 sm:p-6">
        <label className="flex w-fit items-center gap-2 text-sm text-muted-foreground">
          <Checkbox checked={mostrarInativos} onChange={(e) => setMostrarInativos(e.target.checked)} /> Mostrar inativos
        </label>

        {carregando ? <Carregando />
          : erro ? <ErroCarga mensagem={erro.message} onTentarDeNovo={recarregar} />
          : filtrar(empresas).length === 0
            ? <Vazio icone={Building2} titulo="Nenhuma empresa cadastrada"
                descricao={editar ? "Comece pela empresa empregadora. Depois cadastre os estabelecimentos, as unidades e os setores." : undefined}
                acao={editar && <Button onClick={() => setDialogo({ tipo: "empresa" })}><Plus /> Nova empresa</Button>} />
            : filtrar(empresas).map((empresa) => {
              const ests = filtrar(estabelecimentos.filter((e) => e.empresa_id === empresa.id))
              return (
                <section key={empresa.id} aria-label={empresa.razao_social}
                  className={cn("overflow-hidden rounded-xl border bg-background", !empresa.ativo && "opacity-60")}>
                  <header className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
                    <div className="min-w-0">
                      <h2 className="flex flex-wrap items-center gap-2 font-medium">
                        <Building2 className="size-4 text-brand" /> {empresa.razao_social}
                        {!empresa.ativo && <Badge>Inativa</Badge>}
                      </h2>
                      <Identificador tipo={empresa.tipo_identificador} valor={empresa.identificador} />
                    </div>
                    {editar && (
                      <div className="flex items-center gap-1">
                        <Acao rotulo="Editar empresa" icone={Pencil} onClick={() => setDialogo({ tipo: "empresa", empresa })} />
                        <Acao rotulo={empresa.ativo ? "Desativar empresa" : "Reativar empresa"} icone={Power}
                          onClick={() => ativar("empresa", empresa, empresa.razao_social)} />
                        <Button size="sm" variant="outline" onClick={() => setDialogo({ tipo: "estabelecimento", empresaId: empresa.id })}>
                          <Plus /> Estabelecimento
                        </Button>
                      </div>
                    )}
                  </header>

                  {ests.length === 0 && (
                    <p className="p-4 text-sm text-muted-foreground">Nenhum estabelecimento nesta empresa.</p>
                  )}

                  <ul className="divide-y">
                    {ests.map((est) => {
                      const unis = filtrar(unidades.filter((u) => u.estabelecimento_id === est.id))
                      return (
                        <li key={est.id} className={cn("space-y-3 p-4", !est.ativo && "opacity-60")}>
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                                <Landmark className="size-4 text-brand" /> {est.razao_social}
                                {!est.ativo && <Badge>Inativo</Badge>}
                              </p>
                              <p className="flex flex-wrap gap-x-3">
                                <Identificador tipo={est.tipo_identificador} valor={est.identificador} />
                                <span className="text-xs text-muted-foreground">{est.endereco.cidade}/{est.endereco.uf}</span>
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Badge variant="outline" title="Último número sequencial de registro gravado neste estabelecimento">
                                NSR {est.ultimo_nsr}
                              </Badge>
                              {editar && <>
                                <Acao rotulo="Editar estabelecimento" icone={Pencil}
                                  onClick={() => setDialogo({ tipo: "estabelecimento", empresaId: empresa.id, estabelecimento: est })} />
                                <Acao rotulo={est.ativo ? "Desativar estabelecimento" : "Reativar estabelecimento"} icone={Power}
                                  onClick={() => ativar("estabelecimento", est, est.razao_social)} />
                                <Button size="sm" variant="outline"
                                  onClick={() => setDialogo({ tipo: "unidade", empresaId: empresa.id, estabelecimentoId: est.id })}>
                                  <Plus /> Unidade
                                </Button>
                              </>}
                            </div>
                          </div>

                          {unis.length > 0 && (
                            <ul className="space-y-2 sm:pl-6">
                              {unis.map((u) => {
                                const sets = filtrar(setores.filter((s) => s.unidade_id === u.id))
                                return (
                                  <li key={u.id} className={cn("rounded-lg border bg-card p-3", !u.ativo && "opacity-60")}>
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                      <div>
                                        <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                                          <MapPin className="size-4 text-brand" /> {u.nome}
                                          {!u.ativo && <Badge>Inativa</Badge>}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {u.endereco.cidade}/{u.endereco.uf} · IBGE {u.municipio_ibge}
                                        </p>
                                      </div>
                                      {editar && (
                                        <div className="flex items-center gap-1">
                                          <Acao rotulo={`Editar unidade ${u.nome}`} icone={Pencil}
                                            onClick={() => setDialogo({ tipo: "unidade", empresaId: empresa.id, unidade: u })} />
                                          <Acao rotulo={u.ativo ? `Desativar unidade ${u.nome}` : `Reativar unidade ${u.nome}`} icone={Power}
                                            onClick={() => ativar("unidade", u, u.nome)} />
                                        </div>
                                      )}
                                    </div>
                                    <div className="mt-2 flex flex-wrap items-center gap-1.5" aria-label={`Setores de ${u.nome}`}>
                                      {sets.length === 0 && <span className="text-xs text-muted-foreground">Sem setores.</span>}
                                      {sets.map((s) => editar ? (
                                        <button key={s.id} type="button" title="Editar setor"
                                          onClick={() => setDialogo({ tipo: "setor", unidade: u, setor: s })}
                                          className={cn("rounded-full border px-2.5 py-0.5 text-xs transition-colors hover:border-brand hover:text-brand",
                                            !s.ativo && "line-through opacity-60")}>
                                          {s.nome}
                                        </button>
                                      ) : (
                                        <Badge key={s.id} variant="outline">{s.nome}</Badge>
                                      ))}
                                      {editar && (
                                        <button type="button" onClick={() => setDialogo({ tipo: "setor", unidade: u })}
                                          className="inline-flex items-center gap-1 rounded-full border border-dashed px-2.5 py-0.5 text-xs text-muted-foreground hover:border-brand hover:text-brand">
                                          <Plus className="size-3" /> Setor
                                        </button>
                                      )}
                                    </div>
                                  </li>
                                )
                              })}
                            </ul>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </section>
              )
            })}
      </div>

      {dialogo?.tipo === "empresa" && <EmpresaForm empresa={dialogo.empresa} onFechar={fechar} />}
      {dialogo?.tipo === "estabelecimento" && (
        <EstabelecimentoForm empresaId={dialogo.empresaId} estabelecimento={dialogo.estabelecimento} onFechar={fechar} />
      )}
      {dialogo?.tipo === "unidade" && (
        <UnidadeForm empresaId={dialogo.empresaId} unidade={dialogo.unidade} estabelecimentoInicial={dialogo.estabelecimentoId}
          estabelecimentos={estabelecimentos.filter((e) => e.empresa_id === dialogo.empresaId)} onFechar={fechar} />
      )}
      {dialogo?.tipo === "setor" && (
        <SetorForm unidadeId={dialogo.unidade.id} unidadeNome={dialogo.unidade.nome} setor={dialogo.setor} onFechar={fechar} />
      )}
      {dialogo?.tipo === "ativar" && <ConfirmarAtivo d={dialogo} onFechar={fechar} />}
    </AppShell>
  )
}
