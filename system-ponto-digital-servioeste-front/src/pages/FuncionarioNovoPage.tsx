import { UserPlus } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { AppShell } from "@/components/layout/AppShell"
import { Cabecalho } from "@/components/layout/Cabecalho"
import { useToast } from "@/components/ui/toast"
import { FuncionarioForm } from "@/features/funcionarios/FuncionarioForm"

export function FuncionarioNovoPage() {
  const navigate = useNavigate()
  const avisar = useToast()
  return (
    <AppShell>
      <Cabecalho icone={UserPlus} titulo="Novo funcionário"
        descricao="A inclusão fica registrada no ARP do estabelecimento da unidade, com seu nome, data e hora." />
      <div className="mx-auto max-w-3xl p-5 sm:p-8">
        <FuncionarioForm onCancelar={() => navigate("/funcionarios")}
          onSalvo={(f) => {
            avisar("Funcionário cadastrado.")
            navigate(`/funcionarios/${f.id}`, { replace: true })
          }} />
      </div>
    </AppShell>
  )
}
