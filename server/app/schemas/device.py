from datetime import datetime

from pydantic import BaseModel, Field, model_validator

from app.models.enums import CommandStatus


class DeviceListItem(BaseModel):
    slug: str
    name: str
    is_active: bool
    last_seen_at: datetime | None
    snapshot_light: dict | None = None
    snapshot_plants: dict | None = None
    snapshot_system: dict | None = None

    model_config = {"from_attributes": True}


class DeviceStateSnapshot(BaseModel):
    slug: str
    name: str
    last_seen_at: datetime | None
    light: dict | None = None
    plants: dict | None = None
    system: dict | None = None


class DeviceEventOut(BaseModel):
    id: int
    event_name: str
    payload: str
    parsed_payload: dict | None
    received_at: datetime

    model_config = {"from_attributes": True}


class DeviceStateOut(BaseModel):
    id: int
    block_name: str
    payload: str
    parsed_payload: dict | None
    received_at: datetime

    model_config = {"from_attributes": True}


class DeviceHeartbeatOut(BaseModel):
    id: int
    payload: str
    parsed_payload: dict | None
    received_at: datetime

    model_config = {"from_attributes": True}


class DeviceCommandCreate(BaseModel):
    raw_command: str | None = None
    command_name: str | None = None
    args: dict[str, str] = Field(default_factory=dict)

    @model_validator(mode="after")
    def validate_source(self) -> "DeviceCommandCreate":
        if not self.raw_command and not self.command_name:
            raise ValueError("Either raw_command or command_name is required")
        return self


class DeviceCommandOut(BaseModel):
    id: int
    protocol_command_id: int
    command_name: str
    payload: str
    status: CommandStatus
    ack_payload: str | None
    result_payload: str | None
    error_payload: str | None
    queued_at: datetime
    dispatched_at: datetime | None
    acknowledged_at: datetime | None
    completed_at: datetime | None

    model_config = {"from_attributes": True}
