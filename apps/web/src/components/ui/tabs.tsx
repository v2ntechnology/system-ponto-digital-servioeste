import { cn } from "@/lib/utils"

type Aba<T extends string> = { value: T; label: string; count?: number }

/** Abas em pílula, no mesmo estilo da navegação da barra do topo. */
export function Tabs<T extends string>({ abas, value, onChange, className }: {
  abas: Aba<T>[]
  value: T
  onChange: (v: T) => void
  className?: string
}) {
  return (
    <div role="tablist" className={cn("no-scrollbar inline-flex max-w-full gap-1 overflow-x-auto rounded-full bg-foreground/5 p-1 text-sm", className)}>
      {abas.map((a) => (
        <button key={a.value} type="button" role="tab" aria-selected={value === a.value} onClick={() => onChange(a.value)}
          className={cn("whitespace-nowrap rounded-full px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground",
            value === a.value && "bg-background font-medium text-foreground shadow-sm hover:text-foreground")}>
          {a.label}
          {a.count !== undefined && <span className="ml-1.5 text-xs text-muted-foreground tabular-nums">{a.count}</span>}
        </button>
      ))}
    </div>
  )
}
