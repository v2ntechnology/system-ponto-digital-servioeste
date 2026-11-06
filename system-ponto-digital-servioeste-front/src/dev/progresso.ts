import type { Fase, FeaturePlano, Tarefa } from "./tipos"

export const contar = (tarefas: Tarefa[]) => ({ feitas: tarefas.filter((t) => t.feita).length, total: tarefas.length })
export const tarefasDa = (f: FeaturePlano) => f.fases.flatMap((x) => x.tarefas)
/** Fase atual = a primeira que ainda tem tarefa por fazer. */
export const faseAtual = (f: FeaturePlano): Fase | undefined => f.fases.find((x) => x.tarefas.some((t) => !t.feita))
export const pct = (feitas: number, total: number) => (total ? Math.round((feitas / total) * 100) : 0)
