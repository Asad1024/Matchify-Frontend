import { RELIGION_OPTIONS } from "@/lib/religionOptions";
import { ALCOHOL_OPTIONS, ETHNICITY_OPTIONS, SMOKING_OPTIONS } from "@/lib/profileDemographics";
import {
  COMMITMENT_INTENTION_OPTIONS,
  MARRIAGE_APPROACH_OPTIONS,
  MARRIAGE_TIMELINE_OPTIONS,
} from "@/lib/marriageIntentFields";

export type JourneyStyle = "fast" | "deep" | "conversational";

export type ChapterKey =
  | "who-are-you"
  | "marriage-essentials"
  | "what-matters"
  | "how-connect"
  | "ideal-day"
  | "future-together";

export type OnboardingQuestionnaireItem = {
  id: string;
  chapterKey: ChapterKey;
  fieldKey: string;
  type:
    | "text"
    | "number"
    | "textarea"
    | "select"
    | "multi-select"
    | "goal-select"
    | "meet-preference-select"
    | "birthday";
  labelFast: string;
  labelDeep: string;
  labelConversational: string;
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  /** multi-select cap */
  max?: number;
  /** textarea min length when required */
  minLength?: number;
  order: number;
  active: boolean;
  /** If set, only these journey styles show this question */
  styles?: JourneyStyle[];
};

export type BuiltQuestion = {
  id: string;
  label: string;
  type: OnboardingQuestionnaireItem["type"];
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  max?: number;
  minLength?: number;
};

export type BuiltChapter = {
  title: string;
  subtitle: string;
  description: string;
  questions: BuiltQuestion[];
};

const RELIGION_FIELD_OPTIONS = RELIGION_OPTIONS.map((r) => ({ value: r.value, label: r.label }));

const VALUE_OPTIONS = [
  "Family-Oriented",
  "Career-Focused",
  "Adventurous",
  "Spiritual",
  "Health-Conscious",
  "Creative",
  "Ambitious",
  "Honest",
  "Loyal",
  "Fun-Loving",
  "Intellectual",
  "Empathetic",
].map((v) => ({ value: v, label: v }));

const LIFESTYLE_OPTIONS = [
  "Fitness Enthusiast",
  "Foodie",
  "Travel Lover",
  "Homebody",
  "Night Owl",
  "Early Bird",
  "Pet Lover",
  "Social Butterfly",
  "Bookworm",
  "Tech Savvy",
  "Artist",
  "Entrepreneur",
].map((v) => ({ value: v, label: v }));

const INTEREST_OPTIONS = [
  "Technology",
  "Travel",
  "Fitness",
  "Reading",
  "Cooking",
  "Music",
  "Art",
  "Sports",
  "Photography",
  "Gaming",
  "Fashion",
  "Movies",
  "Dancing",
  "Hiking",
].map((v) => ({ value: v, label: v }));

const EDUCATION_LEVELS = [
  "High School",
  "Some College",
  "Bachelor's Degree",
  "Master's Degree",
  "PhD/Doctorate",
  "Professional Degree",
];

const INCOME_RANGES = [
  "Under $30k",
  "$30k - $50k",
  "$50k - $75k",
  "$75k - $100k",
  "$100k - $150k",
  "$150k+",
  "Prefer not to say",
];

const ZODIAC_SIGNS = [
  { value: "aries", label: "Aries (Mar 21 - Apr 19)" },
  { value: "taurus", label: "Taurus (Apr 20 - May 20)" },
  { value: "gemini", label: "Gemini (May 21 - Jun 20)" },
  { value: "cancer", label: "Cancer (Jun 21 - Jul 22)" },
  { value: "leo", label: "Leo (Jul 23 - Aug 22)" },
  { value: "virgo", label: "Virgo (Aug 23 - Sep 22)" },
  { value: "libra", label: "Libra (Sep 23 - Oct 22)" },
  { value: "scorpio", label: "Scorpio (Oct 23 - Nov 21)" },
  { value: "sagittarius", label: "Sagittarius (Nov 22 - Dec 21)" },
  { value: "capricorn", label: "Capricorn (Dec 22 - Jan 19)" },
  { value: "aquarius", label: "Aquarius (Jan 20 - Feb 18)" },
  { value: "pisces", label: "Pisces (Feb 19 - Mar 20)" },
];

