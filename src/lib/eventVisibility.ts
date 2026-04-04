/**
 * Pending / rejected user-hosted events are only for the host and admins until approved.
 * Approved events are public. Mirrors backend `eventVisibleToCaller` for client-side safety
 * (stale cache, offline mock, etc.).
 */
export function isEventVisibleToViewer(
  event: { status?: unknown; hostId?: unknown },
  viewerId: string | null | undefined,
  isAdmin?: boolean | null,
): boolean {
  const st = String(event.status ?? "pending")
    .trim()
    .toLowerCase();
  if (st === "approved") return true;
  if (isAdmin) return true;
  const hid = String(event.hostId ?? "").trim();
  const vid = String(viewerId ?? "").trim();
  return Boolean(vid && hid && vid === hid);
}

export function filterEventsVisibleToViewer<T extends { status?: unknown; hostId?: unknown }>(
  events: T[],
  viewerId: string | null | undefined,
  isAdmin?: boolean | null,
): T[] {
  return events.filter((e) => isEventVisibleToViewer(e, viewerId, isAdmin));
}
