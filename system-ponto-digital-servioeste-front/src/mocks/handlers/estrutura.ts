// Handlers SIMULADOS de empresas, estabelecimentos, unidades e setores (só dev e testes).
// Seguem as regras da spec: só o Administrador edita; cadastros com histórico são desativados, nunca apagados;
// eventos do empregador vão para o ARP com NSR por estabelecimento.
import type {
  Empresa, EmpresaAlteracao, EmpresaEntrada, Endereco, Estabelecimento, EstabelecimentoAlteracao, EstabelecimentoEntrada,
  Setor, SetorEntrada, Unidade, UnidadeAlteracao, UnidadeEntrada,
} from "@/contracts"
import { http, HttpResponse } from "msw"

import { NOME_IDENTIFICADOR, validarIdentificador } from "@/lib/cnpj"
import { somenteDigitos } from "@/lib/cpf"

import { db, novoId, registrarArp, registrarAuditoria, salvar, unidadesNoEscopo, type UsuarioDb } from "../dados"
import { API, cenario, erro, esperar, exigirPermissao } from "../util"

const ler = (acao: string) => exigirPermissao("estrutura.ler", acao)
const editar = (acao: string) => exigirPermissao("estrutura.editar", acao)

function listaComCenario<T>(itens: T[]) {
  const c = cenario()
  if (c === "erro") return erro(500, "Falha simulada ao carregar.")
  return HttpResponse.json(c === "vazio" ? [] : itens)
}

function validarEndereco(e: Endereco | undefined) {
  if (!e) return erro(400, "Informe o endereço.", { campo: "endereco" })
  if (somenteDigitos(e.cep).length !== 8) return erro(400, "CEP precisa ter 8 dígitos.", { campo: "cep" })
  if (!/^[A-Z]{2}$/.test(e.uf)) return erro(400, "UF inválida.", { campo: "uf" })
  return null
}

function validarId(tipo: Parameters<typeof validarIdentificador>[0], identificador: string) {
  if (!validarIdentificador(tipo, identificador)) {
    return erro(400, `${NOME_IDENTIFICADOR[tipo]} inválido. Confira os números.`, { campo: "identificador", codigo: `${tipo}_invalido` })
  }
  return null
}

function alterarEmpregador(u: UsuarioDb, empresaId: string, resumo: string) {
  for (const est of db.estabelecimentos.filter((e) => e.empresa_id === empresaId)) {
    registrarArp(db, est.id, "empregador_alteracao", u, resumo)
  }
}

