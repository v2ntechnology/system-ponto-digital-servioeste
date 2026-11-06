import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

/** Tabela no estilo shadcn: rola na horizontal dentro do cartão em telas estreitas. */
export function Table({ className, ...props }: ComponentProps<"table">) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  )
}

export const TableHeader = ({ className, ...props }: ComponentProps<"thead">) => (
  <thead className={cn("[&_tr]:border-b", className)} {...props} />
)

export const TableBody = ({ className, ...props }: ComponentProps<"tbody">) => (
  <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />
)

export const TableRow = ({ className, ...props }: ComponentProps<"tr">) => (
  <tr className={cn("border-b transition-colors hover:bg-muted/50", className)} {...props} />
)

export const TableHead = ({ className, ...props }: ComponentProps<"th">) => (
  <th className={cn("h-10 whitespace-nowrap px-3 text-left align-middle text-xs font-medium text-muted-foreground", className)}
    {...props} />
)

export const TableCell = ({ className, ...props }: ComponentProps<"td">) => (
  <td className={cn("px-3 py-2.5 align-middle", className)} {...props} />
)
