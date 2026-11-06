// Handlers SIMULADOS de funcionários e tipos de vínculo (só dev e testes).
// Regras da spec: CPF único entre ativos, matrícula única por empresa, escopo do usuário em todas as respostas
// (fora do escopo = 404, sem revelar que existe), CPF completo só para quem edita, eventos de empregado no ARP.
import type {
  Funcionario, FuncionarioAlteracao, FuncionarioEntrada, FuncionarioResumo, LocalPrestacao, LocalPrestacaoEntrada,
  Lotacao, LotacaoEntrada, PaginaFuncionarios, TipoVinculo,
} from "@/contracts"
import { http, HttpResponse } from "msw"

import { validarIdentificador } from "@/lib/cnpj"
import { mascararCpf, somenteDigitos, validarCpf } from "@/lib/cpf"
import { addDays } from "@/lib/format"

import {
  db, estabelecimentoDoFuncionario, funcionarioNoEscopo, lotacaoVigente, nomeCurto, novoId, PERMISSOES,
  registrarArp, registrarAuditoria, salvar, type FuncionarioDb, type LotacaoDb, type UsuarioDb,
} from "../dados"
import { API, cenario, erro, esperar, exigirPermissao } from "../util"

const DIAS_PORTAL = 1825

const semAcento = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
const podeEditar = (u: UsuarioDb) => PERMISSOES[u.perfil].includes("funcionario.editar")

/** O usuário pode cadastrar/transferir para esta unidade? (administrador, RH com "todas" ou unidade no escopo) */
const unidadeNoEscopo = (u: UsuarioDb, unidadeId: string) =>
  u.perfil === "administrador" || u.escopo.todas_unidades || u.escopo.unidade_ids.includes(unidadeId)

function lotacaoContrato(l: LotacaoDb): Lotacao {
  return {
    id: l.id, unidade_id: l.unidade_id, setor_id: l.setor_id, inicio: l.inicio, fim: l.fim,
    unidade_nome: db.unidades.find((u) => u.id === l.unidade_id)?.nome ?? "?",
    setor_nome: db.setores.find((s) => s.id === l.setor_id)?.nome ?? "?",
  }
}

function resumo(f: FuncionarioDb): FuncionarioResumo {
  const lot = lotacaoVigente(db, f.id)
  return {
    id: f.id, nome: f.nome, cpf_mascarado: mascararCpf(f.cpf), matricula: f.matricula,
    situacao: f.desligado_em ? "desligado" : "ativo", tipo_registro: f.tipo_registro,
    unidade_nome: db.unidades.find((u) => u.id === lot?.unidade_id)?.nome ?? "—",
    setor_nome: db.setores.find((s) => s.id === lot?.setor_id)?.nome ?? "—",
  }
}

export function fichaCompleta(f: FuncionarioDb, u: UsuarioDb): Funcionario {
  const lots = db.lotacoes.filter((l) => l.funcionario_id === f.id).sort((a, b) => b.inicio.localeCompare(a.inicio))
  const atual = f.desligado_em ? undefined : lotacaoVigente(db, f.id)
  return {
    id: f.id, nome: f.nome, cpf: podeEditar(u) ? f.cpf : mascararCpf(f.cpf), matricula: f.matricula,
    admitido_em: f.admitido_em, desligado_em: f.desligado_em, situacao: f.desligado_em ? "desligado" : "ativo",
    tipo_vinculo: db.tiposVinculo.find((t) => t.id === f.tipo_vinculo_id)!, tipo_registro: f.tipo_registro,
    email: f.email, lotacao_atual: atual ? lotacaoContrato(atual) : null, lotacoes: lots.map(lotacaoContrato),
    locais_prestacao: db.locais.filter((l) => l.funcionario_id === f.id).map((l) => {
      const { funcionario_id, ...local } = l
      void funcionario_id
      return local
    }),
    portal_acesso_ate: f.desligado_em ? addDays(f.desligado_em, DIAS_PORTAL) : null,
    vinculo_anterior_id: f.vinculo_anterior_id,
  }
}

