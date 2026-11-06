// Junta os handlers simulados de todas as áreas. Cada fase da feature acrescenta os seus aqui.
import { authHandlers } from "./auth"

export const handlers = [...authHandlers]
