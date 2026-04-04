// Mock data service - provides dummy data when backend is unavailable
import { nanoid } from "nanoid";
import {
  getDefaultOnboardingQuestionnaireItems,
  type OnboardingQuestionnaireItem,
} from "./onboardingQuestionnaire";
import type { EventQuestionItem } from "./eventQuestionnaireDefaults";
import { createSeedWorld, DEFAULT_SEED_GROUP_IDS } from "./seedWorld";

/** Admin-edited onboarding questionnaire (demo / offline API). */
let mockOnboardingQuestionnaireOverride: OnboardingQuestionnaireItem[] | null = null;

/** Admin-edited default event RSVP questions (demo / offline API). */
let mockEventQuestionnaireTemplateOverride: EventQuestionItem[] | null = null;

// Generate UUID-like IDs
const generateId = () => nanoid();

// Current user (will be set when user is created)
let currentUserId: string | null = null;

// Seed world (200+ users, busy posts/groups/chats). New registrations stay fresh.
const seedWorld = createSeedWorld({
  seed: "matchify_world_v1",
  userCount: 220,
  groupCount: 20,
  postCount: 160,
  storyCount: 50,
  conversationCount: 45,
  notificationCount: 80,
});

// Mock Users (seeded)
const mockUsers = seedWorld.users;

// Set first user as current user if not set
if (!currentUserId && mockUsers.length > 0) {
  currentUserId = mockUsers[0].id;
}

// Mock Stories
const mockStories = seedWorld.stories;

/**
 * Fixed group IDs for offline mock data (`seedWorld`). Keep stable so posts resolve group names.
 */
const _MOCK_GROUP_IDS = DEFAULT_SEED_GROUP_IDS;

// Mock Posts — use top-level `image` / `imageUrl` for **post media** (not only author avatar).
const mockPosts = seedWorld.posts;

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

// Mock groups — aligned with `seedWorld` defaults for offline dev.
const mockGroups = seedWorld.groups;

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

// Seed memberships for seeded users only. New registrations start with zero memberships.
for (const m of seedWorld.groupMemberships) {
  mockGroupMemberships.push({ ...m });
}

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
      "https://img.freepik.com/free-photo/young-beautiful-woman-pink-warm-sweater-natural-look-smiling-portrait-isolated-long-hair_285396-896.jpg?w=360",
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
      "https://img.freepik.com/free-photo/young-bearded-man-with-striped-shirt_273609-5677.jpg",
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
      "https://img.freepik.com/free-photo/red-haired-serious-young-man-blogger-looks-confidently_273609-16730.jpg?w=360",
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
      "https://t4.ftcdn.net/jpg/06/24/08/27/360_F_624082743_aVEka1dU9sc3beNvTNqVEosOXz53oJPZ.jpg",
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
      "https://img.freepik.com/free-photo/portrait-smiling-young-man_1268-21877.jpg?w=360",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/** In-memory coach bookings when the API is unavailable (dev / no backend). */
const mockCoachBookings: Record<string, unknown>[] = [];

// Mock Notifications
const mockNotifications = seedWorld.notifications;

// Mock Conversations
const mockConversations = seedWorld.conversations;

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
  const hostUserId = String(e.hostUserId ?? e.hostId ?? mockUsers[0].id);
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
    hostId: hostUserId,
    hostName: host.name,
    isHost: Boolean(viewerId && viewerId === hostUserId),
  };
}

function mockViewerIsAdminFromStorage(): boolean {
  try {
    const raw = localStorage.getItem("currentUser");
    if (!raw) return false;
    const j = JSON.parse(raw) as { isAdmin?: boolean };
    return j.isAdmin === true;
  } catch {
    return false;
  }
}