const CHAPTER_META: Record<
  ChapterKey,
  Record<
    JourneyStyle,
    { title: string; subtitle: string; description: string }
  >
> = {
  "who-are-you": {
    fast: {
      title: "Quick Start",
      subtitle: "Let's get to know you fast!",
      description: "Just the essentials — we'll make this quick.",
    },
    deep: {
      title: "Chapter 1: The Foundation of You",
      subtitle: "Building your authentic identity",
      description:
        "Every great story begins with understanding who you are at your core.",
    },
    conversational: {
      title: "Let's Chat",
      subtitle: "Getting to know you",
      description:
        "Hi! I'm here to help you create an amazing profile. Let's start with the basics.",
    },
  },
  "marriage-essentials": {
    fast: {
      title: "Marriage profile",
      subtitle: "A few essentials for better matches",
      description: "These details help the Marriage section show accurate info.",
    },
    deep: {
      title: "Chapter 2: Marriage readiness",
      subtitle: "Intent and life context",
      description: "Clear answers here improve marriage-mode matching and your card.",
    },
    conversational: {
      title: "Marriage-minded details",
      subtitle: "So we can represent you fairly",
      description: "Quick questions that show on your marriage profile card.",
    },
  },
  "what-matters": {
    fast: {
      title: "What You Want",
      subtitle: "Your goal & top values",
      description: "What are you looking for?",
    },
    deep: {
      title: "Chapter 3: The Values That Guide You",
      subtitle: "Discovering what truly matters",
      description: "What principles do you hold dear?",
    },
    conversational: {
      title: "What Matters to You?",
      subtitle: "Let's talk about your goals",
      description: "What are you really looking for — and what values drive you?",
    },
  },
  "how-connect": {
    fast: {
      title: "Your Vibe",
      subtitle: "Lifestyle & interests",
      description: "How do you like to spend your time?",
    },
    deep: {
      title: "Chapter 4: The Art of Connection",
      subtitle: "How you relate to the world",
      description: "How do you prefer to engage with others?",
    },
    conversational: {
      title: "How You Connect",
      subtitle: "Tell me about your lifestyle",
      description: "What are you into?",
    },
  },
  "ideal-day": {
    fast: {
      title: "About You",
      subtitle: "Quick details",
      description: "A few more quick details.",
    },
    deep: {
      title: "Chapter 5: The Canvas of Your Life",
      subtitle: "Painting your ideal reality",
      description: "Education, work, and how you connect emotionally.",
    },
    conversational: {
      title: "A Bit More About You",
      subtitle: "Just a few more questions",
      description: "Almost there — a couple more things.",
    },
  },
  "future-together": {
    fast: {
      title: "Almost Done!",
      subtitle: "Optional extras",
      description: "Optional — skipped in Fast & Fun.",
    },
    deep: {
      title: "Chapter 6: Visions of Tomorrow",
      subtitle: "Envisioning your future",
      description: "Optional astrology and birthday details.",
    },
    conversational: {
      title: "Wrapping Up",
      subtitle: "Any final details?",
      description: "Optional — share if you like.",
    },
  },
};

