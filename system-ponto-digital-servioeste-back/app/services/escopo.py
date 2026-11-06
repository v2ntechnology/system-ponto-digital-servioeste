"""Escopo do usuário (FR-012, FR-012a): o único ponto onde se decide quais funcionários alguém enxerga.

- Administrador e RH com "todas as unidades": sem filtro.
- RH: unidades atribuídas. Gestor: setores e/ou unidades inteiras.
Funcionário visível = a lotação na data consultada (ou, se desligado, na data do desligamento) está no escopo.
Fora do escopo responde 404 (não revela que existe) e a tentativa vai para a auditoria.
"""
import uuid
from dataclasses import dataclass
from datetime import date

from sqlalchemy import Select, and_, exists, func, literal, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.erros import ErroApi
from app.models import Funcionario, Lotacao, Usuario, UsuarioEscopo
from app.services import audit


@dataclass(frozen=True)
class EscopoUsuario:
    total: bool
    unidade_ids: frozenset[uuid.UUID]
    setor_ids: frozenset[uuid.UUID]


async def carregar(db: AsyncSession, usuario: Usuario) -> EscopoUsuario:
    linhas = (await db.execute(select(UsuarioEscopo).where(UsuarioEscopo.usuario_id == usuario.id))).scalars().all()
    total = usuario.perfil == "administrador" or any(x.todas_unidades for x in linhas)
    return EscopoUsuario(total, frozenset(x.unidade_id for x in linhas if x.unidade_id),
                         frozenset(x.setor_id for x in linhas if x.setor_id))


def condicao(escopo: EscopoUsuario, data: date | None = None):
    """Condição SQL sobre Funcionario. None quando não há filtro (acesso total)."""
    if escopo.total:
        return None
    if not escopo.unidade_ids and not escopo.setor_ids:
        return literal(False)
    hoje = literal(data or date.today())
    d = func.least(hoje, func.coalesce(Funcionario.desligado_em, hoje))
    return exists(select(Lotacao.id).where(and_(
        Lotacao.funcionario_id == Funcionario.id, Lotacao.inicio <= d, or_(Lotacao.fim.is_(None), Lotacao.fim >= d),
        or_(Lotacao.unidade_id.in_(escopo.unidade_ids), Lotacao.setor_id.in_(escopo.setor_ids)),
    )))


def filtrar_funcionarios(consulta: Select, escopo: EscopoUsuario, data: date | None = None) -> Select:
    c = condicao(escopo, data)
    return consulta if c is None else consulta.where(c)


async def garantir_no_escopo(db: AsyncSession, usuario: Usuario, funcionario_id: uuid.UUID, acao: str,
                             ip: str | None = None) -> Funcionario:
    escopo = await carregar(db, usuario)
    f = (await db.execute(filtrar_funcionarios(select(Funcionario).where(Funcionario.id == funcionario_id), escopo))
         ).scalar_one_or_none()
    if f is None:
        existe = (await db.execute(select(Funcionario.id).where(Funcionario.id == funcionario_id))).scalar_one_or_none()
        if existe:
            await audit.registrar(db, "acesso.negado", usuario_id=usuario.id, objeto_tipo="funcionario",
                                  objeto_id=funcionario_id, resultado="negado", detalhes={"acao": acao}, ip=ip)
            await db.commit()
        raise ErroApi(404, "Funcionário não encontrado.")
    return f
