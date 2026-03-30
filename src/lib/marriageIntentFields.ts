/** Shared onboarding / profile / admin options — keep labels aligned everywhere. */

export const COMMITMENT_INTENTION_OPTIONS = [
  { value: "figuring_out", label: "Still figuring out what I want" },
  { value: "hookup", label: "Exploring / chatting" },
  { value: "casual", label: "Casual dating" },
  { value: "serious", label: "Serious relationship" },
  { value: "marriage", label: "Marriage-minded" },
  { value: "engaged", label: "Engaged or ceremony planned" },
] as const;

export const MARRIAGE_TIMELINE_OPTIONS = [
  { value: "within_6mo", label: "Within 6 months" },
  { value: "6_12mo", label: "6–12 months" },
  { value: "1_2yr", label: "1–2 years" },
  { value: "2yr_plus", label: "2+ years" },
  { value: "unsure", label: "Not sure yet" },
  { value: "na", label: "Not focused on marriage right now" },
] as const;

/** How they describe moving toward marriage — powers dynamic copy on the intention strip. */
export const MARRIAGE_APPROACH_OPTIONS = [
  { value: "values_first", label: "Character & values come first — then timing" },
  { value: "actively_searching", label: "Actively looking for a spouse" },
  { value: "open_when_right", label: "Open when the right person shows up" },
  { value: "family_community", label: "Family or community introductions matter to me" },
  { value: "events_social", label: "Through events, classes, or wider social circles" },
  { value: "rebuilding", label: "Being thoughtful after a past relationship" },
  { value: "no_rush", label: "Intentionally slow — quality over speed" },
] as const;