export function getDefaultOnboardingQuestionnaireItems(): OnboardingQuestionnaireItem[] {
  let o = 0;
  const next = () => ++o;
  return [
    {
      id: "q-name",
      chapterKey: "who-are-you",
      fieldKey: "name",
      type: "text",
      labelFast: "Your name?",
      labelDeep: "What name do you go by?",
      labelConversational: "First things first — what should I call you?",
      required: true,
      placeholder: "Full name",
      order: next(),
      active: true,
    },
    {
      id: "q-age",
      chapterKey: "who-are-you",
      fieldKey: "age",
      type: "number",
      labelFast: "Age?",
      labelDeep: "How many years of life experience have you gathered?",
      labelConversational: "How old are you? (Don't worry, I won't judge!)",
      required: true,
      placeholder: "Age",
      order: next(),
      active: true,
    },
    {
      id: "q-location",
      chapterKey: "who-are-you",
      fieldKey: "location",
      type: "text",
      labelFast: "Where are you?",
      labelDeep: "Where do you call home?",
      labelConversational: "Where are you based?",
      required: true,
      placeholder: "City, country",
      order: next(),
      active: true,
    },
    {
      id: "q-nationality",
      chapterKey: "who-are-you",
      fieldKey: "nationality",
      type: "text",
      labelFast: "Nationality",
      labelDeep: "What is your nationality?",
      labelConversational: "What's your nationality? (country or region you identify with)",
      required: true,
      placeholder: "e.g. Emirati, British, American",
      order: next(),
      active: true,
    },
    {
      id: "q-ethnicity",
      chapterKey: "who-are-you",
      fieldKey: "ethnicity",
      type: "select",
      labelFast: "Ethnicity / heritage",
      labelDeep: "How do you describe your ethnicity or heritage?",
      labelConversational: "How would you describe your ethnicity or cultural heritage?",
      required: true,
      options: [...ETHNICITY_OPTIONS],
      order: next(),
      active: true,
    },
    {
      id: "q-gender",
      chapterKey: "who-are-you",
      fieldKey: "gender",
      type: "select",
      labelFast: "Gender?",
      labelDeep: "How do you identify yourself?",
      labelConversational: "How do you identify?",
      required: true,
      options: [
        { value: "male", label: "Male" },
        { value: "female", label: "Female" },
        { value: "other", label: "Other" },
      ],
      order: next(),
      active: true,
    },
    {
      id: "q-religion",
      chapterKey: "who-are-you",
      fieldKey: "religion",
      type: "select",
      labelFast: "Faith or worldview",
      labelDeep: "How would you describe your faith or worldview?",
      labelConversational: "What faith or worldview fits you best? (Everyone's welcome here)",
      required: true,
      options: RELIGION_FIELD_OPTIONS,
      order: next(),
      active: true,
    },
    {
      id: "q-faith-importance",
      chapterKey: "who-are-you",
      fieldKey: "faithImportance",
      type: "select",
      labelFast: "Shared faith in a partner?",
      labelDeep: "How important is shared faith in a partner?",
      labelConversational: "How important is shared faith to you in a partner?",
      required: true,
      options: [
        { value: "essential", label: "Essential" },
        { value: "important", label: "Important" },
        { value: "nice", label: "Nice to have" },
        { value: "not_important", label: "Not important" },
      ],
      order: next(),
      active: true,
    },
    {
      id: "q-bio",
      chapterKey: "who-are-you",
      fieldKey: "bio",
      type: "textarea",
      labelFast: "Quick bio (min 10 chars)",
      labelDeep: "Share your story with us",
      labelConversational: "Tell me about yourself! What makes you unique?",
      required: true,
      placeholder: "Tell us about yourself…",
      minLength: 10,
      order: next(),
      active: true,
    },
    {
      id: "q-extra-bio",
      chapterKey: "who-are-you",
      fieldKey: "extraBio",
      type: "textarea",
      labelFast: "Extended bio (optional)",
      labelDeep: "Anything else you'd like people to know? (optional)",
      labelConversational: "Want to add a longer intro? (optional)",
      required: false,
      placeholder: "Longer text for your profile…",
      minLength: 0,
      order: next(),
      active: true,
    },
    {
      id: "q-languages",
      chapterKey: "who-are-you",
      fieldKey: "languages",
      type: "text",
      labelFast: "Languages you speak",
      labelDeep: "Languages you speak (comma-separated)",
      labelConversational: "What languages do you speak? (comma-separated)",
      required: true,
      placeholder: "e.g. English, Arabic, Urdu",
      order: next(),
      active: true,
    },
    {
      id: "q-commitment",
      chapterKey: "marriage-essentials",
      fieldKey: "commitmentIntention",
      type: "select",
      labelFast: "Commitment stage right now",
      labelDeep: "Where are you on the path to commitment?",
      labelConversational: "Where are you at commitment-wise right now?",
      required: true,
      options: [...COMMITMENT_INTENTION_OPTIONS],
      order: next(),
      active: true,
    },
    {
      id: "q-marriage-timeline",
      chapterKey: "marriage-essentials",
      fieldKey: "marriageTimeline",
      type: "select",
      labelFast: "Marriage timeline (if relevant)",
      labelDeep: "If marriage is on your radar, what's your timeline?",
      labelConversational: "Thinking about marriage — what's your rough timeline?",
      required: true,
      options: [...MARRIAGE_TIMELINE_OPTIONS],
      order: next(),
      active: true,
    },
    {
      id: "q-marriage-approach",
      chapterKey: "marriage-essentials",
      fieldKey: "marriageApproach",
      type: "select",
      labelFast: "How are you moving toward marriage?",
      labelDeep: "What best describes how you're approaching marriage in real life?",
      labelConversational: "In practice, how are you moving toward marriage — or taking your time?",
      required: true,
      options: [...MARRIAGE_APPROACH_OPTIONS],
      order: next(),
      active: true,
    },
    {
      id: "q-height",
      chapterKey: "marriage-essentials",
      fieldKey: "heightCm",
      type: "number",
      labelFast: "Height (cm)",
      labelDeep: "Your height in centimeters",
      labelConversational: "What's your height? (in cm is fine)",
      required: true,
      placeholder: "e.g. 170",
      order: next(),
      active: true,
    },
    {
      id: "q-marital",
      chapterKey: "marriage-essentials",
      fieldKey: "maritalStatus",
      type: "select",
      labelFast: "Marital status",
      labelDeep: "Marital status",
      labelConversational: "What's your current marital status?",
      required: true,
      options: [
        { value: "never_married", label: "Never married" },
        { value: "divorced", label: "Divorced" },
        { value: "widowed", label: "Widowed" },
        { value: "separated", label: "Separated" },
        { value: "prefer_not_say", label: "Prefer not to say" },
      ],
      order: next(),
      active: true,
    },
    {
      id: "q-children",
      chapterKey: "marriage-essentials",
      fieldKey: "hasChildren",
      type: "select",
      labelFast: "Do you have children?",
      labelDeep: "Do you have children?",
      labelConversational: "Do you have kids?",
      required: true,
      options: [
        { value: "no", label: "No" },
        { value: "yes", label: "Yes" },
        { value: "prefer_not_say", label: "Prefer not to say" },
      ],
      order: next(),
      active: true,
    },
    {
      id: "q-wants-children",
      chapterKey: "marriage-essentials",
      fieldKey: "wantsChildren",
      type: "select",
      labelFast: "Want children in the future?",
      labelDeep: "Do you want children in the future?",
      labelConversational: "Kids in the future — how do you feel?",
      required: true,
      options: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
        { value: "open", label: "Open / unsure" },
        { value: "prefer_not_say", label: "Prefer not to say" },
      ],
      order: next(),
      active: true,
    },
    {
      id: "q-smoking",
      chapterKey: "marriage-essentials",
      fieldKey: "smoking",
      type: "select",
      labelFast: "Do you smoke?",
      labelDeep: "Do you smoke tobacco or vape?",
      labelConversational: "Do you smoke or vape?",
      required: true,
      options: [...SMOKING_OPTIONS],
      order: next(),
      active: true,
    },
    {
      id: "q-alcohol",
      chapterKey: "marriage-essentials",
      fieldKey: "drinksAlcohol",
      type: "select",
      labelFast: "Do you drink alcohol?",
      labelDeep: "How do you approach alcohol?",
      labelConversational: "How do you feel about drinking alcohol?",
      required: true,
      options: [...ALCOHOL_OPTIONS],
      order: next(),
      active: true,
    },
    {
      id: "q-goal",
      chapterKey: "what-matters",
      fieldKey: "relationshipGoal",
      type: "goal-select",
      labelFast: "What are you looking for?",
      labelDeep: "What kind of connection are you seeking?",
      labelConversational: "What kind of relationship are you seeking?",
      required: true,
      order: next(),
      active: true,
    },
    {
      id: "q-meet",
      chapterKey: "what-matters",
      fieldKey: "meetPreference",
      type: "meet-preference-select",
      labelFast: "People & groups — what should we highlight?",
      labelDeep: "For matches and communities, what should we prioritize?",
      labelConversational:
        "Should we highlight people & groups closer to your background, or keep everything open?",
      required: true,
      order: next(),
      active: true,
    },
    {
      id: "q-values",
      chapterKey: "what-matters",
      fieldKey: "values",
      type: "multi-select",
      labelFast: "Top 3 values",
      labelDeep: "Select your core values (up to 5)",
      labelConversational: "What values matter most? (up to 5)",
      required: true,
      options: VALUE_OPTIONS,
      max: 5,
      styles: ["deep", "conversational"],
      order: next(),
      active: true,
    },
    {
      id: "q-values-fast",
      chapterKey: "what-matters",
      fieldKey: "values",
      type: "multi-select",
      labelFast: "Top 3 values",
      labelDeep: "Top 3 values",
      labelConversational: "Top 3 values",
      required: true,
      options: VALUE_OPTIONS,
      max: 3,
      styles: ["fast"],
      order: next(),
      active: true,
    },
    {
      id: "q-lifestyle",
      chapterKey: "how-connect",
      fieldKey: "lifestyle",
      type: "multi-select",
      labelFast: "Lifestyle tags",
      labelDeep: "Which lifestyle elements resonate with you?",
      labelConversational: "Which of these describe your lifestyle?",
      required: false,
      options: LIFESTYLE_OPTIONS,
      max: 5,
      order: next(),
      active: true,
    },
    {
      id: "q-interests",
      chapterKey: "how-connect",
      fieldKey: "interests",
      type: "multi-select",
      labelFast: "Interests",
      labelDeep: "What activities and interests light you up?",
      labelConversational: "What are your interests?",
      required: true,
      options: INTEREST_OPTIONS,
      max: 5,
      order: next(),
      active: true,
    },
    {
      id: "q-love-lang",
      chapterKey: "ideal-day",
      fieldKey: "loveLanguage",
      type: "select",
      labelFast: "Love language",
      labelDeep: "Your primary love language",
      labelConversational: "What's your love language?",
      required: false,
      options: [
        { value: "words", label: "Words of affirmation" },
        { value: "acts", label: "Acts of service" },
        { value: "gifts", label: "Receiving gifts" },
        { value: "time", label: "Quality time" },
        { value: "touch", label: "Physical touch" },
        { value: "unsure", label: "Not sure" },
      ],
      order: next(),
      active: true,
    },
    {
      id: "q-education",
      chapterKey: "ideal-day",
      fieldKey: "education",
      type: "select",
      labelFast: "Education",
      labelDeep: "What level of education have you achieved?",
      labelConversational: "What's your education level?",
      required: false,
      options: EDUCATION_LEVELS.map((l) => ({ value: l, label: l })),
      styles: ["deep", "conversational"],
      order: next(),
      active: true,
    },
    {
      id: "q-career",
      chapterKey: "ideal-day",
      fieldKey: "career",
      type: "text",
      labelFast: "What do you do?",
      labelDeep: "What work or calling do you pursue?",
      labelConversational: "What do you do for work?",
      required: false,
      placeholder: "Job title",
      order: next(),
      active: true,
    },
    {
      id: "q-income",
      chapterKey: "ideal-day",
      fieldKey: "incomeRange",
      type: "select",
      labelFast: "Income range (optional)",
      labelDeep: "Income range",
      labelConversational: "Income range (totally optional!)",
      required: false,
      options: INCOME_RANGES.map((r) => ({ value: r, label: r })),
      styles: ["deep", "conversational"],
      order: next(),
      active: true,
    },
    {
      id: "q-zodiac",
      chapterKey: "future-together",
      fieldKey: "zodiacSign",
      type: "select",
      labelFast: "Zodiac",
      labelDeep: "Do you identify with a zodiac sign?",
      labelConversational: "Are you into astrology? What's your sign?",
      required: false,
      options: ZODIAC_SIGNS,
      styles: ["deep", "conversational"],
      order: next(),
      active: true,
    },
    {
      id: "q-birth",
      chapterKey: "future-together",
      fieldKey: "birthDate",
      type: "birthday",
      labelFast: "Birth date",
      labelDeep: "When were you born?",
      labelConversational: "When's your birthday?",
      required: false,
      styles: ["deep", "conversational"],
      order: next(),
      active: true,
    },
  ];
}

