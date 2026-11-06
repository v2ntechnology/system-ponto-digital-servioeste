"""Sessão, segundo fator e permissões (base: deps.py do Servioeste Hub)."""
from collections.abc import Awaitable, Callable
from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import Depends, Request
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.db import get_db
from app.core.erros import ErroApi
from app.core.security import hash_token
from app.models import Sessao, Usuario
from app.services import audit, config, permissoes

DB = Annotated[AsyncSession, Depends(get_db)]
TOQUE = timedelta(seconds=60)  # grava o "último uso" da sessão no máximo uma vez por minuto


def client_ip(request: Request) -> str | None:
    # Atrás do Caddy, o uvicorn roda com --proxy-headers, então request.client já é o IP real.
    return request.client.host if request.client else None


async def sessao_atual(request: Request, db: DB) -> tuple[Usuario, Sessao]:
    """Sessão válida, com ou sem segundo fator concluído. Use só nas rotas de MFA, /auth/me e /auth/logout."""
    token = request.cookies.get(get_settings().cookie_name)
    if token:
        linha = (await db.execute(select(Usuario, Sessao).join(Sessao, Sessao.usuario_id == Usuario.id)
                                  .where(Sessao.token_hash == hash_token(token)))).first()
        if linha:
            usuario, sessao = linha
            agora = datetime.now(UTC)
            inatividade = timedelta(minutes=int(await config.valor(db, "sessao_inatividade_min_admin_rh", 30)))
            parada = usuario.mfa_exigido and agora - sessao.ultimo_uso_em > inatividade
            if usuario.ativo and sessao.expira_em > agora and not parada:
                if agora - sessao.ultimo_uso_em >= TOQUE:
                    sessao.ultimo_uso_em = agora
                    await db.commit()
                return usuario, sessao
            await db.execute(delete(Sessao).where(Sessao.id == sessao.id))
            await db.commit()
    raise ErroApi(401, "Sua sessão terminou. Entre de novo.", codigo="sem_sessao")


SessaoAtual = Annotated[tuple[Usuario, Sessao], Depends(sessao_atual)]


async def usuario_logado(atual: SessaoAtual) -> Usuario:
    """Sessão com o segundo fator concluído (Administrador e RH). Padrão para todas as rotas do painel."""
    usuario, sessao = atual
    if sessao.mfa_pendente:
        raise ErroApi(401, "Confirme o código do app autenticador para continuar.", codigo="mfa_pendente")
    return usuario


UsuarioLogado = Annotated[Usuario, Depends(usuario_logado)]


def exige(permissao: str) -> Callable[..., Awaitable[Usuario]]:
    """Dependência: exige a permissão; sem ela registra "acesso.negado" na auditoria e responde 403."""
    async def _dep(request: Request, usuario: UsuarioLogado, db: DB) -> Usuario:
        if permissao not in await permissoes.do_perfil(db, usuario.perfil):
            await audit.registrar(db, "acesso.negado", usuario_id=usuario.id, resultado="negado",
                                  detalhes={"permissao": permissao, "rota": request.url.path}, ip=client_ip(request))
            await db.commit()
            raise ErroApi(403, "Seu perfil não tem permissão para esta ação.", codigo="sem_permissao")
        return usuario
    return _dep
