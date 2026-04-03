/** Synced with Menu → Marriage / Social — affects Explore ordering & copy */

import { markClientStateDirty } from "@/lib/clientStateSync";

export const EXPLORE_MODE_KEY = "matchify_explore_mode";

export type ExploreMode = "marriage" | "social";

export const getExploreMode = (): ExploreMode => {
  try {
    return localStorage.getItem(EXPLORE_MODE_KEY) === "social" ? "social" : "marriage";
  } catch {
    return "marriage";
  }
};

export const setExploreModePersisted = (mode: ExploreMode): void => {
  try {
    localStorage.setItem(EXPLORE_MODE_KEY, mode);
    markClientStateDirty();
    window.dispatchEvent(new Event("matchify-explore-mode"));
  } catch {
    /* ignore */
  }
};
