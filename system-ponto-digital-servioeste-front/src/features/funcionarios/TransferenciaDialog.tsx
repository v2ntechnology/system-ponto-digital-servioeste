import type { Funcionario } from "@/contracts"
import { useId, useState, type FormEvent } from "react"

import { Campo } from "@/components/form/Campo"
import { RodapeForm } from "@/components/form/Rodape"
import { Dialog } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { useToast } from "@/components/ui/toast"
import { useSetores, useUnidades } from "@/features/estrutura/api"
import { erroDoCampo, erroGeral } from "@/lib/erros"
import { addDays, fmtDate, todayIso } from "@/lib/format"

import { useTransferir } from "./api"

/** Transferência: fecha a lotação atual no dia anterior e abre a nova (vigências sem sobreposição, FR-011). */
export function TransferenciaDialog({ funcionario, onFechar }: { funcionario: Funcionario; onFechar: () => void }) {
  const formId = useId()
  const transferir = useTransferir()
  const avisar = useToast()
  const { data: unidades = [] } = useUnidades()
  const { data: setores = [] } = useSetores()
  const atual = funcionario.lotacao_atual
  const [unidadeEscolhida, setUnidade] = useState(atual?.unidade_id ?? "")
  const [setorEscolhido, setSetor] = useState("")
  const [inicio, setInicio] = useState(todayIso())

  const unidadeId = unidadeEscolhida || unidades[0]?.id || ""
  const setoresDaUnidade = setores.filter((s) => s.unidade_id === unidadeId && s.ativo)
  const setorId = setoresDaUnidade.some((s) => s.id === setorEscolhido) ? setorEscolhido : setoresDaUnidade[0]?.id ?? ""

  const submit = (e: FormEvent) => {
    e.preventDefault()
    transferir.mutate({ id: funcionario.id, unidade_id: unidadeId, setor_id: setorId, inicio }, {
      onSuccess: () => {
        avisar("Transferência registrada.")
        onFechar()
      },
    })
  }

  return (
    <Dialog open onClose={onFechar} title="Transferir funcionário"
      description={atual ? `Hoje em ${atual.unidade_nome} · ${atual.setor_nome}, desde ${fmtDate(atual.inicio)}.` : undefined}
      footer={<RodapeForm formId={formId} pendente={transferir.isPending} onCancelar={onFechar} rotulo="Transferir" />}>
      <form id={formId} onSubmit={submit} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Nova unidade" erro={erroDoCampo(transferir.error, "unidade_id")}>
            {(p) => (
              <Select {...p} value={unidadeId} onChange={(e) => { setUnidade(e.target.value); setSetor("") }}>
                {unidades.filter((u) => u.ativo).map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
              </Select>
            )}
          </Campo>
          <Campo rotulo="Novo setor" erro={erroDoCampo(transferir.error, "setor_id")}>
            {(p) => (
              <Select {...p} value={setorId} onChange={(e) => setSetor(e.target.value)}>
                {setoresDaUnidade.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
              </Select>
            )}
          </Campo>
        </div>
        <Campo rotulo="A partir de" erro={erroDoCampo(transferir.error, "inicio")}
          ajuda={inicio ? `A lotação atual termina em ${fmtDate(addDays(inicio, -1))}.` : undefined}>
          {(p) => <Input {...p} type="date" required value={inicio} onChange={(e) => setInicio(e.target.value)} />}
        </Campo>
        {erroGeral(transferir.error) && <p role="alert" className="text-sm text-destructive">{erroGeral(transferir.error)}</p>}
      </form>
    </Dialog>
  )
}