/**
 * Maps questionnaire rows to react-hook-form / profile keys. Stored admin JSON sometimes sets
 * `fieldKey` equal to `id` (e.g. "q-gender"), which would register the wrong form key and drop
 * `gender` on save — prefer the canonical default `fieldKey` when the row looks like a slug mistake.
 */
export function formFieldKeyForQuestionnaireItem(
  item: OnboardingQuestionnaireItem,
  defaultById: Map<string, OnboardingQuestionnaireItem>,
): string {
  const base = defaultById.get(item.id);
  const rk = item.fieldKey?.trim();
  if (base) {
    const bk = base.fieldKey;
    if (!rk || rk === item.id || (rk.startsWith("q-") && rk !== bk)) return bk;
  }
  return rk || base?.fieldKey || item.id;
}

export function normalizeOnboardingQuestionnaire(
  items: OnboardingQuestionnaireItem[] | null | undefined,
): OnboardingQuestionnaireItem[] {
  const defaults = getDefaultOnboardingQuestionnaireItems();
  if (!items || items.length === 0) return defaults;
  const byId = new Map(defaults.map((d) => [d.id, d]));
  const merged: OnboardingQuestionnaireItem[] = [];
  const seen = new Set<string>();
  for (const row of items) {
    if (!row?.id) continue;
    const base = byId.get(row.id);
    const candidate: OnboardingQuestionnaireItem = {
      ...(base || row),
      ...row,
      options: row.options?.length ? row.options : base?.options,
    };
    merged.push({
      ...candidate,
      fieldKey: formFieldKeyForQuestionnaireItem(candidate, byId),
    });
    seen.add(row.id);
  }
  for (const d of defaults) {
    if (!seen.has(d.id)) merged.push(d);
  }
  return merged.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}

