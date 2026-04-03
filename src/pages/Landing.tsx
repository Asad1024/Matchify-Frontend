import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import SplashScreen from "@/components/auth/SplashScreen";
import AuthScreen from "@/components/auth/AuthScreen";
import OnboardingWizard from "@/components/auth/OnboardingWizard";

type LandingStep = "splash" | "auth" | "onboarding";

export default function Landing() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<LandingStep>("splash");
  const [userId, setUserId] = useState<string | null>(null);
  const [userData, setUserData] = useState<{ name?: string; email?: string } | null>(null);

  // Check if user is already authenticated
  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    const storedUser = localStorage.getItem("currentUser");
    const onboardingCompleted = localStorage.getItem("onboardingCompleted");

    if (authToken && storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setUserId(user.id || user.userId);
        setUserData({ name: user.name, email: user.email });

        if (user.isAdmin === true) {
          localStorage.setItem("isAdmin", "true");
          localStorage.setItem("onboardingCompleted", "true");
          setLocation("/admin");
          return;
        }

        if (onboardingCompleted === "true") {
          // User is authenticated and onboarded - go to app
          setLocation("/");
        } else {
          // User is authenticated but needs onboarding
          setStep("onboarding");
        }
      } catch (e) {
        // Invalid stored data, start fresh
        setStep("splash");
      }
    }
  }, [setLocation]);

  const handleGetStarted = () => {
    setStep("auth");
  };

  const handleLogin = () => {
    setLocation("/login");
  };

  const handleAuth = (user: any, isNewUser: boolean) => {
    const userIdValue = user.id || user.userId || `user-${Date.now()}`;
    setUserId(userIdValue);
    setUserData({ name: user.name, email: user.email });

    // Store auth state
    localStorage.setItem("authToken", user.token || "demo-token");
    localStorage.setItem("currentUser", JSON.stringify({ ...user, id: userIdValue }));

    if (user.isAdmin === true) {
      localStorage.setItem("isAdmin", "true");
      localStorage.setItem("onboardingCompleted", "true");
      setLocation("/admin");
      return;
    }
    localStorage.removeItem("isAdmin");

    if (isNewUser) {
      // New user - show onboarding
      localStorage.removeItem("onboardingCompleted");
      setStep("onboarding");
    } else {
      // Existing user - check if profile is complete
      if (user.onboardingCompleted) {
        localStorage.setItem("onboardingCompleted", "true");
        setLocation("/");
      } else {
        setStep("onboarding");
      }
    }
  };

  const handleOnboardingComplete = () => {
    localStorage.setItem("onboardingCompleted", "true");
    setLocation("/");
  };

  const handleOnboardingClose = () => {
    // Clear auth state and go back to login
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("onboardingCompleted");
    setStep("auth");
  };

  if (step === "splash") {
    return <SplashScreen onGetStarted={handleGetStarted} onLogin={handleLogin} />;
  }

  if (step === "auth") {
    return (
      <AuthScreen
        onAuth={handleAuth}
        defaultMode="signup"
      />
    );
  }

  if (step === "onboarding" && userId) {
    return (
      <OnboardingWizard
        userId={userId}
        initialData={userData || undefined}
        onComplete={handleOnboardingComplete}
        onClose={handleOnboardingClose}
      />
    );
  }

  // Fallback to splash if something goes wrong
  return <SplashScreen onGetStarted={handleGetStarted} />;
}

