import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useDebugLogStore } from '@/src/shared/debug/debug-log.store';

function formatUrl(value: unknown) {
  if (typeof value !== 'string') {
    return '';
  }

  try {
    const parsedUrl = new URL(value);

    return `${parsedUrl.pathname}${parsedUrl.search}`;
  } catch {
    return value;
  }
}

function formatDebugData(data: unknown) {
  if (!data || typeof data !== 'object') {
    return '';
  }

  const record = data as Record<string, unknown>;

  const parts: string[] = [];

  const method = typeof record.method === 'string' ? record.method : '';
  const url = formatUrl(record.url);
  const path = typeof record.path === 'string' ? record.path : '';

  if (method || url || path) {
    parts.push(`${method} ${url || path}`.trim());
  }

  if (typeof record.status === 'number') {
    parts.push(`status=${record.status}`);
  }

  if (typeof record.ok === 'boolean') {
    parts.push(`ok=${record.ok}`);
  }

  if (typeof record.timeoutMs === 'number') {
    parts.push(`timeout=${record.timeoutMs}ms`);
  }

  if (typeof record.hasToken === 'boolean') {
    parts.push(`token=${record.hasToken ? 'yes' : 'no'}`);
  }

  if (typeof record.hasResolvedToken === 'boolean') {
    parts.push(`resolvedToken=${record.hasResolvedToken ? 'yes' : 'no'}`);
  }

  if (typeof record.hasRefreshToken === 'boolean') {
    parts.push(`refreshToken=${record.hasRefreshToken ? 'yes' : 'no'}`);
  }

  if (typeof record.hasAccessToken === 'boolean') {
    parts.push(`accessToken=${record.hasAccessToken ? 'yes' : 'no'}`);
  }

  if (typeof record.errorMessage === 'string') {
    parts.push(`error=${record.errorMessage}`);
  }

  if (typeof record.errorName === 'string') {
    parts.push(`name=${record.errorName}`);
  }

  if (typeof record.message === 'string') {
    parts.push(`msg=${record.message}`);
  }

  return parts.length > 0 ? ` | ${parts.join(' | ')}` : '';
}

export function DebugLogOverlay() {
  const logs = useDebugLogStore((state) => state.logs);

  useEffect(() => {
    useDebugLogStore.getState().addLog('DebugLogOverlay', 'mounted');
  }, []);

  if (logs.length === 0) {
    return null;
  }

  const latestLogs = logs.slice(0, 200);

  return (
    <View pointerEvents="none" style={styles.container}>
      {/* {latestLogs.map((log) => (
        <Text key={log.id} style={styles.text} numberOfLines={1}>
          {log.time} [{log.scope}] {log.message}
          {formatDebugData(log.data)}
        </Text>
      ))} */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 999999,
    elevation: 999999,
    maxWidth: 920,
    maxHeight: 240,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.56)',
  },

  text: {
    color: '#00FF7F',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '600',
  },
});
