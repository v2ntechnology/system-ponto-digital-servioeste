import type { EventoArp } from "@/contracts"

/** Nomes das ações da auditoria. Ações sem nome aparecem com o código. */
export const NOME_ACAO: Record<string, string> = {
  "login": "Entrou", "login.falhou": "Login recusado", "logout": "Saiu", "mfa.verificado": "Confirmou o segundo fator",
  "mfa.falhou": "Código do segundo fator errado", "mfa.redefinido": "Segundo fator redefinido", "senha.alterada": "Trocou a senha",
  "acesso.negado": "Acesso negado",
  "empresa.criar": "Cadastrou empresa", "empresa.alterar": "Alterou empresa",
  "estabelecimento.criar": "Cadastrou estabelecimento", "estabelecimento.alterar": "Alterou estabelecimento",
  "unidade.criar": "Cadastrou unidade", "unidade.alterar": "Alterou unidade",
  "setor.criar": "Cadastrou setor", "setor.alterar": "Alterou setor",
  "funcionario.listar": "Listou funcionários", "funcionario.ver": "Abriu a ficha", "funcionario.criar": "Cadastrou funcionário",
  "funcionario.alterar": "Alterou funcionário", "funcionario.transferir": "Transferiu funcionário",
  "funcionario.local_prestacao": "Registrou local de prestação", "funcionario.desligar": "Desligou funcionário",
  "usuario.criar": "Criou usuário", "usuario.alterar": "Alterou usuário", "tipo_vinculo.criar": "Criou tipo de vínculo",
  "feriado.criar": "Cadastrou feriado", "feriado.alterar": "Alterou feriado",
}

export const FILTROS_ACAO = [
  { valor: "", rotulo: "Todas" },
  { valor: "acesso.negado", rotulo: "Acessos negados" },
  { valor: "login", rotulo: "Login e logout" },
  { valor: "mfa", rotulo: "Segundo fator" },
  { valor: "funcionario", rotulo: "Funcionários" },
  { valor: "usuario", rotulo: "Usuários" },
  { valor: "empresa", rotulo: "Empresas" },
  { valor: "estabelecimento", rotulo: "Estabelecimentos" },
  { valor: "unidade", rotulo: "Unidades" },
  { valor: "setor", rotulo: "Setores" },
  { valor: "feriado", rotulo: "Feriados" },
]

export const NOME_EVENTO_ARP: Record<EventoArp["tipo"], string> = {
  empregador_inclusao: "Inclusão do empregador", empregador_alteracao: "Alteração do empregador",
  empregado_inclusao: "Inclusão de empregado", empregado_alteracao: "Alteração de empregado", empregado_exclusao: "Exclusão de empregado",
}
