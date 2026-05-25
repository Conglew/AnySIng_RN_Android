import { create } from 'zustand';

type SongFavoriteStatusStore = {
  actionStatusMap: Record<string, boolean | undefined>;
  favoriteStateMap: Record<string, boolean | undefined>;
  setFavoriteActionLoading: (songId: string, isLoading: boolean) => void;
  clearFavoriteActionStatus: (songId: string) => void;
  setFavoriteState: (songId: string, isFavorite: boolean) => void;
};

export const useSongFavoriteStatusStore = create<SongFavoriteStatusStore>((set) => ({
  actionStatusMap: {},
  favoriteStateMap: {},

  setFavoriteActionLoading: (songId, isLoading) => {
    set((state) => ({
      actionStatusMap: {
        ...state.actionStatusMap,
        [songId]: isLoading,
      },
    }));
  },

  clearFavoriteActionStatus: (songId) => {
    set((state) => {
      const nextActionStatusMap = { ...state.actionStatusMap };
      delete nextActionStatusMap[songId];

      return {
        actionStatusMap: nextActionStatusMap,
      };
    });
  },

  setFavoriteState: (songId, isFavorite) => {
    set((state) => ({
      favoriteStateMap: {
        ...state.favoriteStateMap,
        [songId]: isFavorite,
      },
    }));
  },
}));
