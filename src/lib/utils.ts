import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** For sorting notifications: API often returns ISO strings; marriage merge may use Date. */
export function notificationCreatedAtMs(createdAt: unknown): number {
  if (createdAt == null) return 0
  if (createdAt instanceof Date) {
    const t = createdAt.getTime()
    return Number.isFinite(t) ? t : 0
  }
  if (typeof createdAt === "string" || typeof createdAt === "number") {
    const t = new Date(createdAt).getTime()
    return Number.isFinite(t) ? t : 0
  }
  return 0
}
