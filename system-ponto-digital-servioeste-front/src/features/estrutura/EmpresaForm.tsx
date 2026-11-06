import type { Empresa } from "@/contracts"
import { useId, useState, type FormEvent } from "react"

import { Campo } from "@/components/form/Campo"
import { RodapeForm } from "@/components/form/Rodape"
import { Dialog } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { useToast } from "@/components/ui/toast"
import { somenteDigitos } from "@/lib/cpf"
import { formatarIdentificador, NOME_IDENTIFICADOR, validarIdentificador } from "@/lib/cnpj"
import { erroDoCampo, erroGeral } from "@/lib/erros"

import { useAlterarEmpresa, useCriarEmpresa } from "./api"

/** Cadastro e edição da empresa (empregador). Na edição, o identificador não muda. */
export function EmpresaForm({ empresa, onFechar }: { empresa?: Empresa; onFechar: () => void }) {
  const formId = useId()
  const criar = useCriarEmpresa()
  const alterar = useAlterarEmpresa()
  const mutacao = empresa ? alterar : criar
  const avisar = useToast()
  const [tipo, setTipo] = useState<"cnpj" | "cpf">(empresa?.tipo_identificador ?? "cnpj")
  const [identificador, setIdentificador] = useState(empresa?.identificador ?? "")
  const [razao, setRazao] = useState(empresa?.razao_social ?? "")
  const [erroId, setErroId] = useState<string>()

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const concluir = () => {
      avisar(empresa ? "Empresa alterada." : "Empresa cadastrada.")
      onFechar()
    }
    if (empresa) {
      alterar.mutate({ id: empresa.id, razao_social: razao }, { onSuccess: concluir })
      return
    }
    if (!validarIdentificador(tipo, identificador)) {
      setErroId(`${NOME_IDENTIFICADOR[tipo]} inválido. Confira os números.`)
      return
    }
    setErroId(undefined)
    criar.mutate({ tipo_identificador: tipo, identificador: somenteDigitos(identificador), razao_social: razao }, { onSuccess: concluir })
  }

  return (
    <Dialog open onClose={onFechar} title={empresa ? "Editar empresa" : "Nova empresa"}
      description="Empresa empregadora. Os estabelecimentos (CNPJs) ficam abaixo dela."
      footer={<RodapeForm formId={formId} pendente={mutacao.isPending} onCancelar={onFechar} />}>
      <form id={formId} onSubmit={submit} className="space-y-4" noValidate>
        <div className="grid grid-cols-3 gap-3">
          <Campo rotulo="Tipo">
            {(p) => (
              <Select {...p} value={tipo} disabled={!!empresa} onChange={(e) => setTipo(e.target.value as "cnpj" | "cpf")}>
                <option value="cnpj">CNPJ</option>
                <option value="cpf">CPF</option>
              </Select>
            )}
          </Campo>
          <Campo rotulo={NOME_IDENTIFICADOR[tipo]} erro={erroId ?? erroDoCampo(mutacao.error, "identificador")} className="col-span-2">
            {(p) => (
              <Input {...p} inputMode="numeric" required disabled={!!empresa} value={formatarIdentificador(tipo, identificador)}
                onChange={(e) => setIdentificador(somenteDigitos(e.target.value))} />
            )}
          </Campo>
        </div>
        <Campo rotulo="Razão social" erro={erroDoCampo(mutacao.error, "razao_social")}>
          {(p) => <Input {...p} required value={razao} onChange={(e) => setRazao(e.target.value)} />}
        </Campo>
        {erroGeral(mutacao.error) && <p role="alert" className="text-sm text-destructive">{erroGeral(mutacao.error)}</p>}
      </form>
    </Dialog>
  )
}
