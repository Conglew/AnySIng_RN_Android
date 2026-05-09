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

  getSingerById(singerId: string) {
    return apiRequest<SingerDetailResponse>({
      method: 'GET',
      path: ENDPOINTS.singers.detail(singerId),
    });
  },

  getSongsBySinger({ token, singerId }: { token: string; singerId: string }) {
    return apiRequest<SingerSongsResponse>({
      method: 'GET',
      path: ENDPOINTS.singers.songs(singerId),
      token,
    });
  },

  createSinger({ token, body }: { token: string; body: CreateSingerRequest }) {
    return apiRequest<SingerDetailResponse, CreateSingerRequest>({
      method: 'POST',
      path: ENDPOINTS.singers.list,
      token,
      body,
    });
  },

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

  deleteSinger({ token, singerId }: { token: string; singerId: string }) {
    return apiRequest<DeleteSingerResponse>({
      method: 'DELETE',
      path: ENDPOINTS.singers.detail(singerId),
      token,
    });
  },
};
