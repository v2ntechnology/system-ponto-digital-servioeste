import type {
  Empresa, EmpresaAlteracao, EmpresaEntrada, Estabelecimento, EstabelecimentoAlteracao, EstabelecimentoEntrada, Setor,
  SetorEntrada, Unidade, UnidadeAlteracao, UnidadeEntrada,
} from "@/contracts"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { api, patch, post } from "@/lib/api"

// Todas as consultas da estrutura começam com "estrutura": qualquer alteração invalida o conjunto inteiro,
// porque empresa, estabelecimento, unidade e setor aparecem juntos na mesma árvore.
const CHAVE = ["estrutura"] as const

export const useEmpresas = () => useQuery({ queryKey: [...CHAVE, "empresas"], queryFn: () => api<Empresa[]>("/empresas") })
export const useEstabelecimentos = () =>
  useQuery({ queryKey: [...CHAVE, "estabelecimentos"], queryFn: () => api<Estabelecimento[]>("/estabelecimentos") })
export const useUnidades = () => useQuery({ queryKey: [...CHAVE, "unidades"], queryFn: () => api<Unidade[]>("/unidades") })
export const useSetores = () => useQuery({ queryKey: [...CHAVE, "setores"], queryFn: () => api<Setor[]>("/setores") })

/** As quatro listas juntas, com um único estado de carregando/erro para a tela. */
export function useEstrutura() {
  const consultas = [useEmpresas(), useEstabelecimentos(), useUnidades(), useSetores()] as const
  const [empresas, estabelecimentos, unidades, setores] = consultas
  return {
    empresas: empresas.data ?? [],
    estabelecimentos: estabelecimentos.data ?? [],
    unidades: unidades.data ?? [],
    setores: setores.data ?? [],
    carregando: consultas.some((c) => c.isLoading),
    erro: consultas.find((c) => c.error)?.error ?? null,
    recarregar: () => consultas.forEach((c) => c.refetch()),
  }
}

function useMutacao<A, R>(fn: (a: A) => Promise<R>) {
  const qc = useQueryClient()
  return useMutation({ mutationFn: fn, onSuccess: () => qc.invalidateQueries({ queryKey: CHAVE }) })
}

export const useCriarEmpresa = () => useMutacao((b: EmpresaEntrada) => post<Empresa>("/empresas", b))
export const useAlterarEmpresa = () =>
  useMutacao(({ id, ...b }: EmpresaAlteracao & { id: string }) => patch<Empresa>(`/empresas/${id}`, b))

export const useCriarEstabelecimento = () => useMutacao((b: EstabelecimentoEntrada) => post<Estabelecimento>("/estabelecimentos", b))
export const useAlterarEstabelecimento = () =>
  useMutacao(({ id, ...b }: EstabelecimentoAlteracao & { id: string }) => patch<Estabelecimento>(`/estabelecimentos/${id}`, b))

export const useCriarUnidade = () => useMutacao((b: UnidadeEntrada) => post<Unidade>("/unidades", b))
export const useAlterarUnidade = () =>
  useMutacao(({ id, ...b }: UnidadeAlteracao & { id: string }) => patch<Unidade>(`/unidades/${id}`, b))

export const useCriarSetor = () => useMutacao((b: SetorEntrada) => post<Setor>("/setores", b))
export const useAlterarSetor = () =>
  useMutacao(({ id, ...b }: { id: string; nome?: string; ativo?: boolean }) => patch<Setor>(`/setores/${id}`, b))
