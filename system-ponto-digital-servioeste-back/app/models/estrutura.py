import uuid
from datetime import date, datetime
from typing import Any

from sqlalchemy import Date, DateTime, ForeignKey, String, Uuid, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class Empresa(Base):
    __tablename__ = "empresas"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    tipo_identificador: Mapped[str] = mapped_column(String)
    identificador: Mapped[str] = mapped_column(String)
    razao_social: Mapped[str] = mapped_column(String)
    ativo: Mapped[bool] = mapped_column(default=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Estabelecimento(Base):
    """Identificador legal com numeração própria de NSR (Clarificação 1)."""
    __tablename__ = "estabelecimentos"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    empresa_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("empresas.id"))
    tipo_identificador: Mapped[str] = mapped_column(String)
    identificador: Mapped[str] = mapped_column(String)
    razao_social: Mapped[str] = mapped_column(String)
    endereco: Mapped[dict[str, Any]] = mapped_column(JSONB)
    ativo: Mapped[bool] = mapped_column(default=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Unidade(Base):
    """Local físico de trabalho, ligado a um estabelecimento com vigência."""
    __tablename__ = "unidades"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    empresa_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("empresas.id"))
    nome: Mapped[str] = mapped_column(String)
    endereco: Mapped[dict[str, Any]] = mapped_column(JSONB)
    uf: Mapped[str] = mapped_column(String(2))
    municipio_ibge: Mapped[str] = mapped_column(String(7))
    ativo: Mapped[bool] = mapped_column(default=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class UnidadeEstabelecimento(Base):
    __tablename__ = "unidade_estabelecimentos"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    unidade_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("unidades.id"))
    estabelecimento_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("estabelecimentos.id"))
    inicio: Mapped[date] = mapped_column(Date)
    fim: Mapped[date | None] = mapped_column(Date)


class Setor(Base):
    __tablename__ = "setores"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    unidade_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("unidades.id"))
    nome: Mapped[str] = mapped_column(String)
    ativo: Mapped[bool] = mapped_column(default=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
