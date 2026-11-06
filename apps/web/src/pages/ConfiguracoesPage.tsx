import { KeyRound, Monitor, Moon, Palette, Settings, Sun } from "lucide-react"
import { useState, type FormEvent } from "react"

import { AppShell } from "@/components/layout/AppShell"
import { Cabecalho } from "@/components/layout/Cabecalho"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/toast"
import { useEu, useTrocarSenha } from "@/features/auth/useAuth"
import { useTheme } from "@/lib/theme"
import { cn } from "@/lib/utils"

const TEMAS = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Escuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Monitor },
] as const

function Aparencia() {
  const { theme, setTheme } = useTheme()
  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 font-medium"><Palette className="size-4 text-brand" /> Aparência</h2>
      <p className="text-sm text-muted-foreground">"Sistema" segue o tema do seu computador ou celular.</p>
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Tema">
        {TEMAS.map(({ value, label, icon: Icon }) => (
          <button key={value} type="button" role="radio" aria-checked={theme === value} onClick={() => setTheme(value)}
            className={cn("flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors",
              theme === value ? "border-brand bg-brand text-brand-foreground" : "hover:bg-accent")}>
            <Icon className="size-4" /> {label}
          </button>
        ))}
      </div>
    </section>
  )
}

// Configurações (base: SettingsPage do Hub, sem foto de perfil): tema e troca de senha.
export function ConfiguracoesPage() {
  const { data: eu } = useEu()
  const trocar = useTrocarSenha()
  const avisar = useToast()
  const [atual, setAtual] = useState("")
  const [nova, setNova] = useState("")
  const [confirma, setConfirma] = useState("")
  const diferentes = confirma.length > 0 && nova !== confirma

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (diferentes) return
    trocar.mutate({ senha_atual: atual, senha_nova: nova }, {
      onSuccess: () => {
        setAtual("")
        setNova("")
        setConfirma("")
        avisar("Senha trocada.")
      },
    })
  }

  return (
    <AppShell>
      <Cabecalho icone={Settings} titulo="Configurações" descricao={eu ? `${eu.nome} · ${eu.email}` : undefined} />
      <div className="mx-auto max-w-lg space-y-10 p-5 sm:p-8">
        <Aparencia />

        <form onSubmit={submit} className="space-y-4 border-t pt-8">
          <h2 className="flex items-center gap-2 font-medium"><KeyRound className="size-4 text-brand" /> Trocar senha</h2>
          <div className="space-y-2">
            <Label htmlFor="atual">Senha atual</Label>
            <Input id="atual" type="password" autoComplete="current-password" required value={atual}
              onChange={(e) => setAtual(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nova">Nova senha (mínimo 10 caracteres)</Label>
            <Input id="nova" type="password" autoComplete="new-password" required minLength={10} value={nova}
              onChange={(e) => setNova(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirma">Repita a nova senha</Label>
            <Input id="confirma" type="password" autoComplete="new-password" required value={confirma}
              onChange={(e) => setConfirma(e.target.value)} aria-invalid={diferentes} />
            {diferentes && <p className="text-sm text-destructive">As senhas não são iguais.</p>}
          </div>
          {trocar.isError && <p role="alert" className="text-sm text-destructive">{trocar.error.message}</p>}
          <Button type="submit" disabled={trocar.isPending || diferentes}>
            {trocar.isPending ? "Salvando…" : "Trocar senha"}
          </Button>
        </form>
      </div>
    </AppShell>
  )
}
