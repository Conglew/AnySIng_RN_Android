import { useEffect, useState } from 'react';

import { APP_CONFIG } from '@/src/config/app-config';
import { getAccessToken } from '@/src/services/auth/auth-token-store';
import { connectSocket, disconnectSocket } from '@/src/services/socket/socket-client';

type UseSocketConnectionParams = {
  enabled?: boolean;
};

export function useSocketConnection({ enabled = true }: UseSocketConnectionParams = {}) {
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

      /**
       * 這裡代表 socket instance 已經建立。
       * 不代表一定 connected。
       * 實際 connected 會由 socket-client.ts 裡的 [Socket] connected log 顯示。
       */
      setIsSocketInitialized(true);
    }

    initializeSocket();

    return () => {
      isMounted = false;
      disconnectSocket();
      setIsSocketInitialized(false);
    };
  }, [enabled]);

  return {
    isSocketInitialized,
  };
}
