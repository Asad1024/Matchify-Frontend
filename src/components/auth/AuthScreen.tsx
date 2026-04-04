import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { BrandLogo } from "@/components/common/BrandLogo";
import { buildApiUrl } from "@/services/api";
import { startGoogleOAuth } from "@/lib/googleOAuthPopup";
import { notifyHeaderUserUpdated } from "@/components/common/Header";
import { queryClient } from "@/lib/queryClient";
import { readJwtSub } from "@/lib/authUserIdReconcile";
import { resolveUserDisplayAvatarUrl } from "@/lib/userDisplayAvatar";

export type GoogleSignupPrefill = {
  code: string;
  email: string;
  name: string;
  picture: string | null;
};

interface AuthScreenProps {
  onAuth?: (user: any, isNewUser: boolean) => void;
  defaultMode?: 'login' | 'signup';
  /** After Google OAuth for a new user: prefill email/name and require password (POST /api/auth/register-google). */
  googleSignupPrefill?: GoogleSignupPrefill | null;
}

/** Official multicolor Google "G" (brand colors), not a single-color icon font. */
function GoogleLogoMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

/** Inputs aligned with splash hero: white fields, wine focus ring */
const AUTH_INPUT_CLASS =
  "h-12 rounded-2xl border border-zinc-200 bg-white pl-11 pr-3 text-[15px] text-zinc-900 shadow-sm transition-[box-shadow,border-color] placeholder:text-primary/45 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25 focus-visible:ring-offset-0 md:text-[15px]";

