from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.device import Device
from app.models.device_command import DeviceCommand
from app.models.device_event import DeviceEvent
from app.models.device_heartbeat import DeviceHeartbeat
from app.models.device_state import DeviceState
from app.models.enums import CommandStatus
from app.utils.protocol import ProtocolMessage, parse_protocol_message


def _touch_device(device: Device) -> None:
    device.last_seen_at = datetime.now(timezone.utc)


def _ensure_type(message: ProtocolMessage, expected_type: str) -> None:
    if message.message_type != expected_type:
        raise ValueError(f"Expected {expected_type} message")


async def mark_device_seen(session: AsyncSession, device: Device) -> None:
    _touch_device(device)
    await session.commit()


async def record_ack(session: AsyncSession, device: Device, raw_payload: str) -> DeviceCommand:
    message = parse_protocol_message(raw_payload)
    _ensure_type(message, "ACK")
    command = await session.scalar(
        select(DeviceCommand).where(
            DeviceCommand.device_id == device.id, DeviceCommand.protocol_command_id == message.message_id
        )
    )
    if command is None:
        raise ValueError("Command not found")

    command.status = CommandStatus.acknowledged
    command.ack_payload = raw_payload.strip()
    command.acknowledged_at = datetime.now(timezone.utc)
    _touch_device(device)
    await session.commit()
    await session.refresh(command)
    return command


async def record_result(session: AsyncSession, device: Device, raw_payload: str) -> DeviceCommand:
    message = parse_protocol_message(raw_payload)
    if message.message_type not in {"RES", "ERR"}:
        raise ValueError("Expected RES or ERR message")
    command = await session.scalar(
        select(DeviceCommand).where(
            DeviceCommand.device_id == device.id, DeviceCommand.protocol_command_id == message.message_id
        )
    )
    if command is None:
        raise ValueError("Command not found")

    if message.message_type == "ERR":
        command.status = CommandStatus.error
        command.error_payload = raw_payload.strip()
    else:
        command.status = CommandStatus.done
        command.result_payload = raw_payload.strip()
    command.completed_at = datetime.now(timezone.utc)
    _touch_device(device)
    await session.commit()
    await session.refresh(command)
    return command


def _merge_plant_snapshot(current: dict | None, state_message: ProtocolMessage) -> dict:
    snapshot = dict(current or {})
    plant_index = state_message.args.get("INDEX", "unknown")
    snapshot[plant_index] = state_message.args
    return snapshot


async def record_state(session: AsyncSession, device: Device, raw_payload: str) -> DeviceState:
    message = parse_protocol_message(raw_payload)
    _ensure_type(message, "STATE")
    state = DeviceState(
        device_id=device.id,
        block_name=message.name,
        payload=raw_payload.strip(),
        parsed_payload=message.args,
    )
    session.add(state)

    if message.name == "LIGHT":
        device.snapshot_light = message.args
    elif message.name == "SYSTEM":
        device.snapshot_system = message.args
    elif message.name == "PLANT":
        device.snapshot_plants = _merge_plant_snapshot(device.snapshot_plants, message)

    _touch_device(device)
    await session.commit()
    await session.refresh(state)
    return state


async def record_event(session: AsyncSession, device: Device, raw_payload: str) -> DeviceEvent:
    message = parse_protocol_message(raw_payload)
    _ensure_type(message, "EVT")
    event = DeviceEvent(
        device_id=device.id,
        event_name=message.name,
        payload=raw_payload.strip(),
        parsed_payload=message.args,
    )
    session.add(event)
    _touch_device(device)
    await session.commit()
    await session.refresh(event)
    return event


async def record_heartbeat(session: AsyncSession, device: Device, raw_payload: str) -> DeviceHeartbeat:
    message = parse_protocol_message(raw_payload)
    _ensure_type(message, "PING")
    heartbeat = DeviceHeartbeat(
        device_id=device.id,
        payload=raw_payload.strip(),
        parsed_payload=message.args,
    )
    session.add(heartbeat)
    _touch_device(device)
    await session.commit()
    await session.refresh(heartbeat)
    return heartbeat
