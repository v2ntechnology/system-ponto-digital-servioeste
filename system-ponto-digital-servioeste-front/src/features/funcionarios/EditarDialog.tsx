import type { Funcionario, TipoRegistro } from "@/contracts"
import { useId, useState, type FormEvent } from "react"

import { Campo } from "@/components/form/Campo"
import { RodapeForm } from "@/components/form/Rodape"
import { Dialog } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { useToast } from "@/components/ui/toast"
import { erroDoCampo, erroGeral } from "@/lib/erros"

import { useAlterarFuncionario, useTiposVinculo } from "./api"

/** Edita os dados que podem mudar. CPF, matrícula e admissão não mudam (corrigir = desligar e recadastrar). */
export function EditarDialog({ funcionario, onFechar }: { funcionario: Funcionario; onFechar: () => void }) {
  const formId = useId()
  const alterar = useAlterarFuncionario()
  const { data: tipos = [] } = useTiposVinculo()
  const avisar = useToast()
  const [nome, setNome] = useState(funcionario.nome)
  const [tipoVinculo, setTipoVinculo] = useState(funcionario.tipo_vinculo.id)
  const [registro, setRegistro] = useState<TipoRegistro>(funcionario.tipo_registro)
  const [email, setEmail] = useState(funcionario.email ?? "")

  const submit = (e: FormEvent) => {
    e.preventDefault()
    alterar.mutate({ id: funcionario.id, nome, tipo_vinculo_id: tipoVinculo, tipo_registro: registro, email: email.trim() || null }, {
      onSuccess: () => {
        avisar("Dados alterados.")
        onFechar()
      },
    })
  }

  return (
    <Dialog open onClose={onFechar} title="Editar dados" description="A alteração do nome fica registrada no ARP."
      footer={<RodapeForm formId={formId} pendente={alterar.isPending} onCancelar={onFechar} />}>
      <form id={formId} onSubmit={submit} className="space-y-4" noValidate>
        <Campo rotulo="Nome completo" erro={erroDoCampo(alterar.error, "nome")}>
          {(p) => <Input {...p} required value={nome} onChange={(e) => setNome(e.target.value)} />}
        </Campo>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Tipo de vínculo">
            {(p) => (
              <Select {...p} value={tipoVinculo} onChange={(e) => setTipoVinculo(e.target.value)}>
                {tipos.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
              </Select>
            )}
          </Campo>
          <Campo rotulo="Tipo de registro">
            {(p) => (
              <Select {...p} value={registro} onChange={(e) => setRegistro(e.target.value as TipoRegistro)}>
                <option value="tablet">Tablet da unidade</option>
                <option value="app">App no celular</option>
              </Select>
            )}
          </Campo>
        </div>
        <Campo rotulo="E-mail (opcional)">
          {(p) => <Input {...p} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />}
        </Campo>
        {erroGeral(alterar.error) && <p role="alert" className="text-sm text-destructive">{erroGeral(alterar.error)}</p>}
      </form>
    </Dialog>
  )
}
