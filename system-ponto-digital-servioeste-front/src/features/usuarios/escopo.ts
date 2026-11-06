import type { Escopo, Setor, Unidade } from "@/contracts"

export const escopoVazio = (): Escopo => ({ todas_unidades: false, unidade_ids: [], setor_ids: [] })

/** Texto curto do escopo para a tabela: "Toda a empresa", "Todas as unidades", "São Cristóvão · Operacional (São Cristóvão)". */
export function resumirEscopo(perfil: string, e: Escopo, unidades: Unidade[], setores: Setor[]) {
  if (perfil === "administrador") return "Toda a empresa"
  if (e.todas_unidades) return "Todas as unidades"
  const nomes = [
    ...e.unidade_ids.map((id) => unidades.find((u) => u.id === id)?.nome ?? "?"),
    ...e.setor_ids.map((id) => {
      const s = setores.find((x) => x.id === id)
      return s ? `${s.nome} (${unidades.find((u) => u.id === s.unidade_id)?.nome ?? "?"})` : "?"
    }),
  ]
  return nomes.length ? nomes.join(" · ") : "Sem escopo (não vê ninguém)"
}
