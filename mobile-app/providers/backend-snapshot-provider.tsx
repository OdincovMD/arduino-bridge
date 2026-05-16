import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  BackendCommand,
  BackendEvent,
  BackendHeartbeat,
  BackendStateRecord,
  fetchDeviceCommands,
  fetchDeviceEvents,
  fetchDeviceHeartbeats,
  fetchDeviceStates,
  fetchDevices,
} from '@/lib/api';
import { ActivityItem, DeviceCard, mockActivity, mockCommandStats, mockDevices } from '@/lib/mock-data';
import { useAuth } from '@/providers/auth-provider';

type SnapshotDevice = DeviceCard[];
type SnapshotActivity = ActivityItem[];
type SnapshotStats = typeof mockCommandStats;

type SnapshotStateItem = {
  id: string;
  label: string;
  description: string;
  time: string;
};

type SnapshotHeartbeatItem = {
  id: string;
  description: string;
  time: string;
};

type SnapshotCommandItem = {
  id: string;
  label: string;
  statusLabel: string;
  time: string;
  tone: 'neutral' | 'success' | 'warning';
};

export type SnapshotDeviceDetail = {
  events: SnapshotActivity;
  states: SnapshotStateItem[];
  heartbeats: SnapshotHeartbeatItem[];
  commands: SnapshotCommandItem[];
  latestStateSummary: string | null;
};

type BackendSnapshotValue = {
  devices: SnapshotDevice;
  activity: SnapshotActivity;
  commandStats: SnapshotStats;
  detailsBySlug: Record<string, SnapshotDeviceDetail>;
  source: 'mock' | 'remote';
  isRefreshing: boolean;
  isInitialLoading: boolean;
  error: string | null;
  updatedLabel: string;
  refresh: () => Promise<void>;
};

const BackendSnapshotContext = createContext<BackendSnapshotValue | null>(null);

const defaultValue: Omit<BackendSnapshotValue, 'refresh'> = {
  devices: mockDevices,
  activity: mockActivity,
  commandStats: mockCommandStats,
  detailsBySlug: {},
  source: 'mock',
  isRefreshing: false,
  isInitialLoading: false,
  error: null,
  updatedLabel: 'резервные данные',
};

