/**
 * Shared TypeScript types for the frontend
 * Re-export from services and shared schema
 */

export type { User, LoginCredentials, RegisterData } from '../services/auth.service';
export type { MatchWithUser, UnrevealedMatch } from '../services/matches.service';
export type { CreatePostData } from '../services/posts.service';
export type { CreateStoryData } from '../services/stories.service';
export type { CreateEventData, CreateRsvpData } from '../services/events.service';
export type { CreateConversationData, CreateMessageData } from '../services/chat.service';
export type { CreateNotificationData } from '../services/notifications.service';
export type { CreateGroupData, CreateMembershipData } from '../services/groups.service';
export type { CreateEnrollmentData } from '../services/courses.service';
export type { CreateBookingData } from '../services/coaches.service';
export type { UploadPhotoResponse } from '../services/upload.service';

// Re-export shared schema types
export type {
  Post,
  Story,
  Like,
  Comment,
  Group,
  GroupMembership,
  Event,
  EventRsvp,
  Conversation,
  Message,
  Notification,
  Course,
  CourseEnrollment,
  Coach,
  CoachBooking,
  Match,
} from '@shared/schema';

