import type { Eu, LoginEntrada, LoginResultado } from "@ponto/contracts"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api, ApiError, post } from "@/lib/api"

/** Usuário da sessão. `null` = sem sessão (401). */
export function useEu() {
  return useQuery({
    queryKey: ["eu"],
    queryFn: async () => {
      try {
        return await api<Eu>("/auth/me")
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) return null
        throw e
      }
    },
    retry: false,
    staleTime: 5 * 60_000,
  })
}

export function useLogin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: LoginEntrada) => post<LoginResultado>("/auth/login", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["eu"] }),
  })
}

export function useLogout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => post<void>("/auth/logout"),
    onSettled: () => {
      qc.clear()
      qc.setQueryData(["eu"], null)
    },
  })
}

/** Gera o segredo do app autenticador (primeiro acesso ou depois de redefinido). */
export function useCadastrarMfa() {
  return useMutation({ mutationFn: () => post<{ otpauth_uri: string }>("/auth/mfa/cadastro") })
}

export function useVerificarMfa() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (codigo: string) => post<Eu>("/auth/mfa/verificar", { codigo }),
    onSuccess: (eu) => qc.setQueryData(["eu"], eu),
  })
}

export function useTrocarSenha() {
  return useMutation({
    mutationFn: (body: { senha_atual: string; senha_nova: string }) => post<void>("/auth/senha", body),
  })
}