function formatRelativeMoment(value: Date): string {
  return value.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRelativeAge(value: string | null): string {
  if (!value) {
    return 'нет данных';
  }

  const deltaMs = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(deltaMs) || deltaMs < 0) {
    return 'только что';
  }

  const minutes = Math.floor(deltaMs / 60000);
  if (minutes <= 0) {
    const seconds = Math.max(1, Math.floor(deltaMs / 1000));
    return `${seconds} сек назад`;
  }

  if (minutes < 60) {
    return `${minutes} мин назад`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} ч назад`;
  }

  const days = Math.floor(hours / 24);
  return `${days} дн назад`;
}

function parseKeyValuePayload(payload: string): Record<string, string> {
  return payload
    .split(/[|;]/)
    .map((part) => part.trim())
    .filter((part) => part.includes('='))
    .reduce<Record<string, string>>((result, part) => {
      const [key, rawValue] = part.split('=');
      if (key && rawValue) {
        result[key] = rawValue;
      }
      return result;
    }, {});
}

function describeEventTitle(deviceName: string): string {
  if (deviceName === 'Greenhouse Controller') {
    return 'Северная теплица';
  }

  return deviceName;
}

function describeEventPayload(eventName: string, payload: string): string {
  const args = parseKeyValuePayload(payload);

  switch (eventName) {
    case 'WATERING_STARTED':
      return `Полив начался${args.PLANT ? ` для зоны ${Number(args.PLANT) + 1}` : ''}.`;
    case 'WATERING_COMPLETED':
      return `Полив завершён${args.PLANT ? ` для зоны ${Number(args.PLANT) + 1}` : ''}.`;
    case 'LIGHT_ON':
      return 'Освещение включено.';
    case 'LIGHT_OFF':
      return 'Освещение выключено.';
    case 'SNAPSHOT_UPDATED':
      return 'Данные по теплице успешно обновлены.';
    default: {
      if (payload.includes('STATE=ON')) {
        return 'Освещение сейчас активно.';
      }

      if (payload.includes('STATE=OFF')) {
        return 'Освещение сейчас выключено.';
      }

      if (args.PLANT && args.MOISTURE) {
        return `В зоне ${Number(args.PLANT) + 1} влажность ${args.MOISTURE}%.`;
      }

      return payload
        .replaceAll('|', ' • ')
        .replace(/_/g, ' ')
        .replace(/\b([A-Z]{2,})\b/g, (match) => match.toLowerCase());
    }
  }
}

function describeStatePayload(
  blockName: string,
  payload: string,
  parsedPayload: Record<string, string> | null
): string {
  const args = parsedPayload ?? parseKeyValuePayload(payload);

  if (blockName === 'LIGHT') {
    const state = args.STATE === 'ON' ? 'включён' : args.STATE === 'OFF' ? 'выключен' : 'неизвестен';
    const template = args.TEMPLATE ?? args.LTPL;
    return template ? `Свет ${state}, профиль ${template}.` : `Свет ${state}.`;
  }

  if (blockName.startsWith('PLANT')) {
    const moisture = args.MOISTURE ? `${args.MOISTURE}%` : 'нет датчика';
    const mode =
      args.MODE === 'MOISTURE' ? 'по влажности' : args.MODE === 'TIMER' ? 'по таймеру' : 'без режима';
    return `Влажность ${moisture}, режим ${mode}.`;
  }

  if (blockName === 'SYSTEM') {
    const summary = Object.entries(args)
      .slice(0, 3)
      .map(([key, value]) => `${key.toLowerCase()}: ${value}`)
      .join(' • ');
    return summary || 'Системный блок обновлён.';
  }

  return payload.replaceAll('|', ' • ');
}

function describeHeartbeatPayload(payload: string, parsedPayload: Record<string, string> | null): string {
  const args = parsedPayload ?? parseKeyValuePayload(payload);
  const parts = [
    args.RSSI ? `RSSI ${args.RSSI}` : null,
    args.UPTIME ? `uptime ${args.UPTIME}` : null,
    args.IP ? `IP ${args.IP}` : null,
  ].filter(Boolean);

  return parts.length ? parts.join(' • ') : payload.replaceAll('|', ' • ');
}

function describeCommandStatus(status: string): { label: string; tone: SnapshotCommandItem['tone'] } {
  switch (status) {
    case 'queued':
      return { label: 'в очереди', tone: 'neutral' };
    case 'dispatched':
      return { label: 'отправлена', tone: 'neutral' };
    case 'acknowledged':
      return { label: 'подтверждена', tone: 'neutral' };
    case 'done':
      return { label: 'выполнена', tone: 'success' };
    case 'error':
      return { label: 'с ошибкой', tone: 'warning' };
    default:
      return { label: status, tone: 'neutral' };
  }
}

function getCommandMoment(command: BackendCommand): string {
  return command.completed_at ?? command.acknowledged_at ?? command.dispatched_at ?? command.queued_at;
}

function buildDetailBundle(
  events: BackendEvent[],
  commands: BackendCommand[],
  states: BackendStateRecord[],
  heartbeats: BackendHeartbeat[]
): SnapshotDeviceDetail {
  const mappedEvents = events.slice(0, 4).map((event) => ({
    id: `event-${event.id}`,
    title: event.event_name.replace(/_/g, ' '),
    description: describeEventPayload(event.event_name, event.payload),
    time: formatRelativeMoment(new Date(event.received_at)),
  }));

  const mappedStates = states.slice(0, 4).map((state) => ({
    id: `state-${state.id}`,
    label: state.block_name,
    description: describeStatePayload(state.block_name, state.payload, state.parsed_payload),
    time: formatRelativeMoment(new Date(state.received_at)),
  }));

  const mappedHeartbeats = heartbeats.slice(0, 3).map((heartbeat) => ({
    id: `heartbeat-${heartbeat.id}`,
    description: describeHeartbeatPayload(heartbeat.payload, heartbeat.parsed_payload),
    time: formatRelativeMoment(new Date(heartbeat.received_at)),
  }));

  const mappedCommands = commands.slice(0, 4).map((command) => {
    const status = describeCommandStatus(command.status);
    return {
      id: `command-${command.id}`,
      label: command.command_name,
      statusLabel: status.label,
      time: formatRelativeMoment(new Date(getCommandMoment(command))),
      tone: status.tone,
    };
  });

  return {
    events: mappedEvents,
    states: mappedStates,
    heartbeats: mappedHeartbeats,
    commands: mappedCommands,
    latestStateSummary: mappedStates[0]?.description ?? mappedEvents[0]?.description ?? null,
  };
}

export function BackendSnapshotProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [snapshot, setSnapshot] = useState(defaultValue);

  const loadSnapshot = useCallback(async () => {
    if (!token) {
      setSnapshot({
        ...defaultValue,
        updatedLabel: 'демо-режим',
      });
      return;
    }

    setSnapshot((current) => ({
      ...current,
      isRefreshing: true,
      isInitialLoading: current.source !== 'remote' && current.devices === mockDevices,
      error: null,
    }));

    try {
      const devices = await fetchDevices(token);
      const deviceBundles = await Promise.all(
        devices.map(async (device) => {
          const [events, commands, states, heartbeats] = await Promise.all([
            fetchDeviceEvents(token, device.slug).catch(() => []),
            fetchDeviceCommands(token, device.slug).catch(() => []),
            fetchDeviceStates(token, device.slug).catch(() => []),
            fetchDeviceHeartbeats(token, device.slug).catch(() => []),
          ]);

          return { device, events, commands, states, heartbeats };
        })
      );

      const detailsBySlug = Object.fromEntries(
        deviceBundles.map((bundle) => [
          bundle.device.slug,
          buildDetailBundle(bundle.events, bundle.commands, bundle.states, bundle.heartbeats),
        ])
      );

      const mappedDevices = devices.map((device, index) => {
        const lightBlock = device.snapshot_light ?? {};
        const plantMap = device.snapshot_plants ?? {};
        const deviceName = device.name === 'Greenhouse Controller' ? 'Северная теплица' : device.name;
        const plants = Object.entries(plantMap).map(([plantIndex, plant]) => {
          const moistureValue = Number(plant.MOISTURE ?? 0);
          return {
            name: `Растение ${Number(plantIndex) + 1}`,
            mode:
              plant.MODE === 'MOISTURE'
                ? 'По влажности'
                : plant.MODE === 'TIMER'
                  ? 'По таймеру'
                  : 'Отключено',
            moisture: `${plant.MOISTURE ?? '0'}%`,
            levelPercent: Number.isFinite(moistureValue) ? moistureValue : 0,
          };
        });

        const bundle = deviceBundles.find((item) => item.device.slug === device.slug);
        const pendingCommands =
          bundle?.commands.filter((command) => ['queued', 'dispatched', 'acknowledged'].includes(command.status)).length ??
          0;
        const lastEvent = bundle?.events[0]
          ? describeEventPayload(bundle.events[0].event_name, bundle.events[0].payload)
          : detailsBySlug[device.slug]?.latestStateSummary ?? 'Пока всё спокойно.';
        const lightTemplate = lightBlock.TEMPLATE ?? lightBlock.LTPL ?? `Профиль ${index + 1}`;

        return {
          slug: device.slug,
          name: deviceName,
          connected: Boolean(device.last_seen_at),
          plantsOnline: plants.length,
          pendingCommands,
          lightTemplate,
          lastHeartbeat: formatRelativeAge(device.last_seen_at),
          lastEvent,
          plants,
        };
      });

      const activity = deviceBundles
        .flatMap((bundle) =>
          bundle.events.slice(0, 3).map((event) => {
            const receivedAt = new Date(event.received_at);

            return {
              id: `${bundle.device.slug}-${event.id}`,
              title: describeEventTitle(bundle.device.name),
              description: describeEventPayload(event.event_name, event.payload),
              time: formatRelativeMoment(receivedAt),
              timestamp: receivedAt.getTime(),
            };
          })
        )
        .sort((left, right) => right.timestamp - left.timestamp)
        .map(({ timestamp: _timestamp, ...item }) => item);

      const allCommands = deviceBundles.flatMap((bundle) => bundle.commands);
      const stats = [
        { label: 'В очереди', value: `${allCommands.filter((item) => item.status === 'queued').length}`.padStart(2, '0') },
        { label: 'Выполнено', value: `${allCommands.filter((item) => item.status === 'done').length}`.padStart(2, '0') },
        { label: 'Ошибки', value: `${allCommands.filter((item) => item.status === 'error').length}`.padStart(2, '0') },
      ];

      setSnapshot({
        devices: mappedDevices.length ? mappedDevices : mockDevices,
        activity: activity.length ? activity : mockActivity,
        commandStats: stats,
        detailsBySlug,
        source: 'remote',
        isRefreshing: false,
        isInitialLoading: false,
        error: null,
        updatedLabel: `обновлено в ${formatRelativeMoment(new Date())}`,
      });
    } catch (error) {
      setSnapshot({
        devices: mockDevices,
        activity: mockActivity,
        commandStats: mockCommandStats,
        detailsBySlug: {},
        source: 'mock',
        isRefreshing: false,
        isInitialLoading: false,
        error: error instanceof Error ? error.message : 'Не удалось загрузить данные',
        updatedLabel: 'резервные данные',
      });
    }
  }, [token]);

  useEffect(() => {
    void loadSnapshot();
  }, [token, loadSnapshot]);

  const value = useMemo<BackendSnapshotValue>(
    () => ({
      ...snapshot,
      refresh: async () => {
        await loadSnapshot();
      },
    }),
    [loadSnapshot, snapshot]
  );

  return <BackendSnapshotContext.Provider value={value}>{children}</BackendSnapshotContext.Provider>;
}

export function useBackendSnapshot() {
  const context = useContext(BackendSnapshotContext);
  if (!context) {
    throw new Error('useBackendSnapshot must be used inside BackendSnapshotProvider');
  }
  return context;
}
