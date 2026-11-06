"""Trilha de auditoria (Princípio IV, R7): só inserção, seq sem lacunas e hash encadeado global.

Para duas gravações simultâneas não usarem o mesmo hash anterior, cada gravação pega um advisory lock de transação
com chave fixa, lê a última linha e insere a próxima. O lock é solto no commit (ou rollback) de quem chamou.
CPF nunca vai em claro para "detalhes" (é mascarado).
"""
import hashlib
import json
import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import mascarar_cpf
from app.models import Auditoria
from app.rep.arp import ZEROS

CHAVE_LOCK = 7_301_001  # chave fixa do advisory lock da auditoria


def _limpar(valor: Any) -> Any:
    if isinstance(valor, str):
        return mascarar_cpf(valor)
    if isinstance(valor, dict):
        return {k: _limpar(v) for k, v in valor.items()}
    if isinstance(valor, list):
        return [_limpar(v) for v in valor]
    return valor


def _canonico(a: Auditoria) -> str:
    return json.dumps({
        "seq": a.seq, "usuario_id": str(a.usuario_id) if a.usuario_id else None, "acao": a.acao,
        "objeto_tipo": a.objeto_tipo, "objeto_id": str(a.objeto_id) if a.objeto_id else None, "resultado": a.resultado,
        "detalhes": a.detalhes, "ip": a.ip,
        "ocorrido_em": a.ocorrido_em.astimezone(UTC).isoformat(timespec="microseconds"),
    }, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def _hash(anterior: str, conteudo: str) -> str:
    return hashlib.sha256((anterior + conteudo).encode()).hexdigest()


async def registrar(sessao: AsyncSession, acao: str, *, usuario_id: uuid.UUID | None = None,
                    objeto_tipo: str | None = None, objeto_id: uuid.UUID | None = None, resultado: str = "permitido",
                    detalhes: dict[str, Any] | None = None, ip: str | None = None) -> Auditoria:
    """Grava um registro de auditoria. Quem chama faz o commit, junto com a ação auditada."""
    await sessao.execute(text("SELECT pg_advisory_xact_lock(:k)"), {"k": CHAVE_LOCK})
    ultimo = (await sessao.execute(
        select(Auditoria.seq, Auditoria.hash).order_by(Auditoria.seq.desc()).limit(1))).first()
    seq, anterior = (ultimo[0] + 1, ultimo[1]) if ultimo else (1, ZEROS)
    a = Auditoria(seq=seq, usuario_id=usuario_id, acao=acao, objeto_tipo=objeto_tipo, objeto_id=objeto_id,
                  resultado=resultado, detalhes=json.loads(json.dumps(_limpar(detalhes or {}), ensure_ascii=False)),
                  ip=ip, ocorrido_em=datetime.now(UTC), hash_anterior=anterior)
    a.hash = _hash(anterior, _canonico(a))
    sessao.add(a)
    await sessao.flush()
    return a


async def verificar_cadeia(sessao: AsyncSession) -> list[str]:
    registros = (await sessao.execute(
        select(Auditoria).order_by(Auditoria.seq).execution_options(populate_existing=True))).scalars().all()
    problemas: list[str] = []
    anterior = ZEROS
    for esperado, a in enumerate(registros, start=1):
        if a.seq != esperado:
            problemas.append(f"seq {a.seq}: fora da sequência (esperado {esperado}).")
        if a.hash_anterior != anterior:
            problemas.append(f"seq {a.seq}: hash anterior não bate com o registro anterior.")
        if a.hash != _hash(a.hash_anterior, _canonico(a)):
            problemas.append(f"seq {a.seq}: conteúdo não bate com o hash (registro alterado).")
        anterior = a.hash
    return problemas

