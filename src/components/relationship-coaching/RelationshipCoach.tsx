import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Heart,
  MessageSquare,
  Send,
  Sparkles,
  Users,
  Loader2,
  CalendarDays,
  Eye,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { lunaFetch, lunaHeaders } from "@/lib/lunaApi";
import { cn } from "@/lib/utils";
import { useUpgrade } from "@/contexts/UpgradeContext";
import { dailyKey, dailyCount, incrementDailyCount, lunaPartnerDailyLimitForTier } from "@/lib/entitlements";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface RelationshipCoachProps {
  userId: string;
  partnerId?: string | null;
}

type PartnerUser = {
  id: string;
  name: string;
  avatar?: string | null;
};

type MatchRow = {
  id: string;
  /** Other user's id — use for Luna (match row `id` is the match record). */
  partnerUserId?: string;
  name: string;
};

type LunaSpace = {
  id: string;
  ownerUserId: string;
  partnerUserId: string;
  shareMode: "private_only" | "share_summaries" | "share_actions" | "shared_full";
  status: string;
  partner?: PartnerUser | null;
};

type LunaMessage = {
  id: string;
  senderRole: "user" | "luna" | string;
  content: string;
};

type DateSuggestion = {
  title: string;
  planDate: string | null;
  planTime: string | null;
  venue: string | null;
  notes: string | null;
};

type PartnerSpaceSummary = {
  spaceId: string;
  shareMode: string;
  owner: PartnerUser | null;
  weeklyRecap?: string;
  messages?: { id: string; senderRole: string; content: string }[];
  milestones?: { id: string; title: string; body?: string | null; visibleToPartner?: boolean }[];
  datePlans?: unknown[];
};

type JourneyPayload = {
  milestones: { id: string; title: string; body?: string | null; visibleToPartner?: boolean; createdAt?: string }[];
  datePlans: {
    id: string;
    title: string;
    planDate?: string | null;
    planTime?: string | null;
    venue?: string | null;
    notes?: string | null;
    status?: string | null;
    createdAt?: string;
  }[];
  weeklyRecap: string;
  disclaimer: string;
};