export const estruturaHandlers = [
  // ---------------- Empresas ----------------
  http.get(`${API}/empresas`, async () => {
    await esperar()
    const r = ler("empresa.listar")
    if ("resposta" in r) return r.resposta
    return listaComCenario(db.empresas)
  }),

  http.post(`${API}/empresas`, async ({ request }) => {
    await esperar()
    const r = editar("empresa.criar")
    if ("resposta" in r) return r.resposta
    const corpo = (await request.json()) as EmpresaEntrada
    const identificador = somenteDigitos(corpo.identificador)
    const invalido = validarId(corpo.tipo_identificador, identificador)
    if (invalido) return invalido
    if (!corpo.razao_social?.trim()) return erro(400, "Informe a razão social.", { campo: "razao_social" })
    if (db.empresas.some((e) => e.identificador === identificador)) {
      return erro(409, "Já existe uma empresa com este identificador.", { campo: "identificador", codigo: "identificador_em_uso" })
    }
    const empresa: Empresa = { id: novoId(), tipo_identificador: corpo.tipo_identificador, identificador, razao_social: corpo.razao_social.trim(), ativo: true }
    db.empresas.push(empresa)
    registrarAuditoria(db, r.usuario, "empresa.criar", "permitido", { tipo: "empresa", id: empresa.id })
    salvar()
    return HttpResponse.json(empresa, { status: 201 })
  }),

  http.patch(`${API}/empresas/:id`, async ({ request, params }) => {
    await esperar()
    const r = editar("empresa.alterar")
    if ("resposta" in r) return r.resposta
    const empresa = db.empresas.find((e) => e.id === params.id)
    if (!empresa) return erro(404, "Empresa não encontrada.")
    const corpo = (await request.json()) as EmpresaAlteracao
    if (corpo.razao_social !== undefined && corpo.razao_social.trim() !== empresa.razao_social) {
      if (!corpo.razao_social.trim()) return erro(400, "Informe a razão social.", { campo: "razao_social" })
      empresa.razao_social = corpo.razao_social.trim()
      alterarEmpregador(r.usuario, empresa.id, `Alteração do empregador: razão social da empresa`)
    }
    if (corpo.ativo !== undefined) empresa.ativo = corpo.ativo
    registrarAuditoria(db, r.usuario, "empresa.alterar", "permitido", { tipo: "empresa", id: empresa.id }, { campos: Object.keys(corpo) })
    salvar()
    return HttpResponse.json(empresa)
  }),

  // ---------------- Estabelecimentos ----------------
  http.get(`${API}/estabelecimentos`, async ({ request }) => {
    await esperar()
    const r = ler("estabelecimento.listar")
    if ("resposta" in r) return r.resposta
    const empresaId = new URL(request.url).searchParams.get("empresa_id")
    const visiveis = new Set(unidadesNoEscopo(db, r.usuario).map((u) => u.estabelecimento_id))
    const todos = r.usuario.perfil === "administrador" || r.usuario.escopo.todas_unidades
    return listaComCenario(db.estabelecimentos.filter((e) => (!empresaId || e.empresa_id === empresaId) && (todos || visiveis.has(e.id))))
  }),

  http.post(`${API}/estabelecimentos`, async ({ request }) => {
    await esperar()
    const r = editar("estabelecimento.criar")
    if ("resposta" in r) return r.resposta
    const corpo = (await request.json()) as EstabelecimentoEntrada
    if (!db.empresas.some((e) => e.id === corpo.empresa_id)) return erro(400, "Empresa não encontrada.", { campo: "empresa_id" })
    const identificador = somenteDigitos(corpo.identificador)
    const invalido = validarId(corpo.tipo_identificador, identificador) ?? validarEndereco(corpo.endereco)
    if (invalido) return invalido
    if (!corpo.razao_social?.trim()) return erro(400, "Informe a razão social.", { campo: "razao_social" })
    if (db.estabelecimentos.some((e) => e.tipo_identificador === corpo.tipo_identificador && e.identificador === identificador)) {
      return erro(409, "Já existe um estabelecimento com este identificador.", { campo: "identificador", codigo: "identificador_em_uso" })
    }
    const est: Estabelecimento = {
      id: novoId(), empresa_id: corpo.empresa_id, tipo_identificador: corpo.tipo_identificador, identificador,
      razao_social: corpo.razao_social.trim(), endereco: { ...corpo.endereco, cep: somenteDigitos(corpo.endereco.cep) },
      ativo: true, ultimo_nsr: 0,
    }
    db.estabelecimentos.push(est)
    // Inicia a sequência de NSR do estabelecimento com a inclusão do empregador.
    registrarArp(db, est.id, "empregador_inclusao", r.usuario, `Inclusão do empregador: ${est.razao_social}`)
    registrarAuditoria(db, r.usuario, "estabelecimento.criar", "permitido", { tipo: "estabelecimento", id: est.id })
    salvar()
    return HttpResponse.json(est, { status: 201 })
  }),

  http.patch(`${API}/estabelecimentos/:id`, async ({ request, params }) => {
    await esperar()
    const r = editar("estabelecimento.alterar")
    if ("resposta" in r) return r.resposta
    const est = db.estabelecimentos.find((e) => e.id === params.id)
    if (!est) return erro(404, "Estabelecimento não encontrado.")
    const corpo = (await request.json()) as EstabelecimentoAlteracao
    if (corpo.endereco) {
      const invalido = validarEndereco(corpo.endereco)
      if (invalido) return invalido
    }
    const mudouDados = (corpo.razao_social !== undefined && corpo.razao_social.trim() !== est.razao_social)
      || (corpo.endereco !== undefined && JSON.stringify(corpo.endereco) !== JSON.stringify(est.endereco))
    if (corpo.razao_social !== undefined) est.razao_social = corpo.razao_social.trim()
    if (corpo.endereco) est.endereco = { ...corpo.endereco, cep: somenteDigitos(corpo.endereco.cep) }
    if (corpo.ativo !== undefined) est.ativo = corpo.ativo
    if (mudouDados) registrarArp(db, est.id, "empregador_alteracao", r.usuario, `Alteração do empregador: ${est.razao_social}`)
    registrarAuditoria(db, r.usuario, "estabelecimento.alterar", "permitido", { tipo: "estabelecimento", id: est.id }, { campos: Object.keys(corpo) })
    salvar()
    return HttpResponse.json(est)
  }),

  // ---------------- Unidades ----------------
  http.get(`${API}/unidades`, async () => {
    await esperar()
    const r = ler("unidade.listar")
    if ("resposta" in r) return r.resposta
    return listaComCenario(unidadesNoEscopo(db, r.usuario))
  }),

  http.post(`${API}/unidades`, async ({ request }) => {
    await esperar()
    const r = editar("unidade.criar")
    if ("resposta" in r) return r.resposta
    const corpo = (await request.json()) as UnidadeEntrada
    const est = db.estabelecimentos.find((e) => e.id === corpo.estabelecimento_id)
    if (!est || est.empresa_id !== corpo.empresa_id) {
      return erro(400, "Escolha um estabelecimento da mesma empresa.", { campo: "estabelecimento_id" })
    }
    if (!corpo.nome?.trim()) return erro(400, "Informe o nome da unidade.", { campo: "nome" })
    if (!/^\d{7}$/.test(corpo.municipio_ibge)) return erro(400, "O código IBGE tem 7 dígitos.", { campo: "municipio_ibge" })
    const invalido = validarEndereco(corpo.endereco)
    if (invalido) return invalido
    if (db.unidades.some((u) => u.empresa_id === corpo.empresa_id && u.nome.toLowerCase() === corpo.nome.trim().toLowerCase())) {
      return erro(409, "Já existe uma unidade com este nome nesta empresa.", { campo: "nome", codigo: "nome_em_uso" })
    }
    const unidade: Unidade = {
      id: novoId(), empresa_id: corpo.empresa_id, estabelecimento_id: est.id, nome: corpo.nome.trim(),
      endereco: { ...corpo.endereco, cep: somenteDigitos(corpo.endereco.cep) }, municipio_ibge: corpo.municipio_ibge, ativo: true,
    }
    db.unidades.push(unidade)
    registrarAuditoria(db, r.usuario, "unidade.criar", "permitido", { tipo: "unidade", id: unidade.id })
    salvar()
    return HttpResponse.json(unidade, { status: 201 })
  }),

  http.patch(`${API}/unidades/:id`, async ({ request, params }) => {
    await esperar()
    const r = editar("unidade.alterar")
    if ("resposta" in r) return r.resposta
    const unidade = db.unidades.find((u) => u.id === params.id)
    if (!unidade) return erro(404, "Unidade não encontrada.")
    const corpo = (await request.json()) as UnidadeAlteracao
    if (corpo.nome !== undefined) {
      const nome = corpo.nome.trim()
      if (!nome) return erro(400, "Informe o nome da unidade.", { campo: "nome" })
      if (db.unidades.some((u) => u.id !== unidade.id && u.empresa_id === unidade.empresa_id && u.nome.toLowerCase() === nome.toLowerCase())) {
        return erro(409, "Já existe uma unidade com este nome nesta empresa.", { campo: "nome", codigo: "nome_em_uso" })
      }
      unidade.nome = nome
    }
    if (corpo.endereco) {
      const invalido = validarEndereco(corpo.endereco)
      if (invalido) return invalido
      unidade.endereco = { ...corpo.endereco, cep: somenteDigitos(corpo.endereco.cep) }
    }
    if (corpo.ativo !== undefined) unidade.ativo = corpo.ativo
    if (corpo.novo_estabelecimento) {
      const est = db.estabelecimentos.find((e) => e.id === corpo.novo_estabelecimento!.estabelecimento_id)
      if (!est || est.empresa_id !== unidade.empresa_id) {
        return erro(400, "Escolha um estabelecimento da mesma empresa.", { campo: "estabelecimento_id" })
      }
      // No simulado a troca vale na hora; a API real fecha a vigência anterior no dia anterior ao início.
      unidade.estabelecimento_id = est.id
    }
    registrarAuditoria(db, r.usuario, "unidade.alterar", "permitido", { tipo: "unidade", id: unidade.id }, { campos: Object.keys(corpo) })
    salvar()
    return HttpResponse.json(unidade)
  }),

  // ---------------- Setores ----------------
  http.get(`${API}/setores`, async ({ request }) => {
    await esperar()
    const r = ler("setor.listar")
    if ("resposta" in r) return r.resposta
    const unidadeId = new URL(request.url).searchParams.get("unidade_id")
    const u = r.usuario
    const visivel = (s: Setor) =>
      u.perfil === "administrador" || u.escopo.todas_unidades || u.escopo.unidade_ids.includes(s.unidade_id) || u.escopo.setor_ids.includes(s.id)
    return listaComCenario(db.setores.filter((s) => (!unidadeId || s.unidade_id === unidadeId) && visivel(s)))
  }),

  http.post(`${API}/setores`, async ({ request }) => {
    await esperar()
    const r = editar("setor.criar")
    if ("resposta" in r) return r.resposta
    const corpo = (await request.json()) as SetorEntrada
    if (!db.unidades.some((u) => u.id === corpo.unidade_id)) return erro(400, "Unidade não encontrada.", { campo: "unidade_id" })
    const nome = corpo.nome?.trim()
    if (!nome) return erro(400, "Informe o nome do setor.", { campo: "nome" })
    if (db.setores.some((s) => s.unidade_id === corpo.unidade_id && s.nome.toLowerCase() === nome.toLowerCase())) {
      return erro(409, "Já existe um setor com este nome nesta unidade.", { campo: "nome", codigo: "nome_em_uso" })
    }
    const setor: Setor = { id: novoId(), unidade_id: corpo.unidade_id, nome, ativo: true }
    db.setores.push(setor)
    registrarAuditoria(db, r.usuario, "setor.criar", "permitido", { tipo: "setor", id: setor.id })
    salvar()
    return HttpResponse.json(setor, { status: 201 })
  }),

  http.patch(`${API}/setores/:id`, async ({ request, params }) => {
    await esperar()
    const r = editar("setor.alterar")
    if ("resposta" in r) return r.resposta
    const setor = db.setores.find((s) => s.id === params.id)
    if (!setor) return erro(404, "Setor não encontrado.")
    const corpo = (await request.json()) as { nome?: string; ativo?: boolean }
    if (corpo.nome !== undefined) {
      const nome = corpo.nome.trim()
      if (!nome) return erro(400, "Informe o nome do setor.", { campo: "nome" })
      if (db.setores.some((s) => s.id !== setor.id && s.unidade_id === setor.unidade_id && s.nome.toLowerCase() === nome.toLowerCase())) {
        return erro(409, "Já existe um setor com este nome nesta unidade.", { campo: "nome", codigo: "nome_em_uso" })
      }
      setor.nome = nome
    }
    if (corpo.ativo !== undefined) setor.ativo = corpo.ativo
    registrarAuditoria(db, r.usuario, "setor.alterar", "permitido", { tipo: "setor", id: setor.id }, { campos: Object.keys(corpo) })
    salvar()
    return HttpResponse.json(setor)
  }),
]
