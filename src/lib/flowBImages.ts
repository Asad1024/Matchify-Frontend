/**
 * Flow B – Actor-based image set. Uses the SAME images as Flow A (AttractionFlow)
 * so both flows share public/attractionFlow/ and show correct celebrity portraits.
 */
import { ATTRACTION_FLOW_MALE, ATTRACTION_FLOW_FEMALE, getFlowBOptionImage } from "@/lib/attractionFlowImages";

export type FlowBOption = { id: string; image: string; label: string; description?: string };
type FlowBOptionNoImage = { id: string; label: string; description?: string };

// Male user flow (selecting female) – use AttractionFlow MALE folder (female celeb images). 5–6 options each.
const M = ATTRACTION_FLOW_MALE;
const FLOW_B_MALE = {
  personality_turn_on: [
    { id: "confident_leader", image: M.looks[0].image, label: "Confident / Leader", description: "Angelina Jolie" },
    { id: "kind_warm", image: M.looks[1].image, label: "Kind / Warm", description: "Anne Hathaway" },
    { id: "playful_fun", image: M.energy[0].image, label: "Playful / Fun", description: "Zendaya" },
    { id: "mysterious_charm", image: M.energy[1].image, label: "Mysterious / Intriguing", description: "Keeps you guessing" },
    { id: "bold_adventurous", image: M.lifestyle[0].image, label: "Bold / Adventurous", description: "Spontaneous and daring" },
    { id: "romantic_soft", image: M.lifestyle[1].image, label: "Romantic / Soft", description: "Warm and loving" },
  ] as FlowBOption[],
  /** Presence & vibe (replaces body/face/eye/lip anatomy questions). */
  attraction_presence: [
    { id: "warm_approachable", image: M.looks[1].image, label: "Warm & approachable", description: "Easy to open up to" },
    { id: "quietly_confident", image: M.looks[0].image, label: "Quietly confident", description: "Steady self-assurance" },
    { id: "playful_expressive", image: M.energy[0].image, label: "Playful & expressive", description: "Fun, animated energy" },
    { id: "calm_grounded", image: M.energy[1].image, label: "Calm & grounded", description: "Centered presence" },
    { id: "direct_honest", image: M.future[0].image, label: "Direct & honest", description: "Says what they mean" },
  ] as FlowBOption[],
  day_to_day_rhythm: [
    { id: "very_active", image: M.lifestyle[0].image, label: "Very active", description: "Always on the move" },
    { id: "moderately_active", image: M.energy[1].image, label: "Moderately active", description: "Balanced movement" },
    { id: "relaxed_homebody", image: M.lifestyle[1].image, label: "Relaxed / homebody", description: "Cozy default" },
    { id: "mix_both", image: M.future[1].image, label: "A mix of both", description: "Depends on the week" },
    { id: "travel_heavy", image: M.future[0].image, label: "Travel-heavy", description: "Often planning trips" },
  ] as FlowBOption[],
  presentation_style: [
    { id: "natural_lowkey", image: M.looks[1].image, label: "Natural & low-key", description: "Minimal fuss" },
    { id: "polished_intentional", image: M.looks[0].image, label: "Polished & intentional", description: "Put-together" },
    { id: "creative_eclectic", image: M.energy[0].image, label: "Creative & eclectic", description: "Unique style" },
    { id: "sporty_practical", image: M.energy[1].image, label: "Sporty & practical", description: "Comfort first" },
    { id: "classic_minimal", image: M.future[0].image, label: "Classic & minimal", description: "Timeless simplicity" },
  ] as FlowBOption[],
  early_connection_focus: [
    { id: "humor_wit", image: M.energy[0].image, label: "Humor & wit", description: "Makes you laugh" },
    { id: "conversation_curiosity", image: M.future[1].image, label: "Conversation & curiosity", description: "Asks great questions" },
    { id: "kindness_others", image: M.looks[1].image, label: "Kindness to others", description: "How they treat people" },
    { id: "reliability_followthrough", image: M.future[0].image, label: "Reliability & follow-through", description: "Does what they say" },
    { id: "ambition_focus", image: M.lifestyle[0].image, label: "Ambition & focus", description: "Clear direction" },
  ] as FlowBOption[],
  energy_vibe: [
    { id: "dominant_powerful", image: M.lifestyle[0].image, label: "Dominant / Powerful", description: "Angelina Jolie" },
    { id: "romantic_soft", image: M.lifestyle[1].image, label: "Romantic / Soft", description: "Blake Lively" },
    { id: "ambitious_driven", image: M.future[0].image, label: "Ambitious / Driven", description: "Gal Gadot" },
    { id: "calm_centered", image: M.energy[1].image, label: "Calm / Centered", description: "Peaceful presence" },
    { id: "playful_light", image: M.looks[1].image, label: "Playful / Light", description: "Fun and easy" },
    { id: "visionary_bold", image: M.future[1].image, label: "Visionary / Bold", description: "Big-picture thinker" },
  ] as FlowBOption[],
};

