import { apiRequestJson } from './api';
import type { Course, CourseEnrollment } from '@shared/schema';

export interface CreateEnrollmentData {
  userId: string;
  courseId: string;
}

export const coursesService = {
  async getAll(): Promise<Course[]> {
    return apiRequestJson<Course[]>('GET', '/api/courses');
  },

  async getById(id: string): Promise<Course> {
    return apiRequestJson<Course>('GET', `/api/courses/${id}`);
  },

  async getEnrollmentsByUser(userId: string): Promise<CourseEnrollment[]> {
    return apiRequestJson<CourseEnrollment[]>('GET', `/api/users/${userId}/enrollments`);
  },

  async createEnrollment(data: CreateEnrollmentData): Promise<CourseEnrollment> {
    return apiRequestJson<CourseEnrollment>('POST', '/api/enrollments', data);
  },
};

