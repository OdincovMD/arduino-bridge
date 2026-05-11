from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.app_devices import router as app_devices_router
from app.api.routes.auth import router as auth_router
from app.api.routes.device import router as device_router
from app.api.routes.health import router as health_router
from app.core.config import get_settings
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models import device, device_command, device_event, device_heartbeat, device_state, user  # noqa: F401
from app.services.bootstrap import bootstrap_defaults


@asynccontextmanager
async def lifespan(_: FastAPI):
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    async with SessionLocal() as session:
        await bootstrap_defaults(session)

    yield

    await engine.dispose()


settings = get_settings()
app = FastAPI(title=settings.app_name, debug=settings.debug, lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(auth_router)
app.include_router(app_devices_router)
app.include_router(device_router)