// Female user flow (selecting male) – use AttractionFlow FEMALE folder (male celeb images). 5–6 options each.
const F = ATTRACTION_FLOW_FEMALE;
const FLOW_B_FEMALE = {
  personality_turn_on: [
    { id: "confident_alpha", image: F.looks[0].image, label: "Confident / Alpha", description: "Henry Cavill" },
    { id: "intelligent_calm", image: F.energy[1].image, label: "Intelligent / Calm", description: "Ryan Gosling" },
    { id: "playful_charismatic", image: F.energy[0].image, label: "Playful / Charismatic", description: "Michael B. Jordan" },
    { id: "protective_caring", image: F.future[0].image, label: "Protective / Caring", description: "Makes you feel safe" },
    { id: "ambitious_driven", image: F.lifestyle[0].image, label: "Ambitious / Driven", description: "Goal-oriented" },
    { id: "humor_warmth", image: F.looks[1].image, label: "Humor / Warmth", description: "Makes you laugh" },
  ] as FlowBOption[],
  attraction_presence: [
    { id: "warm_approachable", image: F.energy[1].image, label: "Warm & approachable", description: "Easy to open up to" },
    { id: "quietly_confident", image: F.looks[0].image, label: "Quietly confident", description: "Steady self-assurance" },
    { id: "playful_expressive", image: F.energy[0].image, label: "Playful & expressive", description: "Fun, animated energy" },
    { id: "calm_grounded", image: F.future[0].image, label: "Calm & grounded", description: "Centered presence" },
    { id: "direct_honest", image: F.future[1].image, label: "Direct & honest", description: "Says what they mean" },
  ] as FlowBOption[],
  day_to_day_rhythm: [
    { id: "very_active", image: F.lifestyle[0].image, label: "Very active", description: "Always on the move" },
    { id: "moderately_active", image: F.energy[0].image, label: "Moderately active", description: "Balanced movement" },
    { id: "relaxed_homebody", image: F.lifestyle[1].image, label: "Relaxed / homebody", description: "Cozy default" },
    { id: "mix_both", image: F.looks[1].image, label: "A mix of both", description: "Depends on the week" },
    { id: "travel_heavy", image: F.future[1].image, label: "Travel-heavy", description: "Often planning trips" },
  ] as FlowBOption[],
  presentation_style: [
    { id: "natural_lowkey", image: F.looks[1].image, label: "Natural & low-key", description: "Minimal fuss" },
    { id: "polished_intentional", image: F.looks[0].image, label: "Polished & intentional", description: "Put-together" },
    { id: "creative_eclectic", image: F.energy[0].image, label: "Creative & eclectic", description: "Unique style" },
    { id: "sporty_practical", image: F.energy[1].image, label: "Sporty & practical", description: "Comfort first" },
    { id: "classic_minimal", image: F.future[0].image, label: "Classic & minimal", description: "Timeless simplicity" },
  ] as FlowBOption[],
  early_connection_focus: [
    { id: "humor_wit", image: F.energy[0].image, label: "Humor & wit", description: "Makes you laugh" },
    { id: "conversation_curiosity", image: F.future[1].image, label: "Conversation & curiosity", description: "Asks great questions" },
    { id: "kindness_others", image: F.energy[1].image, label: "Kindness to others", description: "How they treat people" },
    { id: "reliability_followthrough", image: F.future[0].image, label: "Reliability & follow-through", description: "Does what they say" },
    { id: "ambition_focus", image: F.lifestyle[0].image, label: "Ambition & focus", description: "Clear direction" },
  ] as FlowBOption[],
  energy_vibe: [
    { id: "dominant_leader", image: F.looks[0].image, label: "Dominant Leader", description: "Henry Cavill" },
    { id: "grounded_stable", image: F.future[0].image, label: "Grounded / Stable", description: "John Krasinski" },
    { id: "visionary_ambitious", image: F.future[1].image, label: "Visionary / Ambitious", description: "Robert Downey Jr." },
    { id: "calm_centered", image: F.energy[1].image, label: "Calm / Centered", description: "Peaceful presence" },
    { id: "playful_fun", image: F.energy[0].image, label: "Playful / Fun", description: "Light and fun" },
    { id: "driven_focused", image: F.lifestyle[0].image, label: "Driven / Focused", description: "Ambitious energy" },
  ] as FlowBOption[],
};

