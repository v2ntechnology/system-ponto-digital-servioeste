// Plugin do Vite da área de desenvolvimento (/dev). Só existe no servidor de desenvolvimento (`apply: "serve"`):
// nada disto entra no build de produção. Lê os arquivos do projeto e o git log a cada pedido, então o que muda
// no disco aparece na tela ao recarregar.
import { execFileSync } from "node:child_process"
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import type { IncomingMessage, ServerResponse } from "node:http"
import path from "node:path"

import type { Plugin } from "vite"

import type { Plano } from "../src/dev/tipos"

import {
  FORMATO_GIT, gravarResposta, lerDependencias, lerFeatureBriefing, lerGitLog, lerGlossario, lerPendencias, montarFeature,
} from "./leitores"

function json(res: ServerResponse, status: number, corpo: unknown) {
  res.statusCode = status
  res.setHeader("Content-Type", "application/json; charset=utf-8")
  res.end(JSON.stringify(corpo))
}

function lerCorpo(req: IncomingMessage): Promise<string> {
  return new Promise((ok, falha) => {
    let dados = ""
    req.on("data", (c) => (dados += c))
    req.on("end", () => ok(dados))
    req.on("error", falha)
  })
}

export function areaDev(raiz: string): Plugin {
  const briefing = path.join(raiz, "docs/briefing")
  const specs = path.join(raiz, "specs")
  const arquivoPendencias = path.join(briefing, "pendencias.md")
  const ler = (p: string) => readFileSync(p, "utf8")

  function featuresDoBriefing() {
    const pasta = path.join(briefing, "features")
    return readdirSync(pasta).filter((f) => /^\d{3}-.+\.md$/.test(f)).sort().map((f) => lerFeatureBriefing(ler(path.join(pasta, f))))
  }

  function plano(): Plano {
    const deps = lerDependencias(ler(path.join(briefing, "README.md")))
    const pastasSpec = existsSync(specs) ? readdirSync(specs).filter((d) => /^\d{3}-/.test(d)) : []
    return {
      features: featuresDoBriefing().map((b) => {
        const pasta = pastasSpec.find((d) => d.startsWith(`${b.numero}-`))
        const base = pasta ? path.join(specs, pasta) : null
        return montarFeature(b, deps[b.numero] ?? [], base ? {
          pasta: `specs/${pasta}`,
          temSpec: existsSync(path.join(base, "spec.md")),
          temPlano: existsSync(path.join(base, "plan.md")),
          tarefasMd: existsSync(path.join(base, "tasks.md")) ? ler(path.join(base, "tasks.md")) : null,
        } : null)
      }),
    }
  }

  function pendencias() {
    const porCodigo: Record<string, string[]> = {}
    for (const f of featuresDoBriefing()) for (const c of f.pendencias) (porCodigo[c] ??= []).push(`${f.numero} ${f.titulo}`)
    return lerPendencias(ler(arquivoPendencias), porCodigo)
  }

  function historico() {
    const saida = execFileSync("git", ["log", "--name-status", "--date=iso-strict", `--pretty=format:${FORMATO_GIT}`, "-n", "300"], {
      cwd: raiz, encoding: "utf8", maxBuffer: 20 * 1024 * 1024,
    })
    return lerGitLog(saida)
  }

  return {
    name: "area-dev",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/__dev", async (req, res) => {
        try {
          const rota = (req.url ?? "/").split("?")[0]
          if (req.method === "GET" && rota === "/plano") return json(res, 200, plano())
          if (req.method === "GET" && rota === "/pendencias") return json(res, 200, pendencias())
          if (req.method === "GET" && rota === "/historico") return json(res, 200, historico())
          if (req.method === "GET" && rota === "/glossario") return json(res, 200, lerGlossario(ler(path.join(briefing, "glossario.md"))))
          if (req.method === "POST" && rota === "/pendencias") {
            const { codigo, resposta } = JSON.parse(await lerCorpo(req)) as { codigo: string; resposta: string }
            if (!/^RH-\d{2}$/.test(codigo ?? "") || typeof resposta !== "string") return json(res, 400, { detail: "Dados inválidos." })
            writeFileSync(arquivoPendencias, gravarResposta(ler(arquivoPendencias), codigo, resposta))
            return json(res, 200, pendencias().find((p) => p.codigo === codigo))
          }
          return json(res, 404, { detail: "Rota da área de desenvolvimento não encontrada." })
        } catch (e) {
          return json(res, 500, { detail: e instanceof Error ? e.message : "Erro na área de desenvolvimento." })
        }
      })
    },
  }
}
