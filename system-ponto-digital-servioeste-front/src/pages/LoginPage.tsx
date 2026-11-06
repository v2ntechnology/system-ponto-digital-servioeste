import { ArrowRight, Eye, EyeOff, FlaskConical, Lock, Mail } from "lucide-react"
import { useState, type FormEvent } from "react"
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom"

import { Brand } from "@/components/layout/Brand"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoginVisual } from "@/features/auth/LoginVisual"
import { useEu, useLogin } from "@/features/auth/useAuth"

// Só em desenvolvimento com dados simulados: atalhos para os usuários de teste (some do build de produção).
const MOCK = import.meta.env.DEV && import.meta.env.VITE_MOCK === "true"
const USUARIOS_TESTE = [
  { email: "admin@exemplo.test", rotulo: "Administrador" },
  { email: "rh@exemplo.test", rotulo: "RH" },
  { email: "gestor@exemplo.test", rotulo: "Gestor" },
]

// Login (padrão do Hub): painel com foto e marca à esquerda, formulário limpo à direita.
export function LoginPage() {
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const login = useLogin()
  const { data: eu } = useEu()
  const navigate = useNavigate()
  const destino = (useLocation().state as { from?: string } | null)?.from ?? "/funcionarios"

  if (eu && !eu.mfa_pendente) return <Navigate to={destino} replace />

  const submit = (e: FormEvent) => {
    e.preventDefault()
    login.mutate({ email, senha }, {
      onSuccess: ({ mfa }) => {
        if (mfa === "nao_exigido") navigate(destino, { replace: true })
        else navigate("/mfa", { replace: true, state: { modo: mfa, from: destino } })
      },
    })
  }

  return (
    <div className="flex min-h-dvh bg-background lg:p-3">
      <LoginVisual />

      <section className="flex w-full flex-col px-6 py-6 sm:px-10 lg:w-[46%] lg:max-w-[620px] lg:px-14">
        <header className="flex items-center justify-between">
          <Brand />
          <ThemeToggle />
        </header>

        <div className="mx-auto my-auto w-full max-w-sm py-12">
          <h1 className="text-center text-3xl font-medium tracking-tight">Entrar</h1>
          <span className="mx-auto mt-3 block h-1 w-10 rounded-full bg-brand" aria-hidden />
          <p className="mt-3 text-center text-sm text-muted-foreground">Acesso do RH, gestores e administradores.</p>

          <form onSubmit={submit} className="mt-10 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs uppercase tracking-wide text-muted-foreground">E-mail</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" type="email" autoComplete="username" required value={email}
                  onChange={(e) => setEmail(e.target.value)} placeholder="voce@servioeste.com.br"
                  className="h-12 rounded-xl bg-muted/50 pl-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="senha" className="text-xs uppercase tracking-wide text-muted-foreground">Senha</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="senha" type={mostrarSenha ? "text" : "password"} autoComplete="current-password" required
                  value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="••••••••••"
                  className="h-12 rounded-xl bg-muted/50 px-10" />
                <button type="button" onClick={() => setMostrarSenha((v) => !v)}
                  aria-label={mostrarSenha ? "Esconder senha" : "Mostrar senha"}
                  className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {mostrarSenha ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            {login.isError && <p role="alert" className="text-sm text-destructive">{login.error.message}</p>}
            <Button type="submit" disabled={login.isPending} className="h-12 w-full rounded-xl text-[15px]">
              {login.isPending ? "Entrando…" : <>Entrar <ArrowRight /></>}
            </Button>
          </form>

          {MOCK && (
            <div className="mt-6 rounded-xl border border-dashed border-brand/50 p-3">
              <p className="flex items-center gap-2 text-xs font-medium text-brand">
                <FlaskConical className="size-4" /> Dados simulados: escolha um usuário de teste
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {USUARIOS_TESTE.map((u) => (
                  <button key={u.email} type="button" onClick={() => { setEmail(u.email); setSenha("senha-de-teste") }}
                    className="rounded-lg border px-2 py-1.5 text-xs transition-colors hover:bg-accent">
                    {u.rotulo}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Código do app autenticador no simulado: 000000</p>
            </div>
          )}
        </div>

        <footer className="text-center text-xs text-muted-foreground">
          Acesso restrito. Esqueceu a senha ou perdeu o celular do autenticador? Fale com o administrador.
          {import.meta.env.DEV && (
            <Link to="/dev" className="mt-2 flex items-center justify-center gap-1 text-brand underline-offset-4 hover:underline">
              <FlaskConical className="size-3.5" /> Área de desenvolvimento
            </Link>
          )}
        </footer>
      </section>
    </div>
  )
}
