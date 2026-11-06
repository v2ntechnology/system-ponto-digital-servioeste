import { Navigate, Route, Routes } from "react-router-dom"

import { BoardPage } from "./BoardPage"
import { ConceitosPage } from "./ConceitosPage"
import { DuvidasPage } from "./DuvidasPage"
import { HistoricoPage } from "./HistoricoPage"
import { PlanoPage } from "./PlanoPage"

/** Área de desenvolvimento (/dev). Carregada só em desenvolvimento: ver rotas.tsx. */
export function DevApp() {
  return (
    <Routes>
      <Route index element={<Navigate to="plano" replace />} />
      <Route path="plano" element={<PlanoPage />} />
      <Route path="board" element={<BoardPage />} />
      <Route path="historico" element={<HistoricoPage />} />
      <Route path="duvidas" element={<DuvidasPage />} />
      <Route path="conceitos" element={<ConceitosPage />} />
      <Route path="*" element={<Navigate to="plano" replace />} />
    </Routes>
  )
}
