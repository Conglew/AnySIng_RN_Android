import { useEffect, useRef } from 'react';

import { usePlayerControlStore } from '@/src/features/main/store/player-control.store';
import { useInsertSongPlayback } from '@/src/features/player/hook/use-insert-song-playback';
import { usePlaybackQueueStore } from '@/src/features/player/stores/playback-queue.store';
import { getSocket } from '@/src/services/socket/socket-client';

import { getAccessToken } from '@/src/services/auth/auth-token-store';
import { songClient } from '@/src/services/song/song-client';

type SongRequestPayload =
  | string
  | {
      songId?: string;
    };

function normalizeSongId(payload: SongRequestPayload) {
  if (typeof payload === 'string') {
    return payload;
  }

  return payload.songId ?? '';
}

export function usePlayerSocketControls(isEnabled: boolean) {
  const finishCurrent = usePlaybackQueueStore((state) => state.finishCurrent);

  const setPaused = usePlayerControlStore((state) => state.setPaused);
  const restartCurrentSong = usePlayerControlStore((state) => state.restartCurrentSong);
  const setAudioTrackMode = usePlayerControlStore((state) => state.setAudioTrackMode);

  const { enqueueSongAfterDownload, insertSongNext } = useInsertSongPlayback();

  const processingSongIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isEnabled) {
      return;
    }

    const socket = getSocket();

    if (!socket) {
      console.log('[PlayerSocketControls] socket is not initialized.');
      return;
    }

    const handlePauseSong = () => {
      console.log('[PlayerSocketControls] received pauseSong');
      setPaused(true);
    };

    const handlePlaySong = () => {
      console.log('[PlayerSocketControls] received playSong');
      setPaused(false);
    };

    const handleNextSong = () => {
      console.log('[PlayerSocketControls] received nextSong');
      finishCurrent();
      setPaused(false);
    };

    const handleReplaySong = () => {
      console.log('[PlayerSocketControls] received replaySong');
      restartCurrentSong();
      setPaused(false);
    };

    const handleAudioTrack = (payload: unknown) => {
      console.log('[PlayerSocketControls] received audioTrack:', payload);

      let nextMode: 'vocal' | 'accompaniment' = 'accompaniment';

      if (typeof payload === 'boolean') {
        nextMode = payload ? 'vocal' : 'accompaniment';
      } else if (payload && typeof payload === 'object') {
        const audioPayload = payload as {
          vocal?: boolean;
          mode?: 'vocal' | 'accompaniment';
        };

        nextMode = audioPayload.mode ?? (audioPayload.vocal ? 'vocal' : 'accompaniment');
      }

      setAudioTrackMode(nextMode);
    };

    const handleSongSelected = async (payload: SongRequestPayload) => {
      const songId = normalizeSongId(payload);

      if (!songId) {
        console.log('[PlayerSocketControls] songSelected ignored: missing songId', payload);
        return;
      }

      if (processingSongIdsRef.current.has(songId)) {
        console.log('[PlayerSocketControls] songSelected ignored: already processing', songId);
        return;
      }

      processingSongIdsRef.current.add(songId);

      try {
        console.log('[PlayerSocketControls] received songSelected:', songId);

        const token = await getAccessToken();

        if (!token) {
          throw new Error('Missing access token.');
        }

        const song = await songClient.getSongById({
          token,
          songId,
        });

        await enqueueSongAfterDownload(song);
      } catch (error) {
        console.log('[PlayerSocketControls] songSelected failed:', {
          songId,
          error,
        });
      } finally {
        processingSongIdsRef.current.delete(songId);
      }
    };

    const handleInterruptionSong = async (payload: SongRequestPayload) => {
      const songId = normalizeSongId(payload);

      if (!songId) {
        console.log('[PlayerSocketControls] interruptionSong ignored: missing songId', payload);
        return;
      }

      if (processingSongIdsRef.current.has(songId)) {
        console.log('[PlayerSocketControls] interruptionSong ignored: already processing', songId);
        return;
      }

      processingSongIdsRef.current.add(songId);

      try {
        console.log('[PlayerSocketControls] received interruptionSong:', songId);

        /**
         * Web 只傳 songId，所以 App 要先取得完整 SongDto。
         */
        const token = await getAccessToken();

        if (!token) {
          throw new Error('Missing access token.');
        }

        const song = await songClient.getSongById({
          token,
          songId,
        });

        /**
         * 插播：下載完成後插到下一首。
         */
        await insertSongNext(song);
      } catch (error) {
        console.log('[PlayerSocketControls] interruptionSong failed:', {
          songId,
          error,
        });
      } finally {
        processingSongIdsRef.current.delete(songId);
      }
    };

    socket.on('pauseSong', handlePauseSong);
    socket.on('playSong', handlePlaySong);
    socket.on('nextSong', handleNextSong);
    socket.on('replaySong', handleReplaySong);
    socket.on('audioTrack', handleAudioTrack);

    socket.on('songSelected', handleSongSelected);
    socket.on('interruptionSong', handleInterruptionSong);

    return () => {
      socket.off('pauseSong', handlePauseSong);
      socket.off('playSong', handlePlaySong);
      socket.off('nextSong', handleNextSong);
      socket.off('replaySong', handleReplaySong);
      socket.off('audioTrack', handleAudioTrack);

      socket.off('songSelected', handleSongSelected);
      socket.off('interruptionSong', handleInterruptionSong);
    };
  }, [
    isEnabled,
    finishCurrent,
    setPaused,
    restartCurrentSong,
    setAudioTrackMode,
    enqueueSongAfterDownload,
    insertSongNext,
  ]);
}
