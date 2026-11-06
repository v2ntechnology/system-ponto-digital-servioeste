"""Testes contra PostgreSQL real (gatilhos, permissões de papel e EXCLUDE não existem no SQLite).

- Uma vez por rodada: recria o banco `ponto_test` e aplica as migrações com o papel dono (ponto_owner).
- Cada teste: sessões com o papel da aplicação (ponto_app), como em produção; no fim, limpa os dados
  (como superusuário, com os gatilhos desligados só para a limpeza) e mantém as sementes da migração.
"""
import asyncio
import uuid
from collections.abc import AsyncIterator
from datetime import date

import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import text
from sqlalchemy.engine import URL, make_url
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.core.config import get_settings

BANCO = "ponto_test"
ORIGIN = "http://localhost:5175"

_settings = get_settings()
URL_DONO: URL = make_url(_settings.database_owner_url).set(database=BANCO)
URL_APP: URL = make_url(_settings.database_url).set(database=BANCO)

# Tabelas limpas entre testes (as sementes ficam: perfil_permissoes, tipos_vinculo, configuracoes).
LIMPAR = [
    "auditoria", "arp_eventos", "nsr_contadores", "sessoes", "tentativas_login", "usuario_escopos", "usuarios",
    "feriados", "locais_prestacao", "lotacoes", "funcionarios", "setores", "unidade_estabelecimentos", "unidades",
    "estabelecimentos", "empresas",
]


def _texto(url: URL) -> str:
    return url.render_as_string(hide_password=False)


async def _recriar_banco() -> None:
    admin = create_async_engine(_texto(URL_DONO.set(database="postgres")), isolation_level="AUTOCOMMIT",
                                poolclass=NullPool)
    async with admin.connect() as c:
        await c.execute(text(f"DROP DATABASE IF EXISTS {BANCO} WITH (FORCE)"))
        await c.execute(text(f"CREATE DATABASE {BANCO}"))
    await admin.dispose()


@pytest.fixture(scope="session", autouse=True)
def banco_de_teste() -> None:
    asyncio.run(_recriar_banco())
    cfg = Config("alembic.ini")
    cfg.attributes["url"] = _texto(URL_DONO)
    command.upgrade(cfg, "head")


@pytest.fixture
async def motor_app():
    motor = create_async_engine(_texto(URL_APP), poolclass=NullPool)
    yield motor
    await motor.dispose()


@pytest.fixture
async def motor_dono():
    motor = create_async_engine(_texto(URL_DONO), poolclass=NullPool)
    yield motor
    await motor.dispose()


@pytest.fixture
def fabrica_sessao(motor_app) -> async_sessionmaker[AsyncSession]:
    return async_sessionmaker(motor_app, expire_on_commit=False)


@pytest.fixture
async def db(fabrica_sessao) -> AsyncIterator[AsyncSession]:
    """Sessão com o papel da aplicação (ponto_app)."""
    async with fabrica_sessao() as s:
        yield s


@pytest.fixture(autouse=True)
async def _limpar_depois(motor_dono):
    yield
    async with motor_dono.begin() as c:
        await c.execute(text("SET LOCAL session_replication_role = replica"))  # só a limpeza ignora os gatilhos
        await c.execute(text(f"TRUNCATE {', '.join(LIMPAR)} RESTART IDENTITY CASCADE"))


@pytest.fixture
async def client(fabrica_sessao):
    from httpx import ASGITransport, AsyncClient

    from app.core.db import get_db
    from app.main import app

    async def _db():
        async with fabrica_sessao() as s:
            yield s

    app.dependency_overrides[get_db] = _db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test", headers={"Origin": ORIGIN}) as c:
        yield c
    app.dependency_overrides.clear()


# ------------------------------------------------------------------------------------------------ fábricas
# CPFs e CNPJs de teste com dígitos verificadores válidos (não pertencem a ninguém real).
CPFS = ["52998224725", "11144477735", "39053344705", "15350946056", "84434895885", "93541134780"]
CNPJS = ["11222333000181", "11444777000161", "45723174000110"]


