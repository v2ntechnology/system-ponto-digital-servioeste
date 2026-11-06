"""Permissões por perfil, guardadas como dados (FR-006) em perfil_permissoes."""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import PerfilPermissao

NUNCA_PARA_GESTOR = {"atestado.abrir"}  # FR-013: garantido também no código, não só na tabela


async def do_perfil(db: AsyncSession, perfil: str) -> set[str]:
    lista = set((await db.execute(select(PerfilPermissao.permissao).where(PerfilPermissao.perfil == perfil))).scalars())
    return lista - NUNCA_PARA_GESTOR if perfil == "gestor" else lista
