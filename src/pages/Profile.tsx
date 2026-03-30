import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useSearchParams } from "wouter";
import AddPartnerDialog from "@/components/relationship-coaching/AddPartnerDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";
import {
  Heart,
  Users,
  Sparkles,
  CheckCircle,
  UserMinus,
  Share2,
  MapPin,
  Briefcase,
  X,
  UserRound,
  Globe2,
  Flame,
  Brain,
  GraduationCap,
  Languages as LanguagesIcon,
  AlignLeft,
  HeartHandshake,
} from "lucide-react";
import { LoadingState } from "@/components/common/LoadingState";
import { useCurrentUser } from "@/contexts/UserContext";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { usersService } from "@/services/users.service";
import { reopenAIMatchmakerSession } from "@/services/aiMatchmaker.service";
import { ProfileMarriageIntentBar } from "@/components/profile/ProfileMarriageIntentBar";
import { getReligionLabel, MEET_PREFERENCE_OPTIONS } from "@/lib/religionOptions";
import {
  buildProfileGalleryUrls,
  labelLoveLanguage,
  membershipBadgeLabel,
  sanitizeProfileGalleryUrls,
  splitLocation,
} from "@/lib/profileLabels";
import { labelAlcohol, labelEthnicity, labelSmoking } from "@/lib/profileDemographics";
import ProfileEditTab, { type ProfileEditUser } from "@/components/profile/ProfileEditTab";
import { ProfilePreviewCard } from "@/components/profile/ProfilePreviewCard";
import { ImageLightbox } from "@/components/profile/ImageLightbox";
import { cn } from "@/lib/utils";

