import { SongDto } from '@/src/services/song/song.types';

export type CategoryDto = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt?: string;
};

export type CategoryListResponse = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  categories: CategoryDto[];
};

export type CategoryDetailResponse = CategoryDto;

export type GetCategoriesParams = {
  q?: string;
  page?: number;
  limit?: number;
};

export type GetSongsByCategoryParams = {
  q?: string;
  page?: number;
  limit?: number;
};

export type SongsByCategoryResponse = {
  page: number;
  limit: number;
  total: number;
  songs: SongDto[];
};

export type CreateCategoryRequest = {
  name: string;
  slug: string;
  description?: string;
};

export type UpdateCategoryRequest = {
  name?: string;
  slug?: string;
  description?: string;
};

export type DeleteCategoryResponse = {
  message: string;
};