/** Busca o funcionário respeitando o escopo: fora do escopo responde como "não encontrado" e audita. */
export function funcionarioVisivel(u: UsuarioDb, id: string, acao: string) {
  const f = db.funcionarios.find((x) => x.id === id)
  if (!f || !funcionarioNoEscopo(db, u, f.id)) {
    if (f) registrarAuditoria(db, u, "acesso.negado", "negado", { tipo: "funcionario", id }, { acao })
    salvar()
    return null
  }
  return f
}

export const funcionariosHandlers = [
  // ---------------- Tipos de vínculo (lista configurável, FR-020) ----------------
  http.get(`${API}/tipos-vinculo`, async () => {
    await esperar()
    const r = exigirPermissao("funcionario.ler", "tipo_vinculo.listar")
    if ("resposta" in r) return r.resposta
    return HttpResponse.json(db.tiposVinculo)
  }),

  http.post(`${API}/tipos-vinculo`, async ({ request }) => {
    const r = exigirPermissao("estrutura.editar", "tipo_vinculo.criar")
    if ("resposta" in r) return r.resposta
    const { nome } = (await request.json()) as { nome: string }
    if (!nome?.trim()) return erro(400, "Informe o nome.", { campo: "nome" })
    if (db.tiposVinculo.some((t) => semAcento(t.nome) === semAcento(nome.trim()))) return erro(409, "Este tipo já existe.", { campo: "nome" })
    const tipo: TipoVinculo = { id: novoId(), nome: nome.trim(), ativo: true }
    db.tiposVinculo.push(tipo)
    registrarAuditoria(db, r.usuario, "tipo_vinculo.criar", "permitido", { tipo: "tipo_vinculo", id: tipo.id })
    salvar()
    return HttpResponse.json(tipo, { status: 201 })
  }),

  // ---------------- Lista ----------------
  http.get(`${API}/funcionarios`, async ({ request }) => {
    await esperar()
    const r = exigirPermissao("funcionario.ler", "funcionario.listar")
    if ("resposta" in r) return r.resposta
    const c = cenario()
    if (c === "erro") return erro(500, "Falha simulada ao carregar.")
    const q = new URL(request.url).searchParams
    const busca = (q.get("busca") ?? "").trim()
    const situacao = q.get("situacao") ?? "ativo"
    const pagina = Math.max(1, Number(q.get("pagina") ?? 1))
    const porPagina = Math.min(100, Math.max(1, Number(q.get("por_pagina") ?? 50)))

    const digitos = somenteDigitos(busca)
    const texto = semAcento(busca)
    let lista = db.funcionarios.filter((f) => funcionarioNoEscopo(db, r.usuario, f.id))
    if (situacao !== "todos") lista = lista.filter((f) => (situacao === "desligado" ? !!f.desligado_em : !f.desligado_em))
    if (q.get("tipo_registro")) lista = lista.filter((f) => f.tipo_registro === q.get("tipo_registro"))
    if (q.get("unidade_id")) lista = lista.filter((f) => lotacaoVigente(db, f.id)?.unidade_id === q.get("unidade_id"))
    if (q.get("setor_id")) lista = lista.filter((f) => lotacaoVigente(db, f.id)?.setor_id === q.get("setor_id"))
    if (busca) {
      lista = lista.filter((f) =>
        semAcento(f.nome).includes(texto) || f.matricula.toLowerCase().startsWith(busca.toLowerCase())
        || (digitos.length >= 3 && f.cpf.includes(digitos)))
    }
    lista.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))

    // Princípio IV: listar dados pessoais também é auditado, sem guardar o texto buscado quando é um CPF.
    registrarAuditoria(db, r.usuario, "funcionario.listar", "permitido", null, {
      situacao, busca: busca ? (digitos.length >= 3 ? "[número]" : busca) : null, total: lista.length,
    })
    salvar()

    const itens = c === "vazio" ? [] : lista.slice((pagina - 1) * porPagina, pagina * porPagina).map(resumo)
    const resposta: PaginaFuncionarios = { itens, total: c === "vazio" ? 0 : lista.length, pagina, por_pagina: porPagina }
    return HttpResponse.json(resposta)
  }),

  // ---------------- Cadastro ----------------
  http.post(`${API}/funcionarios`, async ({ request }) => {
    await esperar()
    const r = exigirPermissao("funcionario.editar", "funcionario.criar")
    if ("resposta" in r) return r.resposta
    const corpo = (await request.json()) as FuncionarioEntrada
    const cpf = somenteDigitos(corpo.cpf)
    const nome = corpo.nome?.trim() ?? ""
    const matricula = corpo.matricula?.trim() ?? ""

    if (nome.length < 3) return erro(400, "Informe o nome completo.", { campo: "nome" })
    if (!validarCpf(cpf)) return erro(400, "CPF inválido. Confira os números.", { campo: "cpf", codigo: "cpf_invalido" })
    if (!matricula) return erro(400, "Informe a matrícula.", { campo: "matricula" })
    if (!corpo.admitido_em) return erro(400, "Informe a data de admissão.", { campo: "admitido_em" })
    if (!db.tiposVinculo.some((t) => t.id === corpo.tipo_vinculo_id)) return erro(400, "Escolha o tipo de vínculo.", { campo: "tipo_vinculo_id" })

    const unidade = db.unidades.find((u) => u.id === corpo.lotacao?.unidade_id)
    const setor = db.setores.find((s) => s.id === corpo.lotacao?.setor_id)
    if (!unidade) return erro(400, "Escolha a unidade.", { campo: "unidade_id" })
    if (!setor || setor.unidade_id !== unidade.id) return erro(400, "Escolha um setor desta unidade.", { campo: "setor_id" })
    if (!unidadeNoEscopo(r.usuario, unidade.id)) {
      registrarAuditoria(db, r.usuario, "acesso.negado", "negado", { tipo: "unidade", id: unidade.id }, { acao: "funcionario.criar" })
      salvar()
      return erro(403, "Você não pode cadastrar funcionários nesta unidade.", { campo: "unidade_id" })
    }

    const existente = db.funcionarios.find((f) => f.cpf === cpf && !f.desligado_em)
    if (existente) {
      // Só revela qual é o funcionário se ele estiver no escopo de quem está cadastrando.
      return funcionarioNoEscopo(db, r.usuario, existente.id)
        ? erro(409, "Já existe um funcionário ativo com este CPF.", { campo: "cpf", codigo: "cpf_ja_ativo", funcionario_id: existente.id })
        : erro(409, "CPF já cadastrado em outra unidade. Procure o administrador.", { campo: "cpf", codigo: "cpf_ja_ativo" })
    }
    if (db.funcionarios.some((f) => f.empresa_id === unidade.empresa_id && f.matricula.toLowerCase() === matricula.toLowerCase())) {
      return erro(409, "Esta matrícula já está em uso nesta empresa.", { campo: "matricula", codigo: "matricula_em_uso" })
    }

    const f: FuncionarioDb = {
      id: novoId(), empresa_id: unidade.empresa_id, nome, cpf, matricula, admitido_em: corpo.admitido_em, desligado_em: null,
      tipo_vinculo_id: corpo.tipo_vinculo_id, tipo_registro: corpo.tipo_registro, email: corpo.email?.trim() || null,
      vinculo_anterior_id: corpo.vinculo_anterior_id ?? null, biometria_exclusao_pendente: false,
    }
    db.funcionarios.push(f)
    db.lotacoes.push({ id: novoId(), funcionario_id: f.id, unidade_id: unidade.id, setor_id: setor.id, inicio: corpo.admitido_em, fim: null })
    registrarArp(db, unidade.estabelecimento_id, "empregado_inclusao", r.usuario, `Inclusão de empregado: ${nomeCurto(nome)}`)
    registrarAuditoria(db, r.usuario, "funcionario.criar", "permitido", { tipo: "funcionario", id: f.id })
    salvar()
    return HttpResponse.json(fichaCompleta(f, r.usuario), { status: 201 })
  }),

  // ---------------- Ficha ----------------
  http.get(`${API}/funcionarios/:id`, async ({ params }) => {
    await esperar()
    const r = exigirPermissao("funcionario.ler", "funcionario.ver")
    if ("resposta" in r) return r.resposta
    const f = funcionarioVisivel(r.usuario, String(params.id), "funcionario.ver")
    if (!f) return erro(404, "Funcionário não encontrado.")
    registrarAuditoria(db, r.usuario, "funcionario.ver", "permitido", { tipo: "funcionario", id: f.id })
    salvar()
    return HttpResponse.json(fichaCompleta(f, r.usuario))
  }),

  http.patch(`${API}/funcionarios/:id`, async ({ request, params }) => {
    await esperar()
    const r = exigirPermissao("funcionario.editar", "funcionario.alterar")
    if ("resposta" in r) return r.resposta
    const f = funcionarioVisivel(r.usuario, String(params.id), "funcionario.alterar")
    if (!f) return erro(404, "Funcionário não encontrado.")
    const corpo = (await request.json()) as FuncionarioAlteracao
    if (corpo.nome !== undefined && corpo.nome.trim().length < 3) return erro(400, "Informe o nome completo.", { campo: "nome" })
    if (corpo.tipo_vinculo_id && !db.tiposVinculo.some((t) => t.id === corpo.tipo_vinculo_id)) {
      return erro(400, "Escolha o tipo de vínculo.", { campo: "tipo_vinculo_id" })
    }
    const mudouNome = corpo.nome !== undefined && corpo.nome.trim() !== f.nome
    if (corpo.nome !== undefined) f.nome = corpo.nome.trim()
    if (corpo.tipo_vinculo_id) f.tipo_vinculo_id = corpo.tipo_vinculo_id
    if (corpo.tipo_registro) f.tipo_registro = corpo.tipo_registro
    if (corpo.email !== undefined) f.email = corpo.email?.trim() || null
    // Dados do empregado que vão para o AFD (nome) geram alteração no ARP; o resto fica só na auditoria.
    if (mudouNome) {
      registrarArp(db, estabelecimentoDoFuncionario(db, f.id)!, "empregado_alteracao", r.usuario, `Alteração de empregado: ${nomeCurto(f.nome)}`)
    }
    registrarAuditoria(db, r.usuario, "funcionario.alterar", "permitido", { tipo: "funcionario", id: f.id }, { campos: Object.keys(corpo) })
    salvar()
    return HttpResponse.json(fichaCompleta(f, r.usuario))
  }),

  // ---------------- Transferência ----------------
  http.post(`${API}/funcionarios/:id/lotacoes`, async ({ request, params }) => {
    await esperar()
    const r = exigirPermissao("funcionario.editar", "funcionario.transferir")
    if ("resposta" in r) return r.resposta
    const f = funcionarioVisivel(r.usuario, String(params.id), "funcionario.transferir")
    if (!f) return erro(404, "Funcionário não encontrado.")
    if (f.desligado_em) return erro(400, "Funcionário desligado não pode ser transferido.")
    const corpo = (await request.json()) as LotacaoEntrada
    const unidade = db.unidades.find((u) => u.id === corpo.unidade_id)
    const setor = db.setores.find((s) => s.id === corpo.setor_id)
    if (!unidade) return erro(400, "Escolha a unidade.", { campo: "unidade_id" })
    if (!setor || setor.unidade_id !== unidade.id) return erro(400, "Escolha um setor desta unidade.", { campo: "setor_id" })
    if (!unidadeNoEscopo(r.usuario, unidade.id)) return erro(403, "Você não pode transferir para esta unidade.", { campo: "unidade_id" })
    const atual = lotacaoVigente(db, f.id)!
    if (!corpo.inicio || corpo.inicio <= atual.inicio) {
      return erro(400, "A nova lotação precisa começar depois do início da lotação atual.", { campo: "inicio" })
    }
    if (atual.unidade_id === unidade.id && atual.setor_id === setor.id) {
      return erro(400, "O funcionário já está nesta unidade e setor.", { campo: "setor_id" })
    }

    const estAntigo = db.unidades.find((u) => u.id === atual.unidade_id)!.estabelecimento_id
    atual.fim = addDays(corpo.inicio, -1)
    const nova: LotacaoDb = { id: novoId(), funcionario_id: f.id, unidade_id: unidade.id, setor_id: setor.id, inicio: corpo.inicio, fim: null }
    db.lotacoes.push(nova)
    // Mudou de estabelecimento: o empregado sai de uma sequência de NSR e entra na outra.
    if (estAntigo !== unidade.estabelecimento_id) {
      registrarArp(db, estAntigo, "empregado_exclusao", r.usuario, `Exclusão de empregado (transferência): ${nomeCurto(f.nome)}`)
      registrarArp(db, unidade.estabelecimento_id, "empregado_inclusao", r.usuario, `Inclusão de empregado (transferência): ${nomeCurto(f.nome)}`)
    }
    registrarAuditoria(db, r.usuario, "funcionario.transferir", "permitido", { tipo: "funcionario", id: f.id }, { inicio: corpo.inicio })
    salvar()
    return HttpResponse.json(lotacaoContrato(nova), { status: 201 })
  }),

  // ---------------- Local de prestação (FR-005) ----------------
  http.post(`${API}/funcionarios/:id/locais-prestacao`, async ({ request, params }) => {
    await esperar()
    const r = exigirPermissao("funcionario.editar", "funcionario.local_prestacao")
    if ("resposta" in r) return r.resposta
    const f = funcionarioVisivel(r.usuario, String(params.id), "funcionario.local_prestacao")
    if (!f) return erro(404, "Funcionário não encontrado.")
    const corpo = (await request.json()) as LocalPrestacaoEntrada
    if (!corpo.descricao?.trim()) return erro(400, "Descreva o local.", { campo: "descricao" })
    if (!corpo.inicio) return erro(400, "Informe o início.", { campo: "inicio" })
    if (corpo.fim && corpo.fim < corpo.inicio) return erro(400, "O fim não pode ser antes do início.", { campo: "fim" })
    if (corpo.tomador_tipo_identificador && !validarIdentificador(corpo.tomador_tipo_identificador, corpo.tomador_identificador ?? "")) {
      return erro(400, "Identificador do tomador inválido.", { campo: "tomador_identificador" })
    }
    const sobrepoe = db.locais.some((l) => l.funcionario_id === f.id
      && l.inicio <= (corpo.fim ?? "9999-12-31") && (l.fim ?? "9999-12-31") >= corpo.inicio)
    if (sobrepoe) return erro(409, "Já existe um local de prestação neste período.", { campo: "inicio" })
    const local: LocalPrestacao = {
      id: novoId(), descricao: corpo.descricao.trim(), tomador_tipo_identificador: corpo.tomador_tipo_identificador ?? null,
      tomador_identificador: corpo.tomador_identificador ? somenteDigitos(corpo.tomador_identificador) : null,
      endereco: { ...corpo.endereco, cep: somenteDigitos(corpo.endereco.cep) }, inicio: corpo.inicio, fim: corpo.fim ?? null,
    }
    db.locais.push({ ...local, funcionario_id: f.id })
    registrarAuditoria(db, r.usuario, "funcionario.local_prestacao", "permitido", { tipo: "funcionario", id: f.id })
    salvar()
    return HttpResponse.json(local, { status: 201 })
  }),
]

