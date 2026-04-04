import { useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useCurrentUser } from "@/contexts/UserContext";
import { buildApiUrl, getAuthHeaders } from "@/services/api";
import { filterEventsVisibleToViewer } from "@/lib/eventVisibility";

type RsvpRow = { eventId: string };
type EventRow = { id: string; matchRevealTime?: string | null; status?: string | null; hostId?: string | null };

const CHECK_EVERY_MS = 2000;
const REDIRECT_WINDOW_MS = 18_000; // keep in sync with match reveal countdown (~15s + buffer)
const SESSION_KEY = "matchify_last_reveal_redirect";

export default function EventRevealWatcher() {
  const { userId } = useCurrentUser();
  const [location, setLocation] = useLocation();
  const lastRedirectRef = useRef<{ eventId: string; at: number } | null>(null);

  const { data: rsvps = [] } = useQuery<RsvpRow[]>({
    queryKey: ["/api/users", userId, "rsvps"],
    enabled: !!userId,
    refetchInterval: CHECK_EVERY_MS,
    queryFn: async () => {
      const url = buildApiUrl(`/api/users/${userId}/rsvps`);
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) return [];
      const j = await res.json();
      return Array.isArray(j) ? (j as RsvpRow[]) : [];
    },
  });

  const rsvpEventIds = useMemo(() => {
    const ids: string[] = [];
    for (const r of Array.isArray(rsvps) ? rsvps : []) {
      if (!r?.eventId) continue;
      const id = String(r.eventId);
      if (!ids.includes(id)) ids.push(id);
    }
    return ids;
  }, [rsvps]);

  const { data: me } = useQuery<{ isAdmin?: boolean }>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });

  const { data: eventsRaw = [] } = useQuery<EventRow[]>({
    queryKey: ["/api/events"],
    enabled: !!userId,
    refetchInterval: CHECK_EVERY_MS,
    queryFn: async () => {
      const url = buildApiUrl("/api/events");
      const res = await fetch(url, {
        credentials: "include",
        headers: getAuthHeaders(false),
      });
      if (!res.ok) return [];
      const j = await res.json();
      return Array.isArray(j) ? (j as EventRow[]) : [];
    },
  });

  const events = useMemo(
    () => filterEventsVisibleToViewer(eventsRaw, userId, !!(me as { isAdmin?: boolean })?.isAdmin),
    [eventsRaw, userId, me],
  );

  useEffect(() => {
    if (!userId) return;
    if (!Array.isArray(events) || events.length === 0) return;
    if (rsvpEventIds.length === 0) return;

    const now = Date.now();
    const onEventPage = location.startsWith("/event/");

    let best: { id: string; revealAt: number } | null = null;
    for (const e of events) {
      if (!e?.id || !rsvpEventIds.includes(String(e.id))) continue;
      const t = e.matchRevealTime ? Date.parse(String(e.matchRevealTime)) : NaN;
      if (!Number.isFinite(t)) continue;
      const msLeft = t - now;
      if (msLeft <= 0 || msLeft > REDIRECT_WINDOW_MS) continue;
      if (!best || t < best.revealAt) best = { id: String(e.id), revealAt: t };
    }
    if (!best) return;

    // Avoid re-redirect loops.
    if (onEventPage && location.includes(best.id)) return;

    // Throttle redirects (memory + session storage).
    const mem = lastRedirectRef.current;
    if (mem && mem.eventId === best.id && now - mem.at < 20_000) return;
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { eventId?: string; at?: number };
        if (parsed?.eventId === best.id && typeof parsed.at === "number" && now - parsed.at < 20_000) {
          return;
        }
      }
    } catch {
      /* ignore */
    }

    lastRedirectRef.current = { eventId: best.id, at: now };
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ eventId: best.id, at: now }));
    } catch {
      /* ignore */
    }

    setLocation(`/event/${encodeURIComponent(best.id)}?from=reveal`);
  }, [userId, events, rsvpEventIds, location, setLocation]);

  return null;
}

