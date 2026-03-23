import { apiRequestJson, apiRequest } from './api';
import type { Notification } from '@shared/schema';

export interface CreateNotificationData {
  userId: string;
  type: string;
  content: string;
  relatedId?: string;
}

export const notificationsService = {
  async getByUser(userId: string): Promise<Notification[]> {
    return apiRequestJson<Notification[]>('GET', `/api/users/${userId}/notifications`);
  },

  async create(data: CreateNotificationData): Promise<Notification> {
    return apiRequestJson<Notification>('POST', '/api/notifications', data);
  },

  async markAsRead(id: string): Promise<Notification> {
    return apiRequestJson<Notification>('PATCH', `/api/notifications/${id}/read`);
  },

  async markAllAsRead(userId: string): Promise<void> {
    await apiRequest('PATCH', `/api/users/${userId}/notifications/read-all`);
  },
};

