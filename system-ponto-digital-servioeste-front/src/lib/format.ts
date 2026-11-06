// Formatação de datas e textos em pt-BR (base: Servioeste Hub).

const longDateFmt = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", year: "numeric" })
const shortDateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
const dateTimeFmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" })
const timeFmt = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" })

/** Data sem hora ("AAAA-MM-DD") lida ao meio-dia, para o fuso não mudar o dia. */
const fromIsoDate = (iso: string) => new Date(`${iso}T12:00:00`)

/** "12 de set. de 2022" */
export const fmtLongDate = (iso: string) => longDateFmt.format(fromIsoDate(iso))
/** "12/09/2022" */
export const fmtDate = (iso: string) => shortDateFmt.format(fromIsoDate(iso))
/** "12/09/2022, 14:30" */
export const fmtDateTime = (iso: string) => dateTimeFmt.format(new Date(iso))
export const fmtTime = (d: Date | string) => timeFmt.format(new Date(d))

export const firstName = (name?: string) => name?.trim().split(/\s+/)[0] ?? ""

export const initials = (name = "") =>
  name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase()

/** Data de hoje como "AAAA-MM-DD" no fuso local. */
export const todayIso = (now = new Date()) =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`

/** Soma dias a uma data "AAAA-MM-DD". */
export const addDays = (iso: string, days: number) => {
  const d = fromIsoDate(iso)
  d.setDate(d.getDate() + days)
  return todayIso(d)
}
