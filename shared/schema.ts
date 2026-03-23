import { z } from "zod";

// Zod schemas for validation (replacing Drizzle schemas)
export const insertUserSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(6),
  email: z.string().email(),
  name: z.string().min(1),
  age: z.number().int().positive().optional().nullable(),
  location: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  avatar: z.string().optional().nullable(),
  photos: z.array(z.string()).optional().nullable(),
  membershipTier: z.enum(['free', 'premium', 'elite', 'diamond']).default('free'),
  verified: z.boolean().default(false),
  interests: z.array(z.string()).optional().nullable(),
  relationshipGoal: z.string().optional().nullable(),
  values: z.array(z.string()).optional().nullable(),
  lifestyle: z.array(z.string()).optional().nullable(),
  onboardingCompleted: z.boolean().default(false),
  gender: z.enum(['male', 'female', 'other']).optional().nullable(),
  education: z.string().optional().nullable(),
  career: z.string().optional().nullable(),
  incomeRange: z.string().optional().nullable(),
  zodiacSign: z.enum(['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces']).optional().nullable(),
  birthDate: z.string().optional().nullable(),
  // Self-discovery fields
  selfDiscoveryCompleted: z.boolean().default(false),
  commitmentIntention: z.enum(['hookup', 'casual', 'serious', 'marriage']).optional().nullable(),
  loveLanguage: z.enum(['words', 'acts', 'gifts', 'time', 'touch']).optional().nullable(),
  topPriorities: z.array(z.string()).optional().nullable(),
  dealbreakers: z.array(z.string()).optional().nullable(),
  pastRelationships: z.object({
    whatWorked: z.array(z.string()).optional(),
    whatDidntWork: z.array(z.string()).optional(),
    lessons: z.array(z.string()).optional(),
  }).optional().nullable(),
  relationshipReadiness: z.object({
    score: z.number().optional(),
    blindSpots: z.array(z.string()).optional(),
    needsWork: z.array(z.string()).optional(),
  }).optional().nullable(),
  empathyPatterns: z.object({
    victimizationScore: z.number().optional(),
    perspectiveTakingScore: z.number().optional(),
    emotionalIntelligence: z.number().optional(),
  }).optional().nullable(),
  inRelationship: z.boolean().default(false),
  partnerId: z.string().uuid().optional().nullable(),
  relationshipHealth: z.object({
    lastDateNight: z.string().optional(),
    appreciationCount: z.number().optional(),
    communicationScore: z.number().optional(),
  }).optional().nullable(),
});

export const insertPostSchema = z.object({
  userId: z.string().uuid(),
  content: z.string().min(1),
});

export const insertStorySchema = z.object({
  userId: z.string().uuid(),
  name: z.string().min(1),
  content: z.string().optional().nullable(),
  hasUnread: z.boolean().default(false),
  image: z.string().optional().nullable(),
});

export const insertLikeSchema = z.object({
  userId: z.string().uuid(),
  postId: z.string().uuid(),
});

export const insertCommentSchema = z.object({
  userId: z.string().uuid(),
  postId: z.string().uuid(),
  content: z.string().min(1),
});

export const insertGroupSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  tags: z.array(z.string()).optional().nullable(),
  image: z.string().optional().nullable(),
});

export const insertGroupMembershipSchema = z.object({
  userId: z.string().uuid(),
  groupId: z.string().uuid(),
});

export const insertEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  date: z.string().min(1),
  time: z.string().min(1),
  location: z.string().min(1),
  type: z.string().min(1),
  capacity: z.number().int().positive(),
  price: z.string().min(1),
  image: z.string().optional().nullable(),
  status: z.enum(['pending', 'approved', 'rejected']).optional().default('pending'),
});

export const insertEventRsvpSchema = z.object({
  userId: z.string().uuid(),
  eventId: z.string().uuid(),
});

export const insertConversationSchema = z.object({
  participant1Id: z.string().uuid(),
  participant2Id: z.string().uuid(),
});

export const insertMessageSchema = z.object({
  conversationId: z.string().uuid(),
  senderId: z.string().uuid(),
  content: z.string().min(1),
  type: z.enum(['text', 'voice', 'icebreaker']).default('text'),
  voiceUrl: z.string().optional().nullable(),
  autoDeleteAt: z.string().optional().nullable(),
  isIcebreaker: z.boolean().default(false),
});

export const insertNotificationSchema = z.object({
  userId: z.string().uuid(),
  type: z.string().min(1),
  title: z.string().min(1),
  message: z.string().min(1),
  relatedUserId: z.string().uuid().optional().nullable(),
  relatedEntityId: z.string().uuid().optional().nullable(),
});

export const insertCourseSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  duration: z.string().min(1),
  level: z.string().min(1),
  image: z.string().optional().nullable(),
});

export const insertCourseEnrollmentSchema = z.object({
  userId: z.string().uuid(),
  courseId: z.string().uuid(),
});

export const insertCoachSchema = z.object({
  name: z.string().min(1),
  specialty: z.string().min(1),
  bio: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  reviewCount: z.number().int().default(0),
  pricePerSession: z.number().int().positive(),
  languages: z.array(z.string()).optional().nullable(),
  avatar: z.string().optional().nullable(),
});

export const insertCoachBookingSchema = z.object({
  userId: z.string().uuid(),
  coachId: z.string().uuid(),
  sessionDate: z.string().optional().nullable(),
});

export const insertMatchSchema = z.object({
  user1Id: z.string().uuid(),
  user2Id: z.string().uuid(),
  compatibility: z.number().int().min(0).max(100),
  revealed: z.boolean().default(false),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type InsertStory = z.infer<typeof insertStorySchema>;
export type InsertLike = z.infer<typeof insertLikeSchema>;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type InsertGroupMembership = z.infer<typeof insertGroupMembershipSchema>;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type InsertEventRsvp = z.infer<typeof insertEventRsvpSchema>;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type InsertCourseEnrollment = z.infer<typeof insertCourseEnrollmentSchema>;
export type InsertCoach = z.infer<typeof insertCoachSchema>;
export type InsertCoachBooking = z.infer<typeof insertCoachBookingSchema>;
export type InsertMatch = z.infer<typeof insertMatchSchema>;
