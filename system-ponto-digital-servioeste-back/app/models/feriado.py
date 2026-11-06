import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, String, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class Feriado(Base):
    __tablename__ = "feriados"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    data: Mapped[date] = mapped_column(Date)
    nome: Mapped[str] = mapped_column(String)
    abrangencia: Mapped[str] = mapped_column(String)
    uf: Mapped[str | None] = mapped_column(String(2))
    municipio_ibge: Mapped[str | None] = mapped_column(String(7))
    unidade_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("unidades.id"))
    ativo: Mapped[bool] = mapped_column(default=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
