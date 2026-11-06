// Handlers SIMULADOS de usuários do painel (só dev e testes). Só o Administrador gerencia (permissão usuario.gerenciar).
// Regras: CPF obrigatório para Administrador e RH (o AFD identifica quem fez cada operação); gestor não tem
// "todas as unidades"; RH só tem escopo por unidade; nunca desativar ou rebaixar o último administrador ativo.
import type { Escopo, Perfil, Usuario, UsuarioAlteracao, UsuarioEntrada } from "@/contracts"
import { http, HttpResponse } from "msw"

import { mascararCpf, somenteDigitos, validarCpf } from "@/lib/cpf"

import { db, novoId, registrarAuditoria, salvar, type UsuarioDb } from "../dados"
import { API, erro, esperar, exigirPermissao } from "../util"

const exigeCpf = (p: Perfil) => p === "administrador" || p === "rh"

function contrato(u: UsuarioDb): Usuario {
  return {
    id: u.id, email: u.email, nome: u.nome, cpf_mascarado: u.cpf ? mascararCpf(u.cpf) : null, perfil: u.perfil,
    escopo: u.escopo, ativo: u.ativo, mfa_cadastrado: u.mfa_cadastrado,
  }
}

/** Normaliza o escopo para o perfil e devolve um erro se não fizer sentido. */
function validarEscopo(perfil: Perfil, e: Escopo | undefined): { escopo: Escopo } | { resposta: Response } {
  const escopo: Escopo = { todas_unidades: !!e?.todas_unidades, unidade_ids: e?.unidade_ids ?? [], setor_ids: e?.setor_ids ?? [] }
  if (perfil === "administrador") return { escopo: { todas_unidades: false, unidade_ids: [], setor_ids: [] } }
  if (perfil === "gestor" && escopo.todas_unidades) {
    return { resposta: erro(400, "Gestor não pode ter acesso a todas as unidades. Escolha setores ou unidades.", { campo: "escopo" }) }
  }
  if (perfil === "rh") {
    if (escopo.setor_ids.length) return { resposta: erro(400, "O escopo do RH é por unidade, não por setor.", { campo: "escopo" }) }
    if (escopo.todas_unidades) return { escopo: { todas_unidades: true, unidade_ids: [], setor_ids: [] } }
    if (!escopo.unidade_ids.length) return { resposta: erro(400, "Escolha ao menos uma unidade ou marque todas as unidades.", { campo: "escopo" }) }
  }
  const unidadesOk = escopo.unidade_ids.every((id) => db.unidades.some((u) => u.id === id))
  const setoresOk = escopo.setor_ids.every((id) => db.setores.some((s) => s.id === id))
  if (!unidadesOk || !setoresOk) return { resposta: erro(400, "Escopo com unidade ou setor inexistente.", { campo: "escopo" }) }
  return { escopo }
}

const administradoresAtivos = () => db.usuarios.filter((u) => u.perfil === "administrador" && u.ativo)

