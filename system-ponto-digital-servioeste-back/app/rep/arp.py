"""ARP: gravação dos eventos legais com NSR e hash encadeado por estabelecimento (fronteira do REP).

hash = SHA-256(hash_anterior + conteúdo canônico). O conteúdo canônico é um JSON com chaves ordenadas e sem espaços,
com a data em UTC. Qualquer mudança num evento antigo quebra a verificação dele (Princípio IV).
"""
import hashlib
import json
import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Usuario
from app.rep.models import ArpEvento
from app.rep.nsr import proximo_nsr

ZEROS = "0" * 64
TIPOS = (
    "empregador_inclusao", "empregador_alteracao", "empregado_inclusao", "empregado_alteracao", "empregado_exclusao",
)


def _iso(d: datetime) -> str:
    return d.astimezone(UTC).isoformat(timespec="microseconds")


def conteudo_canonico(e: ArpEvento) -> str:
    return json.dumps({
        "estabelecimento_id": str(e.estabelecimento_id), "nsr": e.nsr, "tipo": e.tipo,
        "responsavel_cpf": e.responsavel_cpf, "ocorrido_em": _iso(e.ocorrido_em), "dados": e.dados,
    }, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def calcular_hash(hash_anterior: str, conteudo: str) -> str:
    return hashlib.sha256((hash_anterior + conteudo).encode()).hexdigest()


async def gravar_evento(sessao: AsyncSession, estabelecimento_id: uuid.UUID, tipo: str, responsavel: Usuario,
                        dados: dict[str, Any], ocorrido_em: datetime | None = None) -> ArpEvento:
    """Grava um evento no ARP. Quem chama faz o commit, junto com a mudança que gerou o evento."""
    if tipo not in TIPOS:
        raise ValueError(f"Tipo de evento inválido: {tipo}")
    if not responsavel.cpf:
        raise ValueError("O responsável pelo evento precisa ter CPF (o AFD identifica quem fez a operação).")
    nsr = await proximo_nsr(sessao, estabelecimento_id)  # trava o contador até o commit
    anterior = (await sessao.execute(
        select(ArpEvento.hash).where(ArpEvento.estabelecimento_id == estabelecimento_id, ArpEvento.nsr == nsr - 1)
    )).scalar_one_or_none() if nsr > 1 else ZEROS
    if anterior is None:
        raise RuntimeError(f"NSR {nsr - 1} não encontrado no estabelecimento {estabelecimento_id}.")
    # Normaliza "dados" pelo mesmo caminho do banco (JSON), para o hash bater com o que for relido.
    evento = ArpEvento(
        estabelecimento_id=estabelecimento_id, nsr=nsr, tipo=tipo, responsavel_usuario_id=responsavel.id,
        responsavel_cpf=responsavel.cpf, ocorrido_em=ocorrido_em or datetime.now(UTC),
        dados=json.loads(json.dumps(dados, ensure_ascii=False)),
        hash_anterior=anterior,
    )
    evento.hash = calcular_hash(anterior, conteudo_canonico(evento))
    sessao.add(evento)
    await sessao.flush()
    return evento


async def verificar_cadeia(sessao: AsyncSession, estabelecimento_id: uuid.UUID) -> list[str]:
    """Relê os eventos do estabelecimento e devolve os problemas encontrados (lista vazia = íntegra)."""
    eventos = (await sessao.execute(
        select(ArpEvento).where(ArpEvento.estabelecimento_id == estabelecimento_id).order_by(ArpEvento.nsr)
        .execution_options(populate_existing=True)
    )).scalars().all()
    problemas: list[str] = []
    anterior = ZEROS
    for esperado, e in enumerate(eventos, start=1):
        if e.nsr != esperado:
            problemas.append(f"NSR {e.nsr}: fora da sequência (esperado {esperado}).")
        if e.hash_anterior != anterior:
            problemas.append(f"NSR {e.nsr}: hash anterior não bate com o registro anterior.")
        if e.hash != calcular_hash(e.hash_anterior, conteudo_canonico(e)):
            problemas.append(f"NSR {e.nsr}: conteúdo não bate com o hash (registro alterado).")
        anterior = e.hash
    return problemas
