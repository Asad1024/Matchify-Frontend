/** Unsplash portraits (people) — avoids random nature/landscape placeholders */

const STORY_FALLBACKS = [
  "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&h=1200&fit=crop&auto=format&q=80",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&h=1200&fit=crop&auto=format&q=80",
  "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&h=1200&fit=crop&auto=format&q=80",
] as const;

function pickIndex(key: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h + key.charCodeAt(i)) % mod;
  return h;
}

/** When a story has no image URL, show a person-focused slide instead of random scenery */
export function humanStorySlideFallback(key: string): string {
  return STORY_FALLBACKS[pickIndex(key, STORY_FALLBACKS.length)]!;
}

/** Default image when creating a story without upload / URL */
export function defaultNewStoryImage(seed: string): string {
  return STORY_FALLBACKS[pickIndex(seed, STORY_FALLBACKS.length)]!;
}
