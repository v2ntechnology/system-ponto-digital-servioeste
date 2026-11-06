import type { Feriado, FeriadoEntrada } from "@/contracts"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api, patch, post, query } from "@/lib/api"

const CHAVE = ["feriados"] as const

export const useFeriados = (ano: number, unidadeId?: string) =>
  useQuery({
    queryKey: [...CHAVE, ano, unidadeId ?? ""],
    queryFn: () => api<Feriado[]>(`/feriados${query({ ano, unidade_id: unidadeId })}`),
  })

function useMutacao<A, R>(fn: (a: A) => Promise<R>) {
  const qc = useQueryClient()
  return useMutation({ mutationFn: fn, onSuccess: () => qc.invalidateQueries({ queryKey: CHAVE }) })
}

export const useCriarFeriado = () => useMutacao((b: FeriadoEntrada) => post<Feriado>("/feriados", b))
export const useAlterarFeriado = () =>
  useMutacao(({ id, ...b }: { id: string; nome?: string; ativo?: boolean }) => patch<Feriado>(`/feriados/${id}`, b))
