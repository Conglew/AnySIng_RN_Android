import { APP_CONFIG } from '@/src/config/app-config';
import { ENDPOINTS } from '../api/endpoints';

type HealthResponse = {
  ok: boolean;
  service?: string;
  server?: string;
  now?: number;
  t?: number;
};

function buildUrl(path: string) {
  return `${APP_CONFIG.apiBaseUrl.replace(/\/$/, '')}${path}`;
}

export async function pingHealth({
  timeoutMs = 10000,
}: {
  timeoutMs?: number;
} = {}): Promise<HealthResponse> {
  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(buildUrl(ENDPOINTS.health.check), {
      method: 'GET',
      signal: controller.signal,
    });

    const data = (await response.json()) as HealthResponse;

    if (!response.ok) {
      throw new Error(`Health check failed with status ${response.status}`);
    }

    return data;
  } finally {
    clearTimeout(timeoutId);
  }
}