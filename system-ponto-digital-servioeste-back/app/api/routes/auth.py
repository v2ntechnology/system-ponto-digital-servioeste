"""Login, logout, usuário da sessão e troca de senha (base: Servioeste Hub)."""
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Request, Response, status
from sqlalchemy import delete, select

from app.api.deps import DB, SessaoAtual, UsuarioLogado, client_ip
from app.core.config import get_settings
from app.core.erros import ErroApi
from app.core.security import hash_password, hash_token, new_token, verify_password
from app.models import Sessao, Usuario
from app.schemas import Escopo, Eu, LoginEntrada, LoginResultado, TrocaSenha
from app.services import audit, config, escopo, permissoes, rate_limit

router = APIRouter(prefix="/api/auth", tags=["auth"])


async def montar_eu(db, usuario: Usuario, mfa_pendente: bool) -> Eu:
    e = await escopo.carregar(db, usuario)
    todas = e.total and usuario.perfil != "administrador"
    return Eu(id=usuario.id, nome=usuario.nome, email=usuario.email, perfil=usuario.perfil,
              permissoes=sorted(await permissoes.do_perfil(db, usuario.perfil)), mfa_pendente=mfa_pendente,
              escopo=Escopo(todas_unidades=todas, unidade_ids=sorted(e.unidade_ids), setor_ids=sorted(e.setor_ids)))


@router.post("/login", response_model=LoginResultado)
async def login(body: LoginEntrada, request: Request, response: Response, db: DB) -> LoginResultado:
    s = get_settings()
    ip = client_ip(request)
    email = body.email.lower()
    chave = f"login:{ip}:{email}"
    if await rate_limit.hit(db, chave, s.login_window_seconds) > s.login_max_attempts:
        raise ErroApi(429, "Muitas tentativas. Espere alguns minutos.", codigo="muitas_tentativas")

    usuario = (await db.execute(select(Usuario).where(Usuario.email == email))).scalar_one_or_none()
    if not verify_password(body.senha, usuario.senha_hash if usuario else None) or not usuario.ativo:
        await audit.registrar(db, "login.falhou", usuario_id=usuario.id if usuario else None, resultado="negado", ip=ip)
        await db.commit()
        raise ErroApi(401, "E-mail ou senha incorretos.", codigo="credenciais")

    await rate_limit.reset(db, chave)
    token = new_token()
    horas = int(await config.valor(db, "sessao_max_horas", 8))
    db.add(Sessao(usuario_id=usuario.id, token_hash=hash_token(token), mfa_pendente=usuario.mfa_exigido,
                  expira_em=datetime.now(UTC) + timedelta(hours=horas), ip=ip,
                  user_agent=(request.headers.get("user-agent") or "")[:255]))
    await audit.registrar(db, "login", usuario_id=usuario.id, ip=ip)
    await db.commit()
    response.set_cookie(s.cookie_name, token, max_age=horas * 3600, httponly=True, secure=s.cookie_secure,
                        samesite="lax", path="/")
    if not usuario.mfa_exigido:
        return LoginResultado(mfa="nao_exigido")
    return LoginResultado(mfa="verificar" if usuario.mfa_cadastrado else "cadastrar")


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(request: Request, response: Response, db: DB) -> None:
    s = get_settings()
    token = request.cookies.get(s.cookie_name)
    if token:
        sessao = (await db.execute(select(Sessao).where(Sessao.token_hash == hash_token(token)))).scalar_one_or_none()
        if sessao:
            await audit.registrar(db, "logout", usuario_id=sessao.usuario_id, ip=client_ip(request))
            await db.execute(delete(Sessao).where(Sessao.id == sessao.id))
            await db.commit()
    response.delete_cookie(s.cookie_name, path="/")


@router.get("/me", response_model=Eu)
async def me(atual: SessaoAtual, db: DB) -> Eu:
    usuario, sessao = atual
    return await montar_eu(db, usuario, sessao.mfa_pendente)


@router.post("/senha", status_code=status.HTTP_204_NO_CONTENT)
async def trocar_senha(body: TrocaSenha, request: Request, usuario: UsuarioLogado, atual: SessaoAtual, db: DB) -> None:
    """Troca a própria senha e derruba as outras sessões abertas."""
    if not verify_password(body.senha_atual, usuario.senha_hash):
        raise ErroApi(400, "A senha atual não confere.", campo="senha_atual")
    usuario.senha_hash = hash_password(body.senha_nova)
    await db.execute(delete(Sessao).where(Sessao.usuario_id == usuario.id, Sessao.id != atual[1].id))
    await audit.registrar(db, "senha.alterada", usuario_id=usuario.id, objeto_tipo="usuario", objeto_id=usuario.id,
                          ip=client_ip(request))
    await db.commit()
