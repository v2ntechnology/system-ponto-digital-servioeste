import { readFileSync } from "node:fs"
import path from "node:path"

import { describe, expect, it } from "vitest"

import {
  gravarResposta, lerDependencias, lerFeatureBriefing, lerGitLog, lerGlossario, lerPendencias, lerTarefas,
} from "../dev-tools/leitores"

const raiz = path.resolve(__dirname, "../..")
const ler = (p: string) => readFileSync(path.join(raiz, p), "utf8")

describe("leitores da área de desenvolvimento", () => {
  it("lê fases, tarefas, pontos de controle e histórias de um tasks.md", () => {
    const md = `**[US1]** estrutura · **[US2]** funcionários

# PARTE A: FRONTEND

## Fase 1: Setup

- [X] T001 Criar o workspace
- [ ] T002 [P] Criar contrato

**Ponto de controle**: abre a página.

## Fase 3: História 1

- [x] T003 [P] [US1] Criar handlers
`
    const { fases, historias } = lerTarefas(md)
    expect(historias).toEqual({ US1: "estrutura", US2: "funcionários" })
    expect(fases.map((f) => [f.numero, f.parte, f.pontoDeControle])).toEqual([[1, "A: FRONTEND", "abre a página."], [3, "A: FRONTEND", null]])
    expect(fases[0].tarefas).toEqual([
      { id: "T001", feita: true, paralela: false, historia: null, descricao: "Criar o workspace", fase: 1 },
      { id: "T002", feita: false, paralela: true, historia: null, descricao: "Criar contrato", fase: 1 },
    ])
    expect(fases[1].tarefas[0]).toMatchObject({ id: "T003", feita: true, paralela: true, historia: "US1" })
  })

  it("lê o tasks.md real da feature 001 com 125 tarefas", () => {
    const { fases } = lerTarefas(ler("specs/001-fundacao-cadastros/tasks.md"))
    expect(fases.flatMap((f) => f.tarefas)).toHaveLength(125)
    expect(fases.map((f) => f.numero)).toEqual(Array.from({ length: 15 }, (_, i) => i + 1))
  })

  it("lê o briefing das features e as dependências", () => {
    const b = lerFeatureBriefing(ler("docs/briefing/features/003-registro-de-ponto.md"))
    expect(b).toMatchObject({ numero: "003", titulo: "Registro de ponto e comprovante", pendencias: ["RH-17", "RH-31", "RH-37", "RH-38"] })
    expect(lerDependencias(ler("docs/briefing/README.md"))).toMatchObject({ "001": [], "003": ["001", "002"], "009": ["003", "005", "007"] })
  })

  it("lê as 38 pendências reais", () => {
    const lista = lerPendencias(ler("docs/briefing/pendencias.md"))
    expect(lista).toHaveLength(38)
    expect(lista[0]).toMatchObject({ codigo: "RH-01", grupo: "Empresa e unidades (RH)", prazo: "Antes do desenvolvimento" })
  })

  it("grava a resposta na linha certa, escapando | e quebras de linha, sem mexer no resto", () => {
    const md = `## Grupo

| Código | Pergunta | Prazo | Resposta |
|---|---|---|---|
| RH-01 | Quantos? | Antes | |
| RH-02 | Quem? | Depois | |
`
    const novo = gravarResposta(md, "RH-02", "Ana | RH\nramal 12")
    expect(novo).toContain("| RH-02 | Quem? | Depois | Ana \\| RH<br>ramal 12 |")
    expect(novo).toContain("| RH-01 | Quantos? | Antes | |")
    expect(lerPendencias(novo).find((p) => p.codigo === "RH-02")!.resposta).toBe("Ana | RH\nramal 12")
    expect(() => gravarResposta(md, "RH-99", "x")).toThrow("RH-99")
  })

  it("classifica os commits pelo prefixo e os arquivos por status", () => {
    const saida = [
      "@@aaa|aa1|2026-11-06T10:00:00-03:00|Vinicius|feat: cria tela",
      "A\tsrc/a.ts",
      "M\tsrc/b.ts",
      "",
      "@@bbb|bb1|2026-11-06T09:00:00-03:00|Vinicius|refactor: move pastas",
      "R100\tapps/web/x.ts\tfront/x.ts",
      "D\tpackage.json",
    ].join("\n")
    const [c1, c2] = lerGitLog(saida)
    expect(c1).toMatchObject({ curto: "aa1", tipo: "nova", prefixo: "feat" })
    expect(c1.arquivos.map((a) => a.status)).toEqual(["adicionado", "modificado"])
    expect(c2.tipo).toBe("atualizado")
    expect(c2.arquivos).toEqual([
      { status: "renomeado", anterior: "apps/web/x.ts", caminho: "front/x.ts" },
      { status: "apagado", caminho: "package.json" },
    ])
  })

  it("lê o glossário com o NSR e âncoras que batem com os links internos", () => {
    const termos = lerGlossario(ler("docs/briefing/glossario.md"))
    const nsr = termos.find((t) => t.id === "nsr")!
    expect(nsr.titulo).toBe("NSR")
    expect(nsr.resumo).toContain("Número Sequencial de Registro")
    const ids = new Set(termos.map((t) => t.id))
    for (const t of termos) for (const m of `${t.resumo} ${t.corpo}`.matchAll(/\]\(#([^)]+)\)/g)) expect(ids).toContain(m[1])
  })
})
