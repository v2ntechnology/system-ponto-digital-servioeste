import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

/** Caixa de seleção nativa com a cor da marca. */
export function Checkbox({ className, ...props }: Omit<ComponentProps<"input">, "type">) {
  return (
    <input type="checkbox"
      className={cn("size-4 shrink-0 rounded border accent-[var(--brand)] focus-visible:ring-2 focus-visible:ring-ring", className)}
      {...props} />
  )
}
