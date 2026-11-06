"""Contrato (R2): as rotas da API batem com contracts/openapi.yaml e as respostas seguem os schemas."""
from pathlib import Path

import pytest
import yaml
from openapi_core import OpenAPI
from openapi_core.testing import MockRequest, MockResponse

from app.main import app
from tests.conftest import entrar

CONTRATO = Path(__file__).resolve().parents[1] / "contracts" / "openapi.yaml"
METODOS = {"get", "post", "patch", "put", "delete"}

# Rotas do contrato que ainda não foram implementadas. Cada fase da Parte B remove as suas daqui.
PENDENTES = {
    ("get", "/empresas"), ("post", "/empresas"), ("patch", "/empresas/{id}"),
    ("get", "/estabelecimentos"), ("post", "/estabelecimentos"), ("patch", "/estabelecimentos/{id}"),
    ("get", "/unidades"), ("post", "/unidades"), ("patch", "/unidades/{id}"),
    ("get", "/setores"), ("post", "/setores"), ("patch", "/setores/{id}"),
    ("get", "/tipos-vinculo"), ("post", "/tipos-vinculo"),
    ("get", "/funcionarios"), ("post", "/funcionarios"), ("get", "/funcionarios/{id}"), ("patch", "/funcionarios/{id}"),
    ("post", "/funcionarios/{id}/lotacoes"), ("post", "/funcionarios/{id}/locais-prestacao"),
    ("post", "/funcionarios/{id}/desligamento"),
    ("get", "/feriados"), ("post", "/feriados"), ("patch", "/feriados/{id}"),
    ("get", "/usuarios"), ("post", "/usuarios"), ("patch", "/usuarios/{id}"), ("post", "/usuarios/{id}/mfa/redefinir"),
    ("get", "/auditoria"), ("get", "/arp/eventos"),
}


def _contrato() -> set[tuple[str, str]]:
    spec = yaml.safe_load(CONTRATO.read_text())
    return {(m, p) for p, ops in spec["paths"].items() for m in ops if m in METODOS}


def _app() -> set[tuple[str, str]]:
    """Rotas que a API expõe, lidas do OpenAPI que o próprio FastAPI gera."""
    gerado = app.openapi()["paths"]
    return {(m, p.removeprefix("/api")) for p, ops in gerado.items() if p.startswith("/api/")
            for m in ops if m in METODOS}


def test_toda_rota_da_api_esta_no_contrato():
    assert _app() - _contrato() == set()


def test_o_que_falta_implementar_e_exatamente_a_lista_de_pendentes():
    assert _contrato() - _app() == PENDENTES


@pytest.fixture
def validar_resposta():
    """Valida uma resposta do httpx contra o contrato (status, corpo e schema)."""
    openapi = OpenAPI.from_file_path(str(CONTRATO))

    def _validar(resposta):
        req = resposta.request
        pedido = MockRequest("http://test", req.method.lower(), req.url.path, content_type="application/json",
                             data=req.content or None)
        tipo = resposta.headers.get("content-type", "application/json")
        openapi.validate_response(pedido, MockResponse(resposta.content, status_code=resposta.status_code,
                                                       content_type=tipo))
    return _validar


async def test_respostas_de_auth_seguem_o_contrato(client, fabrica, validar_resposta):
    await fabrica.usuario(email="gestor@exemplo.com.br", perfil="gestor")
    validar_resposta(await client.get("/api/health"))
    validar_resposta(await entrar(client, "gestor@exemplo.com.br", "errada"))
    validar_resposta(await entrar(client, "gestor@exemplo.com.br"))
    validar_resposta(await client.get("/api/auth/me"))
