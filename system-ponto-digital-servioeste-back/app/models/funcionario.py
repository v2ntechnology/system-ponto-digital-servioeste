import uuid
from datetime import date, datetime
from typing import Any

from sqlalchemy import Date, DateTime, ForeignKey, String, Uuid, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class TipoVinculo(Base):
    __tablename__ = "tipos_vinculo"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    nome: Mapped[str] = mapped_column(String)
    ativo: Mapped[bool] = mapped_column(default=True)


class Funcionario(Base):
    __tablename__ = "funcionarios"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    empresa_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("empresas.id"))
    nome: Mapped[str] = mapped_column(String)
    cpf: Mapped[str] = mapped_column(String(11))
    matricula: Mapped[str] = mapped_column(String)
    admitido_em: Mapped[date] = mapped_column(Date)
    desligado_em: Mapped[date | None] = mapped_column(Date)
    tipo_vinculo_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tipos_vinculo.id"))
    tipo_registro: Mapped[str] = mapped_column(String)
    email: Mapped[str | None] = mapped_column(String)
    vinculo_anterior_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("funcionarios.id"))
    biometria_exclusao_pendente: Mapped[bool] = mapped_column(default=False)
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Lotacao(Base):
    """Funcionário em uma unidade e setor, com vigência (sem sobreposição, garantido pelo banco)."""
    __tablename__ = "lotacoes"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    funcionario_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("funcionarios.id"))
    unidade_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("unidades.id"))
    setor_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("setores.id"))
    inicio: Mapped[date] = mapped_column(Date)
    fim: Mapped[date | None] = mapped_column(Date)


class LocalPrestacao(Base):
    __tablename__ = "locais_prestacao"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    funcionario_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("funcionarios.id"))
    descricao: Mapped[str] = mapped_column(String)
    tomador_tipo_identificador: Mapped[str | None] = mapped_column(String)
    tomador_identificador: Mapped[str | None] = mapped_column(String)
    endereco: Mapped[dict[str, Any]] = mapped_column(JSONB)
    inicio: Mapped[date] = mapped_column(Date)
    fim: Mapped[date | None] = mapped_column(Date)
