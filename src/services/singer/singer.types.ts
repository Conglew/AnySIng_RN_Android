import { SongDto } from '@/src/services/song/song.types';

export type SingerDto = {
  _id: string;
  name: string;
  initials?: string;
  zhuyin?: string;
  avatar?: string;
  createdAt?: string;
};

export type SingerListResponse = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  artists: SingerDto[];
};

export type SingerDetailResponse = SingerDto;

export type SingerSearchMode = 'name' | 'initials' | 'zhuyin';

export type GetSingersParams = {
  q?: string;
  page?: number;
  limit?: number;
};

export type SearchSingersParams = {
  q: string;
  page?: number;
  limit?: number;
  mode?: SingerSearchMode;
};

export type SingerSongsResponse = {
  artist: {
    _id: string;
    name: string;
    avatar?: string;
  };
  songs: SongDto[];
};

export type CreateSingerRequest = {
  name: string;
  avatar?: string;
};

export type UpdateSingerRequest = {
  name?: string;
  avatar?: string;
};

export type DeleteSingerResponse = {
  message: string;
};
