"""FR-016a: Administrador e RH só acessam o painel depois do segundo fator; gestor entra só com senha."""
from urllib.parse import parse_qs, urlparse

from app.core import mfa
from tests.conftest import entrar

SEGREDO = "JBSWY3DPEHPK3PXP"


async def test_administrador_sem_codigo_nao_acessa_nada_alem_do_mfa(client, fabrica):
    await fabrica.usuario(mfa_segredo=SEGREDO)
    r = await entrar(client, "admin@exemplo.com.br")
    assert r.status_code == 200 and r.json() == {"mfa": "verificar"}

    eu = await client.get("/api/auth/me")
    assert eu.status_code == 200 and eu.json()["mfa_pendente"] is True
    protegida = await client.post("/api/auth/senha", json={"senha_atual": "x", "senha_nova": "y" * 10})
    assert protegida.status_code == 401 and protegida.json()["codigo"] == "mfa_pendente"

    outro = "000000" if mfa.codigo_atual(SEGREDO) != "000000" else "111111"
    errado = await client.post("/api/auth/mfa/verificar", json={"codigo": outro})
    assert errado.status_code == 401 and errado.json()["campo"] == "codigo"

    certo = await client.post("/api/auth/mfa/verificar", json={"codigo": mfa.codigo_atual(SEGREDO)})
    assert certo.status_code == 200 and certo.json()["mfa_pendente"] is False
    liberada = await client.post("/api/auth/senha", json={"senha_atual": "errada", "senha_nova": "y" * 10})
    assert liberada.status_code == 400  # passou do segundo fator; recusou só a senha atual errada


async def test_mesmo_codigo_nao_vale_duas_vezes(client, fabrica):
    await fabrica.usuario(mfa_segredo=SEGREDO)
    codigo = mfa.codigo_atual(SEGREDO)
    await entrar(client, "admin@exemplo.com.br")
    assert (await client.post("/api/auth/mfa/verificar", json={"codigo": codigo})).status_code == 200
    await client.post("/api/auth/logout")
    await entrar(client, "admin@exemplo.com.br")
    assert (await client.post("/api/auth/mfa/verificar", json={"codigo": codigo})).status_code == 401


async def test_gestor_entra_sem_segundo_fator(client, fabrica):
    await fabrica.usuario(email="gestor@exemplo.com.br", perfil="gestor")
    r = await entrar(client, "gestor@exemplo.com.br")
    assert r.json() == {"mfa": "nao_exigido"}
    eu = (await client.get("/api/auth/me")).json()
    assert eu["mfa_pendente"] is False and "atestado.abrir" not in eu["permissoes"]
    assert (await client.post("/api/auth/mfa/cadastro")).status_code == 400


async def test_rh_no_primeiro_acesso_cadastra_o_app(client, fabrica):
    await fabrica.usuario(email="rh@exemplo.com.br", perfil="rh", cpf="11144477735")
    assert (await entrar(client, "rh@exemplo.com.br")).json() == {"mfa": "cadastrar"}
    cadastro = await client.post("/api/auth/mfa/cadastro")
    assert cadastro.status_code == 200
    uri = cadastro.json()["otpauth_uri"]
    assert uri.startswith("otpauth://totp/") and "issuer=Servioeste%20Ponto" in uri
    segredo = parse_qs(urlparse(uri).query)["secret"][0]
    assert (await client.post("/api/auth/mfa/verificar", json={"codigo": mfa.codigo_atual(segredo)})).status_code == 200
    assert (await client.post("/api/auth/mfa/cadastro")).status_code == 409


async def test_senha_errada_e_limite_de_tentativas(client, fabrica):
    await fabrica.usuario(email="gestor@exemplo.com.br", perfil="gestor")
    for _ in range(5):
        assert (await entrar(client, "gestor@exemplo.com.br", "errada")).status_code == 401
    assert (await entrar(client, "gestor@exemplo.com.br")).status_code == 429


async def test_segredo_fica_cifrado_no_banco(db, fabrica):
    from sqlalchemy import select

    from app.models import Usuario
    await fabrica.usuario(mfa_segredo=SEGREDO)
    guardado = (await db.execute(select(Usuario.mfa_segredo_cifrado))).scalar_one()
    assert SEGREDO.encode() not in guardado
    assert mfa.decifrar(guardado) == SEGREDO
