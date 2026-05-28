import { APP_CONFIG } from '@/src/config/app-config';
import { ENDPOINTS } from './endpoints';
import { ApiError } from './api-error';
import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
} from '@/src/services/auth/auth-token-store';

import { useDebugLogStore } from '@/src/shared/debug/debug-log.store';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type ApiRequestOptions<TBody = unknown> = {
  method: HttpMethod;
  path: string;
  body?: TBody;
  token?: string | null;
  timeoutMs?: number;

  /**
   * true 時不做 refresh token retry。
   * 登入、刷新 token 本身、登出等 API 建議設 true。
   */
  skipAuthRefresh?: boolean;
};

type RefreshTokenResponse = {
  access_exp?: number;
  access_token?: string;
  refresh_exp?: number;
  refresh_token?: string;

  accessToken?: string;
  refreshToken?: string;
};

let refreshTokenPromise: Promise<string | null> | null = null;

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

function addApiDebugLog(message: string, data?: unknown) {
  useDebugLogStore.getState().addLog('ApiClient', message, data);
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

async function refreshAccessToken() {
  if (refreshTokenPromise) {
    return refreshTokenPromise;
  }

  refreshTokenPromise = refreshAccessTokenInternal().finally(() => {
    refreshTokenPromise = null;
  });

  return refreshTokenPromise;
}

async function refreshAccessTokenInternal() {
  const refreshToken = await getRefreshToken();

  console.log('[LanguageSelectScreen] stored refresh token check:', {
    hasRefreshToken: Boolean(refreshToken),
  });

  if (!refreshToken) {
    console.log('[ApiClient] refresh ignored: missing refresh token');

    addApiDebugLog('refresh ignored: missing refresh token');

    return null;
  }

  const url = buildUrl(ENDPOINTS.auth.refresh);
  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    console.log('[ApiClient] refresh timeout reached, abort request:', {
      method: 'POST',
      url,
      timeoutMs: APP_CONFIG.apiTimeoutMs,
    });

    addApiDebugLog('refresh timeout abort', {
      method: 'POST',
      url,
      timeoutMs: APP_CONFIG.apiTimeoutMs,
    });

    controller.abort();
  }, APP_CONFIG.apiTimeoutMs);

  try {
    console.log('[ApiClient] refresh request:', {
      method: 'POST',
      url,
      hasRefreshToken: Boolean(refreshToken),
    });

    addApiDebugLog('refresh request', {
      method: 'POST',
      url,
      hasRefreshToken: Boolean(refreshToken),
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${refreshToken}`,
      },
      body: safeStringify({
        token: refreshToken,
      }),
      signal: controller.signal,
    });

    const parsedResponse = (await parseResponse(response)) as RefreshTokenResponse;

    console.log('[ApiClient] refresh response:', {
      status: response.status,
      ok: response.ok,
      data: parsedResponse,
    });

    addApiDebugLog('refresh response', {
      status: response.status,
      ok: response.ok,
      hasAccessToken: Boolean(parsedResponse.access_token ?? parsedResponse.accessToken),
      hasRefreshToken: Boolean(parsedResponse.refresh_token ?? parsedResponse.refreshToken),
    });

    if (!response.ok) {
      await clearAuthSession();

      throw new ApiError({
        message: getErrorMessage(
          parsedResponse,
          `Refresh token failed with status ${response.status}`,
        ),
        code: 'refresh_token_failed',
        status: response.status,
        data: parsedResponse,
      });
    }

    const nextAccessToken = parsedResponse.access_token ?? parsedResponse.accessToken;
    const nextRefreshToken = parsedResponse.refresh_token ?? parsedResponse.refreshToken;

    if (!nextAccessToken) {
      await clearAuthSession();

      throw new ApiError({
        message: 'Refresh token response missing access token.',
        code: 'refresh_token_invalid_response',
        status: response.status,
        data: parsedResponse,
      });
    }

    await setAuthTokens({
      accessToken: nextAccessToken,
      refreshToken: nextRefreshToken,
    });

    addApiDebugLog('refresh success: tokens saved', {
      hasNextAccessToken: Boolean(nextAccessToken),
      hasNextRefreshToken: Boolean(nextRefreshToken),
    });

    return nextAccessToken;
  } catch (error) {
    console.log('[ApiClient] refresh error:', {
      url,
      error,
    });

    if (error instanceof ApiError) {
      throw error;
    }

    addApiDebugLog('refresh error', {
      url,
      errorName: error instanceof Error ? error.name : undefined,
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError({
        message: 'Refresh token request timeout.',
        code: 'refresh_token_timeout',
        status: 0,
        data: error,
      });
    }

    throw new ApiError({
      message: error instanceof Error ? error.message : 'Unknown refresh token error.',
      code: 'refresh_token_network_error',
      status: 0,
      data: error,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function sendRequest<TResponse, TBody = unknown>({
  method,
  path,
  body,
  token,
  timeoutMs,
}: {
  method: HttpMethod;
  path: string;
  body?: TBody;
  token?: string | null;
  timeoutMs: number;
}): Promise<TResponse> {
  const url = buildUrl(path);
  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    console.log('[ApiClient] timeout reached, abort request:', {
      method,
      url,
      timeoutMs,
    });

    addApiDebugLog('request timeout abort', {
      method,
      url,
      timeoutMs,
    });

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
    timeoutMs,
  });

  addApiDebugLog('request', {
    method,
    url,
    hasToken: Boolean(token),
    hasBody: body !== undefined,
    timeoutMs,
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

    addApiDebugLog('response', {
      method,
      url,
      status: response.status,
      ok: response.ok,
    });

    if (!response.ok) {
      addApiDebugLog('response not ok', {
        method,
        url,
        status: response.status,
        message: getErrorMessage(
          parsedResponse,
          `API request failed with status ${response.status}`,
        ),
      });

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

    addApiDebugLog('error', {
      method,
      url,
      errorName: error instanceof Error ? error.name : undefined,
      errorMessage: error instanceof Error ? error.message : String(error),
      isApiError: error instanceof ApiError,
      status: error instanceof ApiError ? error.status : undefined,
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

export async function apiRequest<TResponse, TBody = unknown>({
  method,
  path,
  body,
  token,
  timeoutMs = APP_CONFIG.apiTimeoutMs,
  skipAuthRefresh = false,
}: ApiRequestOptions<TBody>): Promise<TResponse> {
  const resolvedToken = token !== undefined ? token : await getAccessToken();

  addApiDebugLog('api request start', {
    method,
    path,
    hasResolvedToken: Boolean(resolvedToken),
    timeoutMs,
    skipAuthRefresh,
  });

  try {
    return await sendRequest<TResponse, TBody>({
      method,
      path,
      body,
      token: resolvedToken,
      timeoutMs,
    });
  } catch (error) {
    if (skipAuthRefresh || !(error instanceof ApiError) || error.status !== 401) {
      addApiDebugLog('api request failed: no refresh retry', {
        method,
        path,
        skipAuthRefresh,
        isApiError: error instanceof ApiError,
        status: error instanceof ApiError ? error.status : undefined,
        errorMessage: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }

    console.log('[ApiClient] request got 401, try refresh token:', {
      method,
      path,
    });

    addApiDebugLog('401: refresh start', {
      method,
      path,
    });

    const nextAccessToken = await refreshAccessToken();

    if (!nextAccessToken) {
      addApiDebugLog('401: refresh failed, clear session', {
        method,
        path,
      });

      await clearAuthSession();
      throw error;
    }

    console.log('[ApiClient] retry request with refreshed token:', {
      method,
      path,
    });

    addApiDebugLog('401: retry with refreshed token', {
      method,
      path,
    });

    return sendRequest<TResponse, TBody>({
      method,
      path,
      body,
      token: nextAccessToken,
      timeoutMs,
    });
  }
}
