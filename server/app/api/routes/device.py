import time

from fastapi import APIRouter, Body, Depends, HTTPException, Response, status
from fastapi.responses import PlainTextResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_active_device_by_slug
from app.core.config import get_settings
from app.db.session import get_db_session
from app.models.device import Device
from app.services.commands import claim_next_command
from app.services.device_ingest import (
    mark_device_seen,
    record_ack,
    record_event,
    record_heartbeat,
    record_result,
    record_state,
)


router = APIRouter(prefix="/api/v1/device/{device_slug}", tags=["device"])


@router.get("/commands", response_class=PlainTextResponse)
async def get_device_command(
    device_slug: str,
    device: Device = Depends(get_active_device_by_slug),
    session: AsyncSession = Depends(get_db_session),
) -> Response:
    _ = device_slug
    await mark_device_seen(session, device)
    command = await claim_next_command(session, device)
    if command is None:
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    return PlainTextResponse(command.payload)


@router.post("/ack", response_class=PlainTextResponse)
async def device_acknowledge(
    device_slug: str,
    body: str = Body(..., media_type="text/plain"),
    device: Device = Depends(get_active_device_by_slug),
    session: AsyncSession = Depends(get_db_session),
) -> PlainTextResponse:
    _ = device_slug
    try:
        await record_ack(session, device, body)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return PlainTextResponse("ok")


@router.post("/result", response_class=PlainTextResponse)
async def device_result(
    device_slug: str,
    body: str = Body(..., media_type="text/plain"),
    device: Device = Depends(get_active_device_by_slug),
    session: AsyncSession = Depends(get_db_session),
) -> PlainTextResponse:
    _ = device_slug
    try:
        await record_result(session, device, body)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return PlainTextResponse("ok")


@router.post("/state", response_class=PlainTextResponse)
async def device_state(
    device_slug: str,
    body: str = Body(..., media_type="text/plain"),
    device: Device = Depends(get_active_device_by_slug),
    session: AsyncSession = Depends(get_db_session),
) -> PlainTextResponse:
    _ = device_slug
    await record_state(session, device, body)
    return PlainTextResponse("ok")


@router.post("/event", response_class=PlainTextResponse)
async def device_event(
    device_slug: str,
    body: str = Body(..., media_type="text/plain"),
    device: Device = Depends(get_active_device_by_slug),
    session: AsyncSession = Depends(get_db_session),
) -> PlainTextResponse:
    _ = device_slug
    await record_event(session, device, body)
    return PlainTextResponse("ok")


@router.post("/heartbeat", response_class=PlainTextResponse)
async def device_heartbeat(
    device_slug: str,
    body: str = Body(..., media_type="text/plain"),
    device: Device = Depends(get_active_device_by_slug),
    session: AsyncSession = Depends(get_db_session),
) -> PlainTextResponse:
    _ = device_slug
    await record_heartbeat(session, device, body)
    settings = get_settings()
    return PlainTextResponse(f"PONG|{settings.protocol_version}|0")


@router.get("/time", response_class=PlainTextResponse)
async def device_time(
    device_slug: str,
    device: Device = Depends(get_active_device_by_slug),
    session: AsyncSession = Depends(get_db_session),
) -> PlainTextResponse:
    _ = device_slug
    await mark_device_seen(session, device)
    settings = get_settings()
    return PlainTextResponse(f"TIME|{settings.protocol_version}|0|EPOCH={int(time.time())}")
