"""Erros no formato do contrato (schema Erro): {detail, campo, codigo, funcionario_id}. Nunca com dados pessoais."""
from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException


class ErroApi(HTTPException):
    def __init__(self, status: int, detail: str, *, campo: str | None = None, codigo: str | None = None,
                 funcionario_id: str | None = None) -> None:
        super().__init__(status, detail)
        self.campo, self.codigo, self.funcionario_id = campo, codigo, funcionario_id


def _corpo(detail: str, campo=None, codigo=None, funcionario_id=None) -> dict:
    return {"detail": detail, "campo": campo, "codigo": codigo, "funcionario_id": funcionario_id}


def registrar_tratadores(app: FastAPI) -> None:
    @app.exception_handler(StarletteHTTPException)
    async def _http(_: Request, e: StarletteHTTPException) -> JSONResponse:
        if isinstance(e, ErroApi):
            corpo = _corpo(e.detail, e.campo, e.codigo, e.funcionario_id)
        else:
            corpo = _corpo(e.detail if isinstance(e.detail, str) else "Erro.")
        return JSONResponse(corpo, status_code=e.status_code, headers=getattr(e, "headers", None))

    @app.exception_handler(RequestValidationError)
    async def _validacao(_: Request, e: RequestValidationError) -> JSONResponse:
        # Não devolve o valor enviado (o FastAPI ecoa a entrada por padrão; poderia conter CPF).
        primeiro = e.errors()[0] if e.errors() else {}
        loc = [str(x) for x in primeiro.get("loc", []) if x not in ("body", "query", "path")]
        return JSONResponse(_corpo("Dados inválidos. Confira o campo indicado.", loc[-1] if loc else None, "invalido"),
                            status_code=400)


__all__ = ["ErroApi", "registrar_tratadores", "HTTPException"]
