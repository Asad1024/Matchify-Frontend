import { apiRequestJson, apiRequest } from './api';
import type { Like } from '@shared/schema';

export interface CreateLikeData {
  userId: string;
  postId: string;
}

export const likesService = {
  async create(data: CreateLikeData): Promise<Like> {
    return apiRequestJson<Like>('POST', '/api/likes', data);
  },

  async delete(userId: string, postId: string): Promise<void> {
    await apiRequest('DELETE', `/api/likes/${userId}/${postId}`);
  },
};

