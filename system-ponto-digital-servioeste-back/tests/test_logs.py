"""FR-019 e Princípio V: CPF não aparece em logs nem em mensagens de erro."""
import logging

from app.core.logging import configurar_logs, mascarar_cpf


def test_mascara_os_dois_formatos_e_nao_mexe_em_numeros_maiores():
    assert mascarar_cpf("cpf 529.982.247-25 e 52998224725") == "cpf ***.***.***-** e ***.***.***-**"
    assert mascarar_cpf("protocolo 123456789012345") == "protocolo 123456789012345"


def test_qualquer_logger_sai_mascarado_inclusive_excecao(caplog):
    configurar_logs()
    log = logging.getLogger("app.qualquer.coisa")
    with caplog.at_level(logging.INFO):
        log.info("cadastrando cpf %s", "52998224725")
        try:
            raise ValueError("CPF 529.982.247-25 duplicado")
        except ValueError:
            log.exception("falhou")
        logging.getLogger("uvicorn.access").info('%s - "%s %s HTTP/%s" %d', "127.0.0.1", "GET",
                                                 "/api/funcionarios?busca=52998224725", "1.1", 200)
    texto = caplog.text + "".join(r.exc_text or "" for r in caplog.records)
    assert "52998224725" not in texto and "529.982.247-25" not in texto
    assert "***.***.***-**" in texto


async def test_erro_de_validacao_nao_devolve_o_valor_enviado(client):
    r = await client.post("/api/auth/login", json={"email": "52998224725", "senha": "x"})
    assert r.status_code == 400
    assert "52998224725" not in r.text
    assert r.json()["campo"] == "email"
