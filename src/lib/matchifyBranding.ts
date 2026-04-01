/** Default hosted logo (replace via env or `public/logo.png` + env). */
const MATCHIFY_LOGO_DEFAULT =
  "https://res.cloudinary.com/dlslli4ck/image/upload/v1773830865/logo_zq7maf_1_iyqgps.png";

/**
 * App logo URL (single source — keep in sync with `index.html` favicon if you change brand).
 *
 * - Set `VITE_APP_LOGO_URL` in `.env` / `.env.local` to any URL, e.g. `/logo.png` after adding
 *   `frontend-muzz/public/logo.png`, or a full `https://...` link to your asset.
 */
export const MATCHIFY_LOGO_URL =
  (typeof import.meta !== "undefined" &&
    (import.meta.env.VITE_APP_LOGO_URL as string | undefined)?.trim()) ||
  MATCHIFY_LOGO_DEFAULT;

/** Used if primary `src` fails (e.g. missing `public/logo.png`). */
export const MATCHIFY_LOGO_FALLBACK = MATCHIFY_LOGO_DEFAULT;

/** Primary accent (merlot / wine) — align with `--primary` in `index.css`. */
export const MATCHIFY_PINK_HEX = "#8B2942";

/**
 * AI Matchmaker + Directory boost shared cooldown (ms).
 * - Default: 1 hour. Override with `VITE_AI_MATCH_COOLDOWN_MS` in `.env.local` (e.g. `3600000` for 1 hour).
 */
function readAiMatchCooldownMs(): number {
  const raw =
    typeof import.meta !== "undefined"
      ? (import.meta.env.VITE_AI_MATCH_COOLDOWN_MS as string | undefined)?.trim()
      : undefined;
  if (raw) {
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) return n;
  }
  // Default: 48 hours.
  // Override via `VITE_AI_MATCH_COOLDOWN_MS` in `.env.local`.
  return 48 * 60 * 60 * 1000;
}

export const AI_MATCH_COOLDOWN_MS = readAiMatchCooldownMs();

/** Short phrase for UI, derived from {@link AI_MATCH_COOLDOWN_MS}. */
export function getAiMatchCooldownLabel(): string {
  const ms = AI_MATCH_COOLDOWN_MS;
  if (ms < 60 * 1000) {
    const s = Math.max(1, Math.round(ms / 1000));
    return `${s} second${s === 1 ? "" : "s"}`;
  }
  const mins = Math.round(ms / (60 * 1000));
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"}`;
  const hoursExact = ms / (60 * 60 * 1000);
  if (Number.isInteger(hoursExact) && hoursExact >= 1 && hoursExact <= 168) {
    return `${hoursExact} hour${hoursExact === 1 ? "" : "s"}`;
  }
  const days = Math.round(ms / (24 * 60 * 60 * 1000));
  return `${days} day${days === 1 ? "" : "s"}`;
}
