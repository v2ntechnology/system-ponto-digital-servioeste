import { ChevronLeft, ChevronRight, Plus, Search, Smartphone, Tablet, Users } from "lucide-react"
import { useEffect, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"

import { AppShell } from "@/components/layout/AppShell"
import { Cabecalho } from "@/components/layout/Cabecalho"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Carregando, ErroCarga, Vazio } from "@/components/ui/estados"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs } from "@/components/ui/tabs"
import { useSetores, useUnidades } from "@/features/estrutura/api"
import { POR_PAGINA, useFuncionarios, type FiltrosFuncionarios } from "@/features/funcionarios/api"
import { NOME_REGISTRO } from "@/features/funcionarios/rotulos"
import { usePermissao } from "@/lib/permissoes"
import { useDebounce } from "@/lib/useDebounce"

type Situacao = NonNullable<FiltrosFuncionarios["situacao"]>

export function FuncionariosPage() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const editar = usePermissao("funcionario.editar")
  const { data: unidades = [] } = useUnidades()
  const { data: setores = [] } = useSetores()

  const situacao = (params.get("situacao") as Situacao | null) ?? "ativo"
  const unidadeId = params.get("unidade") ?? ""
  const setorId = params.get("setor") ?? ""
  const tipoRegistro = (params.get("registro") ?? "") as FiltrosFuncionarios["tipo_registro"]
  const pagina = Number(params.get("pagina") ?? 1)
  const [busca, setBusca] = useState(params.get("busca") ?? "")
  const buscaAtrasada = useDebounce(busca.trim())

  /** Atualiza um filtro no endereço e volta para a página 1. */
  const definir = (chave: string, valor: string) =>
    setParams((p) => {
      const n = new URLSearchParams(p)
      if (valor) n.set(chave, valor)
      else n.delete(chave)
      if (chave !== "pagina") n.delete("pagina")
      if (chave === "unidade") n.delete("setor")
      return n
    }, { replace: true })

  useEffect(() => {
    if ((params.get("busca") ?? "") !== buscaAtrasada) definir("busca", buscaAtrasada)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buscaAtrasada])

  const { data, isLoading, error, refetch, isFetching } = useFuncionarios({
    busca: buscaAtrasada, situacao, unidade_id: unidadeId, setor_id: setorId, tipo_registro: tipoRegistro, pagina,
  })
  const total = data?.total ?? 0
  const ultimaPagina = Math.max(1, Math.ceil(total / POR_PAGINA))
  const temFiltro = !!(buscaAtrasada || unidadeId || setorId || tipoRegistro)

  return (
    <AppShell>
      <Cabecalho icone={Users} titulo="Funcionários" descricao="Busque por nome, CPF ou matrícula. Você vê apenas quem está no seu escopo."
        acoes={editar && <Button onClick={() => navigate("/funcionarios/novo")}><Plus /> Novo funcionário</Button>} />

      <div className="space-y-4 p-5 sm:p-6">
        <Tabs value={situacao} onChange={(v) => definir("situacao", v === "ativo" ? "" : v)}
          abas={[{ value: "ativo", label: "Ativos" }, { value: "desligado", label: "Desligados" }, { value: "todos", label: "Todos" }]} />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          <div className="space-y-1.5">
            <Label htmlFor="busca">Buscar</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="busca" type="search" value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-9"
                placeholder="Nome, CPF ou matrícula" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="f-unidade">Unidade</Label>
            <Select id="f-unidade" value={unidadeId} onChange={(e) => definir("unidade", e.target.value)}>
              <option value="">Todas</option>
              {unidades.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="f-setor">Setor</Label>
            <Select id="f-setor" value={setorId} onChange={(e) => definir("setor", e.target.value)}>
              <option value="">Todos</option>
              {setores.filter((s) => !unidadeId || s.unidade_id === unidadeId).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome}{!unidadeId ? ` · ${unidades.find((u) => u.id === s.unidade_id)?.nome ?? ""}` : ""}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="f-registro">Tipo de registro</Label>
            <Select id="f-registro" value={tipoRegistro} onChange={(e) => definir("registro", e.target.value)}>
              <option value="">Todos</option>
              <option value="tablet">Tablet</option>
              <option value="app">App</option>
            </Select>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border bg-background">
          {isLoading ? <Carregando />
            : error ? <ErroCarga mensagem={error.message} onTentarDeNovo={() => refetch()} />
            : !data?.itens.length
              ? <Vazio icone={Users} titulo={temFiltro ? "Ninguém encontrado" : "Nenhum funcionário"}
                  descricao={temFiltro ? "Confira a busca ou limpe os filtros." : situacao === "desligado" ? "Nenhum funcionário desligado." : undefined}
                  acao={!temFiltro && editar && situacao === "ativo" &&
                    <Button onClick={() => navigate("/funcionarios/novo")}><Plus /> Novo funcionário</Button>} />
              : (
                <Table aria-busy={isFetching}>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Nome</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Matrícula</TableHead>
                      <TableHead>Unidade · Setor</TableHead>
                      <TableHead>Registro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.itens.map((f) => (
                      <TableRow key={f.id}>
                        <TableCell className="font-medium">
                          <Link to={`/funcionarios/${f.id}`} className="hover:text-brand hover:underline underline-offset-4">{f.nome}</Link>
                          {f.situacao === "desligado" && <Badge className="ml-2">Desligado</Badge>}
                        </TableCell>
                        <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">{f.cpf_mascarado}</TableCell>
                        <TableCell className="tabular-nums">{f.matricula}</TableCell>
                        <TableCell className="whitespace-nowrap">{f.unidade_nome} · {f.setor_nome}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                            {f.tipo_registro === "app" ? <Smartphone className="size-3.5" /> : <Tablet className="size-3.5" />}
                            {NOME_REGISTRO[f.tipo_registro]}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
        </div>

        {total > 0 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span className="tabular-nums">
              {(pagina - 1) * POR_PAGINA + 1}–{Math.min(pagina * POR_PAGINA, total)} de {total}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={pagina <= 1} onClick={() => definir("pagina", String(pagina - 1))}>
                <ChevronLeft /> Anterior
              </Button>
              <Button variant="outline" size="sm" disabled={pagina >= ultimaPagina} onClick={() => definir("pagina", String(pagina + 1))}>
                Próxima <ChevronRight />
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
