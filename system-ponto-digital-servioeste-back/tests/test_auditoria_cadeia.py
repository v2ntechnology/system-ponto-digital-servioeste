"""Trilha de auditoria (Princípio IV, R7): seq sem lacunas e hash encadeado global, com gravações simultâneas."""
import asyncio

from sqlalchemy import select, text

from app.models import Auditoria
from app.rep.arp import ZEROS
from app.services.audit import registrar, verificar_cadeia


async def test_encadeia_e_mascara_cpf_nos_detalhes(db, fabrica):
    admin = await fabrica.usuario()
    a1 = await registrar(db, "funcionario.criar", usuario_id=admin.id, detalhes={"cpf": "52998224725"})
    a2 = await registrar(db, "funcionario.ver", usuario_id=admin.id, resultado="negado")
    await db.commit()
    assert (a1.seq, a2.seq) == (1, 2)
    assert a1.hash_anterior == ZEROS and a2.hash_anterior == a1.hash
    assert "52998224725" not in str(a1.detalhes)
    assert await verificar_cadeia(db) == []


async def test_vinte_gravacoes_simultaneas_sem_lacuna_e_com_cadeia_integra(db, fabrica, fabrica_sessao):
    admin = await fabrica.usuario()

    async def gravar(i):
        async with fabrica_sessao() as s:
            await registrar(s, "teste", usuario_id=admin.id, detalhes={"i": i})
            await s.commit()

    await asyncio.gather(*(gravar(i) for i in range(20)))
    seqs = list((await db.execute(select(Auditoria.seq).order_by(Auditoria.seq))).scalars())
    assert seqs == list(range(1, 21))
    assert await verificar_cadeia(db) == []


async def test_alteracao_indevida_e_detectada(db, fabrica, motor_dono):
    admin = await fabrica.usuario()
    for i in range(3):
        await registrar(db, "teste", usuario_id=admin.id, detalhes={"i": i})
    await db.commit()
    async with motor_dono.begin() as c:
        await c.execute(text("SET LOCAL session_replication_role = replica"))
        await c.execute(text("UPDATE auditoria SET acao = 'apagou_rastro' WHERE seq = 2"))
    db.expire_all()
    assert any("seq 2" in p for p in await verificar_cadeia(db))
