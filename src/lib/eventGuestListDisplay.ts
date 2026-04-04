/**
 * AI events store an inflated `capacity` floor; the real curated roster is AiEventInvite rows + host.
 * Use this for "x/y attending" denominators on cards and detail.
 */
export function eventAttendingDenominator(event: {
  aiGenerated?: boolean;
  aiGuestListCount?: number | null;
  capacity: number;
}): number {
  const fallback = Math.max(1, Math.floor(Number(event.capacity)) || 1);
  if (!event.aiGenerated) return fallback;
  const n = event.aiGuestListCount;
  if (typeof n !== "number" || !Number.isFinite(n) || n < 0) return fallback;
  // Invited candidates + host (host is on the roster and typically RSVPs).
  return Math.max(1, n + 1);
}
