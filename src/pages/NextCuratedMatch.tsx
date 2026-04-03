import { useEffect } from "react";
import { useLocation } from "wouter";
import { useCurrentUser } from "@/contexts/UserContext";
import { LoadingState } from "@/components/common/LoadingState";

/** AI matches now live on Discover (AI Matching tab); this route stays for old links. */
export default function NextCuratedMatch() {
  const [, setLocation] = useLocation();
  const { userId } = useCurrentUser();

  useEffect(() => {
    if (!userId) {
      setLocation("/ai-matchmaker");
      return;
    }
    setLocation("/directory?tab=curated");
  }, [userId, setLocation]);

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background">
      <LoadingState message="Opening Discover…" showMascot={true} />
    </div>
  );
}
