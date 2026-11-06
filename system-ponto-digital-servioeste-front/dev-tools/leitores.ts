// Leitores dos arquivos do projeto para a área de desenvolvimento. Funções puras (texto → dados), testadas em
// tests/dev-leitores.test.ts. O plugin (dev-tools/plugin.ts) cuida de ler os arquivos do disco.
import type {
  Commit, Fase, FeaturePlano, Pendencia, StatusArquivo, Tarefa, Termo, TipoCommit,
} from "../src/dev/tipos"

// ------------------------------------------------------------------------------------------------ tasks.md

const RE_TAREFA = /^- \[( |x|X)\] (T\d{3})((?: \[P\])?)((?: \[US\d+\])?) (.*)$/
const RE_FASE = /^## Fase (\d+): (.+)$/
const RE_PARTE = /^# (PARTE [^\n]+)$/

export function lerTarefas(md: string): { fases: Fase[]; historias: Record<string, string> } {
  const fases: Fase[] = []
  let parte: string | null = null
  let atual: Fase | null = null
  for (const linha of md.split("\n")) {
    const p = RE_PARTE.exec(linha)
    if (p) {
      parte = p[1].replace(/^PARTE\s+/, "")
      continue
    }
    const f = RE_FASE.exec(linha)
    if (f) {
      atual = { numero: Number(f[1]), titulo: f[2].trim(), parte, pontoDeControle: null, tarefas: [] }
      fases.push(atual)
      continue
    }
    if (!atual) continue
    const t = RE_TAREFA.exec(linha)
    if (t) {
      const tarefa: Tarefa = {
        id: t[2], feita: t[1] !== " ", paralela: !!t[3], historia: t[4] ? t[4].trim().slice(1, -1) : null,
        descricao: t[5].trim(), fase: atual.numero,
      }
      atual.tarefas.push(tarefa)
      continue
    }
    const pc = /^\*\*Ponto de controle\*\*: (.+)$/.exec(linha)
    if (pc) atual.pontoDeControle = pc[1].trim()
  }
  const historias: Record<string, string> = {}
  for (const m of md.matchAll(/\*\*\[(US\d+)\]\*\* ([^·\n]+)/g)) historias[m[1]] = m[2].trim()
  return { fases, historias }
}

// ------------------------------------------------------------------------------------------------ briefing

/** Lê docs/briefing/features/NNN-*.md: título, objetivo e códigos de pendência citados. */
export function lerFeatureBriefing(md: string) {
  const cabecalho = /^# (\d{3}): (.+)$/m.exec(md)
  const objetivo = /## Objetivo\s+([\s\S]*?)(?:\n## |\n*$)/.exec(md)?.[1].trim() ?? ""
  const secaoPend = /## Pendências\s+([\s\S]*?)(?:\n## |\n*$)/.exec(md)?.[1] ?? ""
  return {
    numero: cabecalho?.[1] ?? "",
    titulo: cabecalho?.[2].trim() ?? "",
    objetivo: objetivo.replace(/\s+/g, " "),
    pendencias: [...secaoPend.matchAll(/RH-\d{2}/g)].map((m) => m[0]),
  }
}

/** Lê a tabela "Ordem das features" do README do briefing: número → dependências. */
export function lerDependencias(readme: string): Record<string, string[]> {
  const deps: Record<string, string[]> = {}
  for (const m of readme.matchAll(/^\| (\d{3}) \| [^|]+ \| ([^|]+) \|$/gm)) {
    deps[m[1]] = m[2].trim() === "Nenhuma" ? [] : m[2].split(",").map((s) => s.trim())
  }
  return deps
}

export function montarFeature(
  briefing: ReturnType<typeof lerFeatureBriefing>,
  dependeDe: string[],
  spec: { pasta: string; temSpec: boolean; temPlano: boolean; tarefasMd: string | null } | null,
): FeaturePlano {
  const tarefas = spec?.tarefasMd ? lerTarefas(spec.tarefasMd) : { fases: [], historias: {} }
  const etapa = !spec?.temSpec ? "nao_iniciada" : spec.tarefasMd ? "com_tarefas" : spec.temPlano ? "planejada" : "especificada"
  return {
    numero: briefing.numero, titulo: briefing.titulo, objetivo: briefing.objetivo, dependeDe, pendencias: briefing.pendencias,
    pastaSpec: spec?.pasta ?? null, etapa, historias: tarefas.historias, fases: tarefas.fases,
  }
}

