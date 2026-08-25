# Arduino Light & Watering Bridge

Монорепозиторий для системы обмена между:

- устройством на базе `Arduino Uno/Nano + ESP8266 ESP-01`;
- внешним `VPS` сервером.

Проект состоит из двух основных частей:

- `firmware/` — каркас прошивки для устройства;
- `server/` — backend на `FastAPI + PostgreSQL` для платы и будущего Android-приложения;
- `nginx/` — edge proxy перед backend.

Дополнительная документация:

- [ТЗ.md](docs/ТЗ.md)
- [Архитектура.md](docs/Архитектура.md)
- [Протокол.md](docs/Протокол.md)

## Структура

```text
.
├── firmware/        # PlatformIO-проект для Uno/Nano
├── server/          # FastAPI backend
├── nginx/           # reverse proxy
├── docker-compose.yml
└── docs/            # ТЗ, архитектура и протокол
```

## Что уже реализовано

### Firmware

- базовые типы и compile-time лимиты;
- текстовый протокол `CMD/ACK/RES/ERR/STATE/EVT/PING/PONG/TIME`;
- загрузка и сохранение конфигурации в `EEPROM`;
- кольцевой буфер событий;
- каркас транспорта для `ESP-01` через `AT`-команды;
- роутер команд света, полива и системных команд;
- основной цикл polling/heartbeat/state sync.

### Server

- `Docker Compose`
- `FastAPI`
- `nginx`
- `PostgreSQL`
- `SQLAlchemy 2.0 async`
- `asyncpg`
- `GET /commands`
- `POST /ack`
- `POST /result`
- `POST /state`
- `POST /event`
- `POST /heartbeat`
- `GET /time`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `GET /api/v1/app/devices`
- `GET /api/v1/app/devices/{device_slug}/state`
- `GET /api/v1/app/devices/{device_slug}/events`
- `GET /api/v1/app/devices/{device_slug}/states`
- `GET /api/v1/app/devices/{device_slug}/heartbeats`
- `GET /api/v1/app/devices/{device_slug}/commands/{command_id}`
- `POST /api/v1/app/devices/{device_slug}/commands`
- хранение состояния, событий, heartbeat и очереди команд в `PostgreSQL`

## Быстрый старт

### 1. Backend

```bash
docker compose up --build
```

После запуска:

- public entrypoint via nginx: `http://127.0.0.1:8080`
- OpenAPI: `http://127.0.0.1:8080/docs`

Для туннеля:

```bash
tuna http 8080 --domain=your-domain.example
```

### 2. Firmware

Открыть каталог `firmware/` как `PlatformIO` проект и собрать прошивку для `uno`.


## Важные допущения

- в первой версии используется `HTTP`, а не `HTTPS`;
- протокол строковый и оптимизирован под ограниченную память;
- доменная логика расписаний и сложных сценариев пока оформлена как каркас и интерфейсы, а не как полный production-ready алгоритм;
- лимиты на количество растений, шаблонов и интервалов заданы константами.

## Следующие шаги

- собрать и прогнать прошивку на реальном `ESP-01`;
- довести транспортный слой под конкретную AT-прошивку модуля;
- расширить backend под реальные сценарии Android-приложения;
- реализовать полную доменную логику расписаний и richer state model.
