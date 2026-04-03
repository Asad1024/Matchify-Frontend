import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertCircle, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { buildApiUrl } from "@/services/api";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();
  
  // Check for redirect parameter
  const searchParams = new URLSearchParams(window.location.search);
  const redirectTo = searchParams.get('redirect') || '/admin';

  // If already logged in as admin, redirect to dashboard
  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin");
    const authToken = localStorage.getItem("authToken");
    const currentUser = localStorage.getItem("currentUser");
    
      // Only redirect if BOTH isAdmin flag AND authToken exist
      if (isAdmin === "true" && authToken) {
        // Verify user object also has isAdmin flag
        try {
          if (currentUser) {
            const user = JSON.parse(currentUser);
            if (user.isAdmin) {
              setLocation(redirectTo);
              return;
            }
          }
        } catch (e) {
          // Invalid user data, clear stale session
          localStorage.removeItem("isAdmin");
          localStorage.removeItem("authToken");
          localStorage.removeItem("currentUser");
        }
      } else if (isAdmin === "true" && !authToken) {
        // Clear stale admin flag if no token
        localStorage.removeItem("isAdmin");
        localStorage.removeItem("currentUser");
      }
  }, [setLocation, redirectTo]);

  // Handle logout if user wants to switch accounts
  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("onboardingCompleted");
    localStorage.removeItem("isAdmin");
    window.location.reload();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const fullUrl = buildApiUrl('/api/auth/admin/login');
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const contentType = response.headers.get('content-type');
      if (!response.ok) {
        let errorData;
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
        } else {
          const errorText = await response.text();
          errorData = { message: errorText || 'Admin login failed' };
        }
        throw new Error(errorData.message || 'Admin login failed');
      }

      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Invalid response format. Expected JSON but got: ${contentType || 'unknown'}`);
      }

      const user = await response.json();
      
      // Store admin session
      localStorage.setItem("isAdmin", "true");
      localStorage.setItem("currentUser", JSON.stringify(user));
      if (user.token) {
        localStorage.setItem("authToken", user.token);
      }
      window.dispatchEvent(new Event("matchify-auth-changed"));

      toast({
        title: "Admin Login Successful",
        description: redirectTo === '/admin/events' ? "Welcome to Event Management!" : "Welcome to the admin dashboard",
      });

      // Redirect based on parameter or default to admin dashboard
      setLocation(redirectTo);
    } catch (error: any) {
      setError(error.message || "Login failed. Please check your credentials.");
      toast({
        title: "Login Failed",
        description: error.message || "Invalid admin credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-white text-primary flex items-center justify-center p-6">
      <div
        className="pointer-events-none absolute right-0 top-[20%] h-64 w-64 translate-x-1/3 rounded-full bg-primary/10 blur-[100px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-[15%] left-0 h-56 w-56 -translate-x-1/3 rounded-full bg-primary/8 blur-[90px]"
        aria-hidden
      />
      <Card className="relative z-10 w-full max-w-md border-zinc-200 bg-white/95 shadow-lg shadow-primary/5 backdrop-blur-sm">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full ring-1 ring-primary/15">
              <Shield className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center text-primary font-display">Admin Login</CardTitle>
          <CardDescription className="text-center text-primary/75">
            Enter your admin credentials to access the dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-primary">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@matchify.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="border-zinc-200 bg-white focus-visible:border-primary focus-visible:ring-primary/25"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-primary">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="border-zinc-200 bg-white focus-visible:border-primary focus-visible:ring-primary/25"
              />
            </div>

            <button
              type="button"
              className="w-full text-xs text-primary/80 bg-primary/5 border border-primary/15 rounded-lg py-2 px-3 text-left hover:bg-primary/10 transition-colors"
              onClick={() => { setEmail("admin@matchify.local"); setPassword("Admin123!"); }}
            >
              <span className="font-semibold text-primary">Demo admin</span> — click to fill credentials
            </button>

            <Button
              type="submit"
              className="w-full rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90"
              disabled={isLoading || !email || !password}
            >
              {isLoading ? (
                "Logging in..."
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Login as Admin
                </>
              )}
            </Button>

            <div className="text-center text-sm text-primary/75 space-y-2">
              <div>
                <Button
                  type="button"
                  variant="ghost"
                  className="p-0 h-auto text-primary hover:bg-primary/10 hover:text-primary"
                  onClick={() => setLocation("/")}
                >
                  Back to Home
                </Button>
              </div>
              {localStorage.getItem("authToken") && (
                <div>
                  <Button
                    type="button"
                    variant="ghost"
                    className="p-0 h-auto text-xs text-primary/70 hover:text-primary hover:bg-primary/10"
                    onClick={handleLogout}
                  >
                    Logout current user
                  </Button>
                </div>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

