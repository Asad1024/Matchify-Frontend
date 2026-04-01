import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { motion } from "framer-motion";
import BottomNav from "@/components/common/BottomNav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Heart,
  MessageCircle,
  ArrowLeft,
  Share2,
  MoreVertical,
  Sparkles,
  Flag,
  Ban,
  Ruler,
  Baby,
  Briefcase,
  UserRound,
  Globe2,
  Flame,
  Brain,
  GraduationCap,
  Languages as LanguagesIcon,
  AlignLeft,
} from "lucide-react";
import { VerifiedTick } from "@/components/common/VerifiedTick";
import { LoadingState } from "@/components/common/LoadingState";
import { useCurrentUser } from "@/contexts/UserContext";
import { BlockReportDialog } from "@/components/common/BlockReportDialog";
import { MatchInsights } from "@/components/matches/MatchInsights";
import { ProfileMarriageIntentBar } from "@/components/profile/ProfileMarriageIntentBar";
import { ProfilePreviewCard } from "@/components/profile/ProfilePreviewCard";
import { useToast } from "@/hooks/use-toast";
import { pushExploreHistory } from "@/lib/muzzEconomy";
import { getReligionLabel, MEET_PREFERENCE_OPTIONS } from "@/lib/religionOptions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { buildApiUrl } from "@/services/api";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ShareProfileDialog } from "@/components/profile/ShareProfileDialog";
import { labelLoveLanguage, membershipBadgeLabel, splitLocation } from "@/lib/profileLabels";
import { labelAlcohol, labelEthnicity, labelSmoking } from "@/lib/profileDemographics";
import { cn } from "@/lib/utils";

type User = {
  id: string;
  name: string;
  username: string;
  email: string;
  age: number | null;
  location: string | null;
  bio: string | null;
  avatar: string | null;
  interests: string[] | null;
  membershipTier: string | null;
  verified: boolean | null;
  zodiacSign?: string | null;
  values?: string[] | null;
  commitmentIntention?: string | null;
  marriageTimeline?: string | null;
  marriageApproach?: string | null;
  wantsChildren?: string | null;
  religion?: string | null;
  height?: string | null;
  heightCm?: number | null;
  maritalStatus?: string | null;
  hasChildren?: string | boolean | null;
  profileBanner?: string | null;
  privacy?: { showOnlineStatus?: boolean } | null;
  lastActiveAt?: string | null;
  createdAt?: string | null;
  career?: string | null;
  meetPreference?: string | null;
  loveLanguage?: string | null;
  lifestyle?: string[] | null;
  education?: string | null;
  incomeRange?: string | null;
  languages?: string | string[] | null;
  extraBio?: string | null;
  nationality?: string | null;
  ethnicity?: string | null;
  smoking?: string | null;
  drinksAlcohol?: string | null;
};

function formatLanguages(raw: string | string[] | null | undefined): string {
  if (!raw) return "";
  if (Array.isArray(raw)) return raw.filter(Boolean).join(" · ");
  return raw;
}

function hashId(id: string) {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return sum;
}

function aboutMeRows(user: User): { label: string; value: string }[] {
  const h = hashId(user.id || "x");
  const fallbackH = ["160cm (5' 3\")", "165cm (5' 5\")", "172cm (5' 8\")"][h % 3];
  const fallbackM = ["Never Married", "Never Married", "Divorced"][h % 3];
  const fallbackC = ["Has children", "No children", "Has children"][(h >> 2) % 3];

  let childrenLabel: string;
  if (user.hasChildren === true || user.hasChildren === "yes" || user.hasChildren === "true") {
    childrenLabel = "Has children";
  } else if (user.hasChildren === false || user.hasChildren === "no" || user.hasChildren === "false") {
    childrenLabel = "No children";
  } else if (typeof user.hasChildren === "string" && user.hasChildren) {
    childrenLabel = user.hasChildren;
  } else {
    childrenLabel = fallbackC;
  }

  return [
    {
      label: "Height",
      value: user.height || (user.heightCm != null ? `${user.heightCm}cm` : fallbackH),
    },
    { label: "Marital status", value: user.maritalStatus || fallbackM },
    { label: "Children", value: childrenLabel },
  ];
}

