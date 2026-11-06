import { screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { db } from "@/mocks/dados"

import { entrarComo, escolher, renderizarApp } from "./renderizar"

const ano = new Date().getFullYear()

async function cadastrarMunicipal(user: ReturnType<typeof renderizarApp>["user"], nome: string) {
  await user.click(await screen.findByRole("button", { name: /Novo feriado/ }))
  const d = await screen.findByRole("dialog", { name: "Novo feriado" })
  const data = within(d).getByLabelText("Data")
  await user.clear(data)
  await user.type(data, `${ano}-08-25`)
  await user.type(within(d).getByLabelText("Nome do feriado"), nome)
  await escolher(user, within(d).getByLabelText("Abrangência"), "Municipal")
  await user.click(within(d).getByRole("button", { name: "Salvar" }))
  return d
}

describe("feriados por unidade", () => {
  it("o municipal aparece só na unidade do município; o nacional aparece para todas", async () => {
    entrarComo("admin@exemplo.test")
    const { user } = renderizarApp("/feriados")
    await cadastrarMunicipal(user, "Aniversário de Chapecó") // primeiro município da lista: Chapecó (São Cristóvão)
    expect(await screen.findByText("Aniversário de Chapecó")).toBeInTheDocument()

    const filtro = screen.getByLabelText("Ver o calendário de")
    await escolher(user, filtro, "São Cristóvão")
    expect(await screen.findByText("Aniversário de Chapecó")).toBeInTheDocument()
    expect(screen.getAllByText("Natal").length).toBeGreaterThan(0)

    await escolher(user, filtro, "Unidade Teste") // Xanxerê
    expect(await screen.findAllByText("Natal")).not.toHaveLength(0)
    expect(screen.queryByText("Aniversário de Chapecó")).not.toBeInTheDocument()
  })

  it("RH com escopo de uma unidade só cadastra municipal ou da unidade", async () => {
    entrarComo("rh@exemplo.test")
    const { user } = renderizarApp("/feriados")
    await user.click(await screen.findByRole("button", { name: /Novo feriado/ }))
    const d = await screen.findByRole("dialog", { name: "Novo feriado" })
    await user.click(within(d).getByLabelText("Abrangência"))
    const opcoes = screen.getAllByRole("option").map((o) => o.textContent)
    expect(opcoes).toEqual(["Municipal", "Da unidade"])
    expect(within(d).getByText(/Feriados nacionais e estaduais são cadastrados pelo Administrador/)).toBeInTheDocument()
  })

  it("RH não vê editar nem desativar em feriado nacional", async () => {
    entrarComo("rh@exemplo.test")
    renderizarApp("/feriados")
    await screen.findAllByText("Natal")
    expect(screen.queryByRole("button", { name: /Editar Natal|Desativar Natal/ })).not.toBeInTheDocument()
  })

  it("desativar não apaga: o feriado some do calendário da unidade mas continua guardado", async () => {
    entrarComo("admin@exemplo.test")
    const { user } = renderizarApp("/feriados")
    await user.click((await screen.findAllByRole("button", { name: "Desativar Natal" }))[0])
    const d = await screen.findByRole("dialog", { name: "Desativar feriado?" })
    await user.click(within(d).getByRole("button", { name: "Desativar" }))
    expect(await screen.findByText(/Feriado desativado/)).toBeInTheDocument()
    const natal = db.feriados.find((f) => f.nome === "Natal" && f.data.startsWith(String(ano)))!
    expect(natal.ativo).toBe(false)
    expect(db.feriados).toContain(natal)
  })
})
