import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UserProvider, useCurrentUser } from "@/contexts/UserContext";
import { CuratedMatchAutoClaim } from "@/components/curated/CuratedMatchAutoClaim";
import { usePresenceHeartbeat } from "@/hooks/usePresenceHeartbeat";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { LoadingState } from "@/components/common/LoadingState";
import { useEffect, useState, lazy, Suspense } from "react";
import type React from "react";

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
  try {
    const raw = localStorage.getItem("currentUser");
    if (raw) {
      const u = JSON.parse(raw);
      userId = u.id || u.userId || null;
      if (!userOnboarded && u.onboardingCompleted === true) {
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
