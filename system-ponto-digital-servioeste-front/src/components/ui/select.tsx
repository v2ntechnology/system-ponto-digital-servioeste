import { ChevronDown } from "lucide-react"
import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

/** Select nativo (acessível e bom no celular) com o visual do Input. */
export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        className={cn(
          "h-10 w-full appearance-none rounded-lg border bg-background pl-3 pr-9 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 aria-[invalid=true]:border-destructive",
          className,
        )}
        {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}
