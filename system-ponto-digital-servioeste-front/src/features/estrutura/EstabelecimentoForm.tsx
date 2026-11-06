import type { Estabelecimento, TipoIdentificador } from "@/contracts"
import { useId, useState, type FormEvent } from "react"

import { Campo } from "@/components/form/Campo"
import { EnderecoCampos } from "@/components/form/EnderecoCampos"
import { enderecoValido, enderecoVazio } from "@/lib/endereco"
import { RodapeForm } from "@/components/form/Rodape"
import { Dialog } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { useToast } from "@/components/ui/toast"
import { somenteDigitos } from "@/lib/cpf"
import { formatarIdentificador, NOME_IDENTIFICADOR, validarIdentificador } from "@/lib/cnpj"
import { erroDoCampo, erroGeral } from "@/lib/erros"

import { useAlterarEstabelecimento, useCriarEstabelecimento } from "./api"

/** Estabelecimento: identificador legal com numeração própria de NSR (Anexo IX). */
export function EstabelecimentoForm({ empresaId, estabelecimento, onFechar }: {
  empresaId: string
  estabelecimento?: Estabelecimento
  onFechar: () => void
}) {
  const formId = useId()
  const criar = useCriarEstabelecimento()
  const alterar = useAlterarEstabelecimento()
  const mutacao = estabelecimento ? alterar : criar
  const avisar = useToast()
  const [tipo, setTipo] = useState<TipoIdentificador>(estabelecimento?.tipo_identificador ?? "cnpj")
  const [identificador, setIdentificador] = useState(estabelecimento?.identificador ?? "")
  const [razao, setRazao] = useState(estabelecimento?.razao_social ?? "")
  const [endereco, setEndereco] = useState(estabelecimento?.endereco ?? enderecoVazio())
  const [erroLocal, setErroLocal] = useState<{ campo: string; msg: string }>()

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!estabelecimento && !validarIdentificador(tipo, identificador)) {
      setErroLocal({ campo: "identificador", msg: `${NOME_IDENTIFICADOR[tipo]} inválido. Confira os números.` })
      return
    }
    if (!enderecoValido(endereco)) {
      setErroLocal({ campo: "endereco", msg: "Preencha o endereço completo (o complemento é opcional)." })
      return
    }
    setErroLocal(undefined)
    const concluir = () => {
      avisar(estabelecimento ? "Estabelecimento alterado." : "Estabelecimento cadastrado. A numeração legal (NSR) começou em 1.")
      onFechar()
    }
    if (estabelecimento) alterar.mutate({ id: estabelecimento.id, razao_social: razao, endereco }, { onSuccess: concluir })
    else criar.mutate({ empresa_id: empresaId, tipo_identificador: tipo, identificador: somenteDigitos(identificador), razao_social: razao, endereco },
      { onSuccess: concluir })
  }

  const erro = (campo: string) => (erroLocal?.campo === campo ? erroLocal.msg : erroDoCampo(mutacao.error, campo))

  return (
    <Dialog open onClose={onFechar} className="max-w-2xl"
      title={estabelecimento ? "Editar estabelecimento" : "Novo estabelecimento"}
      description="Cada estabelecimento tem a sua própria numeração das batidas (NSR). Alterações ficam registradas no ARP."
      footer={<RodapeForm formId={formId} pendente={mutacao.isPending} onCancelar={onFechar} />}>
      <form id={formId} onSubmit={submit} className="space-y-5" noValidate>
        <div className="grid grid-cols-3 gap-3">
          <Campo rotulo="Tipo">
            {(p) => (
              <Select {...p} value={tipo} disabled={!!estabelecimento} onChange={(e) => setTipo(e.target.value as TipoIdentificador)}>
                {(["cnpj", "cpf", "caepf", "cno"] as const).map((t) => <option key={t} value={t}>{NOME_IDENTIFICADOR[t]}</option>)}
              </Select>
            )}
          </Campo>
          <Campo rotulo={NOME_IDENTIFICADOR[tipo]} erro={erro("identificador")} className="col-span-2">
            {(p) => (
              <Input {...p} inputMode="numeric" required disabled={!!estabelecimento} value={formatarIdentificador(tipo, identificador)}
                onChange={(e) => setIdentificador(somenteDigitos(e.target.value))} />
            )}
          </Campo>
        </div>
        <Campo rotulo="Razão social" erro={erro("razao_social")}>
          {(p) => <Input {...p} required value={razao} onChange={(e) => setRazao(e.target.value)} />}
        </Campo>
        <EnderecoCampos valor={endereco} onChange={setEndereco} erroCep={erro("cep")} />
        {erro("endereco") && <p role="alert" className="text-sm text-destructive">{erro("endereco")}</p>}
        {erroGeral(mutacao.error) && <p role="alert" className="text-sm text-destructive">{erroGeral(mutacao.error)}</p>}
      </form>
    </Dialog>
  )
}
