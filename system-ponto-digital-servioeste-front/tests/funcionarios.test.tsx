import { screen, waitFor, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { addDays, fmtDate, todayIso } from "@/lib/format"
import { cpfFicticio, db } from "@/mocks/dados"

import { entrarComo, escolher, renderizarApp } from "./renderizar"

const idPorNome = (nome: string) => db.funcionarios.find((f) => f.nome === nome)!.id

describe("cadastro de funcionários", () => {
  it("RH cadastra um funcionário válido, vai para a ficha e a inclusão entra no ARP", async () => {
    entrarComo("rh@exemplo.test")
    const { user, router } = renderizarApp("/funcionarios/novo")
    await user.type(await screen.findByLabelText("Nome completo"), "Maria Teste da Silva")
    await user.type(screen.getByLabelText("CPF"), cpfFicticio(500))
    await user.type(screen.getByLabelText("Matrícula"), "2001")
    await user.click(screen.getByRole("radio", { name: /App no celular/ }))
    const arpAntes = db.arp.length
    await user.click(screen.getByRole("button", { name: "Cadastrar funcionário" }))

    expect(await screen.findByRole("heading", { name: "Maria Teste da Silva" })).toBeInTheDocument()
    expect(router.state.location.pathname).toMatch(/^\/funcionarios\/.+/)
    expect(db.arp.length).toBe(arpAntes + 1)
    expect(db.arp[db.arp.length - 1].tipo).toBe("empregado_inclusao")
  })

  it("CPF inválido é recusado no próprio formulário", async () => {
    entrarComo("rh@exemplo.test")
    const { user } = renderizarApp("/funcionarios/novo")
    await user.type(await screen.findByLabelText("Nome completo"), "Pessoa Teste")
    await user.type(screen.getByLabelText("CPF"), "12345678900")
    await user.type(screen.getByLabelText("Matrícula"), "2002")
    await user.click(screen.getByRole("button", { name: "Cadastrar funcionário" }))
    expect(await screen.findByText("CPF inválido. Confira os números.")).toBeInTheDocument()
    expect(screen.getByLabelText("CPF")).toHaveAttribute("aria-invalid", "true")
  })

  it("CPF já ativo mostra o erro no campo e leva ao funcionário existente", async () => {
    entrarComo("rh@exemplo.test")
    const { user } = renderizarApp("/funcionarios/novo")
    await user.type(await screen.findByLabelText("Nome completo"), "Duplicado Teste")
    await user.type(screen.getByLabelText("CPF"), cpfFicticio(1)) // CPF de Ana Paula Ferreira
    await user.type(screen.getByLabelText("Matrícula"), "2003")
    await user.click(screen.getByRole("button", { name: "Cadastrar funcionário" }))
    expect(await screen.findByText("Já existe um funcionário ativo com este CPF.")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Abrir o funcionário existente" }))
      .toHaveAttribute("href", `/funcionarios/${idPorNome("Ana Paula Ferreira")}`)
  })

  it("matrícula repetida na empresa é recusada", async () => {
    entrarComo("rh@exemplo.test")
    const { user } = renderizarApp("/funcionarios/novo")
    await user.type(await screen.findByLabelText("Nome completo"), "Outra Pessoa")
    await user.type(screen.getByLabelText("CPF"), cpfFicticio(501))
    await user.type(screen.getByLabelText("Matrícula"), "1001")
    await user.click(screen.getByRole("button", { name: "Cadastrar funcionário" }))
    expect(await screen.findByText("Esta matrícula já está em uso nesta empresa.")).toBeInTheDocument()
  })

  it("busca por nome filtra a lista e mostra o CPF mascarado", async () => {
    entrarComo("rh@exemplo.test")
    const { user } = renderizarApp("/funcionarios")
    expect(await screen.findByRole("link", { name: "Ana Paula Ferreira" })).toBeInTheDocument()
    await user.type(screen.getByLabelText("Buscar"), "bruno")
    await waitFor(() => expect(screen.queryByRole("link", { name: "Ana Paula Ferreira" })).not.toBeInTheDocument())
    const linha = screen.getByRole("link", { name: "Bruno Henrique Costa" }).closest("tr")!
    expect(within(linha).getByText(/^\*\*\*\.\d{3}\.\d{3}-\*\*$/)).toBeInTheDocument()
  })

  it("transferência fecha a lotação anterior no dia anterior e mostra o histórico", async () => {
    entrarComo("rh@exemplo.test")
    const id = idPorNome("Eduarda Alves Pinto") // Operacional de São Cristóvão
    const { user } = renderizarApp(`/funcionarios/${id}`)
    await user.click(await screen.findByRole("button", { name: /Transferir/ }))
    const dialogo = await screen.findByRole("dialog", { name: "Transferir funcionário" })
    await escolher(user, await within(dialogo).findByLabelText("Novo setor"), "Administrativo")
    await user.click(within(dialogo).getByRole("button", { name: "Transferir" }))
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())

    await user.click(screen.getByRole("tab", { name: /Lotações/ }))
    const linhas = await screen.findAllByRole("row")
    expect(linhas).toHaveLength(3) // cabeçalho + 2 lotações
    expect(within(linhas[1]).getByText("Administrativo")).toBeInTheDocument()
    expect(within(linhas[2]).getByText(new RegExp(fmtDate(addDays(todayIso(), -1))))).toBeInTheDocument()
  })

  it("RH não abre funcionário de outra unidade: aparece 'não encontrado' e a tentativa é auditada", async () => {
    entrarComo("rh@exemplo.test")
    const id = idPorNome("Isabela Moreira Campos") // Unidade Teste, fora do escopo do RH
    renderizarApp(`/funcionarios/${id}`)
    expect(await screen.findByText("Funcionário não encontrado")).toBeInTheDocument()
    expect(db.auditoria.some((a) => a.acao === "acesso.negado" && a.objeto_id === id)).toBe(true)
  })
})
