import { useEffect, useState } from 'react';

import { APP_CONFIG } from '@/src/config/app-config';
import { getAccessToken } from '@/src/services/auth/auth-token-store';
import { connectSocket, disconnectSocket, getSocket } from '@/src/services/socket/socket-client';

type UseSocketConnectionParams = {
  enabled?: boolean;
  roomId?: string | null;
};

export function useSocketConnection({
  enabled = true,
  roomId = null,
}: UseSocketConnectionParams = {}) {
  const [isSocketInitialized, setIsSocketInitialized] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function initializeSocket() {
      if (!enabled) {
        setIsSocketInitialized(false);
        return;
      }

      const token = await getAccessToken();

      if (!isMounted) {
        return;
      }

      if (!token) {
        console.log('[SocketConnection] missing access token.');
        setIsSocketInitialized(false);
        return;
      }

      connectSocket({
        baseUrl: APP_CONFIG.apiBaseUrl,
        token,
      });

      setIsSocketInitialized(true);
    }

    initializeSocket();

    return () => {
      isMounted = false;

      /**
       * 這裡只在 enabled 關閉或 RootLayout 卸載時才斷線。
       * 如果只是 roomId 變更，不要重建 socket。
       */
      if (!enabled) {
        disconnectSocket();
        setIsSocketInitialized(false);
      }
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const socket = getSocket();

    if (!socket) {
      return;
    }

    const joinCurrentRoom = () => {
      if (!roomId) {
        console.log('[SocketConnection] missing roomId, skip joinRoom.');
        return;
      }

      console.log('[SocketConnection] joinRoom:', roomId);
      socket.emit('joinRoom', roomId);
    };

    const handleJoinedRoom = (room: string) => {
      console.log('[SocketConnection] joinedRoom:', room);
    };

    socket.on('joinedRoom', handleJoinedRoom);

    if (socket.connected) {
      joinCurrentRoom();
    } else {
      socket.once('connect', joinCurrentRoom);
    }

    return () => {
      socket.off('joinedRoom', handleJoinedRoom);
      socket.off('connect', joinCurrentRoom);
    };
  }, [enabled, roomId]);

  return {
    isSocketInitialized,
  };
}
