"""Logs sem dados pessoais (Princípio V, FR-019): CPF é mascarado em qualquer mensagem, de qualquer logger.

Usa a fábrica de registros do `logging`: todo registro já nasce com a mensagem e os argumentos mascarados, inclusive
o texto da exceção. Filtros em loggers não bastariam (não valem para registros que sobem de loggers filhos).
"""
import logging
import re
import traceback

# 000.000.000-00 ou 11 dígitos seguidos (sem fazer parte de um número maior).
_CPF = re.compile(r"(?<!\d)(\d{3}\.\d{3}\.\d{3}-\d{2}|\d{11})(?!\d)")
_configurado = False


def mascarar_cpf(texto: str) -> str:
    return _CPF.sub("***.***.***-**", texto)


def _mascarar_valor(v):
    if isinstance(v, str):
        return mascarar_cpf(v)
    if isinstance(v, int) and len(str(v)) == 11:  # CPF passado como número
        return mascarar_cpf(str(v))
    return v


def configurar_logs() -> None:
    global _configurado
    if _configurado:
        return
    fabrica_original = logging.getLogRecordFactory()

    def fabrica(*args, **kwargs) -> logging.LogRecord:
        record = fabrica_original(*args, **kwargs)
        # Mascara a mensagem e cada argumento, sem mudar a estrutura: formatadores como o do log de acesso do
        # uvicorn leem record.args diretamente (cliente, método, caminho com query string, status).
        if isinstance(record.msg, str):
            record.msg = mascarar_cpf(record.msg)
        if isinstance(record.args, tuple):
            record.args = tuple(_mascarar_valor(a) for a in record.args)
        elif isinstance(record.args, dict):
            record.args = {k: _mascarar_valor(v) for k, v in record.args.items()}
        if record.exc_info and record.exc_info[0] is not None:
            record.exc_text = mascarar_cpf("".join(traceback.format_exception(*record.exc_info)).rstrip())
        return record

    logging.setLogRecordFactory(fabrica)
    _configurado = True
