import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Heart,
  Check,
  BadgeCheck,
  MessageCircle,
  Star,
  Flag,
  Sparkles,
  Share2,
  Ban,
  X,
  ChefHat,
  Dumbbell,
  Mountain,
  BookOpen,
  Music2,
  Plane,
  Coffee,
  Languages,
} from "lucide-react";
import { MuzzMarriageTimeline } from "@/components/muzz/MuzzMarriageTimeline";
import { getReligionLabel } from "@/lib/religionOptions";
import { labelAlcohol, labelEthnicity, labelSmoking } from "@/lib/profileDemographics";
import { postChatRequestToUser, DEFAULT_CHAT_REQUEST_MESSAGE } from "@/lib/requestChatWithUser";
import { useToast } from "@/hooks/use-toast";
import { useUpgrade } from "@/contexts/UpgradeContext";
import { cn } from "@/lib/utils";
import { displayImageUrl } from "@/lib/displayImageUrl";

export type MarriageDiscoveryUser = {
  id: string;
  name: string;
  /** Used for opposite-gender deck filtering (from `/api/users` + `/api/users/:id`). */
  gender?: string | null;
  age: number | null;
  location: string | null;
  bio: string | null;
  avatar: string | null;
  interests: string[] | null;
  verified: boolean | null;
  profileBanner?: string | null;
  commitmentIntention?: string | null;
  marriageTimeline?: string | null;
  marriageApproach?: string | null;
  wantsChildren?: string | null;
  religion?: string | null;
  values?: string[] | null;
  height?: string | null;
  heightCm?: number | null;
  maritalStatus?: string | null;
  hasChildren?: string | boolean | null;
  nationality?: string | null;
  ethnicity?: string | null;
  languages?: string | string[] | null;
  smoking?: string | null;
  drinksAlcohol?: string | null;
};

function hashId(id: string) {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return sum;
}

function interestGlyph(interest: string) {
  const t = interest.trim().toLowerCase();
  if (!t) return Sparkles;
  if (/(cook|food|bake|chef|kitchen)/.test(t)) return ChefHat;
  if (/(gym|fitness|workout|run|lifting)/.test(t)) return Dumbbell;
  if (/(hike|mountain|outdoor|camp)/.test(t)) return Mountain;
  if (/(read|book)/.test(t)) return BookOpen;
  if (/(music|song|concert)/.test(t)) return Music2;
  if (/(travel|trip|flight|explore)/.test(t)) return Plane;
  if (/(coffee|cafe|tea)/.test(t)) return Coffee;
  return Sparkles;
}

