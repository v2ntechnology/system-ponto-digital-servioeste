import type {
  Funcionario, FuncionarioAlteracao, FuncionarioEntrada, LocalPrestacao, LocalPrestacaoEntrada, Lotacao, LotacaoEntrada,
  PaginaFuncionarios, TipoRegistro, TipoVinculo,
} from "@/contracts"
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api, patch, post, query } from "@/lib/api"

export type FiltrosFuncionarios = {
  busca?: string
  unidade_id?: string
  setor_id?: string
  situacao?: "ativo" | "desligado" | "todos"
  tipo_registro?: TipoRegistro | ""
  pagina?: number
}

export const POR_PAGINA = 50
const CHAVE = ["funcionarios"] as const

export function useFuncionarios(f: FiltrosFuncionarios) {
  return useQuery({
    queryKey: [...CHAVE, "lista", f],
    queryFn: () => api<PaginaFuncionarios>(`/funcionarios${query({ ...f, por_pagina: POR_PAGINA })}`),
    placeholderData: keepPreviousData,
  })
}

export function useFuncionario(id: string | undefined) {
  return useQuery({
    queryKey: [...CHAVE, "ficha", id],
    queryFn: () => api<Funcionario>(`/funcionarios/${id}`),
    enabled: !!id,
    retry: false,
  })
}

export const useTiposVinculo = () =>
  useQuery({ queryKey: ["tipos-vinculo"], queryFn: () => api<TipoVinculo[]>("/tipos-vinculo"), staleTime: 10 * 60_000 })

function useMutacao<A, R>(fn: (a: A) => Promise<R>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CHAVE })
      qc.invalidateQueries({ queryKey: ["estrutura"] }) // o NSR do estabelecimento muda com eventos de empregado
    },
  })
}

export const useCriarFuncionario = () => useMutacao((b: FuncionarioEntrada) => post<Funcionario>("/funcionarios", b))
export const useAlterarFuncionario = () =>
  useMutacao(({ id, ...b }: FuncionarioAlteracao & { id: string }) => patch<Funcionario>(`/funcionarios/${id}`, b))
export const useTransferir = () =>
  useMutacao(({ id, ...b }: LotacaoEntrada & { id: string }) => post<Lotacao>(`/funcionarios/${id}/lotacoes`, b))
export const useAdicionarLocal = () =>
  useMutacao(({ id, ...b }: LocalPrestacaoEntrada & { id: string }) => post<LocalPrestacao>(`/funcionarios/${id}/locais-prestacao`, b))
