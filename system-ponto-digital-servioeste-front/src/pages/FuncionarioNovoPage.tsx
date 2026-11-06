import { UserPlus } from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"

import { AppShell } from "@/components/layout/AppShell"
import { Cabecalho } from "@/components/layout/Cabecalho"
import { useToast } from "@/components/ui/toast"
import { FuncionarioForm, type InicialFuncionario } from "@/features/funcionarios/FuncionarioForm"

export function FuncionarioNovoPage() {
  const navigate = useNavigate()
  const avisar = useToast()
  const inicial = (useLocation().state as { inicial?: InicialFuncionario } | null)?.inicial
  const recontratacao = !!inicial?.vinculo_anterior_id
  return (
    <AppShell>
      <Cabecalho icone={UserPlus} titulo={recontratacao ? "Recontratar funcionário" : "Novo funcionário"}
        descricao={recontratacao
          ? "Novo vínculo com o mesmo CPF. Informe a nova matrícula e a nova data de admissão; o vínculo anterior continua no histórico."
          : "A inclusão fica registrada no ARP do estabelecimento da unidade, com seu nome, data e hora."} />
      <div className="mx-auto max-w-3xl p-5 sm:p-8">
        <FuncionarioForm inicial={inicial} rotulo={recontratacao ? "Recontratar" : undefined}
          onCancelar={() => navigate(recontratacao ? `/funcionarios/${inicial!.vinculo_anterior_id}` : "/funcionarios")}
          onSalvo={(f) => {
            avisar(recontratacao ? "Funcionário recontratado." : "Funcionário cadastrado.")
            navigate(`/funcionarios/${f.id}`, { replace: true })
          }} />
      </div>
    </AppShell>
  )
}
