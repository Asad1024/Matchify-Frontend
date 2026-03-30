import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { buildApiUrl } from "@/services/api";

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [requestEmail, setRequestEmail] = useState("");
  const [requestSent, setRequestSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    if (urlToken) {
      setToken(urlToken);
    }
  }, []);

  const handleRequestLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!requestEmail.trim()) {
      setError("Enter your email");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(buildApiUrl("/api/auth/request-password-reset"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: requestEmail.trim().toLowerCase() }),
        credentials: "include",
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((j as { message?: string }).message || "Request failed");
      setRequestSent(true);
      toast({
        title: "Check server logs",
        description:
          "If the account exists, a reset link was printed in the API console (email delivery not configured).",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Request failed";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    
    if (!token) {
      setError("Reset token is missing");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const fullUrl = buildApiUrl('/api/auth/reset-password');
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorData;
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
        } else {
          const errorText = await response.text();
          errorData = { message: errorText || 'Password reset failed' };
        }
        throw new Error(errorData.message || 'Password reset failed');
      }
      
      setSuccess(true);
      toast({
        title: "Password Reset Successful",
        description: "Your password has been reset. You can now login with your new password.",
      });
      
      setTimeout(() => {
        setLocation("/login");
      }, 2000);
    } catch (error: any) {
      setError(error.message || "Failed to reset password");
      toast({
        title: "Reset Failed",
        description: error.message || "Unable to reset password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-3 bg-primary/10 rounded-full">
                <CheckCircle2 className="w-12 h-12 text-primary" />
              </div>
            </div>
            <h2 className="text-2xl font-bold">Password Reset Successful!</h2>
            <p className="text-muted-foreground">
              Your password has been reset. Redirecting to login...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Lock className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Reset Password</CardTitle>
          <CardDescription className="text-center">
            Enter your new password
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!token && (
            <form onSubmit={handleRequestLink} className="space-y-3 p-4 rounded-xl border bg-muted/30">
              <p className="text-sm font-medium">Request a reset link</p>
              <p className="text-xs text-muted-foreground">
                We&apos;ll log the link in the API server console until email is configured.
              </p>
              <div className="space-y-2">
                <Label htmlFor="req-email">Email</Label>
                <Input
                  id="req-email"
                  type="email"
                  value={requestEmail}
                  onChange={(e) => setRequestEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={isLoading || requestSent}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading || requestSent}>
                {requestSent ? "Request recorded" : "Send reset link"}
              </Button>
            </form>
          )}

          <form onSubmit={handleReset} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!token && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Or open the reset link from the server log if you already requested one.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter new password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading || !token}
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading || !token}
                minLength={6}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !token || !password || !confirmPassword}
            >
              {isLoading ? "Resetting..." : "Reset Password"}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="ghost"
                className="p-0 h-auto text-sm"
                onClick={() => setLocation("/login")}
              >
                Back to Login
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