function mockEventRowVisibleToViewer(ev: MockEventRow, viewerId: string | null, isAdmin: boolean): boolean {
  const st = String(ev.status ?? "pending")
    .trim()
    .toLowerCase();
  if (st === "approved") return true;
  if (isAdmin) return true;
  const hid = String(ev.hostUserId || "").trim();
  const vid = String(viewerId || "").trim();
  return Boolean(vid && hid && vid === hid);
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

  if (m === "PUT" && /^\/api\/admin\/event-questionnaire-template\/?$/.test(path)) {
    const questions = b.questions;
    if (!Array.isArray(questions)) {
      return jsonResponse({ message: "Expected JSON body { questions: [...] }" }, 400);
    }
    mockEventQuestionnaireTemplateOverride = questions as EventQuestionItem[];
    return jsonResponse({
      ok: true,
      questions: mockEventQuestionnaireTemplateOverride,
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

  if (m === "POST" && /^\/api\/profile-views\/?$/.test(path)) {
    return jsonResponse({ ok: true });
  }

  if (m === "POST" && /^\/api\/coaches\/bookings\/?$/.test(path)) {
    const userId = typeof b.userId === "string" ? b.userId : viewer;
    const coachId = typeof b.coachId === "string" ? b.coachId : "";
    if (!userId || !coachId) {
      return jsonResponse({ message: "Missing fields" }, 400);
    }
    const coach = mockCoaches.find((c) => c.id === coachId);
    const price = coach ? coach.pricePerSession : 0;
    const id = generateId();
    const sessionDate =
      typeof b.sessionDate === "string" || b.sessionDate === null ? b.sessionDate : null;
    const paid =
      b.paymentComplete !== false && b.paymentComplete !== "false" && b.paymentComplete !== 0;
    const row = {
      id,
      userId,
      coachId,
      sessionDate,
      status: "pending_admin_confirmation",
      paymentStatus: paid ? "paid" : "pending",
      paymentRef: paid ? `sim_${Date.now()}` : null,
      amountCents: Math.max(0, Number(price)) * 100,
      currency: "USD",
      proposedSlots: [],
      selectedSlot: sessionDate,
      adminNotes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      coach: coach
        ? { id: coach.id, name: coach.name, avatar: coach.avatar ?? null }
        : { id: coachId, name: "Coach" },
    };
    mockCoachBookings.push(row);
    return jsonResponse(row, 201);
  }

  const adminCoachConfirm = path.match(/^\/api\/admin\/coach-bookings\/([^/]+)\/confirm\/?$/);
  if (m === "PATCH" && adminCoachConfirm?.[1]) {
    const bookingId = adminCoachConfirm[1];
    const row = mockCoachBookings.find((x) => String(x.id) === bookingId);
    if (!row) return jsonResponse({ message: "Booking not found" }, 404);
    (row as { status?: string }).status = "confirmed";
    if (!(row as { sessionDate?: string | null }).sessionDate && (row as { selectedSlot?: string }).selectedSlot) {
      (row as { sessionDate?: string | null }).sessionDate = (row as { selectedSlot?: string }).selectedSlot ?? null;
    }
    return jsonResponse(row, 200);
  }

  const adminCoachPropose = path.match(/^\/api\/admin\/coach-bookings\/([^/]+)\/propose-slot\/?$/);
  if (m === "PATCH" && adminCoachPropose?.[1]) {
    const bookingId = adminCoachPropose[1];
    const row = mockCoachBookings.find((x) => String(x.id) === bookingId);
    if (!row) return jsonResponse({ message: "Booking not found" }, 404);
    const slotsRaw = Array.isArray(b.slots) ? b.slots : [];
    const slots = slotsRaw.filter((x: unknown) => typeof x === "string" && String(x).trim()).map((x: string) => x.trim());
    if (!slots.length) return jsonResponse({ message: "Provide at least one slot" }, 400);
    (row as { proposedSlots?: string[] }).proposedSlots = slots;
    (row as { selectedSlot?: string }).selectedSlot = slots[0];
    (row as { status?: string }).status = "awaiting_user_reschedule_response";
    return jsonResponse(row, 200);
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
  if (/^\/api\/event-questionnaire-template\/?$/.test(path)) {
    return {
      questions: mockEventQuestionnaireTemplateOverride ?? [],
    };
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
  if (/^\/api\/users\/recent-joiners\/?$/.test(path)) {
    return [];
  }
  if (/\/api\/users\/[^/]+\/likes-received\/?$/.test(path)) {
    return [];
  }
  if (/\/api\/users\/[^/]+\/profile-visitors\/?$/.test(path)) {
    return [];
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
  if (/\/api\/users\/[^/]+\/bookings\/?/.test(path)) {
    const m = path.match(/^\/api\/users\/([^/]+)\/bookings\/?$/);
    const userId = m?.[1] || "";
    if (!userId || userId === "search") return [];
    return mockCoachBookings
      .filter((r) => String(r.userId) === userId)
      .slice()
      .reverse();
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
    !endpoint.includes('/search') &&
    !endpoint.includes('/likes-received') &&
    !endpoint.includes('/profile-visitors')
  ) {
    const userId = endpoint.split('/api/users/')[1]?.split('?')[0]?.split('/')[0];
    if (!userId || userId === 'search') return mockUserWithFreshPresence(mockUsers[0]);
    const found = mockUsers.find((u) => u.id === userId) || mockUsers[0];
    return mockUserWithFreshPresence(found);
  }
  // Stories must be DB-backed (no local/mock feed).
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
        description: "This id is not in the offline mock group list. Check mockData / seedWorld.",
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
      const admin = mockViewerIsAdminFromStorage();
      if (base && !mockEventRowVisibleToViewer(base, viewer, admin)) return null;
      if (base) return shapeMockEventForClient(base as Record<string, unknown>, viewer);
      return null;
    }
  }
  if (path === "/api/events" || /^\/api\/events\/?$/.test(path)) {
    const viewer = getCurrentUserId();
    const admin = mockViewerIsAdminFromStorage();
    const visible = mockEvents.filter((ev) => mockEventRowVisibleToViewer(ev, viewer, admin));
    return visible.map((ev) => shapeMockEventForClient(ev as Record<string, unknown>, viewer));
  }
  if (/^\/api\/admin\/coach-bookings\/?$/.test(path)) {
    return mockCoachBookings
      .slice()
      .reverse()
      .map((r) => {
        const coachId = String(r.coachId || "");
        const userId = String(r.userId || "");
        const coach = mockCoaches.find((c) => c.id === coachId);
        const user = mockUsers.find((u) => u.id === userId);
        return {
          ...r,
          coach: r.coach || (coach ? { id: coach.id, name: coach.name } : null),
          user: user ? { id: user.id, name: user.name } : null,
        };
      });
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

