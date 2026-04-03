/** ~6 months — name/username can only be changed after this window from last change (client-side rule). */

import { markClientStateDirty } from "@/lib/clientStateSync";

const LOCK_MS = 183 * 24 * 60 * 60 * 1000;

function key(userId: string) {
  return `matchify.profileIdentityLock.${userId}`;
}

export type ProfileIdentityLockState = {
  locked: boolean;
  nextChangeAt: Date | null;
  message: string;
};

export function getProfileIdentityLockState(userId: string | null | undefined): ProfileIdentityLockState {
  if (!userId?.trim()) {
    return { locked: false, nextChangeAt: null, message: "" };
  }
  const raw = localStorage.getItem(key(userId));
  if (!raw) {
    return { locked: false, nextChangeAt: null, message: "" };
  }
  const changed = new Date(raw);
  if (Number.isNaN(changed.getTime())) {
    return { locked: false, nextChangeAt: null, message: "" };
  }
  const next = new Date(changed.getTime() + LOCK_MS);
  if (Date.now() >= next.getTime()) {
    return { locked: false, nextChangeAt: null, message: "" };
  }
  return {
    locked: true,
    nextChangeAt: next,
    message: `Name and username can be changed again after ${next.toLocaleDateString(undefined, { dateStyle: "medium" })}.`,
  };
}

export function recordProfileIdentityChange(userId: string) {
  localStorage.setItem(key(userId), new Date().toISOString());
  markClientStateDirty();
}
