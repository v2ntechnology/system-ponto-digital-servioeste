import type { Funcionario } from "@/contracts"
import { ArrowLeft, ArrowRightLeft, MapPinned, Pencil, Smartphone, Tablet, UserRound, UserX } from "lucide-react"
import { useState, type ReactNode } from "react"
import { Link, useParams } from "react-router-dom"

import { AppShell } from "@/components/layout/AppShell"
import { Cabecalho } from "@/components/layout/Cabecalho"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Carregando, ErroCarga, Vazio } from "@/components/ui/estados"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs } from "@/components/ui/tabs"
import { useFuncionario } from "@/features/funcionarios/api"
import { EditarDialog } from "@/features/funcionarios/EditarDialog"
import { LocalPrestacaoDialog } from "@/features/funcionarios/LocalPrestacaoDialog"
import { NOME_REGISTRO } from "@/features/funcionarios/rotulos"
import { TransferenciaDialog } from "@/features/funcionarios/TransferenciaDialog"
import { ApiError } from "@/lib/api"
import { formatarIdentificador, NOME_IDENTIFICADOR } from "@/lib/cnpj"
import { formatarCpf } from "@/lib/cpf"
import { fmtDate } from "@/lib/format"
import { usePermissao } from "@/lib/permissoes"

type Aba = "dados" | "lotacoes" | "locais"
type Dialogo = "editar" | "transferir" | "local" | null

