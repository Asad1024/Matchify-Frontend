import { useMemo, useState, useEffect, useCallback } from "react";
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
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import SwipeableEventCard from "@/components/events/SwipeableEventCard";
import {
  SlidersHorizontal,
  CheckCircle,
  Compass,
  Filter,
  LayoutGrid,
  Zap,
  CalendarDays,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentUser } from "@/contexts/UserContext";
import { MuzzEconomyPill } from "@/components/muzz/MuzzEconomyPill";
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

function ExploreEventSwipeStack({
  events,
  onOpenEvent,
}: {
  events: ApiEvent[];
  onOpenEvent: (id: string) => void;
}) {
  const [i, setI] = useState(0);
  useEffect(() => {
    setI(0);
  }, [events]);

  const current = events[i];
  if (!current) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/90 px-4 py-10 text-center text-sm text-gray-600">
        {events.length === 0
          ? "No events match your filters."
          : "You’ve seen all events in this stack. Switch to All Events or adjust filters."}
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

function sortKeyForId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return h;
}

const exploreSectionTitle = "text-lg font-bold text-gray-900 sm:text-xl";

function ExplorePeopleCard({
  user,
  topBadge,
  topBadgeClassName,
  onOpen,
  timeLabel,
  sharpImage,
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
}) {
  const { city, country } = cityCountryFromLocation(user.location);
  const ageLine =
    user.age != null && Number.isFinite(Number(user.age)) ? String(user.age) : "—";
  const job = user.career?.trim() || "—";
  const time = timeLabel ?? formatCardTime(user.createdAt);

  return (
    <button
      type="button"
      onClick={() => {
        pushExploreHistory(user.id);
        onOpen(user.id);
      }}
      className="group relative aspect-[3/4] w-full min-h-0 overflow-hidden rounded-2xl border border-gray-100 bg-gray-100 text-left transition-transform hover:scale-[1.01]"
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
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/15" />
      {topBadge ? (
        <span
          className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${
            topBadgeClassName ?? "bg-primary"
          }`}
        >
          {topBadge}
        </span>
      ) : null}
      <div className="absolute bottom-0 left-0 right-0 space-y-0.5 bg-gradient-to-t from-black/95 via-black/80 to-transparent px-2 pb-2 pt-8">
        <div className="flex items-center gap-1 min-w-0">
          <span className="truncate text-[11px] font-bold leading-tight text-white">{user.name}</span>
          {user.verified ? <CheckCircle className="h-3 w-3 shrink-0 text-sky-300" /> : null}
        </div>
        <dl className="grid grid-cols-[max-content_1fr] gap-x-1.5 gap-y-0.5 text-[9px] leading-snug text-white/95">
          <dt className="font-semibold text-white/65">Age</dt>
          <dd className="truncate font-medium">{ageLine}</dd>
          <dt className="font-semibold text-white/65">City</dt>
          <dd className="truncate font-medium">{city}</dd>
          <dt className="font-semibold text-white/65">Country</dt>
          <dd className="truncate font-medium">{country}</dd>
          <dt className="font-semibold text-white/65">Job</dt>
          <dd className="truncate font-medium">{job}</dd>
          <dt className="font-semibold text-white/65">Time</dt>
          <dd className="truncate font-medium tabular-nums">{time}</dd>
        </dl>
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
  const [eventTypeFilter, setEventTypeFilter] = useState<"all" | "online" | "offline">("all");
  const [eventSort, setEventSort] = useState<"newest" | "oldest" | "title">("newest");
  const [calendarDay, setCalendarDay] = useState<Date | undefined>(undefined);

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
  });

  const { data: events = [] } = useQuery<ApiEvent[]>({
    queryKey: ["/api/events"],
  });

  const list = Array.isArray(users) ? users : [];
  const others = useMemo(() => list.filter((u) => u.id !== userId), [list, userId]);

  /** Who liked you — stable order (name), cap 12 */
  const likedMe = useMemo(() => {
    return [...others].sort((a, b) => (a.name || "").localeCompare(b.name || "")).slice(0, 12);
  }, [others]);

  const likedIds = useMemo(() => new Set(likedMe.map((u) => u.id)), [likedMe]);

  /** Visited you — different pool from liked me */
  const visitedYou = useMemo(() => {
    return others
      .filter((u) => !likedIds.has(u.id))
      .sort((a, b) => sortKeyForId(`${a.id}:visit`) - sortKeyForId(`${b.id}:visit`))
      .slice(0, 8);
  }, [others, likedIds]);

  /** Just joined — prefer recent createdAt, else deterministic fallback */
  const justJoined = useMemo(() => {
    const scored = others.map((u) => {
      const raw = u.createdAt;
      const t = raw ? new Date(raw).getTime() : 0;
      return { u, t };
    });
    scored.sort((a, b) => {
      if (b.t !== a.t) return b.t - a.t;
      return sortKeyForId(b.u.id) - sortKeyForId(a.u.id);
    });
    return scored.slice(0, 18).map((x) => x.u);
  }, [others]);

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
    if (eventSort === "newest") {
      list.sort((a, b) => eventSortTimeMs(b) - eventSortTimeMs(a));
    } else if (eventSort === "oldest") {
      list.sort((a, b) => eventSortTimeMs(a) - eventSortTimeMs(b));
    } else {
      list.sort((a, b) => (a.title || "").localeCompare(b.title || "", undefined, { sensitivity: "base" }));
    }
    return list;
  }, [safeEvents, eventTypeFilter, eventSort]);

  const eventsForCalendarDay = useMemo(() => {
    if (!calendarDay) return [];
    return filteredEvents.filter((e) => sameCalendarDay(calendarDay, e.date));
  }, [filteredEvents, calendarDay]);

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
    <div className="min-h-screen bg-white pb-28">
      <Header
        showSearch={false}
        title="Explore"
        titleClassName="!text-2xl sm:!text-[1.75rem] !leading-tight"
        unreadNotifications={0}
        onNotifications={() => setLocation("/notifications")}
        onCreate={() => setLocation("/community")}
        onLogout={logout}
        rightAccessory={<MuzzEconomyPill onClick={() => setLocation("/subscriptions")} />}
      />

      <div className="mx-auto max-w-lg px-3 pt-2">
        <Button
          type="button"
          className="mb-3 h-12 w-full gap-2 rounded-2xl bg-primary text-base font-bold text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90"
          onClick={() => setLocation("/directory")}
        >
          <SlidersHorizontal className="h-5 w-5" strokeWidth={2} />
          Discover
        </Button>

        <LayoutGroup id="explore-tabs">
          <div className="relative flex border-b border-gray-200">
            {(
              [
                ["foryou", "For you"],
                ["events", "Events"],
                ["history", "My history"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`relative flex-1 py-3 text-[15px] font-bold transition-colors sm:text-base ${
                  tab === id ? "text-gray-900" : "text-gray-400"
                }`}
              >
                {label}
                {tab === id ? (
                  <motion.span
                    layoutId="explore-tab-underline"
                    className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-gray-900"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                ) : null}
              </button>
            ))}
          </div>
        </LayoutGroup>

        <AnimatePresence mode="wait">
          {tab === "foryou" && (
            <motion.div
              key="foryou"
              className="space-y-8 pt-5"
              {...tabMotion}
            >
              <section>
                <div className="mb-1 flex flex-wrap items-center gap-2.5">
                  <h2 className={exploreSectionTitle}>All Other like</h2>
                  <span
                    className="inline-grid h-8 min-w-8 shrink-0 place-items-center rounded-full border border-[#e8d5c8] bg-[#f5ebe3] px-2 text-sm font-black tabular-nums text-stone-800 shadow-sm"
                    aria-label={`${likedMe.length} likes`}
                  >
                    {likedMe.length}
                  </span>
                </div>
                <p className="mb-3 text-xs text-gray-500">People who liked you — open a profile to connect.</p>
                <div className="grid grid-cols-2 gap-2">
                  {likedMe.map((u) => (
                    <ExplorePeopleCard
                      key={u.id}
                      user={u}
                      topBadge="Liked you"
                      onOpen={openProfile}
                    />
                  ))}
                </div>
              </section>

              <section>
                <h2 className={`mb-1 ${exploreSectionTitle}`}>Visited you</h2>
                <p className="mb-3 text-xs text-gray-500">Recently viewed your profile.</p>
                {visitedYou.length === 0 ? (
                  <p className="text-sm text-gray-400">No visitors to show yet.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {visitedYou.map((u) => (
                      <ExplorePeopleCard
                        key={u.id}
                        user={u}
                        topBadge="Visited you"
                        onOpen={openProfile}
                      />
                    ))}
                  </div>
                )}
              </section>

              <section>
                <h2 className={`mb-1 ${exploreSectionTitle}`}>Just joined</h2>
                <p className="mb-3 text-xs text-gray-500 sm:text-sm">
                  Swipe sideways — same cards as above; scrollbar is hidden.
                </p>
                <div
                  className="-mx-1 overflow-x-auto overflow-y-hidden pb-2 pt-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                  style={{ WebkitOverflowScrolling: "touch" }}
                >
                  <div className="flex w-max gap-2 px-1">
                    {justJoined.map((u) => (
                      <div
                        key={u.id}
                        className="shrink-0"
                        style={{
                          width: "calc((min(100vw, 32rem) - 1.875rem) / 2)",
                          maxWidth: "15rem",
                        }}
                      >
                        <ExplorePeopleCard
                          user={u}
                          topBadge="Just joined"
                          onOpen={openProfile}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </motion.div>
          )}

          {tab === "events" && (
            <motion.div key="events" className="space-y-4 pt-5" {...tabMotion}>
              <div className="flex items-start gap-3 rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.06] to-transparent px-4 py-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15">
                  <Compass className="h-5 w-5 text-primary" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900">Events near you</p>
                  <p className="mt-0.5 text-xs text-gray-600">
                    Filter by type, sort, then browse as a grid, swipe stack, or calendar.
                  </p>
                </div>
              </div>

              <div>
                <span className="inline-flex rounded-full bg-[#802B33] px-4 py-2 text-sm font-bold text-white shadow-sm">
                  All Events
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Select
                  value={eventTypeFilter}
                  onValueChange={(v) => setEventTypeFilter(v as "all" | "online" | "offline")}
                >
                  <SelectTrigger className="h-11 rounded-xl border-stone-200 bg-white text-left font-semibold text-gray-800 shadow-sm">
                    <Filter className="mr-2 h-4 w-4 shrink-0 text-gray-500" strokeWidth={2} />
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="offline">In person</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={eventSort}
                  onValueChange={(v) => setEventSort(v as "newest" | "oldest" | "title")}
                >
                  <SelectTrigger className="h-11 rounded-xl border-stone-200 bg-white text-left font-semibold text-gray-800 shadow-sm">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="oldest">Oldest</SelectItem>
                    <SelectItem value="title">Title (A–Z)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-2xl bg-stone-100/95 p-1 shadow-inner">
                <div className="grid grid-cols-3 gap-0.5">
                  {(
                    [
                      ["all", "All Events", LayoutGrid],
                      ["swipe", "Swipe", Zap],
                      ["calendar", "Calendar", CalendarDays],
                    ] as const
                  ).map(([id, label, Icon]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setEventsView(id)}
                      className={cn(
                        "flex flex-col items-center justify-center gap-1 rounded-xl py-2.5 text-[10px] font-bold transition-all sm:flex-row sm:text-[11px]",
                        eventsView === id
                          ? "bg-white text-gray-900 shadow-md shadow-black/10"
                          : "text-gray-500 hover:text-gray-800",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
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

              {filteredEvents.length === 0 ? (
                <p className="text-sm text-gray-500">No events match these filters.</p>
              ) : eventsView === "all" ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {filteredEvents.map((e) => (
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
              ) : eventsView === "swipe" ? (
                <ExploreEventSwipeStack
                  events={filteredEvents}
                  onOpenEvent={(id) => setLocation(`/event/${id}?from=explore`)}
                />
              ) : (
                <div className="space-y-4">
                  <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
                    <Calendar
                      mode="single"
                      selected={calendarDay}
                      onSelect={setCalendarDay}
                      className="mx-auto w-full max-w-[340px]"
                    />
                  </div>
                  <p className="text-center text-xs font-medium text-gray-600">
                    {calendarDay
                      ? format(calendarDay, "PPP")
                      : "Tap a date to list events on that day"}
                  </p>
                  <div className="flex flex-col gap-3">
                    {!calendarDay ? (
                      <p className="text-center text-sm text-gray-500">
                        Choose a date on the calendar to see events happening that day.
                      </p>
                    ) : eventsForCalendarDay.length === 0 ? (
                      <p className="text-center text-sm text-gray-500">No events on this date.</p>
                    ) : (
                      eventsForCalendarDay.map((e) => (
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
                      ))
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2 pt-1">
                <Button
                  className="h-11 w-full rounded-xl font-bold"
                  onClick={() => setLocation("/events?from=explore")}
                >
                  Browse all events
                </Button>
                <Button
                  variant="outline"
                  className="h-11 w-full rounded-xl font-semibold"
                  onClick={() => setLocation("/events/create?from=explore")}
                >
                  Host an event
                </Button>
              </div>
            </motion.div>
          )}

          {tab === "history" && (
            <motion.div key="history" className="space-y-3 pt-4" {...tabMotion}>
              <div className="grid w-full grid-cols-4 gap-1.5 pb-1">
                {(
                  [
                    ["favorite", "Favorites"],
                    ["liked", "Liked"],
                    ["passed", "Passed"],
                    ["complimented", "Complimented"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setHistorySub(id)}
                    className={`rounded-full px-2 py-2 text-[11px] font-bold transition-colors ${
                      historySub === id
                        ? "border border-primary bg-primary text-white"
                        : "border border-gray-200 bg-white text-gray-600"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
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
