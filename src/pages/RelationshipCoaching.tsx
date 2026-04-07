import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import Header from "@/components/common/Header";
import BottomNav from "@/components/common/BottomNav";
import RelationshipCoach from "@/components/relationship-coaching/RelationshipCoach";
import CoachBookingDialog from "@/components/coaches/CoachBookingDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useCurrentUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Star, DollarSign, Languages, Calendar, MessageSquare } from "lucide-react";
import type { User } from "@shared/schema";
import { LoadingState } from "@/components/common/LoadingState";
import { EmptyState } from "@/components/common/EmptyState";

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
};

export default function RelationshipCoaching() {
  const [activePage, setActivePage] = useState('menu');
  const [location, setLocation] = useLocation();
  const { userId } = useCurrentUser();
  const { logout } = useAuth();
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  
  // Parse query parameters from URL
  const coachId = useMemo(() => {
    const params = new URLSearchParams(location.split('?')[1] || '');
    return params.get('coach');
  }, [location]);

  // Fetch current user to check relationship status
  const { data: currentUser } = useQuery<User & { partnerId?: string | null }>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });

  // Fetch coach details if coachId is provided
  const { data: coach, isLoading: coachLoading } = useQuery<Coach>({
    queryKey: [`/api/coaches/${coachId}`],
    enabled: !!coachId,
  });

  return (
    <div className="min-h-screen bg-[hsl(var(--surface-2))] pb-24">
      <Header
        showSearch={false}
        title="AI Luna Coach"
        unreadNotifications={0}
        onNotifications={() => setLocation('/notifications')}
        onCreate={() => setLocation('/')}
        onSettings={() => setLocation('/profile')}
        onLogout={logout}
      />
      
      <div className="mx-auto w-full max-w-lg px-4 pt-2 pb-2">
        {coachId ? (
          <div className="mb-4">
            <Button variant="ghost" onClick={() => setLocation('/coaches')} className="mb-2 -ml-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Coaches
            </Button>
          </div>
        ) : null}

        {/* Show coach details if coachId is provided */}
        {coachId && (
          <>
            {coachLoading ? (
              <LoadingState message="Loading coach details..." showMascot={true} />
            ) : coach ? (
              <Card className="mb-6">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
                    <Avatar className="mx-auto h-24 w-24 shrink-0 sm:mx-0">
                      <AvatarImage src={coach.avatar || undefined} alt={coach.name} />
                      <AvatarFallback className="text-2xl">{coach.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h2 className="text-2xl font-display font-bold text-foreground mb-2">{coach.name}</h2>
                      <Badge variant="secondary" className="mb-3">{coach.specialty}</Badge>
                      <p className="text-muted-foreground mb-4">{coach.bio}</p>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 fill-chart-4 text-chart-4" />
                          <span className="font-medium">{coach.rating}</span>
                          <span className="text-muted-foreground">({coach.reviewCount || 0} reviews)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-chart-2" />
                          <span className="font-semibold">${coach.pricePerSession}/session</span>
                        </div>
                        {coach.languages && Array.isArray(coach.languages) && coach.languages.length > 0 && (
                          <div className="flex items-center gap-2">
                            <Languages className="w-4 h-4" />
                            <span>{coach.languages.join(', ')}</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Button
                          className="flex items-center gap-2"
                          onClick={() => setBookingDialogOpen(true)}
                        >
                          <Calendar className="w-4 h-4" />
                          Book Session
                        </Button>
                        <Button
                          variant="outline"
                          className="flex items-center gap-2"
                          onClick={() => {
                            // TODO: Implement message functionality
                            console.log('Message coach', coach.id);
                          }}
                        >
                          <MessageSquare className="w-4 h-4" />
                          Message Coach
                        </Button>
                      </div>
                      
                      {/* Booking Dialog */}
                      <CoachBookingDialog
                        open={bookingDialogOpen}
                        onOpenChange={setBookingDialogOpen}
                        coachId={coach.id}
                        coachName={coach.name}
                        pricePerSession={coach.pricePerSession}
                        onBookingSuccess={() => {
                          // Optionally refresh data or show success message
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <EmptyState
                useMascot={true}
                mascotType="default"
                title="Coach not found"
                description="The coach you're looking for doesn't exist or has been removed."
              />
            )}
          </>
        )}

        {/* Show relationship coaching component */}
        {userId && (
          <RelationshipCoach
            userId={userId}
            partnerId={currentUser?.partnerId || null}
          />
        )}
      </div>

      <BottomNav active={activePage} onNavigate={setActivePage} />
    </div>
  );
}

