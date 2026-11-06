import { Check, ChevronDown, Search } from "lucide-react"
import {
  Children, isValidElement, useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState,
  type ChangeEvent, type KeyboardEvent, type ReactElement, type ReactNode,
} from "react"
import { createPortal } from "react-dom"

import { cn } from "@/lib/utils"

/**
 * Lista de escolha no visual do sistema (substitui o <select> nativo, que mostra a lista do sistema operacional).
 * Mesma forma de usar do <select>: filhos <option value="…">Rótulo</option> e onChange(e) com e.target.value.
 * Extras: <option data-detalhe="…"> mostra uma segunda linha na opção; com mais de 8 opções aparece uma busca.
 * Acessível: botão com role="combobox" + lista role="listbox"; setas, Enter, Esc, Home/End e digitar a inicial.
 */

type Opcao = { value: string; label: string; detalhe?: string; disabled: boolean }

type Props = {
  id?: string
  value?: string
  onChange?: (e: ChangeEvent<HTMLSelectElement>) => void
  disabled?: boolean
  className?: string
  children?: ReactNode
  placeholder?: string
  "aria-invalid"?: boolean | "true" | "false"
  "aria-describedby"?: string
  "aria-label"?: string
}

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()

const textoDe = (n: ReactNode): string =>
  typeof n === "string" || typeof n === "number" ? String(n)
    : Array.isArray(n) ? n.map(textoDe).join("")
    : isValidElement<{ children?: ReactNode }>(n) ? textoDe(n.props.children) : ""

function lerOpcoes(children: ReactNode): Opcao[] {
  const lista: Opcao[] = []
  Children.forEach(children, (filho) => {
    if (!isValidElement(filho)) return
    const el = filho as ReactElement<{ value?: string | number; children?: ReactNode; disabled?: boolean; "data-detalhe"?: string }>
    if (el.type !== "option") {
      lista.push(...lerOpcoes(el.props.children))
      return
    }
    lista.push({
      value: String(el.props.value ?? textoDe(el.props.children)), label: textoDe(el.props.children),
      detalhe: el.props["data-detalhe"], disabled: !!el.props.disabled,
    })
  })
  return lista
}

type Posicao = { top?: number; bottom?: number; left: number; width: number; maxHeight: number }

function calcularPosicao(gatilho: HTMLElement): Posicao {
  const r = gatilho.getBoundingClientRect()
  const largura = Math.min(Math.max(r.width, 220), window.innerWidth - 16)
  const left = Math.max(8, Math.min(r.left, window.innerWidth - largura - 8))
  const abaixo = window.innerHeight - r.bottom - 8
  const acima = r.top - 8
  if (abaixo < 240 && acima > abaixo) return { bottom: window.innerHeight - r.top + 4, left, width: largura, maxHeight: Math.min(320, acima) }
  return { top: r.bottom + 4, left, width: largura, maxHeight: Math.min(320, abaixo) }
}

