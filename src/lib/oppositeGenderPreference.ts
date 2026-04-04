/** Normalize gender strings from profile/API. */
export function normGender(v: unknown): string {
  return String(v ?? "").trim().toLowerCase();
}

/**
 * Dating-style preference: male → show female, female → show male.
 * Returns null if viewer gender is unknown / other — caller should not filter.
 */
export function desiredOppositeGender(viewerGender: unknown): "male" | "female" | null {
  const g = normGender(viewerGender);
  if (g === "male" || g === "man" || g === "m") return "female";
  if (g === "female" || g === "woman" || g === "f") return "male";
  return null;
}

/**
 * Keep only rows whose `gender` matches the viewer's opposite.
 * If viewer gender is unknown, returns `rows` unchanged.
 * If `fallbackWhenEmpty` is true and the filtered list is empty, returns `rows` (lenient deck).
 */
export function filterToOppositeGender<T extends { gender?: string | null | undefined }>(
  rows: T[],
  viewerGender: unknown,
  fallbackWhenEmpty: boolean,
): T[] {
  const desired = desiredOppositeGender(viewerGender);
  if (!desired) return rows;
  const filtered = rows.filter((u) => normGender(u.gender) === desired);
  if (filtered.length === 0 && fallbackWhenEmpty) return rows;
  return filtered;
}
