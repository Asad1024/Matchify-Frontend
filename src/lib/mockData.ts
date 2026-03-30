// Mock data service - provides dummy data when backend is unavailable
import { nanoid } from "nanoid";
import {
  getDefaultOnboardingQuestionnaireItems,
  type OnboardingQuestionnaireItem,
} from "./onboardingQuestionnaire";

/** Admin-edited onboarding questionnaire (demo / offline API). */
let mockOnboardingQuestionnaireOverride: OnboardingQuestionnaireItem[] | null = null;

// Generate UUID-like IDs
const generateId = () => nanoid();

// Current user (will be set when user is created)
let currentUserId: string | null = null;

// Mock Users
const mockUsers = [
  {
    id: generateId(),
    username: "johndoe",
    email: "john@example.com",
    name: "John Doe",
    age: 28,
    location: "Dubai, UAE",
    bio: "Tech enthusiast and traveler. Love exploring new places and meeting new people.",
    interests: ["Technology", "Travel", "Coffee"],
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
    membershipTier: "premium",
    verified: true,
    onboardingCompleted: true,
    // Self-discovery data
    selfDiscoveryCompleted: true,
    commitmentIntention: "serious",
    marriageTimeline: "1_2yr",
    marriageApproach: "values_first",
    wantsChildren: "open",
    nationality: "American",
    ethnicity: "white_european",
    languages: ["English", "Arabic"],
    smoking: "never",
    drinksAlcohol: "socially",
    loveLanguage: "time",
    topPriorities: ["Shared Values", "Emotional Intelligence", "Communication Skills", "Adventurous", "Loyalty"],
    dealbreakers: ["Smoking", "Unfaithfulness", "Poor Communication", "Dishonesty"],
    pastRelationships: {
      whatWorked: [
        "Great communication and openness",
        "Shared love for travel and adventure",
        "Mutual respect for each other's careers"
      ],
      whatDidntWork: [
        "Different life goals - she wanted kids immediately, I wanted to wait",
        "Lack of emotional availability",
        "Incompatible communication styles"
      ],
      lessons: [
        "I need someone who values quality time together",
        "Emotional intelligence is more important than I thought",
        "Shared values matter more than shared interests"
      ]
    },
    relationshipReadiness: {
      score: 85,
      blindSpots: [],
      needsWork: []
    },
    empathyPatterns: {
      victimizationScore: 20,
      perspectiveTakingScore: 75,
      emotionalIntelligence: 70
    },
    gender: "male",
    religion: "christianity",
    meetPreference: "open_to_all",
    education: "Bachelor's Degree",
    career: "Software Engineer",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    username: "sarahchen",
    email: "sarah@example.com",
    name: "Sarah Chen",
    age: 26,
    location: "Abu Dhabi, UAE",
    bio: "Art lover and food enthusiast. Always looking for the next adventure.",
    interests: ["Art", "Food", "Photography"],
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
    membershipTier: "free",
    verified: true,
    onboardingCompleted: true,
    // Self-discovery data
    selfDiscoveryCompleted: true,
    commitmentIntention: "marriage",
    marriageTimeline: "within_6mo",
    marriageApproach: "family_community",
    wantsChildren: "yes",
    nationality: "Chinese",
    ethnicity: "asian",
    languages: ["English", "Mandarin"],
    smoking: "never",
    drinksAlcohol: "never",
    loveLanguage: "acts",
    topPriorities: ["Kindness", "Shared Values", "Emotional Intelligence", "Family-Oriented", "Communication Skills"],
    dealbreakers: ["Excessive Drinking", "Unfaithfulness", "Anger Issues", "Controlling Behavior", "Dishonesty"],
    pastRelationships: {
      whatWorked: [
        "He was very thoughtful and showed love through actions",
        "We shared similar family values",
        "Great sense of humor and made me laugh"
      ],
      whatDidntWork: [
        "He wasn't emotionally available when I needed support",
        "Different priorities - he was too focused on work",
        "Lack of quality time together"
      ],
      lessons: [
        "I need someone who shows love through actions, not just words",
        "Emotional availability is crucial for me",
        "Family values must align for a long-term relationship"
      ]
    },
    relationshipReadiness: {
      score: 90,
      blindSpots: [],
      needsWork: []
    },
    empathyPatterns: {
      victimizationScore: 15,
      perspectiveTakingScore: 80,
      emotionalIntelligence: 85
    },
    gender: "female",
    religion: "christianity",
    meetPreference: "same_faith",
    education: "Master's Degree",
    career: "Graphic Designer",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    username: "alexrivera",
    email: "alex@example.com",
    name: "Alex Rivera",
    age: 30,
    location: "Dubai, UAE",
    bio: "Fitness coach and wellness advocate. Here to inspire and connect.",
    interests: ["Fitness", "Health", "Nutrition"],
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    membershipTier: "elite",
    verified: false,
    onboardingCompleted: true,
    // Self-discovery data
    selfDiscoveryCompleted: true,
    commitmentIntention: "serious",
    marriageTimeline: "unsure",
    marriageApproach: "actively_searching",
    wantsChildren: "yes",
    loveLanguage: "touch",
    topPriorities: ["Physical Attraction", "Health & Fitness", "Adventurous", "Confidence", "Independence"],
    dealbreakers: ["Smoking", "Drug Use", "Lack of Ambition", "Laziness"],
    pastRelationships: {
      whatWorked: [
        "Physical chemistry and attraction",
        "Shared passion for fitness and health",
        "Both independent and respected each other's space"
      ],
      whatDidntWork: [
        "She wasn't as ambitious about career goals",
        "Different communication styles - she needed more words, I needed more touch",
        "Incompatible long-term goals"
      ],
      lessons: [
        "Physical touch is my primary love language",
        "I need someone who values health and fitness as much as I do",
        "Independence is important but so is emotional connection"
      ]
    },
    relationshipReadiness: {
      score: 75,
      blindSpots: ["Could improve emotional communication"],
      needsWork: ["Work on expressing emotions verbally"]
    },
    empathyPatterns: {
      victimizationScore: 25,
      perspectiveTakingScore: 65,
      emotionalIntelligence: 60
    },
    gender: "male",
    religion: "hinduism",
    meetPreference: "open_to_all",
    education: "Bachelor's Degree",
    career: "Fitness Coach",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Set first user as current user if not set
if (!currentUserId && mockUsers.length > 0) {
  currentUserId = mockUsers[0].id;
}

// Mock Stories
const mockStories = [
  {
    id: generateId(),
    userId: mockUsers[0].id,
    name: "John Doe",
    content: "Just landed in Bali! The beach views are absolutely stunning 🏝️",
    hasUnread: true,
    image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=400&fit=crop",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    userId: mockUsers[1].id,
    name: "Sarah Chen",
    content: "Amazing dinner at the new Italian restaurant downtown! 🍝",
    hasUnread: true,
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=400&fit=crop",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    userId: mockUsers[2].id,
    name: "Alex Rivera",
    content: "Morning workout complete! Who's ready for leg day? 💪",
    hasUnread: false,
    image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=400&fit=crop",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    userId: mockUsers[0].id,
    name: "John Doe",
    content: "Tech conference was incredible! So many great ideas and connections",
    hasUnread: true,
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=400&fit=crop",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    userId: mockUsers[1].id,
    name: "Sarah Chen",
    content: "Gallery opening tonight! Come check out the amazing artwork 🎨",
    hasUnread: false,
    image: "https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=400&h=400&fit=crop",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/**
 * Fixed IDs — must match `matchify-app-style1-backend/src/seedGroups.ts` (SEED_GROUP_DEFS).
 * Do not use random ids here or posts will not resolve group names.
 */
const _MOCK_GROUP_IDS = [
  "10000001-0000-4000-8000-000000000001",
  "10000001-0000-4000-8000-000000000002",
  "10000001-0000-4000-8000-000000000003",
  "10000001-0000-4000-8000-000000000004",
  "10000001-0000-4000-8000-000000000005",
  "10000001-0000-4000-8000-000000000006",
] as const;

// Mock Posts — use top-level `image` / `imageUrl` for **post media** (not only author avatar).
const mockPosts = [
  {
    id: generateId(),
    userId: mockUsers[1].id,
    groupId: _MOCK_GROUP_IDS[0],
    content:
      "New here — excited to learn from everyone in Matchify Welcome Circle. What’s one intentional habit that changed your dating life?",
    likes: 0,
    comments: 0,
    likesCount: 0,
    commentsCount: 0,
    image: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=900&h=560&fit=crop",
    author: {
      name: mockUsers[1].name,
      image: mockUsers[1].avatar,
      verified: mockUsers[1].verified,
    },
    createdAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    userId: mockUsers[2].id,
    groupId: _MOCK_GROUP_IDS[2],
    content:
      "Who else gets nervous before a first date? Trying to stay curious instead of perfect — Intentional Dating Lab has been such a good reminder.",
    likes: 8,
    likesCount: 8,
    commentsCount: 5,
    image: "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=900&h=560&fit=crop",
    author: {
      name: mockUsers[2].name,
      image: mockUsers[2].avatar,
      verified: mockUsers[2].verified,
    },
    firstComment: {
      id: generateId(),
      userId: mockUsers[0].id,
      content: "This is so relatable — thanks for sharing!",
      createdAt: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
      user: { name: mockUsers[0].name, avatar: mockUsers[0].avatar },
    },
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    userId: mockUsers[0].id,
    groupId: _MOCK_GROUP_IDS[1],
    content:
      "Workshop takeaway: marriage prep isn’t about rushing — it’s about clarity. Grateful for Meaningful Marriage Prep tonight. 💡",
    likes: 0,
    comments: 0,
    likesCount: 0,
    commentsCount: 0,
    image: "https://images.unsplash.com/photo-1544531586-fde5298cdd40?w=900&h=560&fit=crop",
    author: {
      name: mockUsers[0].name,
      image: mockUsers[0].avatar,
      verified: mockUsers[0].verified,
    },
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    userId: mockUsers[1].id,
    groupId: _MOCK_GROUP_IDS[3],
    content:
      "Faith & Values Lounge question: how do you gently bring up non‑negotiables without sounding like an interview? Still learning.",
    likes: 3,
    likesCount: 3,
    comments: 0,
    commentsCount: 0,
    author: {
      name: mockUsers[1].name,
      image: mockUsers[1].avatar,
      verified: mockUsers[1].verified,
    },
    createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    userId: mockUsers[2].id,
    groupId: _MOCK_GROUP_IDS[4],
    content:
      "Small win: journaled after a tough chat with a match. Wellness & Growth Together is reminding me that repair matters more than being right.",
    likes: 2,
    likesCount: 2,
    comments: 0,
    commentsCount: 0,
    image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=900&h=560&fit=crop",
    author: {
      name: mockUsers[2].name,
      image: mockUsers[2].avatar,
      verified: mockUsers[2].verified,
    },
    createdAt: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    userId: mockUsers[0].id,
    groupId: _MOCK_GROUP_IDS[5],
    content:
      "Grateful for thoughtful replies in Interfaith Respect Table last week. Respectful disagreement + curiosity = actually energizing.",
    likes: 5,
    likesCount: 5,
    comments: 1,
    commentsCount: 1,
    author: {
      name: mockUsers[0].name,
      image: mockUsers[0].avatar,
      verified: mockUsers[0].verified,
    },
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    userId: mockUsers[1].id,
    content: "Tip: refresh your profile photos this week — small updates make a big difference in quality matches. ✨",
    likes: 3,
    likesCount: 3,
    comments: 0,
    commentsCount: 0,
    author: {
      name: mockUsers[1].name,
      image: mockUsers[1].avatar,
      verified: mockUsers[1].verified,
    },
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/** Default comment threads for mock posts (offline: not in localStorage until user adds). */
const mockPostCommentsById: Record<
  string,
  Array<{
    id: string;
    userId: string;
    content: string;
    createdAt: string;
    user?: { name?: string; avatar?: string | null } | null;
  }>
> = {};
for (const p of mockPosts) {
  const row = p as {
    id: string;
    commentsCount?: number;
    comments?: number;
  };
  const count = Math.max(
    typeof row.commentsCount === "number" ? row.commentsCount : 0,
    typeof row.comments === "number" ? row.comments : 0,
  );
  if (count <= 0) continue;
  mockPostCommentsById[row.id] = [
    {
      id: generateId(),
      userId: mockUsers[0].id,
      content: "This is so relatable — thanks for sharing!",
      createdAt: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
      user: { name: mockUsers[0].name, avatar: mockUsers[0].avatar },
    },
    {
      id: generateId(),
      userId: mockUsers[1].id,
      content: "See you at the event! 🎉",
      createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
      user: { name: mockUsers[1].name, avatar: mockUsers[1].avatar },
    },
    {
      id: generateId(),
      userId: mockUsers[2].id,
      content: "First timer too — we’ve got this!",
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      user: { name: mockUsers[2].name, avatar: mockUsers[2].avatar },
    },
  ].slice(0, Math.min(5, Math.max(2, count)));
}

export function getMockPostCommentSeeds(postId: string) {
  return mockPostCommentsById[postId] ?? [];
}

// Mock groups — same ids/names as backend `seedGroups.ts` (no orphan “demo-only” names).
const mockGroups = [
  {
    id: _MOCK_GROUP_IDS[0],
    name: "Matchify Welcome Circle",
    description:
      "Official welcome space — intros, app tips, and meeting others who are dating with intention.",
    tags: ["welcome", "community", "introductions"],
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=400&fit=crop",
    memberCount: 412,
    religionFocus: "all" as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: _MOCK_GROUP_IDS[1],
    name: "Meaningful Marriage Prep",
    description: "For members seriously preparing for marriage: values, communication, and clarity.",
    tags: ["marriage", "values", "readiness"],
    image: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&h=400&fit=crop",
    memberCount: 268,
    religionFocus: "all" as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: _MOCK_GROUP_IDS[2],
    name: "Intentional Dating Lab",
    description: "Share date ideas, boundaries, and lessons learned while dating on purpose.",
    tags: ["dating", "events", "stories"],
    image: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=400&fit=crop",
    memberCount: 326,
    religionFocus: "all" as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: _MOCK_GROUP_IDS[3],
    name: "Faith & Values Lounge",
    description: "Respectful conversations about faith, family, and what matters in a partnership.",
    tags: ["faith", "family", "respect"],
    image: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&h=400&fit=crop",
    memberCount: 198,
    religionFocus: "all" as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: _MOCK_GROUP_IDS[4],
    name: "Wellness & Growth Together",
    description: "Emotional fitness, habits, and supporting each other’s growth in relationships.",
    tags: ["wellness", "growth", "mindfulness"],
    image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&h=400&fit=crop",
    memberCount: 174,
    religionFocus: "all" as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: _MOCK_GROUP_IDS[5],
    name: "Interfaith Respect Table",
    description: "Open, kind dialogue across backgrounds while dating — everyone is welcome.",
    tags: ["interfaith", "dialogue", "inclusion"],
    image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=400&fit=crop",
    memberCount: 121,
    religionFocus: "interfaith" as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/** In-memory group memberships for mock / offline flows (mirrors GroupMembership rows). */
const mockGroupMemberships: Array<{
  id: string;
  userId: string;
  groupId: string;
  createdAt: string;
}> = [];

export const addMockGroupMembership = (userId: string, groupId: string) => {
  const existing = mockGroupMemberships.find((m) => m.userId === userId && m.groupId === groupId);
  if (existing) return existing;
  const row = {
    id: generateId(),
    userId,
    groupId,
    createdAt: new Date().toISOString(),
  };
  mockGroupMemberships.push(row);
  return row;
};

export const removeMockGroupMembership = (userId: string, groupId: string) => {
  const i = mockGroupMemberships.findIndex((m) => m.userId === userId && m.groupId === groupId);
  if (i !== -1) mockGroupMemberships.splice(i, 1);
};

/** Default mock user is in Welcome Circle until they join more groups. */
addMockGroupMembership(mockUsers[0].id, _MOCK_GROUP_IDS[0]);

// Mock Events (hostUserId = creator; default demo user is often mockUsers[0] so they see themselves as host on first event)
type MockEventRow = {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  type: string;
  capacity: number;
  price: string;
  image: string;
  rsvpCount: number;
  hostUserId: string;
  createdAt: string;
  updatedAt: string;
  status?: "pending" | "approved" | "rejected";
  hasQuestionnaire?: boolean;
  questionnaireQuestions?: string;
  matchRevealTime?: string;
};

const mockEvents: MockEventRow[] = [
  {
    id: generateId(),
    title: "Speed Dating Night",
    description: "Join us for an exciting evening of connections! Meet 20+ singles in a fun, relaxed atmosphere.",
    date: "2026-10-20",
    time: "19:00",
    location: "The Grand Hotel, Downtown Dubai",
    type: "offline",
    capacity: 50,
    price: "$29",
    image: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&h=600&fit=crop",
    rsvpCount: 32,
    hostUserId: mockUsers[0].id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: "approved",
    hasQuestionnaire: true,
  },
  {
    id: generateId(),
    title: "Virtual Networking Mixer",
    description: "Connect with professionals from various industries in this online networking event.",
    date: "2026-10-21",
    time: "18:00",
    location: "Zoom (link provided after RSVP)",
    type: "online",
    capacity: 100,
    price: "Free",
    image: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&h=600&fit=crop",
    rsvpCount: 67,
    hostUserId: mockUsers[1].id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: "approved",
    hasQuestionnaire: true,
  },
  {
    id: generateId(),
    title: "Wine Tasting Social",
    description: "Enjoy an evening of fine wines and great company. Perfect for wine enthusiasts!",
    date: "2026-10-22",
    time: "17:00",
    location: "The Address Downtown Dubai",
    type: "offline",
    capacity: 40,
    price: "$45",
    image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&h=600&fit=crop",
    rsvpCount: 28,
    hostUserId: mockUsers[2].id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: "approved",
    hasQuestionnaire: true,
  },
];

// Mock Courses
const mockCourses = [
  {
    id: generateId(),
    title: "Dating with Confidence",
    description: "Master the art of making great first impressions and building authentic connections",
    duration: "4 weeks",
    level: "beginner",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop",
    enrolledCount: 124,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    title: "Communication Mastery",
    description: "Learn effective communication techniques for deeper, more meaningful relationships",
    duration: "6 weeks",
    level: "intermediate",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop",
    enrolledCount: 89,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Mock Coaches (stable IDs so /api/coaches/:id mock lookups work)
const mockCoaches = [
  {
    id: "c0a1b2c3-d4e5-4000-a100-000000000001",
    name: "Amina Rahman",
    specialty: "Pre-marriage readiness",
    bio: "Helps couples align on values, family expectations, and communication before marriage — practical tools and faith-sensitive framing.",
    rating: 5,
    reviewCount: 48,
    pricePerSession: 75,
    languages: ["English", "Urdu"],
    avatar:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&q=80",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "c0a1b2c3-d4e5-4000-a100-000000000002",
    name: "James Okonkwo",
    specialty: "Conflict resolution & repair",
    bio: "Focuses on de-escalation, apologies that land, and rebuilding trust after arguments. Works well for busy professionals.",
    rating: 5,
    reviewCount: 36,
    pricePerSession: 90,
    languages: ["English", "French"],
    avatar:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&q=80",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "c0a1b2c3-d4e5-4000-a100-000000000003",
    name: "Dr. Layla Hassan",
    specialty: "Newlyweds & first-year marriage",
    bio: "Guides couples through roles, finances, and in-laws in the first 12 months — structured sessions with clear homework.",
    rating: 4,
    reviewCount: 62,
    pricePerSession: 85,
    languages: ["English", "Arabic"],
    avatar:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&q=80",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "c0a1b2c3-d4e5-4000-a100-000000000004",
    name: "Marcus Chen",
    specialty: "Long-distance & relocation",
    bio: "Specialist in maintaining closeness across time zones and major moves — routines, boundaries, and closing the distance.",
    rating: 5,
    reviewCount: 29,
    pricePerSession: 70,
    languages: ["English", "Mandarin"],
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&q=80",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "c0a1b2c3-d4e5-4000-a100-000000000005",
    name: "Sofia Martins",
    specialty: "Emotional intimacy & love languages",
    bio: "Warm, direct coaching on affection, appreciation, and feeling seen — great if you feel more like roommates than partners.",
    rating: 5,
    reviewCount: 54,
    pricePerSession: 65,
    languages: ["English", "Portuguese", "Spanish"],
    avatar:
      "https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=400&h=400&fit=crop&q=80",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "c0a1b2c3-d4e5-4000-a100-000000000006",
    name: "David Osei",
    specialty: "Blended families & co-parenting",
    bio: "Practical strategies for step-parenting, schedules, and keeping your partnership strong when logistics are heavy.",
    rating: 4,
    reviewCount: 41,
    pricePerSession: 80,
    languages: ["English"],
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&q=80",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Mock Notifications
const mockNotifications = [
  {
    id: generateId(),
    userId: currentUserId || mockUsers[0].id,
    type: "match",
    title: "New Match!",
    message: "You and Sarah Chen have matched! Start a conversation now.",
    relatedUserId: mockUsers[1].id,
    read: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    userId: currentUserId || mockUsers[0].id,
    type: "event",
    title: "Event Reminder",
    message: "Speed Dating Night starts in 2 hours. Don't forget to check in!",
    relatedEntityId: mockEvents[0].id,
    read: false,
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Mock Conversations
const mockConversations = [
  {
    id: generateId(),
    participant1Id: currentUserId || mockUsers[0].id,
    participant2Id: mockUsers[1].id,
    lastMessage: "Thanks! I noticed we both love hiking. Do you have any favorite trails?",
    lastMessageAt: new Date().toISOString(),
    unreadCount: 1,
    otherUser: mockUsers[1],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/** Pathname only, for routing mock responses (avoids `/api/posts` matching `/api/posts/:id/comments`). */
function mockApiPathname(endpoint: string): string {
  try {
    if (endpoint.includes("://")) return new URL(endpoint).pathname;
  } catch {
    /* use raw */
  }
  const q = endpoint.indexOf("?");
  return (q >= 0 ? endpoint.slice(0, q) : endpoint) || "";
}

/** Fresh timestamp so directory/chat “online” dots stay within the 5-minute presence window. */
function mockUserWithFreshPresence<T extends Record<string, unknown>>(u: T): T & { lastActiveAt: string } {
  return { ...u, lastActiveAt: new Date().toISOString() };
}

function mockUsersWithFreshPresence<T extends Record<string, unknown>>(
  users: T[],
): (T & { lastActiveAt: string })[] {
  const now = new Date().toISOString();
  return users.map((x) => ({ ...x, lastActiveAt: now }));
}

/** Normalize mock event for API: attendee count, host fields, isHost for viewer. */
function shapeMockEventForClient(
  e: Record<string, unknown>,
  viewerId: string | null,
): Record<string, unknown> {
  const hostUserId = String(e.hostUserId ?? mockUsers[0].id);
  const host = mockUsers.find((u) => u.id === hostUserId) || mockUsers[0];
  const attendeesCount =
    typeof e.rsvpCount === "number"
      ? e.rsvpCount
      : typeof e.attendeesCount === "number"
        ? e.attendeesCount
        : 0;
  return {
    ...e,
    attendeesCount,
    hasQuestionnaire: e.hasQuestionnaire !== false,
    hostUserId,
    hostName: host.name,
    isHost: Boolean(viewerId && viewerId === hostUserId),
  };
}

function mockPathnameFromUrl(url: string): string {
  try {
    if (url.includes("://")) return new URL(url).pathname;
  } catch {
    /* use raw */
  }
  const q = url.indexOf("?");
  return (q >= 0 ? url.slice(0, q) : url) || "";
}

function parseMockJsonBody(body: unknown): Record<string, unknown> {
  if (body == null || body === "") return {};
  if (typeof body === "string") {
    try {
      return JSON.parse(body) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return body as Record<string, unknown>;
}

function createMockEventFromPayload(
  b: Record<string, unknown>,
  status: "pending" | "approved",
): MockEventRow {
  const viewer = getCurrentUserId();
  const hostUserId = String(b.userId || viewer);
  const id = generateId();
  const imageDefault =
    "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&h=600&fit=crop";
  const imageRaw = typeof b.image === "string" ? b.image.trim() : "";
  return {
    id,
    title: (typeof b.title === "string" && b.title.trim()) || "Untitled event",
    description: typeof b.description === "string" ? b.description : "",
    date: typeof b.date === "string" ? b.date : "",
    time: typeof b.time === "string" ? b.time : "",
    location: typeof b.location === "string" ? b.location : "",
    type: b.type === "online" ? "online" : "offline",
    capacity: Math.max(1, Number(b.capacity) || 50),
    price: typeof b.price === "string" && b.price.trim() ? b.price : "Free",
    image: imageRaw || imageDefault,
    rsvpCount: 0,
    hostUserId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status,
    hasQuestionnaire: b.hasQuestionnaire !== false,
    questionnaireQuestions:
      typeof b.questionnaireQuestions === "string" ? b.questionnaireQuestions : undefined,
  };
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * In-memory mock writes when the real API is unreachable (or returns 5xx).
 * Returns null if this path/method is not handled — caller should use real response or throw.
 */
export function tryMockApiWrite(method: string, url: string, body?: unknown): Response | null {
  const path = mockPathnameFromUrl(url);
  const m = method.toUpperCase();
  const b = parseMockJsonBody(body);
  const viewer = getCurrentUserId();

  if (m === "PUT" && /^\/api\/admin\/onboarding-questionnaire\/?$/.test(path)) {
    const items = b.items;
    if (!Array.isArray(items)) {
      return jsonResponse({ message: "Expected JSON body { items: [...] }" }, 400);
    }
    mockOnboardingQuestionnaireOverride = items as OnboardingQuestionnaireItem[];
    return jsonResponse({
      ok: true,
      items: mockOnboardingQuestionnaireOverride,
    });
  }

  if (m === "POST" && /^\/api\/admin\/events\/?$/.test(path)) {
    const row = createMockEventFromPayload(b, "approved");
    mockEvents.push(row);
    return jsonResponse(shapeMockEventForClient(row as Record<string, unknown>, viewer), 201);
  }

  if (m === "POST" && /^\/api\/events\/?$/.test(path)) {
    const row = createMockEventFromPayload(b, "pending");
    mockEvents.push(row);
    return jsonResponse(shapeMockEventForClient(row as Record<string, unknown>, viewer), 201);
  }

  const singleEventPath = path.match(/^\/api\/events\/([^/]+)\/?$/);
  if (singleEventPath?.[1] && singleEventPath[1] !== "rsvps") {
    const eventId = singleEventPath[1];
    const idx = mockEvents.findIndex((ev) => ev.id === eventId);

    if (m === "PATCH") {
      if (idx === -1) return jsonResponse({ message: "Event not found" }, 404);
      const cur = mockEvents[idx];
      const next: MockEventRow = {
        ...cur,
        updatedAt: new Date().toISOString(),
      };
      if (typeof b.title === "string") next.title = b.title;
      if (typeof b.description === "string") next.description = b.description;
      if (typeof b.date === "string") next.date = b.date;
      if (typeof b.time === "string") next.time = b.time;
      if (typeof b.location === "string") next.location = b.location;
      if (b.type === "online" || b.type === "offline") next.type = b.type;
      if (typeof b.capacity === "number" && b.capacity >= 1) next.capacity = b.capacity;
      if (typeof b.price === "string") next.price = b.price;
      if (typeof b.image === "string") next.image = b.image.trim() || cur.image;
      if (typeof b.hasQuestionnaire === "boolean") next.hasQuestionnaire = b.hasQuestionnaire;
      if (typeof b.questionnaireQuestions === "string")
        next.questionnaireQuestions = b.questionnaireQuestions;
      if (typeof b.rsvpCount === "number" && b.rsvpCount >= 0) next.rsvpCount = b.rsvpCount;
      if (typeof b.matchRevealTime === "string" || b.matchRevealTime === null) {
        next.matchRevealTime =
          b.matchRevealTime === null ? undefined : String(b.matchRevealTime);
      }
      if (b.status === "pending" || b.status === "approved" || b.status === "rejected") {
        next.status = b.status;
      }
      mockEvents[idx] = next;
      return jsonResponse(shapeMockEventForClient(next as Record<string, unknown>, viewer));
    }

    if (m === "DELETE") {
      if (idx === -1) return jsonResponse({ message: "Event not found" }, 404);
      mockEvents.splice(idx, 1);
      return new Response(null, { status: 204 });
    }
  }

  const approvePath = path.match(/^\/api\/admin\/events\/([^/]+)\/approve\/?$/);
  if (m === "PATCH" && approvePath?.[1]) {
    const ev = mockEvents.find((e) => e.id === approvePath[1]);
    if (!ev) return jsonResponse({ message: "Event not found" }, 404);
    ev.status = "approved";
    ev.updatedAt = new Date().toISOString();
    return jsonResponse({
      ...ev,
      attendeesCount: ev.rsvpCount,
      hasQuestionnaire: ev.hasQuestionnaire !== false,
    });
  }

  const rejectPath = path.match(/^\/api\/admin\/events\/([^/]+)\/reject\/?$/);
  if (m === "PATCH" && rejectPath?.[1]) {
    const ev = mockEvents.find((e) => e.id === rejectPath[1]);
    if (!ev) return jsonResponse({ message: "Event not found" }, 404);
    ev.status = "rejected";
    ev.updatedAt = new Date().toISOString();
    return jsonResponse({
      ...ev,
      attendeesCount: ev.rsvpCount,
      hasQuestionnaire: ev.hasQuestionnaire !== false,
    });
  }

  return null;
}

function shapeAdminListEvent(e: MockEventRow): Record<string, unknown> {
  const status = e.status || "approved";
  return {
    ...e,
    status,
    attendeesCount: e.rsvpCount,
    hasQuestionnaire: e.hasQuestionnaire !== false,
  };
}

// Export mock data getters
export const getMockData = (endpoint: string): any => {
  const path = mockApiPathname(endpoint);
  if (/^\/api\/onboarding-questionnaire\/?$/.test(path)) {
    return (
      mockOnboardingQuestionnaireOverride ?? getDefaultOnboardingQuestionnaireItems()
    );
  }
  if (/^\/api\/admin\/onboarding-questionnaire\/?$/.test(path)) {
    return (
      mockOnboardingQuestionnaireOverride ?? getDefaultOnboardingQuestionnaireItems()
    );
  }
  if (/^\/api\/admin\/events\/?$/.test(path)) {
    let page = 1;
    let limit = 50;
    let statusFilter: string | undefined;
    try {
      const u = new URL(
        endpoint.includes("://")
          ? endpoint
          : `http://mock.local${endpoint.startsWith("/") ? "" : "/"}${endpoint}`,
      );
      page = Math.max(1, parseInt(u.searchParams.get("page") || "1", 10));
      limit = Math.max(1, Math.min(100, parseInt(u.searchParams.get("limit") || "50", 10)));
      const s = u.searchParams.get("status");
      if (s) statusFilter = s;
    } catch {
      /* defaults */
    }
    let list = mockEvents.map((ev) => shapeAdminListEvent(ev));
    if (statusFilter && ["pending", "approved", "rejected"].includes(statusFilter)) {
      list = list.filter((e) => (e.status as string) === statusFilter);
    }
    const total = list.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    return {
      events: list.slice(start, start + limit),
      totalPages,
      page,
      total,
    };
  }
  if (/\/api\/posts\/[^/]+\/comments\/?$/.test(path)) {
    const m = path.match(/^\/api\/posts\/([^/]+)\/comments\/?$/);
    const pid = m?.[1];
    return pid ? getMockPostCommentSeeds(pid) : [];
  }
  if (endpoint.includes('/api/users') && !endpoint.includes('/users/')) {
    return mockUsersWithFreshPresence(mockUsers);
  }
  if (endpoint.includes('/api/users/search')) {
    let q = '';
    try {
      const base = endpoint.includes('://') ? endpoint : `http://x${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
      const u = new URL(base);
      q = (u.searchParams.get('q') || '').trim().toLowerCase();
    } catch {
      const m = endpoint.match(/[?&]q=([^&]*)/);
      q = m ? decodeURIComponent(m[1]).replace(/\+/g, ' ').trim().toLowerCase() : '';
    }
    if (!q) return [];
    return mockUsersWithFreshPresence(
      mockUsers.filter(
        (user) =>
          String(user.username || '')
            .toLowerCase()
            .includes(q) ||
          String(user.name || '')
            .toLowerCase()
            .includes(q) ||
          String(user.email || '')
            .toLowerCase()
            .includes(q),
      ),
    );
  }
  if (/\/api\/users\/[^/]+\/ai-matches\/?$/.test(path)) {
    const pool = mockUsers.filter((u) => u.id !== currentUserId).slice(0, 4);
    return {
      rankingSource: "fallback" as const,
      matches: pool.map((u, i) => ({
        id: u.id,
        name: u.name,
        age: u.age,
        image: u.avatar,
        bio: u.bio,
        compatibility: 76 + ((i * 4) % 20),
        mutualCompatibility: 70 + ((i * 3) % 22),
        reasons: ["Aligned interests", "Compatible lifestyle", "Strong communication fit"],
        emphasis: "Promising match",
      })),
    };
  }
  if (endpoint.includes('/api/users/') && endpoint.includes('/unrevealed-matches')) {
    return [];
  }
  if (
    endpoint.includes('/api/users/') &&
    endpoint.includes('/matches') &&
    !endpoint.includes('/unrevealed-matches') &&
    !endpoint.includes('/ai-matches')
  ) {
    return [];
  }
  if (endpoint.includes('/api/users/') && endpoint.includes('/memberships')) {
    let userId = '';
    try {
      const path = endpoint.includes('://') ? new URL(endpoint).pathname : endpoint;
      const m = path.match(/\/api\/users\/([^/]+)\/memberships/);
      userId = m?.[1] || '';
    } catch {
      userId = endpoint.split('/api/users/')[1]?.split('/')[0] || '';
    }
    if (!userId || userId === 'search') return [];
    return mockGroupMemberships.filter((row) => row.userId === userId);
  }
  if (endpoint.includes('/api/users/') && endpoint.includes('/rsvps')) {
    return [];
  }
  if (endpoint.includes('/api/users/') && endpoint.includes('/enrollments')) {
    return [];
  }
  if (
    endpoint.includes('/api/users/') &&
    !endpoint.includes('/unrevealed-matches') &&
    !endpoint.includes('/memberships') &&
    !endpoint.includes('/rsvps') &&
    !endpoint.includes('/enrollments') &&
    !endpoint.includes('/notifications') &&
    !endpoint.includes('/conversations') &&
    !endpoint.includes('/conversation-summaries') &&
    !endpoint.includes('/chat-unread-count') &&
    !endpoint.includes('/matches') &&
    !endpoint.includes('/search')
  ) {
    const userId = endpoint.split('/api/users/')[1]?.split('?')[0]?.split('/')[0];
    if (!userId || userId === 'search') return mockUserWithFreshPresence(mockUsers[0]);
    const found = mockUsers.find((u) => u.id === userId) || mockUsers[0];
    return mockUserWithFreshPresence(found);
  }
  if (endpoint.includes('/api/stories')) {
    return mockStories;
  }
  if (path === "/api/posts" || /\/api\/posts\/?$/.test(path)) {
    return mockPosts;
  }
  {
    const m = path.match(/^\/api\/groups\/([^/]+)\/?$/);
    if (m?.[1] && m[1] !== "memberships") {
      const gid = m[1];
      const found = mockGroups.find((g) => g.id === gid);
      if (found) return found;
      return {
        ...mockGroups[0],
        id: gid,
        name: "Group not in demo list",
        description: "This id is not one of the seeded Matchify groups. Check mockData / seedGroups.",
      };
    }
  }
  if (endpoint.includes('/api/groups')) {
    return mockGroups;
  }
  {
    const m = path.match(/^\/api\/events\/([^/]+)\/?$/);
    if (m?.[1]) {
      const eventId = m[1];
      const base = mockEvents.find((ev) => ev.id === eventId);
      const viewer = getCurrentUserId();
      if (base) return shapeMockEventForClient(base as Record<string, unknown>, viewer);
      return shapeMockEventForClient({ ...mockEvents[0], id: eventId } as Record<string, unknown>, viewer);
    }
  }
  if (path === "/api/events" || /^\/api\/events\/?$/.test(path)) {
    const viewer = getCurrentUserId();
    return mockEvents.map((ev) => shapeMockEventForClient(ev as Record<string, unknown>, viewer));
  }
  if (endpoint.includes('/api/courses')) {
    return mockCourses;
  }
  if (endpoint.includes("/api/coaches")) {
    let path = endpoint;
    try {
      if (endpoint.includes("://")) path = new URL(endpoint).pathname;
    } catch {
      /* use raw */
    }
    const m = path.match(/\/api\/coaches(?:\/([^/?]+))?/);
    const id = m?.[1];
    if (id && id !== "bookings") {
      const one = mockCoaches.find((c) => c.id === id);
      return one ?? mockCoaches[0];
    }
    return mockCoaches;
  }
  // Handle both old and new endpoint formats
  if (endpoint.includes('/api/users/') && endpoint.includes('/notifications')) {
    const userId = endpoint.split('/api/users/')[1]?.split('/notifications')[0];
    if (userId) {
      return mockNotifications.filter(n => n.userId === userId);
    }
  }
  if (endpoint.includes('/api/users/') && endpoint.includes('/chat-unread-count')) {
    const sum = mockConversations.reduce((a, c) => a + (Number((c as { unreadCount?: number }).unreadCount) || 0), 0);
    return { count: sum };
  }
  if (endpoint.includes('/api/users/') && endpoint.includes('/conversation-summaries')) {
    const userId = endpoint.split('/api/users/')[1]?.split('/conversation-summaries')[0];
    const rows = mockConversations.filter(
      (c) => c.participant1Id === userId || c.participant2Id === userId,
    );
    return rows.map((c) => {
      const last = (c as { lastMessage?: string }).lastMessage;
      const at = (c as { lastMessageAt?: string }).lastMessageAt;
      return {
        ...c,
        lastMessage: last
          ? {
              id: 'mock-msg',
              conversationId: c.id,
              senderId: c.participant2Id,
              content: last,
              read: false,
              createdAt: at || new Date().toISOString(),
            }
          : null,
        unreadCount: (c as { unreadCount?: number }).unreadCount ?? 0,
      };
    });
  }
  if (endpoint.includes('/api/notifications/')) {
    const userId = endpoint.split('/api/notifications/')[1];
    return mockNotifications.filter(n => n.userId === userId);
  }
  if (endpoint.includes('/api/users/') && endpoint.includes('/conversations')) {
    const userId = endpoint.split('/api/users/')[1]?.split('/conversations')[0];
    if (userId) {
      return mockConversations.filter(c => c.participant1Id === userId || c.participant2Id === userId);
    }
  }
  if (endpoint.includes('/api/conversations/')) {
    const userId = endpoint.split('/api/conversations/')[1];
    return mockConversations.filter(c => c.participant1Id === userId || c.participant2Id === userId);
  }
  return [];
};

// Create a new user
export const createMockUser = (userData: {
  username: string;
  email: string;
  name: string;
  age?: number;
  location?: string;
  bio?: string;
  avatar?: string;
  interests?: string[];
}) => {
  const newUser: any = {
    id: generateId(),
    ...userData,
    membershipTier: 'free' as const,
    verified: false,
    onboardingCompleted: true,
    // Default self-discovery data (not completed)
    selfDiscoveryCompleted: false,
    commitmentIntention: undefined,
    loveLanguage: undefined,
    topPriorities: undefined,
    dealbreakers: undefined,
    pastRelationships: undefined,
    relationshipReadiness: undefined,
    empathyPatterns: undefined,
    gender: undefined,
    religion: "prefer_not_say",
    meetPreference: "open_to_all",
    education: undefined,
    career: undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockUsers.push(newUser);
  currentUserId = newUser.id;
  return newUser;
};

// Get current user ID
export const getCurrentUserId = () => currentUserId || mockUsers[0].id;

/** Resolve a seeded mock user (for social / blocked lists UI). */
export function lookupMockUser(userId: string) {
  return mockUsers.find((u) => u.id === userId) ?? null;
}

// Set current user ID
export const setCurrentUserId = (userId: string) => {
  currentUserId = userId;
};

