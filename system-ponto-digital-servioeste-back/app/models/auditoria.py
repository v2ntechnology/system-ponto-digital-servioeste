import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import BigInteger, DateTime, ForeignKey, String, Uuid
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class Auditoria(Base):
    """Trilha de auditoria. Só inserção (gatilho + permissões), com hash encadeado global por seq."""
    __tablename__ = "auditoria"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    seq: Mapped[int] = mapped_column(BigInteger)
    usuario_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("usuarios.id"))
    acao: Mapped[str] = mapped_column(String)
    objeto_tipo: Mapped[str | None] = mapped_column(String)
    objeto_id: Mapped[uuid.UUID | None] = mapped_column(Uuid)
    resultado: Mapped[str] = mapped_column(String)
    detalhes: Mapped[dict[str, Any]] = mapped_column(JSONB, default=dict)
    ip: Mapped[str | None] = mapped_column(String)
    ocorrido_em: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    hash_anterior: Mapped[str] = mapped_column(String(64))
    hash: Mapped[str] = mapped_column(String(64))
