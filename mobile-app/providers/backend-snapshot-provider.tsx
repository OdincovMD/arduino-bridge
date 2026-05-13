import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { fetchDeviceCommands, fetchDeviceEvents, fetchDevices } from '@/lib/api';
import { mockActivity, mockCommandStats, mockDevices } from '@/lib/mock-data';
import { useAuth } from '@/providers/auth-provider';

type SnapshotDevice = typeof mockDevices;
type SnapshotActivity = typeof mockActivity;
type SnapshotStats = typeof mockCommandStats;

type BackendSnapshotValue = {
  devices: SnapshotDevice;
  activity: SnapshotActivity;
  commandStats: SnapshotStats;
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
      const activityChunks = await Promise.all(
        devices.slice(0, 3).map(async (device) => {
          const [events, commands] = await Promise.all([
            fetchDeviceEvents(token, device.slug).catch(() => []),
            fetchDeviceCommands(token, device.slug).catch(() => []),
          ]);
          return { device, events, commands };
        })
      );

      const mappedDevices = devices.map((device, index) => {
        const lightBlock = device.snapshot_light ?? {};
        const plantMap = device.snapshot_plants ?? {};
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

        const commandBundle = activityChunks.find((chunk) => chunk.device.slug === device.slug);
        const pendingCommands = commandBundle?.commands.filter((command) => command.status === 'queued').length ?? 0;
        const lastEvent = commandBundle?.events[0]
          ? describeEventPayload(commandBundle.events[0].event_name, commandBundle.events[0].payload)
          : 'Пока всё спокойно.';
        const lightTemplate = lightBlock.TEMPLATE ?? lightBlock.LTPL ?? `Шаблон ${index + 1}`;

        return {
          slug: device.slug,
          name: device.name,
          connected: Boolean(device.last_seen_at),
          plantsOnline: plants.length,
          pendingCommands,
          lightTemplate,
          lastHeartbeat: device.last_seen_at ? 'есть связь' : 'нет данных',
          lastEvent,
          plants,
        };
      });

      const activity = activityChunks
        .flatMap((chunk) =>
          chunk.events.slice(0, 3).map((event) => ({
            id: `${chunk.device.slug}-${event.id}`,
            title: describeEventTitle(chunk.device.name),
            description: describeEventPayload(event.event_name, event.payload),
            time: new Date(event.received_at).toLocaleTimeString('ru-RU', {
              hour: '2-digit',
              minute: '2-digit',
            }),
          }))
        )
        .sort((left, right) => right.time.localeCompare(left.time));

      const allCommands = activityChunks.flatMap((chunk) => chunk.commands);
      const stats = [
        { label: 'В очереди', value: `${allCommands.filter((item) => item.status === 'queued').length}`.padStart(2, '0') },
        { label: 'Выполнено', value: `${allCommands.filter((item) => item.status === 'done').length}`.padStart(2, '0') },
        { label: 'Ошибки', value: `${allCommands.filter((item) => item.status === 'error').length}`.padStart(2, '0') },
      ];

      setSnapshot({
        devices: mappedDevices.length ? mappedDevices : mockDevices,
        activity: activity.length ? activity : mockActivity,
        commandStats: stats,
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
