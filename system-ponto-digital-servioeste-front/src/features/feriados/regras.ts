// Regras de feriado compartilhadas pela tela e pelos dados simulados (a API real aplica as mesmas, T114).
import type { Escopo, Feriado, FeriadoEntrada, Perfil, Unidade } from "@/contracts"

type Quem = { perfil: Perfil; escopo: Escopo }

const acessoTotal = (u: Quem) => u.perfil === "administrador" || u.escopo.todas_unidades

/** Unidades que o RH atende (gestor não edita feriados). */
export const unidadesDoEscopo = (u: Quem, unidades: Unidade[]) =>
  acessoTotal(u) ? unidades : unidades.filter((x) => u.escopo.unidade_ids.includes(x.id))

/** Feriado vale para a unidade? nacional + estadual da UF + municipal do município + o da própria unidade. */
export function valeParaUnidade(f: Pick<Feriado, "abrangencia" | "uf" | "municipio_ibge" | "unidade_id">, u: Unidade) {
  if (f.abrangencia === "nacional") return true
  if (f.abrangencia === "estadual") return f.uf === u.endereco.uf
  if (f.abrangencia === "municipal") return f.municipio_ibge === u.municipio_ibge
  return f.unidade_id === u.id
}

/** O usuário pode criar ou alterar este feriado? (FR-012a) */
export function podeEditarFeriado(u: Quem, f: Pick<FeriadoEntrada, "abrangencia" | "municipio_ibge" | "unidade_id">, unidades: Unidade[]) {
  if (u.perfil === "gestor") return false
  if (acessoTotal(u)) return true
  const minhas = unidadesDoEscopo(u, unidades)
  if (f.abrangencia === "municipal") return minhas.some((x) => x.municipio_ibge === f.municipio_ibge)
  if (f.abrangencia === "unidade") return minhas.some((x) => x.id === f.unidade_id)
  return false
}

export const NOME_ABRANGENCIA: Record<FeriadoEntrada["abrangencia"], string> = {
  nacional: "Nacional", estadual: "Estadual", municipal: "Municipal", unidade: "Da unidade",
}

/** "Estadual · SC", "Municipal · Chapecó/SC", "Da unidade · São Cristóvão" */
export function descreverAbrangencia(f: Pick<Feriado, "abrangencia" | "uf" | "municipio_ibge" | "unidade_id">, unidades: Unidade[]) {
  if (f.abrangencia === "nacional") return "Nacional"
  if (f.abrangencia === "estadual") return `Estadual · ${f.uf}`
  if (f.abrangencia === "municipal") {
    const u = unidades.find((x) => x.municipio_ibge === f.municipio_ibge)
    return `Municipal · ${u ? `${u.endereco.cidade}/${u.endereco.uf}` : f.municipio_ibge}`
  }
  return `Da unidade · ${unidades.find((x) => x.id === f.unidade_id)?.nome ?? "?"}`
}
