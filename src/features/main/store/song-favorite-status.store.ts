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
    set((state) => {
      if (state.actionStatusMap[songId] === isLoading) {
        return state;
      }

      return {
        actionStatusMap: {
          ...state.actionStatusMap,
          [songId]: isLoading,
        },
      };
    });
  },

  clearFavoriteActionStatus: (songId) => {
    set((state) => {
      if (!state.actionStatusMap[songId]) {
        return state;
      }

      const nextActionStatusMap = { ...state.actionStatusMap };
      delete nextActionStatusMap[songId];

      return {
        actionStatusMap: nextActionStatusMap,
      };
    });
  },

  setFavoriteState: (songId, isFavorite) => {
    set((state) => {
      if (state.favoriteStateMap[songId] === isFavorite) {
        return state;
      }

      return {
        favoriteStateMap: {
          ...state.favoriteStateMap,
          [songId]: isFavorite,
        },
      };
    });
  },
}));