type User = ProfileEditUser & {
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
  privacy?: { showOnlineStatus?: boolean } | null;
  lastActiveAt?: string | null;
  createdAt?: string | null;
  selfDiscoveryCompleted?: boolean;
  attractionBlueprint?: unknown;
  commitmentIntention?: string;
  marriageTimeline?: string | null;
  marriageApproach?: string | null;
  wantsChildren?: string | null;
  religion?: string | null;
  meetPreference?: string | null;
  loveLanguage?: string;
  topPriorities?: string[];
  relationshipReadiness?: { score?: number };
  inRelationship?: boolean;
  partnerId?: string | null;
  dealbreakers?: string[] | null;
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

export default function Profile() {
  const [, setLocation] = useLocation();
  const [searchParams] = useSearchParams();
  const marriageMenuFocus = searchParams.get("marriage") === "1";
  const forceEditTab = marriageMenuFocus || searchParams.get("tab") === "edit";
  const [profileTab, setProfileTab] = useState<"preview" | "edit">(() =>
    forceEditTab ? "edit" : "preview",
  );
  const [addPartnerOpen, setAddPartnerOpen] = useState(false);
  const [securityDialogOpen, setSecurityDialogOpen] = useState(false);
  const [lightbox, setLightbox] = useState<{ urls: string[]; index: number } | null>(null);
  const { userId } = useCurrentUser();
  const { toast } = useToast();

  const closeProfile = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
      return;
    }
    setLocation("/menu");
  };

  const { data: user, isLoading } = useQuery<User>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });

  const { data: partner } = useQuery<
    User & { commitmentIntention?: string | null; marriageTimeline?: string | null }
  >({
    queryKey: [`/api/users/${user?.partnerId}`],
    enabled: !!user?.partnerId,
  });

  const removePartner = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Not logged in");
      return usersService.patch(userId, { inRelationship: false, partnerId: null });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
      toast({ title: "Partner removed" });
    },
    onError: () => {
      toast({ title: "Couldn't remove partner", variant: "destructive" });
    },
  });

  const profileAvatarUrl = useMemo(() => {
    if (user?.avatar?.trim()) return user.avatar;
    if (!userId) return null;
    try {
      const raw = localStorage.getItem("currentUser");
      if (!raw) return null;
      const u = JSON.parse(raw) as { id?: string; avatar?: string | null; picture?: string | null };
      if (u.id !== userId) return null;
      return (u.avatar || u.picture || "").trim() || null;
    } catch {
      return null;
    }
  }, [user?.avatar, userId]);

  const profileGalleryUrls = useMemo(
    () =>
      buildProfileGalleryUrls(
        profileAvatarUrl,
        sanitizeProfileGalleryUrls(user?.photos as string[] | null),
      ),
    [profileAvatarUrl, user?.photos],
  );

  useEffect(() => {
    if (forceEditTab) setProfileTab("edit");
  }, [forceEditTab]);

  const goAIMatchmaker = useCallback(async () => {
    if (!userId) {
      setLocation("/ai-matchmaker/flow-b");
      return;
    }
    try {
      await reopenAIMatchmakerSession(userId);
      setLocation("/ai-matchmaker/flow-b");
    } catch {
      toast({
        title: "Could not open questionnaire",
        variant: "destructive",
      });
    }
  }, [userId, setLocation, toast]);

  const openLightbox = useCallback(
    (url: string, urlsOverride?: string[]) => {
      const list =
        urlsOverride && urlsOverride.length > 0
          ? urlsOverride
          : profileGalleryUrls.length > 0
            ? profileGalleryUrls
            : url.trim()
              ? [url.trim()]
              : [];
      if (!list.length) return;
      const u = url.trim();
      let index = u ? list.findIndex((x) => x === u) : 0;
      if (index < 0) index = 0;
      setLightbox({ urls: list, index });
    },
    [profileGalleryUrls],
  );

  const aiMatchmakerSaved = Boolean(user?.attractionBlueprint);
  const { city, country } = splitLocation(user?.location || null);

  const shareProfile = async () => {
    if (!userId || !user) return;
    const url = `${window.location.origin}/profile/${userId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${user.name} · Matchify`, url });
        return;
      }
    } catch {
      /* user cancelled share */
    }
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied", description: "Share your profile with this link." });
    } catch {
      toast({ title: "Copy this link", description: url });
    }
  };

  if (!userId || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingState message="Loading your profile..." showMascot={true} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3 p-4">
        <p className="text-gray-400">Profile not found</p>
        <Button variant="outline" onClick={() => setLocation("/menu")}>
          Go back
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 pb-6">
        {/* Full-screen profile chrome (no app Header / BottomNav) */}
        <div className="sticky top-0 z-50 bg-white">
          <div className="max-w-lg mx-auto w-full pt-[env(safe-area-inset-top)]">
            <div className="flex items-center h-12 px-1">
              <div className="w-11 shrink-0 flex justify-start">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-gray-800"
                  onClick={closeProfile}
                  aria-label="Close profile"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <h1 className="flex-1 min-w-0 text-center text-base font-bold text-gray-900 truncate px-2">
                {user.name}
              </h1>
              <div className="w-11 shrink-0 flex justify-end">
                {profileTab === "preview" ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="rounded-full text-gray-800"
                    onClick={shareProfile}
                    aria-label="Share profile"
                  >
                    <Share2 className="w-5 h-5" />
                  </Button>
                ) : (
                  <span className="inline-block h-10 w-11" aria-hidden />
                )}
              </div>
            </div>
            <div className="flex">
              <button
                type="button"
                onClick={() => setProfileTab("preview")}
                className={cn(
                  "flex-1 py-3 text-sm font-bold relative transition-colors",
                  profileTab === "preview" ? "text-gray-900" : "text-gray-400",
                )}
              >
                Preview
                {profileTab === "preview" && (
                  <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-gray-900 rounded-full" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setProfileTab("edit")}
                className={cn(
                  "flex-1 py-3 text-sm font-bold relative transition-colors",
                  profileTab === "edit" ? "text-gray-900" : "text-gray-400",
                )}
              >
                Edit
                {profileTab === "edit" && (
                  <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-gray-900 rounded-full" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-lg mx-auto">
          {profileTab === "preview" && (
            <div className="space-y-3 px-3 pb-10 pt-2">
              {/* Hero — taller photo area */}
              <div className="overflow-hidden rounded-3xl border border-stone-200/90 bg-white shadow-[0_12px_40px_-20px_rgba(55,30,40,0.25)]">
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
                  {profileAvatarUrl ? (
                    <button
                      type="button"
                      className="absolute inset-0 z-[1] cursor-zoom-in border-0 bg-transparent p-0"
                      onClick={() => openLightbox(profileAvatarUrl)}
                      aria-label="View full size photo"
                    />
                  ) : null}
                  <div
                    className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-t from-black/78 via-black/10 to-transparent"
                    aria-hidden
                  />
                  <div
                    className="absolute left-3 top-3 z-[3] flex flex-wrap items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Badge className="rounded-full border-0 bg-white/95 px-2.5 py-1 text-[10px] font-bold text-gray-900 shadow-md sm:text-xs">
                      {membershipBadgeLabel(user.createdAt)}
                    </Badge>
                    {user.verified ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold text-primary-foreground shadow-md">
                        <CheckCircle className="h-3 w-3" />
                        Verified
                      </span>
                    ) : null}
                  </div>
                  <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-[3] p-4 text-white">
                    <h2 className="font-display text-2xl font-black leading-tight tracking-tight drop-shadow-sm">
                      {user.name}
                      {user.age != null ? (
                        <span className="font-bold text-white/90"> · {user.age}</span>
                      ) : null}
                    </h2>
                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-white/92">
                      {(city || country) && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 opacity-90" />
                          {[city, country].filter(Boolean).join(", ")}
                        </span>
                      )}
                      {user.career ? (
                        <span className="inline-flex items-center gap-1">
                          <Briefcase className="h-3.5 w-3.5 opacity-90" />
                          {user.career}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
                {user.membershipTier && user.membershipTier !== "free" ? (
                  <div className="border-t border-stone-100 bg-stone-50/90 px-4 py-2.5">
                    <p className="text-center text-[11px] font-bold uppercase tracking-wide text-primary">
                      {user.membershipTier} member
                    </p>
                  </div>
                ) : null}
              </div>

              <ProfilePreviewCard
                icon={UserRound}
                title="About me"
                description="A quick hello in your own words."
              >
                <p className="text-sm font-medium leading-relaxed text-foreground/90">
                  {user.bio?.trim() || "Add a short intro from the Edit tab."}
                </p>
              </ProfilePreviewCard>

              <div className="space-y-3">
                <ProfileMarriageIntentBar
                  user={{
                    name: user.name,
                    commitmentIntention: user.commitmentIntention,
                    marriageTimeline: user.marriageTimeline,
                    marriageApproach: user.marriageApproach ?? null,
                    wantsChildren: user.wantsChildren ?? null,
                  }}
                  variant="self"
                />
                {user.partnerId && partner && (
                  <ProfileMarriageIntentBar
                    user={{
                      name: partner.name,
                      commitmentIntention: partner.commitmentIntention,
                      marriageTimeline: partner.marriageTimeline ?? null,
                      marriageApproach: partner.marriageApproach ?? null,
                      wantsChildren: partner.wantsChildren ?? null,
                    }}
                    variant="other"
                  />
                )}
                {user.partnerId && !partner && (
                  <div className="rounded-3xl border-2 border-dashed border-primary/20 bg-primary/[0.04] px-4 py-6 text-center">
                    <p className="text-sm font-medium text-muted-foreground">Loading partner intentions…</p>
                  </div>
                )}
              </div>

              <ProfilePreviewCard
                icon={Globe2}
                title="Faith & communities"
                description="Background and how we highlight groups for you."
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
                    Everyone is welcome — this only helps personalize your feed and matches.
                  </p>
                </div>
              </ProfilePreviewCard>

              <ProfilePreviewCard icon={Flame} title="Interests" description="What you enjoy talking about.">
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
                  <p className="text-sm text-muted-foreground">Add interests from Edit.</p>
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
                    <p className="text-sm text-muted-foreground">Fill this in from Edit.</p>
                  ) : null}
                </div>
              </ProfilePreviewCard>

              <ProfilePreviewCard
                icon={GraduationCap}
                title="Education & career"
                description="Your path and work life."
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
                description="Nationality, ethnicity, languages, and lifestyle habits."
              >
                <div className="grid gap-2">
                  {[
                    { k: "Nationality", v: user.nationality?.trim() || "—" },
                    { k: "Ethnicity", v: labelEthnicity(user.ethnicity) || "—" },
                    {
                      k: "Languages",
                      v: formatLanguages(user.languages as string | string[] | null) || "—",
                    },
                    { k: "Smoking", v: labelSmoking(user.smoking) || "—" },
                    { k: "Alcohol", v: labelAlcohol(user.drinksAlcohol) || "—" },
                  ].map((row) => (
                    <div
                      key={row.k}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-stone-50/90 px-3.5 py-3"
                    >
                      <span className="text-xs font-bold text-muted-foreground">{row.k}</span>
                      <span className="max-w-[65%] text-right text-sm font-semibold text-foreground">
                        {row.v}
                      </span>
                    </div>
                  ))}
                </div>
              </ProfilePreviewCard>

              {typeof user.extraBio === "string" && user.extraBio.trim() ? (
                <ProfilePreviewCard icon={AlignLeft} title="Bio" description="More about you.">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{user.extraBio.trim()}</p>
                </ProfilePreviewCard>
              ) : null}

              <ProfilePreviewCard
                icon={Sparkles}
                title="AI Matchmaker"
                description="Deeper questionnaire for better matches."
              >
                {aiMatchmakerSaved ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">Your answers are saved.</p>
                    {user.relationshipReadiness?.score != null ? (
                      <div className="rounded-2xl bg-stone-50 px-3 py-3">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-bold text-muted-foreground">Readiness</span>
                          <span className="text-sm font-black text-primary">{user.relationshipReadiness.score}%</span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-stone-200">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-primary to-primary/80"
                            style={{ width: `${user.relationshipReadiness.score}%` }}
                          />
                        </div>
                      </div>
                    ) : null}
                    <Button
                      variant="outline"
                      className="h-11 w-full rounded-2xl border-2 border-primary/25 font-bold text-primary hover:bg-primary/5"
                      onClick={() => void goAIMatchmaker()}
                    >
                      <Sparkles className="mr-2 h-4 w-4" /> Update questionnaire
                    </Button>
                  </div>
                ) : (
                  <Button
                    className="h-12 w-full rounded-2xl bg-primary font-black text-primary-foreground shadow-md shadow-primary/20"
                    onClick={() => void goAIMatchmaker()}
                  >
                    Start AI Matchmaker
                  </Button>
                )}
              </ProfilePreviewCard>

              <ProfilePreviewCard
                icon={HeartHandshake}
                title="Relationship coaching"
                description="Partner tools and guided support."
              >
                {user.partnerId ? (
                  <div className="flex items-center gap-3 rounded-2xl border border-stone-100 bg-stone-50/80 p-3">
                    <Avatar className="h-12 w-12 border-2 border-primary/20 shadow-sm">
                      <AvatarImage src={partner?.avatar || undefined} alt={partner?.name} />
                      <AvatarFallback className="bg-primary/10 font-black text-primary">
                        {partner?.name?.slice(0, 2).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-foreground">{partner?.name ?? "…"}</p>
                      {partner?.username ? (
                        <p className="text-xs text-muted-foreground">@{partner.username}</p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        size="sm"
                        className="h-9 rounded-xl bg-primary px-3 font-bold text-primary-foreground"
                        onClick={() => setLocation("/relationship-coaching")}
                      >
                        <Heart className="mr-1 h-3.5 w-3.5" /> Coach
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 rounded-xl border-stone-200"
                        onClick={() => removePartner.mutate()}
                        disabled={removePartner.isPending}
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">Link a partner to unlock coaching.</p>
                    <Button
                      className="mt-3 h-11 w-full rounded-2xl font-black"
                      onClick={() => setAddPartnerOpen(true)}
                    >
                      <Users className="mr-2 h-4 w-4" /> Add partner
                    </Button>
                  </>
                )}
              </ProfilePreviewCard>
            </div>
          )}

          {profileTab === "edit" && (
            <div className="space-y-3 px-3 pb-10 pt-2">
              <ProfileEditTab
                user={user}
                hasPartner={Boolean(user.partnerId)}
                onOpenSecurity={() => setSecurityDialogOpen(true)}
                onOpenAddPartner={() => setAddPartnerOpen(true)}
                onGoCoaching={() => setLocation("/relationship-coaching")}
                onGoAIMatchmaker={goAIMatchmaker}
                onImagePreview={openLightbox}
              />
            </div>
          )}
        </div>

      </div>

      <AddPartnerDialog open={addPartnerOpen} onOpenChange={setAddPartnerOpen} />

      <Dialog open={securityDialogOpen} onOpenChange={setSecurityDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Security &amp; password</DialogTitle>
          </DialogHeader>
          {userId ? (
            <ChangePasswordForm
              userId={userId}
              compact
              onSuccess={() => setSecurityDialogOpen(false)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <ImageLightbox
        open={lightbox != null}
        urls={lightbox?.urls ?? []}
        initialIndex={lightbox?.index ?? 0}
        onClose={() => setLightbox(null)}
      />
    </>
  );
}

