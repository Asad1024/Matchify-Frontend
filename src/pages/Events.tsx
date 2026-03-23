import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/common/Header";
import EventCard from "@/components/events/EventCard";
import SwipeableEventCard from "@/components/events/SwipeableEventCard";
import BottomNav from "@/components/common/BottomNav";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CalendarDays, Grid3x3, Zap, Sparkles } from "lucide-react";
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

export default function Events() {
  const [activePage, setActivePage] = useState('explore');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { userId: currentUserId } = useCurrentUser();
  const { logout } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const [swipeStack, setSwipeStack] = useState<Event[]>([]);
  const [filterType, setFilterType] = useState<string>("all");
  const [scope, setScope] = useState<"all" | "mine">("all");
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid');
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
          setLocation(`/event/${variables.eventId}`);
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

  // Ensure events is always an array
  const safeEvents = Array.isArray(events) ? events : [];
  const onlineEvents = safeEvents.filter(e => e && e.type === 'online');
  const offlineEvents = safeEvents.filter(e => e && e.type === 'offline');

  // Initialize swipe stack when events load
  const initializeSwipeStack = () => {
    if (safeEvents.length > 0) {
      setSwipeStack([...safeEvents].reverse()); // Reverse so we can pop from the end
    }
  };

  // Auto-initialize swipe stack when events change
  useEffect(() => {
    if (safeEvents.length > 0 && swipeStack.length === 0) {
      initializeSwipeStack();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeEvents.length]);

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

  // Filter events
  let filteredEvents = filterType === "all" 
    ? safeEvents 
    : filterType === "online" 
    ? onlineEvents 
    : offlineEvents;

  if (scope === "mine") {
    filteredEvents = filteredEvents.filter((event) => isRSVPd(event.id));
  }

  // Sort events
  filteredEvents = [...filteredEvents].sort((a, b) => {
    if (sortBy === "popular") {
      // Sort by attendees count (most popular first)
      return (b.attendeesCount || 0) - (a.attendeesCount || 0);
    } else {
      // Sort by newest first (by createdAt or id)
      const aDate = new Date((a as any).createdAt || a.id).getTime();
      const bDate = new Date((b as any).createdAt || b.id).getTime();
      return bDate - aDate;
    }
  });

  // Show loading if no userId (after all hooks are called)
  if (!currentUserId) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header
        showSearch={true}
        title="Events"
        subtitle="Match-friendly meetups near you"
        onSearch={(query) => console.log('Search events:', query)}
        onNotifications={() => setLocation('/notifications')}
        onCreate={() => setLocation('/events/create')}
        onSettings={() => setLocation('/profile')}
        onLogout={logout}
      />

      {currentUserProfile?.selfDiscoveryCompleted && aiQuartetEndsAt != null && (
        <div className="max-w-7xl mx-auto px-3 sm:px-4 pt-3">
          <div
            className="rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-pink-500/10 to-primary/5 p-4 flex flex-col sm:flex-row sm:items-center gap-4 shadow-sm"
            data-testid="banner-ai-date-night"
          >
            <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-foreground">AI Date Night — 4 couples</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                You&apos;re all set. We&apos;re auto-forming a small group table; spots finalize when
                the timer hits zero.
              </p>
            </div>
            <div className="text-left sm:text-right flex-shrink-0">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                Time left to lock group
              </p>
              <p className="text-xl font-display font-bold text-primary tabular-nums">
                {formatCountdown(aiQuartetMsLeft)}
              </p>
            </div>
          </div>
        </div>
      )}

      <motion.div 
          className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-6"
        initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5 }}
      >
        <div className="mb-4 sm:mb-6">
            <div className="flex items-start justify-between gap-4 mb-3 sm:mb-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Upcoming Events</h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
                Discover halal-friendly events, RSVP quickly, and track your plan.
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
              onClick={() => setLocation('/events/create')}
              className="hidden sm:flex"
              size="sm"
            >
              <CalendarDays className="w-4 h-4 mr-2" />
              Create Event
            </Button>
            </div>

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

        <Tabs defaultValue="grid" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="grid" data-testid="tab-grid" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-3">
              <Grid3x3 className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline sm:inline">Grid</span>
            </TabsTrigger>
            <TabsTrigger value="swipe" data-testid="tab-swipe" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-3" onClick={initializeSwipeStack}>
              <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline sm:inline">Swipe</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" data-testid="tab-calendar" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2 sm:py-3">
              <CalendarDays className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline sm:inline">Calendar</span>
            </TabsTrigger>
          </TabsList>

                 <TabsContent value="grid">
                   {isLoading ? (
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {[...Array(6)].map((_, i) => (
                  <EventSkeleton key={i} />
                ))}
              </div>
            ) : filteredEvents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
                      isRSVPd={isRSVPd(event.id)}
                      isLoading={isRSVPing || isCancelling}
                      onRSVP={(id) => {
                        if (isRSVPd(id)) {
                          cancelRsvpMutation.mutate({ eventId: id });
                        } else {
                          rsvpMutation.mutate({ eventId: id });
                        }
                      }}
                      onClick={(id) => setLocation(`/event/${id}`)}
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

          <TabsContent value="swipe">
            <div className="flex flex-col items-center justify-center min-h-[600px] py-8">
              {swipeStack.length === 0 ? (
                <div className="w-full max-w-md mx-auto">
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
                <div className="relative w-full max-w-sm h-[600px]">
                  <AnimatePresence mode="wait">
                    {swipeStack.slice(-1).map((event) => (
                      <SwipeableEventCard
                        key={event.id}
                        {...event}
                        image={event.image || undefined}
                        type={event.type as "online" | "offline"}
                        attendees={(event as any).attendeesCount || 0}
                        onSwipeLeft={(id) => handleSwipeLeft(id)}
                        onSwipeRight={(id) => handleSwipeRight(id)}
                      />
                    ))}
                  </AnimatePresence>
                  <div className="absolute -bottom-16 left-0 right-0 text-center">
                    <motion.p 
                      key={swipeStack.length}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-muted-foreground"
                    >
                      {swipeStack.length} event{swipeStack.length !== 1 ? 's' : ''} remaining
                    </motion.p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="calendar">
            <div className="space-y-4">
              <div className="grid grid-cols-7 gap-2 text-center font-medium text-sm text-muted-foreground mb-4">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {[...Array(35)].map((_, i) => {
                  const dayNumber = i - 2; // Offset for starting day
                  const hasEvent = dayNumber > 0 && dayNumber <= 30 && dayNumber % 7 === 0;
                  return (
                    <div
                      key={i}
                      className={`aspect-square p-2 rounded-lg border border-border/50 ${
                        dayNumber > 0 && dayNumber <= 30
                          ? hasEvent
                            ? 'bg-primary/20 border-primary/50 cursor-pointer hover:bg-primary/30'
                            : 'hover:bg-muted/50 cursor-pointer'
                          : 'bg-muted/20'
                      }`}
                    >
                      {dayNumber > 0 && dayNumber <= 30 && (
                        <div className="text-sm font-medium text-foreground">{dayNumber}</div>
                      )}
                      {hasEvent && (
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mx-auto mt-1" />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Events This Month</h3>
                <div className="space-y-3">
                  {filteredEvents.slice(0, 5).map((event) => (
                    <div key={event.id} className="flex items-center gap-3 p-3 rounded-lg bg-card hover-elevate cursor-pointer">
                      <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <CalendarDays className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground truncate">{event.title}</h4>
                        <p className="text-sm text-muted-foreground">{event.date} • {event.time}</p>
                      </div>
                      <Button
                        size="sm"
                        variant={isRSVPd(event.id) ? "outline" : "default"}
                        className={!isRSVPd(event.id) ? "glow-primary" : ""}
                        disabled={rsvpMutation.isPending || cancelRsvpMutation.isPending}
                        onClick={() => {
                          if (isRSVPd(event.id)) {
                            cancelRsvpMutation.mutate({ eventId: event.id });
                          } else {
                            rsvpMutation.mutate({ eventId: event.id });
                          }
                        }}
                        data-testid={`button-calendar-rsvp-${event.id}`}
                      >
                        {rsvpMutation.isPending || cancelRsvpMutation.isPending ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-3 h-3 border-2 border-current border-t-transparent rounded-full"
                          />
                        ) : (
                          isRSVPd(event.id) ? '✓' : 'RSVP'
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
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
