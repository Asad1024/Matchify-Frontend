import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation, useSearchParams } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/common/Header";
import BottomNav from "@/components/common/BottomNav";
import EventCard from "@/components/events/EventCard";
import EventMatchQuestionnaire from "@/components/events/EventMatchQuestionnaire";
import MatchCountdown from "@/components/events/MatchCountdown";
import EventMatchResults from "@/components/events/EventMatchResults";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Calendar, MapPin, Clock, Heart, Sparkles, Zap, UserRound, Mic2, Pencil } from "lucide-react";
import { buildApiUrl } from "@/services/api";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";
import type { Event } from "@shared/schema";
import EventMatchAdmin from "@/components/events/EventMatchAdmin";
import {
  DEFAULT_EVENT_QUESTIONS,
  parseEventQuestions,
  type EventQuestionItem,
} from "@/lib/eventQuestionnaireDefaults";

interface Match {
  id: string;
  userId: string;
  name: string;
  avatar?: string;
  compatibility: number;
  insights: string[];
  matchQuality: 'high' | 'medium' | 'low';
}

export default function EventDetail() {
  const [, setLocation] = useLocation();
  const [searchParams] = useSearchParams();
  const [, params] = useRoute('/event/:id');
  const { userId } = useCurrentUser();
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [isEditingAnswers, setIsEditingAnswers] = useState(false);
  const [forceRevealed, setForceRevealed] = useState(false);

  // Get event ID from route params
  const eventId = params?.id;

  // Prevent stale tab state causing blank screens when switching events / revisiting pages.
  useEffect(() => {
    setActiveTab('details');
    setShowQuestionnaire(false);
    setIsEditingAnswers(false);
    setForceRevealed(false);
  }, [eventId]);

  // RSVP mutation (so questionnaire can be shown right after RSVP)
  const rsvpMutation = useMutation({
    mutationFn: async () => {
      if (!userId || !eventId) throw new Error("Not logged in or event missing");
      const res = await apiRequest("POST", "/api/events/rsvps", { userId, eventId });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Failed to RSVP" }));
        throw new Error(err.message || "Failed to RSVP");
      }
      return res.json();
    },
    onSuccess: async (data) => {
      await refetchRsvps();
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}`] });
      const hasQuestionnaire = data?.event?.hasQuestionnaire ?? event?.hasQuestionnaire;
      toast({ title: "You're going!", description: "RSVP confirmed." });
      if (hasQuestionnaire && !isHost) {
        setShowQuestionnaire(true);
      }
    },
    onError: (error: Error) => {
      toast({ title: "RSVP failed", description: error.message, variant: "destructive" });
    },
  });

  const cancelRsvpMutation = useMutation({
    mutationFn: async () => {
      if (!userId || !eventId) throw new Error("Not logged in or event missing");
      const res = await apiRequest("DELETE", `/api/events/rsvps/${userId}/${eventId}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Failed to cancel RSVP" }));
        throw new Error(err.message || "Failed to cancel RSVP");
      }
    },
    onSuccess: async () => {
      await refetchRsvps();
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}`] });
      toast({ title: "RSVP cancelled", description: "You're no longer attending." });
    },
    onError: (error: Error) => {
      toast({ title: "Cancel failed", description: error.message, variant: "destructive" });
    },
  });

  // Check if user has RSVP'd
  const { data: rsvps = [], refetch: refetchRsvps } = useQuery({
    queryKey: ['/api/users', userId, 'rsvps'],
    enabled: !!userId,
    refetchOnMount: true, // Always refetch when component mounts
    queryFn: async () => {
      const url = buildApiUrl(`/api/users/${userId}/rsvps`);
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const isRSVPd = eventId ? (rsvps as any[]).some((r: any) => r.eventId === eventId) : false;

  // Check if user has completed questionnaire
  const { data: questionnaire, refetch: refetchQuestionnaire } = useQuery({
    queryKey: [`/api/events/${eventId}/questionnaire`, userId],
    enabled: !!eventId && !!userId,
    queryFn: async () => {
      const url = buildApiUrl(`/api/events/${eventId}/questionnaire?userId=${userId}`);
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) {
        // 404 or other errors mean questionnaire doesn't exist yet (not an error state)
        if (res.status === 404 || res.status === 401) return null;
        throw new Error('Failed to fetch questionnaire');
      }
      const data = await res.json();
      // Handle null response (questionnaire doesn't exist yet)
      return data || null;
    },
  });

  const questionnaireCompleted = !!questionnaire?.completed;

  const { data: aiInvite } = useQuery<{ status: string | null }>({
    queryKey: ["/api/events", eventId, "my-ai-invite", userId],
    enabled: !!eventId && !!userId,
    queryFn: async () => {
      const url = buildApiUrl(
        `/api/events/${eventId}/my-ai-invite?userId=${encodeURIComponent(userId!)}`,
      );
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) return { status: null };
      return res.json();
    },
  });

  const declineInviteMutation = useMutation({
    mutationFn: async () => {
      if (!userId || !eventId) throw new Error("Missing user or event");
      const res = await apiRequest("POST", `/api/events/${eventId}/ai-invite/decline`, { userId });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Failed to decline" }));
        throw new Error(err.message || "Failed to decline");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId, "my-ai-invite", userId] });
      toast({ title: "Invitation declined" });
    },
    onError: (error: Error) => {
      toast({ title: "Could not decline", description: error.message, variant: "destructive" });
    },
  });

  // Fetch event details
  const { data: event, isLoading, refetch: refetchEvent } = useQuery<
    Event & {
      matchRevealTime?: string;
      isHost?: boolean;
      hasQuestionnaire?: boolean;
      questionnaireCompleted?: boolean;
      hostName?: string;
      host?: { name?: string };
      userId?: string;
      hostId?: string;
      aiGenerated?: boolean;
    }
  >({
    queryKey: [`/api/events/${eventId}`],
    enabled: !!eventId,
    // Poll so matchRevealTime appears without refresh when host schedules reveal.
    refetchInterval: isRSVPd ? 2000 : false,
    queryFn: async () => {
      const url = buildApiUrl(`/api/events/${eventId}`);
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch event');
      return res.json();
    },
  });

  const isHost = useMemo(() => {
    if (!userId || !event) return false;
    if (event.isHost === true) return true;
    const hid = String((event as { hostId?: string }).hostId ?? "");
    return Boolean(hid && hid === userId);
  }, [userId, event]);

  /** User-hosted events (not AI); admins use the admin console for AI-hosted events. */
  const showHostTab = Boolean(isHost && event && !event.aiGenerated);
  const fromExplore = searchParams.get("from") === "explore";
  const editEventHref = `/events/create?edit=${encodeURIComponent(eventId || "")}${fromExplore ? "&from=explore" : ""}`;

  const eventTabsCount = useMemo(() => {
    let n = 2;
    if (event?.hasQuestionnaire && !isHost) n += 1;
    if (showHostTab) n += 1;
    return n;
  }, [event?.hasQuestionnaire, isHost, showHostTab]);

  const tabsGridClass =
    eventTabsCount === 4
      ? "grid-cols-4"
      : eventTabsCount === 3
        ? "grid-cols-3"
        : "grid-cols-2";

  const hostDisplayName = useMemo(() => {
    if (!event) return "";
    const e = event as { hostName?: string; host?: { name?: string } };
    const n = e.hostName?.trim() || e.host?.name?.trim();
    return n || "";
  }, [event]);

  const revealAtMs = useMemo(() => {
    if (!event?.matchRevealTime) return NaN;
    const t = new Date(event.matchRevealTime).getTime();
    return Number.isFinite(t) ? t : NaN;
  }, [event?.matchRevealTime]);

  // New countdown (e.g. admin "Calculate matches") must clear a stale forceRevealed from a prior reveal.
  useEffect(() => {
    if (!Number.isFinite(revealAtMs)) return;
    if (Date.now() < revealAtMs) setForceRevealed(false);
  }, [revealAtMs, eventId]);

  const revealTimePassed = Number.isFinite(revealAtMs) && Date.now() >= revealAtMs;
  const revealedNow = forceRevealed || revealTimePassed;

  // Fetch matches if revealed (server returns cards for current user when userId is passed)
  const { data: matches = [], refetch: refetchMatches } = useQuery<Match[]>({
    queryKey: [`/api/events/${eventId}/matches`, userId],
    enabled: !!eventId && !!userId && revealedNow,
    // After reveal, poll briefly so the UI updates without refresh even if
    // the backend flips from [] -> matches a moment later.
    refetchInterval: activeTab === "matches" && revealedNow ? 1000 : false,
    queryFn: async () => {
      const url = buildApiUrl(
        `/api/events/${eventId}/matches?userId=${encodeURIComponent(userId!)}`,
      );
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Auto-open questionnaire if user RSVP'd but hasn't completed it
  useEffect(() => {
    // Refetch RSVPs when event loads to ensure we have latest data
    if (eventId && userId) {
      refetchRsvps();
    }
  }, [eventId, userId, refetchRsvps]);

  useEffect(() => {
    // Check if we should show questionnaire
    // Wait for all data to be loaded before showing
    // Only auto-show if questionnaire is not completed and user has RSVP'd (not the host)
    if (
      event &&
      !isLoading &&
      !isHost &&
      event.hasQuestionnaire &&
      !questionnaireCompleted &&
      isRSVPd
    ) {
      // Only auto-show if questionnaire modal is not already shown
      if (!showQuestionnaire) {
        setShowQuestionnaire(true);
      }
    } else if (questionnaireCompleted) {
      // If questionnaire is completed, make sure it's hidden
      setShowQuestionnaire(false);
    }
  }, [
    event,
    isLoading,
    isHost,
    isRSVPd,
    questionnaireCompleted,
    showQuestionnaire,
  ]);

  // Check if reveal time has passed
  const revealTime = event?.matchRevealTime ? new Date(event.matchRevealTime) : null;
  const isRevealed = revealedNow;
  const isCountingDown = Boolean(revealTime && new Date() < revealTime);

  // During countdown, stay off Matches so the full-screen overlay is not sitting on top of that tab.
  useEffect(() => {
    if (isCountingDown && activeTab === "matches") setActiveTab("details");
  }, [isCountingDown, activeTab]);

  // If the tab bar is hidden, ensure we never land on a tab that has no content yet.
  useEffect(() => {
    if (activeTab === "matches" && !isRevealed) setActiveTab("details");
    if (activeTab === "questionnaire" && (isHost || !event?.hasQuestionnaire)) setActiveTab("details");
    if (activeTab === "host" && !showHostTab) setActiveTab("details");
  }, [activeTab, isRevealed, isHost, event?.hasQuestionnaire, showHostTab]);

  useEffect(() => {
    if (!isRevealed) return;
    setActiveTab('matches');
    queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/matches`, userId] });
    refetchMatches();
  }, [isRevealed, eventId, userId, queryClient, refetchMatches]);

  const { data: eventQuestionnaireTemplate } = useQuery<{ questions: EventQuestionItem[] }>({
    queryKey: ["/api/event-questionnaire-template"],
  });

  const templateQuestions = useMemo(() => {
    const q = eventQuestionnaireTemplate?.questions;
    return Array.isArray(q) && q.length > 0 ? q : null;
  }, [eventQuestionnaireTemplate]);

  const customQuestions = parseEventQuestions((event as { questionnaireQuestions?: string } | undefined)?.questionnaireQuestions);
  const questions = useMemo(() => {
    if (customQuestions && customQuestions.length > 0) return customQuestions;
    if (templateQuestions && templateQuestions.length > 0) return templateQuestions;
    return DEFAULT_EVENT_QUESTIONS;
  }, [customQuestions, templateQuestions]);

  if (!eventId) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <Header showSearch={false} unreadNotifications={0} onNotifications={() => {}} onCreate={() => {}} onLogout={logout} />
        <div className="mx-auto max-w-lg px-4 pb-6 pt-2">
          <EmptyState title="Event not found" description="The event you're looking for doesn't exist" />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <Header showSearch={false} unreadNotifications={0} onNotifications={() => {}} onCreate={() => {}} onLogout={logout} />
        <LoadingState message="Loading event..." showMascot={true} />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <Header showSearch={false} unreadNotifications={0} onNotifications={() => {}} onCreate={() => {}} onLogout={logout} />
        <div className="mx-auto max-w-lg px-4 pb-6 pt-2">
          <EmptyState title="Event not found" description="The event you're looking for doesn't exist" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header
        showSearch={false}
        unreadNotifications={0}
        onNotifications={() => setLocation('/notifications')}
        onCreate={() => setLocation('/')}
        onLogout={logout}
      />

      {event?.aiGenerated && !isHost && aiInvite?.status === "invited" && !isRSVPd ? (
        <div className="mx-auto max-w-lg px-4 pt-3">
          <div className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/[0.08] to-violet-500/[0.06] p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">You&apos;re invited</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              Matchify AI matched you with this meetup by interests and area. Accept to RSVP — then complete the
              short questionnaire like other events.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                className="rounded-full"
                onClick={() => rsvpMutation.mutate()}
                disabled={rsvpMutation.isPending}
              >
                {rsvpMutation.isPending ? "Joining…" : "Accept invite"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                onClick={() => declineInviteMutation.mutate()}
                disabled={declineInviteMutation.isPending}
              >
                Decline
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Countdown Overlay */}
      {isCountingDown && revealTime && (
        <MatchCountdown
          targetTime={revealTime}
          onComplete={() => {
            setForceRevealed(true);
            setActiveTab('matches');
            queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/matches`, userId] });
            refetchEvent();
            refetchMatches();
          }}
          eventTitle={event.title}
        />
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-lg px-4 pb-6 pt-2"
      >
        <AnimatePresence mode="wait">
          {showQuestionnaire && !isHost ? (
            <motion.div
              key="questionnaire"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <EventMatchQuestionnaire
                eventId={event.id}
                eventTitle={event.title}
                questions={questions}
                onComplete={async () => {
                  setShowQuestionnaire(false);
                  // Refetch questionnaire to update completion status
                  await refetchQuestionnaire();
                  // Also invalidate event query
                  queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}`] });
                }}
                onCancel={() => setShowQuestionnaire(false)}
              />
            </motion.div>
          ) : (
            <motion.div
              key="tabs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                {/* Mobile-first: 2 cols (details + matches) or 3 with questionnaire for attendees */}
                <TabsList className={`grid w-full rounded-2xl bg-muted p-1 ${tabsGridClass}`}>
                  <TabsTrigger value="details" className="relative">
                    Event Details
                  </TabsTrigger>
                  {event.hasQuestionnaire && !isHost && (
                    <TabsTrigger value="questionnaire" className="relative">
                      <span className="flex items-center gap-1">
                        Questionnaire
                        {questionnaireCompleted && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="text-primary"
                          >
                            ✓
                          </motion.span>
                        )}
                      </span>
                    </TabsTrigger>
                  )}
                  {showHostTab ? (
                    <TabsTrigger value="host" className="relative">
                      <span className="flex items-center justify-center gap-1">
                        <Mic2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        <span className="truncate">Host</span>
                      </span>
                    </TabsTrigger>
                  ) : null}
                  <TabsTrigger value="matches" className="relative" disabled={!isRevealed}>
                    <span className="flex items-center gap-1">
                      Matches
                      {isRevealed ? (
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        >
                          <Heart className="w-4 h-4 fill-primary text-primary" />
                        </motion.div>
                      ) : (
                        <span className="text-[10px] font-semibold text-muted-foreground">(soon)</span>
                      )}
                    </span>
                  </TabsTrigger>
                </TabsList>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.22 }}
                  >
                    {activeTab === "details" && (
                      <TabsContent value="details" forceMount>
                        <Card className="border-2 border-primary/10 shadow-lg">
                          <CardContent className="p-6 space-y-6">
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.05 }}
                            >
                              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                                {event.title}
                              </h1>
                              <p className="text-muted-foreground text-lg">{event.description}</p>
                            </motion.div>

                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-4"
                          >
                            {([
                              { icon: Calendar, label: event.date, sublabel: event.time },
                              { icon: MapPin, label: event.location, badge: event.type === 'online' ? 'Online' : 'In Person' },
                              { icon: Users, label: `${event.attendeesCount || 0}/${event.capacity} attending` },
                              hostDisplayName && {
                                icon: UserRound,
                                label: `Host: ${hostDisplayName}`,
                              },
                              event.price && { icon: Clock, label: event.price },
                            ].filter(Boolean) as Array<{ icon: typeof Calendar; label: string; sublabel?: string; badge?: string }>).map((item, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 + index * 0.1 }}
                                whileHover={{ scale: 1.02 }}
                                className="flex items-center gap-3 p-3 rounded-lg border border-primary/10 hover:border-primary/30 hover:bg-primary/5 transition-all"
                              >
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                  <item.icon className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                  <p className="font-semibold">{item.label}</p>
                                  {item.sublabel && (
                                    <p className="text-sm text-muted-foreground">{item.sublabel}</p>
                                  )}
                                  {item.badge && (
                                    <Badge variant="outline" className="mt-1">{item.badge}</Badge>
                                  )}
                                </div>
                              </motion.div>
                            ))}
                          </motion.div>

                          {/* RSVP / hosting — hosts are treated as already in; no attendee questionnaire */}
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-col gap-3"
                          >
                            {isHost ? (
                              <>
                                <Badge className="w-fit px-4 py-2 text-sm bg-primary/15 text-primary border border-primary/30">
                                  You're hosting this event
                                </Badge>
                                <p className="text-sm text-muted-foreground">
                                  You’re already joined. Attendees who RSVP complete the match questionnaire to be paired.
                                </p>
                              </>
                            ) : null}

                            {!isHost && !isRSVPd ? (
                              <Button
                                className="w-full sm:w-auto rounded-full h-12 font-bold bg-success text-success-foreground hover:bg-success/90"
                                disabled={rsvpMutation.isPending}
                                onClick={() => rsvpMutation.mutate()}
                              >
                                {rsvpMutation.isPending ? "RSVPing…" : "RSVP"}
                              </Button>
                            ) : !isHost ? (
                              <div className="flex flex-col sm:flex-row gap-3">
                                <Badge className="w-fit px-4 py-2 text-sm bg-success/20 text-success border border-success/40">
                                  You're going
                                </Badge>
                                <Button
                                  variant="outline"
                                  className="w-full sm:w-auto rounded-full h-12"
                                  disabled={cancelRsvpMutation.isPending}
                                  onClick={() => cancelRsvpMutation.mutate()}
                                >
                                  {cancelRsvpMutation.isPending ? "Cancelling…" : "Cancel RSVP"}
                                </Button>
                              </div>
                            ) : null}
                          </motion.div>

                          {event.hasQuestionnaire && !questionnaireCompleted && !isHost && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.4 }}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Button
                                className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all"
                                onClick={() => {
                                  setShowQuestionnaire(true);
                                  setActiveTab('questionnaire');
                                }}
                              >
                                <Sparkles className="w-4 h-4 mr-2" />
                                Complete Match Questionnaire
                              </Button>
                            </motion.div>
                          )}

                          {isCountingDown && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.5 }}
                            >
                              <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-primary/30 shadow-lg">
                                <CardContent className="p-6 text-center">
                                  <motion.div
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="inline-block mb-3"
                                  >
                                    <Zap className="w-8 h-8 text-primary" />
                                  </motion.div>
                                  <p className="font-bold text-lg">Matches will be revealed soon!</p>
                                  <p className="text-sm text-muted-foreground mt-2">
                                    Everyone will see their matches at the same time
                                  </p>
                                </CardContent>
                              </Card>
                            </motion.div>
                          )}
                        </CardContent>
                      </Card>
                      </TabsContent>
                    )}

                    {activeTab === "host" && showHostTab && (
                      <TabsContent value="host" forceMount>
                        <Card className="border-2 border-primary/15 shadow-lg">
                          <CardContent className="space-y-4 p-5 sm:p-6">
                            <div>
                              <h2 className="text-lg font-bold text-foreground">Host tools</h2>
                              <p className="mt-1 text-sm text-muted-foreground">
                                Edit your listing or run SparkBox (questionnaire submissions, match calculation,
                                reveal timer).
                              </p>
                            </div>
                            <Button
                              type="button"
                              className="w-full rounded-full font-semibold sm:w-auto"
                              onClick={() => setLocation(editEventHref)}
                            >
                              <Pencil className="mr-2 h-4 w-4" aria-hidden />
                              Edit event
                            </Button>
                            {event.hasQuestionnaire ? (
                              <EventMatchAdmin eventId={event.id} eventTitle={event.title} />
                            ) : (
                              <Card className="border-dashed border-muted-foreground/30 bg-muted/30">
                                <CardContent className="p-4 text-sm text-muted-foreground">
                                  This event doesn&apos;t use the match questionnaire yet. Edit the event and keep
                                  &quot;Match questionnaire&quot; enabled to unlock SparkBox tools here.
                                </CardContent>
                              </Card>
                            )}
                          </CardContent>
                        </Card>
                      </TabsContent>
                    )}

                    {activeTab === "questionnaire" && event.hasQuestionnaire && !isHost && (
                      <TabsContent value="questionnaire" forceMount>
                        {questionnaireCompleted && !isEditingAnswers ? (
                          <Card className="border-2 border-primary/20 shadow-lg">
                            <CardContent className="p-8 text-center">
                              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center mx-auto mb-4">
                                <Heart className="w-10 h-10 text-primary fill-primary" />
                              </div>
                              <h3 className="text-2xl font-bold mb-2">Questionnaire Completed! ✅</h3>
                              <p className="text-muted-foreground mb-6 text-lg">
                                Your answers have been saved. Matches will be revealed at the event.
                              </p>
                              <Button variant="outline" type="button" onClick={() => setIsEditingAnswers(true)}>
                                Edit Answers
                              </Button>
                            </CardContent>
                          </Card>
                        ) : (
                          <EventMatchQuestionnaire
                            eventId={event.id}
                            eventTitle={event.title}
                            questions={questions}
                            initialAnswers={(() => {
                              if (!questionnaire?.answers) return undefined;
                              try {
                                const raw = questionnaire.answers;
                                if (typeof raw === 'object' && raw !== null) return raw as Record<string, string>;
                                if (typeof raw === 'string') return JSON.parse(raw) as Record<string, string>;
                              } catch {
                                return undefined;
                              }
                              return undefined;
                            })()}
                            onComplete={async () => {
                              setShowQuestionnaire(false);
                              setIsEditingAnswers(false);
                              await refetchQuestionnaire();
                              queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}`] });
                            }}
                            onCancel={() => {
                              setShowQuestionnaire(false);
                              setIsEditingAnswers(false);
                            }}
                          />
                        )}
                      </TabsContent>
                    )}

                    {activeTab === "matches" && (
                      <TabsContent value="matches" forceMount>
                        {isRevealed ? (
                          <EventMatchResults
                            matches={matches}
                            eventTitle={event.title}
                            eventId={event.id}
                          viewerUserId={userId}
                            onMessage={(userId) => setLocation(`/chat?user=${userId}`)}
                          />
                        ) : (
                          <Card className="border border-gray-100 bg-white shadow-sm">
                            <CardContent className="p-5">
                              <p className="text-sm font-semibold text-foreground">Matches aren’t revealed yet</p>
                              <p className="mt-1 text-sm text-muted-foreground">
                                Once the host starts the reveal, your match profiles will appear here automatically.
                              </p>
                            </CardContent>
                          </Card>
                        )}
                      </TabsContent>
                    )}

                  </motion.div>
                </AnimatePresence>
              </Tabs>
              </motion.div>
            )}
          </AnimatePresence>

          <BottomNav active="explore" />
        </motion.div>
    </div>
  );
}
