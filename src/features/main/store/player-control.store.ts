import { create } from 'zustand';

export type AudioTrackMode = 'vocal' | 'accompaniment';

type PlayerControlState = {
  isPaused: boolean;
  audioTrackMode: AudioTrackMode;

  /*
   * react-native-video 使用 selectedAudioTrack={{ type: 'index', value: number }} 切換音軌。
   * 這裡儲存的是 audioTracks 陣列 index，不是 VLC 的 audioTrack id。
   */
  vocalAudioTrackIndex: number | null;
  accompanimentAudioTrackIndex: number | null;

  restartToken: number;

  togglePause: () => void;
  setPaused: (value: boolean) => void;

  toggleAudioTrackMode: () => void;
  setAudioTrackMode: (value: AudioTrackMode) => void;

  restartCurrentSong: () => void;

  setAudioTrackIndexes: (value: {
    vocalAudioTrackIndex: number | null;
    accompanimentAudioTrackIndex: number | null;
  }) => void;

  resetAudioTrackIndexes: () => void;
};

export const usePlayerControlStore = create<PlayerControlState>((set) => ({
  isPaused: false,
  audioTrackMode: 'vocal',

  vocalAudioTrackIndex: null,
  accompanimentAudioTrackIndex: null,

  restartToken: 0,

  togglePause: () => {
    set((state) => ({
      isPaused: !state.isPaused,
    }));
  },

  setPaused: (value) => {
    set({
      isPaused: value,
    });
  },

  toggleAudioTrackMode: () => {
    set((state) => ({
      audioTrackMode: state.audioTrackMode === 'vocal' ? 'accompaniment' : 'vocal',
    }));
  },

  setAudioTrackMode: (value) => {
    set({
      audioTrackMode: value,
    });
  },

  setAudioTrackIndexes: (value) => {
    set({
      vocalAudioTrackIndex: value.vocalAudioTrackIndex,
      accompanimentAudioTrackIndex: value.accompanimentAudioTrackIndex,
    });
  },

  restartCurrentSong: () => {
    set((state) => ({
      restartToken: state.restartToken + 1,
      isPaused: false,
    }));
  },

  resetAudioTrackIndexes: () => {
    set({
      vocalAudioTrackIndex: null,
      accompanimentAudioTrackIndex: null,
    });
  },
}));
