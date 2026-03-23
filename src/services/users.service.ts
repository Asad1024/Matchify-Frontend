import { apiRequestJson } from './api';
import type { User } from './auth.service';

export const usersService = {
  async getAll(): Promise<User[]> {
    return apiRequestJson<User[]>('GET', '/api/users');
  },

  async getById(id: string): Promise<User> {
    return apiRequestJson<User>('GET', `/api/users/${id}`);
  },

  async update(id: string, data: Partial<User>): Promise<User> {
    return apiRequestJson<User>('PUT', `/api/users/${id}`, data);
  },

  async patch(id: string, data: Partial<User>): Promise<User> {
    return apiRequestJson<User>('PATCH', `/api/users/${id}`, data);
  },
};

