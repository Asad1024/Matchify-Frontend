import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useSearchParams } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/common/Header";
import EventCard from "@/components/events/EventCard";
import SwipeableEventCard from "@/components/events/SwipeableEventCard";
import BottomNav from "@/components/common/BottomNav";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CalendarDays, Grid3x3, Zap, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { FilterBar } from "@/components/common/FilterBar";
import { PullToRefresh } from "@/components/common/PullToRefresh";
import { EventSkeleton } from "@/components/ui/skeleton-enhanced";
import { EmptyEvents, EmptyState } from "@/components/common/EmptyState";
import type { Event, User } from "@shared/schema";
import { formatCountdown } from "@/hooks/useAiMatchCooldown";
import { parseEventDateKey, toDateKeyLocal, dateKeyFromParts } from "@/lib/eventDateUtils";
import { cn } from "@/lib/utils";

export default function Events() {
  const [activePage, setActivePage] = useState('explore');
  const [, setLocation] = useLocation();
  const [searchParams] = useSearchParams();
  const fromExplore = searchParams.get("from") === "explore";
  const fromExploreRef = useRef(false);
  fromExploreRef.current = fromExplore;
  const { toast } = useToast();
  const { userId: currentUserId } = useCurrentUser();
  const { logout } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const [swipeStack, setSwipeStack] = useState<Event[]>([]);
  const [filterType, setFilterType] = useState<string>("all");
  const [scope, setScope] = useState<"all" | "mine">("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({ type: filterType });
  const navigationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const AI_QUARTET_STORAGE = "matchify_ai_date_night_deadline";

  // All hooks must be called before any conditional returns
  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ['/api/events'],
  });

  const { data: currentUserProfile } = useQuery<User & { selfDiscoveryCompleted?: boolean }>({
    queryKey: [`/api/users/${currentUserId}`],
    enabled: !!currentUserId,
  });

  const [aiQuartetEndsAt, setAiQuartetEndsAt] = useState<number | null>(null);
  const [nowTick, setNowTick] = useState(() => Date.now());

  useEffect(() => {
    if (!currentUserId || !currentUserProfile?.selfDiscoveryCompleted) {
      setAiQuartetEndsAt(null);
      return;
    }
    const key = `${AI_QUARTET_STORAGE}_${currentUserId}`;
    let raw = localStorage.getItem(key);
    if (!raw) {
      const end = Date.now() + 48 * 60 * 60 * 1000;
      localStorage.setItem(key, String(end));
      raw = String(end);
    }
    const parsed = parseInt(raw, 10);
    setAiQuartetEndsAt(Number.isFinite(parsed) ? parsed : null);
  }, [currentUserId, currentUserProfile?.selfDiscoveryCompleted]);

  useEffect(() => {
    if (aiQuartetEndsAt == null) return undefined;
    const id = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [aiQuartetEndsAt]);

  const aiQuartetMsLeft =
    aiQuartetEndsAt != null ? Math.max(0, aiQuartetEndsAt - nowTick) : 0;

  const { data: rsvps = [], refetch: refetchRsvps } = useQuery({
    queryKey: ['/api/users', currentUserId, 'rsvps'],
    enabled: !!currentUserId, // Only fetch if userId exists
    refetchOnMount: true, // Always refetch when component mounts
  });

  type EventsNotificationRow = {
    id: string;
    type?: string;
    relatedEntityId?: string | null;
    read?: boolean | null;
  };

  const { data: eventNotifications = [] } = useQuery<EventsNotificationRow[]>({
    queryKey: ["/api/users", currentUserId, "notifications"],
    enabled: !!currentUserId,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  const rsvpMutation = useMutation({
    mutationFn: async ({ eventId }: { eventId: string }) => {
      const res = await apiRequest('POST', '/api/events/rsvps', { userId: currentUserId, eventId });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Failed to RSVP' }));
        throw new Error(error.message || 'Failed to RSVP');
      }
      return res.json();
    },
    onMutate: async ({ eventId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/events'] });
      await queryClient.cancelQueries({ queryKey: ['/api/users', currentUserId, 'rsvps'] });

      // Snapshot previous values
      const previousEvents = queryClient.getQueryData(['/api/events']);
      const previousRsvps = queryClient.getQueryData(['/api/users', currentUserId, 'rsvps']);

      // Optimistically update events
      queryClient.setQueryData(['/api/events'], (oldEvents: Event[] = []) => {
        return oldEvents.map((e: Event) => 
          e.id === eventId 
            ? { ...e, attendeesCount: (e.attendeesCount || 0) + 1 } 
            : e
        );
      });

      // Optimistically update RSVPs
      queryClient.setQueryData(['/api/users', currentUserId, 'rsvps'], (oldRsvps: any[] = []) => {
        const exists = oldRsvps.some((r: any) => r.eventId === eventId);
        if (!exists) {
          return [...oldRsvps, { eventId, userId: currentUserId }];
        }
        return oldRsvps;
      });

      return { previousEvents, previousRsvps };
    },
    onSuccess: async (data, variables) => {
      // Update with actual server response
      if (data?.event) {
        queryClient.setQueryData(['/api/events'], (oldEvents: Event[] = []) => {
          return oldEvents.map((e: Event) => 
            e.id === variables.eventId ? { ...e, attendeesCount: data.event.attendeesCount } : e
          );
        });
      }
      
      if (data?.rsvp) {
        queryClient.setQueryData(['/api/users', currentUserId, 'rsvps'], (oldRsvps: any[] = []) => {
          const exists = oldRsvps.some((r: any) => r.eventId === variables.eventId);
          if (!exists) {
            return [...oldRsvps, data.rsvp];
          }
          return oldRsvps.map((r: any) => 
            r.eventId === variables.eventId ? data.rsvp : r
          );
        });
      }
      
      // Invalidate queries to refresh data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/events'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/users', currentUserId, 'rsvps'] }),
        queryClient.invalidateQueries({ queryKey: [`/api/events/${variables.eventId}`] }),
      ]);
      
      // Check if event has questionnaire enabled - use data from response if available
      const eventData = data?.event || events.find(e => e.id === variables.eventId);
      const hasQuestionnaire = eventData && (eventData as any).hasQuestionnaire;
      
      // Clear any existing navigation timeout
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
      
      if (hasQuestionnaire) {
        toast({
          title: "RSVP Confirmed! ✅",
          description: "Now complete the match questionnaire to get matched!",
        });
        // Navigate after a short delay for better UX
        navigationTimeoutRef.current = setTimeout(() => {
          setLocation(
            fromExploreRef.current
              ? `/event/${variables.eventId}?from=explore`
              : `/event/${variables.eventId}`,
          );
          navigationTimeoutRef.current = null;
        }, 500);
      } else {
        toast({
          title: "RSVP Confirmed! ✅",
          description: "You're registered for this event",
        });
        // Don't navigate if no questionnaire
      }
    },
    onError: (error: Error, variables, context) => {
      // Rollback optimistic updates
      if (context?.previousEvents) {
        queryClient.setQueryData(['/api/events'], context.previousEvents);
      }
      if (context?.previousRsvps) {
        queryClient.setQueryData(['/api/users', currentUserId, 'rsvps'], context.previousRsvps);
      }
      
      toast({
        title: "RSVP Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const cancelRsvpMutation = useMutation({
    mutationFn: async ({ eventId }: { eventId: string }) => {
      const res = await apiRequest('DELETE', `/api/events/rsvps/${currentUserId}/${eventId}`);
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Failed to cancel RSVP' }));
        throw new Error(error.message || 'Failed to cancel RSVP');
      }
      return res.json();
    },
    onMutate: async ({ eventId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/events'] });
      await queryClient.cancelQueries({ queryKey: ['/api/users', currentUserId, 'rsvps'] });

      // Snapshot previous values
      const previousEvents = queryClient.getQueryData(['/api/events']);
      const previousRsvps = queryClient.getQueryData(['/api/users', currentUserId, 'rsvps']);

      // Optimistically update events
      queryClient.setQueryData(['/api/events'], (oldEvents: Event[] = []) => {
        return oldEvents.map((e: Event) => 
          e.id === eventId 
            ? { ...e, attendeesCount: Math.max(0, (e.attendeesCount || 0) - 1) } 
            : e
        );
      });

      // Optimistically remove RSVP
      queryClient.setQueryData(['/api/users', currentUserId, 'rsvps'], (oldRsvps: any[] = []) => {
        return oldRsvps.filter((r: any) => r.eventId !== eventId);
      });

      return { previousEvents, previousRsvps };
    },
    onSuccess: async (data, variables) => {
      // Update with actual server response
      if (data?.event) {
        queryClient.setQueryData(['/api/events'], (oldEvents: Event[] = []) => {
          return oldEvents.map((e: Event) => 
            e.id === variables.eventId ? { ...e, attendeesCount: data.event.attendeesCount } : e
          );
        });
      }
      
      // Invalidate queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/events'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/users', currentUserId, 'rsvps'] }),
        queryClient.invalidateQueries({ queryKey: [`/api/events/${variables.eventId}`] }),
      ]);
      
      toast({
        title: "RSVP Cancelled",
        description: "You've cancelled your registration",
      });
    },
    onError: (error: Error, variables, context) => {
      // Rollback optimistic updates
      if (context?.previousEvents) {
        queryClient.setQueryData(['/api/events'], context.previousEvents);
      }
      if (context?.previousRsvps) {
        queryClient.setQueryData(['/api/users', currentUserId, 'rsvps'], context.previousRsvps);
      }
      
      toast({
        title: "Cancel Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const isRSVPd = (eventId: string) => {
    const safeRsvps = Array.isArray(rsvps) ? rsvps : [];
    return safeRsvps.some((r: any) => r && r.eventId === eventId);
  };

  const invitedEventIdsWithoutRsvp = useMemo(() => {
    const list = Array.isArray(eventNotifications) ? eventNotifications : [];
    const safeRsvps = Array.isArray(rsvps) ? rsvps : [];
    const rsvpIds = new Set(safeRsvps.map((r: any) => r?.eventId).filter(Boolean));
    const ids = new Set<string>();
    for (const n of list) {
      if (String(n.type) !== "ai_event_invite" || !n.relatedEntityId) continue;
      const eid = String(n.relatedEntityId);
      if (rsvpIds.has(eid)) continue;
      ids.add(eid);
    }
    return ids;
  }, [eventNotifications, rsvps]);

  // Ensure events is always an array
  const safeEvents = Array.isArray(events) ? events : [];
  const onlineEvents = safeEvents.filter(e => e && e.type === 'online');
  const offlineEvents = safeEvents.filter(e => e && e.type === 'offline');

  const filteredEvents = useMemo(() => {
    let list =
      filterType === "all"
        ? safeEvents
        : filterType === "online"
          ? onlineEvents
          : offlineEvents;
    if (scope === "mine") {
      const safeRsvps = Array.isArray(rsvps) ? rsvps : [];
      list = list.filter((event) => safeRsvps.some((r: any) => r && r.eventId === event.id));
    }
    return [...list].sort((a, b) => {
      const aInv = invitedEventIdsWithoutRsvp.has(a.id) ? 1 : 0;
      const bInv = invitedEventIdsWithoutRsvp.has(b.id) ? 1 : 0;
      if (aInv !== bInv) return bInv - aInv;
      if (sortBy === "popular") {
        return (b.attendeesCount || 0) - (a.attendeesCount || 0);
      }
      const aDate = new Date((a as any).createdAt || a.id).getTime();
      const bDate = new Date((b as any).createdAt || b.id).getTime();
      return bDate - aDate;
    });
  }, [safeEvents, onlineEvents, offlineEvents, filterType, scope, sortBy, rsvps, invitedEventIdsWithoutRsvp]);

  const firstPendingInviteEventId = useMemo(() => {
    for (const e of safeEvents) {
      if (invitedEventIdsWithoutRsvp.has(e.id)) return e.id;
    }
    const it = invitedEventIdsWithoutRsvp.values().next();
    return it.done ? null : String(it.value);
  }, [safeEvents, invitedEventIdsWithoutRsvp]);

  const initializeSwipeStack = useCallback(() => {
    if (filteredEvents.length > 0) {
      setSwipeStack([...filteredEvents].reverse());
    } else {
      setSwipeStack([]);
    }
  }, [filteredEvents]);

  useEffect(() => {
    if (filteredEvents.length > 0 && swipeStack.length === 0) {
      initializeSwipeStack();
    }
  }, [filteredEvents.length, swipeStack.length, initializeSwipeStack]);

  const [calendarMonth, setCalendarMonth] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, Event[]>();
    for (const e of filteredEvents) {
      const key = parseEventDateKey(e.date);
      if (!key) continue;
      const list = map.get(key) ?? [];
      list.push(e);
      map.set(key, list);
    }
    return map;
  }, [filteredEvents]);

  const calendarCells = useMemo(() => {
    const y = calendarMonth.getFullYear();
    const m = calendarMonth.getMonth();
    const first = new Date(y, m, 1);
    const startPad = first.getDay();
    const lastDay = new Date(y, m + 1, 0).getDate();
    const cells: Array<{ kind: "pad" } | { kind: "day"; day: number; key: string }> = [];
    for (let i = 0; i < startPad; i++) cells.push({ kind: "pad" });
    for (let d = 1; d <= lastDay; d++) {
      cells.push({ kind: "day", day: d, key: dateKeyFromParts(y, m, d) });
    }
    while (cells.length % 7 !== 0) cells.push({ kind: "pad" });
    while (cells.length < 42) cells.push({ kind: "pad" });
    return cells;
  }, [calendarMonth]);

  const calendarListEvents = useMemo(() => {
    const sortByDateTime = (a: Event, b: Event) => {
      const ta = parseEventDateKey(a.date) ?? "";
      const tb = parseEventDateKey(b.date) ?? "";
      if (ta !== tb) return ta.localeCompare(tb);
      return (a.time || "").localeCompare(b.time || "");
    };
    if (selectedDateKey) {
      return (eventsByDate.get(selectedDateKey) ?? []).slice().sort(sortByDateTime);
    }
    const y = calendarMonth.getFullYear();
    const m = calendarMonth.getMonth();
    return filteredEvents
      .filter((e) => {
        const k = parseEventDateKey(e.date);
        if (!k) return false;
        const [ey, em] = k.split("-").map(Number);
        return ey === y && em - 1 === m;
      })
      .sort(sortByDateTime);
  }, [selectedDateKey, eventsByDate, calendarMonth, filteredEvents]);

  useEffect(() => {
    setSelectedDateKey(null);
  }, [calendarMonth]);

  // Cleanup navigation timeout on unmount
  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  // Handle swipe actions
  const handleSwipeRight = (eventId: string) => {
    // RSVP first, then remove from stack on success
    // The rsvpMutation.onSuccess will handle navigation if questionnaire exists
    rsvpMutation.mutate(
      { eventId },
      {
        onSuccess: (data, variables) => {
          // Remove from stack after successful RSVP
          setSwipeStack(prev => prev.filter(e => e.id !== eventId));
          
          // If event has questionnaire, navigation will happen in rsvpMutation.onSuccess
          // If no questionnaire, user stays in swipe view
        },
        onError: () => {
          // Keep card in stack if RSVP fails
          // User can try again
        },
      }
    );
  };

  const handleSwipeLeft = (eventId: string) => {
    // Remove from stack
    setSwipeStack(prev => prev.filter(e => e.id !== eventId));
  };

  // Handle refresh
  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['/api/events'] });
    await queryClient.invalidateQueries({ queryKey: ['/api/users', currentUserId, 'rsvps'] });
    await queryClient.invalidateQueries({ queryKey: ["/api/users", currentUserId, "notifications"] });
    await refetchRsvps(); // Force refetch RSVPs to clear cache
  };

  // Handle filter changes
  const handleFilterChange = (filterId: string, value: string) => {
    if (filterId === "type") {
      setFilterType(value);
      setActiveFilters(prev => ({ ...prev, type: value }));
    }
  };

  const handleFilterRemove = (filterId: string) => {
    if (filterId === "type") {
      setFilterType("all");
      setActiveFilters(prev => {
        const newFilters = { ...prev };
        delete newFilters.type;
        return newFilters;
      });
    }
  };

  // Show loading if no userId (after all hooks are called)
  if (!currentUserId) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="min-h-screen bg-[hsl(var(--surface-2))] pb-24">
      <Header
        showSearch={true}
        title="Events"
        subtitle="Match-friendly meetups near you"
        onSearch={(query) => console.log('Search events:', query)}
        onNotifications={() => setLocation('/notifications')}
        onCreate={() => setLocation(fromExplore ? "/events/create?from=explore" : "/events/create")}
        onSettings={() => setLocation('/profile')}
        onLogout={logout}
      />

      {currentUserProfile?.selfDiscoveryCompleted && aiQuartetEndsAt != null && (
        <div className="mx-auto max-w-lg px-4 pt-3">
          <div
            className="matchify-surface rounded-2xl border-primary/25 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center gap-4"
            data-testid="banner-ai-date-night"
          >
            <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground">AI Date Night — 4 couples</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                You&apos;re all set. We&apos;re auto-forming a small group table; spots finalize when
                the timer hits zero.
              </p>
            </div>
            <div className="text-left sm:text-right flex-shrink-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Time left to lock group
              </p>
              <p className="text-xl font-display font-bold text-primary tabular-nums">
                {formatCountdown(aiQuartetMsLeft)}
              </p>
            </div>
          </div>
        </div>
      )}

      {invitedEventIdsWithoutRsvp.size > 0 ? (
        <div className="mx-auto max-w-lg px-4 pt-3">
          <div
            className="flex flex-col gap-3 rounded-2xl border border-violet-200/90 bg-gradient-to-br from-violet-50 to-fuchsia-50/80 p-4 shadow-sm sm:flex-row sm:items-center"
            data-testid="banner-ai-event-invites"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-md">
              <Sparkles className="h-6 w-6" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground">
                You&apos;re invited to {invitedEventIdsWithoutRsvp.size}{" "}
                {invitedEventIdsWithoutRsvp.size === 1 ? "meetup" : "meetups"}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Matchify added you to the guest list. Purple labels on the cards show which ones — RSVP to save your spot.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:items-end">
              {firstPendingInviteEventId ? (
                <Button
                  size="sm"
                  className="w-full rounded-xl bg-violet-600 font-semibold hover:bg-violet-700 sm:w-auto"
                  onClick={() =>
                    setLocation(
                      fromExplore
                        ? `/event/${firstPendingInviteEventId}?from=explore`
                        : `/event/${firstPendingInviteEventId}`,
                    )
                  }
                >
                  Open an invite
                </Button>
              ) : null}
              <Button
                size="sm"
                variant="outline"
                className="w-full rounded-xl border-violet-200 sm:w-auto"
                onClick={() => setLocation("/notifications")}
              >
                Notifications
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <motion.div
          className="mx-auto max-w-lg px-4 pb-6 pt-2"
        initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5 }}
      >
        {fromExplore ? (
          <Button
            variant="ghost"
            className="-ml-2 mb-2 h-10 px-2 text-gray-700"
            onClick={() => setLocation("/explore?tab=events")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Explore
          </Button>
        ) : null}
        <div className="mb-5">
            <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Discover meetups, RSVP in one tap, and keep track of what you&apos;re going to.
              </p>
              <Button
                variant="ghost"
                className="px-0 mt-2 text-primary h-auto font-medium"
                onClick={() => setLocation('/events/demo')}
              >
                <Sparkles className="w-4 h-4 mr-1" />
                See how match reveal & countdown work (demo)
              </Button>
            </div>
            <Button
              onClick={() =>
                setLocation(fromExplore ? "/events/create?from=explore" : "/events/create")
              }
              className="hidden shrink-0 sm:flex"
              size="sm"
            >
              <CalendarDays className="w-4 h-4 mr-2" />
              Create
            </Button>
            </div>

            <Button
              onClick={() =>
                setLocation(fromExplore ? "/events/create?from=explore" : "/events/create")
              }
              className="w-full sm:hidden mt-3 rounded-xl font-bold"
              size="sm"
            >
              <CalendarDays className="w-4 h-4 mr-2" />
              Create an event
            </Button>

            <div className="flex gap-2 mt-2 sm:mt-0">
              <Button
                size="sm"
                variant={scope === "all" ? "default" : "outline"}
                onClick={() => setScope("all")}
                data-testid="button-scope-all-events"
              >
                All Events
              </Button>
              <Button
                size="sm"
                variant={scope === "mine" ? "default" : "outline"}
                onClick={() => setScope("mine")}
                data-testid="button-scope-my-rsvps"
              >
                My RSVPs
              </Button>
            </div>

            {/* Enhanced Filter Bar */}
            <FilterBar
              className="max-w-full"
              filters={[
                { id: "type", label: "Type", value: filterType, options: ["online", "offline"] },
              ]}
              sortOptions={[
                { id: "newest", label: "Newest", value: "newest" },
                { id: "popular", label: "Most Popular", value: "popular" },
              ]}
              activeFilters={Object.keys(activeFilters)}
              onFilterChange={handleFilterChange}
              onFilterRemove={handleFilterRemove}
              onSortChange={setSortBy}
              sortValue={sortBy}
            />
        </div>

        <Tabs defaultValue="grid" className="space-y-4">
          <TabsList className="grid h-auto w-full min-w-0 grid-cols-3 gap-0.5 p-1">
            <TabsTrigger value="grid" data-testid="tab-grid" className="min-w-0 gap-1 px-1 py-2.5 text-xs sm:gap-2 sm:px-2 sm:text-sm">
              <Grid3x3 className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
              <span className="truncate">Grid</span>
            </TabsTrigger>
            <TabsTrigger value="swipe" data-testid="tab-swipe" className="min-w-0 gap-1 px-1 py-2.5 text-xs sm:gap-2 sm:px-2 sm:text-sm" onClick={initializeSwipeStack}>
              <Zap className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
              <span className="truncate">Swipe</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" data-testid="tab-calendar" className="min-w-0 gap-1 px-1 py-2.5 text-xs sm:gap-2 sm:px-2 sm:text-sm">
              <CalendarDays className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
              <span className="truncate">Calendar</span>
            </TabsTrigger>
          </TabsList>

                 <TabsContent value="grid" className="mt-4 outline-none">
                   {isLoading ? (
                     <div className="flex flex-col gap-5">
                {[...Array(4)].map((_, i) => (
                  <EventSkeleton key={i} />
                ))}
              </div>
            ) : filteredEvents.length > 0 ? (
              <div className="flex flex-col gap-5">
                {filteredEvents.map((event) => {
                  const isRSVPing = rsvpMutation.isPending && rsvpMutation.variables?.eventId === event.id;
                  const isCancelling = cancelRsvpMutation.isPending && cancelRsvpMutation.variables?.eventId === event.id;
                  
                  return (
                    <EventCard
                      key={event.id}
                      {...event}
                      image={event.image || undefined}
                      type={event.type as "online" | "offline"}
                      attendees={event.attendeesCount || 0}
                      youAreInvited={invitedEventIdsWithoutRsvp.has(event.id)}
                      isRSVPd={isRSVPd(event.id)}
                      isLoading={isRSVPing || isCancelling}
                      onRSVP={(id) => {
                        if (isRSVPd(id)) {
                          cancelRsvpMutation.mutate({ eventId: id });
                        } else {
                          rsvpMutation.mutate({ eventId: id });
                        }
                      }}
                      onClick={(id) =>
                        setLocation(
                          fromExplore ? `/event/${id}?from=explore` : `/event/${id}`,
                        )
                      }
                    />
                  );
                })}
              </div>
            ) : scope === "mine" ? (
              <EmptyState
                title="No RSVPs yet"
                description="You haven’t joined an event yet. Switch to All Events and RSVP to see your list."
                actionLabel="Browse all events"
                onAction={() => setScope("all")}
                useMascot={true}
              />
            ) : (
              <EmptyEvents />
            )}
          </TabsContent>

          <TabsContent value="swipe" className="mt-4 outline-none">
            <div className="flex min-h-[min(640px,85vh)] flex-col items-center py-4 sm:py-6">
              {swipeStack.length === 0 ? (
                <div className="mx-auto w-full max-w-md">
                  <EmptyState
                    useMascot={true}
                    mascotType="default"
                    title="No More Events"
                    description="You've viewed all available events. Check back later for more!"
                    actionLabel="Reload Events"
                    onAction={initializeSwipeStack}
                  />
                </div>
              ) : (
                <div className="relative w-full max-w-md min-h-[min(480px,70vh)] pb-14">
                  <AnimatePresence mode="wait">
                    {swipeStack.slice(-1).map((event) => (
                      <SwipeableEventCard
                        key={event.id}
                        {...event}
                        image={event.image || undefined}
                        type={event.type as "online" | "offline"}
                        attendees={(event as any).attendeesCount || 0}
                        youAreInvited={invitedEventIdsWithoutRsvp.has(event.id)}
                        onSwipeLeft={(id) => handleSwipeLeft(id)}
                        onSwipeRight={(id) => handleSwipeRight(id)}
                      />
                    ))}
                  </AnimatePresence>
                  <div className="absolute bottom-0 left-0 right-0 text-center">
                    <motion.p
                      key={swipeStack.length}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs font-medium text-muted-foreground sm:text-sm"
                    >
                      {swipeStack.length} event{swipeStack.length !== 1 ? "s" : ""} left in this list
                    </motion.p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="calendar" className="mt-4 outline-none">
            <div className="min-w-0 space-y-4">
              <div className="overflow-hidden rounded-2xl border border-gray-200/90 bg-white p-3 shadow-sm sm:p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0 rounded-full"
                    onClick={() =>
                      setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
                    }
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <h3 className="min-w-0 flex-1 text-center font-display text-base font-bold text-foreground sm:text-lg">
                    {calendarMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                  </h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0 rounded-full"
                    onClick={() =>
                      setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
                    }
                    aria-label="Next month"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
                <div className="grid grid-cols-7 gap-0.5 border-b border-stone-100 pb-2 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground sm:text-xs">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                    <div key={d} className="py-1">
                      {d}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1 pt-2">
                  {calendarCells.map((cell, i) => {
                    if (cell.kind === "pad") {
                      return <div key={`pad-${i}`} className="aspect-square min-h-[2.25rem]" aria-hidden />;
                    }
                    const { day, key } = cell;
                    const onDay = eventsByDate.get(key) ?? [];
                    const count = onDay.length;
                    const isToday = key === toDateKeyLocal(new Date());
                    const isSelected = selectedDateKey === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedDateKey((prev) => (prev === key ? null : key))}
                        className={cn(
                          "flex aspect-square min-h-[2.25rem] flex-col items-center justify-center rounded-xl border text-sm font-semibold transition-colors sm:min-h-[2.75rem]",
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground shadow-sm"
                            : count > 0
                              ? "border-primary/35 bg-primary/[0.08] text-foreground hover:bg-primary/[0.14]"
                              : "border-transparent bg-stone-50/80 text-foreground hover:bg-stone-100",
                          isToday && !isSelected && "ring-2 ring-primary/40 ring-offset-1",
                        )}
                      >
                        <span>{day}</span>
                        {count > 0 ? (
                          <span
                            className={cn(
                              "mt-0.5 h-1 w-1 rounded-full sm:h-1.5 sm:w-1.5",
                              isSelected ? "bg-primary-foreground/90" : "bg-primary",
                            )}
                          />
                        ) : (
                          <span className="mt-0.5 h-1 w-1 sm:h-1.5 sm:w-1.5" aria-hidden />
                        )}
                      </button>
                    );
                  })}
                </div>
                {selectedDateKey ? (
                  <div className="mt-3 flex justify-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 rounded-full text-xs text-muted-foreground"
                      onClick={() => setSelectedDateKey(null)}
                    >
                      Show all dates this month
                    </Button>
                  </div>
                ) : null}
              </div>

              <div>
                <h3 className="mb-3 font-display text-lg font-bold text-foreground">
                  {selectedDateKey
                    ? `Events on ${new Date(selectedDateKey + "T12:00:00").toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}`
                    : `Events in ${calendarMonth.toLocaleDateString(undefined, { month: "long" })}`}
                </h3>
                {calendarListEvents.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/80 px-4 py-8 text-center text-sm text-muted-foreground">
                    No events on your filters for this {selectedDateKey ? "day" : "month"}.
                  </p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {calendarListEvents.map((event) => {
                      const isRSVPing =
                        rsvpMutation.isPending && rsvpMutation.variables?.eventId === event.id;
                      const isCancelling =
                        cancelRsvpMutation.isPending && cancelRsvpMutation.variables?.eventId === event.id;
                      return (
                        <EventCard
                          key={event.id}
                          {...event}
                          image={event.image || undefined}
                          type={event.type as "online" | "offline"}
                          attendees={event.attendeesCount || 0}
                          youAreInvited={invitedEventIdsWithoutRsvp.has(event.id)}
                          isRSVPd={isRSVPd(event.id)}
                          isLoading={isRSVPing || isCancelling}
                          onRSVP={(id) => {
                            if (isRSVPd(id)) {
                              cancelRsvpMutation.mutate({ eventId: id });
                            } else {
                              rsvpMutation.mutate({ eventId: id });
                            }
                          }}
                          onClick={(id) =>
                            setLocation(
                              fromExplore ? `/event/${id}?from=explore` : `/event/${id}`,
                            )
                          }
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      <BottomNav active={activePage} onNavigate={setActivePage} />
    </div>
    </PullToRefresh>
  );
}
