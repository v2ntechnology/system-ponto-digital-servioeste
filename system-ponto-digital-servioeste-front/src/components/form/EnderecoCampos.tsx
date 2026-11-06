import type { Endereco } from "@/contracts"

import { Campo } from "@/components/form/Campo"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { somenteDigitos } from "@/lib/cpf"
import { formatarCep, UFS } from "@/lib/endereco"

/** Campos de endereço (logradouro, número, complemento, bairro, cidade, UF e CEP). */
export function EnderecoCampos({ valor, onChange, erroCep }: {
  valor: Endereco
  onChange: (e: Endereco) => void
  erroCep?: string
}) {
  const set = (campo: keyof Endereco) => (v: string) => onChange({ ...valor, [campo]: v })
  return (
    <fieldset className="grid grid-cols-6 gap-3">
      <legend className="col-span-6 mb-1 text-sm font-medium">Endereço</legend>
      <Campo rotulo="Logradouro" className="col-span-6 sm:col-span-4">
        {(p) => <Input {...p} required value={valor.logradouro} onChange={(e) => set("logradouro")(e.target.value)} />}
      </Campo>
      <Campo rotulo="Número" className="col-span-2">
        {(p) => <Input {...p} required value={valor.numero} onChange={(e) => set("numero")(e.target.value)} />}
      </Campo>
      <Campo rotulo="Complemento" className="col-span-4 sm:col-span-3">
        {(p) => <Input {...p} value={valor.complemento ?? ""} onChange={(e) => onChange({ ...valor, complemento: e.target.value || null })} />}
      </Campo>
      <Campo rotulo="Bairro" className="col-span-6 sm:col-span-3">
        {(p) => <Input {...p} required value={valor.bairro} onChange={(e) => set("bairro")(e.target.value)} />}
      </Campo>
      <Campo rotulo="Cidade" className="col-span-6 sm:col-span-3">
        {(p) => <Input {...p} required value={valor.cidade} onChange={(e) => set("cidade")(e.target.value)} />}
      </Campo>
      <Campo rotulo="UF" className="col-span-2 sm:col-span-1">
        {(p) => (
          <Select {...p} value={valor.uf} onChange={(e) => set("uf")(e.target.value)}>
            {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
          </Select>
        )}
      </Campo>
      <Campo rotulo="CEP" erro={erroCep} className="col-span-4 sm:col-span-2">
        {(p) => (
          <Input {...p} required inputMode="numeric" placeholder="00000-000" value={formatarCep(valor.cep)}
            onChange={(e) => set("cep")(somenteDigitos(e.target.value).slice(0, 8))} />
        )}
      </Campo>
    </fieldset>
  )
}
