import type { Estabelecimento, Unidade } from "@/contracts"
import { useId, useState, type FormEvent } from "react"

import { Campo } from "@/components/form/Campo"
import { EnderecoCampos } from "@/components/form/EnderecoCampos"
import { enderecoValido, enderecoVazio } from "@/lib/endereco"
import { RodapeForm } from "@/components/form/Rodape"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { useToast } from "@/components/ui/toast"
import { formatarIdentificador, NOME_IDENTIFICADOR } from "@/lib/cnpj"
import { somenteDigitos } from "@/lib/cpf"
import { erroDoCampo, erroGeral } from "@/lib/erros"
import { todayIso } from "@/lib/format"

import { useAlterarUnidade, useCriarUnidade } from "./api"

const detalheEst = (e: Estabelecimento) => `${NOME_IDENTIFICADOR[e.tipo_identificador]} ${formatarIdentificador(e.tipo_identificador, e.identificador)}`

/**
 * Unidade (local físico), ligada a um estabelecimento. Na edição, trocar o estabelecimento abre uma nova vigência
 * a partir da data informada; as marcações passadas continuam no estabelecimento antigo.
 */
export function UnidadeForm({ empresaId, estabelecimentos, unidade, estabelecimentoInicial, onFechar }: {
  empresaId: string
  estabelecimentos: Estabelecimento[]
  unidade?: Unidade
  estabelecimentoInicial?: string
  onFechar: () => void
}) {
  const formId = useId()
  const criar = useCriarUnidade()
  const alterar = useAlterarUnidade()
  const mutacao = unidade ? alterar : criar
  const avisar = useToast()
  const ativos = estabelecimentos.filter((e) => e.ativo || e.id === unidade?.estabelecimento_id)
  const [nome, setNome] = useState(unidade?.nome ?? "")
  const [estId, setEstId] = useState(unidade?.estabelecimento_id ?? estabelecimentoInicial ?? ativos[0]?.id ?? "")
  const [ibge, setIbge] = useState(unidade?.municipio_ibge ?? "")
  const [endereco, setEndereco] = useState(unidade?.endereco ?? enderecoVazio())
  const [trocar, setTrocar] = useState(false)
  const [inicio, setInicio] = useState(todayIso())
  const [erroLocal, setErroLocal] = useState<{ campo: string; msg: string }>()

  const copiarEndereco = () => {
    const est = estabelecimentos.find((e) => e.id === estId)
    if (est) setEndereco(est.endereco)
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!/^\d{7}$/.test(ibge)) return setErroLocal({ campo: "municipio_ibge", msg: "O código IBGE tem 7 dígitos." })
    if (!enderecoValido(endereco)) return setErroLocal({ campo: "endereco", msg: "Preencha o endereço completo (o complemento é opcional)." })
    setErroLocal(undefined)
    const concluir = () => {
      avisar(unidade ? "Unidade alterada." : "Unidade cadastrada.")
      onFechar()
    }
    if (unidade) {
      alterar.mutate({
        id: unidade.id, nome, endereco,
        ...(trocar && estId !== unidade.estabelecimento_id ? { novo_estabelecimento: { estabelecimento_id: estId, inicio } } : {}),
      }, { onSuccess: concluir })
    } else {
      criar.mutate({ empresa_id: empresaId, estabelecimento_id: estId, nome, endereco, municipio_ibge: ibge }, { onSuccess: concluir })
    }
  }

  const erro = (campo: string) => (erroLocal?.campo === campo ? erroLocal.msg : erroDoCampo(mutacao.error, campo))
  const podeEscolherEst = !unidade || trocar

  return (
    <Dialog open onClose={onFechar} className="max-w-2xl" title={unidade ? "Editar unidade" : "Nova unidade"}
      description="Local físico de trabalho. Recebe setores, funcionários e feriados."
      footer={<RodapeForm formId={formId} pendente={mutacao.isPending} onCancelar={onFechar} />}>
      <form id={formId} onSubmit={submit} className="space-y-5" noValidate>
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo rotulo="Nome da unidade" erro={erro("nome")}>
            {(p) => <Input {...p} required value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: São Cristóvão" />}
          </Campo>
          <Campo rotulo="Código IBGE do município" erro={erro("municipio_ibge")} ajuda="7 dígitos. Define os feriados municipais.">
            {(p) => (
              <Input {...p} inputMode="numeric" required disabled={!!unidade} value={ibge}
                onChange={(e) => setIbge(somenteDigitos(e.target.value).slice(0, 7))} placeholder="Ex.: 4204202" />
            )}
          </Campo>
        </div>

        <div className="space-y-3 rounded-xl border p-4">
          {unidade && (
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={trocar} onChange={(e) => setTrocar(e.target.checked)} />
              Trocar o estabelecimento desta unidade
            </label>
          )}
          <Campo rotulo="Estabelecimento (CNPJ)" erro={erro("estabelecimento_id")}
            ajuda={unidade && trocar ? "As marcações anteriores continuam no estabelecimento antigo." : undefined}>
            {(p) => (
              <Select {...p} value={estId} disabled={!podeEscolherEst} onChange={(e) => setEstId(e.target.value)}>
                {ativos.map((e) => <option key={e.id} value={e.id} data-detalhe={detalheEst(e)}>{e.razao_social}</option>)}
              </Select>
            )}
          </Campo>
          {unidade && trocar && (
            <Campo rotulo="A partir de">
              {(p) => <Input {...p} type="date" required value={inicio} onChange={(e) => setInicio(e.target.value)} />}
            </Campo>
          )}
        </div>

        <div className="space-y-2">
          <button type="button" onClick={copiarEndereco} className="text-xs text-brand underline-offset-4 hover:underline">
            Copiar o endereço do estabelecimento
          </button>
          <EnderecoCampos valor={endereco} onChange={setEndereco} erroCep={erro("cep")} />
        </div>
        {erro("endereco") && <p role="alert" className="text-sm text-destructive">{erro("endereco")}</p>}
        {erroGeral(mutacao.error) && <p role="alert" className="text-sm text-destructive">{erroGeral(mutacao.error)}</p>}
      </form>
    </Dialog>
  )
}
