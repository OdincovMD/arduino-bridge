from dataclasses import dataclass


@dataclass
class ProtocolMessage:
    raw: str
    message_type: str
    version: str
    message_id: int
    name: str
    args: dict[str, str]


def parse_protocol_message(raw: str) -> ProtocolMessage:
    normalized = raw.strip()
    parts = normalized.split("|")
    if len(parts) < 4:
        raise ValueError("Invalid protocol message")

    message_type = parts[0]
    version = parts[1]
    message_id = int(parts[2])
    name = parts[3]
    args: dict[str, str] = {}

    for item in parts[4:]:
        if "=" in item:
            key, value = item.split("=", 1)
            args[key] = value
        else:
            args[item] = ""

    return ProtocolMessage(
        raw=normalized,
        message_type=message_type,
        version=version,
        message_id=message_id,
        name=name,
        args=args,
    )


def build_command_message(version: str, message_id: int, command_name: str, args: dict[str, str] | None = None) -> str:
    parts = ["CMD", version, str(message_id), command_name]
    if args:
        for key, value in args.items():
            parts.append(f"{key}={value}")
    return "|".join(parts)
