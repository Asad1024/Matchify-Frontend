import { useMemo, useState, useEffect, useCallback, type ReactNode } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { useLocation, useSearchParams } from "wouter";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import Header from "@/components/common/Header";
import BottomNav from "@/components/common/BottomNav";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Compass,
  Sparkles,
  MapPin,
  Heart,
  Activity,
  History,
  GraduationCap,
} from "lucide-react";
import { VerifiedTick } from "@/components/common/VerifiedTick";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentUser } from "@/contexts/UserContext";
import { pushExploreHistory } from "@/lib/muzzEconomy";
import {
  getMarriageFavorites,
  getMarriageLiked,
  getMarriagePassed,
  type DeckEntry,
} from "@/lib/marriageDeckStore";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import FeedFilterPills from "@/components/feed/FeedFilterPills";
import { filterToOppositeGender } from "@/lib/oppositeGenderPreference";
import { buildApiUrl, getAuthHeaders } from "@/services/api";

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
  gender?: string | null;
  /** Job title (API / mock `career`) */
  career?: string | null;
};

function formatCardTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

const exploreSectionTitle = "text-lg font-bold text-foreground sm:text-xl";

/**
 * Longer retention keeps Activity (“For you” / Coaching / History) payloads warm between visits.
 */
const EXPLORE_QUERY_GC_MS = 1000 * 60 * 60;

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
      className="group relative aspect-[3/4] w-full min-h-0 overflow-hidden rounded-[24px] border bg-muted text-left"
      style={{ borderColor: "hsl(var(--surface-border))" }}
    >
      {user.avatar ? (
        <img
          src={user.avatar}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          fetchPriority="low"
          sizes="(max-width: 32rem) 50vw, 11rem"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-stone-300 to-stone-200" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10" />

      {/* Top badges */}
      <div className="absolute left-3 right-3 top-3 flex items-start justify-between gap-2">
        {topBadge ? (
          <span
            className={cn(
              "matchify-pill-active px-2.5 py-1 text-[10px] font-semibold shadow-sm backdrop-blur-lg",
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
            className="matchify-pill-active inline-flex items-center justify-center p-2 shadow-sm backdrop-blur-lg"
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
          <span className="truncate text-[15px] font-semibold leading-tight text-white tracking-[0.2px]">
            {user.name}
            {ageLine !== "—" ? `, ${ageLine}` : ""}
          </span>
          {user.verified ? <VerifiedTick size="md" className="translate-y-[0.5px]" /> : null}
        </div>
        <div className="flex items-center gap-1.5 text-[12px] font-medium text-white/85">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-white/80" strokeWidth={1.75} aria-hidden />
          <span className="truncate">{locationLabel}</span>
        </div>
        <div className="text-[10px] font-medium text-white/65 tabular-nums">{time}</div>
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
  const [tab, setTab] = useState<"foryou" | "coaching" | "history">("foryou");
  const [historySub, setHistorySub] = useState<"favorite" | "liked" | "passed">("favorite");
  const [deckEpoch, setDeckEpoch] = useState(0);

  const bumpDeckEpoch = useCallback(() => setDeckEpoch((e) => e + 1), []);

  const tabQuery = searchParams.get("tab");
  useEffect(() => {
    if (tabQuery === "history" || tabQuery === "foryou") {
      setTab(tabQuery);
    }
    if (tabQuery === "coaching") setTab("coaching");
  }, [tabQuery]);

  useEffect(() => {
    const onDeck = () => bumpDeckEpoch();
    window.addEventListener("matchify-marriage-deck-updated", onDeck);
    return () => window.removeEventListener("matchify-marriage-deck-updated", onDeck);
  }, [bumpDeckEpoch]);

  const { data: users = [] } = useQuery<PublicUser[]>({
    queryKey: ["/api/users"],
    enabled: tab === "history",
    gcTime: EXPLORE_QUERY_GC_MS,
  });

  const { data: likesReceivedRaw = [] } = useQuery<LikeReceivedRow[]>({
    queryKey: [`/api/users/${userId}/likes-received`],
    enabled: !!userId && tab === "foryou",
    gcTime: EXPLORE_QUERY_GC_MS,
  });

  const { data: profileLikesRaw = [] } = useQuery<ProfileLikeReceivedRow[]>({
    queryKey: [`/api/users/${userId}/profile-likes-received`],
    enabled: !!userId && tab === "foryou",
    gcTime: EXPLORE_QUERY_GC_MS,
  });

  const { data: visitorsRaw = [] } = useQuery<Array<{ user: PublicUser; viewedAt: string }>>({
    queryKey: [`/api/users/${userId}/profile-visitors`],
    enabled: !!userId && tab === "foryou",
    gcTime: EXPLORE_QUERY_GC_MS,
  });

  const { data: recentJoiners = [] } = useQuery<PublicUser[]>({
    queryKey: ["/api/users/recent-joiners"],
    enabled: !!userId && tab === "foryou",
    gcTime: EXPLORE_QUERY_GC_MS,
  });

  const { data: viewerProfile } = useQuery<{ gender?: string | null; isAdmin?: boolean }>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId && tab === "foryou",
    gcTime: EXPLORE_QUERY_GC_MS,
  });

  const recentJoinersForYou = useMemo(() => {
    const g =
      viewerProfile?.gender ??
      (viewerProfile as { profile?: { gender?: string } } | undefined)?.profile?.gender;
    return filterToOppositeGender(recentJoiners, g, false);
  }, [recentJoiners, viewerProfile]);

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

  const historyUserIdsMissingFromList = useMemo(() => {
    if (tab !== "history") return [];
    const ids = marriageHistoryEntries.map((h) => h.id).filter((id) => !userNameById.has(id));
    return Array.from(new Set(ids));
  }, [tab, marriageHistoryEntries, userNameById]);

  const historyUserQueries = useQueries({
    queries: historyUserIdsMissingFromList.map((id) => ({
      queryKey: ["/api/users", id],
      enabled: tab === "history" && Boolean(id),
      staleTime: 60_000,
      queryFn: async () => {
        const res = await fetch(buildApiUrl(`/api/users/${id}`), {
          credentials: "include",
          headers: { ...getAuthHeaders(false) },
        });
        if (!res.ok) return null;
        return (await res.json()) as PublicUser;
      },
    })),
  });

  const historyPeopleById = useMemo(() => {
    const m = new Map(userNameById);
    historyUserIdsMissingFromList.forEach((id, i) => {
      const data = historyUserQueries[i]?.data;
      if (data && typeof data.id === "string") m.set(id, data);
    });
    return m;
  }, [userNameById, historyUserIdsMissingFromList, historyUserQueries]);

  const historyBadge = useMemo(() => {
    switch (historySub) {
      case "passed":
        return { label: "Passed", className: "bg-black text-white" };
      case "liked":
        return { label: "Liked", className: "bg-red-600 text-white" };
      case "favorite":
        return { label: "Favorite", className: "bg-amber-500 text-white" };
      default:
        return { label: "Saved", className: "bg-gray-800 text-white" };
    }
  }, [historySub]);

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
    <div className="min-h-screen bg-[hsl(var(--surface-2))] pb-28">
      <Header
        showSearch={false}
        title="Activity"
        subtitle="Your updates, coaching, and match history"
        unreadNotifications={0}
        onNotifications={() => setLocation("/notifications")}
        onLogout={logout}
      />

      <div className="mx-auto max-w-lg px-3 pt-2">
        <LayoutGroup id="explore-tabs">
          <div className="matchify-surface p-1">
            <div className="flex w-full items-stretch gap-0.5">
              {(
                [
                  ["foryou", "For you", Compass],
                  ["coaching", "Coaching", GraduationCap],
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
                      "relative flex-1 rounded-[20px] px-2 py-2.5 text-[12px] font-medium transition-colors sm:text-[13px]",
                        active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
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
                        className="absolute inset-0 -z-10 rounded-[20px] bg-primary shadow-sm"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
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
                  <h2 className={exploreSectionTitle}>Liked your profile</h2>
                  <span
                    className="inline-grid h-8 min-w-8 shrink-0 place-items-center rounded-full border border-border/70 bg-card/60 px-2 text-sm font-semibold tabular-nums text-foreground shadow-2xs"
                    aria-label={`${profileLikers.length} people`}
                  >
                    {profileLikers.length}
                  </span>
                </div>
                <p className="mb-3 text-xs text-muted-foreground">
                  People who tapped Like on your profile.
                </p>
                {profileLikers.length === 0 ? (
                  <div className="rounded-[24px] border border-border bg-card/90 px-4 py-8 text-center shadow-sm backdrop-blur-md">
                    <Activity className="mx-auto h-6 w-6 text-muted-foreground" strokeWidth={1.75} aria-hidden />
                    <p className="mt-2 text-sm font-semibold text-muted-foreground">
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
                    className="inline-grid h-8 min-w-8 shrink-0 place-items-center rounded-full border border-border/70 bg-card/60 px-2 text-sm font-semibold tabular-nums text-foreground shadow-2xs"
                    aria-label={`${postLikers.length} people`}
                  >
                    {postLikers.length}
                  </span>
                </div>
                <p className="mb-3 text-xs text-muted-foreground">
                  Only real activity: people who liked something you posted in the feed.
                </p>
                {postLikers.length === 0 ? (
                  <div className="rounded-[24px] border border-border bg-card/90 px-4 py-8 text-center shadow-sm backdrop-blur-md">
                    <Activity className="mx-auto h-6 w-6 text-muted-foreground" strokeWidth={1.75} aria-hidden />
                    <p className="mt-2 text-sm font-semibold text-muted-foreground">
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
                <p className="mb-3 text-xs text-muted-foreground">
                  Only people who opened your profile while signed in (not guesses or demos).
                </p>
                {visitorsSorted.length === 0 ? (
                  <div className="rounded-[24px] border border-border bg-card/90 px-4 py-8 text-center shadow-sm backdrop-blur-md">
                    <Compass className="mx-auto h-6 w-6 text-muted-foreground" strokeWidth={1.75} aria-hidden />
                    <p className="mt-2 text-sm font-semibold text-muted-foreground">No profile visits yet.</p>
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
                <p className="mb-3 text-xs text-muted-foreground sm:text-sm">
                  Newest members (opposite gender from your profile when your gender is set — same as Matches).
                </p>
                {recentJoinersForYou.length === 0 ? (
                  <div className="rounded-[24px] border border-border bg-card/90 px-4 py-8 text-center shadow-sm backdrop-blur-md">
                    <Sparkles className="mx-auto h-6 w-6 text-muted-foreground" strokeWidth={1.75} aria-hidden />
                    <p className="mt-2 text-sm font-semibold text-muted-foreground">No new members to show yet.</p>
                  </div>
                ) : (
                  <ExploreTwoRowScroller hint="Two rows · scroll sideways for more new members." itemCount={recentJoinersForYou.length}>
                    {recentJoinersForYou.map((u) => (
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

                    {tab === "coaching" && (
            <motion.div key="coaching" className="space-y-4 pt-5" {...tabMotion}>
              <div className="matchify-surface rounded-[24px] border-white/0 p-5 shadow-2xs">
                <h2 className="text-lg font-bold text-foreground">Relationship coaching</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Book a coach and use guided tools. Find meetups under Explore → Events.
                </p>
                <Button
                  type="button"
                  className="mt-4 h-11 w-full rounded-2xl font-semibold"
                  onClick={() => setLocation("/relationship-coaching")}
                >
                  Open coaching
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-2 h-11 w-full rounded-2xl border-border/70 font-semibold"
                  onClick={() => setLocation("/coaches")}
                >
                  Browse coaches
                </Button>
              </div>
            </motion.div>
          )}

          {tab === "history" && (
            <motion.div key="history" className="space-y-3 pt-4" {...tabMotion}>
              <FeedFilterPills
                variant="equalWidth"
                pills={[
                  { id: "favorite", label: "Favorites" },
                  { id: "liked", label: "Liked" },
                  { id: "passed", label: "Passed" },
                ]}
                activeId={historySub}
                onChange={(id) => setHistorySub(id as "favorite" | "liked" | "passed")}
              />
              {marriageHistoryEntries.length === 0 ? (
                <p className="pt-2 text-sm text-muted-foreground">
                  No one here yet — use the Matches tab to favorite, like, or pass.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {marriageHistoryEntries.map((h) => {
                    const u = historyPeopleById.get(h.id);
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
