import type { TipoIdentificador } from "@/contracts"
import { useId, useState, type FormEvent } from "react"

import { Campo } from "@/components/form/Campo"
import { EnderecoCampos } from "@/components/form/EnderecoCampos"
import { RodapeForm } from "@/components/form/Rodape"
import { Dialog } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { useToast } from "@/components/ui/toast"
import { formatarIdentificador, NOME_IDENTIFICADOR, validarIdentificador } from "@/lib/cnpj"
import { somenteDigitos } from "@/lib/cpf"
import { enderecoValido, enderecoVazio } from "@/lib/endereco"
import { erroDoCampo, erroGeral } from "@/lib/erros"
import { todayIso } from "@/lib/format"

import { useAdicionarLocal } from "./api"

/** Local de prestação de serviço (FR-005): quando o funcionário trabalha fora ou em instalações de terceiros. */
export function LocalPrestacaoDialog({ funcionarioId, onFechar }: { funcionarioId: string; onFechar: () => void }) {
  const formId = useId()
  const adicionar = useAdicionarLocal()
  const avisar = useToast()
  const [descricao, setDescricao] = useState("")
  const [tipo, setTipo] = useState<TipoIdentificador | "">("")
  const [identificador, setIdentificador] = useState("")
  const [endereco, setEndereco] = useState(enderecoVazio())
  const [inicio, setInicio] = useState(todayIso())
  const [fim, setFim] = useState("")
  const [erroLocal, setErroLocal] = useState<{ campo: string; msg: string }>()

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (tipo && !validarIdentificador(tipo, identificador)) {
      return setErroLocal({ campo: "tomador_identificador", msg: `${NOME_IDENTIFICADOR[tipo]} inválido.` })
    }
    if (!enderecoValido(endereco)) return setErroLocal({ campo: "endereco", msg: "Preencha o endereço completo (o complemento é opcional)." })
    setErroLocal(undefined)
    adicionar.mutate({
      id: funcionarioId, descricao, endereco, inicio, fim: fim || null,
      tomador_tipo_identificador: tipo || null, tomador_identificador: tipo ? somenteDigitos(identificador) : null,
    }, {
      onSuccess: () => {
        avisar("Local de prestação registrado.")
        onFechar()
      },
    })
  }

  const erro = (campo: string) => (erroLocal?.campo === campo ? erroLocal.msg : erroDoCampo(adicionar.error, campo))

  return (
    <Dialog open onClose={onFechar} className="max-w-2xl" title="Local de prestação de serviço"
      description="Use quando o funcionário trabalha fora da unidade ou em instalações de um cliente ou terceiro."
      footer={<RodapeForm formId={formId} pendente={adicionar.isPending} onCancelar={onFechar} />}>
      <form id={formId} onSubmit={submit} className="space-y-5" noValidate>
        <Campo rotulo="Descrição do local" erro={erro("descricao")}>
          {(p) => <Input {...p} required value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex.: Hospital do cliente X" />}
        </Campo>
        <div className="grid gap-3 sm:grid-cols-3">
          <Campo rotulo="Tomador (opcional)">
            {(p) => (
              <Select {...p} value={tipo} onChange={(e) => setTipo(e.target.value as TipoIdentificador | "")}>
                <option value="">Sem tomador</option>
                {(["cnpj", "cpf", "caepf", "cno"] as const).map((t) => <option key={t} value={t}>{NOME_IDENTIFICADOR[t]}</option>)}
              </Select>
            )}
          </Campo>
          {tipo && (
            <Campo rotulo={`${NOME_IDENTIFICADOR[tipo]} do tomador`} erro={erro("tomador_identificador")} className="sm:col-span-2">
              {(p) => (
                <Input {...p} inputMode="numeric" value={formatarIdentificador(tipo, identificador)}
                  onChange={(e) => setIdentificador(somenteDigitos(e.target.value))} />
              )}
            </Campo>
          )}
        </div>
        <EnderecoCampos valor={endereco} onChange={setEndereco} erroCep={erro("cep")} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo rotulo="Início" erro={erro("inicio")}>
            {(p) => <Input {...p} type="date" required value={inicio} onChange={(e) => setInicio(e.target.value)} />}
          </Campo>
          <Campo rotulo="Fim (opcional)" erro={erro("fim")}>
            {(p) => <Input {...p} type="date" value={fim} min={inicio} onChange={(e) => setFim(e.target.value)} />}
          </Campo>
        </div>
        {erro("endereco") && <p role="alert" className="text-sm text-destructive">{erro("endereco")}</p>}
        {erroGeral(adicionar.error) && <p role="alert" className="text-sm text-destructive">{erroGeral(adicionar.error)}</p>}
      </form>
    </Dialog>
  )
}
