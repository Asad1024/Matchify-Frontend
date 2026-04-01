import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiGoogle, SiApple } from "react-icons/si";
import { ArrowLeft, Heart, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { MATCHIFY_LOGO_URL } from "@/lib/matchifyBranding";
import { buildApiUrl } from "@/services/api";
import { notifyHeaderUserUpdated } from "@/components/common/Header";

export type GoogleSignupPrefill = {
  code: string;
  email: string;
  name: string;
  picture: string | null;
};

interface AuthScreenProps {
  onAuth?: (user: any, isNewUser: boolean) => void;
  defaultMode?: 'login' | 'signup';
  showBackToLanding?: boolean;
  onAdminLogin?: () => void;
  onEventAdminLogin?: () => void;
  /** After Google OAuth for a new user: prefill email/name and require password (POST /api/auth/register-google). */
  googleSignupPrefill?: GoogleSignupPrefill | null;
}

export default function AuthScreen({
  onAuth,
  defaultMode = 'login',
  showBackToLanding = false,
  onAdminLogin,
  onEventAdminLogin,
  googleSignupPrefill = null,
}: AuthScreenProps) {
  const [isSignUp, setIsSignUp] = useState(defaultMode === 'signup');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!googleSignupPrefill) return;
    setIsSignUp(true);
    setEmail(googleSignupPrefill.email);
    setName(googleSignupPrefill.name || "");
  }, [googleSignupPrefill]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (googleSignupPrefill?.code && isSignUp) {
        const response = await fetch(buildApiUrl("/api/auth/register-google"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            code: googleSignupPrefill.code,
            password,
            name: name.trim() || googleSignupPrefill.name,
          }),
        });
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error((err as { message?: string }).message || "Could not create account");
        }
        const user = await response.json();
        if (user.token) localStorage.setItem("authToken", user.token);
        if (user.id || user.userId) {
          localStorage.setItem("currentUser", JSON.stringify(user));
          notifyHeaderUserUpdated();
          window.dispatchEvent(new Event("matchify-auth-changed"));
          localStorage.removeItem("onboardingCompleted");
        }
        onAuth?.(user, true);
        return;
      }

      const endpoint = isSignUp ? '/api/auth/register' : '/api/auth/login';
      const body = isSignUp
        ? { email, password, name, username: email.split('@')[0] }
        : { email, password };
      const response = await fetch(buildApiUrl(endpoint), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Authentication failed');
      }
      const user = await response.json();
      if (user.token) localStorage.setItem("authToken", user.token);
      if (user.id || user.userId) {
        localStorage.setItem("currentUser", JSON.stringify(user));
        notifyHeaderUserUpdated();
        window.dispatchEvent(new Event("matchify-auth-changed"));
        if (user.onboardingCompleted === true) localStorage.setItem("onboardingCompleted", "true");
        else if (user.onboardingCompleted === false) localStorage.removeItem("onboardingCompleted");
      }
      onAuth?.(user, isSignUp);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Authentication failed", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    try {
      try {
        const response = await fetch(buildApiUrl('/api/auth/login'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: "demo@matchify.com", password: "demo123" }),
          credentials: 'include',
        });
        if (response.ok) {
          const user = await response.json();
          localStorage.setItem("authToken", user.token || "demo-token");
          localStorage.setItem("currentUser", JSON.stringify(user));
          notifyHeaderUserUpdated();
          window.dispatchEvent(new Event("matchify-auth-changed"));
          onAuth?.(user, false);
          setIsLoading(false);
          return;
        }
      } catch (e) { /* Backend not available */ }
      const demoUser = {
        id: "demo-user-id",
        userId: "demo-user-id",
        email: "demo@matchify.com",
        name: "John Doe",
        username: "johndoe",
        age: 28,
        location: "Dubai, UAE",
        bio: "Looking for a meaningful connection based on shared values.",
        membershipTier: "premium",
        onboardingCompleted: true,
        token: "demo-token-" + Date.now(),
      };
      await new Promise(resolve => setTimeout(resolve, 500));
      localStorage.setItem("onboardingCompleted", "true");
      toast({ title: "Welcome back, John!", description: "You're now signed in." });
      onAuth?.(demoUser, false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Demo login failed", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    setIsLoading(true);
    try {
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: "admin@matchify.com", password: "admin123" }),
        });
        if (response.ok) {
          const user = await response.json();
          localStorage.setItem("authToken", user.token || "admin-token");
          localStorage.setItem("currentUser", JSON.stringify({ ...user, isAdmin: true }));
          localStorage.setItem("onboardingCompleted", "true");
          localStorage.setItem("isAdmin", "true");
          if (onAdminLogin) onAdminLogin(); else window.location.href = "/admin";
          setIsLoading(false);
          return;
        }
      } catch (e) { /* Backend not available */ }
      const adminUser = {
        id: "admin-user-id",
        userId: "admin-user-id",
        email: "admin@matchify.com",
        name: "Admin User",
        username: "admin",
        isAdmin: true,
        onboardingCompleted: true,
        token: "admin-token-" + Date.now(),
      };
      await new Promise(resolve => setTimeout(resolve, 500));
      localStorage.setItem("authToken", adminUser.token);
      localStorage.setItem("currentUser", JSON.stringify(adminUser));
      localStorage.setItem("onboardingCompleted", "true");
      localStorage.setItem("isAdmin", "true");
      toast({ title: "Admin Login Successful", description: "Welcome to the Admin Dashboard!" });
      if (onAdminLogin) onAdminLogin(); else window.location.href = "/admin";
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Admin login failed", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Back button */}
      {showBackToLanding && (
        <button
          onClick={() => window.location.href = "/"}
          className="absolute top-4 left-4 z-20 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
      )}

      {/* Logo / Brand header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center pt-14 pb-6 px-6"
      >
        <div className="mb-2">
          <img
            src={MATCHIFY_LOGO_URL}
            alt=""
            className="h-24 w-24 sm:h-28 sm:w-28 object-contain mx-auto"
          />
        </div>
        <h1 className="text-2xl font-bold text-foreground font-display">
          {isSignUp ? 'Create Account' : 'Welcome back'}
        </h1>
        <p className="text-sm text-gray-500 mt-1 text-center">
          {isSignUp
            ? 'Join thousands finding meaningful connections'
            : 'Sign in to continue'}
        </p>
      </motion.div>

      {/* Form area */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="flex-1 px-6 pb-8 max-w-md mx-auto w-full"
      >
        {/* Social login — skip while finishing Google signup (password step). */}
        {!googleSignupPrefill ? (
        <div className="grid grid-cols-2 gap-3 mb-5">
          <button
            type="button"
            onClick={() => {
              window.location.href = buildApiUrl("/api/auth/google/start");
            }}
            className="flex items-center justify-center gap-2 h-12 rounded-2xl border border-gray-200 bg-white text-gray-700 font-semibold text-sm hover:bg-gray-50 active:scale-[0.98] transition-all"
            data-testid="button-auth-google"
          >
            <SiGoogle className="w-4 h-4 text-[#4285F4]" />
            Google
          </button>
          <button
            type="button"
            onClick={() => toast({ title: "Coming Soon", description: "Apple login will be available soon" })}
            className="flex items-center justify-center gap-2 h-12 rounded-2xl border border-gray-200 bg-white text-gray-700 font-semibold text-sm hover:bg-gray-50 active:scale-[0.98] transition-all"
            data-testid="button-auth-apple"
          >
            <SiApple className="w-4 h-4 text-gray-800" />
            Apple
          </button>
        </div>
        ) : (
          <div className="mb-5 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-gray-800">
            <p className="font-semibold text-primary">Almost there</p>
            <p className="text-gray-600 mt-1">
              We pulled your name and email from Google. Choose a password to secure your Matchify account.
            </p>
          </div>
        )}

        {/* Divider */}
        {!googleSignupPrefill ? (
        <div className="relative mb-5">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-100" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-3 text-xs text-gray-400 uppercase tracking-widest font-medium">
              or with email
            </span>
          </div>
        </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence>
            {isSignUp && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-1.5 overflow-hidden"
              >
                <label htmlFor="name" className="text-sm font-semibold text-gray-700">Full Name</label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={isSignUp}
                  className="h-12 rounded-2xl border-gray-200 focus:border-primary bg-gray-50/60 focus:bg-white transition-colors text-[15px]"
                  data-testid="input-name"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-semibold text-gray-700">Email Address</label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              readOnly={!!googleSignupPrefill}
              className="h-12 rounded-2xl border-gray-200 focus:border-primary bg-gray-50/60 focus:bg-white transition-colors text-[15px]"
              data-testid="input-email"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-semibold text-gray-700">Password</label>
              {!isSignUp && (
                <a href="/reset-password" className="text-xs text-primary font-semibold hover:underline">
                  Forgot password?
                </a>
              )}
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 rounded-2xl border-gray-200 focus:border-primary bg-gray-50/60 focus:bg-white transition-colors text-[15px] pr-12"
                data-testid="input-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-13 rounded-2xl bg-primary text-white font-bold text-[15px] shadow-lg shadow-primary/25 hover:bg-primary/90 active:scale-[0.98] transition-all mt-1"
            data-testid="button-auth-submit"
          >
            {isLoading
              ? "Please wait..."
              : googleSignupPrefill && isSignUp
                ? "Create account & continue"
                : isSignUp
                  ? "Create Account"
                  : "Sign In"}
          </Button>
        </form>

        {/* Toggle mode */}
        {!googleSignupPrefill ? (
        <div className="text-center mt-5">
          <span className="text-sm text-gray-500">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          </span>{' '}
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm font-bold text-primary hover:underline"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </div>
        ) : null}

        {/* Quick Access */}
        {!googleSignupPrefill ? (
        <div className="mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
          <p className="text-xs text-gray-400 text-center mb-3 font-semibold uppercase tracking-widest">
            Quick Access
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDemoLogin}
              disabled={isLoading}
              className="h-10 rounded-xl text-xs font-semibold border-gray-200 hover:border-primary/30 hover:text-primary"
              data-testid="button-demo-login"
            >
              Demo User
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAdminLogin}
              disabled={isLoading}
              className="h-10 rounded-xl text-xs font-semibold border-gray-200 hover:border-primary/30 hover:text-primary"
              data-testid="button-admin-login"
            >
              Admin
            </Button>
          </div>
        </div>
        ) : null}
      </motion.div>
    </div>
  );
}
