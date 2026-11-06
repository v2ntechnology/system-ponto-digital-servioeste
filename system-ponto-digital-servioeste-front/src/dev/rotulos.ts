import type { EtapaSpecKit, StatusArquivo, TipoCommit } from "./tipos"

export const NOME_ETAPA: Record<EtapaSpecKit, string> = {
  nao_iniciada: "Não iniciada", especificada: "Especificada", planejada: "Planejada", com_tarefas: "Em implementação",
}

export const NOME_TIPO_COMMIT: Record<TipoCommit, string> = {
  nova: "Nova funcionalidade", atualizado: "Atualizado", documentacao: "Documentação", manutencao: "Manutenção", outro: "Outro",
}

export const NOME_STATUS_ARQUIVO: Record<StatusArquivo, string> = {
  adicionado: "Novo", modificado: "Atualizado", apagado: "Apagado", renomeado: "Movido",
}
