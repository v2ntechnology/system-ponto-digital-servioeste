import { Navigate, type RouteObject } from "react-router-dom"

import { RequirePermissao } from "@/components/layout/RequirePermissao"
import { RequireAuth } from "@/features/auth/RequireAuth"
import { AuditoriaPage } from "@/pages/AuditoriaPage"
import { ConfiguracoesPage } from "@/pages/ConfiguracoesPage"
import { ErrorPage } from "@/pages/ErrorPage"
import { EstruturaPage } from "@/pages/EstruturaPage"
import { FeriadosPage } from "@/pages/FeriadosPage"
import { FuncionarioNovoPage } from "@/pages/FuncionarioNovoPage"
import { FuncionarioPage } from "@/pages/FuncionarioPage"
import { FuncionariosPage } from "@/pages/FuncionariosPage"
import { LoginPage } from "@/pages/LoginPage"
import { MfaPage } from "@/pages/MfaPage"
import { UsuariosPage } from "@/pages/UsuariosPage"

/**
 * Área de desenvolvimento (/dev): plano, board, histórico, dúvidas do RH e conceitos.
 * Só em desenvolvimento: no build de produção `import.meta.env.DEV` vira `false` e o import some do pacote.
 */
const rotasDev: RouteObject[] = import.meta.env.DEV
  ? [{ path: "/dev/*", lazy: async () => ({ Component: (await import("@/dev/DevApp")).DevApp }), errorElement: <ErrorPage /> }]
  : []

/** Rotas do painel. Exportadas para os testes montarem o mesmo app com um roteador em memória. */
export const rotas: RouteObject[] = [
  { path: "/login", element: <LoginPage />, errorElement: <ErrorPage /> },
  { path: "/mfa", element: <MfaPage />, errorElement: <ErrorPage /> },
  {
    element: <RequireAuth />,
    errorElement: <ErrorPage />,
    children: [
      { path: "/", element: <Navigate to="/funcionarios" replace /> },
      {
        path: "/funcionarios",
        element: <RequirePermissao permissao="funcionario.ler"><FuncionariosPage /></RequirePermissao>,
      },
      {
        path: "/funcionarios/novo",
        element: <RequirePermissao permissao="funcionario.editar"><FuncionarioNovoPage /></RequirePermissao>,
      },
      {
        path: "/funcionarios/:id",
        element: <RequirePermissao permissao="funcionario.ler"><FuncionarioPage /></RequirePermissao>,
      },
      {
        path: "/estrutura",
        element: <RequirePermissao permissao="estrutura.ler"><EstruturaPage /></RequirePermissao>,
      },
      {
        path: "/feriados",
        element: <RequirePermissao permissao="estrutura.ler"><FeriadosPage /></RequirePermissao>,
      },
      {
        path: "/usuarios",
        element: <RequirePermissao permissao="usuario.gerenciar"><UsuariosPage /></RequirePermissao>,
      },
      {
        path: "/auditoria",
        element: <RequirePermissao permissao="auditoria.ler"><AuditoriaPage /></RequirePermissao>,
      },
      { path: "/configuracoes", element: <ConfiguracoesPage /> },
    ],
  },
  ...rotasDev,
  { path: "*", element: <Navigate to="/" replace /> },
]
