import { apiRequestJson } from './api';
import type { Match } from '@shared/schema';

export interface CreateMatchData {
  user1Id: string;
  user2Id: string;
  compatibility: number;
}

export interface MatchWithUser {
  id: string;
  name: string;
  age?: number | null;
  location?: string | null;
  bio?: string | null;
  tags: string[];
  compatibility: number;
}

export interface UnrevealedMatch {
  id: string;
  user: any;
  compatibility: number;
}

export const matchesService = {
  async getByUser(userId: string): Promise<MatchWithUser[]> {
    return apiRequestJson<MatchWithUser[]>('GET', `/api/users/${userId}/matches`);
  },

  async getUnrevealedByUser(userId: string): Promise<UnrevealedMatch[]> {
    return apiRequestJson<UnrevealedMatch[]>('GET', `/api/users/${userId}/unrevealed-matches`);
  },

  async create(data: CreateMatchData): Promise<Match> {
    return apiRequestJson<Match>('POST', '/api/matches', data);
  },

  async reveal(id: string): Promise<Match> {
    return apiRequestJson<Match>('PATCH', `/api/matches/${id}/reveal`);
  },
};

