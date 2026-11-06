// Banco SIMULADO em memória, usado só em desenvolvimento (VITE_MOCK=true) e nos testes.
// Todos os nomes, CPFs e CNPJs são fictícios e gerados aqui. Nenhuma foto. Nunca vai para produção (Princípio XII).
import type {
  Endereco, EventoArp, Feriado, LocalPrestacao, Perfil, RegistroAuditoria, Setor, TipoRegistro, TipoVinculo,
  Escopo, Estabelecimento, Empresa, Unidade,
} from "@/contracts"

import { digitosVerificadores } from "@/lib/cpf"

// ---------------------------------------------------------------------------------------------------------------
// Tipos internos (o que o "servidor" simulado guarda)

export type FuncionarioDb = {
  id: string
  empresa_id: string
  nome: string
  cpf: string
  matricula: string
  admitido_em: string
  desligado_em: string | null
  tipo_vinculo_id: string
  tipo_registro: TipoRegistro
  email: string | null
  vinculo_anterior_id: string | null
  biometria_exclusao_pendente: boolean
}

export type LotacaoDb = { id: string; funcionario_id: string; unidade_id: string; setor_id: string; inicio: string; fim: string | null }
export type LocalDb = LocalPrestacao & { funcionario_id: string }
export type UsuarioDb = {
  id: string
  email: string
  nome: string
  cpf: string | null
  perfil: Perfil
  senha: string
  escopo: Escopo
  ativo: boolean
  mfa_cadastrado: boolean
}
export type EventoArpDb = EventoArp & { estabelecimento_id: string }
export type Sessao = { usuario_id: string; mfa_pendente: boolean }

export type Banco = {
  empresas: Empresa[]
  estabelecimentos: Estabelecimento[]
  unidades: Unidade[]
  setores: Setor[]
  tiposVinculo: TipoVinculo[]
  funcionarios: FuncionarioDb[]
  lotacoes: LotacaoDb[]
  locais: LocalDb[]
  feriados: Feriado[]
  usuarios: UsuarioDb[]
  auditoria: RegistroAuditoria[]
  arp: EventoArpDb[]
  sessao: Sessao | null
}

// ---------------------------------------------------------------------------------------------------------------
// Permissões por perfil (mesma matriz de data-model.md)

export const PERMISSOES: Record<Perfil, string[]> = {
  administrador: [
    "estrutura.ler", "estrutura.editar", "funcionario.ler", "funcionario.editar", "funcionario.desligar",
    "feriado.editar", "usuario.gerenciar", "auditoria.ler",
  ],
  rh: ["estrutura.ler", "funcionario.ler", "funcionario.editar", "funcionario.desligar", "feriado.editar", "atestado.abrir"],
  gestor: ["estrutura.ler", "funcionario.ler"],
}

export const SENHA_TESTE = "senha-de-teste"
export const CODIGO_MFA_TESTE = "000000"

// ---------------------------------------------------------------------------------------------------------------
// Geradores de dados fictícios

