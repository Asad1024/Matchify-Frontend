/** Shared option lists for onboarding + profile edit + display labels */

export const ETHNICITY_OPTIONS = [
  { value: "asian", label: "Asian" },
  { value: "black_african", label: "Black / African descent" },
  { value: "hispanic_latino", label: "Hispanic / Latino" },
  { value: "middle_eastern_north_african", label: "Middle Eastern / North African" },
  { value: "white_european", label: "White / European" },
  { value: "mixed_multiple", label: "Mixed / multiple heritages" },
  { value: "indigenous", label: "Indigenous / Native" },
  { value: "pacific_islander", label: "Pacific Islander" },
  { value: "other", label: "Other" },
  { value: "prefer_not_say", label: "Prefer not to say" },
] as const;

export const SMOKING_OPTIONS = [
  { value: "never", label: "No, never" },
  { value: "occasionally", label: "Occasionally" },
  { value: "regularly", label: "Yes, regularly" },
  { value: "quitting", label: "Trying to quit" },
  { value: "prefer_not_say", label: "Prefer not to say" },
] as const;

export const ALCOHOL_OPTIONS = [
  { value: "never", label: "Never" },
  { value: "socially", label: "Socially only" },
  { value: "occasionally", label: "Occasionally" },
  { value: "regularly", label: "Regularly" },
  { value: "prefer_not_say", label: "Prefer not to say" },
] as const;

function labelFromOptions(
  value: string | null | undefined,
  options: readonly { value: string; label: string }[],
): string {
  if (!value) return "";
  const hit = options.find((o) => o.value === value);
  return hit?.label || value.replace(/_/g, " ");
}

export function labelEthnicity(value: string | null | undefined): string {
  return labelFromOptions(value, ETHNICITY_OPTIONS);
}

export function labelSmoking(value: string | null | undefined): string {
  return labelFromOptions(value, SMOKING_OPTIONS);
}

export function labelAlcohol(value: string | null | undefined): string {
  return labelFromOptions(value, ALCOHOL_OPTIONS);
}
