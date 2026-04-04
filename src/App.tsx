import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { getPostsPersistOptions } from "./lib/queryPersist";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useQuery } from "@tanstack/react-query";
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
import { readJwtSub, reconcileCurrentUserIdWithJwt } from "@/lib/authUserIdReconcile";
import { isNotificationsStreamSyncPayload } from "@/lib/notificationStream";
import { buildApiUrl, getAuthHeaders, getNotificationsStreamUrl } from "@/services/api";
import { notificationCreatedAtMs } from "@/lib/utils";
import { useEffect, useState, lazy, Suspense, useRef, useMemo } from "react";
import type React from "react";
import { LunaFab } from "@/components/assistant/LunaFab";
import EventRevealWatcher from "@/components/events/EventRevealWatcher";
import { UpgradeProvider } from "@/contexts/UpgradeContext";

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
const SocialUserProfile = lazy(() => import("@/pages/SocialUserProfile"));
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
const ChatRequestsPage = lazy(() => import("@/pages/ChatRequestsPage"));
const Support = lazy(() => import("@/pages/Support"));
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
const AdminVenues = lazy(() => import("@/pages/admin/Venues"));
const AdminGroups = lazy(() => import("@/pages/admin/Groups"));
const AdminCourses = lazy(() => import("@/pages/admin/Courses"));
const AdminCoaches = lazy(() => import("@/pages/admin/Coaches"));
const AdminMessages = lazy(() => import("@/pages/admin/Messages"));
const AdminQuestions = lazy(() => import("@/pages/admin/Questions"));
const AdminModeration = lazy(() => import("@/pages/admin/Moderation"));
const AdminSettings = lazy(() => import("@/pages/admin/AdminSettings"));
const AdminAI = lazy(() => import("@/pages/admin/AI"));
const AdminNotifications = lazy(() => import("@/pages/admin/Notifications"));
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
  unreadCount?: number;
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

  useEffect(() => {
    seenByConvRef.current = {};
  }, [userId]);

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
      if (last.senderId === userId) {
        seenByConvRef.current[conv.id] = last.id;
        continue;
      }
      const unread = Number(conv.unreadCount ?? 0);
      if (unread <= 0) {
        seenByConvRef.current[conv.id] = last.id;
        continue;
      }
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

/** Unread AI invites older than this still show in the bell but skip a toast (avoids spamming stale rows). */
const AI_EVENT_INVITE_TOAST_MAX_AGE_MS = 24 * 60 * 60 * 1000;

type NotificationsListRow = {
  id: string;
  type?: string;
  title?: string;
  message?: string;
  read?: boolean | null;
  createdAt?: Date | string | null;
};

/** Subscribes to notification SSE app-wide so pushes (e.g. AI event invites) refresh the bell and show a toast. */
function GlobalNotificationToaster() {
  const { toast } = useToast();
  const seenIdsRef = useRef<Set<string>>(new Set());
  const { userId } = useCurrentUser();

  const { data: notifications } = useQuery<NotificationsListRow[]>({
    queryKey: ["/api/users", userId, "notifications"],
    enabled: !!userId,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  // Toasts for invitees when SSE missed (tab closed / disconnected): surface from fetched list once per id.
  useEffect(() => {
    if (!userId || !notifications || !Array.isArray(notifications)) return;
    const now = Date.now();
    for (const n of notifications) {
      if (String(n.type) !== "ai_event_invite" || !n.id) continue;
      if (n.read) continue;
      const id = String(n.id);
      if (seenIdsRef.current.has(id)) continue;
      const age = now - notificationCreatedAtMs(n.createdAt);
      if (age > AI_EVENT_INVITE_TOAST_MAX_AGE_MS) {
        seenIdsRef.current.add(id);
        continue;
      }
      seenIdsRef.current.add(id);
      if (seenIdsRef.current.size > 400) seenIdsRef.current.clear();
      const title = String(n.title || "").trim() || "You're invited to an event";
      const message = String(n.message || "").trim();
      toast({ title, description: message || undefined, duration: 8000 });
    }
  }, [notifications, userId, toast]);

  useEffect(() => {
    if (!userId) return;
    const url = getNotificationsStreamUrl(userId);
    const es = new EventSource(url);

    const invalidateNotifs = () => {
      void queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "notifications"] });
    };

    es.onopen = () => {
      invalidateNotifs();
    };

    es.onmessage = (ev) => {
      try {
        const raw = ev.data;
        if (!raw) return;
        const payload = JSON.parse(raw) as Record<string, unknown>;
        if (!payload || typeof payload !== "object") return;

        if (isNotificationsStreamSyncPayload(payload)) {
          invalidateNotifs();
          return;
        }

        if (raw === "{}") return;

        invalidateNotifs();

        const id = payload.id != null ? String(payload.id) : "";
        const type = payload.type != null ? String(payload.type) : "";
        const title = String(payload.title || "").trim();
        const message = String(payload.message || "").trim();
        if (!title) return;

        // Message toasts are handled by GlobalMessageToaster (conversation polling).
        if (type === "message") return;

        if (id) {
          if (seenIdsRef.current.has(id)) return;
          seenIdsRef.current.add(id);
          if (seenIdsRef.current.size > 300) seenIdsRef.current.clear();
        }

        toast({ title, description: message || undefined, duration: type === "ai_event_invite" ? 8000 : 5000 });
      } catch {
        invalidateNotifs();
      }
    };

    es.onerror = () => {
      /* browser reconnects */
    };

    return () => es.close();
  }, [userId, toast]);

  return null;
}

