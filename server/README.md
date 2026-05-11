# Backend

API-first backend для связки:

- `Arduino Uno/Nano + ESP-01`
- `Android` приложение
- `PostgreSQL`

Стек:

- `FastAPI`
- `nginx`
- `PostgreSQL`
- `SQLAlchemy 2.0 async`
- `asyncpg`
- `Docker Compose`

## Структура

```text
server/
├── app/
│   ├── api/
│   │   └── routes/
│   ├── core/
│   ├── db/
│   ├── models/
│   ├── schemas/
│   ├── services/
│   └── utils/
├── Dockerfile
├── requirements.txt
└── .env.example
```

## Запуск

Из корня репозитория:

```bash
docker compose up --build
```

После запуска:

- nginx entrypoint: `http://127.0.0.1:8080`
- OpenAPI: `http://127.0.0.1:8080/docs`

Backend напрямую наружу не публикуется. Внешний трафик идёт через `nginx`, а уже `nginx` проксирует запросы в `FastAPI`.

## Туннель

Для твоего сценария с `tuna` целевая команда такая:

```bash
tuna http 8080 --domain=your-domain.example
```

То есть туннель публикует `nginx`, а не `uvicorn` напрямую.

## Контуры API

### Device API

- `GET /api/v1/device/{device_slug}/commands`
- `POST /api/v1/device/{device_slug}/ack`
- `POST /api/v1/device/{device_slug}/result`
- `POST /api/v1/device/{device_slug}/state`
- `POST /api/v1/device/{device_slug}/event`
- `POST /api/v1/device/{device_slug}/heartbeat`
- `GET /api/v1/device/{device_slug}/time`

### App API

- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `GET /api/v1/app/devices`
- `GET /api/v1/app/devices/{device_slug}/state`
- `GET /api/v1/app/devices/{device_slug}/events`
- `GET /api/v1/app/devices/{device_slug}/states`
- `GET /api/v1/app/devices/{device_slug}/heartbeats`
- `GET /api/v1/app/devices/{device_slug}/commands`
- `GET /api/v1/app/devices/{device_slug}/commands/{command_id}`
- `POST /api/v1/app/devices/{device_slug}/commands`
