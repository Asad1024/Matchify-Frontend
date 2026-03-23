import { apiRequestJson } from './api';
import type { Story } from '@shared/schema';

export interface CreateStoryData {
  userId: string;
  imageUrl: string;
  expiresAt: Date;
}

export const storiesService = {
  async getAll(): Promise<Story[]> {
    return apiRequestJson<Story[]>('GET', '/api/stories');
  },

  async create(data: CreateStoryData): Promise<Story> {
    return apiRequestJson<Story>('POST', '/api/stories', data);
  },
};

