import { io, Socket } from 'socket.io-client';

import type { PlaylistNowPlayingResponse } from '@/src/services/playlist/playlist.types';

export type SongSelectedPayload = {
  songId: string;
  requestedAt?: number;
  requestedBy?: string;
};

export type NowUpdatedPayload = {
  current: {
    id: string;
    title?: string;
    artists?: string[];
    coverUrl?: string;
  } | null;
  index?: number;
  next?: {
    id: string;
    title?: string;
    artists?: string[];
    coverUrl?: string;
  } | null;
  ts?: number;
};

type SocketPlaybackEventHandlers = {
  onSongSelected?: (payload: SongSelectedPayload) => void;
  onPauseSong?: () => void;
  onPlaySong?: () => void;
  onNextSong?: () => void;
  onReplaySong?: () => void;
  onAudioTrack?: (payload: AudioTrackPayload) => void;
  onNowUpdated?: (payload: NowUpdatedPayload) => void;
};

const playbackEventHandlers = new Set<SocketPlaybackEventHandlers>();

export function addSocketPlaybackEventHandler(handler: SocketPlaybackEventHandlers) {
  playbackEventHandlers.add(handler);

  return () => {
    playbackEventHandlers.delete(handler);
  };
}

function notifySocketPlaybackEvent<K extends keyof SocketPlaybackEventHandlers>(
  key: K,
  ...args: Parameters<NonNullable<SocketPlaybackEventHandlers[K]>>
) {
  playbackEventHandlers.forEach((handler) => {
    const callback = handler[key];

    if (!callback) {
      return;
    }

    try {
      (callback as (...callbackArgs: typeof args) => void)(...args);
    } catch (error) {
      console.log(`[Socket] playback handler failed: ${String(key)}`, error);
    }
  });
}

type ServerToClientEvents = {
  'server:hello': (payload: { id: string; now: number }) => void;
  joinedRoom: (room: string) => void;
  newMessage: (payload: { from: string; message: string }) => void;

  songSelected: (payload: SongSelectedPayload) => void;
  pauseSong: () => void;
  playSong: () => void;
  nextSong: () => void;

  audioTrack: (payload: AudioTrackPayload) => void;
  replaySong: () => void;
  interruptionSong: (payload: { songId: string }) => void;

  downloadStatus: (payload: unknown) => void;

  'playlist:updated': (payload: {
    reason: string;
    playlistId: string | null;
    size: number | null;
    ts: number;
  }) => void;

  nowPlaying: (payload: PlaylistNowPlayingResponse) => void;
  'now:updated': (payload: PlaylistNowPlayingResponse) => void;

  'server:busy': (payload: { reason: string }) => void;
  authed: (payload: { userId: string }) => void;
  'auth:error': (payload: { message: string }) => void;
  'auth:forceLogout': (payload: unknown) => void;

  'billing.subscription_activated': (payload: {
    userId: string;
    type: 'billing.subscription_activated';
    stripeSubscriptionId: string;
    currentSubscription: string;
    status: string;
    plan: string;
    priceId: string | null;
    startedAt: string;
    expiresAt: string;
    at: number;
  }) => void;
};

type ClientToServerEvents = {
  joinRoom: (room: string) => void;
  sendMessage: (payload: { room: string; message: string }) => void;

  selectSong: (
    songId: string,
    callback?: (response: { ok: boolean; rooms: string[] }) => void,
  ) => void;

  pauseSong: (currentRoom: string) => void;
  playSong: (currentRoom: string) => void;
  nextSong: (currentRoom: string) => void;

  audioTrack: (
    currentRoom: string,
    payload: AudioTrackPayload,
    callback?: (response: { ok: boolean }) => void,
  ) => void;

  replaySong: (currentRoom: string) => void;

  interruptionSong: (
    songId: string,
    callback?: (response: { ok: boolean; rooms: string[] }) => void,
  ) => void;

  auth: (payload: { userId: string }) => void;
};

export type AudioTrackPayload = {
  trackId: string;
  trackIndex?: number;
  label?: string;
  language?: string;
};

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: AppSocket | null = null;

type ConnectSocketParams = {
  baseUrl: string;
  token: string;
  userId?: string | null;
};

export function connectSocket({ baseUrl, token, userId }: ConnectSocketParams): AppSocket {
  /**
   * 只要 socket instance 已經存在，就不要重複建立。
   * socket 可能正在 connecting，但還沒 connected。
   */
  if (socket) {
    return socket;
  }

  socket = io(baseUrl, {
    path: '/socket.io',

    /**
     * 先 polling，再 upgrade websocket。
     * 這比直接 websocket 對 Android / Render / proxy 環境更穩。
     */
    transports: ['polling', 'websocket'],

    auth: {
      token,
      userId,
    },

    query: {
      userId,
    },

    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  });

  socket.on('connect', () => {
    console.log('[Socket] connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.log('[Socket] connect_error:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
  });

  socket.on('server:hello', (payload) => {
    console.log('[Socket] server hello:', payload);
  });

  socket.on('joinedRoom', (room) => {
    console.log('[Socket] joinedRoom:', room);
  });

  socket.off('songSelected');
  socket.off('pauseSong');
  socket.off('playSong');
  socket.off('nextSong');
  socket.off('replaySong');
  socket.off('audioTrack');
  socket.off('nowPlaying');
  socket.off('now:updated');

  socket.on('songSelected', (payload) => {
    console.log('[Socket] songSelected received:', payload);
    notifySocketPlaybackEvent('onSongSelected', payload);
  });

  socket.on('pauseSong', () => {
    console.log('[Socket] pauseSong received:', {
      socketId: socket?.id,
      time: Date.now(),
    });
    notifySocketPlaybackEvent('onPauseSong');
  });

  socket.on('playSong', () => {
    console.log('[Socket] playSong received:', {
      socketId: socket?.id,
      time: Date.now(),
    });
    notifySocketPlaybackEvent('onPlaySong');
  });

  socket.on('nextSong', () => {
    console.log('[Socket] nextSong received');
    notifySocketPlaybackEvent('onNextSong');
  });

  socket.on('replaySong', () => {
    console.log('[Socket] replaySong received');
    notifySocketPlaybackEvent('onReplaySong');
  });

  socket.on('audioTrack', (payload) => {
    console.log('[Socket] audioTrack received:', payload);
    notifySocketPlaybackEvent('onAudioTrack', payload);
  });

  socket.on('nowPlaying', (payload) => {
    console.log('[Socket] nowPlaying received:', payload);
  });

  socket.on('now:updated', (payload) => {
    console.log('[Socket] now:updated received:', payload);
    notifySocketPlaybackEvent('onNowUpdated', payload);
  });

  return socket;
}

export function getSocket(): AppSocket | null {
  return socket;
}

export function disconnectSocket() {
  if (!socket) {
    return;
  }

  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
}