export default function RelationshipCoach({ userId, partnerId }: RelationshipCoachProps) {
  const [question, setQuestion] = useState("");
  const [activeSection, setActiveSection] = useState<"chat" | "journey">("chat");
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(partnerId || "");
  const [resetOpen, setResetOpen] = useState(false);
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [milestoneBody, setMilestoneBody] = useState("");
  // Milestones are private notes for now; partner sharing can be added later.
  const [milestoneShare, setMilestoneShare] = useState(false);
  const [schedulePlanId, setSchedulePlanId] = useState<string>("");
  const [scheduleDate, setScheduleDate] = useState<string>("");
  const [scheduleTime, setScheduleTime] = useState<string>("");
  const [scheduleNotifyPartner, setScheduleNotifyPartner] = useState<boolean>(false);
  const upcomingAlertKeyRef = useRef<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { tier, requireTier } = useUpgrade();

  const { data: matches = [] } = useQuery<MatchRow[]>({
    queryKey: [`/api/users/${userId}/matches`],
    enabled: !!userId,
  });

  const { data: spaces = [] } = useQuery<LunaSpace[]>({
    queryKey: [`/api/users/${userId}/luna/spaces`, "auth"],
    enabled: !!userId,
    queryFn: async () => {
      const res = await lunaFetch(`/api/users/${userId}/luna/spaces`);
      if (res.status === 401) {
        toast({ title: "Sign in required", description: "Refresh the page or log in again.", variant: "destructive" });
        return [];
      }
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: partnerSpaces = [] } = useQuery<PartnerSpaceSummary[]>({
    queryKey: ["/api/luna/partner/summary"],
    queryFn: async () => {
      const res = await lunaFetch("/api/luna/partner/summary");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const activeSpace = useMemo(() => {
    if (selectedPartnerId) {
      const byPartner = spaces.find((s) => s.partnerUserId === selectedPartnerId);
      // Selected partner, but no space yet — show the "add" empty state.
      return byPartner || null;
    }
    // No selection yet — show nothing until user picks a match.
    return null;
  }, [spaces, selectedPartnerId]);

  // If a partner is pre-selected via prop, jump to chat when a space exists.
  useEffect(() => {
    if (!selectedPartnerId) return;
    if (!activeSpace?.id) return;
    if (activeSection !== "chat" && activeSection !== "journey") setActiveSection("chat");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPartnerId, activeSpace?.id]);

  const { data: messages = [] } = useQuery<LunaMessage[]>({
    queryKey: [`/api/users/${userId}/luna/spaces/${activeSpace?.id}/messages`, "auth"],
    enabled: !!activeSpace?.id,
    queryFn: async () => {
      const res = await lunaFetch(`/api/users/${userId}/luna/spaces/${activeSpace?.id}/messages`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  const firstReplyPendingLabel = useMemo(() => {
    const lunaCount = (Array.isArray(messages) ? messages : []).filter((m) => m.senderRole === "luna").length;
    return lunaCount === 0 ? "Luna is analyzing…" : "Luna is thinking…";
  }, [messages]);

  const { data: journey } = useQuery<JourneyPayload>({
    queryKey: [`/api/users/${userId}/luna/spaces/${activeSpace?.id}/journey`],
    enabled: !!activeSpace?.id,
    queryFn: async () => {
      const res = await lunaFetch(`/api/users/${userId}/luna/spaces/${activeSpace?.id}/journey`);
      if (!res.ok) {
        return {
          milestones: [],
          datePlans: [],
          weeklyRecap: "",
          disclaimer: "",
        };
      }
      return res.json();
    },
  });

  const upcomingPlan = useMemo(() => {
    const plans = journey?.datePlans || [];
    const scheduled = plans
      .filter((p) => p.planDate && p.planTime)
      .map((p) => {
        const dt = new Date(`${p.planDate}T${p.planTime}:00`);
        return { p, dt };
      })
      .filter(({ dt }) => !Number.isNaN(dt.getTime()))
      .sort((a, b) => a.dt.getTime() - b.dt.getTime());
    const next = scheduled.find(({ dt }) => dt.getTime() >= Date.now());
    return next ? { ...next.p, _when: next.dt } : null;
  }, [journey?.datePlans]);

  useEffect(() => {
    if (!upcomingPlan?._when || !activeSpace?.id) return;
    const ms = upcomingPlan._when.getTime() - Date.now();
    if (ms <= 0) return;
    // Only alert for "soon" windows to avoid noise.
    const isSoon = ms <= 24 * 60 * 60 * 1000;
    if (!isSoon) return;
    const key = `${activeSpace.id}:${upcomingPlan.id}:${upcomingPlan.planDate}:${upcomingPlan.planTime}`;
    if (upcomingAlertKeyRef.current === key) return;
    upcomingAlertKeyRef.current = key;
    toast({
      title: "Upcoming date scheduled",
      description: `${upcomingPlan.title} • ${upcomingPlan.planDate} ${upcomingPlan.planTime}`,
    });
  }, [activeSpace?.id, toast, upcomingPlan]);

  const { data: suggestions = [] } = useQuery<DateSuggestion[]>({
    queryKey: [`/api/users/${userId}/luna/spaces/${activeSpace?.id}/date-suggestions`],
    enabled: !!activeSpace?.id,
    queryFn: async () => {
      const res = await lunaFetch(`/api/users/${userId}/luna/spaces/${activeSpace?.id}/date-suggestions`, {
        method: "POST",
        headers: lunaHeaders(),
      });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data?.suggestions) ? data.suggestions : [];
    },
  });

  const createSpace = useMutation({
    mutationFn: async (partnerUserId: string) => {
      if (!requireTier({ feature: "Luna Partner Space", minTier: "plus", reason: "Free plan doesn’t include match coaching." })) {
        throw new Error("Upgrade required");
      }
      const res = await lunaFetch(`/api/users/${userId}/luna/spaces`, {
        method: "POST",
        headers: lunaHeaders(),
        body: JSON.stringify({ partnerId: partnerUserId, shareMode: "private_only" }),
      });
      if (!res.ok) throw new Error("Failed to add partner to Luna");
      return res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/luna/spaces`, "auth"] });
      toast({ title: "Added to Luna", description: "Partner space is ready." });
      setActiveSection("chat");
    },
    onError: (e) => {
      const msg = e instanceof Error ? e.message : "";
      if (msg && msg !== "Upgrade required") {
        toast({ title: "Could not add to Luna", description: msg, variant: "destructive" });
      }
    },
  });

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      if (!requireTier({ feature: "Luna Partner Space", minTier: "plus", reason: "Free plan doesn’t include match coaching." })) {
        throw new Error("Upgrade required");
      }
      const limit = lunaPartnerDailyLimitForTier(tier);
      if (Number.isFinite(limit)) {
        const key = dailyKey("luna_partner_msgs", `${userId}:${String(activeSpace?.id || "space")}`);
        const used = dailyCount(key);
        if (used >= limit) {
          requireTier({
            feature: "Luna Partner Space",
            minTier: "premium",
            reason: "You’ve hit today’s Partner Space message limit on Plus.",
          });
          throw new Error("Limit reached");
        }
        incrementDailyCount(key, 1);
      }
      const res = await lunaFetch(`/api/users/${userId}/luna/spaces/${activeSpace?.id}/messages`, {
        method: "POST",
        headers: lunaHeaders(),
        body: JSON.stringify({ content, senderRole: "user", senderUserId: userId, visibility: "private" }),
      });
      if (!res.ok) throw new Error("Failed to send message");
      return res.json() as Promise<{ crisis?: boolean; lunaReply?: unknown; provider?: "gemini" | "openai" | "fallback" }>;
    },
    onMutate: (content) => {
      // Clear immediately so the message doesn't "stick" until Luna responds,
      // and optimistically append the user message to the chat list.
      if (question.trim() === content.trim()) setQuestion("");
      const key = [`/api/users/${userId}/luna/spaces/${activeSpace?.id}/messages`, "auth"] as const;
      queryClient.setQueryData<LunaMessage[]>(key, (prev) => {
        const arr = Array.isArray(prev) ? prev : [];
        return [
          ...arr,
          {
            id: `tmp_${Date.now()}_${Math.random().toString(16).slice(2)}`,
            senderRole: "user",
            content: content,
          },
        ];
      });
    },
    onSuccess: (data) => {
      setQuestion("");
      if (data?.crisis) {
        toast({
          title: "If you’re in crisis",
          description: "Luna shared emergency guidance. Please reach a real helpline or emergency services.",
          variant: "destructive",
          duration: 12000,
        });
      } else if (data?.provider === "fallback") {
        toast({
          title: "AI not configured",
          description: "Backend has no Gemini/OpenAI key yet, so Luna is using a default reply.",
          variant: "destructive",
          duration: 7000,
        });
      }
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/luna/spaces/${activeSpace?.id}/messages`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/luna/spaces/${activeSpace?.id}/journey`] });
    },
  });

  const resetChat = useMutation({
    mutationFn: async () => {
      if (!activeSpace?.id) throw new Error("No space selected");
      const res = await lunaFetch(`/api/users/${userId}/luna/spaces/${activeSpace.id}/messages`, {
        method: "DELETE",
        headers: lunaHeaders(),
      });
      if (!res.ok) throw new Error("Failed to reset chat");
      return res.json() as Promise<{ ok: boolean }>;
    },
    onSuccess: () => {
      setResetOpen(false);
      setQuestion("");
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/luna/spaces/${activeSpace?.id}/messages`, "auth"] });
      toast({ title: "Chat reset", description: "Messages cleared for this partner space." });
    },
    onError: () => {
      toast({ title: "Could not reset chat", variant: "destructive" });
    },
  });

  const saveDatePlan = useMutation({
    mutationFn: async (plan: DateSuggestion) => {
      const res = await lunaFetch(`/api/users/${userId}/luna/spaces/${activeSpace?.id}/date-plans`, {
        method: "POST",
        headers: lunaHeaders(),
        body: JSON.stringify({ ...plan, notifyPartner: scheduleNotifyPartner }),
      });
      if (!res.ok) throw new Error("Failed to save date plan");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Date plan saved", description: "Luna added this to your relationship journey." });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/luna/spaces/${activeSpace?.id}/journey`] });
    },
  });

  const scheduleDatePlan = useMutation({
    mutationFn: async (params: { planId: string; planDate: string; planTime: string; notifyPartner: boolean }) => {
      const res = await lunaFetch(
        `/api/users/${userId}/luna/spaces/${activeSpace?.id}/date-plans/${encodeURIComponent(params.planId)}`,
        {
          method: "PATCH",
          headers: lunaHeaders(),
          body: JSON.stringify({
            planDate: params.planDate,
            planTime: params.planTime,
            notifyPartner: params.notifyPartner,
            status: "scheduled",
          }),
        },
      );
      if (!res.ok) throw new Error("Failed to schedule date");
      return res.json();
    },
    onSuccess: () => {
      setSchedulePlanId("");
      setScheduleDate("");
      setScheduleTime("");
      setScheduleNotifyPartner(false);
      toast({
        title: "Date scheduled",
        description: "Saved. You’ll also get reminder notifications (24h + 2h before, or soon if it’s close).",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/luna/spaces/${activeSpace?.id}/journey`] });
    },
  });

  const addMilestone = useMutation({
    mutationFn: async () => {
      const res = await lunaFetch(`/api/users/${userId}/luna/spaces/${activeSpace?.id}/milestones`, {
        method: "POST",
        headers: lunaHeaders(),
        body: JSON.stringify({
          title: milestoneTitle.trim(),
          body: milestoneBody.trim() || null,
          visibleToPartner: milestoneShare,
        }),
      });
      if (!res.ok) throw new Error("Failed to add milestone");
      return res.json();
    },
    onSuccess: () => {
      setMilestoneTitle("");
      setMilestoneBody("");
      setMilestoneShare(false);
      toast({ title: "Milestone saved" });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/luna/spaces/${activeSpace?.id}/journey`] });
    },
  });

  return (
    <div className="min-h-[100svh] bg-[#F8F9FB]">
      <div className="mx-auto w-full max-w-lg space-y-4 px-3 pb-28 pt-3">
      {/* Partner selection */}
      <Card className={cn("rounded-[24px] border border-[#F0F0F0] bg-white shadow-sm", activeSpace ? "border-primary/15" : "")}>
        <CardContent className="p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Luna partner space</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose partner from your matches" />
              </SelectTrigger>
              <SelectContent>
                {matches.map((m) => {
                  const pid = m.partnerUserId;
                  if (!pid) return null;
                  return (
                    <SelectItem key={pid} value={pid}>
                      {m.name}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Button
              disabled={!selectedPartnerId || createSpace.isPending}
              onClick={() => {
                if (!selectedPartnerId) return;
                // If already added, jump user to the Luna tab.
                if (activeSpace?.id) {
                  setActiveSection("chat");
                  return;
                }
                createSpace.mutate(selectedPartnerId);
              }}
            >
              {createSpace.isPending ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Adding…
                </span>
              ) : activeSpace?.id ? (
                "Open Luna"
              ) : (
                "Add to Luna"
              )}
            </Button>
          </div>
          {selectedPartnerId ? (
            <div className="flex flex-wrap items-center gap-2">
              {activeSpace?.id ? (
                <>
                  <Badge variant="outline">Active</Badge>
                  <Badge variant="secondary">Private</Badge>
                </>
              ) : (
                <Badge variant="outline">Not added yet</Badge>
              )}
            </div>
          ) : selectedPartnerId ? (
            <div className="rounded-2xl border border-dashed border-primary/20 bg-primary/[0.03] px-4 py-3">
              <p className="text-xs font-semibold text-slate-900">Next step</p>
              <p className="mt-1 text-xs text-slate-600">
                Tap <span className="font-semibold">Add to Luna</span> to create a private space for this match. Then open the{" "}
                <span className="font-semibold">Luna</span> tab to start coaching.
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Partner status */}
      {activeSpace?.partner ? (
        <Card className="rounded-[24px] border border-primary/20 bg-gradient-to-br from-primary/[0.08] via-white to-white shadow-sm">
          <CardContent
            className="p-4 flex items-center gap-3 cursor-pointer"
            onClick={() => setActiveSection("chat")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setActiveSection("chat");
            }}
          >
            <div className="flex -space-x-2">
              <Avatar className="w-10 h-10 border-2 border-white">
                <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">You</AvatarFallback>
              </Avatar>
              <Avatar className="w-10 h-10 border-2 border-white">
                <AvatarImage src={activeSpace.partner.avatar || undefined} alt={activeSpace.partner.name} />
                <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                  {activeSpace.partner.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <div>
              <p className="text-sm font-semibold text-primary">Coaching with {activeSpace.partner.name}</p>
              <p className="text-xs text-primary/80">Your relationship, together</p>
            </div>
            <Heart className="w-5 h-5 text-primary fill-primary/25 ml-auto" />
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed border-primary/25">
          <CardContent className="p-4 text-center text-sm text-muted-foreground">
            <Heart className="w-6 h-6 text-primary/40 mx-auto mb-2" />
            Pick a match to start a partner space.
          </CardContent>
        </Card>
      )}

      {/* Section tabs */}
      <div
        className={cn(
          "rounded-full bg-[#F1F2F4] p-1 shadow-[inset_0_1px_4px_rgba(15,23,42,0.06)]",
          !selectedPartnerId ? "opacity-60" : "",
        )}
      >
        <div className="grid grid-cols-2 gap-1">
          {(["chat", "journey"] as const).map((section) => {
            const disabled = !activeSpace?.id;
            const active = activeSection === section;
            return (
              <button
                key={section}
                type="button"
                disabled={!selectedPartnerId || disabled}
                onClick={() => setActiveSection(section)}
                className={cn(
                  "relative h-10 rounded-full text-[12px] font-semibold transition",
                  active ? "text-slate-900" : "text-slate-500 hover:text-slate-700",
                  (!selectedPartnerId || disabled) && "cursor-not-allowed opacity-50 hover:text-slate-500",
                )}
              >
                {active ? (
                  <span className="absolute inset-0 rounded-full bg-white shadow-[0_10px_30px_-18px_rgba(15,23,42,0.22)]" />
                ) : null}
                <span className="relative">
                  {section === "chat" ? "Luna" : "Journey"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat with coach */}
      {activeSection === "chat" && (
        <Card className="rounded-[24px] border border-[#F0F0F0] bg-white shadow-[0_10px_30px_-22px_rgba(15,23,42,0.14)]">
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Luna coaching
              </CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={!activeSpace?.id || resetChat.isPending}
                className="h-9 rounded-full font-semibold text-slate-600 hover:bg-slate-900/[0.03] hover:text-slate-900"
                onClick={() => setResetOpen(true)}
              >
                Reset chat
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            {/* No space yet - prompt to add partner */}
            {!activeSpace && (
              <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Heart className="w-7 h-7 text-primary" />
                </div>
                <p className="text-sm font-semibold text-foreground">Add a partner to start chatting</p>
                <p className="text-xs text-muted-foreground max-w-[220px]">
                  Select a match above and click <strong>Add To Luna</strong> to begin your AI coaching session.
                </p>
                <Button size="sm" variant="outline" className="rounded-full text-xs" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                  Go to partner setup ↑
                </Button>
              </div>
            )}

            {/* Chat history */}
            {activeSpace && <div className="min-h-[280px] max-h-[46svh] overflow-y-auto space-y-3 rounded-[18px] border border-stone-200 bg-stone-50/70 p-3">
              {messages.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  Ask me anything about your relationship...
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderRole === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                        msg.senderRole === "user"
                          ? "bg-primary text-white rounded-tr-sm"
                          : "bg-white text-foreground border border-border rounded-tl-sm shadow-sm"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
              {sendMessage.isPending && (
                <div className="flex justify-start">
                  <div className="bg-white border border-border rounded-2xl rounded-tl-sm px-3 py-2 text-xs text-muted-foreground flex items-center gap-1.5 shadow-sm">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    {firstReplyPendingLabel}
                  </div>
                </div>
              )}
            </div>}

            {/* Input */}
            {activeSpace && <div className="flex gap-2">
              <Textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask about communication, conflict, intimacy..."
                rows={2}
                className="text-[13px] resize-none rounded-[18px] border-stone-200 bg-white shadow-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!question.trim() || !activeSpace) return;
                    sendMessage.mutate(question.trim());
                  }
                }}
              />
              <Button
                size="icon"
                onClick={() => {
                  if (!question.trim() || !activeSpace) return;
                  sendMessage.mutate(question.trim());
                }}
                disabled={!question.trim() || sendMessage.isPending}
                className="h-11 w-11 rounded-[18px] self-end shadow-sm"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>}

            {activeSpace && suggestions.length > 0 && (
              <div className="pt-1">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Luna date suggestions</p>
                <div className="space-y-2">
                  {suggestions.slice(0, 2).map((s, i) => (
                    <div key={`${s.title}-${i}`} className="rounded-xl border bg-background p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground">{s.title}</p>
                        <Badge variant="secondary" className="text-[10px]">
                          {s.planTime || "Flexible"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{s.venue || "Venue TBD"}</p>
                      <p className="text-xs text-muted-foreground mt-1">{s.notes || ""}</p>
                      <Button
                        size="sm"
                        variant="outline"
                          className="mt-2 h-8 rounded-full text-xs"
                        onClick={() => saveDatePlan.mutate(s)}
                      >
                        <CalendarDays className="w-3.5 h-3.5 mr-1.5" />
                        Add to journey
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset chat?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete all Luna messages in this partner space. Journey items (milestones/date plans) will stay.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resetChat.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => resetChat.mutate()}
            >
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {activeSection === "journey" && (
        <div className="space-y-3">
          {!activeSpace ? (
            <Card>
              <CardContent className="p-4 text-sm text-muted-foreground">
                Add a partner to Luna first to see your journey timeline.
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Upcoming (simple + clear) */}
              {upcomingPlan ? (
                <Card className="overflow-hidden rounded-[24px] border border-primary/15 bg-gradient-to-br from-primary/[0.10] via-white to-white shadow-[0_12px_40px_-28px_rgba(15,23,42,0.22)]">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-semibold text-foreground">Upcoming date</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <p className="text-sm font-semibold text-slate-900">{upcomingPlan.title}</p>
                    <p className="mt-1 text-xs text-slate-700">
                      {upcomingPlan.planDate} {upcomingPlan.planTime}
                      {upcomingPlan.venue ? ` • ${upcomingPlan.venue}` : ""}
                    </p>
                    {upcomingPlan.notes ? (
                      <p className="mt-2 text-xs text-slate-600 leading-relaxed">{upcomingPlan.notes}</p>
                    ) : null}
                    <p className="mt-3 text-[11px] text-slate-600">
                      Reminders: 24h + 2h before (or soon if it’s close).
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card className="rounded-[24px] border border-[#F0F0F0] bg-white shadow-sm">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-bold">Upcoming date</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <p className="text-sm text-slate-700">
                      No scheduled date yet. Pick a plan below and tap <span className="font-semibold">Schedule</span>.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Plans */}
              <Card className="rounded-[24px] border border-[#F0F0F0] bg-white shadow-sm">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-semibold text-foreground">Date plans</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-2">
                  {journey && journey.datePlans.length > 0 ? (
                    journey.datePlans.map((p) => {
                      const isScheduling = schedulePlanId === p.id;
                      const hasSchedule = Boolean(p.planDate) && Boolean(p.planTime);
                      return (
                        <div key={p.id} className="rounded-[18px] border border-stone-200 bg-white p-3 shadow-sm">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{p.title}</p>
                              <p className="mt-0.5 text-xs text-slate-600">
                                {p.venue ? p.venue : "Venue TBD"}
                                {p.notes ? ` • ${p.notes}` : ""}
                              </p>
                              <p className="mt-1 text-xs text-slate-700">
                                {hasSchedule ? `Scheduled: ${p.planDate} ${p.planTime}` : "Not scheduled yet"}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 rounded-full text-xs"
                              onClick={() => {
                                setSchedulePlanId(isScheduling ? "" : p.id);
                                setScheduleDate(p.planDate || "");
                                setScheduleTime(p.planTime || "");
                              }}
                            >
                              {isScheduling ? "Close" : "Schedule"}
                            </Button>
                          </div>

                          {isScheduling && (
                            <div className="mt-3 space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label className="text-xs">Date</Label>
                                  <input
                                    type="date"
                                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                                    value={scheduleDate}
                                    onChange={(e) => setScheduleDate(e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Time</Label>
                                  <input
                                    type="time"
                                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                                    value={scheduleTime}
                                    onChange={(e) => setScheduleTime(e.target.value)}
                                  />
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id={`notify-partner-schedule-${p.id}`}
                                  checked={scheduleNotifyPartner}
                                  onCheckedChange={(c) => setScheduleNotifyPartner(c === true)}
                                />
                                <Label
                                  htmlFor={`notify-partner-schedule-${p.id}`}
                                  className="text-xs font-normal cursor-pointer"
                                >
                                  Notify partner (optional)
                                </Label>
                              </div>
                              <Button
                                size="sm"
                                disabled={!scheduleDate || !scheduleTime || scheduleDatePlan.isPending}
                                onClick={() =>
                                  scheduleDatePlan.mutate({
                                    planId: p.id,
                                    planDate: scheduleDate,
                                    planTime: scheduleTime,
                                    notifyPartner: scheduleNotifyPartner,
                                  })
                                }
                              >
                                Save schedule
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-[18px] border border-dashed border-stone-200 bg-stone-50/60 p-4">
                      <p className="text-sm font-semibold text-slate-900">No date plans yet</p>
                      <p className="mt-1 text-sm text-slate-600">Use “Add to journey” on a date suggestion to create one.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Notes */}
              <Card className="rounded-[24px] border border-[#F0F0F0] bg-white shadow-sm">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-semibold text-foreground">Notes (milestones)</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-3">
                  <div>
                    <Label className="text-xs">Title</Label>
                    <input
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                      value={milestoneTitle}
                      onChange={(e) => setMilestoneTitle(e.target.value)}
                      placeholder="e.g. We agreed on a first date"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Notes (optional)</Label>
                    <Textarea
                      className="mt-1 text-xs min-h-[72px]"
                      value={milestoneBody}
                      onChange={(e) => setMilestoneBody(e.target.value)}
                      placeholder="What did you learn? What’s the next step?"
                    />
                  </div>
                  <Button
                    size="sm"
                    disabled={!milestoneTitle.trim() || addMilestone.isPending}
                    onClick={() => addMilestone.mutate()}
                  >
                    Save note
                  </Button>

                  {journey && journey.milestones.length > 0 ? (
                    <div className="pt-1 space-y-2">
                      {journey.milestones.map((ms) => (
                        <div key={ms.id} className="rounded-[18px] border border-stone-200 bg-white p-3 shadow-sm">
                          <p className="text-sm font-semibold text-slate-900">{ms.title}</p>
                          {ms.body ? <p className="mt-1 text-xs text-slate-600">{ms.body}</p> : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-600">Saved notes help you remember decisions and progress.</p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
