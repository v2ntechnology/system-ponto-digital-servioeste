import type { Eu, LoginEntrada, LoginResultado } from "@ponto/contracts"
import { http, HttpResponse } from "msw"

import { CODIGO_MFA_TESTE, db, PERMISSOES, registrarAuditoria, salvar, type UsuarioDb } from "../dados"
import { API, erro, esperar } from "../util"

const exigeMfa = (u: UsuarioDb) => u.perfil === "administrador" || u.perfil === "rh"

function eu(u: UsuarioDb): Eu {
  return {
    id: u.id, nome: u.nome, email: u.email, perfil: u.perfil, permissoes: PERMISSOES[u.perfil], escopo: u.escopo,
    mfa_pendente: !!db.sessao?.mfa_pendente,
  }
}

const usuarioDaSessao = () => (db.sessao ? db.usuarios.find((u) => u.id === db.sessao!.usuario_id && u.ativo) : undefined)

export const authHandlers = [
  http.post(`${API}/auth/login`, async ({ request }) => {
    await esperar()
    const { email, senha } = (await request.json()) as LoginEntrada
    const u = db.usuarios.find((x) => x.email.toLowerCase() === email.trim().toLowerCase() && x.ativo)
    if (!u || u.senha !== senha) {
      registrarAuditoria(db, null, "login.falhou", "negado", null, {})
      salvar()
      return erro(401, "E-mail ou senha incorretos.")
    }
    db.sessao = { usuario_id: u.id, mfa_pendente: exigeMfa(u) }
    registrarAuditoria(db, u, "login", "permitido")
    salvar()
    const resultado: LoginResultado = { mfa: !exigeMfa(u) ? "nao_exigido" : u.mfa_cadastrado ? "verificar" : "cadastrar" }
    return HttpResponse.json(resultado)
  }),

  http.post(`${API}/auth/logout`, () => {
    const u = usuarioDaSessao()
    if (u) registrarAuditoria(db, u, "logout", "permitido")
    db.sessao = null
    salvar()
    return new HttpResponse(null, { status: 204 })
  }),

  http.get(`${API}/auth/me`, async () => {
    await esperar()
    const u = usuarioDaSessao()
    if (!u) return erro(401, "Sem sessão.")
    return HttpResponse.json(eu(u))
  }),

  http.post(`${API}/auth/senha`, async ({ request }) => {
    const u = usuarioDaSessao()
    if (!u || db.sessao?.mfa_pendente) return erro(401, "Sem sessão.")
    const { senha_atual, senha_nova } = (await request.json()) as { senha_atual: string; senha_nova: string }
    if (senha_atual !== u.senha) return erro(400, "A senha atual não confere.", { campo: "senha_atual" })
    if (senha_nova.length < 10) return erro(400, "A nova senha precisa ter pelo menos 10 caracteres.", { campo: "senha_nova" })
    u.senha = senha_nova
    registrarAuditoria(db, u, "senha.alterada", "permitido")
    salvar()
    return new HttpResponse(null, { status: 204 })
  }),

  http.post(`${API}/auth/mfa/cadastro`, async () => {
    await esperar()
    const u = usuarioDaSessao()
    if (!u) return erro(401, "Sem sessão.")
    if (u.mfa_cadastrado) return erro(409, "O app autenticador já está cadastrado.", { codigo: "mfa_ja_cadastrado" })
    // Segredo fictício (base32). Qualquer app lê o QR, mas no simulado o código aceito é sempre 000000.
    const uri = `otpauth://totp/Servioeste%20Ponto:${encodeURIComponent(u.email)}?secret=JBSWY3DPEHPK3PXP&issuer=Servioeste%20Ponto`
    return HttpResponse.json({ otpauth_uri: uri })
  }),

  http.post(`${API}/auth/mfa/verificar`, async ({ request }) => {
    await esperar()
    const u = usuarioDaSessao()
    if (!u) return erro(401, "Sem sessão.")
    const { codigo } = (await request.json()) as { codigo: string }
    if (codigo !== CODIGO_MFA_TESTE) {
      registrarAuditoria(db, u, "mfa.falhou", "negado")
      salvar()
      return erro(401, "Código incorreto ou expirado. Confira o app e tente de novo.", { campo: "codigo" })
    }
    u.mfa_cadastrado = true
    db.sessao = { usuario_id: u.id, mfa_pendente: false }
    registrarAuditoria(db, u, "mfa.verificado", "permitido")
    salvar()
    return HttpResponse.json(eu(u))
  }),
]
