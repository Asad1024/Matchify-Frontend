/** Inclusive faith / worldview options — Matchify welcomes all backgrounds (not tied to one religion). */
export const RELIGION_OPTIONS = [
  { value: "islam", label: "Islam" },
  { value: "christianity", label: "Christianity" },
  { value: "judaism", label: "Judaism" },
  { value: "hinduism", label: "Hinduism" },
  { value: "buddhism", label: "Buddhism" },
  { value: "sikhism", label: "Sikhism" },
  { value: "jain", label: "Jainism" },
  { value: "spiritual", label: "Spiritual (not religious)" },
  { value: "atheist_agnostic", label: "Atheist / Agnostic" },
  { value: "other", label: "Other" },
  { value: "prefer_not_say", label: "Prefer not to say" },
] as const;

export type ReligionValue = (typeof RELIGION_OPTIONS)[number]["value"];

export const RELIGION_VALUES = RELIGION_OPTIONS.map((r) => r.value) as unknown as [
  ReligionValue,
  ...ReligionValue[],
];

export const getReligionLabel = (value: string | null | undefined): string => {
  if (!value) return "";
  const found = RELIGION_OPTIONS.find((r) => r.value === value);
  return found?.label ?? value;
};

/** How open the user is when browsing matches & groups (stored on profile). */
export const MEET_PREFERENCE_OPTIONS = [
  {
    value: "same_faith",
    label: "Often people with a similar background",
    description: "We’ll highlight communities and matches that fit",
  },
  {
    value: "open_to_all",
    label: "Open to everyone",
    description: "All backgrounds welcome in your feed",
  },
  {
    value: "prefer_not_say",
    label: "Prefer not to say",
    description: "Neutral recommendations",
  },
] as const;

export type MeetPreferenceValue = (typeof MEET_PREFERENCE_OPTIONS)[number]["value"];