function labelForStyle(item: OnboardingQuestionnaireItem, style: JourneyStyle): string {
  if (style === "fast") return item.labelFast;
  if (style === "deep") return item.labelDeep;
  return item.labelConversational;
}

function itemAppliesToStyle(item: OnboardingQuestionnaireItem, style: JourneyStyle): boolean {
  if (!item.active) return false;
  if (item.styles && item.styles.length > 0 && !item.styles.includes(style)) return false;
  return true;
}

export function buildChaptersRecord(
  style: JourneyStyle,
  items: OnboardingQuestionnaireItem[],
): Record<ChapterKey, BuiltChapter> {
  const chapters: ChapterKey[] = [
    "who-are-you",
    "marriage-essentials",
    "what-matters",
    "how-connect",
    "ideal-day",
    "future-together",
  ];
  const result = {} as Record<ChapterKey, BuiltChapter>;
  const defaultById = new Map(getDefaultOnboardingQuestionnaireItems().map((d) => [d.id, d]));
  for (const ck of chapters) {
    const meta = CHAPTER_META[ck][style];
    const qs = items
      .filter((i) => i.chapterKey === ck && itemAppliesToStyle(i, style))
      .sort((a, b) => a.order - b.order)
      .map((i) => ({
        id: formFieldKeyForQuestionnaireItem(i, defaultById),
        label: labelForStyle(i, style),
        type: i.type,
        required: i.required,
        placeholder: i.placeholder,
        options: i.options,
        max: i.max,
        minLength: i.minLength,
      }));
    result[ck] = {
      title: meta.title,
      subtitle: meta.subtitle,
      description: meta.description,
      questions: qs,
    };
  }
  return result;
}

export type IntroChapterType =
  | "intro"
  | "who-are-you"
  | "marriage-essentials"
  | "what-matters"
  | "how-connect"
  | "ideal-day"
  | "future-together"
  | "photos"
  | "blueprint";

export function getOnboardingChapterOrder(style: JourneyStyle): IntroChapterType[] {
  if (style === "fast") {
    return [
      "who-are-you",
      "marriage-essentials",
      "what-matters",
      "how-connect",
      "ideal-day",
      "photos",
      "blueprint",
    ];
  }
  return [
    "who-are-you",
    "marriage-essentials",
    "what-matters",
    "how-connect",
    "ideal-day",
    "future-together",
    "photos",
    "blueprint",
  ];
}
