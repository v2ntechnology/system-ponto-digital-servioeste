import { CheckCircle2, CircleAlert, ScrollText } from "lucide-react"
import { useState } from "react"

import { AppShell } from "@/components/layout/AppShell"
import { Cabecalho } from "@/components/layout/Cabecalho"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Carregando, ErroCarga, Vazio } from "@/components/ui/estados"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs } from "@/components/ui/tabs"
import { conferirCadeia, useAuditoria, useEventosArp, type FiltrosAuditoria } from "@/features/auditoria/api"
import { FILTROS_ACAO, NOME_ACAO, NOME_EVENTO_ARP } from "@/features/auditoria/rotulos"
import { useEstabelecimentos } from "@/features/estrutura/api"
import { useUsuarios } from "@/features/usuarios/api"
import { formatarIdentificador, NOME_IDENTIFICADOR } from "@/lib/cnpj"
import { fmtDateTime } from "@/lib/format"
import { cn } from "@/lib/utils"

const curto = (h: string) => `${h.slice(0, 10)}…`

function Trilha() {
  const [f, setF] = useState<FiltrosAuditoria>({})
  const { data: usuarios = [] } = useUsuarios()
  const q = useAuditoria(f)
  const registros = q.data?.pages.flat() ?? []
  const definir = (k: keyof FiltrosAuditoria, v: string) => setF((x) => ({ ...x, [k]: v || undefined }))

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="a-acao">Ação</Label>
          <Select id="a-acao" value={f.acao ?? ""} onChange={(e) => definir("acao", e.target.value)}>
            {FILTROS_ACAO.map((a) => <option key={a.valor} value={a.valor}>{a.rotulo}</option>)}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="a-resultado">Resultado</Label>
          <Select id="a-resultado" value={f.resultado ?? ""} onChange={(e) => definir("resultado", e.target.value)}>
            <option value="">Todos</option><option value="permitido">Permitido</option><option value="negado">Negado</option>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="a-usuario">Usuário</Label>
          <Select id="a-usuario" value={f.usuario_id ?? ""} onChange={(e) => definir("usuario_id", e.target.value)}>
            <option value="">Todos</option>
            {usuarios.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
          </Select>
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border bg-background">
        {q.isLoading ? <Carregando /> : q.error ? <ErroCarga mensagem={q.error.message} onTentarDeNovo={() => q.refetch()} />
          : registros.length === 0 ? <Vazio icone={ScrollText} titulo="Nenhum registro neste filtro" />
          : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Quando</TableHead><TableHead>Quem</TableHead><TableHead>Ação</TableHead>
                  <TableHead>Objeto</TableHead><TableHead>Resultado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registros.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap tabular-nums">{fmtDateTime(r.ocorrido_em)}</TableCell>
                    <TableCell>{r.usuario_nome ?? <span className="text-muted-foreground">anônimo</span>}</TableCell>
                    <TableCell>
                      <p>{NOME_ACAO[r.acao] ?? r.acao}</p>
                      <p className="text-xs text-muted-foreground"><code>{r.acao}</code>
                        {Object.keys(r.detalhes ?? {}).length > 0 && ` · ${JSON.stringify(r.detalhes)}`}</p>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.objeto_tipo ? `${r.objeto_tipo} ${r.objeto_id?.slice(0, 8)}` : "—"}</TableCell>
                    <TableCell><Badge variant={r.resultado === "negado" ? "destructive" : "outline"}>{r.resultado === "negado" ? "Negado" : "Permitido"}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
      </div>
      {q.hasNextPage && (
        <div className="flex justify-center">
          <Button variant="outline" size="sm" disabled={q.isFetchingNextPage} onClick={() => q.fetchNextPage()}>
            {q.isFetchingNextPage ? "Carregando…" : "Carregar mais"}
          </Button>
        </div>
      )}
    </div>
  )
}

function EventosArp() {
  const { data: ests = [] } = useEstabelecimentos()
  const [escolhido, setEscolhido] = useState("")
  const estId = escolhido || ests[0]?.id || ""
  const q = useEventosArp(estId)
  const eventos = q.data ?? []
  const problemas = conferirCadeia(eventos)

  return (
    <div className="space-y-4">
      <div className="max-w-md space-y-1.5">
        <Label htmlFor="arp-est">Estabelecimento</Label>
        <Select id="arp-est" value={estId} onChange={(e) => setEscolhido(e.target.value)}>
          {ests.map((e) => <option key={e.id} value={e.id} data-detalhe={`${NOME_IDENTIFICADOR[e.tipo_identificador]} ${formatarIdentificador(e.tipo_identificador, e.identificador)}`}>{e.razao_social}</option>)}
        </Select>
      </div>
      {eventos.length > 0 && (
        <div role="status" className={cn("flex items-start gap-2 rounded-xl border p-3 text-sm",
          problemas.length ? "border-destructive/40 bg-destructive/5" : "border-brand/40 bg-brand/5")}>
          {problemas.length
            ? <><CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" /><span>Problemas na cadeia: {problemas.join(" ")}</span></>
            : <><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand" />
              <span>Sequência íntegra: NSR de 1 a {eventos.length} sem lacunas, e cada hash aponta para o registro anterior.</span></>}
        </div>
      )}
      <div className="overflow-hidden rounded-xl border bg-background">
        {q.isLoading ? <Carregando /> : q.error ? <ErroCarga mensagem={q.error.message} onTentarDeNovo={() => q.refetch()} />
          : eventos.length === 0 ? <Vazio icone={ScrollText} titulo="Nenhum evento neste estabelecimento" />
          : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>NSR</TableHead><TableHead>Evento</TableHead><TableHead>Quando</TableHead>
                  <TableHead>Responsável</TableHead><TableHead>Hash</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eventos.map((e) => (
                  <TableRow key={e.nsr}>
                    <TableCell className="font-medium tabular-nums">{e.nsr}</TableCell>
                    <TableCell><p>{NOME_EVENTO_ARP[e.tipo]}</p>{e.resumo && <p className="text-xs text-muted-foreground">{e.resumo}</p>}</TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums">{fmtDateTime(e.ocorrido_em)}</TableCell>
                    <TableCell>{e.responsavel_nome}</TableCell>
                    <TableCell className="font-mono text-xs" title={`hash: ${e.hash}\nanterior: ${e.hash_anterior}`}>{curto(e.hash)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
      </div>
    </div>
  )
}

export function AuditoriaPage() {
  const [aba, setAba] = useState<"trilha" | "arp">("trilha")
  return (
    <AppShell>
      <Cabecalho icone={ScrollText} titulo="Auditoria"
        descricao="Tudo o que foi feito no sistema e o registro legal de ponto (ARP). Somente leitura: nada aqui pode ser alterado ou apagado." />
      <div className="space-y-5 p-5 sm:p-6">
        <Tabs value={aba} onChange={setAba} abas={[{ value: "trilha", label: "Trilha de auditoria" }, { value: "arp", label: "Eventos do ARP (NSR)" }]} />
        {aba === "trilha" ? <Trilha /> : <EventosArp />}
      </div>
    </AppShell>
  )
}
