import { APP_CONFIG } from '@/src/config/app-config';
import { ApiError } from './api-error';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type ApiRequestOptions<TBody = unknown> = {
  method: HttpMethod;
  path: string;
  body?: TBody;
  token?: string | null;
  timeoutMs?: number;
};

function buildUrl(path: string) {
  const normalizedBaseUrl = APP_CONFIG.apiBaseUrl.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${normalizedBaseUrl}${normalizedPath}`;
}

function safeStringify(value: unknown) {
  try {
    return JSON.stringify(value);
  } catch {
    return '[Unserializable JSON]';
  }
}

async function parseResponse(response: Response) {
  const contentType = response.headers.get('content-type') ?? '';

  if (!contentType.includes('application/json')) {
    const text = await response.text();

    return text;
  }

  return response.json();
}

function getErrorMessage(parsedResponse: unknown, fallback: string) {
  if (
    typeof parsedResponse === 'object' &&
    parsedResponse !== null &&
    'message' in parsedResponse
  ) {
    return String(parsedResponse.message);
  }

  return fallback;
}

export async function apiRequest<TResponse, TBody = unknown>({
  method,
  path,
  body,
  token,
  timeoutMs = APP_CONFIG.apiTimeoutMs,
}: ApiRequestOptions<TBody>): Promise<TResponse> {
  const url = buildUrl(path);
  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  console.log('[ApiClient] request:', {
    method,
    url,
    hasToken: Boolean(token),
    body,
  });

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : safeStringify(body),
      signal: controller.signal,
    });

    const parsedResponse = await parseResponse(response);

    console.log('[ApiClient] response:', {
      method,
      url,
      status: response.status,
      ok: response.ok,
      data: parsedResponse,
    });

    if (!response.ok) {
      throw new ApiError({
        message: getErrorMessage(
          parsedResponse,
          `API request failed with status ${response.status}`,
        ),
        code: 'api_error',
        status: response.status,
        data: parsedResponse,
      });
    }

    return parsedResponse as TResponse;
  } catch (error) {
    console.log('[ApiClient] error:', {
      method,
      url,
      error,
    });

    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError({
        message: 'API request timeout.',
        code: 'timeout',
        status: 0,
        data: error,
      });
    }

    throw new ApiError({
      message: error instanceof Error ? error.message : 'Unknown network error.',
      code: 'network_error',
      status: 0,
      data: error,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}
