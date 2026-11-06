from fastapi import APIRouter
from sqlalchemy import text

from app.api.deps import DB

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health")
async def health(db: DB) -> dict[str, str]:
    await db.execute(text("select 1"))
    return {"status": "ok"}
