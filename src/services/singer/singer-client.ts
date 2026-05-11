import { apiRequest } from '@/src/services/api/api-client';
import { ENDPOINTS } from '@/src/services/api/endpoints';

import {
  CreateSingerRequest,
  DeleteSingerResponse,
  GetSingersParams,
  SearchSingersParams,
  SingerDetailResponse,
  SingerListResponse,
  SingerSongsResponse,
  UpdateSingerRequest,
} from './singer.types';

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

export const singerClient = {
  /**
   * 取得歌手列表
   *
   * 後端：
   * GET /artists?q=&page=&limit=
   */
  getSingers(params: GetSingersParams = {}) {
    const query = buildQuery({
      q: params.q,
      page: params.page ?? 1,
      limit: params.limit ?? 20,
    });

    return apiRequest<SingerListResponse>({
      method: 'GET',
      path: `${ENDPOINTS.singers.list}${query}`,
    });
  },

  /**
   * 搜尋歌手
   *
   * 後端：
   * GET /artists/search?q=&page=&limit=&mode=
   */
  searchSingers(params: SearchSingersParams) {
    const query = buildQuery({
      q: params.q,
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      mode: params.mode,
    });

    return apiRequest<SingerListResponse>({
      method: 'GET',
      path: `${ENDPOINTS.singers.search}${query}`,
    });
  },

  /**
   * 取得單一歌手資料
   *
   * 後端：
   * GET /artists/:id
   */
  getSingerById(singerId: string) {
    return apiRequest<SingerDetailResponse>({
      method: 'GET',
      path: ENDPOINTS.singers.detail(singerId),
    });
  },

  /**
   * 取得指定歌手底下的歌曲
   *
   * 後端：
   * GET /artists/:id/songs
   *
   * 注意：
   * 這支後端有 isAuth，所以一定要帶 token。
   */
  getSingerSongs({ token, singerId }: { token: string; singerId: string }) {
    return apiRequest<SingerSongsResponse>({
      method: 'GET',
      path: ENDPOINTS.singers.songs(singerId),
      token,
    });
  },

  /**
   * 建立歌手
   *
   * 後端：
   * POST /artists
   */
  createSinger({ token, body }: { token: string; body: CreateSingerRequest }) {
    return apiRequest<SingerDetailResponse, CreateSingerRequest>({
      method: 'POST',
      path: ENDPOINTS.singers.list,
      token,
      body,
    });
  },

  /**
   * 更新歌手
   *
   * 後端：
   * PATCH /artists/:id
   */
  updateSinger({
    token,
    singerId,
    body,
  }: {
    token: string;
    singerId: string;
    body: UpdateSingerRequest;
  }) {
    return apiRequest<SingerDetailResponse, UpdateSingerRequest>({
      method: 'PATCH',
      path: ENDPOINTS.singers.detail(singerId),
      token,
      body,
    });
  },

  /**
   * 刪除歌手
   *
   * 後端：
   * DELETE /artists/:id
   */
  deleteSinger({ token, singerId }: { token: string; singerId: string }) {
    return apiRequest<DeleteSingerResponse>({
      method: 'DELETE',
      path: ENDPOINTS.singers.detail(singerId),
      token,
    });
  },
};