let contadorId = 0
/** UUID previsível nos dados iniciais (facilita testes); aleatório depois. */
export const novoId = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `id-${++contadorId}`)
const idFixo = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`

/** CPF fictício válido a partir de um número (sempre o mesmo para o mesmo número). */
export function cpfFicticio(n: number) {
  const nove = String(100_000_000 + ((n * 7_919_301) % 899_999_999)).slice(0, 9)
  return nove + digitosVerificadores(nove)
}

function dvCnpj(base: string) {
  const pesos = base.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const soma = base.split("").reduce((s, d, i) => s + Number(d) * pesos[i], 0)
  const resto = soma % 11
  return resto < 2 ? 0 : 11 - resto
}
/** CNPJ fictício válido (raiz 99.xxx.xxx, que não pertence à Servioeste). */
export function cnpjFicticio(raiz: number, filial: number) {
  const base = `99${String(raiz).padStart(6, "0")}${String(filial).padStart(4, "0")}`
  const d1 = dvCnpj(base)
  return base + d1 + dvCnpj(base + d1)
}

/** "Hash" de demonstração com 64 caracteres hexadecimais. O real (SHA-256) é feito pela API. */
export function hashFicticio(texto: string) {
  let h1 = 0x811c9dc5
  let h2 = 0x01000193
  let out = ""
  for (let rodada = 0; out.length < 64; rodada++) {
    for (let i = 0; i < texto.length; i++) {
      h1 = Math.imul(h1 ^ texto.charCodeAt(i), 16777619) >>> 0
      h2 = Math.imul(h2 ^ (texto.charCodeAt(i) + rodada), 2246822519) >>> 0
    }
    out += h1.toString(16).padStart(8, "0") + h2.toString(16).padStart(8, "0")
  }
  return out.slice(0, 64)
}

const endereco = (logradouro: string, cidade: string, uf: string, cep: string): Endereco => ({
  logradouro, numero: "100", complemento: null, bairro: "Centro", cidade, uf, cep,
})

// ---------------------------------------------------------------------------------------------------------------
// Dados iniciais

const NOMES = [
  "Ana Paula Ferreira", "Bruno Henrique Costa", "Carla Souza Lima", "Diego Martins Rocha", "Eduarda Alves Pinto",
  "Fábio Ribeiro Nunes", "Gabriela Teixeira Melo", "Henrique Duarte Silva", "Isabela Moreira Campos",
  "João Victor Cardoso", "Karina Lopes Batista", "Lucas Gomes Barbosa",
]

function bancoInicial(): Banco {
  const empresa: Empresa = {
    id: idFixo(1), tipo_identificador: "cnpj", identificador: cnpjFicticio(123456, 1),
    razao_social: "Empresa Fictícia de Testes Ltda", ativo: true,
  }
  const estabSc: Estabelecimento = {
    id: idFixo(11), empresa_id: empresa.id, tipo_identificador: "cnpj", identificador: cnpjFicticio(123456, 1),
    razao_social: "Empresa Fictícia de Testes Ltda (São Cristóvão)", ativo: true, ultimo_nsr: 0,
    endereco: endereco("Rua das Palmeiras", "Chapecó", "SC", "89800000"),
  }
  const estabTeste: Estabelecimento = {
    id: idFixo(12), empresa_id: empresa.id, tipo_identificador: "cnpj", identificador: cnpjFicticio(123456, 2),
    razao_social: "Empresa Fictícia de Testes Ltda (Filial Teste)", ativo: true, ultimo_nsr: 0,
    endereco: endereco("Avenida Brasil", "Xanxerê", "SC", "89820000"),
  }
  const uSc: Unidade = {
    id: idFixo(21), empresa_id: empresa.id, estabelecimento_id: estabSc.id, nome: "São Cristóvão",
    endereco: estabSc.endereco, municipio_ibge: "4204202", ativo: true,
  }
  const uTeste: Unidade = {
    id: idFixo(22), empresa_id: empresa.id, estabelecimento_id: estabTeste.id, nome: "Unidade Teste",
    endereco: estabTeste.endereco, municipio_ibge: "4219507", ativo: true,
  }
  const sAdm: Setor = { id: idFixo(31), unidade_id: uSc.id, nome: "Administrativo", ativo: true }
  const sOpe: Setor = { id: idFixo(32), unidade_id: uSc.id, nome: "Operacional", ativo: true }
  const sOpeTeste: Setor = { id: idFixo(33), unidade_id: uTeste.id, nome: "Operacional", ativo: true }

  const tiposVinculo: TipoVinculo[] = ["CLT", "Estágio", "Aprendiz", "Temporário"].map((nome, i) => ({
    id: idFixo(41 + i), nome, ativo: true,
  }))

  const usuarios: UsuarioDb[] = [
    {
      id: idFixo(51), email: "admin@exemplo.test", nome: "Administrador de Teste", cpf: cpfFicticio(9001),
      perfil: "administrador", senha: SENHA_TESTE, ativo: true, mfa_cadastrado: true,
      escopo: { todas_unidades: false, unidade_ids: [], setor_ids: [] },
    },
    {
      id: idFixo(52), email: "rh@exemplo.test", nome: "RH de Teste", cpf: cpfFicticio(9002),
      perfil: "rh", senha: SENHA_TESTE, ativo: true, mfa_cadastrado: false,
      escopo: { todas_unidades: false, unidade_ids: [uSc.id], setor_ids: [] },
    },
    {
      id: idFixo(53), email: "gestor@exemplo.test", nome: "Gestor de Teste", cpf: null,
      perfil: "gestor", senha: SENHA_TESTE, ativo: true, mfa_cadastrado: false,
      escopo: { todas_unidades: false, unidade_ids: [], setor_ids: [sOpe.id] },
    },
  ]

  // 8 em São Cristóvão (4 Administrativo, 4 Operacional) e 4 na Unidade Teste.
  const funcionarios: FuncionarioDb[] = []
  const lotacoes: LotacaoDb[] = []
  NOMES.forEach((nome, i) => {
    const [unidade, setor] = i < 4 ? [uSc, sAdm] : i < 8 ? [uSc, sOpe] : [uTeste, sOpeTeste]
    const id = idFixo(100 + i)
    const admitido = `202${i % 5}-0${(i % 9) + 1}-1${i % 9}`
    funcionarios.push({
      id, empresa_id: empresa.id, nome, cpf: cpfFicticio(i + 1), matricula: String(1001 + i), admitido_em: admitido,
      desligado_em: null, tipo_vinculo_id: tiposVinculo[0].id, tipo_registro: setor.nome === "Operacional" ? "app" : "tablet",
      email: null, vinculo_anterior_id: null, biometria_exclusao_pendente: false,
    })
    lotacoes.push({ id: idFixo(200 + i), funcionario_id: id, unidade_id: unidade.id, setor_id: setor.id, inicio: admitido, fim: null })
  })

  const feriados: Feriado[] = []
  const fixos: [string, string][] = [
    ["01-01", "Confraternização Universal"], ["04-21", "Tiradentes"], ["05-01", "Dia do Trabalho"],
    ["09-07", "Independência do Brasil"], ["10-12", "Nossa Senhora Aparecida"], ["11-02", "Finados"],
    ["11-15", "Proclamação da República"], ["11-20", "Dia Nacional de Zumbi e da Consciência Negra"], ["12-25", "Natal"],
  ]
  for (const ano of [2026, 2027]) {
    for (const [md, nome] of fixos) {
      feriados.push({ id: novoId(), data: `${ano}-${md}`, nome, abrangencia: "nacional", uf: null, municipio_ibge: null, unidade_id: null, ativo: true })
    }
  }
  feriados.push(
    { id: novoId(), data: "2026-04-03", nome: "Paixão de Cristo", abrangencia: "nacional", uf: null, municipio_ibge: null, unidade_id: null, ativo: true },
    { id: novoId(), data: "2027-03-26", nome: "Paixão de Cristo", abrangencia: "nacional", uf: null, municipio_ibge: null, unidade_id: null, ativo: true },
  )

  const banco: Banco = {
    empresas: [empresa], estabelecimentos: [estabSc, estabTeste], unidades: [uSc, uTeste], setores: [sAdm, sOpe, sOpeTeste],
    tiposVinculo, funcionarios, lotacoes, locais: [], feriados, usuarios, auditoria: [], arp: [], sessao: null,
  }

  // Eventos iniciais do ARP: inclusão do empregador e dos empregados, por estabelecimento.
  const admin = usuarios[0]
  for (const est of banco.estabelecimentos) registrarArp(banco, est.id, "empregador_inclusao", admin, `Inclusão do empregador: ${est.razao_social}`)
  for (const f of funcionarios) {
    registrarArp(banco, estabelecimentoDoFuncionario(banco, f.id)!, "empregado_inclusao", admin, `Inclusão de empregado: ${nomeCurto(f.nome)}`)
  }
  return banco
}

// ---------------------------------------------------------------------------------------------------------------
// Persistência na aba (sobrevive a recarregar a página; some ao fechar a aba)

const CHAVE = "ponto-mock-banco"

function carregar(): Banco {
  try {
    const salvo = sessionStorage.getItem(CHAVE)
    if (salvo) return JSON.parse(salvo) as Banco
  } catch {
    /* sem storage */
  }
  return bancoInicial()
}

export let db: Banco = carregar()

export function salvar() {
  try {
    sessionStorage.setItem(CHAVE, JSON.stringify(db))
  } catch {
    /* sem storage */
  }
}

/** Volta aos dados iniciais (usado nos testes e no botão "Recomeçar dados simulados"). */
export function resetarBanco() {
  db = bancoInicial()
  salvar()
}

// ---------------------------------------------------------------------------------------------------------------
// Regras compartilhadas pelos handlers

// Declaradas como function (não const) porque o banco inicial é montado ao carregar o módulo.
export function hojeIso() {
  return new Date().toISOString().slice(0, 10)
}

export function nomeCurto(nome: string) {
  const p = nome.trim().split(/\s+/)
  return p.length > 1 ? `${p[0]} ${p[p.length - 1][0]}.` : p[0]
}

export function lotacaoVigente(banco: Banco, funcionarioId: string, data = hojeIso()) {
  return banco.lotacoes.find((l) => l.funcionario_id === funcionarioId && l.inicio <= data && (l.fim === null || l.fim >= data))
    // desligado: vale a última lotação
    ?? banco.lotacoes.filter((l) => l.funcionario_id === funcionarioId).sort((a, b) => b.inicio.localeCompare(a.inicio))[0]
}

export function estabelecimentoDoFuncionario(banco: Banco, funcionarioId: string) {
  const lot = lotacaoVigente(banco, funcionarioId)
  return banco.unidades.find((u) => u.id === lot?.unidade_id)?.estabelecimento_id
}

/** O usuário enxerga o funcionário? (lotação vigente dentro do escopo; administrador vê tudo) */
export function funcionarioNoEscopo(banco: Banco, usuario: UsuarioDb, funcionarioId: string) {
  if (usuario.perfil === "administrador" || usuario.escopo.todas_unidades) return true
  const lot = lotacaoVigente(banco, funcionarioId)
  if (!lot) return false
  return usuario.escopo.unidade_ids.includes(lot.unidade_id) || usuario.escopo.setor_ids.includes(lot.setor_id)
}

/** Unidades que o usuário enxerga (gestor por setor também enxerga a unidade do setor). */
export function unidadesNoEscopo(banco: Banco, usuario: UsuarioDb) {
  if (usuario.perfil === "administrador" || usuario.escopo.todas_unidades) return banco.unidades
  const doSetor = banco.setores.filter((s) => usuario.escopo.setor_ids.includes(s.id)).map((s) => s.unidade_id)
  return banco.unidades.filter((u) => usuario.escopo.unidade_ids.includes(u.id) || doSetor.includes(u.id))
}

export function registrarAuditoria(
  banco: Banco,
  usuario: UsuarioDb | null,
  acao: string,
  resultado: "permitido" | "negado",
  objeto?: { tipo: string; id: string } | null,
  detalhes: Record<string, unknown> = {},
) {
  const anterior = banco.auditoria[banco.auditoria.length - 1]
  const seq = (anterior?.seq ?? 0) + 1
  banco.auditoria.push({
    id: novoId(), seq, usuario_id: usuario?.id ?? null, usuario_nome: usuario?.nome ?? null, acao,
    objeto_tipo: objeto?.tipo ?? null, objeto_id: objeto?.id ?? null, resultado, detalhes, ip: "127.0.0.1",
    ocorrido_em: new Date().toISOString(),
  })
}

export function registrarArp(banco: Banco, estabelecimentoId: string, tipo: EventoArp["tipo"], responsavel: UsuarioDb, resumo: string) {
  const est = banco.estabelecimentos.find((e) => e.id === estabelecimentoId)
  if (!est) return
  const anteriores = banco.arp.filter((e) => e.estabelecimento_id === estabelecimentoId)
  const hashAnterior = anteriores[anteriores.length - 1]?.hash ?? "0".repeat(64)
  const nsr = est.ultimo_nsr + 1
  est.ultimo_nsr = nsr
  const ocorrido = new Date().toISOString()
  banco.arp.push({
    estabelecimento_id: estabelecimentoId, nsr, tipo, ocorrido_em: ocorrido, responsavel_nome: responsavel.nome, resumo,
    hash_anterior: hashAnterior, hash: hashFicticio(`${hashAnterior}|${nsr}|${tipo}|${resumo}|${ocorrido}`),
  })
}
