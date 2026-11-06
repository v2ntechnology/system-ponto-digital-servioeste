import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { describe, expect, it, vi } from "vitest"

import { Dialog } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"

function Exemplo({ opcoes = ["Administrativo", "Operacional", "Coleta"], onChange }: { opcoes?: string[]; onChange?: (v: string) => void }) {
  const [v, setV] = useState(opcoes[0])
  return (
    <>
      <Label htmlFor="s">Setor</Label>
      <Select id="s" value={v} onChange={(e) => { setV(e.target.value); onChange?.(e.target.value) }}>
        {opcoes.map((o) => <option key={o} value={o} data-detalhe={o === "Coleta" ? "Unidade Teste" : undefined}>{o}</option>)}
      </Select>
    </>
  )
}

describe("lista de escolha (Select)", () => {
  it("abre pelo rótulo, mostra a escolhida marcada e troca com o clique", async () => {
    const user = userEvent.setup()
    const mudou = vi.fn()
    render(<Exemplo onChange={mudou} />)
    const lista = screen.getByLabelText("Setor")
    expect(lista).toHaveTextContent("Administrativo")
    await user.click(lista)
    expect(screen.getByRole("option", { name: "Administrativo" })).toHaveAttribute("aria-selected", "true")
    expect(screen.getByRole("option", { name: /Coleta/ })).toHaveTextContent("Unidade Teste") // segunda linha
    await user.click(screen.getByRole("option", { name: /Coleta/ }))
    expect(mudou).toHaveBeenCalledWith("Coleta")
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
    expect(lista).toHaveTextContent("Coleta · Unidade Teste")
  })

  it("funciona pelo teclado: setas, Enter e Esc", async () => {
    const user = userEvent.setup()
    render(<Exemplo />)
    const lista = screen.getByLabelText("Setor")
    lista.focus()
    await user.keyboard("{ArrowDown}")
    expect(screen.getByRole("listbox")).toBeInTheDocument()
    await user.keyboard("{ArrowDown}{Enter}")
    expect(lista).toHaveTextContent("Operacional")
    await user.keyboard("{ArrowDown}{Escape}")
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
    expect(lista).toHaveFocus()
  })

  it("com mais de 8 opções mostra a busca", async () => {
    const user = userEvent.setup()
    const muitas = Array.from({ length: 12 }, (_, i) => `Unidade ${String(i + 1).padStart(2, "0")}`)
    render(<Exemplo opcoes={muitas} />)
    await user.click(screen.getByLabelText("Setor"))
    await user.type(screen.getByLabelText("Buscar opção"), "11")
    expect(within(screen.getByRole("listbox")).getAllByRole("option")).toHaveLength(1)
    await user.keyboard("{Enter}")
    expect(screen.getByLabelText("Setor")).toHaveTextContent("Unidade 11")
  })

  it("Esc dentro de um diálogo fecha só a lista, não o diálogo", async () => {
    const user = userEvent.setup()
    const fecharDialogo = vi.fn()
    render(<Dialog open onClose={fecharDialogo} title="Teste"><Exemplo /></Dialog>)
    await user.click(screen.getByLabelText("Setor"))
    await user.keyboard("{Escape}")
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
    expect(fecharDialogo).not.toHaveBeenCalled()
  })
})
