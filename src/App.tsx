import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UserProvider, useCurrentUser } from "@/contexts/UserContext";
import { CuratedMatchAutoClaim } from "@/components/curated/CuratedMatchAutoClaim";
import { usePresenceHeartbeat } from "@/hooks/usePresenceHeartbeat";
import { useToast } from "@/hooks/use-toast";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { LoadingState } from "@/components/common/LoadingState";
import { pullClientStateFromBackend, pushClientStateToBackend } from "@/lib/clientStateSync";
import { buildApiUrl, getAuthHeaders } from "@/services/api";
import { useEffect, useState, lazy, Suspense, useRef } from "react";
import type React from "react";
import { LunaFab } from "@/components/assistant/LunaFab";
import EventRevealWatcher from "@/components/events/EventRevealWatcher";

// Lazy load pages for code splitting
const Landing = lazy(() => import("@/pages/Landing"));
const Home = lazy(() => import("@/pages/Home"));
const Community = lazy(() => import("@/pages/Community"));
const CommunityPostPage = lazy(() => import("@/pages/CommunityPostPage"));
const Directory = lazy(() => import("@/pages/Directory"));
const Events = lazy(() => import("@/pages/Events"));
const Chat = lazy(() => import("@/pages/Chat"));
const Profile = lazy(() => import("@/pages/Profile"));
const Menu = lazy(() => import("@/pages/Menu"));
const ExploreMuzz = lazy(() => import("@/pages/ExploreMuzz"));
const ViewProfile = lazy(() => import("@/pages/ViewProfile"));
const SocialSelfProfile = lazy(() => import("@/pages/SocialSelfProfile"));
const SocialEditProfile = lazy(() => import("@/pages/SocialEditProfile"));
const GroupDetailPage = lazy(() => import("@/pages/GroupDetailPage"));
const GroupCreatePostPage = lazy(() => import("@/pages/GroupCreatePostPage"));
const Subscriptions = lazy(() => import("@/pages/Subscriptions"));
const Notifications = lazy(() => import("@/pages/Notifications"));
const Courses = lazy(() => import("@/pages/Courses"));
const Coaches = lazy(() => import("@/pages/Coaches"));
const AIMatchmaker = lazy(() => import("@/pages/AIMatchmaker"));
const FlowB = lazy(() => import("@/pages/FlowB"));
const NextCuratedMatch = lazy(() => import("@/pages/NextCuratedMatch"));
const EmpathyObserver = lazy(() => import("@/pages/EmpathyObserver"));
const RelationshipCoaching = lazy(() => import("@/pages/RelationshipCoaching"));
const LunaPage = lazy(() => import("@/pages/Luna"));
const Settings = lazy(() => import("@/pages/Settings"));
const SettingsSocial = lazy(() => import("@/pages/SettingsSocial"));
const SocialConnectionsPage = lazy(() => import("@/pages/SocialConnectionsPage"));
const EventDetail = lazy(() => import("@/pages/EventDetail"));
const EventMatchDemo = lazy(() => import("@/pages/EventMatchDemo"));
const CreateEvent = lazy(() => import("@/pages/CreateEvent"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const AdminLogin = lazy(() => import("@/components/admin/AdminLogin"));
const AdminAnalytics = lazy(() => import("@/pages/admin/Analytics"));
const AdminUsers = lazy(() => import("@/pages/admin/Users"));
const AdminMatches = lazy(() => import("@/pages/admin/Matches"));
const AdminPosts = lazy(() => import("@/pages/admin/Posts"));
const AdminEvents = lazy(() => import("@/pages/admin/Events"));
const AdminGroups = lazy(() => import("@/pages/admin/Groups"));
const AdminCourses = lazy(() => import("@/pages/admin/Courses"));
const AdminCoaches = lazy(() => import("@/pages/admin/Coaches"));
const AdminMessages = lazy(() => import("@/pages/admin/Messages"));
const AdminQuestions = lazy(() => import("@/pages/admin/Questions"));
const AdminOnboardingQuestionnaire = lazy(
  () => import("@/pages/admin/OnboardingQuestionnaire"),
);
const AdminModeration = lazy(() => import("@/pages/admin/Moderation"));
const AdminSettings = lazy(() => import("@/pages/admin/AdminSettings"));
const AdminAI = lazy(() => import("@/pages/admin/AI"));
const Login = lazy(() => import("@/pages/Login"));
const Signup = lazy(() => import("@/pages/Signup"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const GoogleCallback = lazy(() => import("@/pages/auth/GoogleCallback"));
const NotFound = lazy(() => import("@/pages/not-found"));
const OnboardingWizard = lazy(() => import("@/components/auth/OnboardingWizard"));

// Loading wrapper component
function AuthenticatedPresence() {
  const { userId } = useCurrentUser();
  usePresenceHeartbeat(userId);
  return null;
}

type ConversationSummaryLite = {
  id: string;
  participant1Id: string;
  participant2Id: string;
  lastMessage: {
    id: string;
    senderId: string;
    content: string;
    deletedForEveryone?: boolean;
    type?: string;
    voiceUrl?: string | null;
  } | null;
};

type UserLite = { id: string; name?: string | null };

function GlobalMessageToaster({ userId, location }: { userId: string | null; location: string }) {
  const { toast } = useToast();
  const seenByConvRef = useRef<Record<string, string>>({});

  const { data: summaries = [] } = useQuery<ConversationSummaryLite[]>({
    queryKey: [`/api/users/${userId}/conversation-summaries`],
    enabled: !!userId,
    refetchInterval: 2500,
  });
  const { data: users = [] } = useQuery<UserLite[]>({
    queryKey: ["/api/users"],
    enabled: !!userId,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (!userId) return;
    if (location.startsWith("/chat")) return;
    const safeSummaries = Array.isArray(summaries) ? summaries : [];
    const safeUsers = Array.isArray(users) ? users : [];
    for (const conv of safeSummaries) {
      const last = conv?.lastMessage;
      if (!conv?.id || !last?.id) continue;
      if (last.senderId === userId) continue;
      if (seenByConvRef.current[conv.id] === last.id) continue;

      const otherId = conv.participant1Id === userId ? conv.participant2Id : conv.participant1Id;
      const other = safeUsers.find((u) => u?.id === otherId);
      const preview =
        last.deletedForEveryone
          ? "Message deleted"
          : last.voiceUrl || last.type === "voice"
            ? "Voice message"
            : String(last.content || "").slice(0, 120);

      toast({
        title: other?.name ? `New message from ${other.name}` : "New message",
        description: preview || "Open Chat to reply.",
      });
      seenByConvRef.current[conv.id] = last.id;
    }
  }, [summaries, users, userId, location, toast]);

  return null;
}

const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <LoadingState message="Loading..." showMascot={true} />
  </div>
);

// Error wrapper for lazy components
const LazyErrorBoundary = ({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary
    fallback={
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Failed to load page</h2>
          <p className="text-muted-foreground mb-4">Please refresh the page or try again.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            Refresh Page
          </button>
        </div>
      </div>
    }
  >
    {children}
  </ErrorBoundary>
);

function readAuthState() {
  const authToken = localStorage.getItem("authToken");
  if (!authToken) return { isAuthenticated: false, showOnboarding: false, userId: null as string | null };
  const isAdmin = localStorage.getItem("isAdmin") === "true";
  const onboardingFlag = localStorage.getItem("onboardingCompleted") === "true";
  let userId: string | null = null;
  let userOnboarded = onboardingFlag || isAdmin;
  const inferOnboardedFromUser = (u: any): boolean => {
    if (!u || typeof u !== "object") return false;
    // Do NOT trust stale onboardingCompleted=true if core fields are missing.
    const hasCoreProfile =
      Boolean(String(u.name || "").trim()) &&
      Boolean(String(u.location || "").trim()) &&
      Boolean(String(u.bio || "").trim()) &&
      Boolean(String(u.gender || "").trim()) &&
      Number(u.age || 0) >= 18;
    return hasCoreProfile;
  };
  try {
    const raw = localStorage.getItem("currentUser");
    if (raw) {
      const u = JSON.parse(raw);
      userId = u.id || u.userId || null;
      if (!userOnboarded && inferOnboardedFromUser(u)) {
        // Recover from stale onboarding flag if profile data is already complete.
        userOnboarded = true;
        localStorage.setItem("onboardingCompleted", "true");
      }
    }
  } catch {}
  return { isAuthenticated: true, showOnboarding: !userOnboarded, userId };
}

function AppContent() {
  const [location] = useLocation();
  const init = readAuthState();
  const [isAuthenticated, setIsAuthenticated] = useState(init.isAuthenticated);
  const [showOnboarding, setShowOnboarding] = useState(init.showOnboarding);
  const [userId, setUserId] = useState<string | null>(init.userId);

  const isLikelyOnboarded = (u: any): boolean => {
    if (!u || typeof u !== "object") return false;
    // Onboarding is only complete when core profile is present.
    // Safety net for stale flag scenarios: if core profile exists,
    // consider onboarding complete and sync it back to backend.
    const hasCoreProfile =
      Boolean(String(u.name || "").trim()) &&
      Boolean(String(u.location || "").trim()) &&
      Boolean(String(u.bio || "").trim()) &&
      Boolean(String(u.gender || "").trim()) &&
      Number(u.age || 0) >= 18;
    return hasCoreProfile;
  };

  // Re-check on route change and handle cross-tab updates
  useEffect(() => {
    const sync = () => {
      const s = readAuthState();
      setIsAuthenticated(s.isAuthenticated);
      setShowOnboarding(s.showOnboarding);
      setUserId(s.userId);
    };
    sync();
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [location]);

  // Validate onboarding status against backend on login/app-load.
  // Prevents "asked again" if local flag is stale.
  useEffect(() => {
    if (!isAuthenticated || !userId) return;
    let cancelled = false;
    const verify = async () => {
      try {
        const res = await fetch(buildApiUrl(`/api/users/${userId}`), {
          method: "GET",
          headers: { ...getAuthHeaders(false) },
          credentials: "include",
        });
        if (!res.ok) return;
        const user = await res.json();
        if (cancelled) return;
        const onboarded = isLikelyOnboarded(user);
        if (onboarded) {
          localStorage.setItem("onboardingCompleted", "true");
          try {
            const raw = localStorage.getItem("currentUser");
            const cur = raw ? JSON.parse(raw) : {};
            localStorage.setItem(
              "currentUser",
              JSON.stringify({ ...cur, ...user, onboardingCompleted: true }),
            );
          } catch {
            /* ignore parse failures */
          }
          setShowOnboarding(false);
          // Sync backend if it still says false.
          if (user.onboardingCompleted !== true) {
            void fetch(buildApiUrl(`/api/users/${userId}`), {
              method: "PATCH",
              headers: { "Content-Type": "application/json", ...getAuthHeaders(false) },
              credentials: "include",
              body: JSON.stringify({ onboardingCompleted: true }),
            });
          }
        }
      } catch {
        /* offline/unavailable */
      }
    };
    void verify();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, userId]);

  // Keep selected localStorage-backed features in sync per user across browsers.
  useEffect(() => {
    if (!isAuthenticated || !userId) return;
    let cancelled = false;

    const pullOnce = async () => {
      await pullClientStateFromBackend(userId);
      if (!cancelled) {
        try {
          window.dispatchEvent(new Event("matchify-marriage-deck-updated"));
          window.dispatchEvent(new Event("matchify-marriage-chat-updated"));
        } catch {
          /* ignore */
        }
      }
    };
    void pullOnce();

    const pushInterval = window.setInterval(() => {
      void pushClientStateToBackend(userId);
    }, 15000);

    const onUnload = () => {
      void pushClientStateToBackend(userId);
    };
    window.addEventListener("beforeunload", onUnload);

    return () => {
      cancelled = true;
      window.clearInterval(pushInterval);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, [isAuthenticated, userId]);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("onboardingCompleted");
    localStorage.removeItem("isAdmin");
    setIsAuthenticated(false);
    setShowOnboarding(false);
    setUserId(null);
    window.location.href = "/";
  };

  const handleOnboardingComplete = () => {
    localStorage.setItem("onboardingCompleted", "true");
    setShowOnboarding(false);
    window.location.href = "/";
  };

  const handleOnboardingClose = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("onboardingCompleted");
    localStorage.removeItem("isAdmin");
    setIsAuthenticated(false);
    setShowOnboarding(false);
    setUserId(null);
    window.location.href = "/login";
  };

  // Show onboarding wizard if authenticated but not completed onboarding
  if (isAuthenticated && showOnboarding && userId) {
    return (
      <Suspense fallback={<PageLoader />}>
        <OnboardingWizard
          userId={userId}
          onComplete={handleOnboardingComplete}
          onClose={handleOnboardingClose}
        />
      </Suspense>
    );
  }

  // Show landing page if not authenticated (unless on login/signup/admin routes)
  if (!isAuthenticated) {
    return (
      <LazyErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <Switch>
            <Route path="/login" component={Login} />
            <Route path="/signup" component={Signup} />
            <Route path="/reset-password" component={ResetPassword} />
            <Route path="/admin/login" component={AdminLogin} />
            <Route path="/auth/google/callback" component={GoogleCallback} />
            <Route component={Landing} />
          </Switch>
        </Suspense>
      </LazyErrorBoundary>
    );
  }

  // Show app routes if authenticated and onboarded
  return (
    <AuthProvider onLogout={handleLogout}>
      <AuthenticatedPresence />
      <CuratedMatchAutoClaim />
      <GlobalMessageToaster userId={userId} location={location} />
      <EventRevealWatcher />
      <LunaFab />
      <LazyErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <Switch>
            <Route path="/admin/login" component={AdminLogin} />
            <Route path="/" component={Home} />
            <Route path="/menu" component={Menu} />
            <Route path="/explore" component={ExploreMuzz} />
            <Route path="/community/create-post" component={GroupCreatePostPage} />
            <Route path="/community/post/:postId" component={CommunityPostPage} />
            <Route path="/community" component={Community} />
            <Route path="/group/:id/create-post" component={GroupCreatePostPage} />
            <Route path="/group/:id" component={GroupDetailPage} />
            <Route path="/people">
              <Redirect to="/directory" />
            </Route>
            <Route path="/directory" component={Directory} />
            <Route path="/events/create" component={CreateEvent} />
            <Route path="/events/demo" component={EventMatchDemo} />
            <Route path="/event/:id" component={EventDetail} />
            <Route path="/events" component={Events} />
            <Route path="/chat" component={Chat} />
            <Route path="/profile/social/edit" component={SocialEditProfile} />
            <Route path="/profile/social" component={SocialSelfProfile} />
            <Route path="/profile/:id" component={ViewProfile} />
            <Route path="/profile" component={Profile} />
            <Route path="/subscriptions" component={Subscriptions} />
            <Route path="/notifications" component={Notifications} />
            <Route path="/courses" component={Courses} />
            <Route path="/coaches" component={Coaches} />
            <Route path="/ai-matchmaker" component={AIMatchmaker} />
            <Route path="/ai-matchmaker/flow-a">
              <Redirect to="/ai-matchmaker/flow-b" />
            </Route>
            <Route path="/ai-matchmaker/flow-b" component={FlowB} />
            <Route path="/ai-matchmaker/next-curated" component={NextCuratedMatch} />
            <Route path="/self-discovery">
              <Redirect to="/ai-matchmaker/flow-b" />
            </Route>
            <Route path="/empathy-observer" component={EmpathyObserver} />
            <Route path="/relationship-coaching" component={RelationshipCoaching} />
            <Route path="/luna" component={LunaPage} />
            <Route path="/settings/social/connections" component={SocialConnectionsPage} />
            <Route path="/settings/social" component={SettingsSocial} />
            <Route path="/settings" component={Settings} />
            <Route path="/login">
              <Redirect to="/" />
            </Route>
            <Route path="/signup">
              <Redirect to="/" />
            </Route>
            <Route path="/reset-password">
              <Redirect to="/" />
            </Route>
            <Route path="/admin/analytics" component={AdminAnalytics} />
            <Route path="/admin/users" component={AdminUsers} />
            <Route path="/admin/matches" component={AdminMatches} />
            <Route path="/admin/posts" component={AdminPosts} />
            <Route path="/admin/events" component={AdminEvents} />
            <Route path="/admin/groups" component={AdminGroups} />
            <Route path="/admin/courses" component={AdminCourses} />
            <Route path="/admin/coaches" component={AdminCoaches} />
            <Route path="/admin/messages" component={AdminMessages} />
            <Route path="/admin/onboarding-questionnaire" component={AdminOnboardingQuestionnaire} />
            <Route path="/admin/questions" component={AdminQuestions} />
            <Route path="/admin/reports" component={AdminModeration} />
            <Route path="/admin/settings" component={AdminSettings} />
            <Route path="/admin/ai" component={AdminAI} />
            <Route path="/admin" component={AdminDashboard} />
            <Route component={NotFound} />
          </Switch>
        </Suspense>
      </LazyErrorBoundary>
    </AuthProvider>
  );
}

function App() {
  // Light-only: use :root tokens from index.css (remove legacy forced dark)
  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <UserProvider>
          <TooltipProvider>
            <Toaster />
            <AppContent />
          </TooltipProvider>
        </UserProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
