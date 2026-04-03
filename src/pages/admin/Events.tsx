import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/admin/AdminLayout";
import EventMatchAdmin from "@/components/events/EventMatchAdmin";
import { buildApiUrl, getAuthHeaders } from "@/services/api";
import { apiRequest } from "@/lib/queryClient";
import {
  Calendar,
  Settings,
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  Search,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
} from "lucide-react";

type EventStatus = "pending" | "approved" | "rejected";

type AdminEventRow = {
  id: string;
  title: string;
  description?: string;
  date?: string;
  time?: string;
  location?: string;
  type?: string;
  status?: string;
  image?: string | null;
  hasQuestionnaire?: boolean;
  attendeesCount?: number;
  createdAt?: string;
};

function resolvePublicMediaUrl(url: string | null | undefined): string | undefined {
  const t = typeof url === "string" ? url.trim() : "";
  if (!t) return undefined;
  if (/^(https?:|data:|blob:)/i.test(t)) return t;
  if (t.startsWith("/")) return buildApiUrl(t);
  return t;
}

function buildEventsQuery(params: {
  page: number;
  status: string;
  search: string;
  type: string;
  hasQuestionnaire: string;
}): string {
  const sp = new URLSearchParams();
  sp.set("page", String(params.page));
  sp.set("limit", "50");
  if (params.search.trim()) sp.set("search", params.search.trim());
  if (params.status !== "all") sp.set("status", params.status);
  if (params.type !== "all") sp.set("type", params.type);
  if (params.hasQuestionnaire !== "all") sp.set("hasQuestionnaire", params.hasQuestionnaire);
  return `/api/admin/events?${sp.toString()}`;
}

