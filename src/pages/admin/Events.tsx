import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/admin/AdminLayout";
import EventMatchAdmin from "@/components/events/EventMatchAdmin";
import { buildApiUrl } from "@/services/api";
import { apiRequest } from "@/lib/queryClient";
import { Calendar, Settings, Plus, Pencil, Trash2 } from "lucide-react";

type EventStatus = 'pending' | 'approved' | 'rejected' | undefined;

export default function Events() {
  const [, setLocation] = useLocation();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<EventStatus>(undefined);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showSparkBoxDialog, setShowSparkBoxDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data, isLoading } = useQuery({
    queryKey: ['/api/admin/events', page, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      });
      if (statusFilter) {
        params.append('status', statusFilter);
      }
      const url = buildApiUrl(`/api/admin/events?${params.toString()}`);
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) {
        const t = await res.text();
        try { throw new Error(JSON.parse(t).message); } catch { throw new Error(`HTTP ${res.status}`); }
      }
      return res.json();
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const url = buildApiUrl(`/api/admin/events/${eventId}/approve`);
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to approve event');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/events'] });
      toast({
        title: "Event Approved",
        description: "The event has been approved and is now live.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const url = buildApiUrl(`/api/admin/events/${eventId}/reject`);
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to reject event');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/events'] });
      toast({
        title: "Event Rejected",
        description: "The event has been rejected.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
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
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      setDeleteTarget(null);
      toast({ title: "Event deleted", description: "The event has been removed." });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const events = data?.events || [];
  const totalPages = data?.totalPages || 1;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Events</h1>
            <p className="text-muted-foreground text-sm">
              Create, edit, or delete events; approve submissions; run SparkBox tools
            </p>
          </div>
          <Button
            className="w-full sm:w-auto shrink-0"
            onClick={() => setLocation("/events/create?from=admin")}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create event
          </Button>
        </div>

        <Tabs value={statusFilter || 'all'} onValueChange={(value) => {
          setStatusFilter(value === 'all' ? undefined : value as EventStatus);
          setPage(1);
        }}>
          <div className="overflow-x-auto">
            <TabsList className="inline-flex min-w-max">
              <TabsTrigger value="all">All Events</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>
          </div>
        </Tabs>

        {isLoading ? (
          <div className="text-center py-8">Loading events...</div>
        ) : (
          <Card>
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Title</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap">Date</TableHead>
                  <TableHead className="whitespace-nowrap">Location</TableHead>
                  <TableHead className="whitespace-nowrap">Attendees</TableHead>
                  <TableHead className="whitespace-nowrap">Created</TableHead>
                  <TableHead className="whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No events found
                    </TableCell>
                  </TableRow>
                ) : (
                  events.map((event: any) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium whitespace-nowrap">{event.title}</TableCell>
                      <TableCell>{getStatusBadge(event.status || 'pending')}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm">{(() => { try { return new Date(event.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return event.date; } })()}</TableCell>
                      <TableCell className="whitespace-nowrap">{event.location}</TableCell>
                      <TableCell className="whitespace-nowrap">{event.attendeesCount || 0}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm">{new Date(event.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setLocation(`/events/create?from=admin&edit=${encodeURIComponent(event.id)}`)
                            }
                          >
                            <Pencil className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive border-destructive/30 hover:bg-destructive/10"
                            onClick={() => setDeleteTarget({ id: event.id, title: event.title })}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                          {event.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => approveMutation.mutate(event.id)}
                                disabled={approveMutation.isPending || rejectMutation.isPending}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => rejectMutation.mutate(event.id)}
                                disabled={approveMutation.isPending || rejectMutation.isPending}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          {event.status === 'rejected' && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => approveMutation.mutate(event.id)}
                              disabled={approveMutation.isPending || rejectMutation.isPending}
                            >
                              Approve
                            </Button>
                          )}
                          {(event.status === 'approved' || event.hasQuestionnaire) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedEvent(event);
                                setShowSparkBoxDialog(true);
                              }}
                              className="border-primary/30 hover:border-primary/50 text-primary hover:text-primary"
                            >
                              <Settings className="w-3 h-3 mr-1" />
                              SparkBox
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            </div>
          </Card>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="flex items-center px-4">
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

        {/* SparkBox Management Dialog */}
        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this event?</AlertDialogTitle>
              <AlertDialogDescription>
                {deleteTarget
                  ? `“${deleteTarget.title}” will be removed. This cannot be undone in demo data.`
                  : null}
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
                SparkBox Management - {selectedEvent?.title}
              </DialogTitle>
              <DialogDescription>
                Manage questionnaire submissions, calculate matches, and schedule match reveals
              </DialogDescription>
            </DialogHeader>
            {selectedEvent && (
              <EventMatchAdmin 
                eventId={selectedEvent.id} 
                eventTitle={selectedEvent.title} 
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

