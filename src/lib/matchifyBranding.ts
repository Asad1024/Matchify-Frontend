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

export const MATCHIFY_PINK_HEX = "#f94272";

/** AI Matchmaker: one curated match every this many hours (Time Left / demo product logic). */
export const AI_MATCH_COOLDOWN_MS = 48 * 60 * 60 * 1000;

export const STORAGE_LAST_AI_MATCH_AT = "matchify_last_ai_match_at";
