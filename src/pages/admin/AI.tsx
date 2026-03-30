import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Sparkles, TrendingUp, Users } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { buildApiUrl, getAuthHeaders } from "@/services/api";

type AiStats = {
  usersWithBlueprint: number;
  totalUsers: number;
  lunaReplies: number;
  aiMatchesMadeEstimate: number;
  questionnairesCompletedEstimate: number;
  avgCompatibilityEstimate: number;
};

export default function AI() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["/api/admin/ai-stats"],
    queryFn: async () => {
      const res = await fetch(buildApiUrl("/api/admin/ai-stats"), {
        credentials: "include",
        headers: getAuthHeaders(false),
      });
      if (!res.ok) throw new Error("Failed to load AI stats");
      return res.json() as Promise<AiStats>;
    },
    refetchInterval: 60_000,
  });

  const stats = [
    {
      label: "AI-style matches (DB pairs)",
      value: data ? String(data.aiMatchesMadeEstimate) : "—",
      icon: Sparkles,
      change: "From match records",
    },
    {
      label: "Questionnaires / blueprints",
      value: data ? String(data.questionnairesCompletedEstimate) : "—",
      icon: Brain,
      change: "Users with attraction blueprint",
    },
    {
      label: "Avg. compatibility (estimate)",
      value: data ? `${data.avgCompatibilityEstimate}%` : "—",
      icon: TrendingUp,
      change: "Heuristic from blueprint adoption",
    },
    {
      label: "Users with blueprint",
      value: data ? String(data.usersWithBlueprint) : "—",
      icon: Users,
      change: data ? `of ${data.totalUsers} users` : "",
    },
  ];

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">AI Matchmaker</h1>
            <p className="text-muted-foreground text-sm">Live metrics from the database + Luna usage</p>
          </div>
          <Badge className="bg-emerald-100 text-emerald-800 border-0 ml-auto">
            {isLoading ? "Loading…" : isError ? "API error" : "Live data"}
          </Badge>
        </div>

        {isError && (
          <p className="text-sm text-destructive">Could not load /api/admin/ai-stats (admin session required).</p>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label}>
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Icon className="w-3.5 h-3.5" />
                    {s.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-primary">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.change}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Luna coach</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Luna replies stored:{" "}
              <span className="font-semibold text-foreground">{data?.lunaReplies ?? "—"}</span>
              . User-facing copy uses OpenAI when <code className="text-xs bg-muted px-1 rounded">OPENAI_API_KEY</code>{" "}
              is set on the server.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
