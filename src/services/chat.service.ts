import { apiRequestJson } from './api';
import type { Conversation, Message } from '@shared/schema';

export interface CreateConversationData {
  participant1Id: string;
  participant2Id: string;
}

export interface CreateMessageData {
  conversationId: string;
  senderId: string;
  content: string;
}

export const chatService = {
  async getConversationsByUser(userId: string): Promise<Conversation[]> {
    return apiRequestJson<Conversation[]>('GET', `/api/users/${userId}/conversations`);
  },

  async createConversation(data: CreateConversationData): Promise<Conversation> {
    return apiRequestJson<Conversation>('POST', '/api/conversations', data);
  },

  async getMessagesByConversation(conversationId: string): Promise<Message[]> {
    return apiRequestJson<Message[]>('GET', `/api/conversations/${conversationId}/messages`);
  },

  async createMessage(data: CreateMessageData): Promise<Message> {
    return apiRequestJson<Message>('POST', '/api/messages', data);
  },

  async markAsRead(messageId: string): Promise<Message> {
    return apiRequestJson<Message>('PATCH', `/api/messages/${messageId}/read`);
  },
};

