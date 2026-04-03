import { apiRequestJson, apiRequest } from './api';
import type { Post } from '@shared/schema';

export interface CreatePostData {
  userId: string;
  content: string;
  images?: string[];
  /** Single image URL (server also accepts this alongside `images`). */
  image?: string | null;
  /** Public posts appear in feed. Private posts stay on author's profile. */
  visibility?: "public" | "private";
  /** When set, post is scoped to this community group (API requires membership). */
  groupId?: string | null;
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

