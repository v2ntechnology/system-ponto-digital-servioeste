import type { Feriado, FeriadoEntrada } from "@/contracts"
import { useId, useState, type FormEvent } from "react"

import { Campo } from "@/components/form/Campo"
import { RodapeForm } from "@/components/form/Rodape"
import { Dialog } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { useToast } from "@/components/ui/toast"
import { useEu } from "@/features/auth/useAuth"
import { useUnidades } from "@/features/estrutura/api"
import { UFS } from "@/lib/endereco"
import { erroDoCampo, erroGeral } from "@/lib/erros"
import { fmtDate } from "@/lib/format"

import { useAlterarFeriado, useCriarFeriado } from "./api"
import { descreverAbrangencia, NOME_ABRANGENCIA, unidadesDoEscopo } from "./regras"

type Abrangencia = FeriadoEntrada["abrangencia"]

/**
 * Novo feriado ou troca do nome. Data e abrangência não mudam depois de criado: para corrigir, desative e crie outro
 * (assim o histórico mostra o que valia antes). As opções seguem o escopo de quem cadastra (FR-012a).
 */
export function FeriadoForm({ feriado, anoInicial, onFechar }: { feriado?: Feriado; anoInicial: number; onFechar: () => void }) {
  const formId = useId()
  const criar = useCriarFeriado()
  const alterar = useAlterarFeriado()
  const mutacao = feriado ? alterar : criar
  const avisar = useToast()
  const { data: eu } = useEu()
  const { data: unidades = [] } = useUnidades()
  const minhas = eu ? unidadesDoEscopo(eu, unidades.filter((u) => u.ativo)) : []
  const total = eu?.perfil === "administrador" || !!eu?.escopo.todas_unidades
  const permitidas: Abrangencia[] = total ? ["nacional", "estadual", "municipal", "unidade"] : ["municipal", "unidade"]

  // Municípios das unidades do escopo, sem repetir.
  const municipios = [...new Map(minhas.map((u) => [u.municipio_ibge, `${u.endereco.cidade}/${u.endereco.uf}`])).entries()]

  const [data, setData] = useState(`${anoInicial}-01-01`)
  const [nome, setNome] = useState(feriado?.nome ?? "")
  const [abrangencia, setAbrangencia] = useState<Abrangencia>(permitidas[0])
  const [uf, setUf] = useState("SC")
  const [municipio, setMunicipio] = useState("")
  const [unidadeId, setUnidadeId] = useState("")
  const municipioIbge = municipio || municipios[0]?.[0] || ""
  const unidade = unidadeId || minhas[0]?.id || ""

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const concluir = () => {
      avisar(feriado ? "Feriado alterado." : "Feriado cadastrado.")
      onFechar()
    }
    if (feriado) {
      alterar.mutate({ id: feriado.id, nome }, { onSuccess: concluir })
      return
    }
    criar.mutate({
      data, nome, abrangencia,
      uf: abrangencia === "estadual" ? uf : null,
      municipio_ibge: abrangencia === "municipal" ? municipioIbge : null,
      unidade_id: abrangencia === "unidade" ? unidade : null,
    }, { onSuccess: concluir })
  }

  return (
    <Dialog open onClose={onFechar} title={feriado ? "Editar feriado" : "Novo feriado"}
      description={feriado ? `${fmtDate(feriado.data)} · ${descreverAbrangencia(feriado, unidades)}` : "Vale só para as unidades da abrangência escolhida."}
      footer={<RodapeForm formId={formId} pendente={mutacao.isPending} onCancelar={onFechar} />}>
      <form id={formId} onSubmit={submit} className="space-y-4" noValidate>
        {!feriado && (
          <Campo rotulo="Data" erro={erroDoCampo(mutacao.error, "data")}>
            {(p) => <Input {...p} type="date" required value={data} onChange={(e) => setData(e.target.value)} />}
          </Campo>
        )}
        <Campo rotulo="Nome do feriado" erro={erroDoCampo(mutacao.error, "nome")}>
          {(p) => <Input {...p} required value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Aniversário da cidade" />}
        </Campo>
        {!feriado && <>
          <Campo rotulo="Abrangência" ajuda={!total ? "Feriados nacionais e estaduais são cadastrados pelo Administrador." : undefined}>
            {(p) => (
              <Select {...p} value={abrangencia} onChange={(e) => setAbrangencia(e.target.value as Abrangencia)}>
                {permitidas.map((a) => <option key={a} value={a}>{NOME_ABRANGENCIA[a]}</option>)}
              </Select>
            )}
          </Campo>
          {abrangencia === "estadual" && (
            <Campo rotulo="UF" erro={erroDoCampo(mutacao.error, "uf")}>
              {(p) => <Select {...p} value={uf} onChange={(e) => setUf(e.target.value)}>{UFS.map((x) => <option key={x} value={x}>{x}</option>)}</Select>}
            </Campo>
          )}
          {abrangencia === "municipal" && (
            <Campo rotulo="Município" erro={erroDoCampo(mutacao.error, "municipio_ibge")} ajuda="Municípios das unidades cadastradas.">
              {(p) => (
                <Select {...p} value={municipioIbge} onChange={(e) => setMunicipio(e.target.value)}>
                  {municipios.map(([ibge, nomeMun]) => <option key={ibge} value={ibge} data-detalhe={`IBGE ${ibge}`}>{nomeMun}</option>)}
                </Select>
              )}
            </Campo>
          )}
          {abrangencia === "unidade" && (
            <Campo rotulo="Unidade" erro={erroDoCampo(mutacao.error, "unidade_id")} ajuda="Ponto facultativo ou data que vale só para esta unidade.">
              {(p) => (
                <Select {...p} value={unidade} onChange={(e) => setUnidadeId(e.target.value)}>
                  {minhas.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
                </Select>
              )}
            </Campo>
          )}
        </>}
        {erroGeral(mutacao.error) && <p role="alert" className="text-sm text-destructive">{erroGeral(mutacao.error)}</p>}
      </form>
    </Dialog>
  )
}
