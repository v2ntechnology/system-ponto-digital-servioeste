import { Button } from "@/components/ui/button"

/** Botões padrão do rodapé de um diálogo com formulário (o submit aponta para o form pelo id). */
export function RodapeForm({ formId, pendente, onCancelar, rotulo = "Salvar" }: {
  formId: string
  pendente?: boolean
  onCancelar: () => void
  rotulo?: string
}) {
  return (
    <>
      <Button type="button" variant="outline" onClick={onCancelar}>Cancelar</Button>
      <Button type="submit" form={formId} disabled={pendente}>{pendente ? "Salvando…" : rotulo}</Button>
    </>
  )
}
