import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/common/Header";
import PageWrapper from "@/components/common/PageWrapper";
import NotificationItem from "@/components/notifications/NotificationItem";
import BottomNav from "@/components/common/BottomNav";
import { EmptyState, EmptyNotifications } from "@/components/common/EmptyState";
import { LoadingState } from "@/components/common/LoadingState";
import { useCurrentUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";

type Notification = {
  id: string;
  userId: string;
  type: 'match' | 'message' | 'event' | 'system';
  title: string;
  message: string;
  read: boolean | null;
  createdAt: Date | null;
};

export default function Notifications() {
  const [notificationTab, setNotificationTab] = useState('all');
  const { userId } = useCurrentUser();
  const { logout } = useAuth();

  // Fetch notifications from backend
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/users', userId, 'notifications'],
    enabled: !!userId,
  });

  // Ensure notifications is always an array
  const safeNotifications = Array.isArray(notifications) ? notifications : [];

  // Filter notifications by type
  const matchNotifications = safeNotifications.filter(n => n.type === 'match');
  const messageNotifications = safeNotifications.filter(n => n.type === 'message');
  const eventNotifications = safeNotifications.filter(n => n.type === 'event');
  const systemNotifications = safeNotifications.filter(n => n.type === 'system');

  // Format notifications for display
  const formattedNotifications = safeNotifications.map(n => ({
    ...n,
    read: n.read || false,
    timestamp: n.createdAt ? new Date(n.createdAt).toLocaleString() : 'Just now',
    user: n.type === 'match' || n.type === 'message' ? { name: 'User' } : undefined,
  }));

  return (
    <PageWrapper>
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header
        showSearch={false}
        onLogout={logout}
        title="Notifications"
      />

      <div className="max-w-lg mx-auto">
        {isLoading ? (
          <div className="py-12"><LoadingState message="Loading notifications..." showMascot={true} /></div>
        ) : notifications.length === 0 ? (
          <div className="py-12"><EmptyNotifications /></div>
        ) : (
          <>
            <div className="bg-white border-b border-gray-100 px-4 py-3">
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {[
                  { value: 'all', label: `All (${notifications.length})` },
                  { value: 'matches', label: `Matches (${matchNotifications.length})` },
                  { value: 'messages', label: `Messages (${messageNotifications.length})` },
                  { value: 'events', label: `Events (${eventNotifications.length})` },
                  { value: 'system', label: `System (${systemNotifications.length})` },
                ].map(tab => (
                  <button
                    key={tab.value}
                    onClick={() => setNotificationTab(tab.value)}
                    className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                      notificationTab === tab.value
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                    data-testid={`tab-${tab.value}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-gray-50 bg-white">
              {(notificationTab === 'all' ? formattedNotifications
                : notificationTab === 'matches' ? matchNotifications.map(n => ({ ...n, read: n.read || false, timestamp: n.createdAt ? new Date(n.createdAt).toLocaleString() : 'Just now' }))
                : notificationTab === 'messages' ? messageNotifications.map(n => ({ ...n, read: n.read || false, timestamp: n.createdAt ? new Date(n.createdAt).toLocaleString() : 'Just now' }))
                : notificationTab === 'events' ? eventNotifications.map(n => ({ ...n, read: n.read || false, timestamp: n.createdAt ? new Date(n.createdAt).toLocaleString() : 'Just now' }))
                : systemNotifications.map(n => ({ ...n, read: n.read || false, timestamp: n.createdAt ? new Date(n.createdAt).toLocaleString() : 'Just now' }))
              ).map((notification) => (
                <NotificationItem
                  key={notification.id}
                  {...notification}
                  onClick={(id) => console.log('Notification clicked:', id)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <BottomNav active="menu" />
    </div>
    </PageWrapper>
  );
}

