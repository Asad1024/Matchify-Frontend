import { useState } from "react";
import { useLocation } from "wouter";
import Header from "@/components/common/Header";
import BottomNav from "@/components/common/BottomNav";
import EmpathyObserver from "@/components/self-discovery/EmpathyObserver";
import { useCurrentUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";

export default function EmpathyObserverPage() {
  const [activePage, setActivePage] = useState('menu');
  const [, setLocation] = useLocation();
  const { userId } = useCurrentUser();
  const { logout } = useAuth();

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
        {userId ? (
          <div className="h-[calc(100vh-200px)] min-h-[600px]">
            <EmpathyObserver userId={userId} />
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        )}
      </div>

      <BottomNav active={activePage} onNavigate={setActivePage} />
    </div>
  );
}
