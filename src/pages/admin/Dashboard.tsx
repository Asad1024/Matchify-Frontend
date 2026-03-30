import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Users, Shield, TrendingUp, Heart, FileText, Calendar, UsersRound, BookOpen, GraduationCap, MessageSquare, Sparkles } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { buildApiUrl } from "@/services/api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const lunaData = [
  { day: 'Mon', tips: 120, dates: 28, appreciations: 72 },
  { day: 'Tue', tips: 145, dates: 32, appreciations: 88 },
  { day: 'Wed', tips: 132, dates: 25, appreciations: 95 },
  { day: 'Thu', tips: 158, dates: 38, appreciations: 103 },
  { day: 'Fri', tips: 172, dates: 41, appreciations: 118 },
  { day: 'Sat', tips: 165, dates: 36, appreciations: 112 },
  { day: 'Sun', tips: 155, dates: 31, appreciations: 100 },
];

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  change, 
  changeLabel 
}: { 
  title: string; 
  value: string | number; 
  icon: any; 
  change?: number;
  changeLabel?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && changeLabel && (
          <p className="text-xs text-muted-foreground mt-1">
            {change > 0 ? '+' : ''}{change} {changeLabel}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const { data: stats, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['/api/admin/dashboard'],
    queryFn: async () => {
      const url = buildApiUrl('/api/admin/dashboard');
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) {
        const contentType = res.headers.get('content-type');
        let errorMessage = `Failed to fetch dashboard stats: ${res.status}`;
        if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = await res.json();
            errorMessage = errorData.message || errorMessage;
          } catch {
            // Ignore JSON parse errors
          }
        } else {
          const errorText = await res.text();
          if (errorText.includes('<!DOCTYPE') || errorText.includes('Cannot GET')) {
            errorMessage = `API endpoint not found (404). The backend may need to be redeployed.`;
          }
        }
        throw new Error(errorMessage);
      }
      
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        throw new Error(`Invalid response format. Expected JSON but got: ${contentType || 'unknown'}`);
      }
      
      const data = await res.json();
      setLastUpdated(new Date());
      return data;
    },
    retry: false,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  useEffect(() => {
    if (stats && !isLoading) {
      setLastUpdated(new Date());
    }
  }, [stats, isLoading]);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="text-center">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  const handleManualRefresh = () => {
    refetch();
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground text-sm">Overview of your platform</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isRefetching}
          >
            <RefreshCw className={`w-4 h-4 sm:mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>

        {/* Main stats — responsive grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            title="Total Users"
            value={stats?.totalUsers || 0}
            icon={Users}
            change={stats?.newUsers7d}
            changeLabel="new this week"
          />
          <StatCard title="Verified Users" value={stats?.verifiedUsers || 0} icon={Shield} />
          <StatCard title="Active Matches" value={stats?.activeMatches || 0} icon={Heart} />
          <StatCard title="Total Matches" value={stats?.totalMatches || 0} icon={TrendingUp} />
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard title="Posts" value={stats?.totalPosts || 0} icon={FileText} />
          <StatCard title="Events" value={stats?.totalEvents || 0} icon={Calendar} />
          <StatCard title="Groups" value={stats?.totalGroups || 0} icon={UsersRound} />
          <StatCard title="Courses" value={stats?.totalCourses || 0} icon={BookOpen} />
          <StatCard title="Coaches" value={stats?.totalCoaches || 0} icon={GraduationCap} />
          <StatCard title="Messages Today" value={stats?.messagesToday || 0} icon={MessageSquare} />
        </div>

        {/* Luna Relationship Coaching section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Luna Relationship Coaching</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
            {[
              { label: 'Partners Linked', value: '312', note: '+28 this week', highlight: true },
              { label: 'Active Relationships', value: '156', highlight: true },
              { label: 'Tips Sent Today', value: '847', highlight: true },
              { label: 'Date Nights Logged', value: '203' },
              { label: 'Appreciations Sent', value: '518' },
            ].map((s) => (
              <Card key={s.label} className={s.highlight ? 'border-primary/30 bg-primary/5' : ''}>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                  <p className={`text-2xl font-bold ${s.highlight ? 'text-primary' : ''}`}>{s.value}</p>
                  {s.note && <p className="text-xs text-muted-foreground mt-0.5">{s.note}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Luna Daily Engagement</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={lunaData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="tips" stroke="#8B2942" name="Tips" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="dates" stroke="#f97316" name="Date Nights" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="appreciations" stroke="#22d3ee" name="Appreciations" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

