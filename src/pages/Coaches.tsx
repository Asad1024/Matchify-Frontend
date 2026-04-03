import { useState, useMemo, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Header from "@/components/common/Header";
import CoachCard from "@/components/coaches/CoachCard";
import CoachBookingDialog from "@/components/coaches/CoachBookingDialog";
import BottomNav from "@/components/common/BottomNav";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrentUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { getMockData } from "@/lib/mockData";
import { buildApiUrl, getAuthHeaders } from "@/services/api";
import { Search, GraduationCap, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

type Coach = {
  id: string;
  name: string;
  specialty: string;
  bio: string;
  pricePerSession: number;
  rating: number;
  reviewCount?: number;
  languages?: string[] | null;
  avatar?: string | null;
  createdAt?: Date | null;
};

type UserBooking = {
  id: string;
  coachId?: string;
  status: string;
  paymentStatus: string;
  sessionDate?: string | null;
  selectedSlot?: string | null;
  proposedSlots?: string[] | null;
  adminNotes?: string | null;
  coach?: { name?: string } | null;
};

/** Bookings in these states block booking the same coach again until resolved or completed. */
const ACTIVE_COACH_BOOKING_STATUSES = new Set([
  "pending_admin_confirmation",
  "awaiting_user_reschedule_response",
  "confirmed",
]);

function formatCoachSlotLabel(s: string): string {
  const t = s.trim();
  if (!t) return t;
  const ms = Date.parse(t);
  if (!Number.isNaN(ms)) {
    try {
      return new Date(ms).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
    } catch {
      /* ignore */
    }
  }
  return t;
}

const SPECIALTY_FILTERS = [
  "all",
  "Blended families & co-parenting",
  "Conflict resolution & repair",
  "Emotional intimacy & love languages",
  "Long-distance & relocation",
  "Newlyweds & first-year marriage",
  "Pre-marriage readiness",
] as const;

export default function Coaches() {
  const [activePage, setActivePage] = useState('menu');
  const [, setLocation] = useLocation();
  const { userId } = useCurrentUser();
  const { logout } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("all");
  const [selectedCoach, setSelectedCoach] = useState<{ id: string; name: string; pricePerSession: number } | null>(null);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [bookingTab, setBookingTab] = useState<"browse" | "bookings">("browse");

  // Uses global queryFn: mock fallback when API errors/unreachable; in dev, show demo list if API returns []
  const { data: coaches = [], isLoading: coachesLoading, error, refetch } = useQuery<Coach[]>({
    queryKey: ["/api/coaches"],
    select: (raw) => {
      const arr = Array.isArray(raw) ? raw : [];
      if (arr.length > 0) return arr;
      if (import.meta.env.DEV) {
        const mock = getMockData("/api/coaches");
        return Array.isArray(mock) ? (mock as Coach[]) : [];
      }
      return [];
    },
  });

  const specialtyOptions = useMemo(() => SPECIALTY_FILTERS, []);

  const {
    data: myBookings = [],
    error: bookingsQueryError,
    isError: bookingsQueryIsError,
  } = useQuery<UserBooking[]>({
    queryKey: ["/api/users", userId, "bookings"],
    enabled: !!userId,
    refetchInterval: 15000,
  });
  const requestedCoachIds = useMemo(() => {
    const set = new Set<string>();
    for (const b of myBookings) {
      if (!ACTIVE_COACH_BOOKING_STATUSES.has(b.status)) continue;
      const coachId = typeof b.coachId === "string" ? b.coachId : "";
      if (coachId) set.add(coachId);
    }
    return set;
  }, [myBookings]);

  const [preferredTimesDraft, setPreferredTimesDraft] = useState<Record<string, string>>({});
  const [newTimesOpenFor, setNewTimesOpenFor] = useState<Record<string, boolean>>({});

  const respondSlotMutation = useMutation({
    mutationFn: async ({
      bookingId,
      decision,
      slot,
      preferredTimes,
    }: {
      bookingId: string;
      decision: "accept" | "decline" | "new_times" | "change_coach";
      slot?: string;
      preferredTimes?: string;
    }) => {
      if (!userId) throw new Error("Not signed in");
      const res = await fetch(
        buildApiUrl(`/api/users/${encodeURIComponent(userId)}/coach-bookings/${encodeURIComponent(bookingId)}/respond-slot`),
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...getAuthHeaders(false) },
          credentials: "include",
          body: JSON.stringify({ decision, slot, preferredTimes }),
        },
      );
      if (!res.ok) throw new Error("Failed to respond");
      return res.json();
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "bookings"] });
      if (vars.decision === "new_times") {
        setPreferredTimesDraft((d) => ({ ...d, [vars.bookingId]: "" }));
        setNewTimesOpenFor((d) => ({ ...d, [vars.bookingId]: false }));
      }
      if (vars.decision === "change_coach") {
        setBookingTab("browse");
      }
      toast({
        title: vars.decision === "change_coach" ? "Booking released" : "Thanks — we got that",
        description:
          vars.decision === "change_coach"
            ? "Pick another coach from Browse coaches."
            : vars.decision === "new_times"
              ? "Our team will review your new times."
              : "Your booking was updated.",
      });
    },
    onError: () => toast({ title: "Failed", description: "Could not update booking.", variant: "destructive" }),
  });

  const toggleNewTimes = useCallback((bookingId: string) => {
    setNewTimesOpenFor((d) => ({ ...d, [bookingId]: !d[bookingId] }));
  }, []);

  // Filter coaches by specialty pill + search
  const filteredCoaches = coaches.filter((coach) => {
    if (specialtyFilter !== "all" && coach.specialty !== specialtyFilter) return false;
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      coach.name.toLowerCase().includes(searchLower) ||
      coach.specialty.toLowerCase().includes(searchLower) ||
      coach.bio.toLowerCase().includes(searchLower)
    );
  });

  const handleRefresh = async () => {
    await refetch();
    queryClient.invalidateQueries({ queryKey: ['/api/coaches'] });
    toast({
      title: "Refreshed",
      description: "Coaches list updated",
    });
  };

  const openBookingForCoachId = useCallback(
    (id: string) => {
      const c = filteredCoaches.find((x) => x.id === id);
      if (!c) return;
      if (requestedCoachIds.has(c.id)) return;
      setSelectedCoach({
        id: c.id,
        name: c.name,
        pricePerSession: c.pricePerSession,
      });
      setBookingDialogOpen(true);
    },
    [filteredCoaches, requestedCoachIds],
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header
        showSearch={true}
        title="Coaches"
        subtitle="Book sessions and manage your bookings"
        onNotifications={() => setLocation("/notifications")}
        onCreate={() => setLocation("/")}
        onSettings={() => setLocation("/profile")}
        onLogout={logout}
      />

      <div className="mx-auto w-full max-w-lg px-4 pt-3 pb-3">
        <div className="mb-4">
          <div className="inline-flex w-full rounded-full border border-border/70 bg-card p-1">
            <button
              type="button"
              className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition ${
                bookingTab === "browse" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
              onClick={() => setBookingTab("browse")}
            >
              Browse coaches
            </button>
            <button
              type="button"
              className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition ${
                bookingTab === "bookings" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
              onClick={() => setBookingTab("bookings")}
            >
              My bookings
            </button>
          </div>
        </div>

        {bookingTab === "browse" ? (
        <div className="mb-5 rounded-2xl border border-border/70 bg-card/70 p-4 sm:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-foreground sm:text-3xl">
                <GraduationCap className="h-7 w-7 shrink-0 text-primary sm:h-8 sm:w-8" />
                Relationship Coaches
              </h1>
              <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Connect with expert coaches to strengthen your relationship
              </p>
            </div>
          </div>

          <div className="flex w-full gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search coaches by name, specialty, or expertise..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 pl-10"
              />
            </div>
            <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
              <SelectTrigger className="h-10 w-[170px] rounded-xl">
                <div className="inline-flex items-center gap-1.5">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Filter" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {specialtyOptions.map((spec) => (
                  <SelectItem key={spec} value={spec}>
                    {spec === "all" ? "All specialties" : spec}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        ) : (
          <div className="mb-5 rounded-2xl border border-border/70 bg-card/70 p-4 sm:p-5">
            <h2 className="flex items-center gap-2 font-display text-xl font-bold text-foreground sm:text-2xl">
              <GraduationCap className="h-6 w-6 shrink-0 text-primary" />
              My bookings
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Session requests and confirmations appear here after you pay and submit.
            </p>
          </div>
        )}

        {bookingTab === "browse" ? (
        coachesLoading ? (
          <LoadingState message="Loading coaches..." showMascot={true} />
        ) : error ? (
          <div className="py-12">
            <EmptyState
              useMascot={true}
              mascotType="default"
              title="Error loading coaches"
              description={error instanceof Error ? error.message : "Failed to load coaches. Please try again later."}
            />
          </div>
        ) : filteredCoaches.length === 0 ? (
          <div className="py-12">
            <EmptyState
              useMascot={true}
              mascotType="default"
              title={search ? "No coaches found" : "No coaches available yet"}
              description={search 
                ? `No coaches match "${search}". Try a different search term.`
                : "The API returned an empty list. Add coaches in your database (admin or SQL), then refresh. Make sure the API is running on port 5000."}
            />
            {search && (
              <div className="mt-4 text-center">
                <Button variant="outline" onClick={() => setSearch("")}>
                  Clear Search
                </Button>
              </div>
            )}
          </div>
        ) : (
          <>
            {search && (
              <div className="mb-4 text-sm text-muted-foreground">
                Found {filteredCoaches.length} {filteredCoaches.length === 1 ? 'coach' : 'coaches'} matching "{search}"
              </div>
            )}
            <div className="grid grid-cols-1 gap-4">
              {filteredCoaches.map((coach) => (
                <CoachCard
                  key={coach.id}
                  id={coach.id}
                  name={coach.name}
                  specialty={coach.specialty}
                  bio={coach.bio}
                  rating={coach.rating}
                  reviewCount={coach.reviewCount || 0}
                  pricePerSession={coach.pricePerSession}
                  languages={Array.isArray(coach.languages) ? coach.languages : coach.languages ? [coach.languages as any] : ['English']}
                  image={coach.avatar || undefined}
                  requestSent={requestedCoachIds.has(coach.id)}
                  onBookSession={(id: string) => openBookingForCoachId(id)}
                  onClick={(id: string) => openBookingForCoachId(id)}
                />
              ))}
            </div>
          </>
        )
        ) : (
          <div className="space-y-3">
            {!userId ? (
              <EmptyState
                useMascot={true}
                mascotType="default"
                title="Sign in to see bookings"
                description="Log in from the home screen, then return here to track your coach requests."
              />
            ) : bookingsQueryIsError ? (
              <EmptyState
                useMascot={true}
                mascotType="default"
                title="Could not load bookings"
                description={
                  bookingsQueryError instanceof Error
                    ? bookingsQueryError.message
                    : "Sign in again, then reopen this tab."
                }
              />
            ) : myBookings.length === 0 ? (
              <EmptyState
                useMascot={true}
                mascotType="default"
                title="No bookings yet"
                description="Book a coach session and it will show live status here."
              />
            ) : (
              myBookings.map((b) => {
                if (b.status === "cancelled") {
                  return (
                    <div key={b.id} className="rounded-2xl border border-dashed border-border/80 bg-muted/20 p-4">
                      <p className="text-sm font-semibold text-muted-foreground">{b.coach?.name || "Coach"}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        This request was released so you can choose a different coach.
                      </p>
                    </div>
                  );
                }

                if (b.status === "completed") {
                  return (
                    <div key={b.id} className="rounded-2xl border border-emerald-200/60 bg-emerald-50/40 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                      <p className="text-sm font-semibold">{b.coach?.name || "Coach"}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Session complete — you can book this coach again from Browse coaches.
                      </p>
                    </div>
                  );
                }

                return (
                  <div key={b.id} className="rounded-2xl border bg-card p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">{b.coach?.name || "Coach"}</p>
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                        {b.status === "awaiting_user_reschedule_response"
                          ? "Your move"
                          : b.status === "pending_admin_confirmation"
                            ? "Awaiting confirmation"
                            : b.status === "confirmed"
                              ? "Confirmed"
                              : b.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Payment: {b.paymentStatus} · Requested:{" "}
                      {formatCoachSlotLabel(String(b.sessionDate || b.selectedSlot || "")) || "TBD"}
                    </p>

                    {b.status === "awaiting_user_reschedule_response" ? (
                      <div className="mt-3 space-y-3 border-t border-border/60 pt-3">
                        <p className="text-sm font-medium text-foreground">We need a quick choice from you</p>
                        {b.adminNotes ? (
                          <div className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-3 py-2.5 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-50">
                            {b.adminNotes}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Your original time couldn&apos;t be confirmed. Pick another coach, or tell us when you&apos;re free.
                          </p>
                        )}
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="sm:flex-1"
                            disabled={respondSlotMutation.isPending}
                            onClick={() => {
                              if (
                                !window.confirm(
                                  "Release this booking so you can pick a different coach? Your team may follow up if payment needs attention.",
                                )
                              ) {
                                return;
                              }
                              respondSlotMutation.mutate({ bookingId: b.id, decision: "change_coach" });
                            }}
                          >
                            Choose a different coach
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            className="sm:flex-1"
                            variant="default"
                            disabled={respondSlotMutation.isPending}
                            onClick={() => toggleNewTimes(b.id)}
                          >
                            {newTimesOpenFor[b.id] ? "Hide" : "Suggest new days / times"}
                          </Button>
                        </div>
                        {newTimesOpenFor[b.id] ? (
                          <div className="space-y-2 rounded-xl border bg-muted/20 p-3">
                            <label className="text-xs font-medium text-muted-foreground" htmlFor={`pref-${b.id}`}>
                              When can you do this session? (plain language is fine)
                            </label>
                            <Textarea
                              id={`pref-${b.id}`}
                              rows={3}
                              placeholder='e.g. "Weekday evenings after 6pm ET" or "April 12 afternoon"'
                              value={preferredTimesDraft[b.id] || ""}
                              onChange={(e) => setPreferredTimesDraft((d) => ({ ...d, [b.id]: e.target.value }))}
                              className="resize-none text-sm"
                            />
                            <Button
                              type="button"
                              size="sm"
                              disabled={respondSlotMutation.isPending || !(preferredTimesDraft[b.id] || "").trim()}
                              onClick={() =>
                                respondSlotMutation.mutate({
                                  bookingId: b.id,
                                  decision: "new_times",
                                  preferredTimes: (preferredTimesDraft[b.id] || "").trim(),
                                })
                              }
                            >
                              Send to team
                            </Button>
                          </div>
                        ) : null}
                        {Array.isArray(b.proposedSlots) && b.proposedSlots.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">Or use a time our team suggested:</p>
                            <div className="flex flex-wrap gap-2">
                              {b.proposedSlots.map((s) => (
                                <Button
                                  key={s}
                                  size="sm"
                                  variant="secondary"
                                  disabled={respondSlotMutation.isPending}
                                  onClick={() =>
                                    respondSlotMutation.mutate({ bookingId: b.id, decision: "accept", slot: s })
                                  }
                                >
                                  Use {formatCoachSlotLabel(s)}
                                </Button>
                              ))}
                            </div>
                          </div>
                        ) : null}
                        <button
                          type="button"
                          className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                          disabled={respondSlotMutation.isPending}
                          onClick={() => respondSlotMutation.mutate({ bookingId: b.id, decision: "decline" })}
                        >
                          None of these work — ask the team to contact me
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Booking Dialog */}
      {selectedCoach && (
        <CoachBookingDialog
          open={bookingDialogOpen}
          onOpenChange={(open) => {
            setBookingDialogOpen(open);
            if (!open) {
              setSelectedCoach(null);
            }
          }}
          coachId={selectedCoach.id}
          coachName={selectedCoach.name}
          pricePerSession={selectedCoach.pricePerSession}
          onBookingSuccess={(newBooking) => {
            queryClient.invalidateQueries({ queryKey: ['/api/coaches'] });
            if (userId) {
              queryClient.setQueryData<UserBooking[]>(
                ['/api/users', userId, 'bookings'],
                (prev = []) => {
                  const id = String((newBooking as { id?: unknown }).id ?? "");
                  if (!id) return prev;
                  if (prev.some((b) => b.id === id)) return prev;
                  return [newBooking as UserBooking, ...prev];
                },
              );
              queryClient.invalidateQueries({ queryKey: ['/api/users', userId, 'bookings'] });
            }
            setBookingTab("bookings");
          }}
        />
      )}

      <BottomNav active={activePage} onNavigate={setActivePage} />
    </div>
  );
}
