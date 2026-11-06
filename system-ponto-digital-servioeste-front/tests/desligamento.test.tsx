import { screen, waitFor, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { addDays, fmtDate, todayIso } from "@/lib/format"
import { db, salvar } from "@/mocks/dados"

import { entrarComo, renderizarApp } from "./renderizar"

const func = (nome: string) => db.funcionarios.find((f) => f.nome === nome)!

async function abrirDesligamento(user: ReturnType<typeof renderizarApp>["user"], data: string) {
  await user.click(await screen.findByRole("button", { name: /Desligar/ }))
  const d = await screen.findByRole("dialog", { name: "Desligar funcionário" })
  const campo = within(d).getByLabelText("Data do desligamento")
  await user.clear(campo)
  await user.type(campo, data)
  return d
}

describe("desligamento", () => {
  it("desligado (data já passada) sai dos ativos, vai para desligados e mostra o acesso ao portal", async () => {
    entrarComo("rh@exemplo.test")
    const f = func("Bruno Henrique Costa")
    const ontem = addDays(todayIso(), -1)
    const arpAntes = db.arp.length
    const { user, unmount } = renderizarApp(`/funcionarios/${f.id}`)
    const d = await abrirDesligamento(user, ontem)
    await user.click(within(d).getByRole("button", { name: "Registrar desligamento" }))

    expect(await screen.findByText("Desligado")).toBeInTheDocument()
    expect(screen.getByText(`${fmtDate(addDays(ontem, 1825))} (somente leitura)`)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Recontratar/ })).toBeInTheDocument()
    expect(db.arp.length).toBe(arpAntes + 1)
    expect(db.arp[db.arp.length - 1].tipo).toBe("empregado_exclusao")
    expect(func("Bruno Henrique Costa").biometria_exclusao_pendente).toBe(true)
    unmount()

    const lista = renderizarApp("/funcionarios")
    await screen.findByRole("link", { name: "Ana Paula Ferreira" })
    expect(screen.queryByRole("link", { name: "Bruno Henrique Costa" })).not.toBeInTheDocument()
    await lista.user.click(screen.getByRole("tab", { name: "Desligados" }))
    expect(await screen.findByRole("link", { name: "Bruno Henrique Costa" })).toBeInTheDocument()
  })

  it("data no futuro exige confirmação e deixa o funcionário ativo com o desligamento agendado", async () => {
    entrarComo("rh@exemplo.test")
    const f = func("Carla Souza Lima")
    const daqui10 = addDays(todayIso(), 10)
    const { user } = renderizarApp(`/funcionarios/${f.id}`)
    const d = await abrirDesligamento(user, daqui10)
    await user.click(within(d).getByRole("button", { name: "Registrar desligamento" }))
    expect(within(d).getByText("Confirme que a data no futuro está certa.")).toBeInTheDocument()

    await user.click(within(d).getByRole("checkbox"))
    await user.click(within(d).getByRole("button", { name: "Registrar desligamento" }))
    expect(await screen.findByText(`Desligamento em ${fmtDate(daqui10)}`)).toBeInTheDocument()
    expect(screen.queryByText("Desligado")).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Desligar/ })).not.toBeInTheDocument()
  })

  it("data a mais de 90 dias à frente é recusada", async () => {
    entrarComo("rh@exemplo.test")
    const { user } = renderizarApp(`/funcionarios/${func("Diego Martins Rocha").id}`)
    const d = await abrirDesligamento(user, addDays(todayIso(), 120))
    await user.click(within(d).getByRole("button", { name: "Registrar desligamento" }))
    expect(within(d).getByText(/no máximo 90 dias à frente/)).toBeInTheDocument()
    expect(func("Diego Martins Rocha").desligado_em).toBeNull()
  })

  it("recontratação com o mesmo CPF cria um vínculo novo ligado ao anterior", async () => {
    entrarComo("rh@exemplo.test")
    const antigo = func("Ana Paula Ferreira")
    antigo.desligado_em = "2025-12-31"
    db.lotacoes.find((l) => l.funcionario_id === antigo.id)!.fim = "2025-12-31"
    salvar()

    const { user, router } = renderizarApp(`/funcionarios/${antigo.id}`)
    await user.click(await screen.findByRole("button", { name: /Recontratar/ }))
    expect(await screen.findByRole("heading", { name: "Recontratar funcionário" })).toBeInTheDocument()
    expect(screen.getByLabelText("Nome completo")).toHaveValue("Ana Paula Ferreira")
    await user.type(screen.getByLabelText("Matrícula"), "3001")
    await user.click(screen.getByRole("button", { name: "Recontratar" }))

    await waitFor(() => expect(router.state.location.pathname).not.toBe("/funcionarios/novo"))
    expect(await screen.findByRole("link", { name: "Ver o vínculo anterior" })).toHaveAttribute("href", `/funcionarios/${antigo.id}`)
    const novos = db.funcionarios.filter((f) => f.cpf === antigo.cpf)
    expect(novos).toHaveLength(2)
    expect(novos[1]).toMatchObject({ matricula: "3001", vinculo_anterior_id: antigo.id, desligado_em: null })
  })
})
