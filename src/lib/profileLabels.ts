/** Labels for love-language enum values stored on the user profile */
export function labelLoveLanguage(raw: string | null | undefined): string {
  if (!raw) return "";
  const map: Record<string, string> = {
    words: "Words of Affirmation",
    acts: "Acts of Service",
    gifts: "Receiving Gifts",
    time: "Quality Time",
    touch: "Physical Touch",
  };
  return map[raw.toLowerCase()] || raw;
}

export function membershipBadgeLabel(
  createdAt: string | Date | null | undefined,
): string {
  if (!createdAt) return "Member";
  const t = new Date(createdAt).getTime();
  if (Number.isNaN(t)) return "Member";
  const days = (Date.now() - t) / 864e5;
  if (days <= 7) return "Just joined";
  if (days <= 30) return "New here";
  if (days <= 90) return "Recently joined";
  return "Member";
}

/** URLs safe to persist — excludes temporary blob: URLs that break after refresh. */
export function isPersistableProfilePhotoUrl(u: unknown): u is string {
  if (typeof u !== "string") return false;
  const t = u.trim();
  if (!t) return false;
  if (t.startsWith("blob:")) return false;
  if (t.startsWith("data:")) return true;
  if (t.startsWith("/")) return true;
  try {
    const x = new URL(t);
    return x.protocol === "http:" || x.protocol === "https:";
  } catch {
    return false;
  }
}

export function sanitizeProfileGalleryUrls(urls: string[] | null | undefined): string[] {
  if (!Array.isArray(urls)) return [];
  return urls.filter(isPersistableProfilePhotoUrl).slice(0, 4);
}

/** Main photo first, then extras; trims and skips duplicate URLs (order preserved). */
export function buildProfileGalleryUrls(
  mainUrl: string | null | undefined,
  extras: string[] | null | undefined,
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const main = (mainUrl ?? "").trim();
  if (main) {
    seen.add(main);
    out.push(main);
  }
  for (const p of extras ?? []) {
    const t = typeof p === "string" ? p.trim() : "";
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

export function splitLocation(loc: string | null | undefined): {
  city: string;
  country: string;
  line: string;
} {
  if (!loc?.trim()) return { city: "", country: "", line: "" };
  const parts = loc
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    return {
      city: parts[0],
      country: parts.slice(1).join(", "),
      line: loc.trim(),
    };
  }
  return { city: parts[0] || "", country: "", line: parts[0] || "" };
}
