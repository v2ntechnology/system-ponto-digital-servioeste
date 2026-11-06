// Cliente da API (base: Servioeste Hub). A sessão vai num cookie httpOnly: o JavaScript nunca toca no token.
// Os tipos vêm de @ponto/contracts, gerados do openapi.yaml.
import type { Erro } from "@/contracts"

export class ApiError extends Error {
  status: number
  codigo: string | null
  campo: string | null
  funcionarioId: string | null

  constructor(status: number, corpo: Partial<Erro> | null) {
    super(corpo?.detail ?? `Erro ${status}`)
    this.status = status
    this.codigo = corpo?.codigo ?? null
    this.campo = corpo?.campo ?? null
    this.funcionarioId = corpo?.funcionario_id ?? null
  }
}

/** Monta a URL a partir da origem da página (funciona no navegador e nos testes). */
const url = (path: string) => new URL(`/api${path}`, window.location.origin).toString()

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response
  try {
    res = await fetch(url(path), {
      credentials: "same-origin",
      ...init,
      headers: { "Content-Type": "application/json", ...init.headers },
    })
  } catch {
    throw new ApiError(0, { detail: "Sem conexão com o servidor. Confira a internet e tente de novo." })
  }
  if (!res.ok) {
    let corpo: Partial<Erro> | null = null
    try {
      corpo = await res.json()
    } catch {
      /* resposta sem JSON */
    }
    throw new ApiError(res.status, corpo)
  }
  return (res.status === 204 ? undefined : await res.json()) as T
}

/** Atalhos para corpo JSON. */
export const post = <T>(path: string, body?: unknown) =>
  api<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) })
export const patch = <T>(path: string, body: unknown) => api<T>(path, { method: "PATCH", body: JSON.stringify(body) })

/** Monta "?a=1&b=2" ignorando valores vazios. */
export function query(params: Record<string, string | number | boolean | null | undefined>) {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") q.set(k, String(v))
  }
  const s = q.toString()
  return s ? `?${s}` : ""
}
