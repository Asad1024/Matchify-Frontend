import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { LoadingState } from "@/components/common/LoadingState";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { notifyHeaderUserUpdated } from "@/components/common/Header";
import { queryClient } from "@/lib/queryClient";
import { buildApiUrl } from "@/services/api";
import {
  closeOAuthPopupAndNavigate,
  MATCHIFY_GOOGLE_OAUTH_WINDOW_NAME,
} from "@/lib/googleOAuthPopup";
import { readJwtSub } from "@/lib/authUserIdReconcile";
import { resolveUserDisplayAvatarUrl } from "@/lib/userDisplayAvatar";

function seedUserQueryCache(uid: string, userData: Record<string, unknown>) {
  const { token: _t, ...pub } = userData;
  queryClient.setQueryData([`/api/users/${uid}`], { ...pub, id: uid, userId: uid });
}

export default function GoogleCallback() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userDataEncoded = params.get('user');
    const exchangeCode = params.get('code');
    const errorParam = params.get('error');

    const fail = (msg: string) => {
      setError(msg);
      setLoading(false);
    };

    if (errorParam) {
      fail(`Authentication failed: ${errorParam.replace(/_/g, ' ')}`);
      return;
    }

    const finishLogin = async (userData: Record<string, unknown>) => {
      try {
        const token = typeof userData.token === "string" ? userData.token : "";
        if (!token) {
          throw new Error("Missing token from Google login response.");
        }
        const jwtSub = readJwtSub(token);
        const uid = String(jwtSub || (userData as { id?: string }).id || (userData as { userId?: string }).userId || "").trim();
        const merged: Record<string, unknown> = {
          ...userData,
          ...(jwtSub ? { id: jwtSub, userId: jwtSub } : {}),
        };
        const av = resolveUserDisplayAvatarUrl(merged);
        if (av) merged.avatar = av;

        localStorage.setItem("authToken", token);
        localStorage.setItem("currentUser", JSON.stringify(merged));
        notifyHeaderUserUpdated();
        window.dispatchEvent(new Event("matchify-auth-changed"));

        // Seed profile cache so menu avatar shows immediately (avoid queryClient.clear() — it refetches everything and causes visible “jerks”).
        if (uid) seedUserQueryCache(uid, merged);

        // Skip App.tsx’s immediate GET /api/users verify (same data we already have) — cuts extra load + re-render after OAuth.
        try {
          sessionStorage.setItem("matchify_oauth_handoff_ts", String(Date.now()));
        } catch {
          /* ignore */
        }

        const go = (href: string, replace?: boolean) => {
          if (closeOAuthPopupAndNavigate(href)) return;
          setLocation(href, replace ? { replace: true } : undefined);
        };

        // `isNewUser` in the query string means “first-time Google signup redirect”, not onboarding status.
        // Existing users always get isNewUser=false; still respect server onboardingCompleted.
        if (userData.isAdmin) {
          localStorage.setItem("isAdmin", "true");
          localStorage.setItem("onboardingCompleted", "true");
          go("/admin", true);
        } else {
          localStorage.removeItem("isAdmin");
          if (userData.onboardingCompleted === true) {
            localStorage.setItem("onboardingCompleted", "true");
          } else {
            localStorage.removeItem("onboardingCompleted");
          }
          go("/", true);
        }
      } catch (e) {
        console.error("Failed to parse user data from Google callback:", e);
        fail("Failed to process Google login data.");
      }
    };

    const run = async () => {
      try {
        // Preferred flow (avoids long querystring truncation).
        if (exchangeCode) {
          const res = await fetch(buildApiUrl(`/api/auth/google/exchange?code=${encodeURIComponent(exchangeCode)}`), {
            method: "GET",
            credentials: "include",
          });
          if (!res.ok) {
            const t = await res.text().catch(() => "");
            throw new Error(`Could not finalize Google login (${res.status}): ${t || res.statusText}`);
          }
          const payload = (await res.json()) as Record<string, unknown>;
          await finishLogin(payload);
          // Avoid setLoading(false): that flashes the “Redirecting…” shell before unmount (visible jerk).
          return;
        }

        // Backward-compatible flow (older backend): `?user=...`
        if (userDataEncoded) {
          const payload = JSON.parse(decodeURIComponent(userDataEncoded)) as Record<string, unknown>;
          await finishLogin(payload);
          return;
        }

        fail("No user data received from Google login.");
      } catch (e: any) {
        console.error(e);
        fail(e?.message || "Failed to complete Google login.");
      }
    };

    void run();
  }, [setLocation]);

  const shellClass =
    "flex h-[100dvh] w-full max-w-lg flex-col overflow-hidden bg-background";

  const leaveToLogin = () => {
    if (window.name === MATCHIFY_GOOGLE_OAUTH_WINDOW_NAME) {
      window.close();
      return;
    }
    setLocation("/login");
  };

  const backBar = (
    <div className="flex shrink-0 items-center gap-1 border-b border-border/60 px-2 py-1.5">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-10 w-10 shrink-0 rounded-full text-foreground/80 hover:bg-muted"
        onClick={leaveToLogin}
        aria-label="Back to login"
      >
        <ArrowLeft className="h-5 w-5" strokeWidth={2} />
      </Button>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex justify-center bg-background">
        <div className={shellClass}>
          {backBar}
          <div className="safe-bottom flex min-h-0 flex-1 flex-col items-center justify-center px-6">
            <LoadingState message="Completing Google Login..." showMascot={true} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex justify-center bg-background">
      <div className={shellClass}>
        {backBar}
        <div className="safe-bottom flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain px-6 py-6">
          <div className="mx-auto w-full max-w-md space-y-4 text-center">
            {error ? (
              <>
                <Alert variant="destructive" className="text-left">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
                <Button onClick={leaveToLogin}>Back to Login</Button>
              </>
            ) : (
              <p className="text-muted-foreground">Redirecting...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

