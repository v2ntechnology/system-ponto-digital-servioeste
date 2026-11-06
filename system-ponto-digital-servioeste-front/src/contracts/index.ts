// Tipos da API gerados de ../system-ponto-digital-servioeste-back/contracts/openapi.yaml (fonte da verdade, no back).
// Não edite schema.d.ts à mão: rode `npm run contracts`.
import type { components, paths } from "./schema"

export type { components, paths }

type S = components["schemas"]

export type Erro = S["Erro"]
export type Perfil = S["Perfil"]
export type TipoRegistro = S["TipoRegistro"]
export type TipoIdentificador = S["TipoIdentificador"]
export type Endereco = S["Endereco"]

export type LoginEntrada = S["LoginEntrada"]
export type LoginResultado = S["LoginResultado"]
export type Escopo = S["Escopo"]
export type Eu = S["Eu"]

export type Empresa = S["Empresa"]
export type EmpresaEntrada = S["EmpresaEntrada"]
export type EmpresaAlteracao = S["EmpresaAlteracao"]
export type Estabelecimento = S["Estabelecimento"]
export type EstabelecimentoEntrada = S["EstabelecimentoEntrada"]
export type EstabelecimentoAlteracao = S["EstabelecimentoAlteracao"]
export type Unidade = S["Unidade"]
export type UnidadeEntrada = S["UnidadeEntrada"]
export type UnidadeAlteracao = S["UnidadeAlteracao"]
export type Setor = S["Setor"]
export type SetorEntrada = S["SetorEntrada"]
export type TipoVinculo = S["TipoVinculo"]

export type Funcionario = S["Funcionario"]
export type FuncionarioResumo = S["FuncionarioResumo"]
export type FuncionarioEntrada = S["FuncionarioEntrada"]
export type FuncionarioAlteracao = S["FuncionarioAlteracao"]
export type PaginaFuncionarios = S["PaginaFuncionarios"]
export type Lotacao = S["Lotacao"]
export type LotacaoEntrada = S["LotacaoEntrada"]
export type LocalPrestacao = S["LocalPrestacao"]
export type LocalPrestacaoEntrada = S["LocalPrestacaoEntrada"]

export type Feriado = S["Feriado"]
export type FeriadoEntrada = S["FeriadoEntrada"]

export type Usuario = S["Usuario"]
export type UsuarioEntrada = S["UsuarioEntrada"]
export type UsuarioAlteracao = S["UsuarioAlteracao"]

export type RegistroAuditoria = S["RegistroAuditoria"]
export type EventoArp = S["EventoArp"]
