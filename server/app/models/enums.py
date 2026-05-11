import enum


class CommandStatus(str, enum.Enum):
    queued = "queued"
    dispatched = "dispatched"
    acknowledged = "acknowledged"
    done = "done"
    error = "error"


class CommandSource(str, enum.Enum):
    app = "app"
    system = "system"
