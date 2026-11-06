// CNPJ e demais identificadores do empregador (Anexo IX: CNPJ, CPF, CAEPF ou CNO).
import type { TipoIdentificador } from "@/contracts"

import { formatarCpf, somenteDigitos, validarCpf } from "@/lib/cpf"

function dvCnpj(base: string) {
  const pesos = base.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const soma = base.split("").reduce((s, d, i) => s + Number(d) * pesos[i], 0)
  const resto = soma % 11
  return resto < 2 ? 0 : 11 - resto
}

export function validarCnpj(valor: string) {
  const cnpj = somenteDigitos(valor)
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false
  const d1 = dvCnpj(cnpj.slice(0, 12))
  return cnpj.slice(12) === `${d1}${dvCnpj(cnpj.slice(0, 12) + d1)}`
}

/** "12345678000195" → "12.345.678/0001-95" (aceita digitação parcial). */
export function formatarCnpj(valor: string) {
  return somenteDigitos(valor).slice(0, 14)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2")
}

export const TAMANHO_IDENTIFICADOR: Record<TipoIdentificador, number> = { cnpj: 14, cpf: 11, caepf: 14, cno: 12 }

export const NOME_IDENTIFICADOR: Record<TipoIdentificador, string> = {
  cnpj: "CNPJ", cpf: "CPF", caepf: "CAEPF", cno: "CNO",
}

/** Valida pelo tipo. CNPJ e CPF conferem os dígitos verificadores; CAEPF e CNO conferem o tamanho. */
export function validarIdentificador(tipo: TipoIdentificador, valor: string) {
  const d = somenteDigitos(valor)
  if (tipo === "cnpj") return validarCnpj(d)
  if (tipo === "cpf") return validarCpf(d)
  return d.length === TAMANHO_IDENTIFICADOR[tipo]
}

export function formatarIdentificador(tipo: TipoIdentificador, valor: string) {
  if (tipo === "cnpj") return formatarCnpj(valor)
  if (tipo === "cpf") return formatarCpf(valor)
  return somenteDigitos(valor).slice(0, TAMANHO_IDENTIFICADOR[tipo])
}
