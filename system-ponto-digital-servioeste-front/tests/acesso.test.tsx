import { screen, waitFor, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { cpfFicticio, db } from "@/mocks/dados"

import { entrarComo, renderizarApp } from "./renderizar"

const idPorNome = (nome: string) => db.funcionarios.find((f) => f.nome === nome)!.id

describe("acesso respeita o perfil", () => {
  it("gestor vê só o próprio setor, sem botões de edição, e recebe 'não encontrado' fora do escopo", async () => {
    entrarComo("gestor@exemplo.test")
    const { unmount } = renderizarApp("/funcionarios")
    expect(await screen.findByRole("link", { name: "Eduarda Alves Pinto" })).toBeInTheDocument() // Operacional
    expect(screen.queryByRole("link", { name: "Ana Paula Ferreira" })).not.toBeInTheDocument() // Administrativo
    expect(screen.queryByRole("button", { name: /Novo funcionário/ })).not.toBeInTheDocument()
    unmount()

    renderizarApp(`/funcionarios/${idPorNome("Eduarda Alves Pinto")}`)
    expect(await screen.findByRole("heading", { name: "Eduarda Alves Pinto" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Editar|Transferir/ })).not.toBeInTheDocument()
    expect(screen.getByText(/^\*\*\*\.\d{3}\.\d{3}-\*\*$/)).toBeInTheDocument() // CPF mascarado para o gestor
  })

  it("gestor que abre a ficha de outro setor vê 'não encontrado' e a tentativa vai para a auditoria", async () => {
    entrarComo("gestor@exemplo.test")
    const id = idPorNome("Ana Paula Ferreira")
    renderizarApp(`/funcionarios/${id}`)
    expect(await screen.findByText("Funcionário não encontrado")).toBeInTheDocument()
    expect(db.auditoria.some((a) => a.acao === "acesso.negado" && a.objeto_id === id && a.resultado === "negado")).toBe(true)
  })

  it("RH de uma unidade não vê funcionários de outra", async () => {
    entrarComo("rh@exemplo.test")
    renderizarApp("/funcionarios")
    expect(await screen.findByRole("link", { name: "Ana Paula Ferreira" })).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Isabela Moreira Campos" })).not.toBeInTheDocument() // Unidade Teste
  })

  it("administrador cria um gestor com escopo de setor e a ação aparece na auditoria", async () => {
    entrarComo("admin@exemplo.test")
    const { user, unmount } = renderizarApp("/usuarios")
    await user.click(await screen.findByRole("button", { name: /Novo usuário/ }))
    const d = await screen.findByRole("dialog", { name: "Novo usuário" })
    await user.type(within(d).getByLabelText("Nome"), "Gestora Nova")
    await user.type(within(d).getByLabelText("E-mail"), "gestora@exemplo.test")
    await user.type(within(d).getByLabelText("Senha inicial"), "senha-forte-123")
    await user.click(await within(d).findByRole("checkbox", { name: "Administrativo" }))
    await user.click(within(d).getByRole("button", { name: "Salvar" }))

    const linha = (await screen.findByText("Gestora Nova")).closest("tr")!
    expect(within(linha).getByText("Administrativo (São Cristóvão)")).toBeInTheDocument()
    expect(within(linha).getByText("Não exigido")).toBeInTheDocument()
    unmount()

    renderizarApp("/auditoria")
    expect(await screen.findByText("Criou usuário")).toBeInTheDocument()
  })

  it("RH sem CPF é recusado no formulário", async () => {
    entrarComo("admin@exemplo.test")
    const { user } = renderizarApp("/usuarios")
    await user.click(await screen.findByRole("button", { name: /Novo usuário/ }))
    const d = await screen.findByRole("dialog", { name: "Novo usuário" })
    await user.type(within(d).getByLabelText("Nome"), "RH Novo")
    await user.type(within(d).getByLabelText("E-mail"), "rh2@exemplo.test")
    await user.selectOptions(within(d).getByLabelText("Perfil"), "rh")
    await user.type(within(d).getByLabelText("Senha inicial"), "senha-forte-123")
    await user.click(within(d).getByRole("checkbox", { name: "Todas as unidades" }))
    await user.click(within(d).getByRole("button", { name: "Salvar" }))
    expect(await within(d).findByText("CPF é obrigatório para Administrador e RH.")).toBeInTheDocument()

    await user.type(within(d).getByLabelText("CPF"), cpfFicticio(700))
    await user.click(within(d).getByRole("button", { name: "Salvar" }))
    const linha = (await screen.findByText("RH Novo")).closest("tr")!
    expect(within(linha).getByText("Todas as unidades")).toBeInTheDocument()
    expect(within(linha).getByText("Configura no próximo acesso")).toBeInTheDocument()
  })

  it("o último administrador ativo não pode ser desativado", async () => {
    entrarComo("admin@exemplo.test")
    const { user } = renderizarApp("/usuarios")
    await user.click(await screen.findByRole("button", { name: "Desativar Administrador de Teste" }))
    const d = await screen.findByRole("dialog", { name: "Desativar usuário?" })
    await user.click(within(d).getByRole("button", { name: "Desativar" }))
    expect(await within(d).findByRole("alert")).toHaveTextContent("último administrador ativo")
    expect(db.usuarios.find((u) => u.email === "admin@exemplo.test")!.ativo).toBe(true)
  })

  it("eventos do ARP mostram a sequência de NSR íntegra", async () => {
    entrarComo("admin@exemplo.test")
    const { user } = renderizarApp("/auditoria")
    await user.click(await screen.findByRole("tab", { name: "Eventos do ARP (NSR)" }))
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Sequência íntegra: NSR de 1 a"))
    expect(screen.getAllByText("Inclusão do empregador").length).toBeGreaterThan(0)
  })
})
