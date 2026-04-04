import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, MessageCircle } from "lucide-react";
import Header from "@/components/common/Header";
import BottomNav from "@/components/common/BottomNav";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/common/LoadingState";
import { useCurrentUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { buildApiUrl, getAuthHeaders } from "@/services/api";
import { queryClient } from "@/lib/queryClient";
import {
  chatRequestsSummaryQueryKey,
  fetchChatRequestsSummary,
  refreshChatRequestQueries,
  type ChatRequestIncomingRow,
  type ChatRequestOutgoingRow,
} from "@/lib/chatRequestsApi";
import { cn } from "@/lib/utils";

function statusBadge(status: string) {
  if (status === "pending") return { label: "Pending", className: "bg-amber-100 text-amber-900 border-amber-200/80" };
  if (status === "accepted") return { label: "Accepted", className: "bg-emerald-100 text-emerald-900 border-emerald-200/80" };
  if (status === "declined") return { label: "Declined", className: "bg-stone-100 text-stone-700 border-stone-200/80" };
  return { label: status, className: "bg-muted text-muted-foreground" };
}

function formatWhen(createdAt: string | null) {
  if (!createdAt) return "—";
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function ChatRequestsPage() {
  const [, setLocation] = useLocation();
  const { userId } = useCurrentUser();
  const { logout } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<"received" | "sent">("received");
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: chatRequestsSummaryQueryKey(userId ?? ""),
    queryFn: () => fetchChatRequestsSummary(userId!),
    enabled: !!userId,
  });

  const respondMutation = useMutation({
    mutationFn: async (vars: { requestId: string; decision: "approved" | "rejected"; otherUserId: string }) => {
      if (!userId) throw new Error("Not signed in");
      const res = await fetch(buildApiUrl(`/api/users/${encodeURIComponent(userId)}/chat-requests/${vars.requestId}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders(false) },
        credentials: "include",
        body: JSON.stringify({ decision: vars.decision }),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || "Could not update request");
      }
      return res.json() as Promise<{ conversationId?: string }>;
    },
    onSuccess: (_d, vars) => {
      refreshChatRequestQueries(userId!, vars.otherUserId);
      void queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "notifications"] });
      if (vars.decision === "approved") {
        toast({ title: "Request accepted" });
        setLocation(`/chat?user=${encodeURIComponent(vars.otherUserId)}`);
      } else {
        toast({ title: "Request declined" });
      }
    },
    onError: (e: Error) => {
      toast({ title: "Could not update request", description: e.message, variant: "destructive" });
    },
    onSettled: () => setBusyId(null),
  });

  const incoming = data?.incoming ?? [];
  const outgoing = data?.outgoing ?? [];

  const pendingReceived = useMemo(() => incoming.filter((r) => r.status === "pending").length, [incoming]);
  const pendingSent = useMemo(() => outgoing.filter((r) => r.status === "pending").length, [outgoing]);

  const openProfile = (id: string) => setLocation(`/profile/${encodeURIComponent(id)}`);

  const renderIncomingRow = (row: ChatRequestIncomingRow) => {
    const b = statusBadge(row.status);
    const canAct = row.status === "pending";
    return (
      <li
        key={row.notificationId}
        className="flex flex-col gap-3 rounded-[22px] border border-border/70 bg-card/60 p-4 shadow-2xs"
      >
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => openProfile(row.otherUser.id)}
            className="shrink-0 rounded-full ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            aria-label={`View ${row.otherUser.name}`}
          >
            <Avatar className="h-12 w-12 border border-stone-200">
              <AvatarImage src={row.otherUser.avatar?.trim() || undefined} alt="" className="object-cover" />
              <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">
                {row.otherUser.name?.slice(0, 2).toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => openProfile(row.otherUser.id)}
                className="truncate text-left text-sm font-semibold text-foreground hover:underline"
              >
                {row.otherUser.name}
              </button>
              <Badge variant="outline" className={cn("text-[10px] font-bold uppercase tracking-wide", b.className)}>
                {b.label}
              </Badge>
            </div>
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{row.previewMessage || "Message request"}</p>
            <p className="mt-1 text-[10px] text-muted-foreground/90">{formatWhen(row.createdAt)}</p>
          </div>
        </div>
        {canAct ? (
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              className="h-9 flex-1 rounded-full text-xs font-bold"
              disabled={busyId === row.requestId || respondMutation.isPending}
              onClick={() => {
                setBusyId(row.requestId);
                respondMutation.mutate({
                  requestId: row.requestId,
                  decision: "approved",
                  otherUserId: row.otherUser.id,
                });
              }}
            >
              Accept
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-9 flex-1 rounded-full text-xs font-bold"
              disabled={busyId === row.requestId || respondMutation.isPending}
              onClick={() => {
                setBusyId(row.requestId);
                respondMutation.mutate({
                  requestId: row.requestId,
                  decision: "rejected",
                  otherUserId: row.otherUser.id,
                });
              }}
            >
              Decline
            </Button>
          </div>
        ) : row.status === "accepted" ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 w-full rounded-full text-xs font-bold"
            onClick={() => setLocation(`/chat?user=${encodeURIComponent(row.otherUser.id)}`)}
          >
            Open chat
          </Button>
        ) : null}
      </li>
    );
  };

  const renderOutgoingRow = (row: ChatRequestOutgoingRow) => {
    const b = statusBadge(row.status === "pending" ? "pending" : "declined");
    return (
      <li
        key={row.notificationId}
        className="flex items-start gap-3 rounded-[22px] border border-border/70 bg-card/60 p-4 shadow-2xs"
      >
        <button
          type="button"
          onClick={() => openProfile(row.otherUser.id)}
          className="shrink-0 rounded-full ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          aria-label={`View ${row.otherUser.name}`}
        >
          <Avatar className="h-12 w-12 border border-stone-200">
            <AvatarImage src={row.otherUser.avatar?.trim() || undefined} alt="" className="object-cover" />
            <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">
              {row.otherUser.name?.slice(0, 2).toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => openProfile(row.otherUser.id)}
              className="truncate text-left text-sm font-semibold text-foreground hover:underline"
            >
              {row.otherUser.name}
            </button>
            <Badge variant="outline" className={cn("text-[10px] font-bold uppercase tracking-wide", b.className)}>
              {b.label}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {row.status === "pending" ? "Waiting for them to accept or decline." : "They declined this request."}
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground/90">{formatWhen(row.createdAt)}</p>
        </div>
      </li>
    );
  };

  if (!userId) return null;

  return (
    <div className="min-h-screen bg-[hsl(var(--surface-2))] pb-24">
      <Header
        showSearch={false}
        onLogout={logout}
        title="Message requests"
        subtitle="People who want to chat and requests you’ve sent"
      />
      <div className="mx-auto mt-2 max-w-lg px-3">
        <Button
          type="button"
          variant="ghost"
          className="-ml-2 mb-2 h-10 px-2 text-slate-700 hover:bg-slate-900/[0.03]"
          onClick={() => setLocation("/chat")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to chat
        </Button>

        {isError ? (
          <p className="rounded-[24px] border border-dashed border-stone-200 bg-stone-50/80 px-4 py-10 text-center text-sm text-muted-foreground">
            Could not load requests. Check your connection and try again.
          </p>
        ) : isLoading ? (
          <LoadingState message="Loading requests…" showMascot />
        ) : (
          <Tabs value={tab} onValueChange={(v) => setTab(v as "received" | "sent")} className="w-full">
            <TabsList className="grid h-11 w-full grid-cols-2 rounded-full bg-card/60 p-1 shadow-2xs backdrop-blur-md">
              <TabsTrigger
                value="received"
                className="rounded-full text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-2xs"
              >
                Received{pendingReceived ? ` (${pendingReceived})` : ""}
              </TabsTrigger>
              <TabsTrigger
                value="sent"
                className="rounded-full text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-2xs"
              >
                Sent{pendingSent ? ` (${pendingSent})` : ""}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="received" className="mt-4 focus-visible:outline-none data-[state=inactive]:hidden">
              {incoming.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-stone-200 bg-stone-50/80 px-6 py-14 text-center">
                  <MessageCircle className="mx-auto h-8 w-8 text-primary/60" strokeWidth={1.75} />
                  <p className="mt-3 font-display text-base font-bold text-stone-900">No requests yet</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    When someone messages you from Explore or Community, their request appears here.
                  </p>
                </div>
              ) : (
                <ul className="space-y-3">{incoming.map(renderIncomingRow)}</ul>
              )}
            </TabsContent>

            <TabsContent value="sent" className="mt-4 focus-visible:outline-none data-[state=inactive]:hidden">
              {outgoing.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-stone-200 bg-stone-50/80 px-6 py-14 text-center">
                  <MessageCircle className="mx-auto h-8 w-8 text-primary/60" strokeWidth={1.75} />
                  <p className="mt-3 font-display text-base font-bold text-stone-900">Nothing sent yet</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Tap Message on a profile to send a request. You’ll see pending and declined requests here.
                  </p>
                </div>
              ) : (
                <ul className="space-y-3">{outgoing.map(renderOutgoingRow)}</ul>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
      <BottomNav active="chat" />
    </div>
  );
}
