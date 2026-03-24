import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Header from "@/components/common/Header";
import CoachCard from "@/components/coaches/CoachCard";
import CoachBookingDialog from "@/components/coaches/CoachBookingDialog";
import BottomNav from "@/components/common/BottomNav";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { getMockData } from "@/lib/mockData";
import { Search, RefreshCw, GraduationCap } from "lucide-react";
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

  const specialtyOptions = useMemo(() => {
    const set = new Set<string>();
    coaches.forEach((c) => {
      const s = c.specialty?.trim();
      if (s) set.add(s);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [coaches]);

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

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header 
        showSearch={true} 
        unreadNotifications={3}
        onNotifications={() => setLocation('/notifications')}
        onCreate={() => setLocation('/')}
        onSettings={() => setLocation('/profile')}
        onLogout={logout} 
      />

      <div className="max-w-7xl mx-auto p-4">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-2">
                <GraduationCap className="w-8 h-8 text-primary" />
                Relationship Coaches
              </h1>
              <p className="text-muted-foreground mt-2">Connect with expert coaches to strengthen your relationship</p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={coachesLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${coachesLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search coaches by name, specialty, or expertise..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {specialtyOptions.length > 0 && (
            <div className="mt-4 flex gap-2 flex-wrap items-center">
              <span className="text-xs font-semibold text-muted-foreground w-full sm:w-auto">Specialty</span>
              <button
                type="button"
                onClick={() => setSpecialtyFilter("all")}
                className={`rounded-full px-3 py-1 text-xs font-semibold border transition-colors ${
                  specialtyFilter === "all"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
                }`}
              >
                All
              </button>
              {specialtyOptions.map((spec) => (
                <button
                  key={spec}
                  type="button"
                  onClick={() => setSpecialtyFilter(spec)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold border transition-colors max-w-[200px] truncate ${
                    specialtyFilter === spec
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
                  }`}
                  title={spec}
                >
                  {spec}
                </button>
              ))}
            </div>
          )}
        </div>

        {coachesLoading ? (
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
                : "The API returned an empty list. If you're running the real backend, add coaches with: npm run seed:coaches (from the backend-muzz folder), then refresh. Make sure the API is running on port 5000."}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  onBookSession={(id: string) => {
                    const coach = filteredCoaches.find(c => c.id === id);
                    if (coach) {
                      setSelectedCoach({
                        id: coach.id,
                        name: coach.name,
                        pricePerSession: coach.pricePerSession,
                      });
                      setBookingDialogOpen(true);
                    }
                  }}
                  onClick={(id: string) => {
                    setLocation(`/relationship-coaching?coach=${id}`);
                  }}
                />
              ))}
            </div>
          </>
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
          onBookingSuccess={() => {
            // Optionally refresh coaches list
            queryClient.invalidateQueries({ queryKey: ['/api/coaches'] });
          }}
        />
      )}

      <BottomNav active={activePage} onNavigate={setActivePage} />
    </div>
  );
}
