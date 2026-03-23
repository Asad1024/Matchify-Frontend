import { useState } from "react";
import { useLocation } from "wouter";
import Header from "@/components/common/Header";
import BottomNav from "@/components/common/BottomNav";
import SelfDiscoveryFlow from "@/components/self-discovery/SelfDiscoveryFlow";
import EmpathyObserver from "@/components/self-discovery/EmpathyObserver";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Brain, Eye, CheckCircle } from "lucide-react";
import { CelebrationMascot } from "@/components/common/MascotIllustrations";
import { motion } from "framer-motion";

type User = {
  id: string;
  selfDiscoveryCompleted?: boolean;
  commitmentIntention?: 'hookup' | 'casual' | 'serious' | 'marriage';
  loveLanguage?: 'words' | 'acts' | 'gifts' | 'time' | 'touch';
  topPriorities?: string[] | null;
  relationshipReadiness?: {
    score?: number;
    blindSpots?: string[];
    needsWork?: string[];
  } | null;
  [key: string]: any;
};

export default function SelfDiscovery() {
  const [, setLocation] = useLocation();
  const { userId } = useCurrentUser();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState("flow");

  // Check if self-discovery is already completed
  const { data: currentUser } = useQuery<User | null>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });

  const handleSelfDiscoveryComplete = (data: any) => {
    // Redirect to directory after completion
    setTimeout(() => {
      setLocation('/directory');
    }, 2000);
  };

  if (currentUser?.selfDiscoveryCompleted) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <Header
          showSearch={false}
          unreadNotifications={0}
          onNotifications={() => setLocation('/notifications')}
          onCreate={() => setLocation('/')}
          onSettings={() => setLocation('/profile')}
          onLogout={logout}
        />
        <div className="max-w-2xl mx-auto p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", bounce: 0.4 }}
          >
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-6 text-center">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", bounce: 0.6, delay: 0.2 }}
                  className="mb-6"
                >
                  <CelebrationMascot className="w-32 h-32 mx-auto" />
                </motion.div>
                <motion.h2
                  className="text-2xl font-bold mb-2"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  AI Matchmaker Complete! 🎉
                </motion.h2>
                <motion.p
                  className="text-muted-foreground mb-4"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  You've finished AI Matchmaker. You can now find meaningful matches.
                </motion.p>
                <motion.div
                  className="space-y-2 text-sm text-left bg-card p-4 rounded-lg mb-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <div><strong>Commitment:</strong> {currentUser.commitmentIntention || 'Not set'}</div>
                  <div><strong>Love Language:</strong> {currentUser.loveLanguage || 'Not set'}</div>
                  <div><strong>Top Priority:</strong> {currentUser.topPriorities?.[0] || 'Not set'}</div>
                  <div><strong>Readiness Score:</strong> {currentUser.relationshipReadiness?.score || 0}%</div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <Button
                    onClick={() => setLocation('/directory')}
                    className="w-full"
                    size="lg"
                  >
                    Go to Matches
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
        <BottomNav active="menu" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header
        showSearch={false}
        unreadNotifications={0}
        onNotifications={() => setLocation('/notifications')}
        onCreate={() => setLocation('/')}
        onSettings={() => setLocation('/profile')}
        onLogout={logout}
      />
      
      <div className="max-w-4xl mx-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger 
              value="flow" 
              className="flex items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <Brain className="w-4 h-4" />
              AI Matchmaker
            </TabsTrigger>
            <TabsTrigger 
              value="empathy" 
              className="flex items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <Eye className="w-4 h-4" />
              Empathy Observer
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="flow" className="mt-6">
            {userId && (
              <SelfDiscoveryFlow
                userId={userId}
                onComplete={handleSelfDiscoveryComplete}
              />
            )}
          </TabsContent>
          
          <TabsContent value="empathy" className="mt-6">
            {userId ? (
              <div className="h-[calc(100vh-250px)] min-h-[500px]">
                <EmpathyObserver userId={userId} />
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">Loading...</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <BottomNav active="menu" />
    </div>
  );
}


