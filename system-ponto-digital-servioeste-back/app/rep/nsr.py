"""NSR por estabelecimento, sem lacunas (Portaria 671: sequência própria por estabelecimento, de 1 em 1).

Não usa SEQUENCE (pode pular números). O contador é uma linha por estabelecimento incrementada com UPDATE ... RETURNING
na transação de quem grava: a linha fica travada até o commit, então gravações simultâneas no mesmo estabelecimento
esperam a vez, e um rollback desfaz o incremento junto com o evento.
"""
import uuid

from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from app.rep.models import NsrContador


class EstabelecimentoSemContador(RuntimeError):
    pass


async def proximo_nsr(sessao: AsyncSession, estabelecimento_id: uuid.UUID) -> int:
    resultado = await sessao.execute(
        update(NsrContador)
        .where(NsrContador.estabelecimento_id == estabelecimento_id)
        .values(ultimo_nsr=NsrContador.ultimo_nsr + 1)
        .returning(NsrContador.ultimo_nsr)
    )
    nsr = resultado.scalar_one_or_none()
    if nsr is None:
        raise EstabelecimentoSemContador(f"Estabelecimento {estabelecimento_id} sem contador de NSR.")
    return nsr


def novo_contador(estabelecimento_id: uuid.UUID) -> NsrContador:
    """Criado junto com o estabelecimento, na mesma transação."""
    return NsrContador(estabelecimento_id=estabelecimento_id, ultimo_nsr=0)