export const usuariosHandlers = [
  http.get(`${API}/usuarios`, async () => {
    await esperar()
    const r = exigirPermissao("usuario.gerenciar", "usuario.listar")
    if ("resposta" in r) return r.resposta
    return HttpResponse.json([...db.usuarios].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")).map(contrato))
  }),

  http.post(`${API}/usuarios`, async ({ request }) => {
    await esperar()
    const r = exigirPermissao("usuario.gerenciar", "usuario.criar")
    if ("resposta" in r) return r.resposta
    const corpo = (await request.json()) as UsuarioEntrada
    const email = corpo.email?.trim().toLowerCase() ?? ""
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return erro(400, "E-mail inválido.", { campo: "email" })
    if (db.usuarios.some((u) => u.email.toLowerCase() === email)) return erro(409, "Já existe um usuário com este e-mail.", { campo: "email" })
    if (!corpo.nome?.trim()) return erro(400, "Informe o nome.", { campo: "nome" })
    const cpf = corpo.cpf ? somenteDigitos(corpo.cpf) : null
    if (exigeCpf(corpo.perfil) && !cpf) return erro(400, "CPF é obrigatório para Administrador e RH.", { campo: "cpf" })
    if (cpf && !validarCpf(cpf)) return erro(400, "CPF inválido.", { campo: "cpf" })
    if ((corpo.senha_inicial ?? "").length < 10) return erro(400, "A senha inicial precisa ter pelo menos 10 caracteres.", { campo: "senha_inicial" })
    const v = validarEscopo(corpo.perfil, corpo.escopo)
    if ("resposta" in v) return v.resposta
    const novo: UsuarioDb = {
      id: novoId(), email, nome: corpo.nome.trim(), cpf, perfil: corpo.perfil, senha: corpo.senha_inicial, escopo: v.escopo,
      ativo: true, mfa_cadastrado: false,
    }
    db.usuarios.push(novo)
    registrarAuditoria(db, r.usuario, "usuario.criar", "permitido", { tipo: "usuario", id: novo.id }, { perfil: novo.perfil })
    salvar()
    return HttpResponse.json(contrato(novo), { status: 201 })
  }),

  http.patch(`${API}/usuarios/:id`, async ({ request, params }) => {
    await esperar()
    const r = exigirPermissao("usuario.gerenciar", "usuario.alterar")
    if ("resposta" in r) return r.resposta
    const alvo = db.usuarios.find((u) => u.id === params.id)
    if (!alvo) return erro(404, "Usuário não encontrado.")
    const corpo = (await request.json()) as UsuarioAlteracao
    const perfil = corpo.perfil ?? alvo.perfil
    const cpf = corpo.cpf ? somenteDigitos(corpo.cpf) : alvo.cpf
    if (corpo.cpf && !validarCpf(cpf ?? "")) return erro(400, "CPF inválido.", { campo: "cpf" })
    if (exigeCpf(perfil) && !cpf) return erro(400, "Informe o CPF: ele é obrigatório para Administrador e RH.", { campo: "cpf" })

    const deixaDeSerAdmin = alvo.perfil === "administrador" && alvo.ativo && (perfil !== "administrador" || corpo.ativo === false)
    if (deixaDeSerAdmin && administradoresAtivos().length === 1) {
      return erro(409, "Este é o último administrador ativo. Cadastre outro administrador antes.", { codigo: "ultimo_administrador" })
    }
    const v = validarEscopo(perfil, corpo.escopo ?? alvo.escopo)
    if ("resposta" in v) return v.resposta

    const promovidoComMfa = !exigeCpf(alvo.perfil) && exigeCpf(perfil)
    if (corpo.nome !== undefined) alvo.nome = corpo.nome.trim()
    alvo.cpf = cpf
    alvo.perfil = perfil
    alvo.escopo = v.escopo
    if (corpo.ativo !== undefined) alvo.ativo = corpo.ativo
    // Quem passa a ter perfil com segundo fator cadastra o app no próximo acesso.
    if (promovidoComMfa) alvo.mfa_cadastrado = false
    registrarAuditoria(db, r.usuario, "usuario.alterar", "permitido", { tipo: "usuario", id: alvo.id }, { campos: Object.keys(corpo) })
    salvar()
    return HttpResponse.json(contrato(alvo))
  }),

  http.post(`${API}/usuarios/:id/mfa/redefinir`, async ({ params }) => {
    await esperar()
    const r = exigirPermissao("usuario.gerenciar", "usuario.redefinir_mfa")
    if ("resposta" in r) return r.resposta
    const alvo = db.usuarios.find((u) => u.id === params.id)
    if (!alvo) return erro(404, "Usuário não encontrado.")
    alvo.mfa_cadastrado = false
    registrarAuditoria(db, r.usuario, "mfa.redefinido", "permitido", { tipo: "usuario", id: alvo.id })
    salvar()
    return new HttpResponse(null, { status: 204 })
  }),
]
