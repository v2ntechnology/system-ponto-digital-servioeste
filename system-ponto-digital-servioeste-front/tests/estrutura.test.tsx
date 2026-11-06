import { screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { db } from "@/mocks/dados"

import { entrarComo, renderizarApp } from "./renderizar"

// CNPJs de exemplo com dígitos verificadores válidos (não pertencem à Servioeste).
const CNPJ_EMPRESA = "11222333000181"
const CNPJ_ESTAB = "11444777000161"

describe("estrutura da empresa", () => {
  it("administrador cadastra empresa → estabelecimento → unidade → setor", async () => {
    entrarComo("admin@exemplo.test")
    const { user } = renderizarApp("/estrutura")
    await screen.findByRole("region", { name: "Empresa Fictícia de Testes Ltda" })

    // Empresa
    await user.click(screen.getByRole("button", { name: "Nova empresa" }))
    let dialogo = await screen.findByRole("dialog", { name: "Nova empresa" })
    await user.type(within(dialogo).getByLabelText("CNPJ"), CNPJ_EMPRESA)
    await user.type(within(dialogo).getByLabelText("Razão social"), "Empresa Nova Ltda")
    await user.click(within(dialogo).getByRole("button", { name: "Salvar" }))
    const empresa = await screen.findByRole("region", { name: "Empresa Nova Ltda" })
    expect(within(empresa).getByText("CNPJ 11.222.333/0001-81")).toBeInTheDocument()

    // Estabelecimento: começa o NSR com a inclusão do empregador
    await user.click(within(empresa).getByRole("button", { name: /Estabelecimento/ }))
    dialogo = await screen.findByRole("dialog", { name: "Novo estabelecimento" })
    await user.type(within(dialogo).getByLabelText("CNPJ"), CNPJ_ESTAB)
    await user.type(within(dialogo).getByLabelText("Razão social"), "Empresa Nova Ltda (Matriz)")
    await user.type(within(dialogo).getByLabelText("Logradouro"), "Rua A")
    await user.type(within(dialogo).getByLabelText("Número"), "10")
    await user.type(within(dialogo).getByLabelText("Bairro"), "Centro")
    await user.type(within(dialogo).getByLabelText("Cidade"), "Chapecó")
    await user.type(within(dialogo).getByLabelText("CEP"), "89800000")
    await user.click(within(dialogo).getByRole("button", { name: "Salvar" }))
    expect(await within(empresa).findByText("Empresa Nova Ltda (Matriz)")).toBeInTheDocument()
    expect(within(empresa).getByText("NSR 1")).toBeInTheDocument()

    // Unidade
    await user.click(within(empresa).getByRole("button", { name: /Unidade/ }))
    dialogo = await screen.findByRole("dialog", { name: "Nova unidade" })
    await user.type(within(dialogo).getByLabelText("Nome da unidade"), "Unidade Nova")
    await user.type(within(dialogo).getByLabelText("Código IBGE do município"), "4204202")
    await user.click(within(dialogo).getByRole("button", { name: "Copiar o endereço do estabelecimento" }))
    await user.click(within(dialogo).getByRole("button", { name: "Salvar" }))
    expect(await within(empresa).findByText("Unidade Nova")).toBeInTheDocument()

    // Setor
    const setores = within(empresa).getByLabelText("Setores de Unidade Nova")
    await user.click(within(setores).getByRole("button", { name: /Setor/ }))
    dialogo = await screen.findByRole("dialog", { name: "Novo setor" })
    await user.type(within(dialogo).getByLabelText("Nome do setor"), "Coleta")
    await user.click(within(dialogo).getByRole("button", { name: "Salvar" }))
    expect(await within(setores).findByRole("button", { name: "Coleta" })).toBeInTheDocument()

    // ARP: inclusão do empregador gravada no novo estabelecimento, com NSR 1
    const est = db.estabelecimentos.find((e) => e.identificador === CNPJ_ESTAB)!
    expect(db.arp.filter((e) => e.estabelecimento_id === est.id).map((e) => [e.nsr, e.tipo])).toEqual([[1, "empregador_inclusao"]])
  })

  it("CNPJ inválido mostra o erro no campo e não salva", async () => {
    entrarComo("admin@exemplo.test")
    const { user } = renderizarApp("/estrutura")
    await user.click(await screen.findByRole("button", { name: "Nova empresa" }))
    const dialogo = await screen.findByRole("dialog", { name: "Nova empresa" })
    await user.type(within(dialogo).getByLabelText("CNPJ"), "11222333000180")
    await user.type(within(dialogo).getByLabelText("Razão social"), "Empresa Errada")
    await user.click(within(dialogo).getByRole("button", { name: "Salvar" }))
    expect(within(dialogo).getByRole("alert")).toHaveTextContent("CNPJ inválido")
    expect(within(dialogo).getByLabelText("CNPJ")).toHaveAttribute("aria-invalid", "true")
    expect(db.empresas).toHaveLength(1)
  })

  it("setor com nome repetido na mesma unidade é recusado pela API", async () => {
    entrarComo("admin@exemplo.test")
    const { user } = renderizarApp("/estrutura")
    const setores = await screen.findByLabelText("Setores de São Cristóvão")
    await user.click(within(setores).getByRole("button", { name: /Setor/ }))
    const dialogo = await screen.findByRole("dialog", { name: "Novo setor" })
    await user.type(within(dialogo).getByLabelText("Nome do setor"), "operacional")
    await user.click(within(dialogo).getByRole("button", { name: "Salvar" }))
    expect(await within(dialogo).findByRole("alert")).toHaveTextContent("Já existe um setor com este nome")
  })

  it("RH vê só a própria unidade e nenhum botão de edição", async () => {
    entrarComo("rh@exemplo.test")
    renderizarApp("/estrutura")
    expect(await screen.findByText("São Cristóvão")).toBeInTheDocument()
    expect(screen.queryByText("Unidade Teste")).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Nova empresa" })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Editar/ })).not.toBeInTheDocument()
  })

  it("lista vazia e falha de carga mostram os estados próprios", async () => {
    entrarComo("admin@exemplo.test")
    window.history.replaceState(null, "", "/?cenario=vazio")
    const vazio = renderizarApp("/estrutura")
    expect(await screen.findByText("Nenhuma empresa cadastrada")).toBeInTheDocument()
    vazio.unmount()

    window.history.replaceState(null, "", "/?cenario=erro")
    renderizarApp("/estrutura")
    expect(await screen.findByText("Não foi possível carregar")).toBeInTheDocument()
    window.history.replaceState(null, "", "/")
  })
})
