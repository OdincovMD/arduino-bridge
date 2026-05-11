from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, JSON, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import CommandSource, CommandStatus


class DeviceCommand(Base):
    __tablename__ = "device_commands"
    __table_args__ = (UniqueConstraint("device_id", "protocol_command_id", name="uq_device_protocol_command"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    device_id: Mapped[int] = mapped_column(ForeignKey("devices.id", ondelete="CASCADE"), index=True)
    protocol_command_id: Mapped[int] = mapped_column(Integer, nullable=False)
    command_name: Mapped[str] = mapped_column(Text, nullable=False)
    payload: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[CommandStatus] = mapped_column(Enum(CommandStatus), default=CommandStatus.queued, nullable=False)
    source: Mapped[CommandSource] = mapped_column(Enum(CommandSource), default=CommandSource.app, nullable=False)
    request_meta: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    ack_payload: Mapped[str | None] = mapped_column(Text, nullable=True)
    result_payload: Mapped[str | None] = mapped_column(Text, nullable=True)
    error_payload: Mapped[str | None] = mapped_column(Text, nullable=True)
    queued_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    dispatched_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    acknowledged_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    requested_by_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    device = relationship("Device", back_populates="commands")
    requested_by = relationship("User", back_populates="commands")
