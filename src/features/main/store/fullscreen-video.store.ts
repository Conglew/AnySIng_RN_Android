import { create } from 'zustand';

export type FullscreenVideoOriginRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type FullscreenVideoStore = {
  isVisible: boolean;
  videoUri: string | null;
  originRect: FullscreenVideoOriginRect | null;
  isDefaultVideo: boolean;

  showFullscreenVideo: (params: {
    videoUri: string;
    originRect: FullscreenVideoOriginRect;
    isDefaultVideo: boolean;
  }) => void;

  hideFullscreenVideo: () => void;
};

export const useFullscreenVideoStore = create<FullscreenVideoStore>((set) => ({
  isVisible: false,
  videoUri: null,
  originRect: null,
  isDefaultVideo: true,

  showFullscreenVideo: ({ videoUri, originRect, isDefaultVideo }) => {
    set({
      isVisible: true,
      videoUri,
      originRect,
      isDefaultVideo,
    });
  },

  hideFullscreenVideo: () => {
    set({
      isVisible: false,
    });

    setTimeout(() => {
      set({
        videoUri: null,
        originRect: null,
        isDefaultVideo: true,
      });
    }, 260);
  },
}));
