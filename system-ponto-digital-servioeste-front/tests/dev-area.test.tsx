import { screen } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { describe, expect, it } from "vitest"

import type { Plano } from "@/dev/tipos"

import { renderizarApp } from "./renderizar"
import { servidor } from "./setup"

const plano: Plano = {
  features: [{
    numero: "001", titulo: "Fundação e cadastros", objetivo: "Base", dependeDe: [], pendencias: ["RH-01"],
    pastaSpec: "specs/001-fundacao-cadastros", etapa: "com_tarefas", historias: { US1: "estrutura" },
    fases: [
      { numero: 1, titulo: "Setup", parte: "A", pontoDeControle: null, tarefas: [{ id: "T001", feita: true, paralela: false, historia: null, descricao: "Criar", fase: 1 }] },
      { numero: 2, titulo: "Fundação", parte: "A", pontoDeControle: "Login funciona", tarefas: [{ id: "T002", feita: false, paralela: true, historia: "US1", descricao: "Tela", fase: 2 }] },
    ],
  }],
}

describe("área de desenvolvimento", () => {
  it("abre /dev sem login, mostra o plano e a fase em andamento", async () => {
    servidor.use(http.get("*/__dev/plano", () => HttpResponse.json(plano)))
    renderizarApp("/dev")
    expect(await screen.findByRole("heading", { name: "Plano de desenvolvimento" })).toBeInTheDocument()
    expect(await screen.findByText(/Em andamento:/)).toHaveTextContent("001 Fundação e cadastros")
    expect(screen.getByText("Fase 2: Fundação")).toBeInTheDocument()
    expect(screen.getByText(/Login funciona/)).toBeInTheDocument()
  })

  it("board separa a fase atual em 'Em andamento'", async () => {
    servidor.use(http.get("*/__dev/plano", () => HttpResponse.json(plano)))
    renderizarApp("/dev/board")
    const andamento = await screen.findByRole("region", { name: "Em andamento" })
    expect(andamento).toHaveTextContent("T002")
    expect(screen.getByRole("region", { name: "Feito" })).toHaveTextContent("T001")
  })
})