function hashPairScore(a: string, b: string): number {
  const s = `${a}:${b}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return 70 + (h % 30);
}

export default function ViewProfile() {
  const [activePage, setActivePage] = useState('explore');
  const [, params] = useRoute('/profile/:id');
  const [, setLocation] = useLocation();
  const { userId: currentUserId } = useCurrentUser();
  const { toast } = useToast();
  const [blockReportOpen, setBlockReportOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [blockReportType, setBlockReportType] = useState<'block' | 'report' | 'both'>('both');
  const [hasLikedProfile, setHasLikedProfile] = useState(false);

  // Fetch user profile
  const { data: user, isLoading } = useQuery<User>({
    queryKey: [`/api/users/${params?.id}`],
    enabled: !!params?.id,
  });

  const { data: me } = useQuery<User>({
    queryKey: [`/api/users/${currentUserId}`],
    enabled: !!currentUserId,
  });

  useEffect(() => {
    if (!user?.id) return;
    pushExploreHistory(user.id);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || !currentUserId || user.id === currentUserId) return;
    void apiRequest("POST", "/api/profile-views", { profileUserId: user.id }).catch(() => {});
  }, [user?.id, currentUserId]);

  const sharedInterests = useMemo(() => {
    if (!me?.interests?.length || !user?.interests?.length) return [];
    const mine = new Set(me.interests);
    return user.interests.filter((x) => mine.has(x));
  }, [me, user]);

  const sameCommitment =
    Boolean(me?.commitmentIntention && user?.commitmentIntention) &&
    me?.commitmentIntention === user?.commitmentIntention;

  const compatibilityScore = useMemo(() => {
    if (!currentUserId || !params?.id) return 82;
    return hashPairScore(currentUserId, params.id);
  }, [currentUserId, params?.id]);

  const { data: likeState } = useQuery<{ liked: boolean }>({
    queryKey: [`/api/users/${currentUserId}/profile-like/${user?.id || ""}`],
    enabled: !!currentUserId && !!user?.id && user.id !== currentUserId,
  });

  useEffect(() => {
    if (typeof likeState?.liked === "boolean") setHasLikedProfile(likeState.liked);
  }, [likeState?.liked]);

  const likeProfileMutation = useMutation({
    mutationFn: async () => {
      if (!currentUserId || !user?.id) throw new Error("Missing user");
      const res = await fetch(buildApiUrl("/api/matches"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          user1Id: currentUserId,
          user2Id: user.id,
          compatibility: compatibilityScore,
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(err.message || "Could not send like");
      }
      return (await res.json()) as { id: string; compatibility: number; existing?: boolean };
    },
    onSuccess: (data) => {
      setHasLikedProfile(true);
      toast({
        title: "Liked",
        description: data.existing ? "Already liked." : "Heart saved.",
      });
      if (currentUserId) {
        queryClient.invalidateQueries({ queryKey: [`/api/users/${currentUserId}/unrevealed-matches`] });
        queryClient.invalidateQueries({ queryKey: [`/api/users/${currentUserId}/matches`] });
      }
    },
    onError: (e: Error) => {
      toast({
        title: "Like didn’t go through",
        description: e.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--surface-2))] pb-24">
        <div className="sticky top-0 z-40 border-b border-border/70 bg-card/80 backdrop-blur-md shadow-2xs">
          <div className="mx-auto flex h-12 max-w-lg items-center px-3">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => setLocation("/explore")}
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-center py-20">
          <LoadingState message="Loading profile..." showMascot={true} />
        </div>
        <BottomNav active={activePage} onNavigate={setActivePage} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[hsl(var(--surface-2))] pb-24">
        <div className="sticky top-0 z-40 border-b border-border/70 bg-card/80 backdrop-blur-md shadow-2xs">
          <div className="mx-auto flex h-12 max-w-lg items-center px-3">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => setLocation("/explore")}
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Profile not found</p>
            <Button onClick={() => setLocation("/explore")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Explore
            </Button>
          </div>
        </div>
        <BottomNav active={activePage} onNavigate={setActivePage} />
      </div>
    );
  }

  const aboutRows = aboutMeRows(user);
  const { city, country } = splitLocation(user.location);
  const profileAvatarUrl = user.avatar?.trim() || "";
  const isOwnProfile = user.id === currentUserId;

  return (
    <div className="min-h-screen bg-[hsl(var(--surface-2))] pb-24">
      <div className="sticky top-0 z-40 border-b border-border/70 bg-card/80 backdrop-blur-md shadow-2xs supports-[backdrop-filter]:bg-card/70">
        <div className="mx-auto flex h-12 max-w-lg items-center gap-2 px-3">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 rounded-full hover:bg-foreground/[0.05]"
            onClick={() => setLocation("/explore")}
            data-testid="button-back"
            aria-label="Back to Explore"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="min-w-0 flex-1 truncate text-center text-sm font-semibold text-foreground">{user.name}</h1>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="rounded-full hover:bg-foreground/[0.05]"
              aria-label="Share profile"
              onClick={() => setShareOpen(true)}
            >
              <Share2 className="h-4 w-4" />
            </Button>
            {!isOwnProfile && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="rounded-full hover:bg-foreground/[0.05]" aria-label="More options">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      setBlockReportType("report");
                      setBlockReportOpen(true);
                    }}
                  >
                    <Flag className="mr-2 h-4 w-4" />
                    Report User
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setBlockReportType("block");
                      setBlockReportOpen(true);
                    }}
                    className="text-destructive"
                  >
                    <Ban className="mr-2 h-4 w-4" />
                    Block User
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      <motion.div
        className="mx-auto max-w-lg space-y-3 px-3 pb-10 pt-2"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="matchify-surface overflow-hidden rounded-3xl">
          <div className="relative isolate aspect-[3/4] w-full min-h-[300px] max-h-[min(520px,78vh)] bg-muted">
            {profileAvatarUrl ? (
              <img
                src={profileAvatarUrl}
                alt=""
                loading="eager"
                decoding="async"
                className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover [filter:none]"
                style={{ transform: "translateZ(0)", WebkitBackfaceVisibility: "hidden" }}
              />
            ) : (
              <div
                className="absolute inset-0 z-0 bg-gradient-to-br from-primary/45 via-primary/20 to-background"
                aria-hidden
              />
            )}
            <div
              className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-t from-black/78 via-black/10 to-transparent"
              aria-hidden
            />
            <div className="absolute left-3 top-3 z-[3] flex flex-wrap items-center gap-2">
              <Badge className="rounded-full border-0 bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-gray-900 shadow-2xs sm:text-xs">
                {membershipBadgeLabel(user.createdAt)}
              </Badge>
              {user.verified ? (
                <span className="matchify-pill-active inline-flex items-center gap-1 px-2.5 py-1 text-[10px] shadow-2xs">
                  <VerifiedTick size="xs" />
                  Verified
                </span>
              ) : null}
            </div>
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-[3] p-4 text-white">
              <h2
                className="font-display text-2xl font-bold leading-tight tracking-tight"
                style={{ textShadow: "0 2px 16px rgba(0,0,0,0.55), 0 1px 2px rgba(0,0,0,0.65)" }}
              >
                {user.name}
                {user.age != null ? <span className="font-bold text-white/90"> · {user.age}</span> : null}
              </h2>
              {(city || country || user.career) && (
                <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-white/95">
                  {(city || country) && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/25 px-2.5 py-1 backdrop-blur-md">
                      <MapPin className="h-3.5 w-3.5 opacity-90" />
                      {[city, country].filter(Boolean).join(", ")}
                    </span>
                  )}
                  {user.career ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/25 px-2.5 py-1 backdrop-blur-md">
                      <Briefcase className="h-3.5 w-3.5 opacity-90" />
                      {user.career}
                    </span>
                  ) : null}
                </div>
              )}
            </div>
          </div>
          {user.membershipTier && user.membershipTier !== "free" ? (
            <div className="border-t border-border/70 bg-card/60 px-4 py-2.5">
              <p className="text-center text-[11px] font-semibold uppercase tracking-wide text-primary">
                {user.membershipTier} member
              </p>
            </div>
          ) : null}
        </div>

        <div className="flex gap-2 sm:gap-3">
          <Button
            className="h-10 flex-1 gap-2 bg-primary text-sm hover:bg-primary/90 sm:h-11 sm:text-base"
            data-testid="button-message"
            disabled={isOwnProfile}
            onClick={() => setLocation(`/chat?user=${encodeURIComponent(user.id)}`)}
          >
            <MessageCircle className="h-4 w-4" />
            Message
          </Button>
          <Button
            variant="outline"
            className="h-10 flex-1 gap-2 text-sm shadow-2xs sm:h-11 sm:text-base"
            data-testid="button-like"
            disabled={!currentUserId || isOwnProfile || likeProfileMutation.isPending}
            onClick={() => {
              if (!currentUserId) {
                toast({
                  title: "Sign in",
                  description: "Sign in to like profiles.",
                  variant: "destructive",
                });
                return;
              }
              likeProfileMutation.mutate();
            }}
          >
            <Heart
              className={cn("h-4 w-4", hasLikedProfile ? "text-red-600" : "")}
              fill={hasLikedProfile ? "currentColor" : "none"}
            />
            {hasLikedProfile ? "Liked" : "Like"}
          </Button>
        </div>

        {!isOwnProfile && currentUserId && (
          <ProfilePreviewCard
            icon={Sparkles}
            title="Compatibility"
            description="How well you may align on paper."
          >
            <div className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-foreground">Match score</span>
                  <span className="text-lg font-bold text-primary">{compatibilityScore}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary to-chart-1"
                    initial={{ width: 0 }}
                    animate={{ width: `${compatibilityScore}%` }}
                    transition={{ duration: 0.8, delay: 0.15 }}
                  />
                </div>
              </div>
              <MatchInsights targetUserId={user.id} />
            </div>
          </ProfilePreviewCard>
        )}

        {!isOwnProfile && (sharedInterests.length > 0 || sameCommitment) && (
          <ProfilePreviewCard icon={Heart} title="Your similarities" description="">
            <div className="flex flex-wrap gap-2">
              {sameCommitment && user.commitmentIntention && (
                <span className="rounded-full border border-chart-4/30 bg-chart-4/10 px-3 py-1.5 text-xs font-bold text-chart-4">
                  Same marriage intention ·{" "}
                  {user.commitmentIntention.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </span>
              )}
              {sharedInterests.map((interest) => (
                <span
                  key={interest}
                  className="rounded-full border border-primary/20 bg-primary/[0.07] px-3 py-1.5 text-xs font-bold text-primary"
                >
                  {interest}
                </span>
              ))}
            </div>
          </ProfilePreviewCard>
        )}

        <ProfilePreviewCard
          icon={UserRound}
          title="About me"
          description="A quick hello in their own words."
        >
          <p className="text-sm font-medium leading-relaxed text-foreground/90">
            {user.bio?.trim() || "They haven’t added an intro yet."}
          </p>
        </ProfilePreviewCard>

        <ProfilePreviewCard icon={Ruler} title="Basics" description="At-a-glance details.">
          <div className="space-y-3">
            {aboutRows.map((row, i) => {
              const Icon = i === 0 ? Ruler : i === 1 ? Heart : Baby;
              return (
                <div
                  key={row.label}
                  className="flex items-center gap-3 rounded-2xl border border-stone-100 bg-stone-50/90 px-3 py-2.5"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-600">
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground">{row.label}</span>
                    <Badge variant="secondary" className="font-semibold">
                      {row.value}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </ProfilePreviewCard>

        <div className="space-y-3">
          <ProfileMarriageIntentBar
            user={{
              name: user.name,
              commitmentIntention: user.commitmentIntention ?? null,
              marriageTimeline: user.marriageTimeline ?? null,
              marriageApproach: user.marriageApproach ?? null,
              wantsChildren: user.wantsChildren != null ? String(user.wantsChildren) : null,
            }}
            variant="other"
          />
        </div>

        <ProfilePreviewCard
          icon={Globe2}
          title="Faith & communities"
          description="Background and community preferences."
        >
          <div className="space-y-3">
            <div className="rounded-2xl bg-stone-50/90 px-3.5 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Background</p>
              <p className="mt-1 text-sm font-bold text-foreground">
                {user.religion ? getReligionLabel(user.religion) : "—"}
              </p>
            </div>
            <div className="rounded-2xl bg-stone-50/90 px-3.5 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Community</p>
              <p className="mt-1 text-sm font-bold text-foreground">
                {user.meetPreference
                  ? MEET_PREFERENCE_OPTIONS.find((m) => m.value === user.meetPreference)?.label
                  : "Open to everyone"}
              </p>
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Everyone is welcome — this helps personalize matches.
            </p>
          </div>
        </ProfilePreviewCard>

        <ProfilePreviewCard icon={Flame} title="Interests" description="What they enjoy talking about.">
          {user.interests && user.interests.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {user.interests.map((interest) => (
                <span
                  key={interest}
                  className="rounded-full border border-primary/20 bg-primary/[0.07] px-3 py-1.5 text-xs font-bold text-primary"
                >
                  {interest}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No interests listed yet.</p>
          )}
        </ProfilePreviewCard>

        <ProfilePreviewCard
          icon={Brain}
          title="Personality"
          description="Love language, values, and lifestyle."
        >
          <div className="space-y-4">
            {user.loveLanguage ? (
              <div className="rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/[0.06] to-transparent px-3.5 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Love language</p>
                <p className="mt-1 text-sm font-bold text-foreground">{labelLoveLanguage(user.loveLanguage)}</p>
              </div>
            ) : null}
            {user.values && user.values.length > 0 ? (
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Values</p>
                <div className="flex flex-wrap gap-1.5">
                  {user.values.map((v) => (
                    <span
                      key={v}
                      className="rounded-lg bg-muted px-2.5 py-1.5 text-xs font-semibold text-foreground"
                    >
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
            {user.lifestyle && user.lifestyle.length > 0 ? (
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Lifestyle
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {user.lifestyle.map((v) => (
                    <span
                      key={v}
                      className="rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-foreground"
                    >
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
            {!user.loveLanguage &&
            !(user.values && user.values.length) &&
            !(user.lifestyle && user.lifestyle.length) ? (
              <p className="text-sm text-muted-foreground">They haven’t shared this yet.</p>
            ) : null}
          </div>
        </ProfilePreviewCard>

        <ProfilePreviewCard
          icon={GraduationCap}
          title="Education & career"
          description="Their path and work life."
        >
          <div className="grid gap-2 sm:grid-cols-1">
            {[
              { k: "Education", v: user.education || "—" },
              { k: "Career", v: user.career || "—" },
              ...(user.incomeRange ? [{ k: "Income", v: user.incomeRange }] : []),
            ].map((row) => (
              <div
                key={row.k}
                className="flex items-center justify-between gap-3 rounded-2xl bg-stone-50/90 px-3.5 py-3"
              >
                <span className="text-xs font-bold text-muted-foreground">{row.k}</span>
                <span className="max-w-[60%] text-right text-sm font-bold text-foreground">{row.v}</span>
              </div>
            ))}
          </div>
        </ProfilePreviewCard>

        <ProfilePreviewCard
          icon={LanguagesIcon}
          title="Languages & background"
          description="Nationality, ethnicity, languages, habits."
        >
          <div className="grid gap-2">
            {[
              { k: "Nationality", v: user.nationality?.trim() || "—" },
              { k: "Ethnicity", v: labelEthnicity(user.ethnicity) || "—" },
              { k: "Languages", v: formatLanguages(user.languages as string | string[] | null) || "—" },
              { k: "Smoking", v: labelSmoking(user.smoking) || "—" },
              { k: "Alcohol", v: labelAlcohol(user.drinksAlcohol) || "—" },
            ].map((row) => (
              <div
                key={row.k}
                className="flex items-center justify-between gap-3 rounded-2xl bg-stone-50/90 px-3.5 py-3"
              >
                <span className="text-xs font-bold text-muted-foreground">{row.k}</span>
                <span className="max-w-[65%] text-right text-sm font-semibold text-foreground">{row.v}</span>
              </div>
            ))}
          </div>
        </ProfilePreviewCard>

        {typeof user.extraBio === "string" && user.extraBio.trim() ? (
          <ProfilePreviewCard icon={AlignLeft} title="More about them" description="">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{user.extraBio.trim()}</p>
          </ProfilePreviewCard>
        ) : null}
      </motion.div>

      <BottomNav active={activePage} onNavigate={setActivePage} />

      <ShareProfileDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        profileId={user.id}
        displayName={user.name}
      />

      {/* Block/Report Dialog */}
      {user.id !== currentUserId && (
        <BlockReportDialog
          open={blockReportOpen}
          onOpenChange={setBlockReportOpen}
          userId={user.id}
          userName={user.name}
          type={blockReportType}
        />
      )}
    </div>
  );
}