const FLOW_B_QUESTION_IDS = [
  "personality_turn_on",
  "attraction_presence",
  "day_to_day_rhythm",
  "presentation_style",
  "early_connection_focus",
  "energy_vibe",
] as const;

export type FlowBImageQuestionId = (typeof FLOW_B_QUESTION_IDS)[number];

export function getFlowBOptions(
  questionId: FlowBImageQuestionId,
  gender: "male" | "female" | null | undefined
): FlowBOption[] {
  const set = gender === "female" ? FLOW_B_FEMALE : FLOW_B_MALE;
  return set[questionId] ?? [];
}

export function isFlowBImageQuestion(questionId: string): questionId is FlowBImageQuestionId {
  return FLOW_B_QUESTION_IDS.includes(questionId as FlowBImageQuestionId);
}

// Section images (S2/S3/S4 from Ideas/Flow B) – same for both genders (live in public/flowB/Section/)
const flowBBase = (typeof import.meta !== "undefined" && import.meta.env?.BASE_URL) ? String(import.meta.env.BASE_URL).replace(/\/$/, "") : "";
const FLOW_B_BASE = flowBBase ? `${flowBBase}/flowB` : "/flowB";
const S = `${FLOW_B_BASE}/Section`;
const FLOW_B_SECTION_OPTIONS: Record<string, FlowBOption[]> = {
  core_values: [
    { id: "career", image: `${S}/core_values/S2_values_career.jpg`, label: "Career", description: "Driven and ambitious" },
    { id: "family", image: `${S}/core_values/S2_values_family.jpg`, label: "Family First", description: "Family is priority" },
    { id: "social", image: `${S}/core_values/S2_values_social.jpg`, label: "Social", description: "Connection and community" },
    { id: "spiritual", image: `${S}/core_values/S2_values_spiritual.jpg`, label: "Spiritual", description: "Meaning and growth" },
  ],
  communication: [
    { id: "deep_talk", image: `${S}/communication/S2_communication_deepTalk.jpg`, label: "Deep conversations", description: "Meaningful connection" },
    { id: "playful", image: `${S}/communication/S2_communication_playful.jpg`, label: "Playful & fun", description: "Light and humorous" },
  ],
  conflict_style: [
    { id: "calm", image: `${S}/conflict_style/S2_conflict_calm.jpg`, label: "Calm", description: "Talk it through" },
    { id: "passionate", image: `${S}/conflict_style/S2_conflict_passionate.jpg`, label: "Passionate", description: "Intense and direct" },
  ],
  lifestyle: [
    { id: "fitness", image: `${S}/lifestyle/S3_lifestyle_fitness.jpg`, label: "Fitness", description: "Staying active" },
    { id: "luxury", image: `${S}/lifestyle/S3_lifestyle_luxury.jpg`, label: "Luxury", description: "Fine experiences" },
    { id: "travel", image: `${S}/lifestyle/S3_lifestyle_travel.jpg`, label: "Travel", description: "Exploring together" },
  ],
  hobbies: [
    { id: "art", image: `${S}/hobbies/S3_hobbies_art.jpg`, label: "Art", description: "Creative expression" },
    { id: "cooking", image: `${S}/hobbies/S3_hobbies_cooking.jpg`, label: "Cooking", description: "Food and home" },
    { id: "music", image: `${S}/hobbies/S3_hobbies_music.jpg`, label: "Music", description: "Sound and rhythm" },
  ],
  sociallife: [
    { id: "cozy", image: `${S}/sociallife/S3_social_cozy.jpg`, label: "Cozy", description: "Quiet time in" },
    { id: "party", image: `${S}/sociallife/S3_social_party.jpg`, label: "Party", description: "Night out" },
  ],
  food: [
    { id: "fine_dining", image: `${S}/food/S3_food_fineDining.jpg`, label: "Fine dining", description: "Upscale experiences" },
    { id: "street_food", image: `${S}/food/S3_food_streetFood.jpg`, label: "Street food", description: "Casual and varied" },
  ],
  career: [
    { id: "corporate", image: `${S}/career/S4_career_corporate.jpg`, label: "Corporate", description: "Stable and structured" },
    { id: "entrepreneur", image: `${S}/career/S4_career_entrepreneur.jpg`, label: "Entrepreneur", description: "Building my own" },
  ],
  future: [
    { id: "family", image: `${S}/future/S4_future_family.jpg`, label: "Family", description: "Marriage and kids" },
    { id: "travel", image: `${S}/future/S4_future_travel.jpg`, label: "Travel", description: "See the world" },
  ],
};

