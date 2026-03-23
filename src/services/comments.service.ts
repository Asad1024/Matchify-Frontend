import { apiRequestJson } from './api';
import type { Comment } from '@shared/schema';

export interface CreateCommentData {
  userId: string;
  postId: string;
  content: string;
}

export const commentsService = {
  async getByPost(postId: string): Promise<Comment[]> {
    return apiRequestJson<Comment[]>('GET', `/api/posts/${postId}/comments`);
  },

  async create(data: CreateCommentData): Promise<Comment> {
    return apiRequestJson<Comment>('POST', '/api/comments', data);
  },
};

