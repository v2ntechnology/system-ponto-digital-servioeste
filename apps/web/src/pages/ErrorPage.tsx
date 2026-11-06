import { useRouteError } from "react-router-dom"

import { Button } from "@/components/ui/button"

// Erro inesperado numa tela: mensagem amigável em vez da tela de erro padrão do React Router.
export function ErrorPage() {
  const error = useRouteError()
  console.error(error)
  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <div className="max-w-sm space-y-4 text-center">
        <img src="/favicon.svg" alt="" className="mx-auto size-8" />
        <h1 className="text-xl font-medium">Algo deu errado nesta tela</h1>
        <p className="text-sm text-muted-foreground">Recarregue a página. Se continuar, avise o administrador.</p>
        <Button onClick={() => window.location.reload()}>Recarregar</Button>
      </div>
    </div>
  )
}
