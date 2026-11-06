"""Esquemas da API, iguais aos de contracts/openapi.yaml (o teste de contrato confere)."""
import uuid
from typing import Literal

from pydantic import BaseModel, EmailStr, Field

Perfil = Literal["administrador", "rh", "gestor"]


class LoginEntrada(BaseModel):
    email: EmailStr
    senha: str


class LoginResultado(BaseModel):
    mfa: Literal["nao_exigido", "verificar", "cadastrar"]


class Escopo(BaseModel):
    todas_unidades: bool = False
    unidade_ids: list[uuid.UUID] = []
    setor_ids: list[uuid.UUID] = []


class Eu(BaseModel):
    id: uuid.UUID
    nome: str
    email: str
    perfil: Perfil
    permissoes: list[str]
    escopo: Escopo
    mfa_pendente: bool


class TrocaSenha(BaseModel):
    senha_atual: str
    senha_nova: str = Field(min_length=10)


class CodigoMfa(BaseModel):
    codigo: str = Field(pattern=r"^[0-9]{6}$")


class CadastroMfa(BaseModel):
    otpauth_uri: str
