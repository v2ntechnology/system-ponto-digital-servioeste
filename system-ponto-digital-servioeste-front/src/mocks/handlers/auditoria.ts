// Handlers SIMULADOS da trilha de auditoria e dos eventos do ARP (só dev e testes). Somente leitura.
import { http, HttpResponse } from "msw"

import { db } from "../dados"
import { API, cenario, erro, esperar, exigirPermissao } from "../util"

export const auditoriaHandlers = [
  http.get(`${API}/auditoria`, async ({ request }) => {
    await esperar()
    const r = exigirPermissao("auditoria.ler", "auditoria.listar")
    if ("resposta" in r) return r.resposta
    if (cenario() === "erro") return erro(500, "Falha simulada ao carregar.")
    const q = new URL(request.url).searchParams
    const porPagina = Math.min(200, Number(q.get("por_pagina") ?? 50))
    const antes = q.get("antes_de")
    const lista = [...db.auditoria].reverse().filter((a) =>
      (!q.get("acao") || a.acao.startsWith(q.get("acao")!))
      && (!q.get("usuario_id") || a.usuario_id === q.get("usuario_id"))
      && (!q.get("objeto_id") || a.objeto_id === q.get("objeto_id"))
      && (!q.get("resultado") || a.resultado === q.get("resultado"))
      && (!antes || a.ocorrido_em < antes))
    return HttpResponse.json(cenario() === "vazio" ? [] : lista.slice(0, porPagina))
  }),

  http.get(`${API}/arp/eventos`, async ({ request }) => {
    await esperar()
    const r = exigirPermissao("auditoria.ler", "arp.listar")
    if ("resposta" in r) return r.resposta
    const q = new URL(request.url).searchParams
    const est = q.get("estabelecimento_id")
    if (!est) return erro(400, "Escolha o estabelecimento.", { campo: "estabelecimento_id" })
    const desde = Number(q.get("a_partir_nsr") ?? 1)
    const eventos = db.arp.filter((e) => e.estabelecimento_id === est && e.nsr >= desde)
      .map((e) => {
        const { estabelecimento_id, ...evento } = e
        void estabelecimento_id
        return evento
      })
    return HttpResponse.json(eventos)
  }),
]
