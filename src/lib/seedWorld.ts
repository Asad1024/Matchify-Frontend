import { nanoid } from "nanoid";

type SeedWorldOptions = {
  seed?: string;
  userCount: number;
  groupCount: number;
  postCount?: number;
  storyCount?: number;
  conversationCount?: number;
  notificationCount?: number;
};

type SeedUser = Record<string, unknown> & {
  id: string;
  username: string;
  email: string;
  name: string;
  age: number;
  location: string;
  bio: string;
  avatar: string;
  interests: string[];
  membershipTier: "free" | "premium" | "elite" | "diamond";
  verified: boolean;
  onboardingCompleted: boolean;
  selfDiscoveryCompleted: boolean;
  commitmentIntention: string;
  marriageTimeline: string;
  marriageApproach: string;
  wantsChildren: string;
  nationality: string;
  ethnicity: string;
  languages: string[];
  smoking: string;
  drinksAlcohol: string;
  loveLanguage: string;
  topPriorities: string[];
  dealbreakers: string[];
  religion: string;
  meetPreference: string;
  education: string;
  career: string;
  attractionBlueprint: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

type SeedGroup = {
  id: string;
  name: string;
  description: string;
  tags: string[];
  image: string;
  memberCount: number;
  religionFocus: "all" | "interfaith";
  createdAt: string;
  updatedAt: string;
};

type SeedPost = {
  id: string;
  userId: string;
  groupId?: string;
  content: string;
  likes?: number;
  comments?: number;
  likesCount?: number;
  commentsCount?: number;
  image?: string;
  author: { name: string; image: string; verified: boolean };
  createdAt: string;
  updatedAt: string;
};

type SeedStory = {
  id: string;
  userId: string;
  name: string;
  content: string;
  hasUnread: boolean;
  image: string;
  createdAt: string;
  updatedAt: string;
};

type SeedMembership = { id: string; userId: string; groupId: string; createdAt: string };

type SeedConversation = {
  id: string;
  participant1Id: string;
  participant2Id: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  otherUser: SeedUser;
  createdAt: string;
  updatedAt: string;
};

type SeedNotification = {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  relatedUserId?: string;
  relatedEntityId?: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
};

function xmur3(str: string) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function pick<T>(rnd: () => number, list: readonly T[]): T {
  return list[Math.floor(rnd() * list.length)]!;
}

function sampleUnique<T>(rnd: () => number, list: readonly T[], k: number): T[] {
  const out: T[] = [];
  const seen = new Set<number>();
  const kk = clamp(k, 0, list.length);
  while (out.length < kk) {
    const i = Math.floor(rnd() * list.length);
    if (seen.has(i)) continue;
    seen.add(i);
    out.push(list[i]!);
  }
  return out;
}

/** Same portrait pools as backend seed (no Unsplash) — keeps mock Explore snappy. */
const MOCK_MALE_AVATARS = [
  "https://img.freepik.com/free-photo/young-bearded-man-with-striped-shirt_273609-5677.jpg",
  "https://thumbs.dreamstime.com/b/urban-smiley-young-man-close-up-copy-space-93583763.jpg",
  "https://img.freepik.com/free-photo/red-haired-serious-young-man-blogger-looks-confidently_273609-16730.jpg?w=360",
  "https://img.freepik.com/free-photo/portrait-smiling-young-man_1268-21877.jpg?semt=ais_incoming&w=740&q=80",
  "https://thumbs.dreamstime.com/b/urban-smiley-young-man-close-up-copy-space-93583763.jpg",
] as const;
const MOCK_FEMALE_AVATARS = [
  "https://img.freepik.com/free-photo/young-beautiful-woman-pink-warm-sweater-natural-look-smiling-portrait-isolated-long-hair_285396-896.jpg?semt=ais_incoming&w=740&q=80",
  "https://img.freepik.com/free-photo/young-determined-armenian-curlyhaired-female-university-student-listen-carefully-asignment-look-confident-ready-task-cross-hands-chest-smiling-selfassured-standing-white-background_176420-56066.jpg?semt=ais_incoming&w=740&q=80",
  "https://t4.ftcdn.net/jpg/06/24/08/27/360_F_624082743_aVEka1dU9sc3beNvTNqVEosOXz53oJPZ.jpg",
  "https://t3.ftcdn.net/jpg/02/81/81/86/360_F_281818663_XXRCNuGktKeZsnknqWkKI0rR4JPWui3H.jpg",
  "https://news.cornell.edu/sites/default/files/styles/breakout/public/2020-05/0521_abebegates.jpg?itok=OdW8otpB",
] as const;

function seedPortraitAvatar(userIndex: number): string {
  const pool = userIndex % 2 === 0 ? MOCK_FEMALE_AVATARS : MOCK_MALE_AVATARS;
  const slot = Math.floor(userIndex / 2) % pool.length;
  return pool[slot]!;
}

export const DEFAULT_SEED_GROUP_IDS = [
  "10000001-0000-4000-8000-000000000001",
  "10000001-0000-4000-8000-000000000002",
  "10000001-0000-4000-8000-000000000003",
  "10000001-0000-4000-8000-000000000004",
  "10000001-0000-4000-8000-000000000005",
  "10000001-0000-4000-8000-000000000006",
] as const;

export function createSeedWorld(opts: SeedWorldOptions) {
  const seedStr = opts.seed || "matchify_seed_world_v1";
  const seedFn = xmur3(seedStr);
  const rnd = mulberry32(seedFn());
  const now = Date.now();

  const FIRST_NAMES = [
    "Aisha","Omar","Sara","Hassan","Layla","Yusuf","Mariam","Zain","Noor","Fatima",
    "Adam","Lina","Khalid","Huda","Ibrahim","Nadia","Samir","Amal","Bilal","Salma",
    "Daniel","Emily","Ahmed","Sophia","Ali","Hana","Rayan","Maya","Ismail","Zara",
  ] as const;
  const LAST_NAMES = [
    "Khan","Haddad","Rahman","Saeed","Malik","Aziz","Osei","Chen","Rivera","Patel",
    "Hassan","Ibrahim","Santos","Kim","Nguyen","Farah","Siddiqui","Abdullah","Saleh","Yilmaz",
  ] as const;

  const LOCATIONS = [
    "Dubai, UAE","Abu Dhabi, UAE","Sharjah, UAE","Doha, Qatar","Riyadh, Saudi Arabia",
    "Jeddah, Saudi Arabia","Kuwait City, Kuwait","Manama, Bahrain","Muscat, Oman","Istanbul, Türkiye",
    "London, UK","Toronto, Canada",
  ] as const;

  const RELIGIONS = ["islam","christianity","judaism","hinduism","buddhism","spiritual","atheist_agnostic","other"] as const;
  const MEET_PREF = ["same_faith","open_to_all","prefer_not_say"] as const;
  const TIERS: SeedUser["membershipTier"][] = ["free","free","free","premium","elite","diamond"];

  const NATIONALITIES = ["Emirati","Saudi","Qatari","Pakistani","Indian","Egyptian","Lebanese","Turkish","British","American","Canadian","Nigerian"] as const;
  const ETHNICITIES = ["arab","south_asian","asian","black_african","white_european","latino","mixed","other"] as const;
  const LANGS = ["English","Arabic","Urdu","Hindi","French","Turkish","Mandarin","Tagalog","Spanish"] as const;
  const SMOKING = ["never","socially","occasionally","regularly","prefer_not_say"] as const;
  const ALCOHOL = ["never","socially","occasionally","regularly","prefer_not_say"] as const;
  const LOVE = ["words","acts","gifts","time","touch"] as const;
  const COMMIT = ["figuring_out","hookup","casual","serious","marriage","engaged"] as const;
  const MAR_TIMELINE = ["within_6mo","6_12mo","1_2yr","2yr_plus","unsure","na"] as const;
  const MAR_APPROACH = ["values_first","actively_searching","open_when_right","family_community","events_social","rebuilding","no_rush"] as const;
  const WANTS_KIDS = ["yes","no","open","prefer_not_say"] as const;

  const INTERESTS = [
    "Technology","Travel","Fitness","Reading","Cooking","Music","Art","Sports","Photography","Gaming","Fashion","Movies","Dancing","Hiking","Coffee","Food",
  ] as const;
  const PRIORITIES = [
    "Faith & Spirituality","Family","Career & Ambition","Travel & Adventure","Health & Fitness","Personal Growth","Loyalty & Trust","Fun & Humour",
    "Financial Stability","Intellectual Stimulation","Kindness","Communication Skills","Emotional Intelligence",
  ] as const;
  const DEALBREAKERS = [
    "Smoking","Excessive Drinking","Dishonesty","Poor Communication","Anger Issues","Controlling Behavior","No ambition","Disrespect",
  ] as const;
  const EDUCATION = ["High School","Some College","Bachelor's Degree","Master's Degree","PhD/Doctorate","Professional Degree"] as const;
  const CAREERS = [
    "Software Engineer","Product Manager","Teacher","Nurse","Doctor","Designer","Entrepreneur","Consultant","Accountant","Lawyer",
    "Architect","Fitness Coach","Data Analyst","Marketing Manager","HR Specialist","Researcher",
  ] as const;

  const blueprintPick = (id: string) => {
    // Use the same option ids as FlowB buckets (strings are stable).
    const r = mulberry32(xmur3(`${seedStr}:${id}`)());
    const choose = <T,>(arr: readonly T[], min: number, max: number) =>
      sampleUnique(r, arr, clamp(min + Math.floor(r() * (max - min + 1)), min, max));
    return {
      flowType: "flow-b",
      stylePreferences: choose(["confident","gentle","playful","intellectual","adventurous","mysterious"] as const, 2, 4),
      energyPreferences: choose(["calm","confident","playful","mysterious","intellectual","adventurous"] as const, 2, 4),
      lifestylePreferences: choose(["travel","fitness","cozy","social","nature","luxury","creative","work"] as const, 2, 4),
      coreValues: choose(["honesty","family","growth","adventure","stability","creativity","kindness","ambition"] as const, 3, 5),
      communicationStyle: choose(["texter","caller","inperson","memes","deep","quick"] as const, 2, 3),
      conflictStyle: choose(["discuss","space","compromise","avoid"] as const, 1, 2),
      futureVision: choose(["family_future","travel_future","stable_future","impact_future","visionary_future"] as const, 2, 3),
      career: choose(["creative","corporate","entrepreneur","career"] as const, 2, 3),
      hobbies: choose(["reading","gaming","cooking","art","music","sports","movies","outdoors"] as const, 3, 4),
      socialLife: choose(["party","dinner","netflix","adventure","brunch","quiet"] as const, 2, 3),
      foodPreferences: choose(["foodie","healthy","adventurous","veg","home","dining"] as const, 2, 3),
      timeline: pick(r, ["soon","medium","long","flexible"] as const),
      kidsPreference: pick(r, ["want","maybe","no","have"] as const),
      dealbreakers: choose(["smoking","drinking","no-ambition","dishonesty","jealousy","communication","disrespect","different-values"] as const, 2, 3),
      mustHaves: choose(["chemistry","trust","humor","ambition","kindness","attraction","support","goals"] as const, 3, 3),
      weights: { looks: 0.2, energy: 0.15, lifestyle: 0.15, goals: 0.2, personality: 0.1, values: 0.2 },
      completedAt: new Date(now - Math.floor(r() * 30) * 86400000).toISOString(),
    };
  };

  const users: SeedUser[] = [];
  for (let i = 0; i < opts.userCount; i++) {
    const id = nanoid();
    const first = pick(rnd, FIRST_NAMES);
    const last = pick(rnd, LAST_NAMES);
    const name = `${first} ${last}`;
    const username = `${first.toLowerCase()}${last.toLowerCase()}${100 + Math.floor(rnd() * 900)}`;
    const createdAt = new Date(now - (i + 2) * 86400000).toISOString();
    const commitmentIntention = pick(rnd, COMMIT);
    const marriageTimeline = pick(rnd, MAR_TIMELINE);
    const u: SeedUser = {
      id,
      username,
      email: `${username}@example.com`,
      name,
      age: 19 + Math.floor(rnd() * 20),
      location: pick(rnd, LOCATIONS),
      bio: "Intentional, curious, and here for meaningful connection. Ask me about my favorite weekend ritual.",
      interests: sampleUnique(rnd, INTERESTS, 3 + Math.floor(rnd() * 3)),
      avatar: seedPortraitAvatar(i),
      membershipTier: pick(rnd, TIERS),
      verified: rnd() < 0.45,
      onboardingCompleted: true,
      selfDiscoveryCompleted: true,
      commitmentIntention,
      marriageTimeline,
      marriageApproach: pick(rnd, MAR_APPROACH),
      wantsChildren: pick(rnd, WANTS_KIDS),
      nationality: pick(rnd, NATIONALITIES),
      ethnicity: pick(rnd, ETHNICITIES),
      languages: sampleUnique(rnd, LANGS, 1 + Math.floor(rnd() * 3)),
      smoking: pick(rnd, SMOKING),
      drinksAlcohol: pick(rnd, ALCOHOL),
      loveLanguage: pick(rnd, LOVE),
      topPriorities: sampleUnique(rnd, PRIORITIES, 5),
      dealbreakers: sampleUnique(rnd, DEALBREAKERS, 4),
      religion: pick(rnd, RELIGIONS),
      meetPreference: pick(rnd, MEET_PREF),
      education: pick(rnd, EDUCATION),
      career: pick(rnd, CAREERS),
      attractionBlueprint: blueprintPick(id),
      createdAt,
      updatedAt: createdAt,
    };
    users.push(u);
  }

  const baseGroupNames = [
    ["Matchify Welcome Circle","Official welcome space — intros, app tips, and meeting others who are dating with intention.","welcome,community,introductions"],
    ["Meaningful Marriage Prep","For members seriously preparing for marriage: values, communication, and clarity.","marriage,values,readiness"],
    ["Intentional Dating Lab","Share date ideas, boundaries, and lessons learned while dating on purpose.","dating,events,stories"],
    ["Faith & Values Lounge","Respectful conversations about faith, family, and what matters in a partnership.","faith,family,respect"],
    ["Wellness & Growth Together","Emotional fitness, habits, and supporting each other’s growth in relationships.","wellness,growth,mindfulness"],
    ["Interfaith Respect Table","Open, kind dialogue across backgrounds while dating — everyone is welcome.","interfaith,dialogue,inclusion"],
    ["Weekend Social Club","Brunches, hikes, coffee walks, and low-pressure meetups.","weekend,events,friends"],
    ["Book & Podcast Circle","Relationship books, faith talks, and growth podcasts — weekly picks.","books,podcasts,growth"],
    ["Gym & Fitness Buddies","Training partners, wellness habits, and accountability.","fitness,health,habits"],
    ["Foodie Date Ideas","Great spots, hidden gems, and cooking challenges.","food,date-ideas,cooking"],
    ["Creative Nights","Art shows, music, and creative energy.","art,music,creative"],
    ["Career Builders","Ambition, balance, and building a life together.","career,ambition,balance"],
    ["Green Flags Only","Share green flags you’ve learned to spot.","greenflags,dating,learning"],
    ["Emotional Intelligence Lab","Communication, boundaries, attachment, and repair.","communication,healing,skills"],
    ["Travel & Adventure","Trips, weekend escapes, and dream itineraries.","travel,adventure,plans"],
    ["Quiet & Cozy","Homebodies, tea, and slow weekends.","cozy,homebody,calm"],
    ["Tech & Startups","Builders, product, and startup life.","tech,startups,community"],
    ["Sports & Outdoors","Hikes, runs, games, and outdoorsy vibes.","outdoors,sports,active"],
    ["Language Exchange","Practice languages and meet across cultures.","languages,culture,friends"],
    ["Family & Community","Family systems, values, and traditions.","family,community,traditions"],
  ] as const;

  const groups: SeedGroup[] = [];
  for (let i = 0; i < opts.groupCount; i++) {
    const fixed = DEFAULT_SEED_GROUP_IDS[i as 0 | 1 | 2 | 3 | 4 | 5] || undefined;
    const [name, description, tagsCsv] = baseGroupNames[i % baseGroupNames.length]!;
    const id = fixed || `20000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`;
    groups.push({
      id,
      name,
      description,
      tags: tagsCsv.split(","),
      image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=400&fit=crop",
      memberCount: 50 + Math.floor(rnd() * 450),
      religionFocus: name.toLowerCase().includes("interfaith") ? "interfaith" : "all",
      createdAt: new Date(now - (20 + i) * 86400000).toISOString(),
      updatedAt: new Date(now - (1 + (i % 7)) * 3600000).toISOString(),
    });
  }

  const memberships: SeedMembership[] = [];
  for (const u of users) {
    const joinCount = 0 + Math.floor(rnd() * 5); // 0-4 groups
    const joined = sampleUnique(rnd, groups, joinCount);
    for (const g of joined) {
      memberships.push({
        id: nanoid(),
        userId: u.id,
        groupId: g.id,
        createdAt: new Date(now - Math.floor(rnd() * 90) * 86400000).toISOString(),
      });
    }
  }

  const POST_TEMPLATES = [
    "What’s one boundary that improved your dating life?",
    "Green flags you wish you noticed earlier?",
    "How do you bring up marriage timeline without pressure?",
    "Small win: I communicated my needs clearly today.",
    "Date idea: coffee + a walk + one deep question.",
    "What does emotional availability look like in practice?",
  ] as const;

  const posts: SeedPost[] = [];
  const postCount = opts.postCount ?? Math.max(120, Math.floor(opts.userCount * 0.8));
  for (let i = 0; i < postCount; i++) {
    const author = pick(rnd, users);
    const g = rnd() < 0.7 ? pick(rnd, groups) : null;
    const createdAt = new Date(now - Math.floor(rnd() * 14 * 86400000)).toISOString();
    posts.push({
      id: nanoid(),
      userId: author.id,
      groupId: g?.id,
      content: pick(rnd, POST_TEMPLATES),
      likesCount: Math.floor(rnd() * 30),
      commentsCount: Math.floor(rnd() * 10),
      author: { name: author.name, image: author.avatar, verified: author.verified },
      createdAt,
      updatedAt: createdAt,
    });
  }

  const stories: SeedStory[] = [];
  const storyCount = opts.storyCount ?? 40;
  for (let i = 0; i < storyCount; i++) {
    const u = pick(rnd, users);
    const createdAt = new Date(now - Math.floor(rnd() * 48 * 3600000)).toISOString();
    stories.push({
      id: nanoid(),
      userId: u.id,
      name: u.name,
      content: "A tiny life update — grateful for progress and good conversations lately.",
      hasUnread: rnd() < 0.4,
      image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=400&fit=crop",
      createdAt,
      updatedAt: createdAt,
    });
  }

  const conversations: SeedConversation[] = [];
  const convoCount = opts.conversationCount ?? 35;
  for (let i = 0; i < convoCount; i++) {
    const a = pick(rnd, users);
    let b = pick(rnd, users);
    if (a.id === b.id) b = users[(users.indexOf(a) + 1) % users.length]!;
    const lastAt = new Date(now - Math.floor(rnd() * 72 * 3600000)).toISOString();
    conversations.push({
      id: nanoid(),
      participant1Id: a.id,
      participant2Id: b.id,
      lastMessage: "Hey! I saw your profile — what’s your ideal weekend like?",
      lastMessageAt: lastAt,
      unreadCount: rnd() < 0.25 ? 1 + Math.floor(rnd() * 3) : 0,
      otherUser: b,
      createdAt: lastAt,
      updatedAt: lastAt,
    });
  }

  const notifications: SeedNotification[] = [];
  const notifCount = opts.notificationCount ?? 60;
  for (let i = 0; i < notifCount; i++) {
    const u = pick(rnd, users);
    const other = pick(rnd, users);
    const createdAt = new Date(now - Math.floor(rnd() * 7 * 86400000)).toISOString();
    notifications.push({
      id: nanoid(),
      userId: u.id,
      type: rnd() < 0.5 ? "match" : "message",
      title: rnd() < 0.5 ? "New match" : "New message",
      message: rnd() < 0.5 ? "You have a new match — say hi." : "You received a new message.",
      relatedUserId: other.id,
      read: rnd() < 0.7,
      createdAt,
      updatedAt: createdAt,
    });
  }

  return {
    users,
    groups,
    groupMemberships: memberships,
    posts,
    stories,
    conversations,
    notifications,
  };
}

