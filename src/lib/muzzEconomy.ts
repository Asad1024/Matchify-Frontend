/** Client-side Muzz-style economy (boosts, compliments, Gold) — demo / product shell until billing exists. */

import { markClientStateDirty } from "@/lib/clientStateSync";

const P = "matchify_muzz_";

export const getBoosts = (): number => {
  const n = parseInt(localStorage.getItem(`${P}boosts`) || "2", 10);
  return Number.isFinite(n) ? n : 2;
};

export const setBoosts = (n: number): void => {
  localStorage.setItem(`${P}boosts`, String(Math.max(0, n)));
  markClientStateDirty();
};

export const getCompliments = (): number => {
  // Unlimited mode removed; compliments are now tied to subscription/limits.
  const n = parseInt(localStorage.getItem(`${P}compliments`) || "2", 10);
  return Number.isFinite(n) ? n : 2;
};

export const setCompliments = (n: number): void => {
  localStorage.setItem(`${P}compliments`, String(Math.max(0, n)));
  markClientStateDirty();
};

export const isGoldMember = (): boolean => localStorage.getItem(`${P}gold`) === "1";

export const setGoldMember = (v: boolean): void => {
  if (v) localStorage.setItem(`${P}gold`, "1");
  else localStorage.removeItem(`${P}gold`);
  markClientStateDirty();
};

export const hasRevealedFilters = (profileUserId: string): boolean =>
  isGoldMember() || localStorage.getItem(`${P}reveal_${profileUserId}`) === "1";

export const revealFiltersFor = (profileUserId: string): void => {
  localStorage.setItem(`${P}reveal_${profileUserId}`, "1");
  markClientStateDirty();
};

const HISTORY_KEY = `${P}explore_history`;

export type HistoryEntry = { id: string; at: string };

export const getExploreHistory = (): HistoryEntry[] => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const j = JSON.parse(raw);
    return Array.isArray(j) ? j : [];
  } catch {
    return [];
  }
};

export const pushExploreHistory = (userId: string): void => {
  const prev = getExploreHistory().filter((e) => e.id !== userId);
  prev.unshift({ id: userId, at: new Date().toISOString() });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(prev.slice(0, 40)));
  markClientStateDirty();
};

export const buyMoreDemo = (kind: "boosts" | "compliments"): void => {
  if (kind === "boosts") setBoosts(getBoosts() + 5);
  else setCompliments(getCompliments() + 5);
};
