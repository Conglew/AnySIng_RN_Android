import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useDebugLogStore } from '@/src/shared/debug/debug-log.store';

export function DebugLogOverlay() {
  const logs = useDebugLogStore((state) => state.logs);

  useEffect(() => {
    useDebugLogStore.getState().addLog('DebugLogOverlay', 'mounted');
  }, []);

  if (logs.length === 0) {
    return null;
  }

  const latestLogs = logs.slice(0, 50);

  return (
    <View pointerEvents="none" style={styles.container}>
      {latestLogs.map((log) => (
        <Text key={log.id} style={styles.text} numberOfLines={1}>
          {log.time} [{log.scope}] {log.message}
        </Text>
      ))}
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
    maxWidth: 520,
    maxHeight: 180,
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
