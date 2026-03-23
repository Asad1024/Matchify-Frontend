import { apiRequestJson, apiRequest } from './api';
import type { Event, EventRsvp } from '@shared/schema';

export interface CreateEventData {
  groupId: string;
  title: string;
  description: string;
  date: Date;
  location: string;
}

export interface CreateRsvpData {
  userId: string;
  eventId: string;
  status: 'going' | 'maybe' | 'not_going';
}

export const eventsService = {
  async getAll(): Promise<Event[]> {
    return apiRequestJson<Event[]>('GET', '/api/events');
  },

  async getById(id: string): Promise<Event> {
    return apiRequestJson<Event>('GET', `/api/events/${id}`);
  },

  async create(data: CreateEventData): Promise<Event> {
    return apiRequestJson<Event>('POST', '/api/events', data);
  },

  async getRsvpsByUser(userId: string): Promise<EventRsvp[]> {
    return apiRequestJson<EventRsvp[]>('GET', `/api/users/${userId}/rsvps`);
  },

  async createRsvp(data: CreateRsvpData): Promise<EventRsvp> {
    return apiRequestJson<EventRsvp>('POST', '/api/events/rsvps', data);
  },

  async deleteRsvp(userId: string, eventId: string): Promise<void> {
    await apiRequest('DELETE', `/api/events/rsvps/${userId}/${eventId}`);
  },
};

