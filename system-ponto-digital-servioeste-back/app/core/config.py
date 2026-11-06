"""Configuração lida do ambiente (ou do .env da raiz do repositório)."""
import base64
import hashlib
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict

# Só para desenvolvimento e testes: em produção a chave é obrigatória (ver validar()).
_CHAVE_DEV = base64.urlsafe_b64encode(hashlib.sha256(b"ponto-digital-dev-nao-usar-em-producao").digest()).decode()


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=("../.env", ".env"), extra="ignore")

    environment: str = "development"  # development | production
    # Papel da aplicação: SELECT/INSERT em tudo, sem UPDATE/DELETE no ARP e na auditoria.
    database_url: str = "postgresql+asyncpg://ponto_app:ponto_app_dev@localhost:5434/ponto"
    # Papel dono: só para migrações e testes.
    database_owner_url: str = "postgresql+asyncpg://ponto_owner:ponto_owner_dev@localhost:5434/ponto"

    allowed_origins: str = "http://localhost:5175"
    cookie_name: str = "ponto_sessao"
    cookie_secure: bool = False
    mfa_encryption_key: str = ""

    login_max_attempts: int = 5
    login_window_seconds: int = 900
    mfa_max_attempts: int = 5

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @property
    def origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    @property
    def chave_mfa(self) -> str:
        return self.mfa_encryption_key or _CHAVE_DEV

    def validar(self) -> None:
        if self.is_production and not self.mfa_encryption_key:
            raise RuntimeError("MFA_ENCRYPTION_KEY é obrigatória em produção.")
        if self.is_production and not self.cookie_secure:
            raise RuntimeError("COOKIE_SECURE deve ser true em produção (HTTPS).")


@lru_cache
def get_settings() -> Settings:
    return Settings()
