// Utilitários dos handlers simulados: respostas no formato Erro do contrato, sessão, permissão e cenários de tela.
import { delay, HttpResponse } from "msw"

import { db, PERMISSOES, registrarAuditoria, salvar, type UsuarioDb } from "./dados"

/** Todas as rotas da API, em qualquer origem (navegador e testes). */
export const API = "*/api"

export const erro = (status: number, detail: string, extra: { codigo?: string; campo?: string; funcionario_id?: string } = {}) =>
  HttpResponse.json({ detail, campo: extra.campo ?? null, codigo: extra.codigo ?? null, funcionario_id: extra.funcionario_id ?? null }, { status })

/** Pequena espera para a tela mostrar o "Carregando…" (desligada nos testes). */
export const esperar = () => (import.meta.env.MODE === "test" ? Promise.resolve() : delay(300))

/** Lê ?cenario=vazio|erro da página aberta, para simular listas vazias e falhas de carga. */
export function cenario(): "vazio" | "erro" | null {
  try {
    const c = new URL(window.location.href).searchParams.get("cenario")
    return c === "vazio" || c === "erro" ? c : null
  } catch {
    return null
  }
}

type Resultado = { usuario: UsuarioDb } | { resposta: Response }

/** Exige sessão válida e segundo fator concluído (como o deps.py da API fará). */
export function exigirSessao(): Resultado {
  const sessao = db.sessao
  const usuario = sessao && db.usuarios.find((u) => u.id === sessao.usuario_id && u.ativo)
  if (!sessao || !usuario) return { resposta: erro(401, "Sua sessão terminou. Entre de novo.") }
  if (sessao.mfa_pendente) return { resposta: erro(401, "Confirme o código do app autenticador para continuar.", { codigo: "mfa_pendente" }) }
  return { usuario }
}

/** Exige sessão e permissão; sem permissão registra "acesso.negado" na auditoria e devolve 403. */
export function exigirPermissao(permissao: string, acao: string): Resultado {
  const r = exigirSessao()
  if ("resposta" in r) return r
  if (!PERMISSOES[r.usuario.perfil].includes(permissao)) {
    registrarAuditoria(db, r.usuario, "acesso.negado", "negado", null, { acao })
    salvar()
    return { resposta: erro(403, "Seu perfil não tem permissão para esta ação.") }
  }
  return r
}
