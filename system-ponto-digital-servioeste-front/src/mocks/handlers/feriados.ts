// Handlers SIMULADOS de feriados (só dev e testes). Remover = desativar (FR-015).
import type { Feriado, FeriadoEntrada } from "@/contracts"
import { http, HttpResponse } from "msw"

import { podeEditarFeriado, valeParaUnidade } from "@/features/feriados/regras"

import { db, novoId, registrarAuditoria, salvar, unidadesNoEscopo, type UsuarioDb } from "../dados"
import { API, cenario, erro, esperar, exigirPermissao } from "../util"

function negar(u: UsuarioDb, acao: string) {
  registrarAuditoria(db, u, "acesso.negado", "negado", null, { acao })
  salvar()
  return erro(403, "Seu escopo não permite editar este feriado. Nacionais e estaduais ficam com o Administrador.")
}

export const feriadosHandlers = [
  http.get(`${API}/feriados`, async ({ request }) => {
    await esperar()
    const r = exigirPermissao("estrutura.ler", "feriado.listar")
    if ("resposta" in r) return r.resposta
    if (cenario() === "erro") return erro(500, "Falha simulada ao carregar.")
    const q = new URL(request.url).searchParams
    const ano = q.get("ano")
    if (!ano) return erro(400, "Informe o ano.", { campo: "ano" })
    const visiveis = unidadesNoEscopo(db, r.usuario)
    let lista = db.feriados.filter((f) => f.data.startsWith(`${ano}-`))
    const unidadeId = q.get("unidade_id")
    if (unidadeId) {
      const u = visiveis.find((x) => x.id === unidadeId)
      if (!u) return erro(404, "Unidade não encontrada.")
      // Calendário efetivo da unidade: só ativos.
      lista = lista.filter((f) => f.ativo && valeParaUnidade(f, u))
    } else {
      lista = lista.filter((f) => f.abrangencia === "nacional" || visiveis.some((u) => valeParaUnidade(f, u)))
    }
    lista.sort((a, b) => a.data.localeCompare(b.data))
    return HttpResponse.json(cenario() === "vazio" ? [] : lista)
  }),

  http.post(`${API}/feriados`, async ({ request }) => {
    await esperar()
    const r = exigirPermissao("feriado.editar", "feriado.criar")
    if ("resposta" in r) return r.resposta
    const c = (await request.json()) as FeriadoEntrada
    if (!c.data) return erro(400, "Informe a data.", { campo: "data" })
    if (!c.nome?.trim()) return erro(400, "Informe o nome do feriado.", { campo: "nome" })
    if (c.abrangencia === "estadual" && !/^[A-Z]{2}$/.test(c.uf ?? "")) return erro(400, "Escolha a UF.", { campo: "uf" })
    if (c.abrangencia === "municipal" && !/^\d{7}$/.test(c.municipio_ibge ?? "")) return erro(400, "Escolha o município.", { campo: "municipio_ibge" })
    if (c.abrangencia === "unidade" && !db.unidades.some((u) => u.id === c.unidade_id)) return erro(400, "Escolha a unidade.", { campo: "unidade_id" })
    if (!podeEditarFeriado(r.usuario, c, db.unidades)) return negar(r.usuario, "feriado.criar")

    const feriado: Feriado = {
      id: novoId(), data: c.data, nome: c.nome.trim(), abrangencia: c.abrangencia, ativo: true,
      uf: c.abrangencia === "estadual" ? c.uf ?? null : null,
      municipio_ibge: c.abrangencia === "municipal" ? c.municipio_ibge ?? null : null,
      unidade_id: c.abrangencia === "unidade" ? c.unidade_id ?? null : null,
    }
    const repetido = db.feriados.some((f) => f.ativo && f.data === feriado.data && f.abrangencia === feriado.abrangencia
      && f.uf === feriado.uf && f.municipio_ibge === feriado.municipio_ibge && f.unidade_id === feriado.unidade_id)
    if (repetido) return erro(409, "Já existe um feriado ativo nesta data com a mesma abrangência.", { campo: "data" })
    db.feriados.push(feriado)
    registrarAuditoria(db, r.usuario, "feriado.criar", "permitido", { tipo: "feriado", id: feriado.id }, { abrangencia: feriado.abrangencia })
    salvar()
    return HttpResponse.json(feriado, { status: 201 })
  }),

  http.patch(`${API}/feriados/:id`, async ({ request, params }) => {
    await esperar()
    const r = exigirPermissao("feriado.editar", "feriado.alterar")
    if ("resposta" in r) return r.resposta
    const f = db.feriados.find((x) => x.id === params.id)
    if (!f) return erro(404, "Feriado não encontrado.")
    if (!podeEditarFeriado(r.usuario, f, db.unidades)) return negar(r.usuario, "feriado.alterar")
    const c = (await request.json()) as { nome?: string; ativo?: boolean }
    if (c.nome !== undefined) {
      if (!c.nome.trim()) return erro(400, "Informe o nome do feriado.", { campo: "nome" })
      f.nome = c.nome.trim()
    }
    if (c.ativo !== undefined) f.ativo = c.ativo
    registrarAuditoria(db, r.usuario, "feriado.alterar", "permitido", { tipo: "feriado", id: f.id }, { campos: Object.keys(c) })
    salvar()
    return HttpResponse.json(f)
  }),
]
