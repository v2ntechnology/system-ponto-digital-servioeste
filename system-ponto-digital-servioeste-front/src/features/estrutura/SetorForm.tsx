import type { Setor } from "@/contracts"
import { useId, useState, type FormEvent } from "react"

import { Campo } from "@/components/form/Campo"
import { RodapeForm } from "@/components/form/Rodape"
import { Dialog } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/toast"
import { erroDoCampo, erroGeral } from "@/lib/erros"

import { useAlterarSetor, useCriarSetor } from "./api"

export function SetorForm({ unidadeId, unidadeNome, setor, onFechar }: {
  unidadeId: string
  unidadeNome: string
  setor?: Setor
  onFechar: () => void
}) {
  const formId = useId()
  const criar = useCriarSetor()
  const alterar = useAlterarSetor()
  const mutacao = setor ? alterar : criar
  const avisar = useToast()
  const [nome, setNome] = useState(setor?.nome ?? "")

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const concluir = () => {
      avisar(setor ? "Setor alterado." : "Setor cadastrado.")
      onFechar()
    }
    if (setor) alterar.mutate({ id: setor.id, nome }, { onSuccess: concluir })
    else criar.mutate({ unidade_id: unidadeId, nome }, { onSuccess: concluir })
  }

  return (
    <Dialog open onClose={onFechar} title={setor ? "Editar setor" : "Novo setor"} description={`Unidade ${unidadeNome}`}
      footer={<RodapeForm formId={formId} pendente={mutacao.isPending} onCancelar={onFechar} />}>
      <form id={formId} onSubmit={submit} className="space-y-4" noValidate>
        <Campo rotulo="Nome do setor" erro={erroDoCampo(mutacao.error, "nome")}>
          {(p) => <Input {...p} required value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Operacional" />}
        </Campo>
        {erroGeral(mutacao.error) && <p role="alert" className="text-sm text-destructive">{erroGeral(mutacao.error)}</p>}
      </form>
    </Dialog>
  )
}
