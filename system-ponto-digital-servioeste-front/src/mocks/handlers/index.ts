// Junta os handlers simulados de todas as áreas. Cada fase da feature acrescenta os seus aqui.
import { auditoriaHandlers } from "./auditoria"
import { authHandlers } from "./auth"
import { estruturaHandlers } from "./estrutura"
import { funcionariosHandlers } from "./funcionarios"
import { usuariosHandlers } from "./usuarios"

export const handlers = [...authHandlers, ...estruturaHandlers, ...funcionariosHandlers, ...usuariosHandlers, ...auditoriaHandlers]
