import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Heart, MessageSquare, Send, Sparkles, BookOpen,
  Target, TrendingUp, Users, Loader2, CalendarDays, Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { lunaFetch, lunaHeaders } from "@/lib/lunaApi";

interface RelationshipCoachProps {
  userId: string;
  partnerId?: string | null;
}

type CoachTip = {
  id: string;
  category: string;
  title: string;
  content: string;
  icon: React.ElementType;
  color: string;
};

const TIPS: CoachTip[] = [
  {
    id: "communication",
    category: "Communication",
    title: "Active Listening",
    content: "When your partner is talking, focus entirely on them. Put away distractions, make eye contact, and respond to show you're engaged. Summarise what they said before responding.",
    icon: MessageSquare,
    color: "bg-blue-100 text-blue-600",
  },
  {
    id: "appreciation",
    category: "Appreciation",
    title: "Daily Gratitude",
    content: "Express appreciation for small things every day. Saying 'thank you for making dinner' or 'I appreciate you listening' builds a culture of gratitude and strengthens your bond.",
    icon: Heart,
    color: "bg-primary/10 text-primary",
  },
  {
    id: "goals",
    category: "Goals",
    title: "Shared Vision",
    content: "Discuss your individual and shared goals monthly. Understanding where you're each headed individually helps you grow together in the same direction.",
    icon: Target,
    color: "bg-purple-100 text-purple-600",
  },
  {
    id: "growth",
    category: "Growth",
    title: "Continuous Learning",
    content: "Read relationship books together, attend workshops, or listen to podcasts on relationships. Learning together shows commitment to your partnership.",
    icon: BookOpen,
    color: "bg-primary/10 text-primary",
  },
  {
    id: "quality-time",
    category: "Quality Time",
    title: "Intentional Dates",
    content: "Schedule weekly date nights where phones are put away. Even simple activities like cooking together or a walk create meaningful connection time.",
    icon: Users,
    color: "bg-amber-100 text-amber-600",
  },
];

const EXERCISES = [
  { title: "Love Language Check-in", description: "Identify and practice each other's love languages this week.", time: "15 min" },
  { title: "Relationship Vision Board", description: "Create a shared board of your relationship goals and dreams.", time: "30 min" },
  { title: "Gratitude Exchange", description: "Share 3 things you appreciate about each other before bed tonight.", time: "5 min" },
  { title: "Conflict Resolution Practice", description: "Discuss a past disagreement using 'I feel' statements.", time: "20 min" },
];

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
  datePlans: unknown[];
  weeklyRecap: string;
  disclaimer: string;
};

