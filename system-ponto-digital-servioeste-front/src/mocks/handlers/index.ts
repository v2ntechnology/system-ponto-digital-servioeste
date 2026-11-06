// Junta os handlers simulados de todas as áreas. Cada fase da feature acrescenta os seus aqui.
import { authHandlers } from "./auth"
import { estruturaHandlers } from "./estrutura"
import { funcionariosHandlers } from "./funcionarios"

export const handlers = [...authHandlers, ...estruturaHandlers, ...funcionariosHandlers]
