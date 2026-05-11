from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, JSON, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Device(Base):
    __tablename__ = "devices"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    slug: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    device_token: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    next_protocol_command_id: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    snapshot_light: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    snapshot_plants: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    snapshot_system: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    last_seen_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    commands = relationship("DeviceCommand", back_populates="device", cascade="all, delete-orphan")
    states = relationship("DeviceState", back_populates="device", cascade="all, delete-orphan")
    events = relationship("DeviceEvent", back_populates="device", cascade="all, delete-orphan")
    heartbeats = relationship("DeviceHeartbeat", back_populates="device", cascade="all, delete-orphan")
