import { useEffect, useState } from "react"

/** Devolve o valor só depois de `ms` sem mudanças (busca enquanto digita). */
export function useDebounce<T>(valor: T, ms = 300) {
  const [atrasado, setAtrasado] = useState(valor)
  useEffect(() => {
    const id = setTimeout(() => setAtrasado(valor), ms)
    return () => clearTimeout(id)
  }, [valor, ms])
  return atrasado
}
