import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type { Commit, Pendencia, Plano, Termo } from "./tipos"

// Fala com o plugin do Vite (dev-tools/plugin.ts) em /__dev. Só existe no servidor de desenvolvimento.
async function dev<T>(caminho: string, init?: RequestInit): Promise<T> {
  const res = await fetch(new URL(`/__dev${caminho}`, window.location.origin), {
    ...init, headers: { "Content-Type": "application/json" },
  })
  const corpo = await res.json().catch(() => null)
  if (!res.ok) throw new Error(corpo?.detail ?? `Erro ${res.status}`)
  return corpo as T
}

export const usePlano = () => useQuery({ queryKey: ["dev", "plano"], queryFn: () => dev<Plano>("/plano") })
export const useHistorico = () => useQuery({ queryKey: ["dev", "historico"], queryFn: () => dev<Commit[]>("/historico") })
export const usePendencias = () => useQuery({ queryKey: ["dev", "pendencias"], queryFn: () => dev<Pendencia[]>("/pendencias") })
export const useGlossario = () => useQuery({ queryKey: ["dev", "glossario"], queryFn: () => dev<Termo[]>("/glossario") })

export function useResponderPendencia() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (b: { codigo: string; resposta: string }) => dev<Pendencia>("/pendencias", { method: "POST", body: JSON.stringify(b) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dev", "pendencias"] }),
  })
}
