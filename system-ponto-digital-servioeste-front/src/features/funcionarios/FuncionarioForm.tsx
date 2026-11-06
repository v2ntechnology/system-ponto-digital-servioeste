import type { Funcionario, FuncionarioEntrada, TipoRegistro } from "@/contracts"
import { Smartphone, Tablet } from "lucide-react"
import { useState, type FormEvent } from "react"
import { Link } from "react-router-dom"

import { Campo } from "@/components/form/Campo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { useSetores, useUnidades } from "@/features/estrutura/api"
import { ApiError } from "@/lib/api"
import { formatarCpf, somenteDigitos, validarCpf } from "@/lib/cpf"
import { erroDoCampo, erroGeral } from "@/lib/erros"
import { todayIso } from "@/lib/format"
import { cn } from "@/lib/utils"

import { useCriarFuncionario, useTiposVinculo } from "./api"

export type InicialFuncionario = Partial<Omit<FuncionarioEntrada, "lotacao">> & { unidade_id?: string; setor_id?: string }

/**
 * Cadastro de funcionário com a lotação inicial (FR-004, FR-010). Valida o CPF no navegador e mostra os erros da API
 * no campo certo. "CPF já ativo" leva ao funcionário existente só quando ele está no escopo de quem cadastra.
 */
export function FuncionarioForm({ inicial, onSalvo, onCancelar, rotulo = "Cadastrar funcionário" }: {
  inicial?: InicialFuncionario
  onSalvo: (f: Funcionario) => void
  onCancelar: () => void
  rotulo?: string
}) {
  const criar = useCriarFuncionario()
  const { data: tipos = [] } = useTiposVinculo()
  const { data: unidades = [] } = useUnidades()
  const { data: setores = [] } = useSetores()
  const ativas = unidades.filter((u) => u.ativo)

  const [nome, setNome] = useState(inicial?.nome ?? "")
  const [cpf, setCpf] = useState(inicial?.cpf ?? "")
  const [matricula, setMatricula] = useState(inicial?.matricula ?? "")
  const [admitido, setAdmitido] = useState(inicial?.admitido_em ?? todayIso())
  const [tipoVinculo, setTipoVinculo] = useState(inicial?.tipo_vinculo_id ?? "")
  const [registro, setRegistro] = useState<TipoRegistro>(inicial?.tipo_registro ?? "tablet")
  const [email, setEmail] = useState(inicial?.email ?? "")
  const [unidadeEscolhida, setUnidade] = useState(inicial?.unidade_id ?? "")
  const [setorEscolhido, setSetor] = useState(inicial?.setor_id ?? "")
  const [erroCpf, setErroCpf] = useState<string>()

  // Valores padrão quando as listas chegam (sem efeito: derivados no render).
  const unidadeId = unidadeEscolhida || ativas[0]?.id || ""
  const setoresDaUnidade = setores.filter((s) => s.unidade_id === unidadeId && s.ativo)
  const setorId = setoresDaUnidade.some((s) => s.id === setorEscolhido) ? setorEscolhido : setoresDaUnidade[0]?.id ?? ""
  const tipoVinculoId = tipoVinculo || tipos.find((t) => t.ativo)?.id || ""

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!validarCpf(cpf)) {
      setErroCpf("CPF inválido. Confira os números.")
      return
    }
    setErroCpf(undefined)
    criar.mutate({
      nome, cpf: somenteDigitos(cpf), matricula, admitido_em: admitido, tipo_vinculo_id: tipoVinculoId, tipo_registro: registro,
      email: email.trim() || null, lotacao: { unidade_id: unidadeId, setor_id: setorId },
      vinculo_anterior_id: inicial?.vinculo_anterior_id ?? null,
    }, { onSuccess: onSalvo })
  }

  const erro = criar.error
  const existenteId = erro instanceof ApiError && erro.codigo === "cpf_ja_ativo" ? erro.funcionarioId : null

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 font-medium">Dados pessoais</legend>
        <Campo rotulo="Nome completo" erro={erroDoCampo(erro, "nome")} className="sm:col-span-2">
          {(p) => <Input {...p} required minLength={3} autoComplete="off" value={nome} onChange={(e) => setNome(e.target.value)} />}
        </Campo>
        <div className="space-y-1">
          <Campo rotulo="CPF" erro={erroCpf ?? erroDoCampo(erro, "cpf")}>
            {(p) => (
              <Input {...p} required inputMode="numeric" autoComplete="off" placeholder="000.000.000-00" value={formatarCpf(cpf)}
                onChange={(e) => setCpf(somenteDigitos(e.target.value))} />
            )}
          </Campo>
          {existenteId && (
            <Link to={`/funcionarios/${existenteId}`} className="text-xs text-brand underline-offset-4 hover:underline">
              Abrir o funcionário existente
            </Link>
          )}
        </div>
        <Campo rotulo="E-mail (opcional)" ajuda="Usado no portal e no comprovante por e-mail, se a pessoa quiser.">
          {(p) => <Input {...p} type="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} />}
        </Campo>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-3">
        <legend className="mb-2 font-medium">Vínculo</legend>
        <Campo rotulo="Matrícula" erro={erroDoCampo(erro, "matricula")}>
          {(p) => <Input {...p} required autoComplete="off" value={matricula} onChange={(e) => setMatricula(e.target.value)} />}
        </Campo>
        <Campo rotulo="Data de admissão" erro={erroDoCampo(erro, "admitido_em")}>
          {(p) => <Input {...p} type="date" required value={admitido} onChange={(e) => setAdmitido(e.target.value)} />}
        </Campo>
        <Campo rotulo="Tipo de vínculo" erro={erroDoCampo(erro, "tipo_vinculo_id")}>
          {(p) => (
            <Select {...p} value={tipoVinculoId} onChange={(e) => setTipoVinculo(e.target.value)}>
              {tipos.filter((t) => t.ativo).map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </Select>
          )}
        </Campo>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-2 font-medium">Lotação e registro de ponto</legend>
        <Campo rotulo="Unidade" erro={erroDoCampo(erro, "unidade_id")}>
          {(p) => (
            <Select {...p} value={unidadeId} onChange={(e) => { setUnidade(e.target.value); setSetor("") }}>
              {ativas.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
            </Select>
          )}
        </Campo>
        <Campo rotulo="Setor" erro={erroDoCampo(erro, "setor_id")}>
          {(p) => (
            <Select {...p} value={setorId} onChange={(e) => setSetor(e.target.value)}>
              {setoresDaUnidade.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
            </Select>
          )}
        </Campo>
        <div className="space-y-1.5 sm:col-span-2" role="radiogroup" aria-label="Onde a pessoa bate o ponto">
          <p className="text-sm font-medium">Onde a pessoa bate o ponto</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {([["tablet", Tablet, "Tablet da unidade", "Funcionários da sede: identificação pelo rosto no tablet."],
              ["app", Smartphone, "App no celular", "Motoristas e equipe externa: selfie e localização no momento da batida."]] as const)
              .map(([valor, Icone, titulo, desc]) => (
                <button key={valor} type="button" role="radio" aria-checked={registro === valor} onClick={() => setRegistro(valor)}
                  className={cn("flex items-start gap-3 rounded-xl border p-3 text-left transition-colors",
                    registro === valor ? "border-brand bg-brand/10" : "hover:bg-accent")}>
                  <Icone className={cn("mt-0.5 size-5 shrink-0", registro === valor ? "text-brand" : "text-muted-foreground")} />
                  <span>
                    <span className="block text-sm font-medium">{titulo}</span>
                    <span className="block text-xs text-muted-foreground">{desc}</span>
                  </span>
                </button>
              ))}
          </div>
        </div>
      </fieldset>

      {erroGeral(erro) && <p role="alert" className="text-sm text-destructive">{erroGeral(erro)}</p>}

      <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
        <Button type="button" variant="outline" onClick={onCancelar}>Cancelar</Button>
        <Button type="submit" disabled={criar.isPending || !unidadeId || !setorId}>{criar.isPending ? "Salvando…" : rotulo}</Button>
      </div>
    </form>
  )
}
