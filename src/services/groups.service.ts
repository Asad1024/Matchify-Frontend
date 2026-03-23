import { apiRequestJson, apiRequest } from './api';
import type { Group, GroupMembership } from '@shared/schema';

export interface CreateGroupData {
  name: string;
  description: string;
  creatorId: string;
}

export interface CreateMembershipData {
  userId: string;
  groupId: string;
}

export const groupsService = {
  async getAll(): Promise<Group[]> {
    return apiRequestJson<Group[]>('GET', '/api/groups');
  },

  async getById(id: string): Promise<Group> {
    return apiRequestJson<Group>('GET', `/api/groups/${id}`);
  },

  async create(data: CreateGroupData): Promise<Group> {
    return apiRequestJson<Group>('POST', '/api/groups', data);
  },

  async getMembershipsByUser(userId: string): Promise<GroupMembership[]> {
    return apiRequestJson<GroupMembership[]>('GET', `/api/users/${userId}/memberships`);
  },

  async createMembership(data: CreateMembershipData): Promise<GroupMembership> {
    return apiRequestJson<GroupMembership>('POST', '/api/groups/memberships', data);
  },

  async deleteMembership(userId: string, groupId: string): Promise<void> {
    await apiRequest('DELETE', `/api/groups/memberships/${userId}/${groupId}`);
  },
};