// Extra options for section questions (images from AttractionFlow pool so we have 6–8 choices per question)
const FLOW_B_SECTION_EXTRAS: Record<string, FlowBOptionNoImage[]> = {
  core_values: [
    { id: "honesty", label: "Honesty & Transparency", description: "Truth in all interactions" },
    { id: "growth", label: "Personal Growth", description: "Continuous learning" },
    { id: "adventure", label: "Adventure & Freedom", description: "Exploring new experiences" },
    { id: "stability", label: "Stability & Security", description: "Consistency and safety" },
  ],
  communication: [
    { id: "texter", label: "Constant texting", description: "Always in touch" },
    { id: "caller", label: "Voice calls", description: "Hear each other" },
    { id: "inperson", label: "Face-to-face time", description: "Quality time together" },
    { id: "memes", label: "Memes & humor", description: "Light and fun" },
  ],
  conflict_style: [
    { id: "discuss", label: "Talk it through", description: "Resolve immediately" },
    { id: "space", label: "Need space", description: "Process then talk" },
  ],
  lifestyle: [
    { id: "cozy", label: "Cozy nights in", description: "Home together" },
    { id: "social", label: "Social events", description: "Out and about" },
    { id: "nature", label: "Outdoor adventures", description: "Nature and activity" },
    { id: "creative", label: "Arts & culture", description: "Museums and shows" },
    { id: "work", label: "Career-focused", description: "Ambitious lifestyle" },
  ],
  hobbies: [
    { id: "reading", label: "Reading", description: "Books and stories" },
    { id: "gaming", label: "Gaming", description: "Games and esports" },
    { id: "sports", label: "Sports", description: "Active and competitive" },
    { id: "movies", label: "Movies & TV", description: "Screen time together" },
    { id: "outdoors", label: "Outdoors", description: "Hiking and nature" },
  ],
  sociallife: [
    { id: "dinner", label: "Dinner dates", description: "Food and conversation" },
    { id: "netflix", label: "Netflix & chill", description: "Low-key nights" },
    { id: "adventure", label: "Day trips", description: "Explore together" },
    { id: "brunch", label: "Brunch", description: "Weekend vibes" },
  ],
  food: [
    { id: "foodie", label: "Foodie", description: "Try everything" },
    { id: "healthy", label: "Health-focused", description: "Clean eating" },
    { id: "adventurous", label: "Try anything", description: "No limits" },
    { id: "home", label: "Home cooking", description: "Cook together" },
  ],
  career: [
    { id: "ambitious", label: "Highly ambitious", description: "Climb the ladder" },
    { id: "stable", label: "Stable and secure", description: "Steady path" },
    { id: "creative", label: "Creative career", description: "Arts or innovation" },
    { id: "flexible", label: "Work-life balance", description: "Flexibility first" },
  ],
  future: [
    { id: "marriage", label: "Marriage", description: "Long-term commitment" },
    { id: "kids", label: "Kids", description: "Family plans" },
    { id: "career_growth", label: "Career growth", description: "Professional focus" },
    { id: "peace", label: "Simple and content", description: "Quiet happiness" },
  ],
};

const FLOW_B_SECTION_QUESTION_IDS = [
  "core_values",
  "communication",
  "conflict_style",
  "lifestyle",
  "hobbies",
  "sociallife",
  "food",
  "career",
  "future",
] as const;

export type FlowBSectionQuestionId = (typeof FLOW_B_SECTION_QUESTION_IDS)[number];

export function getFlowBSectionOptions(
  questionId: string,
  gender?: "male" | "female" | null
): FlowBOption[] {
  const section = FLOW_B_SECTION_OPTIONS[questionId] ?? [];
  const extras = FLOW_B_SECTION_EXTRAS[questionId] ?? [];
  if (!gender || extras.length === 0) return section;
  const withImages = extras.map((opt, i) => ({
    ...opt,
    image: getFlowBOptionImage(section.length + i, gender),
  }));
  return [...section, ...withImages];
}

export function isFlowBSectionQuestion(questionId: string): questionId is FlowBSectionQuestionId {
  return FLOW_B_SECTION_QUESTION_IDS.includes(questionId as FlowBSectionQuestionId);
}
