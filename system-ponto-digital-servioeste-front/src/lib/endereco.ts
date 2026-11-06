import type { Endereco } from "@/contracts"

import { somenteDigitos } from "@/lib/cpf"

export const UFS = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT", "PA", "PB", "PE", "PI", "PR", "RJ",
  "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO",
]

export const enderecoVazio = (): Endereco => ({
  logradouro: "", numero: "", complemento: null, bairro: "", cidade: "", uf: "SC", cep: "",
})

export const formatarCep = (v: string) => somenteDigitos(v).slice(0, 8).replace(/^(\d{5})(\d)/, "$1-$2")

export const enderecoValido = (e: Endereco) =>
  !!(e.logradouro.trim() && e.numero.trim() && e.bairro.trim() && e.cidade.trim() && e.uf && somenteDigitos(e.cep).length === 8)