export default function AuthScreen({
  onAuth,
  defaultMode = 'login',
  googleSignupPrefill = null,
}: AuthScreenProps) {
  const [isSignUp, setIsSignUp] = useState(defaultMode === 'signup');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!googleSignupPrefill) return;
    setIsSignUp(true);
    setEmail(googleSignupPrefill.email);
    setName(googleSignupPrefill.name || "");
    setPassword("");
    setConfirmPassword("");
  }, [googleSignupPrefill]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp && password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }
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
        const av = resolveUserDisplayAvatarUrl(user);
        const userNorm = av ? { ...user, avatar: av } : user;
        if (userNorm.token) localStorage.setItem("authToken", userNorm.token);
        if (userNorm.id || userNorm.userId) {
          if (userNorm.isAdmin === true) {
            localStorage.setItem("isAdmin", "true");
            localStorage.setItem("onboardingCompleted", "true");
          } else {
            localStorage.removeItem("isAdmin");
            localStorage.removeItem("onboardingCompleted");
          }
          localStorage.setItem("currentUser", JSON.stringify(userNorm));
          notifyHeaderUserUpdated();
          window.dispatchEvent(new Event("matchify-auth-changed"));
        }
        const uid =
          (typeof userNorm.token === "string" ? readJwtSub(userNorm.token) : null) ||
          userNorm.id ||
          userNorm.userId;
        if (uid) void queryClient.invalidateQueries({ queryKey: [`/api/users/${uid}`] });
        onAuth?.(userNorm, true);
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
      const av = resolveUserDisplayAvatarUrl(user);
      const userNorm = av ? { ...user, avatar: av } : user;
      if (userNorm.token) localStorage.setItem("authToken", userNorm.token);
      if (userNorm.id || userNorm.userId) {
        if (userNorm.isAdmin === true) {
          localStorage.setItem("isAdmin", "true");
          localStorage.setItem("onboardingCompleted", "true");
        } else {
          localStorage.removeItem("isAdmin");
          if (userNorm.onboardingCompleted === true) localStorage.setItem("onboardingCompleted", "true");
          else if (userNorm.onboardingCompleted === false) localStorage.removeItem("onboardingCompleted");
        }
        localStorage.setItem("currentUser", JSON.stringify(userNorm));
        notifyHeaderUserUpdated();
        window.dispatchEvent(new Event("matchify-auth-changed"));
      }
      const uid =
        (typeof userNorm.token === "string" ? readJwtSub(userNorm.token) : null) ||
        userNorm.id ||
        userNorm.userId;
      if (uid) void queryClient.invalidateQueries({ queryKey: [`/api/users/${uid}`] });
      onAuth?.(userNorm, isSignUp);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Authentication failed", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-[100dvh] justify-center overflow-hidden bg-white text-primary">
      {/* Soft wine-tinted glows (same language as splash hero phone area) */}
      <div
        className="pointer-events-none absolute right-0 top-[18%] h-[min(72vw,280px)] w-[min(72vw,280px)] translate-x-1/4 rounded-full bg-primary/10 blur-[100px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-[12%] left-0 h-[min(65vw,260px)] w-[min(65vw,260px)] -translate-x-1/4 rounded-full bg-primary/8 blur-[90px]"
        aria-hidden
      />

      <div className="relative z-10 flex h-[100dvh] w-full max-w-[390px] flex-col overflow-hidden">
        <div className="safe-bottom flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain">
          {/* Logo / Brand header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center px-6 pt-8 pb-5"
          >
            <div className="mb-5 flex justify-center">
              <BrandLogo
                className="mx-auto h-[4.5rem] w-auto max-w-[14rem] object-contain sm:h-[5rem] sm:max-w-[15rem]"
                alt="Matchify"
              />
            </div>
            <h1 className="text-center font-display text-2xl font-bold tracking-tight text-primary">
              {isSignUp ? "Create Account" : "Welcome back"}
            </h1>
            <p className="mt-2 text-center text-sm font-light leading-snug text-primary/80">
              {isSignUp
                ? "Join thousands finding meaningful connections"
                : "Sign in to continue"}
            </p>
          </motion.div>

          {/* Form area */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="w-full flex-1 px-6 pb-12"
          >
            {/* Social login — skip while finishing Google signup (password step). */}
            {!googleSignupPrefill ? (
              <button
                type="button"
                onClick={() => {
                  startGoogleOAuth(buildApiUrl("/api/auth/google/start"));
                }}
                className="mb-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 active:scale-[0.98]"
                data-testid="button-auth-google"
              >
                <GoogleLogoMark className="h-[18px] w-[18px] shrink-0" />
                Continue with Google
              </button>
            ) : null}

            {/* Divider */}
            {!googleSignupPrefill ? (
              <div className="relative mb-5">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-zinc-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-xs font-semibold uppercase tracking-widest text-primary/70">
                    OR WITH EMAIL
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
                    <label htmlFor="name" className="text-sm font-semibold text-primary">
                      Full Name
                    </label>
                    <div className="relative">
                      <User
                        className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-primary/55"
                        aria-hidden
                      />
                      <Input
                        id="name"
                        type="text"
                        placeholder="Your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required={isSignUp}
                        className={AUTH_INPUT_CLASS}
                        data-testid="input-name"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-semibold text-primary">
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-primary/55"
                    aria-hidden
                  />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    readOnly={!!googleSignupPrefill}
                    className={AUTH_INPUT_CLASS}
                    data-testid="input-email"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="password" className="text-sm font-semibold text-primary">
                    Password
                  </label>
                  {!isSignUp && (
                    <a
                      href="/reset-password"
                      className="text-xs font-semibold text-primary no-underline hover:underline"
                    >
                      Forgot password?
                    </a>
                  )}
                </div>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-primary/55"
                    aria-hidden
                  />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className={`${AUTH_INPUT_CLASS} pr-12`}
                    data-testid="input-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/55 transition-colors hover:text-primary"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {isSignUp ? (
                <div className="space-y-1.5">
                  <label htmlFor="confirmPassword" className="text-sm font-semibold text-primary">
                    Confirm password
                  </label>
                  <div className="relative">
                    <Lock
                      className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-primary/55"
                      aria-hidden
                    />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required={isSignUp}
                      className={`${AUTH_INPUT_CLASS} pr-12`}
                      data-testid="input-confirm-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/55 transition-colors hover:text-primary"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              ) : null}

              <Button
                type="submit"
                disabled={isLoading}
                className="no-default-hover-elevate no-default-active-elevate mt-1 h-12 w-full rounded-full border-0 bg-primary text-[15px] font-bold text-primary-foreground shadow-xl shadow-primary/30 transition-colors hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50"
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
              <div className="mt-6 text-center">
                <div>
                  <span className="text-sm text-primary/80">
                    {isSignUp ? "Already have an account?" : "Don't have an account?"}
                  </span>{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      setConfirmPassword("");
                    }}
                    className="text-sm font-bold text-primary hover:underline"
                  >
                    {isSignUp ? "Sign In" : "Sign Up"}
                  </button>
                </div>
              </div>
            ) : null}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
