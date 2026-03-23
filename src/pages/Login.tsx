import { useEffect } from "react";
import { useLocation } from "wouter";
import AuthScreen from "@/components/auth/AuthScreen";
import { useCurrentUser } from "@/contexts/UserContext";

export default function Login() {
  const [, setLocation] = useLocation();
  const { userId } = useCurrentUser();

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
    const userIdValue = user.id || user.userId || `user-${Date.now()}`;
    
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
    
    const userToStore = {
      ...user,
      id: userIdValue,
      onboardingCompleted: finalOnboardingStatus,
    };
    localStorage.setItem("currentUser", JSON.stringify(userToStore));

    if (isNewUser) {
      // New user - go to onboarding
      localStorage.removeItem("onboardingCompleted");
      setLocation("/");
    } else {
      // Existing user - check if profile is complete
      // Backend value is most reliable, but if it's false/undefined and we have
      // evidence it was completed, preserve that status
      const hasCompletedOnboarding = finalOnboardingStatus === true;
      
      if (hasCompletedOnboarding) {
        // Sync the flag with user object status
        localStorage.setItem("onboardingCompleted", "true");
        setLocation("/");
      } else {
        // User needs onboarding - clear the flag to ensure onboarding shows
        localStorage.removeItem("onboardingCompleted");
        setLocation("/");
      }
    }
  };

  const handleAdminLogin = () => {
    setLocation("/admin/login");
  };

  const handleEventAdminLogin = () => {
    setLocation("/admin/login?redirect=/admin/events");
  };

  return (
    <AuthScreen 
      onAuth={handleAuth} 
      defaultMode="login" 
      showBackToLanding={true}
      onAdminLogin={handleAdminLogin}
      onEventAdminLogin={handleEventAdminLogin}
    />
  );
}

