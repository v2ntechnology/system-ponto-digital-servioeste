import { Button } from "@/components/ui/button"
import { Dialog } from "@/components/ui/dialog"

/** Confirmação simples para ações como desativar. */
export function Confirmar({ titulo, descricao, rotulo, perigo, pendente, erro, onConfirmar, onFechar }: {
  titulo: string
  descricao: string
  rotulo: string
  perigo?: boolean
  pendente?: boolean
  erro?: string
  onConfirmar: () => void
  onFechar: () => void
}) {
  return (
    <Dialog open onClose={onFechar} title={titulo}
      footer={<>
        <Button variant="outline" onClick={onFechar}>Cancelar</Button>
        <Button variant={perigo ? "destructive" : "default"} onClick={onConfirmar} disabled={pendente}>
          {pendente ? "Salvando…" : rotulo}
        </Button>
      </>}>
      <p className="text-sm text-muted-foreground">{descricao}</p>
      {erro && <p role="alert" className="mt-3 text-sm text-destructive">{erro}</p>}
    </Dialog>
  )
}
