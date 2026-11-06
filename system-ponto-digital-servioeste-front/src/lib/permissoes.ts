import type { Eu, Perfil } from "@ponto/contracts"

import { useEu } from "@/features/auth/useAuth"

/** Permissões conhecidas pelo front-end (a lista oficial vem do servidor em Eu.permissoes). */
export type Permissao =
  | "estrutura.ler"
  | "estrutura.editar"
  | "funcionario.ler"
  | "funcionario.editar"
  | "funcionario.desligar"
  | "feriado.editar"
  | "usuario.gerenciar"
  | "auditoria.ler"
  | "atestado.abrir"

export const pode = (eu: Eu | null | undefined, permissao: Permissao) => !!eu?.permissoes.includes(permissao)

export function usePermissao(permissao: Permissao) {
  const { data: eu } = useEu()
  return pode(eu, permissao)
}

export const NOME_PERFIL: Record<Perfil, string> = {
  administrador: "Administrador",
  rh: "RH",
  gestor: "Gestor",
}
