import type { EventoArp, RegistroAuditoria } from "@/contracts"
import { useInfiniteQuery, useQuery } from "@tanstack/react-query"

import { api, query } from "@/lib/api"

export type FiltrosAuditoria = { acao?: string; resultado?: string; usuario_id?: string }
const POR_PAGINA = 50

/** Auditoria em páginas: cada "Carregar mais" pede o que aconteceu antes do último registro mostrado. */
export function useAuditoria(f: FiltrosAuditoria) {
  return useInfiniteQuery({
    queryKey: ["auditoria", f],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => api<RegistroAuditoria[]>(`/auditoria${query({ ...f, antes_de: pageParam, por_pagina: POR_PAGINA })}`),
    getNextPageParam: (ultima) => (ultima.length === POR_PAGINA ? ultima[ultima.length - 1].ocorrido_em : undefined),
  })
}

export function useEventosArp(estabelecimentoId: string) {
  return useQuery({
    queryKey: ["auditoria", "arp", estabelecimentoId],
    queryFn: () => api<EventoArp[]>(`/arp/eventos${query({ estabelecimento_id: estabelecimentoId })}`),
    enabled: !!estabelecimentoId,
  })
}

/** Confere a sequência do NSR (sem lacunas) e a corrente de hashes (cada um aponta para o anterior). */
export function conferirCadeia(eventos: EventoArp[]) {
  const problemas: string[] = []
  eventos.forEach((e, i) => {
    if (e.nsr !== i + 1) problemas.push(`NSR ${e.nsr} fora da sequência (esperado ${i + 1}).`)
    const esperado = i === 0 ? "0".repeat(64) : eventos[i - 1].hash
    if (e.hash_anterior !== esperado) problemas.push(`NSR ${e.nsr}: o hash anterior não bate com o registro ${i}.`)
  })
  return problemas
}
