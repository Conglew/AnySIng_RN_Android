import { create } from 'zustand';

export type VideoFrameRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type VideoDisplayMode = 'homeMini' | 'footerMini' | 'fullscreen';

type FullscreenVideoStore = {
  /**
   * 目前播放器顯示模式。
   *
   * homeMini：
   * 顯示在 HomeSidePanel 的播放器框。
   *
   * footerMini：
   * 顯示在 Footer 的錄製 icon / mini 顯示器位置。
   *
   * fullscreen：
   * 顯示為全螢幕。
   */
  mode: VideoDisplayMode;

  /**
   * HomeSidePanel 小播放器框的位置。
   */
  homeMiniRect: VideoFrameRect | null;

  /**
   * Footer mini 播放器框的位置。
   */
  footerMiniRect: VideoFrameRect | null;

  /**
   * 是否因為 Home 內部面板開啟，讓播放器切換到 footerMini 顯示。
   */
  isBlockedByPanel: boolean;

  isFullscreenChromeVisible: boolean;

  /**
   * 打開全螢幕。
   */
  openFullscreen: () => void;

  /**
   * 關閉全螢幕。
   *
   * 如果目前有開啟 Panel，就回到 footerMini。
   * 如果沒有開啟 Panel，就回到 homeMini。
   */
  closeFullscreen: () => void;

  /**
   * 顯示在 HomeSidePanel 位置。
   */
  showHomeMini: () => void;

  /**
   * 顯示在 Footer mini 位置。
   */
  showFooterMini: () => void;

  /**
   * 更新 HomeSidePanel 小播放器位置。
   */
  setHomeMiniRect: (rect: VideoFrameRect) => void;

  /**
   * 更新 Footer mini 播放器位置。
   */
  setFooterMiniRect: (rect: VideoFrameRect) => void;

  /**
   * 設定是否因為 Panel 開啟而切換播放器位置。
   */
  setBlockedByPanel: (isBlocked: boolean) => void;

  showFullscreenChrome: () => void;
  hideFullscreenChrome: () => void;
  setFullscreenChromeVisible: (isVisible: boolean) => void;
};

export const useFullscreenVideoStore = create<FullscreenVideoStore>((set) => ({
  mode: 'homeMini',

  homeMiniRect: null,
  footerMiniRect: null,

  isBlockedByPanel: false,

  openFullscreen: () => {
    set({
      mode: 'fullscreen',
      isFullscreenChromeVisible: true,
    });
  },

  closeFullscreen: () => {
    set((state) => ({
      mode: state.isBlockedByPanel ? 'footerMini' : 'homeMini',
      isFullscreenChromeVisible: true,
    }));
  },

  showHomeMini: () => {
    set({
      mode: 'homeMini',
    });
  },

  showFooterMini: () => {
    set({
      mode: 'footerMini',
    });
  },

  setHomeMiniRect: (rect) => {
    set({
      homeMiniRect: rect,
    });
  },

  setFooterMiniRect: (rect) => {
    set({
      footerMiniRect: rect,
    });
  },

  setBlockedByPanel: (isBlocked) => {
    set((state) => {
      if (state.mode === 'fullscreen') {
        return {
          isBlockedByPanel: isBlocked,
        };
      }

      return {
        isBlockedByPanel: isBlocked,
        mode: isBlocked ? 'footerMini' : 'homeMini',
      };
    });
  },

  isFullscreenChromeVisible: true,

  showFullscreenChrome: () => {
    set({
      isFullscreenChromeVisible: true,
    });
  },

  hideFullscreenChrome: () => {
    set({
      isFullscreenChromeVisible: false,
    });
  },

  setFullscreenChromeVisible: (isVisible) => {
    set({
      isFullscreenChromeVisible: isVisible,
    });
  },
}));
