import type { Usuario, UsuarioAlteracao, UsuarioEntrada } from "@/contracts"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api, patch, post } from "@/lib/api"

const CHAVE = ["usuarios"] as const

export const useUsuarios = () => useQuery({ queryKey: CHAVE, queryFn: () => api<Usuario[]>("/usuarios") })

function useMutacao<A, R>(fn: (a: A) => Promise<R>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CHAVE })
      qc.invalidateQueries({ queryKey: ["auditoria"] })
    },
  })
}

export const useCriarUsuario = () => useMutacao((b: UsuarioEntrada) => post<Usuario>("/usuarios", b))
export const useAlterarUsuario = () =>
  useMutacao(({ id, ...b }: UsuarioAlteracao & { id: string }) => patch<Usuario>(`/usuarios/${id}`, b))
export const useRedefinirMfa = () => useMutacao((id: string) => post<void>(`/usuarios/${id}/mfa/redefinir`))
