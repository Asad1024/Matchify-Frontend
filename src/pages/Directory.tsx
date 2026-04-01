import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Header from "@/components/common/Header";
import PageWrapper from "@/components/common/PageWrapper";
import BottomNav from "@/components/common/BottomNav";
import MatchReveal from "@/components/matches/MatchReveal";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingState } from "@/components/common/LoadingState";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Check,
  ArrowRight,
  Crown,
  Rocket,
  AlertCircle,
  Users,
  Compass,
  Heart,
  MessageCircle,
  UserRound,
} from "lucide-react";
import { VerifiedTick } from "@/components/common/VerifiedTick";
import { useCurrentUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { matchesService } from "@/services/matches.service";
import type { User } from "@shared/schema";
import { getAIMatches } from "@/services/aiMatchmaker.service";
import type { AIMatch } from "@/services/aiMatchmaker.service";
import { LayoutGroup, motion } from "framer-motion";
import { buildApiUrl } from "@/services/api";
import { useUpgrade } from "@/contexts/UpgradeContext";
import { cn } from "@/lib/utils";

type Profile = {
  id: string;
  name: string;
  age: number | null;
  location: string | null;
  bio: string | null;
  interests: string[] | null;
  avatar: string | null;
  membershipTier: string | null;
  verified: boolean | null;
  gender?: string | null;
  education?: string | null;
  career?: string | null;
  incomeRange?: string | null;
  loveLanguage?: string | null;
  commitmentIntention?: string | null;
  relationshipGoal?: string | null;
  profileBanner?: string | null;
  privacy?: { showOnlineStatus?: boolean } | null;
  lastActiveAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type NotificationRow = {
  id: string;
  type: string;
  relatedUserId?: string | null;
  createdAt?: string | null;
};

type UnrevealedMatch = {
  id: string;
  user: User;
  compatibility: number;
};

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

function DiscoverCard({
  profile,
  compatibility,
  liked,
  onViewProfile,
  onLike,
  onMessage,
}: {
  profile: Profile;
  compatibility: number;
  liked: boolean;
  onViewProfile: (id: string) => void;
  onLike: (id: string) => void;
  onMessage: (id: string) => void;
}) {
  const time = formatCardTime(profile.createdAt);
  const locationLabel = profile.location?.trim() || "—";
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onViewProfile(profile.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onViewProfile(profile.id);
      }}
      className="group relative aspect-[3/4] w-full min-h-0 cursor-pointer overflow-hidden rounded-[24px] border bg-muted text-left outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
      style={{ borderColor: "hsl(var(--surface-border))" }}
    >
      {profile.avatar ? (
        <img
          src={profile.avatar}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-stone-300 to-stone-200" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10" />

      <div className="absolute left-3 right-3 top-3 flex items-start justify-between gap-2">
        <span className="matchify-pill-active px-3 py-1.5 text-[11px] font-semibold shadow-sm backdrop-blur-lg">
          {compatibility}%
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onLike(profile.id);
            }}
            className="matchify-pill-active inline-flex items-center justify-center p-2.5 shadow-sm backdrop-blur-lg transition hover:brightness-[1.02]"
            aria-label="Like"
            title="Like"
          >
            <Heart
              className="h-4.5 w-4.5 text-white"
              fill={liked ? "currentColor" : "none"}
              strokeWidth={2}
              aria-hidden
            />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMessage(profile.id);
            }}
            className="matchify-pill-active inline-flex items-center justify-center p-2.5 shadow-sm backdrop-blur-lg transition hover:brightness-[1.02]"
            aria-label="Message"
            title="Message"
          >
            <MessageCircle className="h-4.5 w-4.5 text-white" strokeWidth={2} aria-hidden />
          </button>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 space-y-1 px-3 pb-3 pt-14">
        <div className="flex items-center gap-2 min-w-0">
          <span className="truncate text-[15px] font-semibold leading-tight text-white tracking-[0.2px]">
            {profile.name}
            {profile.age != null ? `, ${profile.age}` : ""}
          </span>
          {profile.verified ? <VerifiedTick size="md" className="translate-y-[0.5px]" /> : null}
        </div>
        <div className="flex items-center gap-1.5 text-[12px] font-medium text-white/85">
          <span className="truncate">{locationLabel}</span>
        </div>
        <div className="text-[10px] font-medium text-white/65 tabular-nums">{time}</div>
      </div>
    </div>
  );
}

