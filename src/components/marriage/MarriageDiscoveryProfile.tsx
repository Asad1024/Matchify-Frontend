import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import { complimentsLeft, consumeCompliment } from "@/lib/entitlements";
import { useUpgrade } from "@/contexts/UpgradeContext";
import { addMarriageComplimented } from "@/lib/marriageDeckStore";
import {
  cancelOutgoingChatRequest,
  createComplimentChatRequest,
  type OutgoingChatRecord,
} from "@/lib/marriageChatRequests";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export type MarriageDiscoveryUser = {
  id: string;
  name: string;
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

function marriageComplimentDraftKey(viewerId: string, targetId: string): string {
  return `matchify_marriage_chat_draft_${viewerId}_${targetId}`;
}

function persistComplimentDraft(viewerId: string, targetId: string, text: string): void {
  try {
    sessionStorage.setItem(marriageComplimentDraftKey(viewerId, targetId), text);
  } catch {
    /* ignore */
  }
}

function readComplimentDraft(viewerId: string, targetId: string): string {
  try {
    return sessionStorage.getItem(marriageComplimentDraftKey(viewerId, targetId)) || "";
  } catch {
    return "";
  }
}

function clearComplimentDraft(viewerId: string, targetId: string): void {
  try {
    sessionStorage.removeItem(marriageComplimentDraftKey(viewerId, targetId));
  } catch {
    /* ignore */
  }
}

type Props = {
  user: MarriageDiscoveryUser;
  me?: MarriageDiscoveryUser | null;
  viewerId: string;
  viewerName: string;
  outgoing: OutgoingChatRecord | null;
  compatibilityScore: number;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onPass: () => void;
  onLike: () => void;
  onShareProfile: () => void;
  onBlock: () => void;
  onReport: () => void;
  onOpenChat: (initialMessage?: string) => void;
  onExploreNext: () => void;
  onComplimentSent?: () => void;
};

export function MarriageDiscoveryProfile({
  user,
  me,
  viewerId,
  viewerName,
  outgoing,
  compatibilityScore,
  isFavorite,
  onToggleFavorite,
  onPass,
  onLike,
  onShareProfile,
  onBlock,
  onReport,
  onOpenChat,
  onExploreNext,
  onComplimentSent,
}: Props) {
  const { toast } = useToast();
  const { tier, requireTier } = useUpgrade();
  const [chatDraft, setChatDraft] = useState("");
  const [congratOpen, setCongratOpen] = useState(false);
  const [complLeft, setComplLeft] = useState(() => complimentsLeft({ userId: viewerId, tier }));

  useEffect(() => {
    setComplLeft(complimentsLeft({ userId: viewerId, tier }));
    if (outgoing?.status === "approved") {
      setChatDraft(readComplimentDraft(viewerId, user.id));
    } else {
      setChatDraft("");
    }
  }, [user.id, viewerId, outgoing?.status, tier]);
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

  const heroImage = user.profileBanner?.trim() || user.avatar?.trim() || null;

  const submitComplimentMessage = async () => {
    if (outgoing?.status === "pending") return;
    const trimmed = chatDraft.trim();
    if (!trimmed) {
      toast({
        title: "Write a message first",
        description: `Tell ${firstName} something thoughtful — then tap Submit.`,
        variant: "destructive",
      });
      return;
    }
    const res = consumeCompliment({ userId: viewerId, tier });
    if (!res.ok) {
      requireTier({
        feature: "Compliments",
        minTier: tier === "free" ? "plus" : "premium",
        reason: tier === "free" ? "Free plan includes 3 compliments/week." : "You’ve hit this week’s limit on Plus.",
      });
      return;
    }
    addMarriageComplimented(user.id);
    await createComplimentChatRequest(viewerId, viewerName, user.id, user.name, trimmed);
    persistComplimentDraft(viewerId, user.id, trimmed);
    setComplLeft(res.left);
    setChatDraft("");
    setCongratOpen(true);
    onComplimentSent?.();
  };

  const tryOpenChat = (draft?: string) => {
    if (outgoing?.status === "pending") return;
    if (outgoing?.status === "rejected") {
      toast({
        title: "Request declined",
        description: `${firstName} declined your chat request.`,
        variant: "destructive",
      });
      return;
    }
    if (outgoing?.status === "cancelled") {
      toast({
        title: "No active request",
        description: "Send another compliment to request chat again (demo).",
      });
      return;
    }
    if (outgoing?.status === "approved") {
      const d = draft?.trim() || readComplimentDraft(viewerId, user.id).trim();
      clearComplimentDraft(viewerId, user.id);
      onOpenChat(d || undefined);
      return;
    }
    toast({
      title: "Wait for a reply",
      description: "They need to approve your chat request first.",
    });
  };

  const showComplimentForm =
    outgoing?.status !== "pending" && outgoing?.status !== "approved";
  const pendingRequest = outgoing?.status === "pending";
  const approvedRequest = outgoing?.status === "approved";
  const rejectedRequest = outgoing?.status === "rejected";

  return (
    <div className="mx-auto w-full max-w-[600px] px-4 pb-[calc(env(safe-area-inset-bottom)+8.5rem)] pt-3">
      <AlertDialog open={congratOpen} onOpenChange={setCongratOpen}>
        <AlertDialogContent className="max-h-[min(90dvh,560px)] max-w-md overflow-y-auto overflow-x-hidden rounded-2xl border-primary/15 bg-gradient-to-b from-white via-primary/[0.04] to-white px-6 pt-8 pb-6 shadow-2xl shadow-primary/10">
          <div className="relative overflow-hidden rounded-2xl">
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl" aria-hidden>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <motion.div
                key={i}
                className="absolute text-primary"
                initial={{ opacity: 0, scale: 0.2, y: 24 }}
                animate={{
                  opacity: [0, 1, 0.85, 0],
                  scale: [0.2, 1, 1.1, 0.6],
                  y: [24, -8, -28, -40],
                  rotate: [0, 12, -8, 20],
                }}
                transition={{
                  duration: 1.35,
                  delay: 0.05 * i,
                  ease: [0.22, 1, 0.36, 1],
                }}
                style={{ left: `${8 + i * 16}%`, top: `${18 + (i % 3) * 8}%` }}
              >
                <Sparkles className="h-5 w-5 drop-shadow-sm" strokeWidth={2} />
              </motion.div>
            ))}
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 22 }}
          >
            <AlertDialogHeader className="relative z-[1] space-y-2 text-center sm:text-center">
              <div className="mx-auto mb-1 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/35 ring-4 ring-primary/15">
                <Sparkles className="h-7 w-7" strokeWidth={2} />
              </div>
              <AlertDialogTitle className="font-display text-2xl font-bold tracking-tight text-stone-900">
                Compliment sent!
              </AlertDialogTitle>
              <AlertDialogDescription className="text-center text-base leading-relaxed text-stone-600">
                You reached out to <span className="font-semibold text-stone-800">{firstName}</span> with a
                thoughtful note. They&apos;ll get a chat request and can accept when they&apos;re ready — and
                you&apos;ll be notified either way.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="relative z-[1] mt-6 flex-col gap-2 sm:flex-col">
              <Button
                type="button"
                className="w-full rounded-xl font-semibold shadow-2xs"
                onClick={() => {
                  setCongratOpen(false);
                  onExploreNext();
                }}
              >
                Explore next profile
              </Button>
              <AlertDialogCancel className="mt-0 w-full rounded-xl border-stone-200 font-semibold">
                Stay on this profile
              </AlertDialogCancel>
            </AlertDialogFooter>
          </motion.div>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        {/* Compact header: small photo + modern pills */}
        <Card className="matchify-surface overflow-hidden border-white/0 bg-card/70 shadow-lg">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-stretch gap-3">
              <div className="relative w-[84px] shrink-0 self-stretch overflow-hidden rounded-2xl border border-stone-200 bg-stone-100 shadow-sm">
                {heroImage ? (
                  <img
                    src={heroImage}
                    alt=""
                    loading="eager"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover [filter:none]"
                    style={{ transform: "translateZ(0)", WebkitBackfaceVisibility: "hidden" }}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/25 via-chart-1/20 to-chart-4/25" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="min-w-0 truncate font-display text-[18px] font-bold leading-tight tracking-[0.2px] text-slate-900">
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
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700">
                      <MapPin className="h-3.5 w-3.5 text-slate-500" strokeWidth={1.75} aria-hidden />
                      <span className="max-w-[16rem] truncate">{user.location}</span>
                    </span>
                  ) : null}
                  {aboutRows.map((row) => (
                    <span
                      key={row.label}
                      className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-[11px] font-semibold text-slate-700"
                      title={row.label}
                    >
                      <span className="text-slate-500">{row.label}:</span>
                      <span className="text-slate-900">{row.value}</span>
                    </span>
                  ))}
                </div>

                {user.bio ? (
                  <p className="mt-3 line-clamp-3 text-[13px] leading-relaxed text-slate-700">
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
                      className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/60 px-3 py-1.5 text-[12px] font-medium text-slate-800 shadow-2xs"
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
              <h3 className="font-display text-base font-semibold text-slate-900">Marriage intention</h3>
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
            <h3 className="mb-3 font-display text-base font-semibold text-slate-900">Heritage &amp; values</h3>

            <div className="space-y-4">
              <div>
                <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Faith &amp; values
                </p>
                <div className="flex flex-wrap gap-2">
                  {faithChips.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex rounded-full border border-border/70 bg-card/60 px-3 py-1.5 text-[12px] font-medium text-slate-800 shadow-2xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  <Languages className="h-4 w-4 text-slate-400" strokeWidth={1.75} aria-hidden />
                  Languages
                </p>
                <div className="flex flex-wrap gap-2">
                  {languageList.map((lang) => (
                    <span
                      key={lang}
                      className="inline-flex rounded-full border border-border/70 bg-card/60 px-3 py-1.5 text-[12px] font-medium text-slate-700 shadow-2xs"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">
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
                      className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/60 px-3 py-1.5 text-[12px] font-medium text-slate-800 shadow-2xs"
                    >
                      <span className="text-slate-500">{row.k}</span>
                      <span className="text-slate-300" aria-hidden>
                        •
                      </span>
                      <span className="text-slate-900">{row.v}</span>
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
              <h2 className="mb-3 font-display text-base font-semibold text-slate-900">Interests</h2>
              <div className="flex flex-wrap gap-2">
                {user.interests.map((interest) => (
                  <span
                    key={interest}
                    className="inline-flex items-center rounded-full border border-border/70 bg-card/60 px-3 py-1.5 text-[12px] font-medium text-slate-700 shadow-2xs transition-colors hover:bg-primary/10 hover:text-primary"
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

        {/* Connect: compliment → share → Fav / Block / Report (Pass / Like: fixed bar below) */}
        <Card className="matchify-surface border-white/0 bg-card/70 shadow-2xs ring-1 ring-border/70">
          <CardContent className="space-y-4 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white shadow-2xs">
                  Connect
                </Badge>
                <span className="text-sm font-semibold text-slate-900">Start a conversation</span>
              </div>
              <span className="inline-flex items-center rounded-full border border-border/70 bg-card/60 px-3 py-1 text-[11px] font-semibold text-slate-700">
                Compliments left: <span className="ml-1 font-bold text-primary tabular-nums">{complLeft}</span>
              </span>
            </div>
            {pendingRequest ? (
              <div className="space-y-3 rounded-xl border border-amber-200/80 bg-amber-50/50 p-4">
                <p className="text-sm font-medium text-stone-800">
                  Chat request sent. {firstName} can approve or decline from their profile.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-xl border-stone-300 font-semibold text-stone-800"
                  onClick={() => cancelOutgoingChatRequest(viewerId, user.id)}
                >
                  Cancel chat request
                </Button>
              </div>
            ) : approvedRequest ? (
              <div className="space-y-3">
                <h3 className="font-display text-base font-bold leading-snug text-stone-900">
                  Don&apos;t wait — chat with {firstName} now
                </h3>
                <p className="text-sm font-medium text-emerald-800">
                  {firstName} accepted your chat request. Your saved message can go with you to Chat.
                </p>
                <div className="rounded-[24px] border border-border/70 bg-card/60 px-4 py-3 shadow-2xs">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Message
                  </label>
                  <Textarea
                    value={chatDraft}
                    onChange={(e) => setChatDraft(e.target.value)}
                    placeholder="Edit your message before opening Chat…"
                    rows={4}
                    className="mt-2 min-h-[100px] resize-y rounded-2xl border-0 bg-transparent p-0 text-[15px] leading-relaxed text-slate-900 shadow-none placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                <Button
                  type="button"
                  className="w-full gap-2 rounded-xl font-bold"
                  onClick={() => tryOpenChat(chatDraft)}
                >
                  <MessageCircle className="h-4 w-4" />
                  Open chat
                </Button>
              </div>
            ) : (
              <>
                {rejectedRequest ? (
                  <p className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-3 text-sm text-stone-600">
                    {firstName} declined your chat request. You can send a new compliment if you have any
                    left.
                  </p>
                ) : null}

                {showComplimentForm ? (
                  <div className="space-y-3">
                    <h3 className="font-display text-base font-bold leading-snug text-stone-900 sm:text-lg">
                      Don&apos;t wait — chat with {firstName} now
                    </h3>
                    <div className="rounded-[24px] border border-border/70 bg-card/60 px-4 py-3 shadow-2xs">
                      <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Chat now
                      </label>
                      <Textarea
                        value={chatDraft}
                        onChange={(e) => setChatDraft(e.target.value)}
                        disabled={complLeft < 1}
                        placeholder={
                          complLeft < 1
                            ? "Get more compliments from Menu to send a message…"
                            : `Say hi to ${firstName} — a warm line goes a long way…`
                        }
                        rows={5}
                        className="mt-2 min-h-[120px] resize-y rounded-2xl border-0 bg-transparent p-0 text-[15px] leading-relaxed text-slate-900 shadow-none placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0 disabled:opacity-60"
                      />
                    </div>
                    <Button
                      type="button"
                      className="h-[30px] w-full rounded-full bg-primary text-[12px] font-semibold text-white shadow-2xs hover:brightness-[0.98]"
                      disabled={complLeft < 1 || !chatDraft.trim()}
                      onClick={submitComplimentMessage}
                    >
                      Submit
                    </Button>
                    {complLeft < 1 ? (
                      <p className="text-center text-xs text-stone-500">
                        You&apos;re out of compliments. Check Menu or subscriptions (demo).
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full gap-2 rounded-xl border-stone-200 font-semibold"
                onClick={onShareProfile}
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full gap-2 rounded-xl border-stone-200 font-semibold"
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
                  "inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-card/60 text-slate-700 shadow-2xs transition-colors hover:bg-card",
                )}
              >
                <Ban className="h-5 w-5" strokeWidth={1.75} aria-hidden />
              </button>
              <button
                type="button"
                onClick={onReport}
                title="Report"
                aria-label="Report"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-card/60 text-slate-700 shadow-2xs transition-colors hover:bg-card"
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
