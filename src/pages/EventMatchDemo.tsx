import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import Header from "@/components/common/Header";
import BottomNav from "@/components/common/BottomNav";
import MatchCountdown from "@/components/events/MatchCountdown";
import EventMatchResults from "@/components/events/EventMatchResults";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Sparkles, Clock, Heart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

/** Demo match data for the event match reveal flow */
const DEMO_MATCHES = [
  {
    id: "demo-1",
    userId: "demo-user-1",
    name: "Alex Rivera",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    compatibility: 92,
    insights: [
      "Both value honesty and open communication",
      "Similar lifestyle: love travel and weekend adventures",
      "Aligned on long-term relationship goals",
    ],
    matchQuality: "high" as const,
  },
  {
    id: "demo-2",
    userId: "demo-user-2",
    name: "Jordan Taylor",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
    compatibility: 85,
    insights: [
      "Shared interest in fitness and wellness",
      "Compatible communication styles",
      "Both enjoy cozy nights in and trying new restaurants",
    ],
    matchQuality: "high" as const,
  },
  {
    id: "demo-3",
    userId: "demo-user-3",
    name: "Sam Chen",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
    compatibility: 78,
    insights: [
      "Strong values alignment on family and growth",
      "Complementary hobbies: you love art, they love music",
      "Similar timeline for relationship readiness",
    ],
    matchQuality: "medium" as const,
  },
];

export default function EventMatchDemo() {
  const [, setLocation] = useLocation();
  const { logout } = useAuth();
  const [phase, setPhase] = useState<"intro" | "countdown" | "matches">("intro");
  const [revealTargetTime, setRevealTargetTime] = useState<Date | null>(null);

  const handleStartCountdown = () => {
    const target = new Date(Date.now() + 15 * 1000);
    setRevealTargetTime(target);
    setPhase("countdown");
  };

  const handleCountdownComplete = () => {
    setPhase("matches");
  };

  const handleTryAgain = () => {
    setPhase("intro");
    setRevealTargetTime(null);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header
        showSearch={false}
        unreadNotifications={0}
        onNotifications={() => setLocation("/notifications")}
        onCreate={() => setLocation("/")}
        onSettings={() => setLocation("/profile")}
        onLogout={logout}
      />

      {/* Countdown overlay */}
      {phase === "countdown" && revealTargetTime && (
        <MatchCountdown
          targetTime={revealTargetTime}
          onComplete={handleCountdownComplete}
          eventTitle="Demo Speed Dating Night"
        />
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-lg px-4 pb-6 pt-2"
      >
        <Button
          variant="ghost"
          onClick={() => setLocation("/events")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Events
        </Button>

        {phase === "intro" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="text-center space-y-4 py-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 mb-4">
                <Sparkles className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                Event Match Reveal – Demo
              </h1>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                See how the countdown and match reveal work. Click below to start a 15-second countdown; when it finishes, sample matches will appear.
              </p>
            </div>

            <Card className="border-2 border-primary/20 overflow-hidden">
              <CardContent className="p-6 space-y-4">
                <h2 className="font-semibold text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  How it works
                </h2>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>Host schedules a reveal time for the event.</li>
                  <li>All attendees see the same countdown until that time.</li>
                  <li>When the countdown hits zero, everyone’s matches are revealed at once.</li>
                  <li>Matches are shown with compatibility %, insights, and Message / View Profile.</li>
                </ol>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button
                size="lg"
                className="min-w-[200px] shadow-lg"
                onClick={handleStartCountdown}
              >
                <Heart className="w-5 h-5 mr-2" />
                Start 15s countdown
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setLocation("/events")}
              >
                Back to Events
              </Button>
            </div>
          </motion.div>
        )}

        {phase === "matches" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="flex justify-center">
              <Button variant="outline" onClick={handleTryAgain}>
                Try countdown again
              </Button>
            </div>
            <EventMatchResults
              matches={DEMO_MATCHES}
              eventTitle="Demo Speed Dating Night"
              eventId="demo"
              isDemo
              onMessage={(userId) => setLocation(`/chat?user=${userId}`)}
            />
          </motion.div>
        )}
      </motion.div>

      <BottomNav active="explore" onNavigate={() => {}} />
    </div>
  );
}
