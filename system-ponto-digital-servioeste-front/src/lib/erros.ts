import { ApiError } from "@/lib/api"

/** Mensagem de erro da API para um campo do formulário (quando a API diz qual campo falhou). */
export function erroDoCampo(erro: unknown, campo: string) {
  return erro instanceof ApiError && erro.campo === campo ? erro.message : undefined
}

/** Mensagem geral (quando o erro não é de um campo específico). */
export function erroGeral(erro: unknown) {
  if (!erro) return undefined
  if (erro instanceof ApiError && erro.campo) return undefined
  return erro instanceof Error ? erro.message : "Algo deu errado. Tente de novo."
}
