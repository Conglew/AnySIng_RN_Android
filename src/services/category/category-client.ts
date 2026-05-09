import { apiRequest } from '@/src/services/api/api-client';
import { ENDPOINTS } from '@/src/services/api/endpoints';

import {
  CategoryDetailResponse,
  CategoryListResponse,
  CreateCategoryRequest,
  DeleteCategoryResponse,
  GetSongsByCategoryParams,
  SongsByCategoryResponse,
  UpdateCategoryRequest,
} from './category.types';

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

export const categoryClient = {
  getCategories() {
    return apiRequest<CategoryListResponse>({
      method: 'GET',
      path: ENDPOINTS.categories.list,
    });
  },

  getCategoryById(categoryId: string) {
    return apiRequest<CategoryDetailResponse>({
      method: 'GET',
      path: ENDPOINTS.categories.detail(categoryId),
    });
  },

  getSongsByCategory({
    categoryId,
    params = {},
  }: {
    categoryId: string;
    params?: GetSongsByCategoryParams;
  }) {
    const query = buildQuery({
      q: params.q,
      page: params.page ?? 1,
      limit: params.limit ?? 20,
    });

    return apiRequest<SongsByCategoryResponse>({
      method: 'GET',
      path: `${ENDPOINTS.categories.songs(categoryId)}${query}`,
    });
  },

  createCategory({ token, body }: { token: string; body: CreateCategoryRequest }) {
    return apiRequest<CategoryDetailResponse, CreateCategoryRequest>({
      method: 'POST',
      path: ENDPOINTS.categories.list,
      token,
      body,
    });
  },

  updateCategory({
    token,
    categoryId,
    body,
  }: {
    token: string;
    categoryId: string;
    body: UpdateCategoryRequest;
  }) {
    return apiRequest<CategoryDetailResponse, UpdateCategoryRequest>({
      method: 'PATCH',
      path: ENDPOINTS.categories.detail(categoryId),
      token,
      body,
    });
  },

  deleteCategory({ token, categoryId }: { token: string; categoryId: string }) {
    return apiRequest<DeleteCategoryResponse>({
      method: 'DELETE',
      path: ENDPOINTS.categories.detail(categoryId),
      token,
    });
  },
};
