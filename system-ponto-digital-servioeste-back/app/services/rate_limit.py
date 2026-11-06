"""Limite de tentativas (login e segundo fator), contado numa tabela do Postgres, sem Redis (base: Servioeste Hub)."""
from datetime import UTC, datetime, timedelta

from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import TentativaLogin


async def hit(db: AsyncSession, key: str, window_seconds: int) -> int:
    """Conta mais uma tentativa e devolve o total dentro da janela. Faz o commit na hora."""
    now = datetime.now(UTC)
    row = await db.get(TentativaLogin, key, with_for_update=True)
    if row is None:
        row = TentativaLogin(chave=key, contagem=0, inicio_janela=now)
        db.add(row)
    if now - row.inicio_janela > timedelta(seconds=window_seconds):
        row.contagem, row.inicio_janela = 0, now
    row.contagem += 1
    count = row.contagem
    await db.commit()
    return count


async def reset(db: AsyncSession, key: str) -> None:
    """Zera a contagem. Quem chama faz o commit."""
    await db.execute(delete(TentativaLogin).where(TentativaLogin.chave == key))
