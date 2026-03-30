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
  CheckCircle,
  MessageCircle,
  Star,
  Flag,
  Sparkles,
  Ruler,
  Baby,
  Share2,
  Ban,
  X,
} from "lucide-react";
import { MuzzMarriageTimeline } from "@/components/muzz/MuzzMarriageTimeline";
import { getReligionLabel } from "@/lib/religionOptions";
import { labelAlcohol, labelEthnicity, labelSmoking } from "@/lib/profileDemographics";
import { getCompliments, setCompliments } from "@/lib/muzzEconomy";
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
  const [chatDraft, setChatDraft] = useState("");
  const [congratOpen, setCongratOpen] = useState(false);
  const [complLeft, setComplLeft] = useState(() => getCompliments());

  useEffect(() => {
    setComplLeft(getCompliments());
    if (outgoing?.status === "approved") {
      setChatDraft(readComplimentDraft(viewerId, user.id));
    } else {
      setChatDraft("");
    }
  }, [user.id, viewerId, outgoing?.status]);
  const firstName = user.name.split(/\s+/)[0] || user.name;
  const aboutRows = aboutMeRows(user);
  const faithChips = faithChipsFor(user);
  const languagesLabel = (() => {
    if (Array.isArray(user.languages) && user.languages.length) {
      return user.languages.filter(Boolean).join(" · ");
    }
    if (typeof user.languages === "string" && user.languages.trim()) {
      return user.languages.trim();
    }
    return languagesForUser(user.id);
  })();

  const sharedInterests = useMemo(() => {
    if (!me?.interests?.length || !user.interests?.length) return [];
    const mine = new Set(me.interests);
    return user.interests.filter((x) => mine.has(x));
  }, [me, user]);

  const heroImage = user.profileBanner?.trim() || user.avatar?.trim() || null;

  const submitComplimentMessage = () => {
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
    const n = getCompliments();
    if (n < 1) {
      toast({
        title: "No compliments left",
        description: "Open Menu or Subscriptions to get more (demo).",
        variant: "destructive",
      });
      return;
    }
    setCompliments(n - 1);
    addMarriageComplimented(user.id);
    createComplimentChatRequest(viewerId, viewerName, user.id, user.name);
    persistComplimentDraft(viewerId, user.id, trimmed);
    setComplLeft(getCompliments());
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
    <div className="mx-auto w-full max-w-lg px-4 pb-[calc(env(safe-area-inset-bottom)+8rem)] pt-2">
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
                className="w-full rounded-xl font-bold shadow-md shadow-primary/20"
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
        {/* Large hero — same feel as full profile preview */}
        <div className="relative aspect-[3/4] max-h-[min(72vh,520px)] w-full overflow-hidden rounded-2xl border border-stone-200/80 bg-stone-100 shadow-sm">
          {heroImage ? (
            <img
              src={heroImage}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/25 via-chart-1/20 to-chart-4/25" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <div className="flex items-end gap-3">
              <Avatar className="h-16 w-16 border-2 border-white/90 shadow-lg">
                <AvatarImage src={user.avatar || undefined} alt={user.name} />
                <AvatarFallback className="bg-primary/30 text-lg font-bold text-white">
                  {user.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h1 className="font-display text-xl font-bold leading-tight truncate">
                  {user.name}
                  {user.age != null ? `, ${user.age}` : ""}
                </h1>
                {user.location ? (
                  <div className="mt-1 flex items-center gap-1 text-sm text-white/90">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{user.location}</span>
                  </div>
                ) : null}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge className="border-0 bg-white/20 text-white backdrop-blur-sm">
                    {compatibilityScore}% match
                  </Badge>
                  {user.verified ? (
                    <Badge className="border-0 bg-sky-500/90 text-white gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Verified
                    </Badge>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>

        {sharedInterests.length > 0 ? (
          <Card className="border-primary/20 bg-primary/[0.04]">
            <CardContent className="p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-primary">You both like</p>
              <div className="flex flex-wrap gap-2">
                {sharedInterests.map((interest) => (
                  <Badge key={interest} variant="secondary" className="border-primary/20 bg-white">
                    {interest}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card className="border-stone-200/80 bg-white shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <h3 className="mb-4 font-display text-base font-semibold text-foreground">About me</h3>
            <div className="space-y-3">
              {aboutRows.map((row, i) => {
                const Icon = i === 0 ? Ruler : i === 1 ? Heart : Baby;
                return (
                  <div
                    key={row.label}
                    className="flex items-center gap-3 rounded-xl border border-stone-100 bg-stone-50/90 px-3 py-2.5"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-600">
                      <Icon className="h-4 w-4" strokeWidth={2} />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-stone-500">{row.label}</span>
                      <Badge
                        variant="secondary"
                        className="border-stone-200 bg-white font-semibold text-stone-800 shadow-sm"
                      >
                        {row.value}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <MuzzMarriageTimeline
          firstName={firstName}
          commitmentIntention={user.commitmentIntention}
          marriageTimeline={user.marriageTimeline}
          marriageApproach={user.marriageApproach}
          wantsChildren={user.wantsChildren != null ? String(user.wantsChildren) : null}
        />

        <Card className="border-stone-200/80 bg-white shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <h3 className="mb-3 font-display text-base font-semibold text-foreground">Faith & values</h3>
            <div className="flex flex-wrap gap-2">
              {faithChips.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="rounded-full border-stone-200/80 bg-stone-100 px-3 py-1.5 text-sm font-medium text-stone-800"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-200/80 bg-white shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <h3 className="mb-3 font-display text-base font-semibold text-foreground">
              Languages &amp; background
            </h3>
            <ul className="space-y-2 text-sm text-stone-800">
              <li className="flex justify-between gap-2">
                <span className="text-stone-500">Nationality</span>
                <span className="font-medium text-right">{user.nationality?.trim() || "—"}</span>
              </li>
              <li className="flex justify-between gap-2">
                <span className="text-stone-500">Ethnicity</span>
                <span className="font-medium text-right">{labelEthnicity(user.ethnicity) || "—"}</span>
              </li>
              <li className="flex justify-between gap-2">
                <span className="text-stone-500">Languages</span>
                <span className="font-medium text-right">{languagesLabel}</span>
              </li>
              <li className="flex justify-between gap-2">
                <span className="text-stone-500">Smoking</span>
                <span className="font-medium text-right">{labelSmoking(user.smoking) || "—"}</span>
              </li>
              <li className="flex justify-between gap-2">
                <span className="text-stone-500">Alcohol</span>
                <span className="font-medium text-right">{labelAlcohol(user.drinksAlcohol) || "—"}</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {user.interests && user.interests.length > 0 ? (
          <Card>
            <CardContent className="p-4 sm:p-6">
              <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Interests</h2>
              <div className="flex flex-wrap gap-2">
                {user.interests.map((interest) => (
                  <Badge
                    key={interest}
                    variant="secondary"
                    className="border-primary/20 bg-primary/10 px-4 py-1.5 text-primary"
                  >
                    {interest}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {user.bio ? (
          <Card className="border-stone-200/80 bg-white shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <h2 className="mb-3 font-display text-lg font-semibold text-foreground">Bio</h2>
              <p className="leading-relaxed text-foreground">{user.bio}</p>
            </CardContent>
          </Card>
        ) : null}

        {/* Connect: compliment → share → Fav / Block / Report (Pass / Like: fixed bar below) */}
        <Card className="border-stone-200/80 bg-white shadow-sm ring-1 ring-stone-100/80">
          <CardContent className="space-y-4 p-4 sm:p-5">
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
                <div className="flex items-start justify-between gap-2">
                  <Badge
                    variant="outline"
                    className="shrink-0 border-primary/25 bg-primary/[0.06] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary"
                  >
                    Compliment
                  </Badge>
                </div>
                <h3 className="font-display text-base font-bold leading-snug text-stone-900">
                  Don&apos;t wait — chat with {firstName} now
                </h3>
                <p className="text-sm font-medium text-emerald-800">
                  {firstName} accepted your chat request. Your saved message can go with you to Chat.
                </p>
                <Textarea
                  value={chatDraft}
                  onChange={(e) => setChatDraft(e.target.value)}
                  placeholder="Edit your message before opening Chat…"
                  rows={4}
                  className="min-h-[100px] resize-y rounded-xl border-stone-200 bg-stone-50/90 text-sm"
                />
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
                    <div className="flex items-center justify-between gap-2">
                      <Badge
                        variant="outline"
                        className="border-primary/25 bg-primary/[0.06] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary"
                      >
                        Compliment
                      </Badge>
                      <span className="text-xs font-bold text-primary tabular-nums">{complLeft} left</span>
                    </div>
                    <h3 className="font-display text-base font-bold leading-snug text-stone-900 sm:text-lg">
                      Don&apos;t wait — chat with {firstName} now
                    </h3>
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
                      className="min-h-[120px] resize-y rounded-xl border-stone-200 bg-white text-sm shadow-inner disabled:opacity-60"
                    />
                    <Button
                      type="button"
                      className="h-11 w-full rounded-xl font-bold shadow-md shadow-primary/15"
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

            <Button
              type="button"
              variant="outline"
              className="h-11 w-full gap-2 rounded-xl border-stone-200 font-semibold"
              onClick={onShareProfile}
            >
              <Share2 className="h-4 w-4" />
              Share profile
            </Button>

            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={onToggleFavorite}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 rounded-2xl border-2 bg-white py-4 shadow-sm transition-colors",
                  isFavorite
                    ? "border-amber-300 bg-amber-50/90 text-amber-800"
                    : "border-stone-200 text-stone-700 hover:border-stone-300 hover:bg-stone-50",
                )}
              >
                <Star className={cn("h-6 w-6", isFavorite && "fill-current")} strokeWidth={2} />
                <span className="text-[11px] font-bold tracking-wide">Fav</span>
              </button>
              <button
                type="button"
                onClick={onBlock}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-stone-200 bg-white py-4 text-stone-700 shadow-sm transition-colors hover:border-stone-300 hover:bg-stone-50"
              >
                <Ban className="h-6 w-6" strokeWidth={2} />
                <span className="text-[11px] font-bold tracking-wide">Block</span>
              </button>
              <button
                type="button"
                onClick={onReport}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-stone-200 bg-white py-4 text-stone-700 shadow-sm transition-colors hover:border-stone-300 hover:bg-stone-50"
              >
                <Flag className="h-6 w-6" strokeWidth={2} />
                <span className="text-[11px] font-bold tracking-wide">Report</span>
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
        <div className="pointer-events-auto mx-auto max-w-lg px-4 pb-[calc(env(safe-area-inset-bottom)+4.7rem)] pt-1.5">
          <div className="flex w-full items-center justify-between rounded-2xl border border-stone-200/50 bg-white/65 py-2.5 pl-2 pr-2 backdrop-blur-md shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.18)]">
            <button
              type="button"
              aria-label="Pass"
              onClick={onPass}
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-black text-white shadow-lg shadow-black/25 transition-all hover:bg-black/90 hover:shadow-xl active:scale-95"
            >
              <X className="h-6 w-6" strokeWidth={2.5} />
            </button>
            <button
              type="button"
              aria-label="Like"
              onClick={onLike}
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#722F37] text-white shadow-lg shadow-[#722F37]/35 transition-all hover:bg-[#652a31] hover:shadow-xl active:scale-95"
            >
              <Check className="h-6 w-6" strokeWidth={2.6} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
