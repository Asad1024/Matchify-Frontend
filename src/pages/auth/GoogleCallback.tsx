import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingState } from "@/components/common/LoadingState";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GoogleCallback() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userDataEncoded = params.get('user');
    const isNewUserParam = params.get('isNewUser');
    const errorParam = params.get('error');

    if (errorParam) {
      setError(`Authentication failed: ${errorParam.replace(/_/g, ' ')}`);
      setLoading(false);
      return;
    }

    if (userDataEncoded) {
      try {
        const userData = JSON.parse(decodeURIComponent(userDataEncoded));
        
        localStorage.setItem("authToken", userData.token || "google-token");
        localStorage.setItem("currentUser", JSON.stringify(userData));
        
        const isNewUser = isNewUserParam === 'true';

        if (userData.isAdmin) {
          localStorage.setItem("isAdmin", "true");
          localStorage.setItem("onboardingCompleted", "true");
          setLocation("/admin");
        } else if (isNewUser || !userData.onboardingCompleted) {
          localStorage.removeItem("onboardingCompleted");
          setLocation("/");
        } else {
          localStorage.setItem("onboardingCompleted", "true");
          setLocation("/");
        }
      } catch (e) {
        console.error("Failed to parse user data from Google callback:", e);
        setError("Failed to process Google login data.");
      }
    } else {
      setError("No user data received from Google login.");
    }
    setLoading(false);
  }, [setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingState message="Completing Google Login..." showMascot={true} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 text-center space-y-4">
          {error ? (
            <>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <Button onClick={() => setLocation("/login")}>Back to Login</Button>
            </>
          ) : (
            <p className="text-muted-foreground">Redirecting...</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

