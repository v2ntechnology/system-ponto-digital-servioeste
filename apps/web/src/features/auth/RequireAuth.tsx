import { Navigate, Outlet, useLocation } from "react-router-dom"

import { Carregando, ErroCarga } from "@/components/ui/estados"

import { useEu } from "./useAuth"

/** Protege as telas logadas: sem sessão → /login; segundo fator pendente → /mfa. */
export function RequireAuth() {
  const { data: eu, isLoading, isError, refetch } = useEu()
  const location = useLocation()

  if (isLoading) return <Carregando className="h-dvh" />
  if (isError) {
    return <ErroCarga className="h-dvh" mensagem="Não foi possível falar com o servidor. Confira se a API está rodando."
      onTentarDeNovo={() => refetch()} />
  }
  if (!eu) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (eu.mfa_pendente) return <Navigate to="/mfa" replace state={{ from: location.pathname }} />
  return <Outlet />
}
