from fastapi import APIRouter

from app.core.config import get_settings


router = APIRouter(tags=["health"])


@router.get("/")
async def root() -> dict[str, str]:
    settings = get_settings()
    return {"service": settings.app_name, "status": "ok", "docs": "/docs"}


@router.get("/health")
async def healthcheck() -> dict[str, str]:
    return {"status": "ok"}
