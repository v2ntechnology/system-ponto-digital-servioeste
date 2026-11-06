"""Segundo fator (R5): TOTP (RFC 6238) com pyotp, compatível com Google/Microsoft Authenticator e Aegis.

O segredo fica cifrado no banco (Fernet, chave em MFA_ENCRYPTION_KEY). Janela de ±1 passo (30 s) e o mesmo código
não vale duas vezes (o passo usado fica em usuarios.mfa_ultimo_passo).
"""
import time

import pyotp
from cryptography.fernet import Fernet

from app.core.config import get_settings

EMISSOR = "Servioeste Ponto"
PASSO_SEGUNDOS = 30


def _fernet() -> Fernet:
    return Fernet(get_settings().chave_mfa.encode())


def novo_segredo() -> str:
    return pyotp.random_base32()


def cifrar(segredo: str) -> bytes:
    return _fernet().encrypt(segredo.encode())


def decifrar(cifrado: bytes) -> str:
    return _fernet().decrypt(cifrado).decode()


def uri_otpauth(segredo: str, email: str) -> str:
    return pyotp.TOTP(segredo).provisioning_uri(name=email, issuer_name=EMISSOR)


def passo_valido(segredo: str, codigo: str, ultimo_passo: int | None, agora: float | None = None) -> int | None:
    """Devolve o passo de tempo que o código confirma, ou None. Recusa passo já usado (sem reuso do mesmo código)."""
    if not (codigo.isdigit() and len(codigo) == 6):
        return None
    agora = time.time() if agora is None else agora
    totp = pyotp.TOTP(segredo)
    atual = int(agora // PASSO_SEGUNDOS)
    for passo in (atual - 1, atual, atual + 1):
        if totp.at(passo * PASSO_SEGUNDOS) == codigo:
            if ultimo_passo is not None and passo <= ultimo_passo:
                return None
            return passo
    return None


def codigo_atual(segredo: str, agora: float | None = None) -> str:
    """Só para testes e para o comando de diagnóstico."""
    return pyotp.TOTP(segredo).at(time.time() if agora is None else agora)
