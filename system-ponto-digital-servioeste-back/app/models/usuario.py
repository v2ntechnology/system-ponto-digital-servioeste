import uuid
from datetime import date, datetime
from typing import Any

from sqlalchemy import BigInteger, Date, DateTime, ForeignKey, LargeBinary, String, Uuid, func
from sqlalchemy.dialects.postgresql import CITEXT, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base

PERFIS_COM_MFA = ("administrador", "rh")


class Usuario(Base):
    """Usuário do painel (Administrador, RH, Gestor). Funcionários entram pelo portal (feature 008)."""
    __tablename__ = "usuarios"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(CITEXT)
    nome: Mapped[str] = mapped_column(String)
    cpf: Mapped[str | None] = mapped_column(String(11))
    senha_hash: Mapped[str] = mapped_column(String)
    perfil: Mapped[str] = mapped_column(String)
    mfa_segredo_cifrado: Mapped[bytes | None] = mapped_column(LargeBinary)
    mfa_segredo_pendente_cifrado: Mapped[bytes | None] = mapped_column(LargeBinary)
    mfa_ultimo_passo: Mapped[int | None] = mapped_column(BigInteger)
    ativo: Mapped[bool] = mapped_column(default=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    @property
    def mfa_exigido(self) -> bool:
        return self.perfil in PERFIS_COM_MFA

    @property
    def mfa_cadastrado(self) -> bool:
        return self.mfa_segredo_cifrado is not None


class UsuarioEscopo(Base):
    """Uma linha = "todas as unidades", uma unidade ou um setor (CHECK no banco)."""
    __tablename__ = "usuario_escopos"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    usuario_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("usuarios.id", ondelete="CASCADE"))
    todas_unidades: Mapped[bool] = mapped_column(default=False)
    unidade_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("unidades.id"))
    setor_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("setores.id"))


class PerfilPermissao(Base):
    __tablename__ = "perfil_permissoes"

    perfil: Mapped[str] = mapped_column(String, primary_key=True)
    permissao: Mapped[str] = mapped_column(String, primary_key=True)


class Sessao(Base):
    """Sessão de login (padrão do Hub): o banco guarda só o SHA-256 do token; o token fica no cookie."""
    __tablename__ = "sessoes"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    usuario_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("usuarios.id", ondelete="CASCADE"))
    token_hash: Mapped[str] = mapped_column(String(64))
    mfa_pendente: Mapped[bool] = mapped_column()
    criado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    ultimo_uso_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    expira_em: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    ip: Mapped[str | None] = mapped_column(String)
    user_agent: Mapped[str | None] = mapped_column(String)


class TentativaLogin(Base):
    """Limite de tentativas por chave (IP + e-mail) dentro de uma janela. Substitui o Redis."""
    __tablename__ = "tentativas_login"

    chave: Mapped[str] = mapped_column(String, primary_key=True)
    contagem: Mapped[int] = mapped_column(default=0)
    inicio_janela: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Configuracao(Base):
    __tablename__ = "configuracoes"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    chave: Mapped[str] = mapped_column(String)
    valor: Mapped[Any] = mapped_column(JSONB)
    inicio: Mapped[date] = mapped_column(Date)
    fim: Mapped[date | None] = mapped_column(Date)
