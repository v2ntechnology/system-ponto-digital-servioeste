import { createBrowserRouter, RouterProvider } from "react-router-dom"

import { rotas } from "@/rotas"

const router = createBrowserRouter(rotas)

export function App() {
  return <RouterProvider router={router} />
}
