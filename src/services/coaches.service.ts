import { apiRequestJson } from './api';
import type { Coach, CoachBooking } from '@shared/schema';

export interface CreateBookingData {
  userId: string;
  coachId: string;
  date: Date;
  duration: number;
}

export const coachesService = {
  async getAll(): Promise<Coach[]> {
    return apiRequestJson<Coach[]>('GET', '/api/coaches');
  },

  async getById(id: string): Promise<Coach> {
    return apiRequestJson<Coach>('GET', `/api/coaches/${id}`);
  },

  async getBookingsByUser(userId: string): Promise<CoachBooking[]> {
    return apiRequestJson<CoachBooking[]>('GET', `/api/users/${userId}/bookings`);
  },

  async createBooking(data: CreateBookingData): Promise<CoachBooking> {
    return apiRequestJson<CoachBooking>('POST', '/api/bookings', data);
  },
};

