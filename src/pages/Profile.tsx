import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Header from "@/components/common/Header";
import PageWrapper from "@/components/common/PageWrapper";
import ProfileEditDialog from "@/components/profile/ProfileEditDialog";
import AddPartnerDialog from "@/components/relationship-coaching/AddPartnerDialog";
import BottomNav from "@/components/common/BottomNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Edit, MapPin, Heart, Users, Calendar, LogOut, Brain, Sparkles,
  CheckCircle, ArrowRight, UserPlus, UserMinus, ChevronRight, Shield
} from "lucide-react";
import { LoadingState } from "@/components/common/LoadingState";
import { useCurrentUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { usersService } from "@/services/users.service";
import { ProfileMarriageIntentBar } from "@/components/profile/ProfileMarriageIntentBar";
import { getReligionLabel, MEET_PREFERENCE_OPTIONS } from "@/lib/religionOptions";

type User = {
  id: string;
  name: string;
  username: string;
  email: string;
  age: number | null;
  location: string | null;
  bio: string | null;
  avatar: string | null;
  interests: string[] | null;
  membershipTier: string | null;
  verified: boolean | null;
};

export default function Profile() {
  const [activePage, setActivePage] = useState('menu');
  const [, setLocation] = useLocation();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addPartnerOpen, setAddPartnerOpen] = useState(false);
  const { userId } = useCurrentUser();
  const { logout } = useAuth();
  const { toast } = useToast();

  const { data: user, isLoading } = useQuery<User & {
    selfDiscoveryCompleted?: boolean;
    attractionBlueprint?: unknown;
    commitmentIntention?: string;
    marriageTimeline?: string | null;
    religion?: string | null;
    meetPreference?: string | null;
    loveLanguage?: string;
    topPriorities?: string[];
    relationshipReadiness?: { score?: number };
    inRelationship?: boolean;
    partnerId?: string | null;
  }>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });

  const { data: partner } = useQuery<
    User & { commitmentIntention?: string | null; marriageTimeline?: string | null }
  >({
    queryKey: [`/api/users/${user?.partnerId}`],
    enabled: !!user?.partnerId,
  });

  const removePartner = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Not logged in");
      return usersService.patch(userId, { inRelationship: false, partnerId: null });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
      toast({ title: "Partner removed" });
    },
    onError: () => {
      toast({ title: "Couldn't remove partner", variant: "destructive" });
    },
  });

  const { data: posts = [] } = useQuery<any[]>({
    queryKey: ['/api/posts'],
    enabled: !!userId,
  });

  const { data: memberships = [] } = useQuery<any[]>({
    queryKey: ['/api/users', userId, 'memberships'],
    enabled: !!userId,
  });

  const { data: matches = [] } = useQuery<any[]>({
    queryKey: [`/api/users/${userId}/matches`],
    enabled: !!userId,
  });

  const { data: rsvps = [] } = useQuery<any[]>({
    queryKey: ['/api/users', userId, 'rsvps'],
    enabled: !!userId,
  });

  const postCount = Array.isArray(posts)
    ? posts.filter((p: any) => (p.userId || p.authorId) === userId).length
    : 0;
  const connectionCount = Array.isArray(matches) ? matches.length : 0;
  const eventsJoinedCount = Array.isArray(rsvps) ? rsvps.length : 0;
  const groupCount = Array.isArray(memberships) ? memberships.length : 0;

  if (!userId || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <Header showSearch={false} />
        <div className="flex items-center justify-center py-20">
          <LoadingState message="Loading your profile..." showMascot={true} />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <Header showSearch={false} />
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-400">Profile not found</p>
        </div>
      </div>
    );
  }

  /** Same gate as Discover: saved blueprint means the 30-question flow was finished. */
  const aiMatchmakerSaved = Boolean(user.attractionBlueprint);

  return (
    <PageWrapper>
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header showSearch={false} onLogout={logout} />

      <div className="max-w-lg mx-auto">
        {/* Cover photo + Avatar hero */}
        <div className="relative">
          {/* Cover photo */}
          <div className="h-44 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #f43f5e 0%, #ec4899 40%, #a855f7 70%, #6366f1 100%)" }}>
            {/* Dot grid texture */}
            <div className="absolute inset-0 opacity-15"
              style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "20px 20px" }}
            />
            {/* Decorative orbs */}
            <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 rounded-full bg-white/10 blur-xl" />
            <div className="absolute top-1/2 right-12 w-16 h-16 rounded-full bg-white/15" />
          </div>

          {/* Avatar overlapping cover */}
          <div className="absolute -bottom-12 left-4">
            <div className="relative">
              <Avatar className="w-24 h-24 border-4 border-white shadow-md">
                <AvatarImage src={user.avatar || undefined} alt={user.name} />
                <AvatarFallback className="text-2xl font-black bg-primary text-white">
                  {user.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {user.verified && (
                <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary rounded-full flex items-center justify-center border-2 border-white">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          </div>

          {/* Edit button */}
          <div className="absolute bottom-3 right-4">
            <Button
              size="sm"
              variant="outline"
              className="rounded-full bg-white border-gray-200 text-gray-700 font-semibold text-xs h-8 px-3 shadow-sm"
              onClick={() => setEditDialogOpen(true)}
              data-testid="button-edit"
            >
              <Edit className="w-3 h-3 mr-1" />
              Edit Profile
            </Button>
          </div>
        </div>

        {/* Name & basic info */}
        <div className="px-4 pt-14 pb-4 bg-white border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-black text-gray-900 font-display">
                {user.name}{user.age ? `, ${user.age}` : ''}
              </h1>
              <div className="flex items-center gap-3 mt-1">
                {user.location && (
                  <span className="flex items-center gap-1 text-sm text-gray-500">
                    <MapPin className="w-3.5 h-3.5" />
                    {user.location}
                  </span>
                )}
                <Badge className="bg-primary/10 text-primary border-0 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {user.membershipTier || 'Free'}
                </Badge>
                {user.religion && user.religion !== "prefer_not_say" && (
                  <Badge
                    variant="outline"
                    className="text-xs font-semibold px-2 py-0.5 rounded-full border-primary/30 text-primary"
                  >
                    {getReligionLabel(user.religion)}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-0 mt-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <p className="text-xl font-black text-gray-900">{connectionCount}</p>
              <p className="text-xs text-gray-400 font-medium mt-0.5">Connections</p>
            </div>
            <div className="text-center border-x border-gray-100">
              <p className="text-xl font-black text-gray-900">{postCount}</p>
              <p className="text-xs text-gray-400 font-medium mt-0.5">Posts</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-black text-gray-900">{groupCount}</p>
              <p className="text-xs text-gray-400 font-medium mt-0.5">Groups</p>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-2 text-center">
            {eventsJoinedCount > 0
              ? `${eventsJoinedCount} event${eventsJoinedCount === 1 ? "" : "s"} RSVP’d — keep exploring!`
              : "RSVP to events from the Events tab to see them here."}
          </p>
        </div>

        {/* Faith & discovery (inclusive — Muzz-style clarity, all backgrounds) */}
        <div className="bg-white mt-2 px-4 py-4 border-b border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Faith & communities</p>
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex justify-between gap-2">
              <span className="text-gray-500">Background</span>
              <span className="font-semibold text-right">
                {user.religion ? getReligionLabel(user.religion) : "—"}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-gray-500">Group highlights</span>
              <span className="font-semibold text-right text-xs max-w-[60%]">
                {user.meetPreference
                  ? MEET_PREFERENCE_OPTIONS.find((m) => m.value === user.meetPreference)?.label
                  : "Open to everyone"}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-3 leading-relaxed">
            Matchify is for all faiths and none. This only helps surface communities and matches you’ll vibe with.
          </p>
        </div>

        {/* Marriage intentions — you + linked partner (same path as Muzz “both sides”) */}
        <div className="px-4 mt-3 space-y-3">
          <ProfileMarriageIntentBar
            user={{
              name: user.name,
              commitmentIntention: user.commitmentIntention,
              marriageTimeline: user.marriageTimeline,
            }}
            variant="self"
          />
          {user.partnerId && partner && (
            <ProfileMarriageIntentBar
              user={{
                name: partner.name,
                commitmentIntention: partner.commitmentIntention,
                marriageTimeline: partner.marriageTimeline ?? null,
              }}
              variant="other"
            />
          )}
          {user.partnerId && !partner && (
            <div className="rounded-xl border border-dashed border-primary/20 bg-primary/5 px-4 py-3 text-center">
              <p className="text-xs text-muted-foreground">Loading your partner’s intentions…</p>
            </div>
          )}
          {!user.partnerId && (
            <p className="text-[11px] text-muted-foreground text-center leading-relaxed px-1">
              <span className="font-semibold text-foreground">Partner’s part:</span> link them under{" "}
              <span className="font-semibold">Relationship coaching</span> below — then their marriage
              intentions show here next to yours.
            </p>
          )}
        </div>

        {/* About */}
        <div className="bg-white mt-2 px-4 py-4 border-b border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">About</p>
          <p className="text-sm text-gray-700 leading-relaxed">
            {user.bio || 'No bio added yet. Tap Edit Profile to add one.'}
          </p>
        </div>

        {/* Interests */}
        {user.interests && Array.isArray(user.interests) && user.interests.length > 0 && (
          <div className="bg-white mt-2 px-4 py-4 border-b border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Interests</p>
            <div className="flex flex-wrap gap-2">
              {user.interests.map((interest) => (
                <span key={interest} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold">
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* AI Matchmaker */}
        <div className="bg-white mt-2 px-4 py-4 border-b border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">AI Matchmaker</p>
          {aiMatchmakerSaved ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">AI Matchmaker finished</p>
                  <p className="text-xs text-gray-500">Your 30-question answers are saved.</p>
                  {user.commitmentIntention && (
                    <p className="text-xs text-gray-500">
                      Marriage intention:{" "}
                      {user.commitmentIntention.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    </p>
                  )}
                </div>
              </div>
              {user.relationshipReadiness?.score && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">Relationship Readiness</span>
                    <span className="text-xs font-bold text-primary">{user.relationshipReadiness.score}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${user.relationshipReadiness.score}%` }}
                    />
                  </div>
                </div>
              )}
              <button
                className="w-full flex items-center justify-between py-2 text-sm text-primary font-semibold"
                onClick={() => setLocation('/ai-matchmaker/flow-b')}
              >
                <span className="flex items-center gap-2"><Sparkles className="w-4 h-4" /> Update AI Matchmaker</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-500 mb-3">Finish all 30 AI Matchmaker questions to unlock better matches, profile insights, and event recommendations.</p>
              <Button
                className="w-full h-11 rounded-2xl bg-primary text-white font-bold"
                onClick={() => setLocation('/ai-matchmaker/flow-b')}
              >
                <Brain className="w-4 h-4 mr-2" />
                Start AI Matchmaker
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>

        {/* Relationship Coaching / Partner */}
        <div className="bg-white mt-2 px-4 py-4 border-b border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Relationship Coaching</p>
          {user.partnerId ? (
            <div className="flex items-center gap-3">
              <Avatar className="h-11 w-11 border-2 border-pink-100">
                <AvatarImage src={partner?.avatar || undefined} alt={partner?.name} />
                <AvatarFallback className="bg-pink-100 text-pink-600 font-bold">
                  {partner?.name?.slice(0, 2).toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-900">{partner?.name ?? "..."}</p>
                {partner?.username && <p className="text-xs text-gray-400">@{partner.username}</p>}
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="rounded-xl h-9 bg-primary text-white font-semibold text-xs" onClick={() => setLocation('/relationship-coaching')}>
                  <Heart className="w-3 h-3 mr-1" /> Coach
                </Button>
                <Button size="sm" variant="outline" className="rounded-xl h-9 border-gray-200 text-xs" onClick={() => removePartner.mutate()} disabled={removePartner.isPending}>
                  <UserMinus className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-500 mb-3">Add a partner to use Luna's relationship coaching.</p>
              <Button className="w-full h-11 rounded-2xl bg-primary text-white font-bold" onClick={() => setAddPartnerOpen(true)}>
                <UserPlus className="w-4 h-4 mr-2" /> Add Partner
              </Button>
            </div>
          )}
        </div>

        {/* Account info */}
        <div className="bg-white mt-2 border-b border-gray-100">
          <p className="px-4 pt-4 pb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Account</p>
          <div className="divide-y divide-gray-50">
            <div className="px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-gray-500">Username</span>
              <span className="text-sm font-semibold text-gray-900">@{user.username}</span>
            </div>
            <div className="px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-gray-500">Email</span>
              <span className="text-sm font-semibold text-gray-900">{user.email}</span>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white mt-2 border-b border-gray-100">
          <p className="px-4 pt-4 pb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Settings</p>
          <div className="divide-y divide-gray-50">
            {[
              { label: 'Privacy Settings', icon: Shield, action: () => setLocation('/settings'), testId: 'button-privacy' },
              { label: 'Notification Preferences', icon: null, action: () => setLocation('/settings'), testId: 'button-notifications-settings' },
              { label: 'Security & Password', icon: null, action: () => {}, testId: 'button-security' },
            ].map(({ label, icon: Icon, action, testId }) => (
              <button
                key={label}
                className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors"
                onClick={action}
                data-testid={testId}
              >
                <span className="text-sm font-medium text-gray-700">{label}</span>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </button>
            ))}
            <button
              className="w-full px-4 py-3.5 flex items-center gap-3 text-red-500 hover:bg-red-50 transition-colors"
              onClick={logout}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-bold">Log Out</span>
            </button>
          </div>
        </div>
      </div>

      <BottomNav active={activePage} onNavigate={setActivePage} />

      {user && (
        <ProfileEditDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          user={user}
        />
      )}

      <AddPartnerDialog
        open={addPartnerOpen}
        onOpenChange={setAddPartnerOpen}
      />
    </div>
    </PageWrapper>
  );
}

