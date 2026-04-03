import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "wouter";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Star, CalendarClock, Pencil, Plus, Trash2, Filter } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { apiRequest, buildApiUrl, getAuthHeaders } from "@/services/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type CoachRow = {
  id: string;
  name: string;
  specialty: string;
  bio: string;
  rating: number;
  reviewCount: number;
  pricePerSession: number;
  languages?: string[] | null;
  avatar?: string | null;
};

type BookingRow = {
  id: string;
  status: string;
  paymentStatus: string;
  selectedSlot?: string | null;
  sessionDate?: string | null;
  amountCents?: number;
  proposedSlots?: string[] | null;
  adminNotes?: string | null;
  user?: { id?: string; name?: string } | null;
  coach?: { name?: string } | null;
};

const BOOKING_VIEWS = [
  { value: "pending", label: "Needs admin action" },
  { value: "awaiting_user", label: "Waiting on user" },
  { value: "confirmed", label: "Confirmed" },
  { value: "all", label: "All" },
] as const;

/** Align with public Coaches filters so admins can filter by the same specialty labels. */
const SPECIALTY_FILTER_OPTIONS = [
  "all",
  "Blended families & co-parenting",
  "Conflict resolution & repair",
  "Emotional intimacy & love languages",
  "Long-distance & relocation",
  "Newlyweds & first-year marriage",
  "Pre-marriage readiness",
] as const;

function AdminCoachBookingCard({
  b,
  highlight,
  slotDraft,
  setSlotDraft,
  rescheduleMsgDraft,
  setRescheduleMsgDraft,
  confirmMutation,
  completeSessionMutation,
  proposeMutation,
  toast,
}: {
  b: BookingRow;
  highlight?: boolean;
  slotDraft: Record<string, string>;
  setSlotDraft: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  rescheduleMsgDraft: Record<string, string>;
  setRescheduleMsgDraft: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  confirmMutation: { mutate: (id: string) => void; isPending: boolean };
  completeSessionMutation: { mutate: (id: string) => void; isPending: boolean };
  proposeMutation: { mutate: (args: { id: string; slots: string[]; message?: string }) => void; isPending: boolean };
  toast: ReturnType<typeof useToast>["toast"];
}) {
  return (
    <div
      id={`coach-request-${b.id}`}
      className={cn(
        "space-y-2 rounded-xl border p-3",
        highlight && "ring-2 ring-primary ring-offset-2 ring-offset-background",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">
            {b.user?.name || "User"} → {b.coach?.name || "Coach"}
          </p>
          <p className="text-xs text-muted-foreground">
            Status: {b.status} · Payment: {b.paymentStatus} · ${(Number(b.amountCents || 0) / 100).toFixed(2)}
          </p>
        </div>
        <Badge variant={b.paymentStatus === "paid" ? "default" : "secondary"}>{b.paymentStatus}</Badge>
      </div>
      <p className="text-xs text-muted-foreground">
        Requested slot: {b.sessionDate || b.selectedSlot || "Not set"}
      </p>
      {b.status === "pending_admin_confirmation" ? (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => confirmMutation.mutate(b.id)} disabled={confirmMutation.isPending}>
              Assign session & notify user
            </Button>
          </div>
          <div className="space-y-1.5 rounded-lg border border-dashed bg-muted/30 p-2">
            <p className="text-xs font-medium text-muted-foreground">If the time doesn’t work</p>
            <Textarea
              placeholder="Short note the member will see (e.g. coach isn’t available that day, or what happened)."
              rows={2}
              className="min-h-[60px] text-sm"
              value={rescheduleMsgDraft[b.id] || ""}
              onChange={(e) => setRescheduleMsgDraft((s) => ({ ...s, [b.id]: e.target.value }))}
            />
            <Input
              placeholder="Optional: suggest times, comma-separated (e.g. Apr 10 6pm, Apr 11 2pm)"
              value={slotDraft[b.id] || ""}
              onChange={(e) => setSlotDraft((s) => ({ ...s, [b.id]: e.target.value }))}
              className="h-9 max-w-md"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const rawSlots = (slotDraft[b.id] || "").trim();
                const slots = rawSlots.split(",").map((x) => x.trim()).filter(Boolean);
                const msg = (rescheduleMsgDraft[b.id] || "").trim();
                if (!msg && !slots.length) {
                  toast({
                    title: "Add a note or times",
                    description: "Explain what’s going on for the member, and/or suggest alternate times.",
                    variant: "destructive",
                  });
                  return;
                }
                proposeMutation.mutate({ id: b.id, slots, message: msg || undefined });
              }}
              disabled={proposeMutation.isPending}
            >
              Send update to member
            </Button>
          </div>
        </div>
      ) : b.status === "awaiting_user_reschedule_response" ? (
        <p className="text-xs text-amber-800">
          Waiting for the member to choose another coach or send new times.
          {b.adminNotes ? ` Last note: ${b.adminNotes.slice(0, 120)}${b.adminNotes.length > 120 ? "…" : ""}` : ""}
        </p>
      ) : b.status === "confirmed" ? (
        <div className="space-y-2">
          <p className="text-xs text-emerald-700">Confirmed — member has been notified.</p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => completeSessionMutation.mutate(b.id)}
              disabled={completeSessionMutation.isPending}
            >
              Session done
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            After the appointment happened, mark done so they can book this coach again.
          </p>
        </div>
      ) : b.status === "completed" ? (
        <p className="text-xs text-muted-foreground">Session completed — member can rebook this coach.</p>
      ) : null}
    </div>
  );
}