// ------------------------------------------------------------------------------------------------ pendencias.md

const RE_LINHA_PEND = /^\| (RH-\d{2}) \|.*\|$/

const desescapar = (s: string) => s.replace(/<br>/g, "\n").replace(/\\\|/g, "|").trim()
const escapar = (s: string) => s.trim().replace(/\|/g, "\\|").replace(/\r?\n/g, "<br>")

/** Divide uma linha de tabela respeitando "\|" dentro das células. */
function celulas(linha: string) {
  return linha.slice(1, -1).split(/(?<!\\)\|/).map((c) => c.trim())
}

export function lerPendencias(md: string, featuresPorCodigo: Record<string, string[]> = {}): Pendencia[] {
  const lista: Pendencia[] = []
  let grupo = ""
  for (const linha of md.split("\n")) {
    const g = /^## (.+)$/.exec(linha)
    if (g) {
      grupo = g[1].trim()
      continue
    }
    if (!RE_LINHA_PEND.test(linha)) continue
    const [codigo, pergunta, prazo, resposta] = celulas(linha)
    lista.push({
      codigo, pergunta: desescapar(pergunta), prazo: desescapar(prazo), resposta: desescapar(resposta ?? ""), grupo,
      features: featuresPorCodigo[codigo] ?? [],
    })
  }
  return lista
}

/** Devolve o pendencias.md com a resposta de um código trocada. Lança erro se o código não existir. */
export function gravarResposta(md: string, codigo: string, resposta: string) {
  let achou = false
  const saida = md.split("\n").map((linha) => {
    if (!linha.startsWith(`| ${codigo} |`) || !RE_LINHA_PEND.test(linha)) return linha
    achou = true
    const [c, pergunta, prazo] = celulas(linha)
    return `| ${c} | ${pergunta} | ${prazo} | ${escapar(resposta)} |`
  })
  if (!achou) throw new Error(`Código ${codigo} não encontrado em pendencias.md`)
  return saida.join("\n")
}

// ------------------------------------------------------------------------------------------------ git log

/** Formato esperado: `git log --name-status --date=iso-strict --pretty=format:@@%H|%h|%ad|%an|%s` */
export const FORMATO_GIT = "@@%H|%h|%ad|%an|%s"

const TIPO_POR_PREFIXO: Record<string, TipoCommit> = {
  feat: "nova", fix: "atualizado", refactor: "atualizado", perf: "atualizado", style: "atualizado",
  docs: "documentacao", chore: "manutencao", build: "manutencao", ci: "manutencao", test: "manutencao",
}

const STATUS: Record<string, StatusArquivo> = { A: "adicionado", M: "modificado", D: "apagado", R: "renomeado" }

export function lerGitLog(saida: string): Commit[] {
  const commits: Commit[] = []
  for (const bloco of saida.split(/^@@/m).filter((b) => b.trim())) {
    const [cabecalho, ...linhas] = bloco.split("\n")
    const [hash, curto, data, autor, ...resto] = cabecalho.split("|")
    const mensagem = resto.join("|").trim()
    const prefixo = /^([a-z]+)(?:\([^)]*\))?!?:/.exec(mensagem)?.[1] ?? null
    const arquivos: Commit["arquivos"] = []
    for (const l of linhas) {
      const partes = l.split("\t")
      if (partes.length < 2) continue
      const letra = partes[0][0]
      const status = STATUS[letra] ?? "modificado"
      if (letra === "R") arquivos.push({ status, anterior: partes[1], caminho: partes[2] })
      else arquivos.push({ status, caminho: partes[1] })
    }
    commits.push({
      hash, curto, data, autor, mensagem, prefixo, tipo: (prefixo && TIPO_POR_PREFIXO[prefixo]) || "outro", arquivos,
    })
  }
  return commits
}

// ------------------------------------------------------------------------------------------------ glossario.md

const slug = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
  .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")

/** Cada "## Termo" vira um termo; a primeira linha em negrito é o resumo, o resto é o corpo (markdown). */
export function lerGlossario(md: string): Termo[] {
  const partes = md.split(/^## /m).slice(1)
  return partes.map((p) => {
    const [titulo, ...linhas] = p.split("\n")
    const texto = linhas.join("\n").trim()
    const [primeiro, ...resto] = texto.split(/\n\s*\n/)
    return { id: slug(titulo), titulo: titulo.trim(), resumo: primeiro.replace(/\s+/g, " ").trim(), corpo: resto.join("\n\n").trim() }
  })
}
