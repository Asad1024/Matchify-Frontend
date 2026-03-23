import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Sparkles, TrendingUp, Users } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";

export default function AI() {
  const stats = [
    { label: 'AI Matches Made', value: '1,247', icon: Sparkles, change: '+128 this week' },
    { label: 'Questionnaires Completed', value: '3,891', icon: Brain, change: '+342 this week' },
    { label: 'Avg. Compatibility Score', value: '78%', icon: TrendingUp, change: '+2% vs last month' },
    { label: 'Users with Blueprint', value: '2,104', icon: Users, change: '+89 this week' },
  ];

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">AI Matchmaker</h1>
            <p className="text-muted-foreground text-sm">AI matchmaking performance and insights</p>
          </div>
          <Badge className="bg-amber-100 text-amber-700 border-0 ml-auto">Demo data</Badge>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map(s => {
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
          <CardHeader><CardTitle className="text-sm">Match Quality Distribution</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: 'High compatibility (85%+)', pct: 32, color: 'bg-primary' },
                { label: 'Good compatibility (70-85%)', pct: 45, color: 'bg-primary' },
                { label: 'Moderate compatibility (50-70%)', pct: 18, color: 'bg-amber-500' },
                { label: 'Low compatibility (<50%)', pct: 5, color: 'bg-red-400' },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span>{item.label}</span>
                    <span className="font-medium">{item.pct}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
