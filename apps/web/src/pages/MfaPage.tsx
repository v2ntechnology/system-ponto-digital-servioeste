import { ArrowRight, ShieldCheck, Smartphone } from "lucide-react"
import QRCode from "qrcode"
import { useEffect, useRef, useState, type FormEvent } from "react"
import { Navigate, useLocation, useNavigate } from "react-router-dom"

import { Brand } from "@/components/layout/Brand"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { Button } from "@/components/ui/button"
import { Carregando } from "@/components/ui/estados"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCadastrarMfa, useEu, useLogout, useVerificarMfa } from "@/features/auth/useAuth"
import { ApiError } from "@/lib/api"

type Modo = "cadastrar" | "verificar"

/**
 * Segundo fator (Administrador e RH). "cadastrar": mostra o QR code para o app autenticador e pede o primeiro código.
 * "verificar": só pede o código. Se a página for recarregada sem saber o modo, tenta cadastrar; 409 = já cadastrado.
 */
export function MfaPage() {
  const { data: eu, isLoading } = useEu()
  const estado = useLocation().state as { modo?: Modo; from?: string } | null
  const destino = estado?.from ?? "/funcionarios"
  const navigate = useNavigate()
  const cadastrar = useCadastrarMfa()
  const verificar = useVerificarMfa()
  const logout = useLogout()
  const [modo, setModo] = useState<Modo | null>(estado?.modo === "verificar" ? "verificar" : null)
  const [qr, setQr] = useState<string | null>(null)
  const [codigo, setCodigo] = useState("")
  const pediu = useRef(false)

  const precisaCadastrar = !!eu?.mfa_pendente && modo === null
  useEffect(() => {
    if (!precisaCadastrar || pediu.current) return
    pediu.current = true
    cadastrar.mutate(undefined, {
      onSuccess: async ({ otpauth_uri }) => {
        setQr(await QRCode.toDataURL(otpauth_uri, { margin: 1, width: 220 }))
        setModo("cadastrar")
      },
      onError: (e) => {
        if (e instanceof ApiError && e.status === 409) setModo("verificar")
      },
    })
  }, [precisaCadastrar, cadastrar])

  if (isLoading) return <Carregando className="h-dvh" />
  if (!eu) return <Navigate to="/login" replace />
  if (!eu.mfa_pendente) return <Navigate to={destino} replace />

  const submit = (e: FormEvent) => {
    e.preventDefault()
    verificar.mutate(codigo, { onSuccess: () => navigate(destino, { replace: true }) })
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background px-6 py-6 sm:px-10">
      <header className="flex items-center justify-between">
        <Brand />
        <ThemeToggle />
      </header>

      <div className="mx-auto my-auto w-full max-w-sm py-10">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl border bg-background">
          <ShieldCheck className="size-5 text-brand" />
        </span>
        <h1 className="mt-4 text-center text-2xl font-medium tracking-tight">
          {modo === "cadastrar" ? "Configure o app autenticador" : "Confirme que é você"}
        </h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {modo === "cadastrar"
            ? "Seu perfil exige um segundo fator. Escaneie o QR code com o Google Authenticator, Microsoft Authenticator ou Aegis e digite o código de 6 dígitos."
            : "Digite o código de 6 dígitos que aparece no seu app autenticador."}
        </p>

        {modo === null && <Carregando texto="Preparando…" className="py-10" />}
        {cadastrar.isError && !(cadastrar.error instanceof ApiError && cadastrar.error.status === 409) && (
          <p role="alert" className="mt-6 text-center text-sm text-destructive">{cadastrar.error.message}</p>
        )}

        {modo === "cadastrar" && qr && (
          <img src={qr} alt="QR code para cadastrar o app autenticador" className="mx-auto mt-6 size-[220px] rounded-xl border bg-white p-2" />
        )}

        {modo !== null && (
          <form onSubmit={submit} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="codigo" className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                <Smartphone className="size-3.5" /> Código
              </Label>
              <Input id="codigo" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required
                autoFocus value={codigo} onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
                aria-invalid={verificar.isError} aria-describedby={verificar.isError ? "codigo-erro" : undefined}
                className="h-12 rounded-xl bg-muted/50 text-center text-lg tracking-[0.5em] tabular-nums" placeholder="000000" />
              {verificar.isError && <p id="codigo-erro" role="alert" className="text-sm text-destructive">{verificar.error.message}</p>}
            </div>
            <Button type="submit" disabled={verificar.isPending || codigo.length !== 6} className="h-12 w-full rounded-xl text-[15px]">
              {verificar.isPending ? "Confirmando…" : <>Confirmar <ArrowRight /></>}
            </Button>
          </form>
        )}

        <button type="button" onClick={() => logout.mutate(undefined, { onSettled: () => navigate("/login", { replace: true }) })}
          className="mx-auto mt-6 block text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
          Entrar com outra conta
        </button>
      </div>
    </div>
  )
}
