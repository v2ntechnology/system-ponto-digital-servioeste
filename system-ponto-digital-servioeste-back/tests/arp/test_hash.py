"""Hash encadeado do ARP (Princípio IV): alteração indevida, mesmo feita por quem administra o banco, é detectável."""
import asyncio

from sqlalchemy import select, text

from app.models import ArpEvento
from app.rep.arp import ZEROS, calcular_hash, conteudo_canonico, gravar_evento, verificar_cadeia
from tests.arp.apoio import cenario


async def test_primeiro_evento_aponta_para_zeros_e_os_seguintes_para_o_anterior(db, fabrica):
    est, _, admin = await cenario(fabrica)
    e1 = await gravar_evento(db, est.id, "empregador_inclusao", admin, {"razao_social": "Teste"})
    e2 = await gravar_evento(db, est.id, "empregado_inclusao", admin, {"nome": "Ana", "cpf": "52998224725"})
    await db.commit()
    assert ZEROS == "0" * 64
    assert e1.hash_anterior == ZEROS
    assert e2.hash_anterior == e1.hash
    assert e1.hash == calcular_hash(e1.hash_anterior, conteudo_canonico(e1))
    assert len(e1.hash) == 64


async def test_conteudo_canonico_independe_da_ordem_das_chaves(db, fabrica):
    est, _, admin = await cenario(fabrica)
    e = await gravar_evento(db, est.id, "empregado_inclusao", admin, {"b": 2, "a": 1})
    await db.commit()
    texto = conteudo_canonico(e)
    assert texto.index('"a"') < texto.index('"b"')


async def test_cadeia_integra_e_lida_de_volta_do_banco(db, fabrica, fabrica_sessao):
    est, _, admin = await cenario(fabrica)
    for i in range(5):
        await gravar_evento(db, est.id, "empregado_inclusao", admin, {"i": i, "nome": "Pessoa Ação"})
    await db.commit()
    async with fabrica_sessao() as nova:  # relê do banco, sem nada em memória
        assert await verificar_cadeia(nova, est.id) == []


async def test_alteracao_feita_pelo_superusuario_com_gatilho_desligado_e_detectada(db, fabrica, motor_dono):
    est, _, admin = await cenario(fabrica)
    for i in range(3):
        await gravar_evento(db, est.id, "empregado_inclusao", admin, {"nome": f"Pessoa {i}"})
    await db.commit()
    async with motor_dono.begin() as c:
        await c.execute(text("SET LOCAL session_replication_role = replica"))
        await c.execute(text("UPDATE arp_eventos SET dados = '{\"nome\": \"Adulterado\"}' WHERE nsr = 2"))
    db.expire_all()
    problemas = await verificar_cadeia(db, est.id)
    assert any("NSR 2" in p for p in problemas)


async def test_cadeia_integra_com_gravacoes_simultaneas(db, fabrica, fabrica_sessao):
    est, _, admin = await cenario(fabrica)

    async def gravar(i):
        async with fabrica_sessao() as s:
            await gravar_evento(s, est.id, "empregado_inclusao", admin, {"i": i})
            await s.commit()

    await asyncio.gather(*(gravar(i) for i in range(15)))
    assert await verificar_cadeia(db, est.id) == []
    assert len((await db.execute(select(ArpEvento.id))).all()) == 15
