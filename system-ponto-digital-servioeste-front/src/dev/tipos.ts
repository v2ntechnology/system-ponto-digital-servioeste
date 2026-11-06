// Tipos da área de desenvolvimento (/dev). Usados pelo navegador e pelo plugin do Vite que lê os arquivos do projeto.
// Nada disto vai para produção.

export type Tarefa = {
  id: string
  feita: boolean
  paralela: boolean
  historia: string | null
  descricao: string
  fase: number
}

export type Fase = {
  numero: number
  titulo: string
  parte: string | null
  pontoDeControle: string | null
  tarefas: Tarefa[]
}

export type EtapaSpecKit = "nao_iniciada" | "especificada" | "planejada" | "com_tarefas"

export type FeaturePlano = {
  numero: string
  titulo: string
  objetivo: string
  dependeDe: string[]
  pendencias: string[]
  pastaSpec: string | null
  etapa: EtapaSpecKit
  historias: Record<string, string>
  fases: Fase[]
}

export type Plano = { features: FeaturePlano[] }

export type TipoCommit = "nova" | "atualizado" | "documentacao" | "manutencao" | "outro"
export type StatusArquivo = "adicionado" | "modificado" | "apagado" | "renomeado"

export type Commit = {
  hash: string
  curto: string
  data: string
  autor: string
  mensagem: string
  prefixo: string | null
  tipo: TipoCommit
  arquivos: { status: StatusArquivo; caminho: string; anterior?: string }[]
}

export type Pendencia = {
  codigo: string
  pergunta: string
  prazo: string
  resposta: string
  grupo: string
  features: string[]
}

export type Termo = { id: string; titulo: string; resumo: string; corpo: string }
