import { cn } from "@/lib/utils"

import { pct } from "./progresso"

export function Barra({ feitas, total, className }: { feitas: number; total: number; className?: string }) {
  const p = pct(feitas, total)
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={p} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${p}%` }} />
      </div>
      <span className="w-20 text-right text-xs tabular-nums text-muted-foreground">{feitas}/{total} · {p}%</span>
    </div>
  )
}
