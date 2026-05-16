import Constants from 'expo-constants';
import { Platform } from 'react-native';

export type AppConfig = {
  backendUrl: string;
};

export type BackendUser = {
  id: number;
  email: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
};

export type LoginResponse = {
  access_token: string;
  token_type: string;
  user: BackendUser;
};

export type BackendDevice = {
  slug: string;
  name: string;
  is_active: boolean;
  last_seen_at: string | null;
  snapshot_light: Record<string, string> | null;
  snapshot_plants: Record<string, Record<string, string>> | null;
  snapshot_system: Record<string, string> | null;
};

export type BackendDeviceState = {
  slug: string;
  name: string;
  last_seen_at: string | null;
  light: Record<string, string> | null;
  plants: Record<string, Record<string, string>> | null;
  system: Record<string, string> | null;
};

export type BackendEvent = {
  id: number;
  event_name: string;
  payload: string;
  parsed_payload: Record<string, string> | null;
  received_at: string;
};

export type BackendStateRecord = {
  id: number;
  block_name: string;
  payload: string;
  parsed_payload: Record<string, string> | null;
  received_at: string;
};

export type BackendHeartbeat = {
  id: number;
  payload: string;
  parsed_payload: Record<string, string> | null;
  received_at: string;
};

export type BackendCommand = {
  id: number;
  protocol_command_id: number;
  command_name: string;
  payload: string;
  status: string;
  ack_payload: string | null;
  result_payload: string | null;
  error_payload: string | null;
  queued_at: string;
  dispatched_at: string | null;
  acknowledged_at: string | null;
  completed_at: string | null;
};

export type EnqueueCommandPayload = {
  raw_command?: string;
  command_name?: string;
  args?: Record<string, string>;
};

function getExtraValue(key: string): string | undefined {
  const expoConfig = Constants.expoConfig;
  const extra = expoConfig?.extra as Record<string, string | undefined> | undefined;
  return extra?.[key];
}

function resolveBackendUrl(): string {
  const sharedUrl = getExtraValue('backendUrl');
  const webUrl = getExtraValue('backendUrlWeb');
  const nativeUrl = getExtraValue('backendUrlNative');

  if (Platform.OS === 'web') {
    if (webUrl) {
      return webUrl;
    }

    if (sharedUrl) {
      return sharedUrl;
    }

    if (typeof window !== 'undefined') {
      if (window.location.port === '8080') {
        return window.location.origin;
      }

      return `${window.location.protocol}//${window.location.hostname}:8080`;
    }
  }

  return nativeUrl ?? sharedUrl ?? 'http://127.0.0.1:8080';
}

export const appConfig: AppConfig = {
  backendUrl: resolveBackendUrl(),
};

async function fetchJson<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`${appConfig.backendUrl}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Backend request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

async function readErrorDetail(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { detail?: string };
    if (payload?.detail) {
      return payload.detail;
    }
  } catch {
    // Fallback to generic message when backend does not return JSON.
  }

  return `Ошибка backend: ${response.status}`;
}

export async function loginRequest(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${appConfig.backendUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error('Неверная почта, пароль или backend недоступен');
  }

  return (await response.json()) as LoginResponse;
}

export async function fetchDevices(token: string): Promise<BackendDevice[]> {
  return fetchJson<BackendDevice[]>('/api/v1/app/devices', token);
}

export async function fetchDeviceState(token: string, slug: string): Promise<BackendDeviceState> {
  return fetchJson<BackendDeviceState>(`/api/v1/app/devices/${slug}/state`, token);
}

export async function fetchDeviceEvents(token: string, slug: string): Promise<BackendEvent[]> {
  return fetchJson<BackendEvent[]>(`/api/v1/app/devices/${slug}/events`, token);
}

export async function fetchDeviceStates(token: string, slug: string): Promise<BackendStateRecord[]> {
  return fetchJson<BackendStateRecord[]>(`/api/v1/app/devices/${slug}/states`, token);
}

export async function fetchDeviceHeartbeats(token: string, slug: string): Promise<BackendHeartbeat[]> {
  return fetchJson<BackendHeartbeat[]>(`/api/v1/app/devices/${slug}/heartbeats`, token);
}

export async function fetchDeviceCommands(token: string, slug: string): Promise<BackendCommand[]> {
  return fetchJson<BackendCommand[]>(`/api/v1/app/devices/${slug}/commands`, token);
}

export async function enqueueDeviceCommand(
  token: string,
  slug: string,
  payload: EnqueueCommandPayload
): Promise<BackendCommand> {
  const response = await fetch(`${appConfig.backendUrl}/api/v1/app/devices/${slug}/commands`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await readErrorDetail(response));
  }

  return (await response.json()) as BackendCommand;
}
