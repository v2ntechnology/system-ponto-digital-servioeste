"""Apoio dos testes do ARP: um estabelecimento e um responsável prontos."""
from tests.conftest import CNPJS


async def cenario(fabrica):
    empresa = await fabrica.empresa()
    est = await fabrica.estabelecimento(empresa)
    outro = await fabrica.estabelecimento(empresa, identificador=CNPJS[2], razao="Outro estabelecimento")
    admin = await fabrica.usuario()
    return est, outro, admin
