import { apiRequestJson } from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  username: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  avatar?: string | null;
  onboardingCompleted?: boolean;
  [key: string]: any;
}

export const authService = {
  async register(data: RegisterData): Promise<User> {
    return apiRequestJson<User>('POST', '/api/auth/register', data);
  },

  async login(credentials: LoginCredentials): Promise<User> {
    return apiRequestJson<User>('POST', '/api/auth/login', credentials);
  },
};