const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <LoadingState message="Loading..." showMascot={true} />
  </div>
);

/** Wraps the app with persisted React Query cache (posts feed survives full page refresh). */
function QueryPersistProvider({ children }: { children: React.ReactNode }) {
  const { userId } = useCurrentUser();
  const persistOptions = useMemo(() => getPostsPersistOptions(userId), [userId]);
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
      {children}
    </PersistQueryClientProvider>
  );
}

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
  reconcileCurrentUserIdWithJwt();
  const authToken = localStorage.getItem("authToken");
  if (!authToken) return { isAuthenticated: false, showOnboarding: false, userId: null as string | null };
  let isAdmin = localStorage.getItem("isAdmin") === "true";
  const onboardingFlag = localStorage.getItem("onboardingCompleted") === "true";
  const jwtSub = readJwtSub(authToken);
  let userId: string | null = jwtSub;
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
  let userOnboarded = onboardingFlag || isAdmin;
  try {
    const raw = localStorage.getItem("currentUser");
    if (raw) {
      const u = JSON.parse(raw);
      // PATCH /api/users/:id requires URL id === JWT sub; prefer sub over possibly stale currentUser.id.
      userId = jwtSub || u.id || u.userId || null;
      if (u.isAdmin === true) {
        isAdmin = true;
        localStorage.setItem("isAdmin", "true");
        userOnboarded = true;
        localStorage.setItem("onboardingCompleted", "true");
      }
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

  // Re-check on route change, same-tab auth (matchify-auth-changed), and cross-tab storage updates
  useEffect(() => {
    const sync = () => {
      const s = readAuthState();
      setIsAuthenticated(s.isAuthenticated);
      setShowOnboarding(s.showOnboarding);
      setUserId(s.userId);
    };
    sync();
    window.addEventListener('storage', sync);
    window.addEventListener('matchify-auth-changed', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('matchify-auth-changed', sync);
    };
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
        if (user.isAdmin === true) {
          localStorage.setItem("isAdmin", "true");
          localStorage.setItem("onboardingCompleted", "true");
          try {
            const raw = localStorage.getItem("currentUser");
            const cur = raw ? JSON.parse(raw) : {};
            localStorage.setItem(
              "currentUser",
              JSON.stringify({ ...cur, ...user, onboardingCompleted: true }),
            );
          } catch {
            /* ignore */
          }
          setShowOnboarding(false);
          return;
        }
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

    let dirtyTimer: ReturnType<typeof setTimeout> | undefined;
    const onClientStateDirty = () => {
      window.clearTimeout(dirtyTimer);
      dirtyTimer = window.setTimeout(() => {
        void pushClientStateToBackend(userId);
      }, 450);
    };
    window.addEventListener("matchify-client-state-dirty", onClientStateDirty);

    const onUnload = () => {
      void pushClientStateToBackend(userId);
    };
    window.addEventListener("beforeunload", onUnload);

    return () => {
      cancelled = true;
      window.clearInterval(pushInterval);
      window.clearTimeout(dirtyTimer);
      window.removeEventListener("matchify-client-state-dirty", onClientStateDirty);
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
      <GlobalNotificationToaster />
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
            <Route path="/chat-requests" component={ChatRequestsPage} />
            <Route path="/profile/social/edit" component={SocialEditProfile} />
            <Route path="/profile/social" component={SocialSelfProfile} />
            <Route path="/profile/social/user/:id" component={SocialUserProfile} />
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
            <Route path="/luna">
              <Redirect to="/relationship-coaching" />
            </Route>
            <Route path="/settings/social/connections" component={SocialConnectionsPage} />
            <Route path="/settings/social" component={SettingsSocial} />
            <Route path="/support" component={Support} />
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
            <Route path="/admin/venues" component={AdminVenues} />
            <Route path="/admin/groups" component={AdminGroups} />
            <Route path="/admin/courses" component={AdminCourses} />
            <Route path="/admin/coaches" component={AdminCoaches} />
            <Route path="/admin/messages" component={AdminMessages} />
            <Route path="/admin/notifications" component={AdminNotifications} />
            <Route path="/admin/onboarding-questionnaire">
              <Redirect to="/admin/questions" />
            </Route>
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
      <UserProvider>
        <QueryPersistProvider>
          <UpgradeProvider>
            <TooltipProvider>
              <Toaster />
              <AppContent />
            </TooltipProvider>
          </UpgradeProvider>
        </QueryPersistProvider>
      </UserProvider>
    </ErrorBoundary>
  );
}

export default App;
