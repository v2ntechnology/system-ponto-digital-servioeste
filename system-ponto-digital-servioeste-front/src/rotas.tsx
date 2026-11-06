import { CalendarDays, ScrollText, UserCog } from "lucide-react"
import { Navigate, type RouteObject } from "react-router-dom"

import { RequirePermissao } from "@/components/layout/RequirePermissao"
import { RequireAuth } from "@/features/auth/RequireAuth"
import { ConfiguracoesPage } from "@/pages/ConfiguracoesPage"
import { EmConstrucao } from "@/pages/EmConstrucao"
import { ErrorPage } from "@/pages/ErrorPage"
import { EstruturaPage } from "@/pages/EstruturaPage"
import { FuncionarioNovoPage } from "@/pages/FuncionarioNovoPage"
import { FuncionarioPage } from "@/pages/FuncionarioPage"
import { FuncionariosPage } from "@/pages/FuncionariosPage"
import { LoginPage } from "@/pages/LoginPage"
import { MfaPage } from "@/pages/MfaPage"

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
        element: <RequirePermissao permissao="estrutura.ler"><EmConstrucao titulo="Feriados" icone={CalendarDays} fase="Fase 6" /></RequirePermissao>,
      },
      {
        path: "/usuarios",
        element: <RequirePermissao permissao="usuario.gerenciar"><EmConstrucao titulo="Usuários" icone={UserCog} fase="Fase 5" /></RequirePermissao>,
      },
      {
        path: "/auditoria",
        element: <RequirePermissao permissao="auditoria.ler"><EmConstrucao titulo="Auditoria" icone={ScrollText} fase="Fase 5" /></RequirePermissao>,
      },
      { path: "/configuracoes", element: <ConfiguracoesPage /> },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]
