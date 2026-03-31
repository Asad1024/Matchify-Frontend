import { useMemo, useState, useEffect, useCallback, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useSearchParams } from "wouter";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import Header from "@/components/common/Header";
import BottomNav from "@/components/common/BottomNav";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import SwipeableEventCard from "@/components/events/SwipeableEventCard";
import {
  CheckCircle,
  Compass,
  Filter,
  LayoutGrid,
  Zap,
  CalendarDays,
  Sparkles,
  MapPin,
  Heart,
  Activity,
  History,
  Plus,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentUser } from "@/contexts/UserContext";
import { pushExploreHistory } from "@/lib/muzzEconomy";
import {
  getMarriageComplimented,
  getMarriageFavorites,
  getMarriageLiked,
  getMarriagePassed,
  type DeckEntry,
} from "@/lib/marriageDeckStore";
import { ExploreEventCard } from "@/components/explore/ExploreEventCard";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import FeedFilterPills from "@/components/feed/FeedFilterPills";
import { Calendar } from "@/components/ui/calendar";

type PublicUser = {
  id: string;
  name: string;
  username?: string;
  age?: number | null;
  location?: string | null;
  avatar?: string | null;
  verified?: boolean | null;
  interests?: string[] | null;
  createdAt?: string | null;
  /** Job title (API / mock `career`) */
  career?: string | null;
};

type ApiEvent = {
  id: string;
  title: string;
  description?: string | null;
  date: string;
  time?: string | null;
  location: string;
  type?: string | null;
  image?: string | null;
  price?: string | null;
  capacity?: number;
  attendeesCount?: number;
  hostId?: string | null;
};

function eventSortTimeMs(e: ApiEvent): number {
  const t = new Date(e.date);
  return Number.isNaN(t.getTime()) ? 0 : t.getTime();
}

function sameCalendarDay(selected: Date, eventDateStr: string): boolean {
  const t = new Date(eventDateStr);
  if (Number.isNaN(t.getTime())) return false;
  return (
    selected.getFullYear() === t.getFullYear() &&
    selected.getMonth() === t.getMonth() &&
    selected.getDate() === t.getDate()
  );
}

function formatDayPill(d: Date): { dow: string; md: string } {
  const dow = d.toLocaleString(undefined, { weekday: "short" });
  const md = d.toLocaleString(undefined, { month: "short", day: "numeric" });
  return { dow, md };
}

function ExploreEventSwipeStack({
  events,
  onOpenEvent,
  onNeedMore,
}: {
  events: ApiEvent[];
  onOpenEvent: (id: string) => void;
  onNeedMore?: () => void;
}) {
  const [i, setI] = useState(0);
  useEffect(() => {
    // Keep position when list grows (e.g. "Load more").
    setI((cur) => {
      const max = Math.max(0, events.length - 1);
      return Math.min(cur, max);
    });
  }, [events.length]);

  const current = events[i];
  if (!current) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/90 px-4 py-10 text-center text-sm text-gray-600">
        {events.length === 0
          ? "No events match your filters."
          : "You’ve seen all loaded events. Tap Load more to continue."}
        {events.length > 0 && onNeedMore ? (
          <div className="mt-3 flex justify-center">
            <Button type="button" variant="outline" className="rounded-full" onClick={onNeedMore}>
              Load more
            </Button>
          </div>
        ) : null}
      </div>
    );
  }

  const attendees = current.attendeesCount ?? 0;
  const capacity = current.capacity ?? 50;

  return (
    <div className="relative mx-auto flex min-h-[26rem] w-full max-w-sm justify-center pb-2 pt-1">
      <SwipeableEventCard
        key={current.id}
        id={current.id}
        title={current.title}
        description={current.description?.trim() || "Tap through to see details and join."}
        date={current.date}
        time={current.time?.trim() || "—"}
        location={current.location}
        type={(current.type || "offline").toLowerCase() === "online" ? "online" : "offline"}
        attendees={attendees}
        capacity={capacity}
        price={current.price || undefined}
        image={current.image || undefined}
        onSwipeLeft={() => setI((n) => n + 1)}
        onSwipeRight={() => {
          onOpenEvent(current.id);
          setI((n) => n + 1);
        }}
      />
    </div>
  );
}

function cityCountryFromLocation(location: string | null | undefined): { city: string; country: string } {
  if (!location?.trim()) return { city: "—", country: "—" };
  const parts = location
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 0) return { city: "—", country: "—" };
  if (parts.length === 1) return { city: parts[0], country: "—" };
  return { city: parts[0], country: parts[parts.length - 1] };
}

function formatCardTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

const exploreSectionTitle = "text-lg font-bold text-gray-900 sm:text-xl";

type LikeReceivedRow = {
  user?: PublicUser | null;
  createdAt?: string;
};

type ProfileLikeReceivedRow = {
  user?: PublicUser | null;
  createdAt?: string | null;
};

/** Two fixed rows; extra cards continue in new columns — horizontal scroll. */
function ExploreTwoRowScroller({
  hint,
  itemCount,
  children,
}: {
  hint: string;
  itemCount: number;
  children: ReactNode;
}) {
  const rows = itemCount > 1 ? 2 : 1;
  return (
    <div className="relative -mx-1">
      <p className="mb-1.5 text-[11px] font-medium text-stone-500">{hint}</p>
      <div
        className="explore-h-scroll overflow-x-auto pb-2 pt-0.5 scroll-smooth"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div
          className={cn(
            "grid w-max grid-flow-col gap-2 px-1",
            rows === 2 ? "grid-rows-2" : "grid-rows-1",
          )}
          style={{
            gridAutoColumns: "min(calc((min(100vw, 32rem) - 2rem) / 2), 11rem)",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/** One fixed row — horizontal scroll (same sizing as two-row scroller). */
function ExploreOneRowScroller({ hint, children }: { hint: string; children: ReactNode }) {
  return (
    <div className="relative -mx-1">
      <p className="mb-1.5 text-[11px] font-medium text-stone-500">{hint}</p>
      <div
        className="explore-h-scroll overflow-x-auto pb-2 pt-0.5 scroll-smooth"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div
          className="grid w-max grid-flow-col grid-rows-1 gap-2 px-1"
          style={{
            gridAutoColumns: "min(calc((min(100vw, 32rem) - 2rem) / 2), 11rem)",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function ExploreCardCell({ children }: { children: ReactNode }) {
  return <div className="min-h-0 min-w-0">{children}</div>;
}

function ExplorePeopleCard({
  user,
  topBadge,
  topBadgeClassName,
  onOpen,
  timeLabel,
  sharpImage,
  cornerIcon,
}: {
  user: PublicUser;
  topBadge?: string;
  /** Tailwind classes for the badge pill (defaults to primary). */
  topBadgeClassName?: string;
  onOpen: (id: string) => void;
  /** When set (e.g. history deck `at`), shown as “Time”; otherwise uses `user.createdAt`. */
  timeLabel?: string;
  /** My history tab: show avatar crisp (no background blur). */
  sharpImage?: boolean;
  /** Optional icon shown in top-right (e.g. a Heart for "Liked"). */
  cornerIcon?: "heart" | "online";
}) {
  const ageLine =
    user.age != null && Number.isFinite(Number(user.age)) ? String(user.age) : "—";
  const time = timeLabel ?? formatCardTime(user.createdAt);
  const locationLabel = user.location?.trim() || "—";

  return (
    <button
      type="button"
      onClick={() => {
        pushExploreHistory(user.id);
        onOpen(user.id);
      }}
      className="group relative aspect-[3/4] w-full min-h-0 overflow-hidden rounded-[24px] border border-[#F0F0F0] bg-gray-100 text-left transition-transform hover:scale-[1.01]"
    >
      {user.avatar ? (
        sharpImage ? (
          <img
            src={user.avatar}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div
            className="absolute inset-0 scale-110 bg-cover bg-center opacity-90 blur-md"
            style={{ backgroundImage: `url(${user.avatar})` }}
          />
        )
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-stone-300 to-stone-200" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10" />

      {/* Top badges */}
      <div className="absolute left-3 right-3 top-3 flex items-start justify-between gap-2">
        {topBadge ? (
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide",
              "border border-white/35 bg-white/20 text-white shadow-sm backdrop-blur-md",
              topBadgeClassName ?? "",
            )}
          >
            {topBadge}
          </span>
        ) : (
          <span />
        )}

        {cornerIcon === "online" ? (
          <span
            className="relative inline-flex h-3 w-3 items-center justify-center"
            aria-label="Online"
            title="Online"
          >
            <span className="absolute inline-flex h-3 w-3 rounded-full bg-emerald-400 opacity-50 blur-[2px]" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-white/50" />
          </span>
        ) : cornerIcon === "heart" ? (
          <span
            className="inline-flex items-center justify-center rounded-full border border-white/35 bg-white/20 p-2 text-white backdrop-blur-md"
            aria-label="Liked"
            title="Liked"
          >
            <Heart className="h-4 w-4 fill-white text-white" strokeWidth={1.75} aria-hidden />
          </span>
        ) : null}
      </div>

      {/* Bottom overlay */}
      <div className="absolute bottom-0 left-0 right-0 space-y-1 px-3 pb-3 pt-14">
        <div className="flex items-center gap-2 min-w-0">
          <span className="truncate text-[15px] font-extrabold leading-tight text-white tracking-[0.2px]">
            {user.name}
            {ageLine !== "—" ? `, ${ageLine}` : ""}
          </span>
          {user.verified ? <CheckCircle className="h-4 w-4 shrink-0 text-sky-200" strokeWidth={1.75} /> : null}
        </div>
        <div className="flex items-center gap-1.5 text-[12px] font-medium text-white/85">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-white/80" strokeWidth={1.75} aria-hidden />
          <span className="truncate">{locationLabel}</span>
        </div>
        <div className="text-[10px] font-semibold text-white/65 tabular-nums">{time}</div>
      </div>
    </button>
  );
}

export default function ExploreMuzz() {
  const [, setLocation] = useLocation();
  const [searchParams] = useSearchParams();
  const { logout } = useAuth();
  const { userId } = useCurrentUser();
  const prefersReducedMotion = useReducedMotion();
  const [tab, setTab] = useState<"foryou" | "events" | "history">("foryou");
  const [historySub, setHistorySub] = useState<
    "favorite" | "liked" | "passed" | "complimented"
  >("favorite");
  const [deckEpoch, setDeckEpoch] = useState(0);
  const [eventsView, setEventsView] = useState<"all" | "swipe" | "calendar">("all");
  const [eventsAllSub, setEventsAllSub] = useState<"all" | "upcoming" | "mine" | "past">("all");
  const [eventTypeFilter, setEventTypeFilter] = useState<"all" | "online" | "offline">("all");
  const [calendarDay, setCalendarDay] = useState<Date | undefined>(undefined);
  const [eventsShownAll, setEventsShownAll] = useState(4);
  const [eventsShownSwipe, setEventsShownSwipe] = useState(2);

  const bumpDeckEpoch = useCallback(() => setDeckEpoch((e) => e + 1), []);

  const tabQuery = searchParams.get("tab");
  useEffect(() => {
    if (tabQuery === "events" || tabQuery === "history" || tabQuery === "foryou") {
      setTab(tabQuery);
    }
  }, [tabQuery]);

  useEffect(() => {
    const onDeck = () => bumpDeckEpoch();
    window.addEventListener("matchify-marriage-deck-updated", onDeck);
    return () => window.removeEventListener("matchify-marriage-deck-updated", onDeck);
  }, [bumpDeckEpoch]);

  const { data: users = [] } = useQuery<PublicUser[]>({
    queryKey: ["/api/users"],
    enabled: tab === "history",
  });

  const { data: likesReceivedRaw = [] } = useQuery<LikeReceivedRow[]>({
    queryKey: [`/api/users/${userId}/likes-received`],
    enabled: !!userId && tab === "foryou",
  });

  const { data: profileLikesRaw = [] } = useQuery<ProfileLikeReceivedRow[]>({
    queryKey: [`/api/users/${userId}/profile-likes-received`],
    enabled: !!userId && tab === "foryou",
  });

  const { data: visitorsRaw = [] } = useQuery<Array<{ user: PublicUser; viewedAt: string }>>({
    queryKey: [`/api/users/${userId}/profile-visitors`],
    enabled: !!userId && tab === "foryou",
  });

  const { data: recentJoiners = [] } = useQuery<PublicUser[]>({
    queryKey: ["/api/users/recent-joiners"],
    enabled: !!userId && tab === "foryou",
  });

  const { data: events = [] } = useQuery<ApiEvent[]>({
    queryKey: ["/api/events"],
  });

  const list = Array.isArray(users) ? users : [];

  /** Real likers: users who liked your posts (deduped, most recent like first). */
  const postLikers = useMemo(() => {
    const byId = new Map<string, { user: PublicUser; at: string }>();
    for (const row of likesReceivedRaw) {
      const u = row.user;
      if (!u?.id) continue;
      const at = row.createdAt ? String(row.createdAt) : "";
      const prev = byId.get(u.id);
      if (!prev || at > prev.at) byId.set(u.id, { user: u, at });
    }
    return Array.from(byId.values())
      .sort((a, b) => b.at.localeCompare(a.at))
      .map((x) => x.user);
  }, [likesReceivedRaw]);

  /** People who liked your profile (deduped, most recent like first). */
  const profileLikers = useMemo(() => {
    const byId = new Map<string, { user: PublicUser; at: string }>();
    for (const row of profileLikesRaw) {
      const u = row.user;
      if (!u?.id) continue;
      const at = row.createdAt ? String(row.createdAt) : "";
      const prev = byId.get(u.id);
      if (!prev || at > prev.at) byId.set(u.id, { user: u, at });
    }
    return Array.from(byId.values())
      .sort((a, b) => b.at.localeCompare(a.at))
      .map((x) => x.user);
  }, [profileLikesRaw]);

  const visitorsSorted = useMemo(
    () => [...visitorsRaw].filter((r) => r.user?.id),
    [visitorsRaw],
  );

  const marriageHistoryEntries = useMemo((): DeckEntry[] => {
    void deckEpoch;
    switch (historySub) {
      case "favorite":
        return getMarriageFavorites();
      case "liked":
        return getMarriageLiked();
      case "passed":
        return getMarriagePassed();
      case "complimented":
        return getMarriageComplimented();
      default:
        return [];
    }
  }, [historySub, deckEpoch]);

  const userNameById = useMemo(() => {
    const m = new Map<string, PublicUser>();
    for (const u of list) {
      m.set(u.id, u);
    }
    return m;
  }, [list]);

  const historyBadge = useMemo(() => {
    switch (historySub) {
      case "passed":
        return { label: "Passed", className: "bg-black text-white" };
      case "liked":
        return { label: "Liked", className: "bg-red-600 text-white" };
      case "favorite":
        return { label: "Favorite", className: "bg-amber-500 text-white" };
      case "complimented":
        return { label: "Complimented", className: "bg-primary text-white" };
      default:
        return { label: "Saved", className: "bg-gray-800 text-white" };
    }
  }, [historySub]);

  const safeEvents = Array.isArray(events) ? events : [];

  const filteredEvents = useMemo(() => {
    let list = [...safeEvents];
    if (eventTypeFilter === "online") {
      list = list.filter((e) => (e.type || "").toLowerCase() === "online");
    } else if (eventTypeFilter === "offline") {
      list = list.filter((e) => (e.type || "").toLowerCase() !== "online");
    }
    // Default ordering (newest first).
    list.sort((a, b) => eventSortTimeMs(b) - eventSortTimeMs(a));
    return list;
  }, [safeEvents, eventTypeFilter]);

  useEffect(() => {
    // Reset paging when filters/view changes.
    setEventsShownAll(4);
    setEventsShownSwipe(2);
    setEventsAllSub("all");
  }, [eventTypeFilter, eventsView]);

  const scopedEvents = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const isPast = (e: ApiEvent) => {
      const d = new Date(e.date);
      if (Number.isNaN(d.getTime())) return false;
      d.setHours(0, 0, 0, 0);
      return d.getTime() < now.getTime();
    };

    if (eventsAllSub === "all") return filteredEvents;
    if (eventsAllSub === "mine") {
      return filteredEvents.filter((e) => !!userId && String(e.hostId || "") === String(userId));
    }
    if (eventsAllSub === "past") {
      return filteredEvents.filter((e) => isPast(e));
    }
    // upcoming (default): include unknown dates so user doesn't lose events to parsing.
    return filteredEvents.filter((e) => {
      const d = new Date(e.date);
      if (Number.isNaN(d.getTime())) return true;
      d.setHours(0, 0, 0, 0);
      return d.getTime() >= now.getTime();
    });
  }, [filteredEvents, eventsAllSub, userId]);

  const eventsForCalendarDay = useMemo(() => {
    if (!calendarDay) return [];
    return scopedEvents.filter((e) => sameCalendarDay(calendarDay, e.date));
  }, [scopedEvents, calendarDay]);

  const eventDaysSet = useMemo(() => {
    const set = new Set<string>();
    for (const e of scopedEvents) {
      const d = new Date(e.date);
      if (Number.isNaN(d.getTime())) continue;
      set.add(d.toDateString());
    }
    return set;
  }, [scopedEvents]);

  const openProfile = (id: string) => setLocation(`/profile/${id}`);

  const tabMotion = prefersReducedMotion
    ? { initial: false, animate: {}, exit: {}, transition: { duration: 0 } }
    : {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -6 },
        transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const },
      };

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-28">
      <Header
        showSearch={false}
        title="Discover"
        titleClassName="!text-2xl sm:!text-[1.75rem] !leading-tight"
        unreadNotifications={0}
        onNotifications={() => setLocation("/notifications")}
        onCreate={() => setLocation("/community")}
        onLogout={logout}
      />

      <div className="mx-auto max-w-lg px-3 pt-2">
        <div className="flex items-stretch gap-2">
          <LayoutGroup id="explore-tabs">
            <div className="flex-1 rounded-[24px] border border-[#F0F0F0] bg-white/70 p-1 shadow-[0_4px_20px_rgba(0,0,0,0.05)] backdrop-blur-md">
              <div className="flex w-full items-stretch gap-0.5">
                {(
                  [
                    ["foryou", "For you", Compass],
                    ["events", "Events", CalendarDays],
                    ["history", "My history", History],
                  ] as const
                ).map(([id, label, Icon]) => {
                  const active = tab === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setTab(id)}
                      className={cn(
                        "relative flex-1 rounded-[20px] px-2.5 py-2.5 text-[12px] font-bold transition sm:text-[13px]",
                        active ? "text-white" : "text-slate-500 hover:text-slate-800",
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      <span className="flex items-center justify-center gap-1.5">
                        <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                        <span className="leading-tight">{label}</span>
                      </span>
                      {active ? (
                        <motion.span
                          layoutId="explore-tab-bg"
                          className="absolute inset-0 -z-10 rounded-[20px] bg-[#722F37] shadow-[0_10px_30px_-18px_rgba(114,47,55,0.45)]"
                          transition={{ type: "spring", stiffness: 380, damping: 32 }}
                        />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          </LayoutGroup>

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-[46px] w-[46px] shrink-0 rounded-[18px] border-[#F0F0F0] bg-white/80 shadow-[0_4px_20px_rgba(0,0,0,0.05)] backdrop-blur-md hover:bg-white"
            onClick={() => setLocation("/directory")}
            aria-label="Discover"
          >
            <Sparkles className="h-5 w-5 text-[#722F37]" strokeWidth={1.75} aria-hidden />
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {tab === "foryou" && (
            <motion.div
              key="foryou"
              className="space-y-8 pt-5"
              {...tabMotion}
            >
              <section>
                <div className="mb-1 flex flex-wrap items-center gap-2.5">
                  <h2 className={exploreSectionTitle}>Liked your profile</h2>
                  <span
                    className="inline-grid h-8 min-w-8 shrink-0 place-items-center rounded-full border border-[#e8d5c8] bg-[#f5ebe3] px-2 text-sm font-black tabular-nums text-stone-800 shadow-sm"
                    aria-label={`${profileLikers.length} people`}
                  >
                    {profileLikers.length}
                  </span>
                </div>
                <p className="mb-3 text-xs text-gray-500">
                  People who tapped Like on your profile.
                </p>
                {profileLikers.length === 0 ? (
                  <div className="rounded-[24px] border border-[#F0F0F0] bg-white/80 px-4 py-8 text-center shadow-[0_4px_20px_rgba(0,0,0,0.05)] backdrop-blur-md">
                    <Activity className="mx-auto h-6 w-6 text-slate-400" strokeWidth={1.75} aria-hidden />
                    <p className="mt-2 text-sm font-semibold text-slate-500">
                      No profile likes yet.
                    </p>
                  </div>
                ) : (
                  <ExploreOneRowScroller hint="Scroll sideways for more.">
                    {profileLikers.map((u) => (
                      <ExploreCardCell key={u.id}>
                        <ExplorePeopleCard user={u} topBadge="Liked" onOpen={openProfile} />
                      </ExploreCardCell>
                    ))}
                  </ExploreOneRowScroller>
                )}
              </section>

              <section>
                <div className="mb-1 flex flex-wrap items-center gap-2.5">
                  <h2 className={exploreSectionTitle}>Liked your posts</h2>
                  <span
                    className="inline-grid h-8 min-w-8 shrink-0 place-items-center rounded-full border border-[#e8d5c8] bg-[#f5ebe3] px-2 text-sm font-black tabular-nums text-stone-800 shadow-sm"
                    aria-label={`${postLikers.length} people`}
                  >
                    {postLikers.length}
                  </span>
                </div>
                <p className="mb-3 text-xs text-gray-500">
                  Only real activity: people who liked something you posted in the feed.
                </p>
                {postLikers.length === 0 ? (
                  <div className="rounded-[24px] border border-[#F0F0F0] bg-white/80 px-4 py-8 text-center shadow-[0_4px_20px_rgba(0,0,0,0.05)] backdrop-blur-md">
                    <Activity className="mx-auto h-6 w-6 text-slate-400" strokeWidth={1.75} aria-hidden />
                    <p className="mt-2 text-sm font-semibold text-slate-500">
                      No likes yet. Keep sharing to get noticed!
                    </p>
                  </div>
                ) : (
                  <ExploreOneRowScroller hint="Scroll sideways for more.">
                    {postLikers.map((u) => (
                      <ExploreCardCell key={u.id}>
                        <ExplorePeopleCard user={u} topBadge="Liked" onOpen={openProfile} />
                      </ExploreCardCell>
                    ))}
                  </ExploreOneRowScroller>
                )}
              </section>

              <section>
                <h2 className={`mb-1 ${exploreSectionTitle}`}>Visited your profile</h2>
                <p className="mb-3 text-xs text-gray-500">
                  Only people who opened your profile while signed in (not guesses or demos).
                </p>
                {visitorsSorted.length === 0 ? (
                  <div className="rounded-[24px] border border-[#F0F0F0] bg-white/80 px-4 py-8 text-center shadow-[0_4px_20px_rgba(0,0,0,0.05)] backdrop-blur-md">
                    <Compass className="mx-auto h-6 w-6 text-slate-400" strokeWidth={1.75} aria-hidden />
                    <p className="mt-2 text-sm font-semibold text-slate-500">No profile visits yet.</p>
                  </div>
                ) : (
                  <ExploreOneRowScroller hint="Scroll sideways for more visitors.">
                    {visitorsSorted.map((r) => (
                      <ExploreCardCell key={r.user.id}>
                        <ExplorePeopleCard
                          user={r.user}
                          topBadge="Visited"
                          timeLabel={formatCardTime(r.viewedAt)}
                          onOpen={openProfile}
                        />
                      </ExploreCardCell>
                    ))}
                  </ExploreOneRowScroller>
                )}
              </section>

              <section>
                <h2 className={`mb-1 ${exploreSectionTitle}`}>Just joined</h2>
                <p className="mb-3 text-xs text-gray-500 sm:text-sm">
                  Newest members on Matchify (real accounts by signup date).
                </p>
                {recentJoiners.length === 0 ? (
                  <div className="rounded-[24px] border border-[#F0F0F0] bg-white/80 px-4 py-8 text-center shadow-[0_4px_20px_rgba(0,0,0,0.05)] backdrop-blur-md">
                    <Sparkles className="mx-auto h-6 w-6 text-slate-400" strokeWidth={1.75} aria-hidden />
                    <p className="mt-2 text-sm font-semibold text-slate-500">No new members to show yet.</p>
                  </div>
                ) : (
                  <ExploreTwoRowScroller hint="Two rows · scroll sideways for more new members." itemCount={recentJoiners.length}>
                    {recentJoiners.map((u) => (
                      <ExploreCardCell key={u.id}>
                        <ExplorePeopleCard
                          user={u}
                          topBadge="New"
                          cornerIcon="online"
                          onOpen={openProfile}
                        />
                      </ExploreCardCell>
                    ))}
                  </ExploreTwoRowScroller>
                )}
              </section>
            </motion.div>
          )}

          {tab === "events" && (
            <motion.div key="events" className="space-y-4 pt-5" {...tabMotion}>
              <div className="grid grid-cols-3 gap-2">
                <Select
                  value={eventTypeFilter}
                  onValueChange={(v) => setEventTypeFilter(v as "all" | "online" | "offline")}
                >
                  <SelectTrigger className="h-11 rounded-2xl border-[#F0F0F0] bg-white/90 text-left font-semibold text-slate-800 shadow-sm">
                    <Filter className="mr-2 h-4 w-4 shrink-0 text-slate-500" strokeWidth={1.75} />
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="offline">In person</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={eventsAllSub}
                  onValueChange={(v) => setEventsAllSub(v as "all" | "upcoming" | "mine" | "past")}
                >
                  <SelectTrigger className="h-11 rounded-2xl border-[#F0F0F0] bg-white/90 text-left font-semibold text-slate-800 shadow-sm">
                    <SelectValue placeholder="All Events" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    <SelectItem value="past">Past Events</SelectItem>
                    <SelectItem value="mine">My Events</SelectItem>
                    <SelectItem value="upcoming">Upcoming Events</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  className="h-11 w-full rounded-2xl bg-[#722F37] px-2 text-[12px] font-semibold text-white shadow-[0_10px_30px_-18px_rgba(114,47,55,0.50)] hover:bg-[#652a31]"
                  onClick={() => setLocation("/events/create?from=explore")}
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
                    Host Event
                  </span>
                </Button>
              </div>

              <div className="rounded-[999px] border border-[#F0F0F0] bg-[#F1F2F4] p-1 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
                <div className="grid grid-cols-3 gap-0.5">
                  {(
                    [
                      ["all", "Events", LayoutGrid],
                      ["swipe", "Swipe", Zap],
                      ["calendar", "Calendar", CalendarDays],
                    ] as const
                  ).map(([id, label, Icon]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setEventsView(id)}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-full py-2.5 text-[11px] font-bold transition-all",
                        eventsView === id
                          ? "bg-white text-slate-900 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.22)]"
                          : "text-slate-500 hover:text-slate-800",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                      <span className="leading-tight">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {eventsView === "swipe" ? (
                <p className="text-[11px] leading-snug text-gray-500">
                  <span className="font-semibold text-gray-700">Swipe mode:</span> one event at a time.
                  Drag the card left to skip, right to open the event (or use Pass / Interested). Same idea as
                  quick “discovery” apps — fast to scan many events without scrolling a long list.
                </p>
              ) : null}

              {eventsView === "all" ? (
                <>
                  {scopedEvents.length === 0 ? (
                    <p className="text-sm text-gray-500">No events match these filters.</p>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {scopedEvents.slice(0, eventsShownAll).map((e) => (
                          <ExploreEventCard
                            key={e.id}
                            event={{
                              id: e.id,
                              title: e.title,
                              description: e.description,
                              date: e.date,
                              time: e.time ?? undefined,
                              location: e.location,
                              type: e.type ?? undefined,
                              image: e.image ?? undefined,
                              price: e.price ?? undefined,
                            }}
                            onClick={() => setLocation(`/event/${e.id}?from=explore`)}
                          />
                        ))}
                      </div>
                      {eventsShownAll < scopedEvents.length ? (
                        <Button
                          type="button"
                          variant="outline"
                          className="h-10 w-full rounded-full border-[#F0F0F0] bg-white/60 font-semibold text-slate-800 shadow-sm backdrop-blur-md hover:bg-white"
                          onClick={() => setEventsShownAll((n) => n + 4)}
                        >
                          Load more
                        </Button>
                      ) : null}
                    </>
                  )}
                </>
              ) : scopedEvents.length === 0 ? (
                <p className="text-sm text-gray-500">No events match these filters.</p>
              ) : eventsView === "swipe" ? (
                <>
                  <ExploreEventSwipeStack
                    events={scopedEvents.slice(0, eventsShownSwipe)}
                    onOpenEvent={(id) => setLocation(`/event/${id}?from=explore`)}
                  />
                  {eventsShownSwipe < scopedEvents.length ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 w-full rounded-full border-[#F0F0F0] bg-white/60 font-semibold text-slate-800 shadow-sm backdrop-blur-md hover:bg-white"
                      onClick={() => setEventsShownSwipe((n) => n + 2)}
                    >
                      Load more
                    </Button>
                  ) : null}
                </>
              ) : (
                <div className="space-y-4">
                  <div className="w-full rounded-[24px] border border-[#F0F0F0] bg-white/80 shadow-[0_4px_20px_rgba(0,0,0,0.05)] backdrop-blur-md">
                    <Calendar
                      mode="single"
                      selected={calendarDay}
                      onSelect={(d) => setCalendarDay(d ?? undefined)}
                      className="w-full"
                      classNames={{
                        months: "w-full",
                        month: "w-full space-y-3",
                        caption: "flex items-center justify-between px-2 pt-1",
                        caption_label: "text-sm font-extrabold text-slate-900",
                        nav: "flex items-center gap-1",
                        nav_button:
                          "flex h-8 w-8 items-center justify-center rounded-full border border-[#F0F0F0] bg-white p-0 text-slate-700 shadow-sm hover:bg-stone-50",
                        nav_button_previous: "static",
                        nav_button_next: "static",
                        table: "w-full border-collapse",
                        head_row: "grid grid-cols-7",
                        head_cell:
                          "text-muted-foreground rounded-md font-semibold text-[0.8rem] text-center",
                        row: "grid grid-cols-7 mt-2",
                        cell: "p-0 text-center",
                        day: "h-10 w-full rounded-md font-medium hover:bg-muted",
                        day_selected:
                          "bg-[#722F37] text-white hover:bg-[#652a31] hover:text-white focus:bg-[#722F37] focus:text-white",
                      }}
                      modifiers={{
                        hasEvent: (date) => eventDaysSet.has(date.toDateString()),
                      }}
                      modifiersClassNames={{
                        hasEvent: "relative font-bold text-[#722F37]",
                      }}
                    />
                  </div>

                  <p className="text-center text-xs font-medium text-gray-600">
                    {calendarDay ? format(calendarDay, "PPP") : "Pick a day to see events."}
                  </p>

                  <div className="space-y-3">
                    {!calendarDay ? (
                      <p className="text-center text-sm text-gray-500">Choose a day to see what’s coming up.</p>
                    ) : eventsForCalendarDay.length === 0 ? (
                      <p className="text-center text-sm text-gray-500">No events on this date.</p>
                    ) : (
                      <div className="relative">
                        <div className="absolute left-4 top-0 bottom-0 w-px bg-[#E5E7EB]" aria-hidden />
                        <div className="space-y-3">
                          {[...eventsForCalendarDay]
                            .sort((a, b) => (a.time || "").localeCompare(b.time || ""))
                            .map((e) => (
                              <button
                                key={e.id}
                                type="button"
                                onClick={() => setLocation(`/event/${e.id}?from=explore`)}
                                className="group w-full rounded-[24px] border border-[#F0F0F0] bg-white/80 px-4 py-3 text-left shadow-[0_4px_20px_rgba(0,0,0,0.05)] backdrop-blur-md hover:bg-white"
                              >
                                <div className="flex gap-3">
                                  <div className="relative pt-1">
                                    <div className="grid h-8 w-8 place-items-center rounded-full bg-white shadow-sm ring-1 ring-black/[0.04]">
                                      <span className="h-2.5 w-2.5 rounded-full bg-[#722F37]" />
                                    </div>
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#722F37]">
                                      {e.time?.trim() || "Time TBA"}
                                    </p>
                                    <p className="mt-1 font-display text-[16px] font-extrabold leading-tight text-slate-900">
                                      {e.title}
                                    </p>
                                    <p className="mt-1 text-sm text-slate-600">
                                      <span className="font-medium text-slate-700">{e.location}</span>
                                      {e.type ? <span className="text-slate-400"> · </span> : null}
                                      {e.type ? <span className="text-slate-500">{String(e.type).toUpperCase()}</span> : null}
                                    </p>
                                  </div>
                                </div>
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* No footer actions here (kept minimal). */}
            </motion.div>
          )}

          {tab === "history" && (
            <motion.div key="history" className="space-y-3 pt-4" {...tabMotion}>
              <FeedFilterPills
                pills={[
                  { id: "favorite", label: "Favorites" },
                  { id: "liked", label: "Liked" },
                  { id: "passed", label: "Passed" },
                  { id: "complimented", label: "Complimented" },
                ]}
                activeId={historySub}
                onChange={(id) =>
                  setHistorySub(id as "favorite" | "liked" | "passed" | "complimented")
                }
              />
              {marriageHistoryEntries.length === 0 ? (
                <p className="pt-2 text-sm text-gray-500">
                  No one here yet — use the Marriage tab to favorite, like, pass, or send a compliment.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {marriageHistoryEntries.map((h) => {
                    const u = userNameById.get(h.id);
                    const cardUser: PublicUser = {
                      id: h.id,
                      name: u?.name ?? `Profile ${h.id.slice(0, 8)}…`,
                      username: u?.username,
                      age: u?.age ?? null,
                      location: u?.location ?? null,
                      avatar: u?.avatar ?? null,
                      verified: u?.verified ?? null,
                      interests: u?.interests ?? null,
                      career: u?.career ?? null,
                      createdAt: u?.createdAt ?? null,
                    };
                    return (
                      <ExplorePeopleCard
                        key={`${historySub}-${h.id}-${h.at}`}
                        user={cardUser}
                        topBadge={historyBadge.label}
                        topBadgeClassName={historyBadge.className}
                        timeLabel={formatCardTime(h.at)}
                        sharpImage
                        cornerIcon={historySub === "liked" ? "heart" : undefined}
                        onOpen={(id) => setLocation(`/profile/${id}`)}
                      />
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <BottomNav active="explore" onNavigate={() => {}} />
    </div>
  );
}