export default function Directory() {
  const [activePage, setActivePage] = useState('explore');
  const [, setLocation] = useLocation();
  const { userId } = useCurrentUser();
  const { tier, requireTier } = useUpgrade();
  const { logout } = useAuth();
  const { toast } = useToast();
  const [showMatchReveal, setShowMatchReveal] = useState(false);
  const [currentMatch, setCurrentMatch] = useState<UnrevealedMatch | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [discoverTab, setDiscoverTab] = useState<"browse" | "curated">("browse");
  const lastPeopleCardLikeAtMs = useRef<number>(0);
  const [likedProfileIds, setLikedProfileIds] = useState<string[]>([]);

  const applyDiscoverTab = useCallback((t: "browse" | "curated") => {
    if (t === "curated" && tier === "free") {
      requireTier({ feature: "Curated picks", minTier: "plus", reason: "Free plan doesn’t include AI picks." });
      return;
    }
    setDiscoverTab(t);
    const url = new URL(window.location.href);
    if (t === "curated") url.searchParams.set("tab", "curated");
    else url.searchParams.delete("tab");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }, [requireTier, tier]);

  // Filter states
  const [ageRange, setAgeRange] = useState<[number, number]>([18, 100]);
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [selectedEducation, setSelectedEducation] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState('compatibility');

  const { data: profiles = [], isLoading } = useQuery<Profile[]>({
    queryKey: ['/api/users'],
    enabled: !!userId,
  });

  const { data: unrevealedMatches = [] } = useQuery<UnrevealedMatch[]>({
    queryKey: [`/api/users/${userId}/unrevealed-matches`],
    enabled: !!userId,
  });

  useEffect(() => {
    if (unrevealedMatches.length > 0 && !showMatchReveal) {
      // If the user tapped Like on a People card, we still create the same "profile like",
      // but we intentionally avoid interrupting them with the Match Reveal modal.
      if (Date.now() - lastPeopleCardLikeAtMs.current < 2500) return;
      setCurrentMatch(unrevealedMatches[0]);
      setShowMatchReveal(true);
    }
  }, [unrevealedMatches, showMatchReveal]);

  const markRevealedMutation = useMutation({
    mutationFn: async (matchId: string) => {
      return apiRequest("PATCH", `/api/matches/${matchId}/reveal`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/unrevealed-matches`] });
    },
  });

  const handleCloseMatchReveal = () => {
    if (currentMatch) markRevealedMutation.mutate(currentMatch.id);
    setShowMatchReveal(false);
    setCurrentMatch(null);
  };

  const likeProfileMutation = useMutation({
    mutationFn: async (payload: { targetId: string; compatibility: number }) => {
      if (!userId) throw new Error("Sign in required");
      return matchesService.create({
        user1Id: userId,
        user2Id: payload.targetId,
        compatibility: payload.compatibility,
      });
    },
    onSuccess: (data) => {
      const existing = Boolean((data as { existing?: boolean }).existing);
      toast({
        title: existing ? "Already matched" : "Like sent",
        description: existing
          ? "You're already connected with this member."
          : "They'll see you in their matches.",
      });
      if (userId) {
        queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/matches`] });
        queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/unrevealed-matches`] });
      }
    },
    onError: (e: Error) => {
      toast({ title: "Couldn't send like", description: e.message, variant: "destructive" });
    },
  });

  const { data: currentUser } = useQuery<User & {
    selfDiscoveryCompleted?: boolean;
    attractionBlueprint?: any;
    curatedMatchShownUserIds?: string[];
    gender?: string | null;
    dealbreakers?: string[] | null;
    topPriorities?: string[] | null;
    interests?: string[] | null;
    loveLanguage?: string | null;
    commitmentIntention?: string | null;
  }>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
    refetchInterval: 10000,
  });

  const { data: notifications = [] } = useQuery<NotificationRow[]>({
    queryKey: ["/api/users", userId, "notifications"],
    enabled: !!userId,
    refetchInterval: 15000,
  });

  const hasAttractionBlueprint = !!currentUser?.attractionBlueprint;
  /** AI Matchmaker (30 questions) saves the blueprint — required for AI matches & full Discover list */
  const aiMatchmakerComplete = hasAttractionBlueprint;

  useEffect(() => {
    if (!aiMatchmakerComplete) {
      const params = new URLSearchParams(window.location.search);
      if (params.get("tab") === "curated") applyDiscoverTab("browse");
      return;
    }
    const params = new URLSearchParams(window.location.search);
    if (params.get("tab") === "curated") setDiscoverTab("curated");
  }, [aiMatchmakerComplete, applyDiscoverTab]);

  const { data: aiMatches = [] } = useQuery<AIMatch[]>({
    queryKey: [`/api/users/${userId}/ai-matches`],
    enabled: !!userId && hasAttractionBlueprint,
    queryFn: async () => {
      if (!userId) return [];
      try {
        const { matches } = await getAIMatches(userId);
        return matches;
      } catch {
        return [];
      }
    },
  });

  const safeProfiles = Array.isArray(profiles) ? profiles : [];
  const safeAiMatches = Array.isArray(aiMatches) ? aiMatches : [];

  const curatedIdsRaw = Array.isArray(currentUser?.curatedMatchShownUserIds)
    ? currentUser.curatedMatchShownUserIds.map(String)
    : [];
  // Fallback: if profile field is stale, reconstruct curated picks from notifications.
  const notifCuratedIds =
    (Array.isArray(notifications) ? notifications : [])
      .filter((n) => n?.type === "curated_match" && n.relatedUserId)
      .map((n) => String(n.relatedUserId))
      .filter((id, idx, arr) => arr.indexOf(id) === idx);
  // Merge profile + notification sources so new notification IDs still appear
  // even if profile.curatedMatchShownUserIds is temporarily stale.
  const curatedIdsMerged = [...curatedIdsRaw, ...notifCuratedIds].filter(
    (id, idx, arr) => arr.indexOf(id) === idx,
  );
  const curatedIdsNewestFirst = [...curatedIdsMerged].reverse();
  const curatedProfiles = curatedIdsNewestFirst
    .map((id) => safeProfiles.find((p) => p.id === id))
    .filter((p): p is Profile => p != null);

  const aiMatchMap = new Map<string, AIMatch>();
  safeAiMatches.forEach(match => { if (match?.id) aiMatchMap.set(match.id, match); });

  const latestCuratedId =
    curatedIdsMerged.length > 0 ? curatedIdsMerged[curatedIdsMerged.length - 1]! : null;
  const latestCuratedProfile = latestCuratedId
    ? safeProfiles.find((p) => p.id === latestCuratedId)
    : undefined;
  const latestAiOnly = latestCuratedId ? aiMatchMap.get(latestCuratedId) : undefined;

  const handleLikeProfile = (targetId: string) => {
    lastPeopleCardLikeAtMs.current = Date.now();
    setLikedProfileIds((prev) => (prev.includes(targetId) ? prev : [...prev, targetId]));
    const compatibility = aiMatchMap.get(targetId)?.compatibility ?? 70;
    likeProfileMutation.mutate({ targetId, compatibility });
  };
  const handleMessageProfile = (targetId: string) => {
    // Send a message request (accept/reject) instead of opening chat immediately.
    if (!userId) {
      setLocation(`/chat?user=${encodeURIComponent(targetId)}`);
      return;
    }
    fetch(buildApiUrl(`/api/users/${encodeURIComponent(userId)}/chat-requests`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ toId: targetId, message: "Hey! Want to chat?" }),
    })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json().catch(() => ({})))?.message || "Could not send request");
        toast({ title: "Request sent", description: "They’ll get an accept/reject notification." });
      })
      .catch((e: any) => {
        toast({ title: "Could not send request", description: e?.message || "Try again", variant: "destructive" });
      });
  };

  const norm = (v: unknown): string => String(v ?? "").trim().toLowerCase();
  const isTruthy = (v: unknown): boolean =>
    v === true || v === 1 || v === "1" || norm(v) === "true" || norm(v) === "yes";

  const inferredPreferredGender = (): string => {
    const g = norm(currentUser?.gender);
    if (g === "male" || g === "man" || g === "m") return "female";
    if (g === "female" || g === "woman" || g === "f") return "male";
    return "all";
  };
  const effectiveGenderFilter =
    selectedGender !== "all" ? selectedGender : inferredPreferredGender();

  let filteredProfiles = safeProfiles.filter(p => p?.id !== userId);
  if (effectiveGenderFilter !== "all") {
    filteredProfiles = filteredProfiles.filter((p) => norm(p.gender) === norm(effectiveGenderFilter));
  }
  if (selectedEducation !== "all") {
    filteredProfiles = filteredProfiles.filter((p) => norm(p.education) === norm(selectedEducation));
  }
  if (selectedLocation !== "all") {
    filteredProfiles = filteredProfiles.filter((p) => norm(p.location).includes(norm(selectedLocation)));
  }
  if (verifiedOnly) {
    filteredProfiles = filteredProfiles.filter((p) => isTruthy(p.verified));
  }
  filteredProfiles = filteredProfiles.filter(p => { if (!p.age) return false; return p.age >= ageRange[0] && p.age <= ageRange[1]; });

  const calculateCompatibility = (profile: Profile): { score: number; reasons: string[] } => {
    let baseScore = 50;
    const reasons: string[] = [];
    const userInterests = Array.isArray(currentUser?.interests) ? currentUser.interests : [];
    const profileInterests = Array.isArray(profile.interests) ? profile.interests : [];
    const sharedInterests = userInterests.filter(i => profileInterests.includes(i));
    if (sharedInterests.length > 0) { baseScore += Math.min(sharedInterests.length * 5, 25); reasons.push(`${sharedInterests.length} shared interest${sharedInterests.length > 1 ? 's' : ''}`); }
    if (profile.avatar) { baseScore += 5; reasons.push("Complete profile"); }
    if (profile.verified) { baseScore += 5; reasons.push("Verified"); }
    if (currentUser?.commitmentIntention && profile.commitmentIntention) {
      const compatible = { 'marriage': ['marriage', 'serious'], 'serious': ['serious', 'marriage', 'casual'], 'casual': ['casual', 'serious'] };
      if (compatible[currentUser.commitmentIntention as keyof typeof compatible]?.includes(profile.commitmentIntention)) { baseScore += 15; reasons.push("Aligned marriage intentions"); }
    }
    return { score: Math.min(Math.max(baseScore, 0), 100), reasons: reasons.length > 0 ? reasons : ["Potential match"] };
  };

  let profilesWithCompatibility = filteredProfiles.map(profile => {
    const matchResult = calculateCompatibility(profile);
    return { ...profile, tags: Array.isArray(profile.interests) ? profile.interests : [], compatibility: matchResult.score, matchReasons: matchResult.reasons };
  });

  if (sortBy === 'compatibility') profilesWithCompatibility.sort((a, b) => b.compatibility - a.compatibility);
  else if (sortBy === 'age') profilesWithCompatibility.sort((a, b) => (a.age || 0) - (b.age || 0));
  else if (sortBy === 'newest') {
    const ts = (p: { updatedAt?: string | null; createdAt?: string | null; lastActiveAt?: string | null }) => {
      const raw = p.updatedAt || p.createdAt || p.lastActiveAt || null;
      const t = raw ? Date.parse(String(raw)) : 0;
      return Number.isFinite(t) ? t : 0;
    };
    profilesWithCompatibility.sort((a, b) => ts(b) - ts(a));
  }
  if (aiMatchmakerComplete) profilesWithCompatibility = profilesWithCompatibility.filter(p => p.compatibility >= 40).slice(0, 20);

  const browseProfileRows =
    aiMatchmakerComplete && latestCuratedId
      ? profilesWithCompatibility.filter((p) => p.id !== latestCuratedId)
      : profilesWithCompatibility;

  const uniqueLocations = Array.from(new Set(profiles.map(p => p.location).filter(Boolean))) as string[];
  const uniqueGenders = Array.from(new Set(profiles.map(p => p.gender).filter(Boolean))) as string[];
  const uniqueEducations = Array.from(new Set(profiles.map(p => p.education).filter(Boolean))) as string[];

  const sortOptions = [
    { id: 'compatibility', label: 'Best Match' },
    { id: 'age', label: 'Age' },
    { id: 'newest', label: 'Newest' },
  ];

  return (
    <PageWrapper>
    <div className="min-h-screen bg-[hsl(var(--surface-2))] pb-24">
      <Header
        showSearch={true}
        onLogout={logout}
        title="People"
        subtitle="Browse members and curated picks"
      />

      <div className="max-w-lg mx-auto">
        {/* AI Matchmaker required — no AI matches / full list until 30 questions are finished */}
        {!aiMatchmakerComplete && (
          <div
            className="mx-4 mt-4 rounded-2xl border border-amber-400/60 bg-amber-50/70 p-4 shadow-2xs"
            role="status"
            data-testid="banner-ai-matchmaker-incomplete"
          >
            <div className="flex gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100">
                <AlertCircle className="h-5 w-5 text-amber-700" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm text-amber-950 mb-1">Finish AI Matchmaker to see matches</p>
                <p className="text-xs text-amber-900/85 leading-relaxed mb-3">
                  Personalized and AI-ranked matches stay hidden until you complete all{" "}
                  <span className="font-semibold">30 questions</span>. People in Discover will show here
                  after you finish.
                </p>
                <Button
                  size="sm"
                  className="bg-primary text-primary-foreground font-semibold rounded-xl h-9 text-xs hover:bg-primary/90 shadow-2xs"
                  onClick={() => setLocation("/ai-matchmaker/flow-b")}
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  Continue AI Matchmaker
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* AI Match banner */}
        {hasAttractionBlueprint && (
          <div className="mx-4 mt-3 matchify-surface bg-primary/5 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white shadow-2xs ring-1 ring-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-800">AI Matchmaker active</p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
                  Your <span className="font-semibold text-slate-800">timed pick</span> is one person per cycle on the AI
                  Matchmaker home. Here you can browse everyone; compatibility sort still uses AI scores where available.
                </p>
              </div>
            </div>
          </div>
        )}

        {aiMatchmakerComplete && (
          <LayoutGroup id="discover-tabs">
            <div className="mx-4 mt-3 matchify-surface flex p-1">
              {(
                [
                  ["browse", "Browse", Compass],
                  ["curated", "Curated picks", Users],
                ] as const
              ).map(([id, label, Icon]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => applyDiscoverTab(id)}
                  className={`relative flex flex-1 items-center justify-center gap-2 rounded-[20px] py-2.5 text-[11px] font-medium uppercase tracking-[0.14em] transition-colors ${
                    discoverTab === id ? "text-slate-900" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  <span className="leading-tight">{label}</span>
                  {discoverTab === id ? (
                    <motion.span
                      layoutId="discover-tab-bg"
                      className="absolute inset-0 -z-10 rounded-[20px] bg-card/80 shadow-2xs"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  ) : null}
                </button>
              ))}
            </div>
          </LayoutGroup>
        )}

        {discoverTab === "curated" && aiMatchmakerComplete ? (
          <div className="px-4 mt-5 space-y-4">
            <p className="text-center font-display text-[13px] leading-[1.8] text-slate-600">
              Everyone listed here was assigned as your timed AI pick. New names appear automatically after
              each cycle.
            </p>
            {curatedProfiles.length === 0 ? (
              <EmptyState
                useMascot={true}
                mascotType="no-matches"
                title="No curated picks yet"
                description="When your countdown finishes, your next match will appear here and in notifications."
                actionLabel="AI Matchmaker"
                onAction={() => setLocation("/ai-matchmaker")}
                className="max-w-md mx-auto py-10"
              />
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {curatedProfiles.map((profile) => {
                  const aiMatch = aiMatchMap.get(profile.id);
                  return (
                    <DiscoverCard
                      key={profile.id}
                      profile={profile}
                      compatibility={aiMatch?.compatibility || 70}
                      liked={likedProfileIds.includes(profile.id)}
                      onViewProfile={(id) => setLocation(`/profile/${id}`)}
                      onLike={handleLikeProfile}
                      onMessage={handleMessageProfile}
                    />
                  );
                })}
              </div>
            )}
          </div>
        ) : null}

        {/* Filter chips + browse lists (hidden on Curated picks tab) */}
        {!(discoverTab === "curated" && aiMatchmakerComplete) && (
        <>
        <div className="px-4 mt-4">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
            {/* Sort chips */}
            {sortOptions.map(opt => (
              <button
                key={opt.id}
                onClick={() => setSortBy(opt.id)}
                className={cn(
                  "flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-[999px] text-[11px] font-medium uppercase tracking-[0.14em] border transition-colors",
                  sortBy === opt.id
                    ? "bg-primary/10 text-slate-900 border-primary/30 shadow-2xs"
                    : "bg-card/60 text-slate-600 border-border/70 hover:bg-card",
                )}
              >
                {sortBy === opt.id && <Check className="w-3 h-3" />}
                {opt.label}
              </button>
            ))}

            {/* Gender chips */}
            {uniqueGenders.map(g => (
              <button
                key={g}
                onClick={() => setSelectedGender(selectedGender === g ? 'all' : g)}
                className={cn(
                  "flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-[999px] text-[11px] font-medium uppercase tracking-[0.14em] border transition-colors capitalize",
                  selectedGender === g
                    ? "bg-primary/10 text-slate-900 border-primary/30 shadow-2xs"
                    : "bg-card/60 text-slate-600 border-border/70 hover:bg-card",
                )}
              >
                {selectedGender === g && <Check className="w-3 h-3" />}
                {g}
              </button>
            ))}

            {/* Verified chip */}
            <button
              onClick={() => setVerifiedOnly(!verifiedOnly)}
              className={cn(
                "flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-[999px] text-[11px] font-medium uppercase tracking-[0.14em] border transition-colors",
                verifiedOnly
                  ? "bg-primary/10 text-slate-900 border-primary/30 shadow-2xs"
                  : "bg-card/60 text-slate-600 border-border/70 hover:bg-card",
              )}
            >
              {verifiedOnly && <Check className="w-3 h-3" />}
              Verified
            </button>

            {/* Location chips */}
            {uniqueLocations.slice(0, 5).map(loc => (
              <button
                key={loc}
                onClick={() => setSelectedLocation(selectedLocation === loc ? 'all' : loc)}
                className={cn(
                  "flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-[999px] text-[11px] font-medium uppercase tracking-[0.14em] border transition-colors",
                  selectedLocation === loc
                    ? "bg-primary/10 text-slate-900 border-primary/30 shadow-2xs"
                    : "bg-card/60 text-slate-600 border-border/70 hover:bg-card",
                )}
              >
                {selectedLocation === loc && <Check className="w-3 h-3" />}
                {loc}
              </button>
            ))}

            {/* Education chips */}
            {uniqueEducations.slice(0, 5).map(ed => (
              <button
                key={ed}
                onClick={() => setSelectedEducation(selectedEducation === ed ? 'all' : ed)}
                className={cn(
                  "flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-[999px] text-[11px] font-medium uppercase tracking-[0.14em] border transition-colors",
                  selectedEducation === ed
                    ? "bg-primary/10 text-slate-900 border-primary/30 shadow-2xs"
                    : "bg-card/60 text-slate-600 border-border/70 hover:bg-card",
                )}
              >
                {selectedEducation === ed && <Check className="w-3 h-3" />}
                {ed}
              </button>
            ))}
          </div>

          {/* Age range */}
          <div className="mt-3 matchify-surface px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Age range</span>
              <span className="font-display text-[14px] font-bold text-slate-900 tabular-nums">
                {ageRange[0]} <span className="text-slate-400">–</span> {ageRange[1]}
              </span>
            </div>
            <div className="flex gap-3 items-center">
              <input
                type="range"
                min="18"
                max="100"
                value={ageRange[0]}
                onChange={(e) => setAgeRange([parseInt(e.target.value), ageRange[1]])}
                className="matchify-range flex-1"
              />
              <input
                type="range"
                min="18"
                max="100"
                value={ageRange[1]}
                onChange={(e) => setAgeRange([ageRange[0], parseInt(e.target.value)])}
                className="matchify-range flex-1"
              />
            </div>
          </div>
        </div>

        {/* Profile list */}
        <div className="px-4 mt-4 space-y-4">
          {!aiMatchmakerComplete ? (
            <EmptyState
              useMascot={true}
              mascotType="default"
              title="AI Matchmaker not finished"
              description="Complete all 30 questions to unlock matches and AI compatibility scores in Discover."
              actionLabel="Go to AI Matchmaker"
              onAction={() => setLocation("/ai-matchmaker/flow-b")}
              className="max-w-md mx-auto py-12"
            />
          ) : isLoading ? (
            <div className="py-12">
              <LoadingState message="Finding your matches..." showMascot={true} />
            </div>
          ) : browseProfileRows.length === 0 ? (
            latestCuratedId ? (
              <p className="py-8 text-center text-xs text-gray-500 leading-relaxed">
                No other profiles match your filters right now. Try widening age or location, or open{" "}
                <button
                  type="button"
                  className="font-semibold text-primary hover:underline"
                  onClick={() => applyDiscoverTab("curated")}
                >
                  Curated picks
                </button>
                .
              </p>
            ) : (
              <EmptyState
                useMascot={true}
                mascotType="no-matches"
                title="No matches found"
                description="Try adjusting your filters or finish AI Matchmaker!"
                className="max-w-md mx-auto py-12"
              />
            )
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {browseProfileRows.map((profile) => {
                const aiMatch = aiMatchMap.get(profile.id);
                return (
                  <DiscoverCard
                    key={profile.id}
                    profile={profile}
                    compatibility={aiMatch?.compatibility || profile.compatibility}
                    liked={likedProfileIds.includes(profile.id)}
                    onViewProfile={(id) => setLocation(`/profile/${id}`)}
                    onLike={handleLikeProfile}
                    onMessage={handleMessageProfile}
                  />
                );
              })}
            </div>
          )}
        </div>
        </>
        )}
      </div>

      <BottomNav active={activePage} onNavigate={setActivePage} />

      {showMatchReveal && currentMatch && (
        <MatchReveal
          match={currentMatch}
          onClose={handleCloseMatchReveal}
          onMessage={(matchedUserId) => {
            if (currentMatch) markRevealedMutation.mutate(currentMatch.id);
            setShowMatchReveal(false);
            setCurrentMatch(null);
            setLocation(`/chat?user=${matchedUserId}`);
          }}
        />
      )}
    </div>
    </PageWrapper>
  );
}
