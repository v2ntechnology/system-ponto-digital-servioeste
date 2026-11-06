import type { Escopo, Perfil, Usuario } from "@/contracts"
import { useId, useState, type FormEvent } from "react"

import { Campo } from "@/components/form/Campo"
import { RodapeForm } from "@/components/form/Rodape"
import { Dialog } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { useToast } from "@/components/ui/toast"
import { formatarCpf, somenteDigitos, validarCpf } from "@/lib/cpf"
import { erroDoCampo, erroGeral } from "@/lib/erros"

import { useAlterarUsuario, useCriarUsuario } from "./api"
import { EscopoCampos } from "./EscopoCampos"
import { escopoVazio } from "./escopo"

const exigeCpf = (p: Perfil) => p === "administrador" || p === "rh"

/** Usuário do painel: perfil, escopo e, para Administrador e RH, CPF (o AFD identifica quem fez cada operação). */
export function UsuarioForm({ usuario, onFechar }: { usuario?: Usuario; onFechar: () => void }) {
  const formId = useId()
  const criar = useCriarUsuario()
  const alterar = useAlterarUsuario()
  const mutacao = usuario ? alterar : criar
  const avisar = useToast()
  const [email, setEmail] = useState(usuario?.email ?? "")
  const [nome, setNome] = useState(usuario?.nome ?? "")
  const [cpf, setCpf] = useState("")
  const [perfil, setPerfil] = useState<Perfil>(usuario?.perfil ?? "gestor")
  const [senha, setSenha] = useState("")
  const [escopo, setEscopo] = useState<Escopo>(usuario?.escopo ?? escopoVazio())
  const [erroCpf, setErroCpf] = useState<string>()

  const temCpf = !!usuario?.cpf_mascarado
  const precisaCpf = exigeCpf(perfil) && !temCpf
  const promovendo = !!usuario && !exigeCpf(usuario.perfil) && exigeCpf(perfil)

  const trocarPerfil = (p: Perfil) => {
    setPerfil(p)
    setEscopo(escopoVazio())
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if ((precisaCpf || cpf) && !validarCpf(cpf)) {
      setErroCpf(precisaCpf && !cpf ? "CPF é obrigatório para Administrador e RH." : "CPF inválido.")
      return
    }
    setErroCpf(undefined)
    const cpfEnviar = cpf ? somenteDigitos(cpf) : undefined
    const concluir = () => {
      avisar(usuario ? "Usuário alterado." : "Usuário criado. No primeiro acesso, Administrador e RH configuram o app autenticador.")
      onFechar()
    }
    if (usuario) alterar.mutate({ id: usuario.id, nome, perfil, escopo, ...(cpfEnviar ? { cpf: cpfEnviar } : {}) }, { onSuccess: concluir })
    else criar.mutate({ email, nome, perfil, escopo, senha_inicial: senha, cpf: cpfEnviar ?? null }, { onSuccess: concluir })
  }

  return (
    <Dialog open onClose={onFechar} className="max-w-xl" title={usuario ? "Editar usuário" : "Novo usuário"}
      description="Acesso ao painel. O escopo define quais funcionários a pessoa enxerga."
      footer={<RodapeForm formId={formId} pendente={mutacao.isPending} onCancelar={onFechar} />}>
      <form id={formId} onSubmit={submit} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Nome" erro={erroDoCampo(mutacao.error, "nome")}>
            {(p) => <Input {...p} required value={nome} onChange={(e) => setNome(e.target.value)} />}
          </Campo>
          <Campo rotulo="E-mail" erro={erroDoCampo(mutacao.error, "email")}>
            {(p) => <Input {...p} type="email" required disabled={!!usuario} value={email} onChange={(e) => setEmail(e.target.value)} />}
          </Campo>
          <Campo rotulo="Perfil">
            {(p) => (
              <Select {...p} value={perfil} onChange={(e) => trocarPerfil(e.target.value as Perfil)}>
                <option value="gestor">Gestor</option>
                <option value="rh">RH</option>
                <option value="administrador">Administrador</option>
              </Select>
            )}
          </Campo>
          {(exigeCpf(perfil) || temCpf) && (
            <Campo rotulo={temCpf ? `CPF (cadastrado: ${usuario!.cpf_mascarado})` : "CPF"} erro={erroCpf ?? erroDoCampo(mutacao.error, "cpf")}
              ajuda={temCpf ? "Deixe em branco para manter." : "Obrigatório para Administrador e RH."}>
              {(p) => (
                <Input {...p} inputMode="numeric" value={formatarCpf(cpf)} placeholder="000.000.000-00"
                  onChange={(e) => setCpf(somenteDigitos(e.target.value))} />
              )}
            </Campo>
          )}
          {!usuario && (
            <Campo rotulo="Senha inicial" erro={erroDoCampo(mutacao.error, "senha_inicial")} ajuda="Mínimo de 10 caracteres. Passe para a pessoa por um canal seguro.">
              {(p) => <Input {...p} type="password" autoComplete="new-password" required minLength={10} value={senha} onChange={(e) => setSenha(e.target.value)} />}
            </Campo>
          )}
        </div>
        {promovendo && (
          <p className="rounded-lg border border-brand/40 bg-brand/5 p-3 text-sm">
            Com este perfil, a pessoa vai configurar o app autenticador (segundo fator) no próximo acesso.
          </p>
        )}
        <EscopoCampos perfil={perfil} valor={escopo} onChange={setEscopo} erro={erroDoCampo(mutacao.error, "escopo")} />
        {erroGeral(mutacao.error) && <p role="alert" className="text-sm text-destructive">{erroGeral(mutacao.error)}</p>}
      </form>
    </Dialog>
  )
}
