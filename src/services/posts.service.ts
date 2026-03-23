import { apiRequestJson, apiRequest } from './api';
import type { Post } from '@shared/schema';

export interface CreatePostData {
  userId: string;
  content: string;
  images?: string[];
}

export const postsService = {
  async getAll(): Promise<Post[]> {
    return apiRequestJson<Post[]>('GET', '/api/posts');
  },

  async create(data: CreatePostData): Promise<Post> {
    return apiRequestJson<Post>('POST', '/api/posts', data);
  },

  async delete(id: string): Promise<void> {
    await apiRequest('DELETE', `/api/posts/${id}`);
  },
};