export default function Coaches() {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const highlightBookingId = searchParams.get("booking") || "";
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");
  const [tab, setTab] = useState<"coaches" | "bookings">("coaches");
  const [slotDraft, setSlotDraft] = useState<Record<string, string>>({});
  const [rescheduleMsgDraft, setRescheduleMsgDraft] = useState<Record<string, string>>({});
  const [bookingView, setBookingView] = useState<string>("pending");
  const [paidOnly, setPaidOnly] = useState(false);
  const [bookingSearch, setBookingSearch] = useState("");

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingCoach, setEditingCoach] = useState<CoachRow | null>(null);
  const [form, setForm] = useState({
    name: "",
    specialty: "",
    bio: "",
    rating: "5",
    reviewCount: "0",
    pricePerSession: "0",
    languages: "English",
    avatar: "",
  });
  const [deleteCoach, setDeleteCoach] = useState<CoachRow | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/admin/coaches", search, specialtyFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        search,
        page: String(page),
        limit: "50",
      });
      if (specialtyFilter !== "all") params.set("specialty", specialtyFilter);
      const url = buildApiUrl(`/api/admin/coaches?${params.toString()}`);
      const res = await fetch(url, {
        credentials: "include",
        headers: getAuthHeaders(false),
      });
      if (!res.ok) {
        const t = await res.text();
        try {
          throw new Error(JSON.parse(t).message);
        } catch {
          throw new Error(`HTTP ${res.status}`);
        }
      }
      return res.json();
    },
  });

  const coaches: CoachRow[] = data?.coaches || [];
  const totalPages = data?.totalPages || 1;

  const specialtyOptions = useMemo(() => {
    const fromApi = new Set<string>();
    for (const c of coaches) {
      if (c.specialty?.trim()) fromApi.add(c.specialty.trim());
    }
    const merged = new Set<string>(SPECIALTY_FILTER_OPTIONS as unknown as string[]);
    fromApi.forEach((s) => merged.add(s));
    merged.delete("all");
    const rest = Array.from(merged).sort((a, b) => a.localeCompare(b));
    return ["all", ...rest];
  }, [coaches]);

  const { data: bookings = [], isLoading: bookingsLoading, refetch: refetchBookings } = useQuery({
    queryKey: ["/api/admin/coach-bookings"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/coach-bookings");
      return res.json() as Promise<BookingRow[]>;
    },
    refetchInterval: 12_000,
  });

  const filteredBookings = useMemo(() => {
    const q = bookingSearch.trim().toLowerCase();
    return bookings.filter((b) => {
      if (bookingView === "pending" && b.status !== "pending_admin_confirmation") return false;
      if (bookingView === "awaiting_user" && b.status !== "awaiting_user_reschedule_response") return false;
      if (
        bookingView === "confirmed" &&
        b.status !== "confirmed" &&
        b.status !== "completed"
      ) {
        return false;
      }
      if (paidOnly && b.paymentStatus !== "paid") return false;
      if (!q) return true;
      const userName = (b.user?.name || "").toLowerCase();
      const coachName = (b.coach?.name || "").toLowerCase();
      return userName.includes(q) || coachName.includes(q) || b.id.toLowerCase().includes(q);
    });
  }, [bookings, bookingView, paidOnly, bookingSearch]);

  const pendingCount = useMemo(
    () => bookings.filter((b) => b.status === "pending_admin_confirmation").length,
    [bookings],
  );

  const pendingRequests = useMemo(
    () => bookings.filter((b) => b.status === "pending_admin_confirmation"),
    [bookings],
  );

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t === "bookings") setTab("bookings");
  }, [searchParams]);

  useEffect(() => {
    if (!highlightBookingId) return;
    setTab("bookings");
    setBookingView("all");
  }, [highlightBookingId]);

  useEffect(() => {
    if (!highlightBookingId) return;
    const timer = window.setTimeout(() => {
      document.getElementById(`coach-request-${highlightBookingId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 200);
    return () => clearTimeout(timer);
  }, [highlightBookingId, tab, filteredBookings]);

  const openNewCoach = () => {
    setEditingCoach(null);
    setForm({
      name: "",
      specialty: "",
      bio: "",
      rating: "5",
      reviewCount: "0",
      pricePerSession: "0",
      languages: "English",
      avatar: "",
    });
    setEditorOpen(true);
  };

  const openEditCoach = (c: CoachRow) => {
    setEditingCoach(c);
    setForm({
      name: c.name,
      specialty: c.specialty,
      bio: c.bio,
      rating: String(c.rating ?? 5),
      reviewCount: String(c.reviewCount ?? 0),
      pricePerSession: String(c.pricePerSession ?? 0),
      languages: Array.isArray(c.languages) ? c.languages.join(", ") : "English",
      avatar: c.avatar || "",
    });
    setEditorOpen(true);
  };

  const saveCoachMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        specialty: form.specialty.trim(),
        bio: form.bio.trim(),
        rating: Math.round(Math.max(0, Math.min(5, Number(form.rating) || 0))),
        reviewCount: Number(form.reviewCount) || 0,
        pricePerSession: Number(form.pricePerSession) || 0,
        languages: form.languages.split(",").map((s) => s.trim()).filter(Boolean),
        avatar: form.avatar.trim() || null,
      };
      if (editingCoach) {
        const res = await fetch(buildApiUrl(`/api/admin/coaches/${editingCoach.id}`), {
          method: "PATCH",
          credentials: "include",
          headers: getAuthHeaders(true),
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const t = await res.text();
          throw new Error(JSON.parse(t).message || "Save failed");
        }
        return res.json();
      }
      const res = await fetch(buildApiUrl("/api/admin/coaches"), {
        method: "POST",
        credentials: "include",
        headers: getAuthHeaders(true),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(JSON.parse(t).message || "Create failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coaches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coaches"] });
      toast({ title: editingCoach ? "Coach updated" : "Coach added" });
      setEditorOpen(false);
      refetch();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(buildApiUrl(`/api/admin/coaches/${id}`), {
        method: "DELETE",
        credentials: "include",
        headers: getAuthHeaders(false),
      });
      if (!res.ok) {
        const t = await res.text();
        try {
          throw new Error(JSON.parse(t).message || "Delete failed");
        } catch {
          throw new Error(t || "Delete failed");
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coaches"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coaches"] });
      toast({ title: "Coach removed" });
      setDeleteCoach(null);
      refetch();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const confirmMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(buildApiUrl(`/api/admin/coach-bookings/${id}/confirm`), {
        method: "PATCH",
        credentials: "include",
        headers: getAuthHeaders(false),
      });
      if (!res.ok) throw new Error("Failed to confirm");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coach-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Booking confirmed", description: "The user was notified." });
    },
    onError: () => toast({ title: "Confirm failed", variant: "destructive" }),
  });

  const completeSessionMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(buildApiUrl(`/api/admin/coach-bookings/${id}/complete`), {
        method: "PATCH",
        credentials: "include",
        headers: getAuthHeaders(false),
      });
      if (!res.ok) {
        const t = await res.text();
        try {
          throw new Error(JSON.parse(t).message || "Failed to mark complete");
        } catch {
          throw new Error(t || "Failed to mark complete");
        }
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coach-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Session marked complete", description: "The member was notified and can book this coach again." });
    },
    onError: (e: Error) =>
      toast({ title: "Could not complete", description: e.message, variant: "destructive" }),
  });

  const proposeMutation = useMutation({
    mutationFn: async ({ id, slots, message }: { id: string; slots: string[]; message?: string }) => {
      const res = await fetch(buildApiUrl(`/api/admin/coach-bookings/${id}/propose-slot`), {
        method: "PATCH",
        headers: getAuthHeaders(true),
        credentials: "include",
        body: JSON.stringify({ slots, message: message || undefined }),
      });
      if (!res.ok) {
        const t = await res.text();
        try {
          throw new Error(JSON.parse(t).message || "Failed to propose");
        } catch {
          throw new Error(t || "Failed to propose");
        }
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coach-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Update sent", description: "The member was notified in the app." });
    },
    onError: (e: Error) => toast({ title: "Could not propose slots", description: e.message, variant: "destructive" }),
  });

  return (
    <AdminLayout>
      <div className="space-y-4 p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">Coaches</h1>
            <p className="text-sm text-muted-foreground">Manage coaches and session requests</p>
          </div>
          {tab === "coaches" ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
              <div className="relative min-w-[200px]">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search name, specialty, bio…"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-8"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select
                  value={specialtyFilter}
                  onValueChange={(v) => {
                    setSpecialtyFilter(v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    {specialtyOptions.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s === "all" ? "All specialties" : s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={openNewCoach} className="gap-1">
                <Plus className="h-4 w-4" />
                Add coach
              </Button>
            </div>
          ) : (
            <div className="flex w-full max-w-xl flex-col gap-2 sm:flex-row sm:items-end">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filter by user or coach name…"
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={bookingView} onValueChange={setBookingView}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BOOKING_VIEWS.map((v) => (
                      <SelectItem key={v.value} value={v.value}>
                        {v.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant={paidOnly ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPaidOnly((p) => !p)}
                >
                  Paid only
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant={tab === "coaches" ? "default" : "outline"} onClick={() => setTab("coaches")}>
            Coaches
          </Button>
          <Button variant={tab === "bookings" ? "default" : "outline"} onClick={() => setTab("bookings")} className="gap-2">
            <CalendarClock className="h-4 w-4" />
            Coach requests
            <Badge variant="secondary">{pendingCount}</Badge>
          </Button>
        </div>

        {tab === "coaches" && pendingRequests.length > 0 && (
          <Card className="space-y-3 border-primary/25 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">Coach session requests</h2>
                <p className="text-sm text-muted-foreground">
                  Confirm when everything fits, or send a short note (and optional times) if you need the member to adjust.
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setTab("bookings")}>
                Open full queue
              </Button>
            </div>
            <div className="space-y-3">
              {pendingRequests.map((b) => (
                <AdminCoachBookingCard
                  key={b.id}
                  b={b}
                  highlight={highlightBookingId === b.id}
                  slotDraft={slotDraft}
                  setSlotDraft={setSlotDraft}
                  rescheduleMsgDraft={rescheduleMsgDraft}
                  setRescheduleMsgDraft={setRescheduleMsgDraft}
                  confirmMutation={confirmMutation}
                  completeSessionMutation={completeSessionMutation}
                  proposeMutation={proposeMutation}
                  toast={toast}
                />
              ))}
            </div>
          </Card>
        )}

        {tab === "coaches" &&
          (isLoading ? (
            <div className="py-8 text-center">Loading coaches…</div>
          ) : error ? (
            <Card>
              <div className="p-6 text-center">
                <p className="mb-4 text-sm text-destructive">{error instanceof Error ? error.message : "Error"}</p>
                <Button onClick={() => refetch()}>Retry</Button>
              </div>
            </Card>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Coach</TableHead>
                      <TableHead className="whitespace-nowrap">Specialty</TableHead>
                      <TableHead className="whitespace-nowrap">Rating</TableHead>
                      <TableHead className="whitespace-nowrap">Price</TableHead>
                      <TableHead className="w-[100px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coaches.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                          No coaches match filters
                        </TableCell>
                      </TableRow>
                    ) : (
                      coaches.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7">
                                <AvatarImage src={c.avatar || undefined} />
                                <AvatarFallback>{c.name?.[0] || "C"}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">{c.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{c.specialty}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="gap-1">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              {(c.rating || 0).toFixed(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">${c.pricePerSession || 0}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditCoach(c)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => setDeleteCoach(c)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          ))}

        {tab === "bookings" && (
          <Card className="space-y-3 p-4">
            {bookingsLoading ? (
              <p className="text-sm text-muted-foreground">Loading booking requests…</p>
            ) : filteredBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No requests in this view. Try another filter or refresh — new paid bookings also appear in your notifications bell.
              </p>
            ) : (
              filteredBookings.map((b) => (
                <AdminCoachBookingCard
                  key={b.id}
                  b={b}
                  highlight={highlightBookingId === b.id}
                  slotDraft={slotDraft}
                  setSlotDraft={setSlotDraft}
                  rescheduleMsgDraft={rescheduleMsgDraft}
                  setRescheduleMsgDraft={setRescheduleMsgDraft}
                  confirmMutation={confirmMutation}
                  completeSessionMutation={completeSessionMutation}
                  proposeMutation={proposeMutation}
                  toast={toast}
                />
              ))
            )}
            <Button variant="outline" size="sm" onClick={() => refetchBookings()}>
              Refresh requests
            </Button>
          </Card>
        )}

        {totalPages > 1 && tab === "coaches" && (
          <div className="flex justify-center gap-2">
            <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              Previous
            </Button>
            <span className="flex items-center px-3 text-sm">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCoach ? "Edit coach" : "Add coach"}</DialogTitle>
            <DialogDescription>Name, specialty, and bio are required. Rating is 0–5.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="c-name">Name</Label>
              <Input id="c-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="c-spec">Specialty</Label>
              <Input id="c-spec" value={form.specialty} onChange={(e) => setForm((f) => ({ ...f, specialty: e.target.value }))} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="c-bio">Bio</Label>
              <Textarea id="c-bio" rows={4} value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-1.5">
                <Label htmlFor="c-rating">Rating (0–5)</Label>
                <Input id="c-rating" type="number" min={0} max={5} step={1} value={form.rating} onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value }))} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="c-reviews">Review count</Label>
                <Input id="c-reviews" type="number" min={0} value={form.reviewCount} onChange={(e) => setForm((f) => ({ ...f, reviewCount: e.target.value }))} />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="c-price">Price per session ($)</Label>
              <Input id="c-price" type="number" min={0} value={form.pricePerSession} onChange={(e) => setForm((f) => ({ ...f, pricePerSession: e.target.value }))} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="c-lang">Languages (comma-separated)</Label>
              <Input id="c-lang" value={form.languages} onChange={(e) => setForm((f) => ({ ...f, languages: e.target.value }))} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="c-avatar">Avatar URL</Label>
              <Input id="c-avatar" value={form.avatar} onChange={(e) => setForm((f) => ({ ...f, avatar: e.target.value }))} placeholder="https://…" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setEditorOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => saveCoachMutation.mutate()} disabled={saveCoachMutation.isPending}>
              {saveCoachMutation.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteCoach} onOpenChange={(o) => !o && setDeleteCoach(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteCoach?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              You cannot delete a coach who still has bookings. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteCoach && deleteMutation.mutate(deleteCoach.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
