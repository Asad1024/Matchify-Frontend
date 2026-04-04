import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import AuthScreen, { type GoogleSignupPrefill } from "@/components/auth/AuthScreen";
import { readJwtSub } from "@/lib/authUserIdReconcile";
import { buildApiUrl } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { closeOAuthPopupAndNavigate } from "@/lib/googleOAuthPopup";
import { queryClient } from "@/lib/queryClient";
import { resolveUserDisplayAvatarUrl } from "@/lib/userDisplayAvatar";

export default function Signup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [googlePrefill, setGooglePrefill] = useState<GoogleSignupPrefill | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gcode = params.get("gcode");
    if (!gcode) return;
    void (async () => {
      try {
        const res = await fetch(
          buildApiUrl(`/api/auth/google/signup-prefill?code=${encodeURIComponent(gcode)}`),
          { credentials: "include" },
        );
        const j = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast({
            title: "Google signup expired",
            description: (j as { message?: string }).message || "Start again with Google.",
            variant: "destructive",
          });
          return;
        }
        setGooglePrefill({
          code: gcode,
          email: String((j as { email?: string }).email || ""),
          name: String((j as { name?: string }).name || ""),
          picture: (j as { picture?: string | null }).picture ?? null,
        });
        const url = new URL(window.location.href);
        url.searchParams.delete("gcode");
        window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
      } catch {
        toast({
          title: "Could not load Google signup",
          description: "Try Google again from the signup page.",
          variant: "destructive",
        });
      }
    })();
  }, [toast]);

  // Redirect if already authenticated
  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    const onboardingCompleted = localStorage.getItem("onboardingCompleted");
    const isAdmin = localStorage.getItem("isAdmin");
    
    if (authToken && onboardingCompleted === "true") {
      if (isAdmin === "true") {
        setLocation("/admin");
      } else {
        setLocation("/");
      }
    }
  }, [setLocation]);

  const handleAuth = (user: any, isNewUser: boolean) => {
    const tok = typeof user.token === "string" ? user.token : "";
    const userIdValue =
      (tok ? readJwtSub(tok) : null) || user.id || user.userId || `user-${Date.now()}`;

    const go = (path: string) => {
      if (closeOAuthPopupAndNavigate(path)) return;
      setLocation(path);
    };

    if (user.isAdmin === true) {
      const adminStore = { ...user, id: userIdValue, onboardingCompleted: true };
      const av0 = resolveUserDisplayAvatarUrl(adminStore);
      const adminNorm = av0 ? { ...adminStore, avatar: av0 } : adminStore;
      localStorage.setItem("authToken", user.token || "demo-token");
      localStorage.setItem("isAdmin", "true");
      localStorage.setItem("onboardingCompleted", "true");
      localStorage.setItem("currentUser", JSON.stringify(adminNorm));
      const aid = String(userIdValue).trim();
      if (aid) {
        const { token: _t, ...pub } = adminNorm as Record<string, unknown>;
        queryClient.setQueryData([`/api/users/${aid}`], { ...pub, id: aid, userId: aid });
      }
      window.dispatchEvent(new Event("matchify-auth-changed"));
      go("/admin");
      return;
    }
    localStorage.removeItem("isAdmin");

    // Check if user previously completed onboarding (from localStorage)
    // Check both the stored user object and the separate onboardingCompleted flag
    const storedUser = localStorage.getItem("currentUser");
    const storedOnboardingFlag = localStorage.getItem("onboardingCompleted");
    let previouslyCompletedOnboarding = false;
    
    if (storedOnboardingFlag === "true") {
      // If the flag is set, check if it's for the same user
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser.email === user.email) {
            previouslyCompletedOnboarding = true;
          }
        } catch (e) {
          // Invalid stored user data, but flag is set - trust the flag for same email
          previouslyCompletedOnboarding = true;
        }
      }
    } else if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Check if stored user has the same email and completed onboarding
        if (parsedUser.email === user.email && parsedUser.onboardingCompleted === true) {
          previouslyCompletedOnboarding = true;
        }
      } catch (e) {
        // Invalid stored user data
      }
    }
    
    // Store auth state
    localStorage.setItem("authToken", user.token || "demo-token");
    
    // Merge user data, preserving onboardingCompleted if it was previously completed
    // Backend value takes precedence, but if backend says false and we have evidence
    // it was completed before, preserve it (handles case where backend update failed)
    const finalOnboardingStatus = user.onboardingCompleted !== undefined 
      ? user.onboardingCompleted 
      : previouslyCompletedOnboarding;
    
    const userToStoreBase = {
      ...user,
      id: userIdValue,
      onboardingCompleted: finalOnboardingStatus,
    };
    const av = resolveUserDisplayAvatarUrl(userToStoreBase);
    const userToStore = av ? { ...userToStoreBase, avatar: av } : userToStoreBase;
    localStorage.setItem("currentUser", JSON.stringify(userToStore));
    const sid = String(userIdValue).trim();
    if (sid) {
      const { token: _t, ...pub } = userToStore as Record<string, unknown>;
      queryClient.setQueryData([`/api/users/${sid}`], { ...pub, id: sid, userId: sid });
      void queryClient.invalidateQueries({ queryKey: [`/api/users/${sid}`] });
    }

    if (isNewUser) {
      // New user - go to onboarding
      localStorage.removeItem("onboardingCompleted");
      go("/");
    } else {
      // Existing user - check if profile is complete
      // Backend value is most reliable, but if it's false/undefined and we have
      // evidence it was completed, preserve that status
      const hasCompletedOnboarding = finalOnboardingStatus === true;
      
      if (hasCompletedOnboarding) {
        // Sync the flag with user object status
        localStorage.setItem("onboardingCompleted", "true");
        go("/");
      } else {
        // User needs onboarding - clear the flag to ensure onboarding shows
        localStorage.removeItem("onboardingCompleted");
        go("/");
      }
    }
  };

  return (
    <AuthScreen
      onAuth={handleAuth}
      defaultMode="signup"
      googleSignupPrefill={googlePrefill}
    />
  );
}

