from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.security import get_password_hash
from app.models.device import Device
from app.models.user import User


async def bootstrap_defaults(session: AsyncSession) -> None:
    settings = get_settings()

    admin = await session.scalar(select(User).where(User.email == settings.default_admin_email))
    if admin is None:
        session.add(
            User(
                email=settings.default_admin_email,
                password_hash=get_password_hash(settings.default_admin_password),
                is_active=True,
                is_admin=True,
            )
        )

    device = await session.scalar(select(Device).where(Device.slug == settings.default_device_slug))
    if device is None:
        session.add(
            Device(
                slug=settings.default_device_slug,
                name=settings.default_device_name,
                device_token=settings.default_device_token,
                is_active=True,
                next_protocol_command_id=1,
                snapshot_light=None,
                snapshot_plants={},
                snapshot_system=None,
            )
        )

    await session.commit()
