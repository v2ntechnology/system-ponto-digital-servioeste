"""NSR: sequência própria por estabelecimento, começando em 1, de 1 em 1, sem lacunas (FR-005 da feature 003)."""
import asyncio

from sqlalchemy import select

from app.models import ArpEvento
from app.rep.arp import gravar_evento
from app.rep.nsr import proximo_nsr
from tests.arp.apoio import cenario


async def _nsrs(db, est_id):
    return list((await db.execute(select(ArpEvento.nsr).where(ArpEvento.estabelecimento_id == est_id)
                                  .order_by(ArpEvento.nsr))).scalars())


async def test_comeca_em_1_e_sobe_de_1_em_1(db, fabrica):
    est, _, admin = await cenario(fabrica)
    for _ in range(3):
        await gravar_evento(db, est.id, "empregado_inclusao", admin, {"nome": "X"})
    await db.commit()
    assert await _nsrs(db, est.id) == [1, 2, 3]


async def test_sequencias_independentes_por_estabelecimento(db, fabrica):
    est, outro, admin = await cenario(fabrica)
    await gravar_evento(db, est.id, "empregador_inclusao", admin, {})
    await gravar_evento(db, est.id, "empregado_inclusao", admin, {})
    await gravar_evento(db, outro.id, "empregador_inclusao", admin, {})
    await db.commit()
    assert await _nsrs(db, est.id) == [1, 2]
    assert await _nsrs(db, outro.id) == [1]


async def test_transacao_desfeita_nao_deixa_lacuna(db, fabrica):
    est, _, admin = await cenario(fabrica)
    await gravar_evento(db, est.id, "empregador_inclusao", admin, {})
    await db.commit()
    assert await proximo_nsr(db, est.id) == 2
    await db.rollback()  # o 2 foi "reservado" e desfeito
    await gravar_evento(db, est.id, "empregado_inclusao", admin, {})
    await db.commit()
    assert await _nsrs(db, est.id) == [1, 2]


async def test_vinte_gravacoes_simultaneas_sem_lacuna_nem_repeticao(db, fabrica, fabrica_sessao):
    est, _, admin = await cenario(fabrica)

    async def gravar(i):
        async with fabrica_sessao() as s:
            await gravar_evento(s, est.id, "empregado_inclusao", admin, {"i": i})
            await s.commit()

    await asyncio.gather(*(gravar(i) for i in range(20)))
    assert await _nsrs(db, est.id) == list(range(1, 21))