function aboutMeRows(user: MarriageDiscoveryUser): { label: string; value: string }[] {
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

function faithChipsFor(user: MarriageDiscoveryUser): string[] {
  const tags: string[] = [];
  if (user.religion && user.religion !== "prefer_not_say") {
    tags.push(getReligionLabel(user.religion));
  }
  if (user.values?.length) {
    tags.push(...user.values.filter(Boolean).slice(0, 4));
  }
  if (!tags.length) {
    const h = hashId(user.id || "x");
    const pool = ["Values-led", "Family-oriented", "Open-minded", "Community-minded"];
    tags.push(pool[h % pool.length], pool[(h + 1) % pool.length]);
  }
  return Array.from(new Set(tags)).slice(0, 5);
}

function normalizeLanguageList(raw: MarriageDiscoveryUser["languages"]): string[] {
  if (Array.isArray(raw)) return raw.map((x) => String(x || "").trim()).filter(Boolean);
  if (typeof raw === "string" && raw.trim()) {
    return raw
      .split(/[,·|/]/g)
      .map((x) => x.trim())
      .filter(Boolean);
  }
  return [];
}

function languagesForUser(id: string): string {
  const pool = ["English", "Arabic", "Urdu", "French", "Hindi", "Spanish"];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const a = pool[h % pool.length];
  const b = pool[(h >> 4) % pool.length];
  return a === b ? a : `${a} · ${b}`;
}

export type MarriageMessageRequestStatus = "none" | "pending" | "declined" | "accepted";

type Props = {
  user: MarriageDiscoveryUser;
  me?: MarriageDiscoveryUser | null;
  viewerId: string;
  messageRequestStatus: MarriageMessageRequestStatus;
  compatibilityScore: number;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onPass: () => void;
  onLike: () => void;
  onShareProfile: () => void;
  onBlock: () => void;
  onReport: () => void;
  onOpenChat: (initialMessage?: string) => void;
  onMessageRequestSent?: () => void;
};

export function MarriageDiscoveryProfile({
  user,
  me,
  viewerId,
  messageRequestStatus,
  compatibilityScore,
  isFavorite,
  onToggleFavorite,
  onPass,
  onLike,
  onShareProfile,
  onBlock,
  onReport,
  onOpenChat,
  onMessageRequestSent,
}: Props) {
  const { toast } = useToast();
  const { openUpgrade } = useUpgrade();
  const [sendingRequest, setSendingRequest] = useState(false);
  const firstName = user.name.split(/\s+/)[0] || user.name;
  const aboutRows = aboutMeRows(user);
  const faithChips = faithChipsFor(user);
  const languageList =
    normalizeLanguageList(user.languages).length > 0
      ? normalizeLanguageList(user.languages)
      : languagesForUser(user.id).split(" · ").map((x) => x.trim()).filter(Boolean);

  const sharedInterests = useMemo(() => {
    if (!me?.interests?.length || !user.interests?.length) return [];
    const mine = new Set(me.interests);
    return user.interests.filter((x) => mine.has(x));
  }, [me, user]);

  const heroImage = (() => {
    const raw = user.profileBanner?.trim() || user.avatar?.trim() || null;
    if (!raw) return null;
    return displayImageUrl(raw) || raw;
  })();

  const sendMessageRequest = async () => {
    if (messageRequestStatus === "pending" || sendingRequest) return;
    setSendingRequest(true);
    try {
      const result = await postChatRequestToUser({
        fromUserId: viewerId,
        toUserId: user.id,
        message: DEFAULT_CHAT_REQUEST_MESSAGE,
      });
      if (result.ok) {
        toast({
          title: "Request sent",
          description: "They’ll get a notification to accept or decline.",
        });
        onMessageRequestSent?.();
      } else if (
        result.code === "CHAT_REQUEST_DAILY_LIMIT" &&
        result.minTier
      ) {
        openUpgrade({
          feature: "More message requests",
          minTier: result.minTier,
          reason: result.message,
        });
      } else {
        toast({
          title: "Could not send request",
          description: result.message,
          variant: "destructive",
        });
      }
    } finally {
      setSendingRequest(false);
    }
  };

  const openChatIfAccepted = () => {
    if (messageRequestStatus === "accepted") {
      onOpenChat();
      return;
    }
    toast({
      title: "Wait for a reply",
      description: "They need to accept your message request first.",
    });
  };

  const pendingRequest = messageRequestStatus === "pending";
  const approvedRequest = messageRequestStatus === "accepted";
  const rejectedRequest = messageRequestStatus === "declined";
  const canSendMessageRequest = messageRequestStatus === "none" || messageRequestStatus === "declined";

  return (
    <div className="mx-auto w-full max-w-[600px] px-4 pb-[calc(env(safe-area-inset-bottom)+8.5rem)] pt-3">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        {/* Compact header: small photo + modern pills */}
        <Card className="matchify-surface overflow-hidden border-white/0 bg-card/70 shadow-lg">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-stretch gap-3">
              <div className="relative w-[84px] shrink-0 self-stretch overflow-hidden rounded-2xl border border-border bg-muted shadow-sm">
                {heroImage ? (
                  <img
                    src={heroImage}
                    alt=""
                    loading="eager"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover object-center [filter:none]"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/25 via-chart-1/20 to-chart-4/25" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="min-w-0 truncate font-display text-[18px] font-bold leading-tight tracking-[0.2px] text-foreground">
                    {user.name}
                    {user.age != null ? `, ${user.age}` : ""}
                  </h1>
                  {user.verified ? (
                    <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary ring-1 ring-primary/15">
                      <BadgeCheck className="mr-1 h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
                      Verified
                    </span>
                  ) : null}
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-white shadow-2xs">
                    {compatibilityScore}% match
                  </span>
                  {user.location ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-[11px] font-semibold text-foreground/90">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} aria-hidden />
                      <span className="max-w-[16rem] truncate">{user.location}</span>
                    </span>
                  ) : null}
                  {aboutRows.map((row) => (
                    <span
                      key={row.label}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-[11px] font-semibold text-foreground/90"
                      title={row.label}
                    >
                      <span className="text-muted-foreground">{row.label}:</span>
                      <span className="text-foreground">{row.value}</span>
                    </span>
                  ))}
                </div>

                {user.bio ? (
                  <p className="mt-3 line-clamp-3 text-[13px] leading-relaxed text-muted-foreground">
                    {user.bio}
                  </p>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        {sharedInterests.length > 0 ? (
          <Card className="matchify-surface border-white/0 bg-card/70 shadow-2xs">
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary ring-1 ring-primary/15">
                  Common ground
                </span>
                {sharedInterests.slice(0, 10).map((interest) => {
                  const Icon = interestGlyph(interest);
                  return (
                    <span
                      key={interest}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/60 px-3 py-1.5 text-[12px] font-medium text-foreground shadow-2xs"
                      title={interest}
                    >
                      <Icon className="h-4 w-4 text-primary" strokeWidth={1.75} aria-hidden />
                      <span className="max-w-[14rem] truncate">{interest}</span>
                    </span>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card className="matchify-surface border-white/0 bg-card/70 shadow-2xs">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-display text-base font-semibold text-foreground">Marriage intention</h3>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
                {firstName}
              </span>
            </div>
            <div className="mt-3">
              <MuzzMarriageTimeline
                firstName={firstName}
                commitmentIntention={user.commitmentIntention}
                marriageTimeline={user.marriageTimeline}
                marriageApproach={user.marriageApproach}
                wantsChildren={user.wantsChildren != null ? String(user.wantsChildren) : null}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="matchify-surface border-white/0 bg-card/70 shadow-2xs">
          <CardContent className="p-4 sm:p-5">
            <h3 className="mb-3 font-display text-base font-semibold text-foreground">Heritage &amp; values</h3>

            <div className="space-y-4">
              <div>
                <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Faith &amp; values
                </p>
                <div className="flex flex-wrap gap-2">
                  {faithChips.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex rounded-full border border-border/70 bg-card/60 px-3 py-1.5 text-[12px] font-medium text-foreground shadow-2xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  <Languages className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} aria-hidden />
                  Languages
                </p>
                <div className="flex flex-wrap gap-2">
                  {languageList.map((lang) => (
                    <span
                      key={lang}
                      className="inline-flex rounded-full border border-border/70 bg-card/60 px-3 py-1.5 text-[12px] font-medium text-foreground/90 shadow-2xs"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Background
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { k: "Nationality", v: user.nationality?.trim() || "—" },
                    { k: "Ethnicity", v: labelEthnicity(user.ethnicity) || "—" },
                    { k: "Smoking", v: labelSmoking(user.smoking) || "—" },
                    { k: "Alcohol", v: labelAlcohol(user.drinksAlcohol) || "—" },
                  ].map((row) => (
                    <span
                      key={row.k}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/60 px-3 py-1.5 text-[12px] font-medium text-foreground shadow-2xs"
                    >
                      <span className="text-muted-foreground">{row.k}</span>
                      <span className="text-muted-foreground/30" aria-hidden>
                        •
                      </span>
                      <span className="text-foreground">{row.v}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {user.interests && user.interests.length > 0 ? (
          <Card className="matchify-surface border-white/0 bg-card/70 shadow-2xs">
            <CardContent className="p-4 sm:p-6">
              <h2 className="mb-3 font-display text-base font-semibold text-foreground">Interests</h2>
              <div className="flex flex-wrap gap-2">
                {user.interests.map((interest) => (
                  <span
                    key={interest}
                    className="inline-flex items-center rounded-full border border-border/70 bg-card/60 px-3 py-1.5 text-[12px] font-medium text-foreground/90 shadow-2xs transition-colors hover:bg-primary/10 hover:text-primary"
                    title={interest}
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Bio shown in header (keep page compact). */}

        {/* Connect: message request (same flow as profile chat requests) → share / fav / block */}
        <Card className="matchify-surface border-white/0 bg-card/70 shadow-2xs ring-1 ring-border/70">
          <CardContent className="space-y-4 p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white shadow-2xs">
                Connect
              </Badge>
              <span className="text-sm font-semibold text-foreground">Start a conversation</span>
            </div>
            {pendingRequest ? (
              <div className="space-y-3 rounded-xl border border-amber-200/80 bg-amber-50/50 p-4">
                <p className="text-sm font-medium text-foreground">
                  Request sent. {firstName} can accept or decline from their notifications.
                </p>
              </div>
            ) : approvedRequest ? (
              <div className="space-y-3">
                <p className="text-sm font-medium text-emerald-800">
                  {firstName} accepted your message request.
                </p>
                <Button type="button" className="w-full gap-2 rounded-xl font-bold" onClick={openChatIfAccepted}>
                  <MessageCircle className="h-4 w-4" />
                  Open chat
                </Button>
              </div>
            ) : (
              <>
                {rejectedRequest ? (
                  <p className="rounded-xl border border-border bg-muted/40 px-3 py-3 text-sm text-muted-foreground">
                    {firstName} declined your last request. You can send another message request.
                  </p>
                ) : null}

                {canSendMessageRequest ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Send a message request — they approve in notifications, then you can chat.
                    </p>
                    <Button
                      type="button"
                      className="w-full gap-2 rounded-xl font-bold"
                      disabled={sendingRequest}
                      onClick={() => void sendMessageRequest()}
                    >
                      <MessageCircle className="h-4 w-4" />
                      {sendingRequest ? "Sending…" : "Message"}
                    </Button>
                  </div>
                ) : null}
              </>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full gap-2 rounded-xl border-border font-semibold"
                onClick={onShareProfile}
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full gap-2 rounded-xl border-border font-semibold"
                onClick={onToggleFavorite}
              >
                <Star className={cn("h-4 w-4", isFavorite && "fill-current")} strokeWidth={1.75} aria-hidden />
                {isFavorite ? "Favorited" : "Favorite"}
              </Button>
            </div>

            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={onBlock}
                title="Block"
                aria-label="Block"
                className={cn(
                  "inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-card/60 text-foreground/80 shadow-2xs transition-colors hover:bg-card",
                )}
              >
                <Ban className="h-5 w-5" strokeWidth={1.75} aria-hidden />
              </button>
              <button
                type="button"
                onClick={onReport}
                title="Report"
                aria-label="Report"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-card/60 text-foreground/80 shadow-2xs transition-colors hover:bg-card"
              >
                <Flag className="h-5 w-5" strokeWidth={1.75} aria-hidden />
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Pass + Like: always visible thin overlay above tab bar */}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[48]"
        role="toolbar"
        aria-label="Pass or like this profile"
      >
        <div className="pointer-events-auto mx-auto max-w-[600px] px-20 pb-[calc(env(safe-area-inset-bottom)+6.1rem)] pt-0">
          <div className="flex w-full items-center justify-between">
            <button
              type="button"
              aria-label="Pass"
              onClick={onPass}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-black text-white shadow-md shadow-black/20 transition-all hover:bg-black/90 active:scale-95"
            >
              <X className="h-5 w-5" strokeWidth={2.5} />
            </button>
            <button
              type="button"
              aria-label="Like"
              onClick={onLike}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-all hover:brightness-[0.98] active:scale-95"
            >
              <Check className="h-5 w-5" strokeWidth={2.6} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