export function Select({ id, value = "", onChange, disabled, className, children, placeholder = "Selecione…", ...aria }: Props) {
  const opcoes = useMemo(() => lerOpcoes(children), [children])
  const [aberto, setAberto] = useState(false)
  const [ativo, setAtivo] = useState(0)
  const [busca, setBusca] = useState("")
  const [pos, setPos] = useState<Posicao | null>(null)
  const gatilho = useRef<HTMLButtonElement>(null)
  const painel = useRef<HTMLDivElement>(null)
  const campoBusca = useRef<HTMLInputElement>(null)
  const listaId = useId()
  const proprioId = useId()
  const botaoId = id ?? proprioId
  const comBusca = opcoes.length > 8
  const atual = opcoes.find((o) => o.value === value)

  const visiveis = useMemo(() => {
    const t = fold(busca.trim())
    return t ? opcoes.filter((o) => fold(`${o.label} ${o.detalhe ?? ""}`).includes(t)) : opcoes
  }, [opcoes, busca])

  const fechar = useCallback((focarGatilho = true) => {
    setAberto(false)
    setBusca("")
    if (focarGatilho) gatilho.current?.focus()
  }, [])

  const abrir = () => {
    if (disabled || !gatilho.current) return
    setPos(calcularPosicao(gatilho.current))
    const i = opcoes.findIndex((o) => o.value === value)
    setAtivo(i >= 0 ? i : opcoes.findIndex((o) => !o.disabled))
    setAberto(true)
  }

  const escolher = (o: Opcao | undefined) => {
    if (!o || o.disabled) return
    if (o.value !== value) {
      onChange?.({ target: { value: o.value }, currentTarget: { value: o.value } } as unknown as ChangeEvent<HTMLSelectElement>)
    }
    fechar()
  }

  // Foco na busca (ou na lista) ao abrir; reposiciona ao rolar a página ou redimensionar.
  useLayoutEffect(() => {
    if (!aberto) return
    if (comBusca) campoBusca.current?.focus()
    else painel.current?.focus()
  }, [aberto, comBusca])

  useEffect(() => {
    if (!aberto) return
    const reposicionar = () => gatilho.current && setPos(calcularPosicao(gatilho.current))
    const foraDaLista = (e: MouseEvent) => {
      const alvo = e.target as Node
      if (!painel.current?.contains(alvo) && !gatilho.current?.contains(alvo)) fechar(false)
    }
    window.addEventListener("resize", reposicionar)
    window.addEventListener("scroll", reposicionar, true)
    document.addEventListener("mousedown", foraDaLista)
    return () => {
      window.removeEventListener("resize", reposicionar)
      window.removeEventListener("scroll", reposicionar, true)
      document.removeEventListener("mousedown", foraDaLista)
    }
  }, [aberto, fechar])

  // Mantém a opção ativa visível ao navegar pelo teclado.
  useEffect(() => {
    if (!aberto) return
    document.getElementById(`${listaId}-${ativo}`)?.scrollIntoView?.({ block: "nearest" })
  }, [aberto, ativo, listaId])

  const mover = (de: number, passo: 1 | -1) => {
    for (let i = de + passo; i >= 0 && i < visiveis.length; i += passo) if (!visiveis[i].disabled) return i
    return de
  }

  const teclaNaLista = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setAtivo((i) => mover(i, 1)) }
    else if (e.key === "ArrowUp") { e.preventDefault(); setAtivo((i) => mover(i, -1)) }
    else if (e.key === "Home") { e.preventDefault(); setAtivo(mover(-1, 1)) }
    else if (e.key === "End") { e.preventDefault(); setAtivo(mover(visiveis.length, -1)) }
    else if (e.key === "Enter") { e.preventDefault(); escolher(visiveis[ativo]) }
    else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); fechar() } // não fecha o diálogo junto
    else if (e.key === "Tab") fechar(false)
    else if (!comBusca && e.key.length === 1) {
      const letra = fold(e.key)
      const proximo = visiveis.findIndex((o, i) => i > ativo && !o.disabled && fold(o.label).startsWith(letra))
      const primeiro = visiveis.findIndex((o) => !o.disabled && fold(o.label).startsWith(letra))
      if (proximo >= 0 || primeiro >= 0) setAtivo(proximo >= 0 ? proximo : primeiro)
    }
  }

  const teclaNoGatilho = (e: KeyboardEvent) => {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
      e.preventDefault()
      abrir()
    }
  }

  return (
    <>
      <button ref={gatilho} id={botaoId} type="button" role="combobox" disabled={disabled}
        aria-haspopup="listbox" aria-expanded={aberto} aria-controls={aberto ? listaId : undefined}
        aria-activedescendant={aberto ? `${listaId}-${ativo}` : undefined} {...aria}
        onClick={() => (aberto ? fechar() : abrir())} onKeyDown={teclaNoGatilho}
        className={cn(
          "flex h-10 w-full items-center gap-2 rounded-lg border bg-background pl-3 pr-2 text-left text-sm outline-none transition-colors",
          "focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive",
          aberto && "ring-2 ring-ring",
          className,
        )}>
        <span className="min-w-0 flex-1 truncate">
          {atual ? <>
            {atual.label}
            {atual.detalhe && <span className="text-muted-foreground"> · {atual.detalhe}</span>}
          </> : <span className="text-muted-foreground">{placeholder}</span>}
        </span>
        <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", aberto && "rotate-180")} />
      </button>

      {aberto && pos && createPortal(
        <div ref={painel} tabIndex={-1} onKeyDown={teclaNaLista}
          style={{ top: pos.top, bottom: pos.bottom, left: pos.left, width: pos.width }}
          className="fixed z-[70] flex flex-col overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-xl outline-none">
          {comBusca && (
            <div className="relative border-b p-1.5">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input ref={campoBusca} value={busca} aria-label="Buscar opção" placeholder="Buscar…" autoComplete="off"
                aria-controls={listaId} aria-activedescendant={`${listaId}-${ativo}`}
                onChange={(e) => { setBusca(e.target.value); setAtivo(0) }}
                className="h-9 w-full rounded-lg bg-muted/50 pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </div>
          )}
          <ul id={listaId} role="listbox" aria-labelledby={botaoId}
            className="no-scrollbar overflow-y-auto p-1" style={{ maxHeight: pos.maxHeight - (comBusca ? 52 : 0) }}>
            {visiveis.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted-foreground">Nenhuma opção encontrada.</li>}
            {visiveis.map((o, i) => {
              const selecionada = o.value === value
              return (
                <li key={`${o.value}-${i}`} id={`${listaId}-${i}`} role="option" aria-selected={selecionada} aria-disabled={o.disabled || undefined}
                  onMouseDown={(e) => e.preventDefault()} onClick={() => escolher(o)} onMouseMove={() => !o.disabled && setAtivo(i)}
                  className={cn("flex cursor-pointer items-start gap-2 rounded-lg px-2.5 py-2 text-sm",
                    i === ativo && "bg-accent", selecionada && "font-medium text-brand", o.disabled && "cursor-not-allowed opacity-50")}>
                  <Check className={cn("mt-0.5 size-4 shrink-0", selecionada ? "text-brand" : "invisible")} />
                  <span className="min-w-0">
                    <span className="block break-words">{o.label}</span>
                    {o.detalhe && <span className="block text-xs font-normal text-muted-foreground tabular-nums">{o.detalhe}</span>}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>,
        document.body,
      )}
    </>
  )
}
