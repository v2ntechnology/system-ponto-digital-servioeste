"""Modelos do REP (fronteira do registro legal). O PTRP nunca grava aqui."""
import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import BigInteger, DateTime, ForeignKey, String, Uuid
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class NsrContador(Base):
    __tablename__ = "nsr_contadores"

    estabelecimento_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("estabelecimentos.id"), primary_key=True)
    ultimo_nsr: Mapped[int] = mapped_column(BigInteger, default=0)


class ArpEvento(Base):
    """Evento do ARP com NSR por estabelecimento e hash encadeado. Nunca alterado nem apagado."""
    __tablename__ = "arp_eventos"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    estabelecimento_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("estabelecimentos.id"))
    nsr: Mapped[int] = mapped_column(BigInteger)
    tipo: Mapped[str] = mapped_column(String)
    responsavel_usuario_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("usuarios.id"))
    responsavel_cpf: Mapped[str] = mapped_column(String(11))
    ocorrido_em: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    dados: Mapped[dict[str, Any]] = mapped_column(JSONB)
    hash_anterior: Mapped[str] = mapped_column(String(64))
    hash: Mapped[str] = mapped_column(String(64))
