import { apiRequest } from '../api/api-client';
import { ENDPOINTS } from '../api/endpoints';
import {
  FilterSongsByLanguageParams,
  GetSongsParams,
  PresignedUrlRequest,
  PresignedUrlResponse,
  ResolveSongFileFromS3Response,
  SearchSongsParams,
  SongBatchRequest,
  SongBatchResponse,
  SongDetailResponse,
  SongListResponse,
} from './song.types';

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

export const songClient = {
  getSongs({ token, params = {} }: { token: string; params?: GetSongsParams }) {
    const query = buildQuery({
      q: params.q,
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      sortBy: params.sortBy,
      order: params.order,
      lan: params.lan,
    });

    return apiRequest<SongListResponse>({
      method: 'GET',
      path: `${ENDPOINTS.songs.list}${query}`,
      token,
    });
  },

  searchSongs({ token, params }: { token: string; params: SearchSongsParams }) {
    const query = buildQuery({
      q: params.q,
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      mode: params.mode,
    });

    return apiRequest<SongListResponse>({
      method: 'GET',
      path: `${ENDPOINTS.songs.search}${query}`,
      token,
    });
  },

  getSongsByLanguage({ token, params }: { token: string; params: FilterSongsByLanguageParams }) {
    const query = buildQuery({
      language: params.language,
      page: params.page ?? 1,
      limit: params.limit ?? 20,
    });

    return apiRequest<SongListResponse>({
      method: 'GET',
      path: `${ENDPOINTS.songs.filterByLanguage}${query}`,
      token,
    });
  },

  getSongById({ token, songId }: { token: string; songId: string }) {
    return apiRequest<SongDetailResponse>({
      method: 'GET',
      path: ENDPOINTS.songs.detail(songId),
      token,
    });
  },

  getSongsByIds({ token, ids }: { token: string; ids: string[] }) {
    return apiRequest<SongBatchResponse, SongBatchRequest>({
      method: 'POST',
      path: ENDPOINTS.songs.batch,
      token,
      body: {
        ids,
      },
    });
  },

  getPresignedUrls({ token, body }: { token: string; body: PresignedUrlRequest }) {
    return apiRequest<PresignedUrlResponse, PresignedUrlRequest>({
      method: 'POST',
      path: ENDPOINTS.songs.presignedUrls,
      token,
      body,
    });
  },

  resolveSongFileFromS3({ token, title }: { token: string; title: string }) {
    const query = buildQuery({
      title,
    });

    return apiRequest<ResolveSongFileFromS3Response>({
      method: 'GET',
      path: `${ENDPOINTS.songs.resolveFromS3}${query}`,
      token,

      timeoutMs: 100000,
    });
  },
};
