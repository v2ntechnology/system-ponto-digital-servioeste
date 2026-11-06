"""API do Ponto Digital Servioeste.

    uvicorn app.main:app --reload
"""
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.api.routes import auth, health, mfa
from app.core.config import get_settings
from app.core.erros import registrar_tratadores
from app.core.logging import configurar_logs

settings = get_settings()
settings.validar()
configurar_logs()
UNSAFE_METHODS = {"POST", "PUT", "PATCH", "DELETE"}

app = FastAPI(
    title="Ponto Digital Servioeste API",
    # Documentação interativa só em desenvolvimento: em produção não expomos o mapa da API.
    docs_url=None if settings.is_production else "/api/docs",
    redoc_url=None,
    openapi_url=None if settings.is_production else "/api/openapi.json",
)
registrar_tratadores(app)


@app.middleware("http")
async def csrf_e_cabecalhos(request: Request, call_next):
    """CSRF (padrão do Hub): requisições que alteram dados só valem vindas do próprio front-end."""
    if request.method in UNSAFE_METHODS:
        origin = request.headers.get("origin")
        cross_site = request.headers.get("sec-fetch-site") == "cross-site"
        if (origin and origin not in settings.origins) or (not origin and cross_site):
            corpo = {"detail": "Origem não permitida.", "campo": None, "codigo": "origem", "funcionario_id": None}
            return JSONResponse(corpo, status_code=403)
    response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("Cache-Control", "no-store")
    return response


app.include_router(health.router)
app.include_router(auth.router)
app.include_router(mfa.router)
