import type { Escopo, Perfil } from "@/contracts"

import { Checkbox } from "@/components/ui/checkbox"
import { useSetores, useUnidades } from "@/features/estrutura/api"

const alternar = (lista: string[], id: string, marcar: boolean) => (marcar ? [...new Set([...lista, id])] : lista.filter((x) => x !== id))

/**
 * Escopo do usuário (FR-012 e FR-012a):
 * - Administrador: toda a empresa, sem escolha.
 * - RH: "todas as unidades" ou unidades específicas.
 * - Gestor: unidades inteiras e/ou setores (nunca "todas as unidades").
 */
export function EscopoCampos({ perfil, valor, onChange, erro }: {
  perfil: Perfil
  valor: Escopo
  onChange: (e: Escopo) => void
  erro?: string
}) {
  const { data: unidades = [] } = useUnidades()
  const { data: setores = [] } = useSetores()

  if (perfil === "administrador") {
    return <p className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">O Administrador vê toda a empresa.</p>
  }

  return (
    <fieldset className="space-y-3" aria-describedby={erro ? "escopo-erro" : undefined}>
      <legend className="text-sm font-medium">{perfil === "rh" ? "Unidades que este RH atende" : "Equipe deste gestor"}</legend>
      {perfil === "rh" && (
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={valor.todas_unidades}
            onChange={(e) => onChange({ todas_unidades: e.target.checked, unidade_ids: [], setor_ids: [] })} />
          Todas as unidades
        </label>
      )}
      {!valor.todas_unidades && (
        <ul className="space-y-2 rounded-lg border p-3">
          {unidades.filter((u) => u.ativo).map((u) => {
            const unidadeInteira = valor.unidade_ids.includes(u.id)
            return (
              <li key={u.id}>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <Checkbox checked={unidadeInteira}
                    onChange={(e) => onChange({
                      ...valor,
                      unidade_ids: alternar(valor.unidade_ids, u.id, e.target.checked),
                      // Unidade inteira já inclui os setores dela.
                      setor_ids: e.target.checked ? valor.setor_ids.filter((id) => setores.find((s) => s.id === id)?.unidade_id !== u.id) : valor.setor_ids,
                    })} />
                  {u.nome}{perfil === "gestor" && <span className="font-normal text-muted-foreground">(unidade inteira)</span>}
                </label>
                {perfil === "gestor" && !unidadeInteira && (
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1.5 pl-6">
                    {setores.filter((s) => s.unidade_id === u.id && s.ativo).map((s) => (
                      <label key={s.id} className="flex items-center gap-2 text-sm">
                        <Checkbox checked={valor.setor_ids.includes(s.id)}
                          onChange={(e) => onChange({ ...valor, setor_ids: alternar(valor.setor_ids, s.id, e.target.checked) })} />
                        {s.nome}
                      </label>
                    ))}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
      {erro && <p id="escopo-erro" role="alert" className="text-xs text-destructive">{erro}</p>}
    </fieldset>
  )
}
