import { apiRequest } from '@/src/services/api/api-client';
import { ENDPOINTS } from '@/src/services/api/endpoints';

import {
  AddSongToPlaylistResponse,
  GetUserPlaylistsParams,
  InterjectSongNextResponse,
  PlaylistNowPlayingResponse,
  PlaylistType,
  PlayNextResponse,
  RemoveSongFromPlaylistResponse,
  UserPlaylistsResponse,
} from './playlist.types';

function buildQuery(params: Record<string, string | number | undefined | null>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    searchParams.append(key, String(value));
  });

  const queryString = searchParams.toString();

  return queryString ? `?${queryString}` : '';
}

export const playlistClient = {
  /**
   * 取得目前使用者的歌單。
   *
   * type=collect：我的歌單 / 收藏歌曲
   * type=pending：已點 / 待播歌曲
   */
  getUserPlaylists({ token, params }: { token: string; params?: GetUserPlaylistsParams }) {
    const query = buildQuery({
      type: params?.type,
    });

    return apiRequest<UserPlaylistsResponse>({
      method: 'GET',
      path: `${ENDPOINTS.playlists.user}${query}`,
      token,
    });
  },

  /**
   * 取得目前播放 / 下一首。
   */
  getNowPlaying({ token }: { token: string }) {
    return apiRequest<PlaylistNowPlayingResponse>({
      method: 'GET',
      path: ENDPOINTS.playlists.now,
      token,
    });
  },

  /**
   * 一般加入歌單。
   *
   * pending：加入已點 / 待播清單
   * collect：加入我的歌單 / 收藏
   */
  addSongToPlaylist({
    token,
    type,
    songId,
  }: {
    token: string;
    type: PlaylistType;
    songId: string;
  }) {
    return apiRequest<AddSongToPlaylistResponse, { songId: string }>({
      method: 'POST',
      path: `/playlist/user/${type}/songs`,
      token,
      body: {
        songId,
      },
    });
  },

  /**
   * 插播下一首。
   *
   * 後端會把歌曲插入目前播放歌曲的下一首位置。
   */
  interjectSongNext({ token, songId }: { token: string; songId: string }) {
    return apiRequest<InterjectSongNextResponse, { songId: string }>({
      method: 'POST',
      path: '/playlist/user/play/interject',
      token,
      body: {
        songId,
      },
    });
  },

  /**
   * 從指定歌單移除歌曲。
   *
   * queueId：精準移除某一筆 queue item
   * songId：移除該歌曲
   */
  removeSongFromPlaylist({
    token,
    type,
    songId,
    queueId,
  }: {
    token: string;
    type: PlaylistType;
    songId?: string;
    queueId?: string | null;
  }) {
    return apiRequest<RemoveSongFromPlaylistResponse, { songId?: string; queueId?: string | null }>(
      {
        method: 'DELETE',
        path: `/playlist/user/${type}/songs`,
        token,
        body: {
          songId,
          queueId,
        },
      },
    );
  },

  /**
   * 清空歌單。
   */
  clearPlaylist({ token, type }: { token: string; type: PlaylistType }) {
    return apiRequest<RemoveSongFromPlaylistResponse>({
      method: 'DELETE',
      path: `/playlist/${type}/clear`,
      token,
    });
  },

  /**
   * 切下一首。
   */
  playNext({ token }: { token: string }) {
    return apiRequest<PlayNextResponse>({
      method: 'POST',
      path: '/playlist/user/play/next',
      token,
    });
  },
};
