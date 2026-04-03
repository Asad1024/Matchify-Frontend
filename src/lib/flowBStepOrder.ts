/**
 * AI Matchmaker Flow B — canonical step order (30 steps per gender).
 *
 * Men and women get DIFFERENT questions:
 *   m_*  = male-specific  (what HE looks for in a woman + lifestyle/self)
 *   f_*  = female-specific (what SHE looks for in a man + lifestyle/self)
 *   sd_* = shared self-discovery (readiness, love language, etc.)
 *   plus kidsQ / timeline / dealbreakers / mustHave (shared)
 */
export const FLOW_B_STEP_COUNT = 30;

/** 15 shared question IDs — appear in both flows unchanged. */
export const SHARED_QUESTION_IDS = [
  "kidsQ",
  "timeline",
  "sd_commitment",
  "sd_love_language",
  "sd_priorities",
  "sd_ready_healed",
  "sd_ready_values",
  "sd_ready_communication",
  "sd_ready_available",
  "sd_ready_respect",
  "sd_ready_accountability",
  "sd_relationship_goal",
  "sd_partner_pace",
  "dealbreakers",
  "mustHave",
] as const;

/** 15 male-only question IDs — about what he wants in a woman + his own lifestyle. */
export const MALE_ONLY_QUESTION_IDS = [
  "m_her_personality",  // personality he finds attractive in a woman
  "m_her_energy",       // energy he wants her to bring
  "m_her_presence",     // presence & vibe (partner)
  "m_her_daily_rhythm", // day-to-day rhythm together
  "m_her_presentation", // style / self-presentation
  "m_her_first_spark",  // what stands out early (non-anatomy)
  "m_her_values",       // values she must have
  "m_her_style",        // her lifestyle vibe
  "m_how_connect",      // couple communication style
  "m_conflict",         // his conflict resolution approach
  "m_future_vision",    // future he wants to build
  "m_his_career",       // his own career approach
  "m_hobbies",          // shared hobbies he cares about
  "m_social_life",      // social life preference
  "m_food",             // food vibe
] as const;

/** 15 female-only question IDs — about what she wants in a man + her own lifestyle. */
export const FEMALE_ONLY_QUESTION_IDS = [
  "f_his_personality",  // personality she finds attractive in a man
  "f_his_energy",       // energy she wants him to have
  "f_his_presence",     // presence & vibe (partner)
  "f_his_daily_rhythm", // day-to-day rhythm together
  "f_his_presentation", // style / self-presentation
  "f_his_first_spark",  // what stands out early (non-anatomy)
  "f_his_values",       // values he must have
  "f_his_provider",     // his provider / support style
  "f_how_connect",      // couple communication style
  "f_conflict",         // how he handles conflict (her framing)
  "f_future_vision",    // future she wants to build
  "f_his_career",       // his career mindset she expects
  "f_hobbies",          // shared hobbies she cares about
  "f_social_life",      // social life preference
  "f_food",             // food vibe
] as const;

/**
 * Male flow: Visual → Energy → Values → Lifestyle → Self → Shared readiness.
 * Total: 15 male-specific + 15 shared = 30.
 */
export const MALE_FLOW_ORDER: readonly string[] = [
  "m_her_personality",
  "m_her_energy",
  "m_her_presence",
  "m_her_daily_rhythm",
  "m_her_presentation",
  "m_her_first_spark",
  "m_her_values",
  "m_her_style",
  "m_how_connect",
  "m_conflict",
  "m_future_vision",
  "m_his_career",
  "m_hobbies",
  "m_social_life",
  "m_food",
  "kidsQ",
  "timeline",
  "sd_commitment",
  "sd_love_language",
  "sd_priorities",
  "sd_ready_healed",
  "sd_ready_values",
  "sd_ready_communication",
  "sd_ready_available",
  "sd_ready_respect",
  "sd_ready_accountability",
  "sd_relationship_goal",
  "sd_partner_pace",
  "dealbreakers",
  "mustHave",
];

/**
 * Female flow: Emotional → Character → Values → Physical → Lifestyle → Shared readiness.
 * Total: 15 female-specific + 15 shared = 30.
 */
export const FEMALE_FLOW_ORDER: readonly string[] = [
  "f_his_personality",
  "f_his_energy",
  "f_his_values",
  "f_how_connect",
  "f_his_career",
  "f_future_vision",
  "f_conflict",
  "f_hobbies",
  "f_social_life",
  "f_food",
  "f_his_presence",
  "f_his_daily_rhythm",
  "f_his_presentation",
  "f_his_first_spark",
  "f_his_provider",
  "kidsQ",
  "timeline",
  "sd_commitment",
  "sd_love_language",
  "sd_priorities",
  "sd_ready_healed",
  "sd_ready_values",
  "sd_ready_communication",
  "sd_ready_available",
  "sd_ready_respect",
  "sd_ready_accountability",
  "sd_relationship_goal",
  "sd_partner_pace",
  "dealbreakers",
  "mustHave",
];
