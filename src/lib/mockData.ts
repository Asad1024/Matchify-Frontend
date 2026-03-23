// Mock data service - provides dummy data when backend is unavailable
import { nanoid } from 'nanoid';

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
    religion: "islam",
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

// Mock Posts
const mockPosts = [
  {
    id: generateId(),
    userId: mockUsers[1].id,
    content: "Had an amazing time at last night's event! Met so many inspiring people and can't wait for the next one. 🎉",
    likesCount: 12,
    commentsCount: 3,
    author: {
      name: mockUsers[1].name,
      image: mockUsers[1].avatar,
      verified: mockUsers[1].verified,
    },
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    userId: mockUsers[2].id,
    content: "Who else is excited for the upcoming speed dating event? First time trying this and feeling a mix of nerves and excitement!",
    likesCount: 8,
    commentsCount: 5,
    author: {
      name: mockUsers[2].name,
      image: mockUsers[2].avatar,
      verified: mockUsers[2].verified,
    },
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    userId: mockUsers[0].id,
    content: "Just finished an incredible workshop on building meaningful connections. The insights were game-changing! 💡",
    likesCount: 15,
    commentsCount: 7,
    author: {
      name: mockUsers[0].name,
      image: mockUsers[0].avatar,
      verified: mockUsers[0].verified,
    },
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Mock Groups
const mockGroups = [
  {
    id: generateId(),
    name: "Travel Enthusiasts",
    description: "Connect with fellow travelers and explore the world together",
    tags: ["Travel", "Adventure", "Photography"],
    image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=400&fit=crop",
    memberCount: 245,
    religionFocus: "all" as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    name: "Fine Dining Club",
    description: "Discover the best restaurants and culinary experiences",
    tags: ["Food", "Dining", "Wine"],
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=400&fit=crop",
    memberCount: 189,
    religionFocus: "all" as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    name: "Tech Innovators",
    description: "For tech enthusiasts and innovators shaping the future",
    tags: ["Technology", "Startups", "AI"],
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=400&fit=crop",
    memberCount: 312,
    religionFocus: "all" as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    name: "Fitness & Wellness",
    description: "Stay active and healthy with like-minded individuals",
    tags: ["Fitness", "Health", "Yoga"],
    image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&h=400&fit=crop",
    memberCount: 156,
    religionFocus: "all" as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    name: "Young Professionals — Interfaith",
    description: "Open table: respectful dialogue across beliefs while dating intentionally",
    tags: ["Interfaith", "Values", "Dating"],
    image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=400&fit=crop",
    memberCount: 98,
    religionFocus: "interfaith" as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    name: "Community Circle",
    description: "Faith-friendly conversations and events — welcoming all who respect the space",
    tags: ["Community", "Faith", "Support"],
    image: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&h=400&fit=crop",
    memberCount: 412,
    religionFocus: "islam" as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Mock Events
const mockEvents = [
  {
    id: generateId(),
    title: "Speed Dating Night",
    description: "Join us for an exciting evening of connections! Meet 20+ singles in a fun, relaxed atmosphere.",
    date: "Friday, Oct 20",
    time: "7:00 PM - 10:00 PM",
    location: "The Grand Hotel, Downtown Dubai",
    type: "offline",
    capacity: 50,
    price: "$29",
    image: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&h=600&fit=crop",
    rsvpCount: 32,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    title: "Virtual Networking Mixer",
    description: "Connect with professionals from various industries in this online networking event.",
    date: "Saturday, Oct 21",
    time: "6:00 PM - 8:00 PM",
    location: "Zoom (link provided after RSVP)",
    type: "online",
    capacity: 100,
    price: "Free",
    image: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&h=600&fit=crop",
    rsvpCount: 67,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    title: "Wine Tasting Social",
    description: "Enjoy an evening of fine wines and great company. Perfect for wine enthusiasts!",
    date: "Sunday, Oct 22",
    time: "5:00 PM - 9:00 PM",
    location: "The Address Downtown Dubai",
    type: "offline",
    capacity: 40,
    price: "$45",
    image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&h=600&fit=crop",
    rsvpCount: 28,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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
    specialty: "Pre-marriage & nikah readiness",
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

// Export mock data getters
export const getMockData = (endpoint: string): any => {
  if (endpoint.includes('/api/users') && !endpoint.includes('/users/')) {
    return mockUsers;
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
    return mockUsers.filter(
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
    );
  }
  if (endpoint.includes('/api/users/') && endpoint.includes('/unrevealed-matches')) {
    return [];
  }
  if (endpoint.includes('/api/users/') && endpoint.includes('/memberships')) {
    return [];
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
    !endpoint.includes('/search')
  ) {
    const userId = endpoint.split('/api/users/')[1]?.split('?')[0]?.split('/')[0];
    if (!userId || userId === 'search') return mockUsers[0];
    return mockUsers.find((u) => u.id === userId) || mockUsers[0];
  }
  if (endpoint.includes('/api/stories')) {
    return mockStories;
  }
  if (endpoint.includes('/api/posts')) {
    return mockPosts;
  }
  if (endpoint.includes('/api/groups')) {
    return mockGroups;
  }
  if (endpoint.includes('/api/events')) {
    return mockEvents;
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

// Set current user ID
export const setCurrentUserId = (userId: string) => {
  currentUserId = userId;
};

