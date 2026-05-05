import { io, Socket } from 'socket.io-client';

type ServerToClientEvents = {
  'server:hello': (payload: { id: string; now: number }) => void;
  joinedRoom: (room: string) => void;
  newMessage: (payload: { from: string; message: string }) => void;
  songSelected: (payload: { songId: string }) => void;
  pauseSong: () => void;
  playSong: () => void;
  nextSong: () => void;
  audioTrack: (payload: AudioTrackPayload) => void;
  replaySong: () => void;
  interruptionSong: (payload: { songId: string }) => void;
  'server:busy': (payload: { reason: string }) => void;
  authed: (payload: { userId: string }) => void;
  'auth:error': (payload: { message: string }) => void;
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
  userId: string;
};

export function connectSocket({ baseUrl, token, userId }: ConnectSocketParams): AppSocket {
  if (socket?.connected) {
    return socket;
  }

  socket = io(baseUrl, {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
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
    console.log('[Socket] connect_error:', error.message);
  });

  socket.on('server:hello', (payload) => {
    console.log('[Socket] server hello:', payload);
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
