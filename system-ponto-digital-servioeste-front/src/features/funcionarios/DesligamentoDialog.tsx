import type { Funcionario } from "@/contracts"
import { useId, useState, type FormEvent } from "react"

import { Campo } from "@/components/form/Campo"
import { RodapeForm } from "@/components/form/Rodape"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/toast"
import { erroDoCampo, erroGeral } from "@/lib/erros"
import { addDays, fmtDate, todayIso } from "@/lib/format"

import { useDesligar } from "./api"

const MAX_DIAS_FUTURO = 90
const DIAS_PORTAL = 1825

/**
 * Desligamento (FR-014): a pessoa deixa de bater ponto a partir do dia seguinte à data, mantém o portal só para leitura
 * por 5 anos (FR-014a) e a biometria entra no fluxo de exclusão. Marcações e histórico continuam guardados.
 */
export function DesligamentoDialog({ funcionario, onFechar }: { funcionario: Funcionario; onFechar: () => void }) {
  const formId = useId()
  const desligar = useDesligar()
  const avisar = useToast()
  const hoje = todayIso()
  const [data, setData] = useState(hoje)
  const [confirmaFutura, setConfirmaFutura] = useState(false)
  const [erroLocal, setErroLocal] = useState<string>()
  const futura = data > hoje
  const limite = addDays(hoje, MAX_DIAS_FUTURO)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!data) return setErroLocal("Informe a data do desligamento.")
    if (data < funcionario.admitido_em) return setErroLocal(`O desligamento não pode ser antes da admissão (${fmtDate(funcionario.admitido_em)}).`)
    if (data > limite) return setErroLocal(`A data pode ser no máximo ${MAX_DIAS_FUTURO} dias à frente (até ${fmtDate(limite)}).`)
    if (futura && !confirmaFutura) return setErroLocal("Confirme que a data no futuro está certa.")
    setErroLocal(undefined)
    desligar.mutate({ id: funcionario.id, desligado_em: data }, {
      onSuccess: () => {
        avisar(futura ? `Desligamento agendado para ${fmtDate(data)}.` : "Desligamento registrado.")
        onFechar()
      },
    })
  }

  return (
    <Dialog open onClose={onFechar} title="Desligar funcionário" description={funcionario.nome}
      footer={<RodapeForm formId={formId} pendente={desligar.isPending} onCancelar={onFechar} rotulo="Registrar desligamento" />}>
      <form id={formId} onSubmit={submit} className="space-y-4" noValidate>
        <Campo rotulo="Data do desligamento" erro={erroLocal ?? erroDoCampo(desligar.error, "desligado_em")}
          ajuda={`A pessoa trabalha até esta data e deixa de bater ponto a partir do dia seguinte.`}>
          {(p) => (
            <Input {...p} type="date" required min={funcionario.admitido_em} max={limite} value={data}
              onChange={(e) => { setData(e.target.value); setConfirmaFutura(false) }} />
          )}
        </Campo>

        {futura && (
          <label className="flex items-start gap-2 rounded-lg border border-brand/40 bg-brand/5 p-3 text-sm">
            <Checkbox className="mt-0.5" checked={confirmaFutura} onChange={(e) => setConfirmaFutura(e.target.checked)} />
            <span>A data é no futuro. Até lá, {funcionario.nome.split(" ")[0]} continua ativo e batendo ponto. Confirmo a data.</span>
          </label>
        )}

        <ul className="space-y-1.5 rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
          <li>• As marcações, ajustes e o histórico <strong className="text-foreground">continuam guardados</strong>. Nada é apagado.</li>
          <li>• O desligamento é registrado no ARP como <strong className="text-foreground">exclusão de empregado</strong>.</li>
          <li>• O acesso ao portal fica <strong className="text-foreground">só para leitura até {data ? fmtDate(addDays(data, DIAS_PORTAL)) : "—"}</strong> (5 anos).</li>
          <li>• Os dados biométricos entram no fluxo de exclusão, no prazo definido.</li>
        </ul>
        {erroGeral(desligar.error) && <p role="alert" className="text-sm text-destructive">{erroGeral(desligar.error)}</p>}
      </form>
    </Dialog>
  )
}
