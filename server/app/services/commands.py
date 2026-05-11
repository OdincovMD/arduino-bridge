from datetime import datetime, timezone

from sqlalchemy import Select, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.device import Device
from app.models.device_command import DeviceCommand
from app.models.enums import CommandSource, CommandStatus
from app.models.user import User
from app.schemas.device import DeviceCommandCreate
from app.utils.protocol import build_command_message, parse_protocol_message


def _next_protocol_command_id(current: int) -> int:
    return 1 if current >= 65535 else current + 1


async def create_command_for_device(
    session: AsyncSession, device_slug: str, payload: DeviceCommandCreate, user: User
) -> DeviceCommand:
    device = await session.scalar(select(Device).where(Device.slug == device_slug).with_for_update())
    if device is None:
        raise ValueError("Device not found")

    protocol_command_id = device.next_protocol_command_id
    settings = get_settings()

    if payload.raw_command:
        parsed = parse_protocol_message(payload.raw_command)
        if parsed.message_type != "CMD":
            raise ValueError("raw_command must be a CMD message")
        command_payload = build_command_message(
            version=parsed.version,
            message_id=protocol_command_id,
            command_name=parsed.name,
            args=parsed.args,
        )
        command_name = parsed.name
    else:
        command_name = payload.command_name or "UNKNOWN"
        command_payload = build_command_message(
            version=settings.protocol_version,
            message_id=protocol_command_id,
            command_name=command_name,
            args=payload.args,
        )

    command = DeviceCommand(
        device_id=device.id,
        protocol_command_id=protocol_command_id,
        command_name=command_name,
        payload=command_payload,
        status=CommandStatus.queued,
        source=CommandSource.app,
        request_meta={"args": payload.args},
        requested_by_user_id=user.id,
    )
    session.add(command)
    device.next_protocol_command_id = _next_protocol_command_id(protocol_command_id)
    await session.commit()
    await session.refresh(command)
    return command


async def claim_next_command(session: AsyncSession, device: Device) -> DeviceCommand | None:
    dispatched_query: Select[tuple[DeviceCommand]] = (
        select(DeviceCommand)
        .where(DeviceCommand.device_id == device.id, DeviceCommand.status == CommandStatus.dispatched)
        .order_by(DeviceCommand.queued_at.asc())
        .limit(1)
    )
    in_flight = await session.scalar(dispatched_query)
    if in_flight is not None:
        return in_flight

    queued_query: Select[tuple[DeviceCommand]] = (
        select(DeviceCommand)
        .where(DeviceCommand.device_id == device.id, DeviceCommand.status == CommandStatus.queued)
        .order_by(DeviceCommand.queued_at.asc())
        .limit(1)
        .with_for_update()
    )
    command = await session.scalar(queued_query)
    if command is None:
        return None

    command.status = CommandStatus.dispatched
    command.dispatched_at = datetime.now(timezone.utc)
    await session.commit()
    await session.refresh(command)
    return command
