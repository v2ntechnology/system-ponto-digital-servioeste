import { initials } from "@/lib/format"
import { cn } from "@/lib/utils"

/** Foto de perfil num círculo. Sem foto: as iniciais num círculo neutro com borda (como no Radar). */
export function Avatar({ name, src, className }: { name: string; src?: string | null; className?: string }) {
  if (src) {
    return <img src={src} alt="" aria-hidden className={cn("size-9 shrink-0 rounded-full object-cover", className)} />
  }
  return (
    <span aria-hidden
      className={cn("grid size-9 shrink-0 place-items-center rounded-full border border-brand/30 bg-brand/10 text-xs font-medium text-brand", className)}>
      {initials(name)}
    </span>
  )
}
