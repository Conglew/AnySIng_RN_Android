import { create } from 'zustand';

export type VideoFrameRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type VideoDisplayMode = 'mini' | 'fullscreen';

type FullscreenVideoStore = {
  /**
   * 目前播放器顯示模式。
   *
   * mini：
   * 顯示在 HomeSidePanel 的 playerFrame 位置。
   *
   * fullscreen：
   * 顯示為全螢幕。
   */
  mode: VideoDisplayMode;

  /**
   * 小播放器框的位置。
   *
   * SharedVideoPlayer 會根據這個座標，
   * 把唯一的 Video 疊到 HomeSidePanel 的 playerFrame 上。
   */
  miniRect: VideoFrameRect | null;

  /**
   * 是否因為 Home 內部面板開啟而暫時隱藏播放器。
   *
   * 例如：
   * - 我的歌單
   * - 緩存下載
   * - 分類
   * - 新歌
   * - 排行榜
   * - 歌手
   */
  isBlockedByPanel: boolean;

  /**
   * 打開全螢幕。
   */
  openFullscreen: (miniRect: VideoFrameRect) => void;

  /**
   * 關閉全螢幕，回到小播放器位置。
   */
  closeFullscreen: () => void;

  /**
   * 更新小播放器框位置。
   *
   * 用途：
   * HomeSidePanel layout 完成後，可以把 playerFrame 的座標交給 SharedVideoPlayer。
   */
  setMiniRect: (miniRect: VideoFrameRect) => void;
  setBlockedByPanel: (isBlocked: boolean) => void;
};

export const useFullscreenVideoStore = create<FullscreenVideoStore>((set) => ({
  mode: 'mini',
  miniRect: null,
  isBlockedByPanel: false,

  openFullscreen: (miniRect) => {
    set({
      mode: 'fullscreen',
      miniRect,
    });
  },

  closeFullscreen: () => {
    set({
      mode: 'mini',
    });
  },

  setMiniRect: (miniRect) => {
    set({
      miniRect,
    });
  },

  setBlockedByPanel: (isBlocked) => {
    set({
      isBlockedByPanel: isBlocked,
      mode: isBlocked ? 'mini' : undefined,
    });
  },
}));