class Fabrica:
    def __init__(self, sm: async_sessionmaker[AsyncSession]) -> None:
        self.sm = sm

    async def _salvar(self, *objs):
        async with self.sm() as s:
            s.add_all(objs)
            await s.commit()
        return objs[0]

    async def empresa(self, identificador=CNPJS[0], razao="Empresa de Teste Ltda"):
        from app.models import Empresa
        return await self._salvar(Empresa(tipo_identificador="cnpj", identificador=identificador, razao_social=razao))

    async def estabelecimento(self, empresa, identificador=CNPJS[1], razao="Estabelecimento de Teste"):
        from app.models import Estabelecimento, NsrContador
        est = Estabelecimento(id=uuid.uuid4(), empresa_id=empresa.id, tipo_identificador="cnpj",
                              identificador=identificador, razao_social=razao, endereco=ENDERECO)
        await self._salvar(est)
        await self._salvar(NsrContador(estabelecimento_id=est.id, ultimo_nsr=0))
        return est

    async def unidade(self, empresa, estabelecimento, nome="São Cristóvão", municipio="3304557", uf="RJ"):
        from app.models import Unidade, UnidadeEstabelecimento
        u = Unidade(id=uuid.uuid4(), empresa_id=empresa.id, nome=nome, endereco={**ENDERECO, "uf": uf}, uf=uf,
                    municipio_ibge=municipio)
        await self._salvar(u)
        await self._salvar(UnidadeEstabelecimento(unidade_id=u.id, estabelecimento_id=estabelecimento.id,
                                                  inicio=date(2000, 1, 1)))
        return u

    async def setor(self, unidade, nome="Operacional"):
        from app.models import Setor
        return await self._salvar(Setor(unidade_id=unidade.id, nome=nome))

    async def usuario(self, email="admin@exemplo.com.br", perfil="administrador", cpf=CPFS[5], senha="senha-forte-123",
                      ativo=True, todas_unidades=False, unidades=(), setores=(), mfa_segredo: str | None = None):
        from app.core.mfa import cifrar
        from app.core.security import hash_password
        from app.models import Usuario, UsuarioEscopo
        u = Usuario(id=uuid.uuid4(), email=email, nome=email.split("@")[0],
                    cpf=cpf if perfil != "gestor" else None,
                    senha_hash=hash_password(senha), perfil=perfil, ativo=ativo,
                    mfa_segredo_cifrado=cifrar(mfa_segredo) if mfa_segredo else None)
        escopos = [UsuarioEscopo(usuario_id=u.id, todas_unidades=True)] if todas_unidades else []
        escopos += [UsuarioEscopo(usuario_id=u.id, unidade_id=x.id) for x in unidades]
        escopos += [UsuarioEscopo(usuario_id=u.id, setor_id=x.id) for x in setores]
        await self._salvar(u)
        if escopos:
            await self._salvar(*escopos)
        return u

    async def funcionario(self, empresa, unidade, setor, nome="Maria da Silva", cpf=CPFS[0], matricula="1001",
                          admitido=date(2024, 1, 2)):
        from sqlalchemy import select

        from app.models import Funcionario, Lotacao, TipoVinculo
        async with self.sm() as s:
            clt = (await s.execute(select(TipoVinculo).where(TipoVinculo.nome == "CLT"))).scalar_one()
        f = Funcionario(id=uuid.uuid4(), empresa_id=empresa.id, nome=nome, cpf=cpf, matricula=matricula,
                        admitido_em=admitido, tipo_vinculo_id=clt.id, tipo_registro="tablet")
        await self._salvar(f)
        await self._salvar(Lotacao(funcionario_id=f.id, unidade_id=unidade.id, setor_id=setor.id, inicio=admitido))
        return f


ENDERECO = {"logradouro": "Rua Idalina Senra", "numero": "45", "complemento": None,
            "bairro": "Imperial de São Cristóvão", "cidade": "Rio de Janeiro", "uf": "RJ", "cep": "20941090"}


@pytest.fixture
def fabrica(fabrica_sessao) -> Fabrica:
    return Fabrica(fabrica_sessao)


async def entrar(client, email, senha="senha-forte-123"):
    return await client.post("/api/auth/login", json={"email": email, "senha": senha})
