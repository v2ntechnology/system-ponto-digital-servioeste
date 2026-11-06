"""Segundo fator (FR-016a): cadastro do app autenticador e verificação do código."""
from fastapi import APIRouter, Request

from app.api.deps import DB, SessaoAtual, client_ip
from app.api.routes.auth import montar_eu
from app.core import mfa
from app.core.config import get_settings
from app.core.erros import ErroApi
from app.schemas import CadastroMfa, CodigoMfa, Eu
from app.services import audit, rate_limit

router = APIRouter(prefix="/api/auth/mfa", tags=["mfa"])


@router.post("/cadastro", response_model=CadastroMfa)
async def cadastro(atual: SessaoAtual, db: DB) -> CadastroMfa:
    usuario, _ = atual
    if not usuario.mfa_exigido:
        raise ErroApi(400, "Seu perfil não usa segundo fator.", codigo="mfa_nao_exigido")
    if usuario.mfa_cadastrado:
        raise ErroApi(409, "O app autenticador já está cadastrado.", codigo="mfa_ja_cadastrado")
    segredo = mfa.novo_segredo()
    usuario.mfa_segredo_pendente_cifrado = mfa.cifrar(segredo)  # só vale depois do primeiro código confirmado
    await db.commit()
    return CadastroMfa(otpauth_uri=mfa.uri_otpauth(segredo, usuario.email))


@router.post("/verificar", response_model=Eu)
async def verificar(body: CodigoMfa, request: Request, atual: SessaoAtual, db: DB) -> Eu:
    usuario, sessao = atual
    s = get_settings()
    ip = client_ip(request)
    chave = f"mfa:{usuario.id}"
    if await rate_limit.hit(db, chave, s.login_window_seconds) > s.mfa_max_attempts:
        raise ErroApi(429, "Muitas tentativas. Espere alguns minutos.", codigo="muitas_tentativas")
    cifrado = usuario.mfa_segredo_cifrado or usuario.mfa_segredo_pendente_cifrado
    if cifrado is None:
        raise ErroApi(400, "Cadastre o app autenticador primeiro.", codigo="mfa_sem_cadastro")
    passo = mfa.passo_valido(mfa.decifrar(cifrado), body.codigo, usuario.mfa_ultimo_passo)
    if passo is None:
        await audit.registrar(db, "mfa.falhou", usuario_id=usuario.id, resultado="negado", ip=ip)
        await db.commit()
        raise ErroApi(401, "Código incorreto ou expirado. Confira o app e tente de novo.",
                      campo="codigo", codigo="mfa_codigo")
    if usuario.mfa_segredo_cifrado is None:
        usuario.mfa_segredo_cifrado, usuario.mfa_segredo_pendente_cifrado = cifrado, None
    usuario.mfa_ultimo_passo = passo
    sessao.mfa_pendente = False
    await rate_limit.reset(db, chave)
    await audit.registrar(db, "mfa.verificado", usuario_id=usuario.id, ip=ip)
    await db.commit()
    return await montar_eu(db, usuario, False)
