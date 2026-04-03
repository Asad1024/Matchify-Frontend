import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Link } from "wouter";
import AdminLayout from "@/components/admin/AdminLayout";
import { buildApiUrl, getAuthHeaders } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type ReportParty = {
  id: string;
  name: string | null;
  username: string | null;
  avatar: string | null;
};

type ReportRow = {
  id: string;
  reporterId: string;
  reportedId: string;
  reporter: ReportParty | null;
  reported: ReportParty | null;
  postId: string | null;
  postPreview: string | null;
  postImage: string | null;
  reason: string;
  status: "pending" | "resolved" | "dismissed";
  createdAt?: string;
};

function parseParty(raw: unknown): ReportParty | null {
  if (raw == null || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = o.id != null ? String(o.id) : "";
  if (!id) return null;
  return {
    id,
    name: o.name != null && String(o.name).trim() ? String(o.name) : null,
    username: o.username != null && String(o.username).trim() ? String(o.username) : null,
    avatar: o.avatar != null && String(o.avatar).trim() ? String(o.avatar) : null,
  };
}

function normalizeReportRow(raw: Record<string, unknown>): ReportRow | null {
  const id = raw.id != null ? String(raw.id) : "";
  if (!id) return null;
  const reporterId = String(raw.reporterId ?? raw.reporter_id ?? "");
  const reportedId = String(raw.reportedId ?? raw.reported_id ?? "");
  const reason = String(raw.reason ?? "");
  const s = String(raw.status ?? "pending").toLowerCase();
  const status: ReportRow["status"] =
    s === "resolved" || s === "dismissed" ? s : "pending";
  const createdAt =
    raw.createdAt != null
      ? String(raw.createdAt)
      : raw.created_at != null
        ? String(raw.created_at)
        : undefined;
  const postIdRaw = raw.postId ?? raw.post_id;
  const postId =
    postIdRaw != null && String(postIdRaw).trim() ? String(postIdRaw).trim() : null;
  const pv = raw.postPreview ?? raw.post_preview;
  const postPreview = pv != null && String(pv).trim() ? String(pv).trim() : null;
  const pi = raw.postImage ?? raw.post_image;
  const postImage = pi != null && String(pi).trim() ? String(pi).trim() : null;
  return {
    id,
    reporterId,
    reportedId,
    reporter: parseParty(raw.reporter),
    reported: parseParty(raw.reported),
    postId,
    postPreview,
    postImage,
    reason,
    status,
    createdAt,
  };
}

function parseReportsPayload(json: unknown): ReportRow[] {
  if (!json || typeof json !== "object") return [];
  const o = json as Record<string, unknown>;
  const rawList = Array.isArray(o.items)
    ? o.items
    : Array.isArray(o.reports)
      ? o.reports
      : Array.isArray(o.data)
        ? o.data
        : [];
  const out: ReportRow[] = [];
  for (const item of rawList) {
    if (!item || typeof item !== "object") continue;
    const row = normalizeReportRow(item as Record<string, unknown>);
    if (row) out.push(row);
  }
  return out;
}

function shortId(id: string) {
  if (!id) return "—";
  return id.length <= 8 ? id : `${id.slice(0, 8)}…`;
}

function initialsForParty(party: ReportParty | null, fallbackId: string) {
  const base = party?.name?.trim() || party?.username?.trim();
  if (!base) return (fallbackId.slice(0, 2) || "?").toUpperCase();
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]!.slice(0, 1)}${parts[1]!.slice(0, 1)}`.toUpperCase();
  }
  return base.slice(0, 2).toUpperCase();
}

function ReportUserCell({ party, userId }: { party: ReportParty | null; userId: string }) {
  if (!userId) {
    return <span className="text-muted-foreground">—</span>;
  }
  if (!party) {
    return (
      <div className="flex items-center gap-2.5 min-w-0 max-w-[220px]">
        <Avatar className="h-9 w-9 shrink-0 rounded-md">
          <AvatarFallback className="rounded-md text-[10px]">?</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="font-medium text-muted-foreground truncate">Account removed</div>
          <div className="text-[10px] font-mono text-muted-foreground truncate" title={userId}>
            {shortId(userId)}
          </div>
        </div>
      </div>
    );
  }
  const primary = party.name?.trim() || party.username?.trim() || `User ${shortId(userId)}`;
  const sub =
    party.name?.trim() && party.username?.trim() && party.name.trim() !== party.username.trim()
      ? `@${party.username}`
      : null;
  return (
    <div className="flex items-center gap-2.5 min-w-0 max-w-[220px]">
      <Avatar className="h-9 w-9 shrink-0 rounded-md">
        <AvatarImage src={party.avatar || undefined} alt="" className="object-cover" />
        <AvatarFallback className="rounded-md text-[10px] font-medium">
          {initialsForParty(party, userId)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="font-medium text-foreground truncate leading-tight" title={userId}>
          {primary}
        </div>
        {sub ? <div className="text-xs text-muted-foreground truncate">{sub}</div> : null}
      </div>
    </div>
  );
}

function ModerationReportTable({
  rows,
  showPostColumn,
  updatePending,
  onResolve,
  onDismiss,
}: {
  rows: ReportRow[];
  showPostColumn: boolean;
  updatePending: boolean;
  onResolve: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b">
          <th className="text-left p-3 font-medium">Reporter</th>
          <th className="text-left p-3 font-medium">Reported</th>
          {showPostColumn ? <th className="text-left p-3 font-medium">Post</th> : null}
          <th className="text-left p-3 font-medium">Reason</th>
          <th className="text-left p-3 font-medium">Status</th>
          <th className="text-left p-3 font-medium">Actions</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id} className="border-b last:border-0">
            <td className="p-3 align-middle">
              <ReportUserCell party={r.reporter} userId={r.reporterId} />
            </td>
            <td className="p-3 align-middle">
              <ReportUserCell party={r.reported} userId={r.reportedId} />
            </td>
            {showPostColumn ? (
              <td className="p-3 align-middle text-xs max-w-[min(280px,40vw)]">
                {r.postId ? (
                  <div className="space-y-1.5 min-w-0">
                    {r.postImage ? (
                      <img
                        src={r.postImage}
                        alt=""
                        className="h-12 w-12 rounded-md object-cover border border-border/60 shrink-0"
                      />
                    ) : null}
                    {r.postPreview ? (
                      <p className="text-muted-foreground line-clamp-3 leading-snug">{r.postPreview}</p>
                    ) : null}
                    <Link
                      href={`/community/post/${encodeURIComponent(r.postId)}`}
                      className="text-primary underline-offset-2 hover:underline font-mono inline-block"
                    >
                      {shortId(r.postId)}
                    </Link>
                  </div>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
            ) : null}
            <td className="p-3 max-w-xs truncate" title={r.reason}>
              {r.reason}
            </td>
            <td className="p-3">
              {r.status === "pending" && (
                <Badge className="bg-amber-100 text-amber-600 border-0">Pending</Badge>
              )}
              {r.status === "resolved" && (
                <Badge className="bg-primary/10 text-primary border-0">Resolved</Badge>
              )}
              {r.status === "dismissed" && (
                <Badge className="bg-gray-100 text-gray-600 border-0">Dismissed</Badge>
              )}
            </td>
            <td className="p-3">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  disabled={r.status !== "pending" || updatePending}
                  onClick={() => onResolve(r.id)}
                >
                  Resolve
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  disabled={r.status !== "pending" || updatePending}
                  onClick={() => onDismiss(r.id)}
                >
                  Dismiss
                </Button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function Moderation() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [reportTab, setReportTab] = useState<"profile" | "post">("post");

  const { data: reports = [], isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ["/api/admin/reports", 1],
    queryFn: async () => {
      const url = buildApiUrl("/api/admin/reports?page=1&limit=100");
      const res = await fetch(url, { credentials: "include", headers: getAuthHeaders(false) });
      if (!res.ok) {
        let msg = `Failed to load reports (${res.status})`;
        const errText = await res.text();
        try {
          const errBody = JSON.parse(errText) as { message?: unknown };
          if (errBody?.message != null) msg = String(errBody.message);
        } catch {
          if (errText && !errText.includes("<!DOCTYPE")) msg = errText.slice(0, 200);
        }
        throw new Error(msg);
      }
      const json = await res.json();
      return parseReportsPayload(json);
    },
    retry: false,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(buildApiUrl(`/api/admin/reports/${id}`), {
        method: "PATCH",
        headers: getAuthHeaders(true),
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Update failed");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin/reports"] }),
  });

  const seedDemoMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(buildApiUrl("/api/admin/reports/seed-demo"), {
        method: "POST",
        headers: getAuthHeaders(true),
        credentials: "include",
        body: "{}",
      });
      const text = await res.text();
      let body: Record<string, unknown> = {};
      try {
        body = text ? (JSON.parse(text) as Record<string, unknown>) : {};
      } catch {
        /* ignore */
      }
      if (!res.ok) {
        throw new Error(typeof body.message === "string" ? body.message : `Request failed (${res.status})`);
      }
      return body;
    },
    onSuccess: (body) => {
      qc.invalidateQueries({ queryKey: ["/api/admin/reports"] });
      toast({
        title: body.skipped ? "No change" : "Demo report added",
        description:
          typeof body.message === "string"
            ? body.message
            : body.skipped
              ? "There are already reports in the queue."
              : "Refresh the table if it does not update.",
      });
    },
    onError: (e) => {
      toast({
        title: "Could not add demo report",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  const pending = reports.filter((r) => r.status === "pending").length;
  const resolved = reports.filter((r) => r.status === "resolved").length;
  const dismissed = reports.filter((r) => r.status === "dismissed").length;

  const profileReports = useMemo(() => reports.filter((r) => !r.postId), [reports]);
  const postReports = useMemo(() => reports.filter((r) => !!r.postId), [reports]);

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Moderation</h1>
          <p className="text-muted-foreground text-sm">Review and action user reports (stored in the database)</p>
        </div>

        {isError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm space-y-2">
            <p className="font-medium text-destructive">Could not load reports</p>
            <p className="text-muted-foreground">
              {error instanceof Error ? error.message : "Sign in as admin and ensure the API is running."}
            </p>
            <Button type="button" variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
              Retry
            </Button>
          </div>
        )}
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{pending}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{resolved}</p>
                <p className="text-sm text-muted-foreground">Resolved</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <XCircle className="w-8 h-8 text-gray-400" />
              <div>
                <p className="text-2xl font-bold">{dismissed}</p>
                <p className="text-sm text-muted-foreground">Dismissed</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <div className="overflow-x-auto p-1 sm:p-2">
            {!isLoading && !isError && reports.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm space-y-3 max-w-lg mx-auto">
                <p>
                  No reports in the database yet. Real reports are created only when a signed-in user submits one and the
                  POST reaches your API (failed requests are no longer faked as success in the browser).
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={seedDemoMutation.isPending}
                    onClick={() => seedDemoMutation.mutate()}
                  >
                    Add demo report row
                  </Button>
                  <span className="text-xs self-center text-muted-foreground/90">
                    Needs two registered users if the button above returns an error.
                  </span>
                </div>
              </div>
            ) : (
              <Tabs value={reportTab} onValueChange={(v) => setReportTab(v as "profile" | "post")} className="w-full">
                <TabsList className="mb-4 h-auto min-h-11 w-full flex-wrap justify-start gap-1 sm:justify-center">
                  <TabsTrigger value="profile" className="gap-1.5 px-3 sm:px-4">
                    <span>Profile reports</span>
                    <Badge variant="secondary" className="rounded-full px-2 py-0 text-[10px] font-normal tabular-nums">
                      {profileReports.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="post" className="gap-1.5 px-3 sm:px-4">
                    <span>Post reports</span>
                    <Badge variant="secondary" className="rounded-full px-2 py-0 text-[10px] font-normal tabular-nums">
                      {postReports.length}
                    </Badge>
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="profile" className="mt-0 focus-visible:outline-none">
                  {profileReports.length === 0 ? (
                    <p className="p-6 text-center text-sm text-muted-foreground">
                      No profile reports. These are created when someone uses Report on a person (not Report post).
                    </p>
                  ) : (
                    <ModerationReportTable
                      rows={profileReports}
                      showPostColumn={false}
                      updatePending={updateMutation.isPending}
                      onResolve={(id) => updateMutation.mutate({ id, status: "resolved" })}
                      onDismiss={(id) => updateMutation.mutate({ id, status: "dismissed" })}
                    />
                  )}
                </TabsContent>
                <TabsContent value="post" className="mt-0 focus-visible:outline-none">
                  {postReports.length === 0 ? (
                    <p className="p-6 text-center text-sm text-muted-foreground">
                      No post reports yet. These are created from the ⋯ menu on a post.
                    </p>
                  ) : (
                    <ModerationReportTable
                      rows={postReports}
                      showPostColumn
                      updatePending={updateMutation.isPending}
                      onResolve={(id) => updateMutation.mutate({ id, status: "resolved" })}
                      onDismiss={(id) => updateMutation.mutate({ id, status: "dismissed" })}
                    />
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
