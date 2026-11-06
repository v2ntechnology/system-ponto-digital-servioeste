export function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-xl border bg-background">
        <img src="/favicon.svg" alt="" className="size-5" />
      </span>
      <span className="text-[15px] font-medium tracking-tight">
        Servioeste <span className="text-muted-foreground">Ponto</span>
      </span>
    </div>
  )
}
