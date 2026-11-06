import type { Usuario } from "@/contracts"
import { KeyRound, Pencil, Plus, Power, UserCog } from "lucide-react"
import { useState } from "react"

import { AppShell } from "@/components/layout/AppShell"
import { Cabecalho } from "@/components/layout/Cabecalho"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Confirmar } from "@/components/ui/confirmar"
import { Carregando, ErroCarga, Vazio } from "@/components/ui/estados"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/toast"
import { useSetores, useUnidades } from "@/features/estrutura/api"
import { useEu } from "@/features/auth/useAuth"
import { useAlterarUsuario, useRedefinirMfa, useUsuarios } from "@/features/usuarios/api"
import { resumirEscopo } from "@/features/usuarios/escopo"
import { UsuarioForm } from "@/features/usuarios/UsuarioForm"
import { NOME_PERFIL } from "@/lib/permissoes"
import { cn } from "@/lib/utils"

type Dialogo = { tipo: "form"; usuario?: Usuario } | { tipo: "ativo"; usuario: Usuario } | { tipo: "mfa"; usuario: Usuario } | null

const exigeMfa = (u: Usuario) => u.perfil === "administrador" || u.perfil === "rh"

function SegundoFator({ u }: { u: Usuario }) {
  if (!exigeMfa(u)) return <span className="text-muted-foreground">Não exigido</span>
  return u.mfa_cadastrado ? <Badge variant="brand">Cadastrado</Badge> : <Badge variant="outline">Configura no próximo acesso</Badge>
}

function ConfirmarAtivo({ u, onFechar }: { u: Usuario; onFechar: () => void }) {
  const alterar = useAlterarUsuario()
  const avisar = useToast()
  return (
    <Confirmar titulo={u.ativo ? "Desativar usuário?" : "Reativar usuário?"}
      descricao={u.ativo ? `${u.nome} perde o acesso ao painel. O histórico de ações continua guardado.` : `${u.nome} volta a acessar o painel.`}
      rotulo={u.ativo ? "Desativar" : "Reativar"} perigo={u.ativo} pendente={alterar.isPending} erro={alterar.error?.message}
      onFechar={onFechar}
      onConfirmar={() => alterar.mutate({ id: u.id, ativo: !u.ativo }, { onSuccess: () => { avisar(u.ativo ? "Usuário desativado." : "Usuário reativado."); onFechar() } })} />
  )
}

function ConfirmarMfa({ u, onFechar }: { u: Usuario; onFechar: () => void }) {
  const redefinir = useRedefinirMfa()
  const avisar = useToast()
  return (
    <Confirmar titulo="Redefinir o segundo fator?"
      descricao={`Use quando ${u.nome} perder o celular. No próximo acesso, a pessoa escaneia um QR code novo. A ação fica na auditoria.`}
      rotulo="Redefinir" perigo pendente={redefinir.isPending} erro={redefinir.error?.message} onFechar={onFechar}
      onConfirmar={() => redefinir.mutate(u.id, { onSuccess: () => { avisar("Segundo fator redefinido."); onFechar() } })} />
  )
}

export function UsuariosPage() {
  const { data = [], isLoading, error, refetch } = useUsuarios()
  const { data: unidades = [] } = useUnidades()
  const { data: setores = [] } = useSetores()
  const { data: eu } = useEu()
  const [dialogo, setDialogo] = useState<Dialogo>(null)
  const fechar = () => setDialogo(null)

  return (
    <AppShell>
      <Cabecalho icone={UserCog} titulo="Usuários do painel"
        descricao="Quem acessa o painel, com perfil e escopo. Administrador e RH usam segundo fator."
        acoes={<Button onClick={() => setDialogo({ tipo: "form" })}><Plus /> Novo usuário</Button>} />
      <div className="p-5 sm:p-6">
        <div className="overflow-hidden rounded-xl border bg-background">
          {isLoading ? <Carregando /> : error ? <ErroCarga mensagem={error.message} onTentarDeNovo={() => refetch()} />
            : data.length === 0 ? <Vazio icone={UserCog} titulo="Nenhum usuário" />
            : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Nome</TableHead><TableHead>Perfil</TableHead><TableHead>Escopo</TableHead>
                    <TableHead>Segundo fator</TableHead><TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((u) => (
                    <TableRow key={u.id} className={cn(!u.ativo && "opacity-60")}>
                      <TableCell>
                        <p className="font-medium">{u.nome} {u.id === eu?.id && <span className="text-xs text-muted-foreground">(você)</span>}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                        {!u.ativo && <Badge className="mt-1">Inativo</Badge>}
                      </TableCell>
                      <TableCell>{NOME_PERFIL[u.perfil]}</TableCell>
                      <TableCell className="max-w-64 text-sm">{resumirEscopo(u.perfil, u.escopo, unidades, setores)}</TableCell>
                      <TableCell><SegundoFator u={u} /></TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="size-8" aria-label={`Editar ${u.nome}`} title="Editar"
                            onClick={() => setDialogo({ tipo: "form", usuario: u })}><Pencil /></Button>
                          {exigeMfa(u) && u.mfa_cadastrado && (
                            <Button variant="ghost" size="icon" className="size-8" aria-label={`Redefinir segundo fator de ${u.nome}`} title="Redefinir segundo fator"
                              onClick={() => setDialogo({ tipo: "mfa", usuario: u })}><KeyRound /></Button>
                          )}
                          <Button variant="ghost" size="icon" className="size-8" aria-label={`${u.ativo ? "Desativar" : "Reativar"} ${u.nome}`}
                            title={u.ativo ? "Desativar" : "Reativar"} onClick={() => setDialogo({ tipo: "ativo", usuario: u })}><Power /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
        </div>
      </div>
      {dialogo?.tipo === "form" && <UsuarioForm usuario={dialogo.usuario} onFechar={fechar} />}
      {dialogo?.tipo === "ativo" && <ConfirmarAtivo u={dialogo.usuario} onFechar={fechar} />}
      {dialogo?.tipo === "mfa" && <ConfirmarMfa u={dialogo.usuario} onFechar={fechar} />}
    </AppShell>
  )
}
