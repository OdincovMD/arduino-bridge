from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db_session
from app.models.device import Device
from app.models.device_command import DeviceCommand
from app.models.device_event import DeviceEvent
from app.models.device_heartbeat import DeviceHeartbeat
from app.models.device_state import DeviceState
from app.models.user import User
from app.schemas.device import (
    DeviceCommandCreate,
    DeviceCommandOut,
    DeviceEventOut,
    DeviceHeartbeatOut,
    DeviceListItem,
    DeviceStateOut,
    DeviceStateSnapshot,
)
from app.services.commands import create_command_for_device


router = APIRouter(prefix="/api/v1/app/devices", tags=["app-devices"])


async def _get_device_or_404(session: AsyncSession, device_slug: str) -> Device:
    device = await session.scalar(select(Device).where(Device.slug == device_slug, Device.is_active.is_(True)))
    if device is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")
    return device


@router.get("", response_model=list[DeviceListItem])
async def list_devices(
    _: User = Depends(get_current_user), session: AsyncSession = Depends(get_db_session)
) -> list[DeviceListItem]:
    devices = (await session.scalars(select(Device).order_by(Device.slug.asc()))).all()
    return [DeviceListItem.model_validate(device) for device in devices]


@router.get("/{device_slug}/state", response_model=DeviceStateSnapshot)
async def get_device_state(
    device_slug: str, _: User = Depends(get_current_user), session: AsyncSession = Depends(get_db_session)
) -> DeviceStateSnapshot:
    device = await _get_device_or_404(session, device_slug)
    return DeviceStateSnapshot(
        slug=device.slug,
        name=device.name,
        last_seen_at=device.last_seen_at,
        light=device.snapshot_light,
        plants=device.snapshot_plants,
        system=device.snapshot_system,
    )


@router.get("/{device_slug}/events", response_model=list[DeviceEventOut])
async def list_device_events(
    device_slug: str,
    limit: int = 50,
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> list[DeviceEventOut]:
    device = await _get_device_or_404(session, device_slug)
    events = (
        await session.scalars(
            select(DeviceEvent)
            .where(DeviceEvent.device_id == device.id)
            .order_by(desc(DeviceEvent.received_at))
            .limit(limit)
        )
    ).all()
    return [DeviceEventOut.model_validate(event) for event in events]


@router.get("/{device_slug}/states", response_model=list[DeviceStateOut])
async def list_device_states(
    device_slug: str,
    limit: int = 50,
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> list[DeviceStateOut]:
    device = await _get_device_or_404(session, device_slug)
    states = (
        await session.scalars(
            select(DeviceState)
            .where(DeviceState.device_id == device.id)
            .order_by(desc(DeviceState.received_at))
            .limit(limit)
        )
    ).all()
    return [DeviceStateOut.model_validate(state) for state in states]


@router.get("/{device_slug}/heartbeats", response_model=list[DeviceHeartbeatOut])
async def list_device_heartbeats(
    device_slug: str,
    limit: int = 50,
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> list[DeviceHeartbeatOut]:
    device = await _get_device_or_404(session, device_slug)
    heartbeats = (
        await session.scalars(
            select(DeviceHeartbeat)
            .where(DeviceHeartbeat.device_id == device.id)
            .order_by(desc(DeviceHeartbeat.received_at))
            .limit(limit)
        )
    ).all()
    return [DeviceHeartbeatOut.model_validate(heartbeat) for heartbeat in heartbeats]


@router.get("/{device_slug}/commands", response_model=list[DeviceCommandOut])
async def list_device_commands(
    device_slug: str,
    limit: int = 50,
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> list[DeviceCommandOut]:
    device = await _get_device_or_404(session, device_slug)
    commands = (
        await session.scalars(
            select(DeviceCommand)
            .where(DeviceCommand.device_id == device.id)
            .order_by(desc(DeviceCommand.queued_at))
            .limit(limit)
        )
    ).all()
    return [DeviceCommandOut.model_validate(command) for command in commands]


@router.get("/{device_slug}/commands/{command_id}", response_model=DeviceCommandOut)
async def get_device_command(
    device_slug: str,
    command_id: int,
    _: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> DeviceCommandOut:
    device = await _get_device_or_404(session, device_slug)
    command = await session.scalar(
        select(DeviceCommand).where(DeviceCommand.device_id == device.id, DeviceCommand.id == command_id)
    )
    if command is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Command not found")
    return DeviceCommandOut.model_validate(command)


@router.post("/{device_slug}/commands", response_model=DeviceCommandOut, status_code=status.HTTP_201_CREATED)
async def enqueue_device_command(
    device_slug: str,
    payload: DeviceCommandCreate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> DeviceCommandOut:
    try:
        command = await create_command_for_device(session, device_slug, payload, user)
    except ValueError as exc:
        detail = str(exc)
        status_code = status.HTTP_404_NOT_FOUND if detail == "Device not found" else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=detail) from exc
    return DeviceCommandOut.model_validate(command)
