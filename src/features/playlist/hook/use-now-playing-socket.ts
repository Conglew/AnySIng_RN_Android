import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import type { PlaylistNowPlayingResponse } from '@/src/services/playlist/playlist.types';
import { getSocket } from '@/src/services/socket/socket-client';

const NOW_PLAYING_QUERY_KEY = ['playlist', 'now-playing'] as const;

function normalizeNowPlayingPayload(
  payload: PlaylistNowPlayingResponse,
): PlaylistNowPlayingResponse {
  return {
    current: payload?.current ?? null,
    next: payload?.next ?? null,
    index: typeof payload?.index === 'number' ? payload.index : -1,
    ts: typeof payload?.ts === 'number' ? payload.ts : Date.now(),
  };
}

export function useNowPlayingSocket() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = getSocket();

    if (!socket) {
      console.log('[NowPlayingSocket] socket is not initialized.');
      return;
    }

    const handleNowPlaying = (payload: PlaylistNowPlayingResponse) => {
      const normalizedPayload = normalizeNowPlayingPayload(payload);

      console.log('[NowPlayingSocket] received now playing:', normalizedPayload);

      queryClient.setQueryData(NOW_PLAYING_QUERY_KEY, normalizedPayload);
    };

    const syncNowPlayingByApi = () => {
      queryClient.invalidateQueries({
        queryKey: NOW_PLAYING_QUERY_KEY,
      });
    };

    const handleConnect = () => {
      console.log('[NowPlayingSocket] connected:', socket.id);
      syncNowPlayingByApi();
    };

    const handleReconnect = () => {
      console.log('[NowPlayingSocket] reconnected');
      syncNowPlayingByApi();
    };

    const handleDisconnect = (reason: string) => {
      console.log('[NowPlayingSocket] disconnected:', reason);
    };

    const handleConnectError = (error: Error) => {
      console.log('[NowPlayingSocket] connect error:', error.message);
    };

    socket.on('nowPlaying', handleNowPlaying);
    socket.on('now:updated', handleNowPlaying);

    socket.on('connect', handleConnect);
    socket.io.on('reconnect', handleReconnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);

    if (socket.connected) {
      syncNowPlayingByApi();
    }

    return () => {
      socket.off('nowPlaying', handleNowPlaying);
      socket.off('now:updated', handleNowPlaying);

      socket.off('connect', handleConnect);
      socket.io.off('reconnect', handleReconnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
    };
  }, [queryClient]);
}
