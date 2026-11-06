"""Configurações com vigência (Princípio VI): o valor que vale numa data."""
from datetime import date
from typing import Any

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Configuracao


async def valor(db: AsyncSession, chave: str, padrao: Any, em: date | None = None) -> Any:
    em = em or date.today()
    v = (await db.execute(select(Configuracao.valor).where(
        Configuracao.chave == chave, Configuracao.inicio <= em, or_(Configuracao.fim.is_(None), Configuracao.fim >= em),
    ))).scalar_one_or_none()
    return padrao if v is None else v
