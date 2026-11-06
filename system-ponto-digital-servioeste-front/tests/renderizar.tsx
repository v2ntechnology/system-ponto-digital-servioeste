import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createMemoryRouter, RouterProvider } from "react-router-dom"

import { db, salvar, SENHA_TESTE } from "@/mocks/dados"
import { Providers } from "@/Providers"
import { rotas } from "@/rotas"

/** Monta o app inteiro numa rota, com o roteador em memória. */
export function renderizarApp(caminho = "/") {
  const router = createMemoryRouter(rotas, { initialEntries: [caminho] })
  const user = userEvent.setup()
  const utils = render(<Providers><RouterProvider router={router} /></Providers>)
  return { ...utils, router, user }
}

/** Abre uma sessão simulada já com o segundo fator concluído. */
export function entrarComo(email: "admin@exemplo.test" | "rh@exemplo.test" | "gestor@exemplo.test") {
  const u = db.usuarios.find((x) => x.email === email)!
  db.sessao = { usuario_id: u.id, mfa_pendente: false }
  salvar()
  return u
}

export { SENHA_TESTE }

/** Escolhe uma opção numa lista de escolha (componente Select): abre a lista e clica na opção. */
export async function escolher(user: ReturnType<typeof userEvent.setup>, lista: HTMLElement, opcao: string) {
  await user.click(lista)
  const alvo = await screen.findByRole("option", { name: (nome) => nome === opcao || nome.startsWith(`${opcao} `) })
  await user.click(alvo)
}
