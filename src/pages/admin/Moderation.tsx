import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { buildApiUrl, getAuthHeaders } from "@/services/api";

type ReportRow = {
  id: string;
  reporterId: string;
  reportedId: string;
  reason: string;
  status: "pending" | "resolved" | "dismissed";
  createdAt?: string;
};

export default function Moderation() {
  const qc = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["/api/admin/reports", 1],
    queryFn: async () => {
      const url = buildApiUrl("/api/admin/reports?page=1&limit=100");
      const res = await fetch(url, { credentials: "include", headers: getAuthHeaders(false) });
      if (!res.ok) throw new Error("Failed to load reports");
      return res.json() as Promise<{ items: ReportRow[] }>;
    },
  });

  const reports = data?.items ?? [];

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

  const pending = reports.filter((r) => r.status === "pending").length;
  const resolved = reports.filter((r) => r.status === "resolved").length;
  const dismissed = reports.filter((r) => r.status === "dismissed").length;

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Moderation</h1>
          <p className="text-muted-foreground text-sm">Review and action user reports (stored in the database)</p>
        </div>

        {isError && (
          <p className="text-sm text-destructive">Could not load reports. Sign in as admin and ensure the API is running.</p>
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Reporter</th>
                  <th className="text-left p-3 font-medium">Reported</th>
                  <th className="text-left p-3 font-medium">Reason</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="p-3 whitespace-nowrap font-mono text-xs">{r.reporterId.slice(0, 8)}…</td>
                    <td className="p-3 whitespace-nowrap font-mono text-xs">{r.reportedId.slice(0, 8)}…</td>
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
                          disabled={r.status !== "pending" || updateMutation.isPending}
                          onClick={() => updateMutation.mutate({ id: r.id, status: "resolved" })}
                        >
                          Resolve
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          disabled={r.status !== "pending" || updateMutation.isPending}
                          onClick={() => updateMutation.mutate({ id: r.id, status: "dismissed" })}
                        >
                          Dismiss
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!isLoading && reports.length === 0 && (
              <p className="p-6 text-center text-muted-foreground text-sm">No reports yet.</p>
            )}
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