export default function Events() {
  const [, setLocation] = useLocation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [questionnaireFilter, setQuestionnaireFilter] = useState<string>("all");
  const [selectedEvent, setSelectedEvent] = useState<AdminEventRow | null>(null);
  const [showSparkBoxDialog, setShowSparkBoxDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const queryPath = useMemo(
    () =>
      buildEventsQuery({
        page,
        status: statusFilter,
        search,
        type: typeFilter,
        hasQuestionnaire: questionnaireFilter,
      }),
    [page, statusFilter, search, typeFilter, questionnaireFilter],
  );

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/admin/events", queryPath],
    queryFn: async () => {
      const url = buildApiUrl(queryPath);
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
      return res.json() as Promise<{ events: AdminEventRow[]; totalPages: number; total: number }>;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const res = await fetch(buildApiUrl(`/api/admin/events/${eventId}/approve`), {
        method: "PATCH",
        headers: getAuthHeaders(true),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to approve event");
      return res.json();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      toast({
        title: "Event approved",
        description: "The event is now live.",
      });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const res = await fetch(buildApiUrl(`/api/admin/events/${eventId}/reject`), {
        method: "PATCH",
        headers: getAuthHeaders(true),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to reject event");
      return res.json();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      toast({
        title: "Event rejected",
        description: "The submission was rejected.",
      });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const res = await apiRequest("DELETE", `/api/events/${eventId}`);
      if (!res.ok && res.status !== 204) {
        const t = await res.text();
        try {
          throw new Error(JSON.parse(t).message);
        } catch {
          throw new Error(t || `HTTP ${res.status}`);
        }
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      void queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      setDeleteTarget(null);
      toast({ title: "Event deleted", description: "The event has been removed." });
    },
    onError: (err: Error) => {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    },
  });

  const events = data?.events || [];
  const totalPages = data?.totalPages || 1;
  const busy = approveMutation.isPending || rejectMutation.isPending;

  const resetPage = () => setPage(1);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/30">
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30">
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatEventDate = (event: AdminEventRow) => {
    try {
      if (!event.date) return "—";
      return new Date(event.date).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return event.date ?? "—";
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Events</h1>
            <p className="text-muted-foreground text-sm">
              Approve submissions, edit, SparkBox tools, and delete events
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:items-center">
            <div className="relative flex-1 sm:min-w-[220px] sm:max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search title, description, location…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  resetPage();
                }}
                className="pl-8"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isLoading} aria-label="Refresh">
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
              <Button className="shrink-0" onClick={() => setLocation("/events/create?from=admin")}>
                <Plus className="w-4 h-4 mr-2" />
                Create event
              </Button>
            </div>
          </div>
        </div>

        <Card className="p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Filters</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v);
                  resetPage();
                }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Type</Label>
              <Select
                value={typeFilter}
                onValueChange={(v) => {
                  setTypeFilter(v);
                  resetPage();
                }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Questionnaire (SparkBox)</Label>
              <Select
                value={questionnaireFilter}
                onValueChange={(v) => {
                  setQuestionnaireFilter(v);
                  resetPage();
                }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Questionnaire" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All events</SelectItem>
                  <SelectItem value="true">Has questionnaire</SelectItem>
                  <SelectItem value="false">No questionnaire</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {isLoading ? (
          <div className="text-center py-8">Loading events...</div>
        ) : error ? (
          <Card>
            <div className="p-6 text-center">
              <p className="text-destructive text-sm mb-4">{error instanceof Error ? error.message : "Error"}</p>
              <Button onClick={() => refetch()}>Retry</Button>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="px-4 py-2 border-b text-sm text-muted-foreground">
              {data?.total != null ? `${data.total} event${data.total === 1 ? "" : "s"}` : "—"}
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14" />
                    <TableHead className="min-w-[160px]">Title</TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                    <TableHead className="whitespace-nowrap">Type</TableHead>
                    <TableHead className="whitespace-nowrap">Date</TableHead>
                    <TableHead className="min-w-[120px]">Location</TableHead>
                    <TableHead className="whitespace-nowrap">Attendees</TableHead>
                    <TableHead className="whitespace-nowrap">Created</TableHead>
                    <TableHead className="w-[52px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No events found
                      </TableCell>
                    </TableRow>
                  ) : (
                    events.map((event) => {
                      const st = (event.status || "pending") as EventStatus | string;
                      const img = resolvePublicMediaUrl(event.image ?? null);
                      return (
                        <TableRow key={event.id}>
                          <TableCell className="align-middle">
                            <div className="h-10 w-10 rounded-md border bg-muted/40 overflow-hidden shrink-0">
                              {img ? (
                                <img src={img} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-[10px] text-muted-foreground">
                                  —
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium align-middle">
                            <span className="line-clamp-2 text-sm">{event.title}</span>
                          </TableCell>
                          <TableCell className="align-middle">{getStatusBadge(st)}</TableCell>
                          <TableCell className="align-middle text-sm capitalize text-muted-foreground">
                            {event.type || "—"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-sm align-middle">{formatEventDate(event)}</TableCell>
                          <TableCell className="text-sm align-middle max-w-[200px]">
                            <span className="line-clamp-2 text-muted-foreground">{event.location || "—"}</span>
                          </TableCell>
                          <TableCell className="whitespace-nowrap align-middle">{event.attendeesCount ?? 0}</TableCell>
                          <TableCell className="whitespace-nowrap text-sm text-muted-foreground align-middle">
                            {event.createdAt ? new Date(event.createdAt).toLocaleDateString() : "—"}
                          </TableCell>
                          <TableCell className="text-right align-middle">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Event actions">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-52">
                                <DropdownMenuItem onClick={() => setLocation(`/event/${event.id}`)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View event
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    setLocation(`/events/create?from=admin&edit=${encodeURIComponent(event.id)}`)
                                  }
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                {(st === "pending" || st === "rejected") && (
                                  <DropdownMenuItem
                                    onClick={() => approveMutation.mutate(event.id)}
                                    disabled={busy}
                                  >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Approve
                                  </DropdownMenuItem>
                                )}
                                {st === "pending" && (
                                  <DropdownMenuItem
                                    onClick={() => rejectMutation.mutate(event.id)}
                                    disabled={busy}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Reject
                                  </DropdownMenuItem>
                                )}
                                {(st === "approved" || event.hasQuestionnaire) && (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedEvent(event);
                                      setShowSparkBoxDialog(true);
                                    }}
                                  >
                                    <Settings className="mr-2 h-4 w-4" />
                                    SparkBox
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => setDeleteTarget({ id: event.id, title: event.title })}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              Previous
            </Button>
            <span className="flex items-center px-4 text-sm">
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

        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this event?</AlertDialogTitle>
              <AlertDialogDescription>
                {deleteTarget ? `“${deleteTarget.title}” will be removed. This cannot be undone.` : null}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting…" : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={showSparkBoxDialog} onOpenChange={setShowSparkBoxDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                SparkBox — {selectedEvent?.title}
              </DialogTitle>
              <DialogDescription>
                Questionnaire submissions, match calculation, and reveal scheduling
              </DialogDescription>
            </DialogHeader>
            {selectedEvent ? (
              <EventMatchAdmin eventId={selectedEvent.id} eventTitle={selectedEvent.title} />
            ) : null}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
