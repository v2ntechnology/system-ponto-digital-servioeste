import { screen, waitFor } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { entrarComo, renderizarApp, SENHA_TESTE } from "./renderizar"

async function preencherLogin(user: ReturnType<typeof renderizarApp>["user"], email: string, senha = SENHA_TESTE) {
  await user.type(await screen.findByLabelText("E-mail"), email)
  await user.type(screen.getByLabelText("Senha"), senha)
  await user.click(screen.getByRole("button", { name: /entrar/i }))
}

describe("login e segundo fator", () => {
  it("sem sessão, uma rota protegida volta para o login", async () => {
    const { router } = renderizarApp("/funcionarios")
    expect(await screen.findByRole("heading", { name: "Entrar" })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe("/login")
  })

  it("senha errada mostra o erro e não entra", async () => {
    const { user, router } = renderizarApp("/login")
    await preencherLogin(user, "gestor@exemplo.test", "senha-errada")
    expect(await screen.findByRole("alert")).toHaveTextContent("E-mail ou senha incorretos.")
    expect(router.state.location.pathname).toBe("/login")
  })

  it("gestor entra direto, sem segundo fator, e só vê as abas permitidas", async () => {
    const { user, router } = renderizarApp("/login")
    await preencherLogin(user, "gestor@exemplo.test")
    await waitFor(() => expect(router.state.location.pathname).toBe("/funcionarios"))
    const nav = await screen.findByRole("navigation", { name: "Principal" })
    expect(nav).toHaveTextContent("Funcionários")
    expect(nav).not.toHaveTextContent("Usuários")
    expect(nav).not.toHaveTextContent("Auditoria")
  })

  it("RH sem app cadastrado vai para /mfa, vê o QR code e entra com o código 000000", async () => {
    const { user, router } = renderizarApp("/login")
    await preencherLogin(user, "rh@exemplo.test")
    expect(await screen.findByRole("heading", { name: "Configure o app autenticador" })).toBeInTheDocument()
    expect(await screen.findByAltText(/QR code/)).toBeInTheDocument()

    await user.type(screen.getByLabelText("Código"), "123456")
    await user.click(screen.getByRole("button", { name: /confirmar/i }))
    expect(await screen.findByRole("alert")).toHaveTextContent("Código incorreto")

    await user.clear(screen.getByLabelText("Código"))
    await user.type(screen.getByLabelText("Código"), "000000")
    await user.click(screen.getByRole("button", { name: /confirmar/i }))
    await waitFor(() => expect(router.state.location.pathname).toBe("/funcionarios"))
  })

  it("administrador com app já cadastrado só digita o código", async () => {
    const { user } = renderizarApp("/login")
    await preencherLogin(user, "admin@exemplo.test")
    expect(await screen.findByRole("heading", { name: "Confirme que é você" })).toBeInTheDocument()
    expect(screen.queryByAltText(/QR code/)).not.toBeInTheDocument()
  })

  it("administrador vê todas as abas", async () => {
    entrarComo("admin@exemplo.test")
    renderizarApp("/funcionarios")
    const nav = await screen.findByRole("navigation", { name: "Principal" })
    for (const aba of ["Funcionários", "Estrutura", "Feriados", "Usuários", "Auditoria"]) expect(nav).toHaveTextContent(aba)
  })

  it("gestor que abre /usuarios direto vê 'Sem acesso'", async () => {
    entrarComo("gestor@exemplo.test")
    renderizarApp("/usuarios")
    expect(await screen.findByText("Sem acesso")).toBeInTheDocument()
  })
})
