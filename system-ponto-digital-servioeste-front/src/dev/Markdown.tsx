import { Fragment, type ReactNode } from "react"

// Renderizador mínimo de markdown para o glossário (parágrafos, listas, tabelas, **negrito**, `código` e links).
// Gera elementos React: nada de innerHTML. Só para conteúdo do próprio projeto, na área de desenvolvimento.

function inline(texto: string, chave = ""): ReactNode[] {
  const partes: ReactNode[] = []
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g
  let ultimo = 0
  let i = 0
  for (const m of texto.matchAll(re)) {
    if (m.index! > ultimo) partes.push(texto.slice(ultimo, m.index))
    const t = m[0]
    const k = `${chave}-${i++}`
    if (t.startsWith("**")) partes.push(<strong key={k}>{t.slice(2, -2)}</strong>)
    else if (t.startsWith("`")) partes.push(<code key={k} className="rounded bg-muted px-1 py-0.5 text-[0.85em]">{t.slice(1, -1)}</code>)
    else {
      const [, rotulo, href] = /\[([^\]]+)\]\(([^)]+)\)/.exec(t)!
      partes.push(<a key={k} href={href} className="text-brand underline-offset-4 hover:underline">{rotulo}</a>)
    }
    ultimo = m.index! + t.length
  }
  if (ultimo < texto.length) partes.push(texto.slice(ultimo))
  return partes
}

const celulas = (l: string) => l.trim().slice(1, -1).split("|").map((c) => c.trim())

export function Markdown({ texto }: { texto: string }) {
  const blocos = texto.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean)
  return (
    <div className="space-y-3 text-sm leading-relaxed">
      {blocos.map((b, i) => {
        const linhas = b.split("\n")
        if (linhas.every((l) => l.trim().startsWith("|"))) {
          const [cab, , ...corpo] = linhas
          return (
            <div key={i} className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead><tr className="border-b">{celulas(cab).map((c, j) => <th key={j} className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">{inline(c)}</th>)}</tr></thead>
                <tbody>{corpo.map((l, j) => (
                  <tr key={j} className="border-b last:border-0">{celulas(l).map((c, k) => <td key={k} className="px-3 py-2">{inline(c, `${j}${k}`)}</td>)}</tr>
                ))}</tbody>
              </table>
            </div>
          )
        }
        if (linhas.every((l) => /^\s*- /.test(l) || /^\s{2,}\S/.test(l))) {
          const itens: string[] = []
          for (const l of linhas) {
            if (/^\s*- /.test(l)) itens.push(l.replace(/^\s*- /, ""))
            else itens[itens.length - 1] += ` ${l.trim()}`
          }
          return <ul key={i} className="list-disc space-y-1 pl-5">{itens.map((it, j) => <li key={j}>{inline(it, String(j))}</li>)}</ul>
        }
        return <p key={i}>{linhas.map((l, j) => <Fragment key={j}>{j > 0 && " "}{inline(l, String(j))}</Fragment>)}</p>
      })}
    </div>
  )
}
