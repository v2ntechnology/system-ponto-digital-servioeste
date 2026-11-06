"""SC-006 e Princípio III: nenhum evento do ARP nem registro de auditoria pode ser alterado ou removido."""
import pytest
from sqlalchemy import text
from sqlalchemy.exc import DBAPIError

from app.rep.arp import gravar_evento
from app.services.audit import registrar
from tests.arp.apoio import cenario


async def _um_evento_e_uma_auditoria(db, fabrica):
    est, _, admin = await cenario(fabrica)
    await gravar_evento(db, est.id, "empregador_inclusao", admin, {"razao_social": "Teste"})
    await registrar(db, "teste", usuario_id=admin.id)
    await db.commit()


@pytest.mark.parametrize("tabela", ["arp_eventos", "auditoria"])
@pytest.mark.parametrize("sql", ["UPDATE {t} SET hash = repeat('0', 64)", "DELETE FROM {t}", "TRUNCATE {t}"])
async def test_papel_da_aplicacao_nao_altera_nem_apaga(db, fabrica, tabela, sql):
    await _um_evento_e_uma_auditoria(db, fabrica)
    with pytest.raises(DBAPIError, match="permission denied|permissão negada"):
        await db.execute(text(sql.format(t=tabela)))
    await db.rollback()


@pytest.mark.parametrize("tabela", ["arp_eventos", "auditoria"])
@pytest.mark.parametrize("sql", ["UPDATE {t} SET hash = repeat('0', 64)", "DELETE FROM {t}", "TRUNCATE {t}"])
async def test_gatilho_barra_ate_o_papel_dono(db, fabrica, motor_dono, tabela, sql):
    await _um_evento_e_uma_auditoria(db, fabrica)
    async with motor_dono.connect() as c:
        with pytest.raises(DBAPIError, match="Registro imutável"):
            await c.execute(text(sql.format(t=tabela)))


async def test_orm_tambem_nao_altera(db, fabrica):
    est, _, admin = await cenario(fabrica)
    evento = await gravar_evento(db, est.id, "empregador_inclusao", admin, {"razao_social": "Teste"})
    await db.commit()
    evento.tipo = "empregado_exclusao"
    with pytest.raises(DBAPIError):
        await db.commit()