export default function RelationshipCoach({ userId, partnerId }: RelationshipCoachProps) {
  const [question, setQuestion] = useState("");
  const [activeSection, setActiveSection] = useState<"tips" | "exercises" | "chat" | "journey">("tips");
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(partnerId || "");
  const [shareMode, setShareMode] = useState<LunaSpace["shareMode"]>("private_only");
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [milestoneBody, setMilestoneBody] = useState("");
  const [milestoneShare, setMilestoneShare] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
    const byPartner = spaces.find((s) => s.partnerUserId === selectedPartnerId);
    if (!byPartner && selectedPartnerId && matches.length > 0) return null;
    return byPartner || spaces[0] || null;
  }, [spaces, selectedPartnerId, matches]);

  const { data: messages = [] } = useQuery<LunaMessage[]>({
    queryKey: [`/api/users/${userId}/luna/spaces/${activeSpace?.id}/messages`, "auth"],
    enabled: !!activeSpace?.id,
    queryFn: async () => {
      const res = await lunaFetch(`/api/users/${userId}/luna/spaces/${activeSpace?.id}/messages`);
      if (!res.ok) return [];
      return res.json();
    },
  });

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
      const res = await lunaFetch(`/api/users/${userId}/luna/spaces`, {
        method: "POST",
        headers: lunaHeaders(),
        body: JSON.stringify({ partnerId: partnerUserId, shareMode }),
      });
      if (!res.ok) throw new Error("Failed to add partner to Luna");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/luna/spaces`] });
      toast({ title: "Added to Luna", description: "Partner space is ready." });
    },
  });

  const updateSpace = useMutation({
    mutationFn: async (nextMode: LunaSpace["shareMode"]) => {
      const res = await lunaFetch(`/api/users/${userId}/luna/spaces/${activeSpace?.id}`, {
        method: "PATCH",
        headers: lunaHeaders(),
        body: JSON.stringify({ shareMode: nextMode }),
      });
      if (!res.ok) throw new Error("Failed to update sharing");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/luna/spaces`] });
      toast({ title: "Sharing updated" });
    },
  });

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      const res = await lunaFetch(`/api/users/${userId}/luna/spaces/${activeSpace?.id}/messages`, {
        method: "POST",
        headers: lunaHeaders(),
        body: JSON.stringify({ content, senderRole: "user", senderUserId: userId, visibility: "private" }),
      });
      if (!res.ok) throw new Error("Failed to send message");
      return res.json() as Promise<{ crisis?: boolean; lunaReply?: unknown }>;
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
      }
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/luna/spaces/${activeSpace?.id}/messages`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/luna/spaces/${activeSpace?.id}/journey`] });
    },
  });

  const saveDatePlan = useMutation({
    mutationFn: async (plan: DateSuggestion) => {
      const res = await lunaFetch(`/api/users/${userId}/luna/spaces/${activeSpace?.id}/date-plans`, {
        method: "POST",
        headers: lunaHeaders(),
        body: JSON.stringify(plan),
      });
      if (!res.ok) throw new Error("Failed to save date plan");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Date plan saved", description: "Luna added this to your relationship journey." });
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
    <div className="space-y-4">
      {partnerSpaces.length > 0 && (
        <Card className="border-teal-200 bg-teal-50/40">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Eye className="w-4 h-4 text-teal-700" />
              Shared with you (partner view)
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Your match chose to share part of Luna with you. Private chats stay private unless they pick “Shared full”.
            </p>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-4">
            {partnerSpaces.map((ps) => (
              <div key={ps.spaceId} className="rounded-xl border bg-background p-3 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="text-sm font-semibold">
                    With {ps.owner?.name || "your match"}
                  </p>
                  <Badge variant="outline" className="text-[10px]">
                    {ps.shareMode.replace(/_/g, " ")}
                  </Badge>
                </div>
                {ps.weeklyRecap && (
                  <p className="text-xs text-muted-foreground leading-relaxed">{ps.weeklyRecap}</p>
                )}
                {Array.isArray(ps.messages) && ps.messages.length > 0 && (
                  <div className="space-y-1 max-h-28 overflow-y-auto">
                    {ps.messages.slice(-4).map((m) => (
                      <div key={m.id} className="text-xs rounded-lg bg-muted/50 px-2 py-1.5">
                        <span className="font-semibold text-primary">{m.senderRole === "luna" ? "Luna" : "Note"}: </span>
                        {m.content}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Partner selection */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Luna partner space</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose partner from your matches" />
              </SelectTrigger>
              <SelectContent>
                {matches.map((m) => {
                  const pid = m.partnerUserId ?? m.id;
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
              onClick={() => createSpace.mutate(selectedPartnerId)}
            >
              Add To Luna
            </Button>
          </div>
          {activeSpace && (
            <div className="flex items-center gap-2">
              <Badge variant="outline">Space active</Badge>
              <Select
                value={activeSpace.shareMode}
                onValueChange={(v) => updateSpace.mutate(v as LunaSpace["shareMode"])}
              >
                <SelectTrigger className="max-w-[220px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private_only">Private only</SelectItem>
                  <SelectItem value="share_summaries">Share summaries</SelectItem>
                  <SelectItem value="share_actions">Share actions</SelectItem>
                  <SelectItem value="shared_full">Shared full</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Partner status */}
      {activeSpace?.partner ? (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex items-center gap-3">
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
            Pick one of your matches and add them to Luna.
          </CardContent>
        </Card>
      )}

      {/* Section tabs */}
      <div className="flex gap-1 flex-wrap">
        {(["tips", "exercises", "chat", "journey"] as const).map((section) => (
          <button
            key={section}
            onClick={() => setActiveSection(section)}
            className={`flex-1 min-w-[72px] py-2 rounded-xl text-[11px] font-semibold transition-colors capitalize ${
              activeSection === section
                ? "bg-primary text-white shadow-sm"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {section === "tips"
              ? "💡 Tips"
              : section === "exercises"
                ? "🎯 Exercises"
                : section === "chat"
                  ? "💬 Luna"
                  : "📍 Journey"}
          </button>
        ))}
      </div>

      {/* Tips section */}
      {activeSection === "tips" && (
        <div className="space-y-3">
          {TIPS.map((tip) => {
            const Icon = tip.icon;
            return (
              <Card key={tip.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${tip.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-bold text-foreground">{tip.title}</h4>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{tip.category}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{tip.content}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Exercises section */}
      {activeSection === "exercises" && (
        <div className="space-y-3">
          {EXERCISES.map((ex, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-foreground mb-1">{ex.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{ex.description}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] whitespace-nowrap">{ex.time}</Badge>
                </div>
                <Button size="sm" variant="outline" className="mt-3 w-full text-xs rounded-full">
                  <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
                  Start Exercise
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Chat with coach */}
      {activeSection === "chat" && (
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Luna - AI Relationship Coach
            </CardTitle>
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
            {activeSpace && <div className="min-h-[200px] max-h-72 overflow-y-auto space-y-3 bg-muted/30 rounded-xl p-3">
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
                    Coach is thinking...
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
                className="text-xs resize-none rounded-xl"
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
                className="rounded-xl self-end"
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
                        className="mt-2 h-7 text-xs"
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
              <Card>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-bold">This week&apos;s recap</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-2">
                  <p className="text-sm text-foreground leading-relaxed">
                    {journey?.weeklyRecap || "Keep chatting with Luna and saving date ideas — your recap will grow here."}
                  </p>
                  {journey?.disclaimer && (
                    <p className="text-[11px] text-muted-foreground border-t pt-2">{journey.disclaimer}</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-bold">Add a milestone</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-3">
                  <div>
                    <Label className="text-xs">Title</Label>
                    <input
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                      value={milestoneTitle}
                      onChange={(e) => setMilestoneTitle(e.target.value)}
                      placeholder="e.g. First intentional date night"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Notes (optional)</Label>
                    <Textarea
                      className="mt-1 text-xs min-h-[72px]"
                      value={milestoneBody}
                      onChange={(e) => setMilestoneBody(e.target.value)}
                      placeholder="What went well? What did you learn?"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="ms-share"
                      checked={milestoneShare}
                      onCheckedChange={(c) => setMilestoneShare(c === true)}
                    />
                    <Label htmlFor="ms-share" className="text-xs font-normal cursor-pointer">
                      Let my partner see this (if sharing is on)
                    </Label>
                  </div>
                  <Button
                    size="sm"
                    disabled={!milestoneTitle.trim() || addMilestone.isPending}
                    onClick={() => addMilestone.mutate()}
                  >
                    Save milestone
                  </Button>
                </CardContent>
              </Card>

              {journey && journey.milestones.length > 0 && (
                <Card>
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-bold">Milestones</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-2">
                    {journey.milestones.map((ms) => (
                      <div key={ms.id} className="rounded-lg border p-3 text-sm">
                        <p className="font-semibold">{ms.title}</p>
                        {ms.body && <p className="text-xs text-muted-foreground mt-1">{ms.body}</p>}
                        {ms.visibleToPartner && (
                          <Badge variant="secondary" className="mt-2 text-[10px]">
                            Shared with partner
                          </Badge>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