function Item({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-xs text-muted-foreground">{rotulo}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  )
}

const periodo = (inicio: string, fim: string | null | undefined) => `${fmtDate(inicio)} – ${fim ? fmtDate(fim) : "atual"}`

function Dados({ f }: { f: Funcionario }) {
  const cpfCompleto = /^\d{11}$/.test(f.cpf)
  return (
    <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <Item rotulo="CPF"><span className="tabular-nums">{cpfCompleto ? formatarCpf(f.cpf) : f.cpf}</span></Item>
      <Item rotulo="Matrícula"><span className="tabular-nums">{f.matricula}</span></Item>
      <Item rotulo="Tipo de vínculo">{f.tipo_vinculo.nome}</Item>
      <Item rotulo="Admissão">{fmtDate(f.admitido_em)}</Item>
      <Item rotulo="Lotação atual">
        {f.lotacao_atual ? `${f.lotacao_atual.unidade_nome} · ${f.lotacao_atual.setor_nome}` : "—"}
      </Item>
      <Item rotulo="Registro de ponto">
        <span className="inline-flex items-center gap-1.5">
          {f.tipo_registro === "app" ? <Smartphone className="size-4 text-brand" /> : <Tablet className="size-4 text-brand" />}
          {f.tipo_registro === "app" ? "App no celular" : "Tablet da unidade"}
        </span>
      </Item>
      <Item rotulo="E-mail">{f.email ?? "—"}</Item>
      {f.desligado_em && <Item rotulo="Desligamento">{fmtDate(f.desligado_em)}</Item>}
      {f.portal_acesso_ate && <Item rotulo="Acesso ao portal até">{fmtDate(f.portal_acesso_ate)} (somente leitura)</Item>}
    </dl>
  )
}

function Lotacoes({ f }: { f: Funcionario }) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Período</TableHead><TableHead>Unidade</TableHead><TableHead>Setor</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {f.lotacoes.map((l) => (
          <TableRow key={l.id}>
            <TableCell className="whitespace-nowrap tabular-nums">
              {periodo(l.inicio, l.fim)} {!l.fim && <Badge variant="brand" className="ml-1">vigente</Badge>}
            </TableCell>
            <TableCell>{l.unidade_nome}</TableCell>
            <TableCell>{l.setor_nome}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function Locais({ f }: { f: Funcionario }) {
  if (!f.locais_prestacao.length) {
    return <Vazio icone={MapPinned} titulo="Nenhum local de prestação"
      descricao="Só é preciso quando o funcionário trabalha fora da unidade ou em instalações de terceiros." />
  }
  return (
    <ul className="space-y-3">
      {f.locais_prestacao.map((l) => (
        <li key={l.id} className="rounded-xl border p-4">
          <p className="font-medium">{l.descricao}</p>
          <p className="text-sm text-muted-foreground">
            {l.endereco.logradouro}, {l.endereco.numero} · {l.endereco.cidade}/{l.endereco.uf}
          </p>
          <p className="mt-1 text-xs text-muted-foreground tabular-nums">
            {periodo(l.inicio, l.fim)}
            {l.tomador_tipo_identificador && l.tomador_identificador &&
              ` · Tomador: ${NOME_IDENTIFICADOR[l.tomador_tipo_identificador]} ${formatarIdentificador(l.tomador_tipo_identificador, l.tomador_identificador)}`}
          </p>
        </li>
      ))}
    </ul>
  )
}

export function FuncionarioPage() {
  const { id } = useParams()
  const { data: f, isLoading, error, refetch } = useFuncionario(id)
  const editar = usePermissao("funcionario.editar")
  const [aba, setAba] = useState<Aba>("dados")
  const [dialogo, setDialogo] = useState<Dialogo>(null)
  const naoEncontrado = error instanceof ApiError && error.status === 404

  const voltar = (
    <Link to="/funcionarios" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="size-4" /> Funcionários
    </Link>
  )

  if (isLoading) return <AppShell><Carregando /></AppShell>
  if (naoEncontrado || (!f && !error)) {
    return (
      <AppShell>
        <div className="p-5">{voltar}</div>
        <Vazio icone={UserX} titulo="Funcionário não encontrado"
          descricao="Ele não existe ou não está no seu escopo de acesso." />
      </AppShell>
    )
  }
  if (error || !f) return <AppShell><ErroCarga mensagem={error?.message} onTentarDeNovo={() => refetch()} /></AppShell>

  const ativo = f.situacao === "ativo"

  return (
    <AppShell>
      <div className="px-5 pt-5 sm:px-6">{voltar}</div>
      <Cabecalho icone={UserRound} titulo={f.nome}
        descricao={`Matrícula ${f.matricula} · ${NOME_REGISTRO[f.tipo_registro]}${f.lotacao_atual ? ` · ${f.lotacao_atual.unidade_nome}` : ""}`}
        acoes={<>
          {!ativo && <Badge variant="destructive" className="self-center">Desligado</Badge>}
          {editar && ativo && <>
            <Button variant="outline" size="sm" onClick={() => setDialogo("editar")}><Pencil /> Editar</Button>
            <Button variant="outline" size="sm" onClick={() => setDialogo("transferir")}><ArrowRightLeft /> Transferir</Button>
            <Button variant="outline" size="sm" onClick={() => setDialogo("local")}><MapPinned /> Local de prestação</Button>
          </>}
        </>} />

      <div className="space-y-5 p-5 sm:p-6">
        <Tabs value={aba} onChange={setAba} abas={[
          { value: "dados", label: "Dados" },
          { value: "lotacoes", label: "Lotações", count: f.lotacoes.length },
          { value: "locais", label: "Locais de prestação", count: f.locais_prestacao.length },
        ]} />
        <div className="rounded-xl border bg-background p-5">
          {aba === "dados" && <Dados f={f} />}
          {aba === "lotacoes" && <Lotacoes f={f} />}
          {aba === "locais" && <Locais f={f} />}
        </div>
      </div>

      {dialogo === "editar" && <EditarDialog funcionario={f} onFechar={() => setDialogo(null)} />}
      {dialogo === "transferir" && <TransferenciaDialog funcionario={f} onFechar={() => setDialogo(null)} />}
      {dialogo === "local" && <LocalPrestacaoDialog funcionarioId={f.id} onFechar={() => setDialogo(null)} />}
    </AppShell>
  )
}
