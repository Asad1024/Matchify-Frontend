import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import Header from "@/components/common/Header";
import BottomNav from "@/components/common/BottomNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Bell, 
  Lock, 
  Eye, 
  EyeOff, 
  Shield, 
  Trash2, 
  Download, 
  LogOut,
  AlertTriangle,
  UserX,
  Ban
} from "lucide-react";
import { useCurrentUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type User = {
  id: string;
  name: string;
  email: string;
};

export default function Settings() {
  const [, setLocation] = useLocation();
  const { userId } = useCurrentUser();
  const { logout } = useAuth();
  const { toast } = useToast();
  
  const [privacySettings, setPrivacySettings] = useState({
    profileVisible: true,
    showOnlineStatus: true,
    allowMessagesFrom: 'everyone' as 'everyone' | 'matches' | 'none',
    showLocation: false,
  });

  const [notificationSettings, setNotificationSettings] = useState({
    newMatches: true,
    messages: true,
    events: true,
    groups: true,
    marketing: false,
  });

  // Fetch blocked users
  const { data: blockedUsers = [] } = useQuery<User[]>({
    queryKey: [`/api/users/${userId}/blocked`],
    enabled: !!userId,
  });

  // Update privacy settings mutation
  const updatePrivacyMutation = useMutation({
    mutationFn: async (settings: typeof privacySettings) => {
      return apiRequest('PATCH', `/api/users/${userId}/privacy`, settings);
    },
    onSuccess: () => {
      toast({
        title: "Privacy settings updated",
        description: "Your privacy preferences have been saved",
      });
    },
  });

  // Update notification settings mutation
  const updateNotificationMutation = useMutation({
    mutationFn: async (settings: typeof notificationSettings) => {
      return apiRequest('PATCH', `/api/users/${userId}/notifications`, settings);
    },
    onSuccess: () => {
      toast({
        title: "Notification settings updated",
        description: "Your notification preferences have been saved",
      });
    },
  });

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('DELETE', `/api/users/${userId}`);
    },
    onSuccess: () => {
      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted",
      });
      logout();
      setLocation('/');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteAccount = () => {
    deleteAccountMutation.mutate();
  };

  const handleExportData = () => {
    // Export user data
    toast({
      title: "Data export",
      description: "Your data export will be sent to your email",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header
        showSearch={false}
        onLogout={logout}
        title="Settings"
      />

      <div className="max-w-lg mx-auto space-y-2 mt-2">

        {/* Privacy Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              <CardTitle>Privacy Settings</CardTitle>
            </div>
            <CardDescription>Control who can see your profile and contact you</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5 flex-1 min-w-0">
                <Label htmlFor="profile-visible" className="text-sm sm:text-base">Profile Visibility</Label>
                <p className="text-xs sm:text-sm text-muted-foreground">Make your profile visible to others</p>
              </div>
              <Switch
                id="profile-visible"
                checked={privacySettings.profileVisible}
                onCheckedChange={(checked) => {
                  const newSettings = { ...privacySettings, profileVisible: checked };
                  setPrivacySettings(newSettings);
                  updatePrivacyMutation.mutate(newSettings);
                }}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="online-status">Show Online Status</Label>
                <p className="text-sm text-muted-foreground">Let others see when you're online</p>
              </div>
              <Switch
                id="online-status"
                checked={privacySettings.showOnlineStatus}
                onCheckedChange={(checked) => {
                  const newSettings = { ...privacySettings, showOnlineStatus: checked };
                  setPrivacySettings(newSettings);
                  updatePrivacyMutation.mutate(newSettings);
                }}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="show-location">Show Location</Label>
                <p className="text-sm text-muted-foreground">Display your location on profile</p>
              </div>
              <Switch
                id="show-location"
                checked={privacySettings.showLocation}
                onCheckedChange={(checked) => {
                  const newSettings = { ...privacySettings, showLocation: checked };
                  setPrivacySettings(newSettings);
                  updatePrivacyMutation.mutate(newSettings);
                }}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Who can message you</Label>
              <select
                value={privacySettings.allowMessagesFrom}
                onChange={(e) => {
                  const newSettings = { ...privacySettings, allowMessagesFrom: e.target.value as any };
                  setPrivacySettings(newSettings);
                  updatePrivacyMutation.mutate(newSettings);
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="everyone">Everyone</option>
                <option value="matches">Matches only</option>
                <option value="none">No one</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              <CardTitle>Notification Settings</CardTitle>
            </div>
            <CardDescription>Choose what notifications you want to receive</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notif-matches">New Matches</Label>
                <p className="text-sm text-muted-foreground">Get notified when you have a new match</p>
              </div>
              <Switch
                id="notif-matches"
                checked={notificationSettings.newMatches}
                onCheckedChange={(checked) => {
                  const newSettings = { ...notificationSettings, newMatches: checked };
                  setNotificationSettings(newSettings);
                  updateNotificationMutation.mutate(newSettings);
                }}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notif-messages">Messages</Label>
                <p className="text-sm text-muted-foreground">Get notified of new messages</p>
              </div>
              <Switch
                id="notif-messages"
                checked={notificationSettings.messages}
                onCheckedChange={(checked) => {
                  const newSettings = { ...notificationSettings, messages: checked };
                  setNotificationSettings(newSettings);
                  updateNotificationMutation.mutate(newSettings);
                }}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notif-events">Events</Label>
                <p className="text-sm text-muted-foreground">Get notified about upcoming events</p>
              </div>
              <Switch
                id="notif-events"
                checked={notificationSettings.events}
                onCheckedChange={(checked) => {
                  const newSettings = { ...notificationSettings, events: checked };
                  setNotificationSettings(newSettings);
                  updateNotificationMutation.mutate(newSettings);
                }}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notif-marketing">Marketing</Label>
                <p className="text-sm text-muted-foreground">Receive promotional emails and updates</p>
              </div>
              <Switch
                id="notif-marketing"
                checked={notificationSettings.marketing}
                onCheckedChange={(checked) => {
                  const newSettings = { ...notificationSettings, marketing: checked };
                  setNotificationSettings(newSettings);
                  updateNotificationMutation.mutate(newSettings);
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Blocked Users */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Ban className="w-5 h-5 text-primary" />
              <CardTitle>Blocked Users</CardTitle>
            </div>
            <CardDescription>Manage users you've blocked</CardDescription>
          </CardHeader>
          <CardContent>
            {blockedUsers.length > 0 ? (
              <div className="space-y-2">
                {blockedUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <UserX className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">Blocked</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Unblock user
                        toast({
                          title: "User unblocked",
                          description: `${user.name} has been unblocked`,
                        });
                      }}
                    >
                      Unblock
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No blocked users</p>
            )}
          </CardContent>
        </Card>

        {/* Data & Account */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <CardTitle>Data & Account</CardTitle>
            </div>
            <CardDescription>Manage your data and account settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleExportData}
            >
              <Download className="w-4 h-4 mr-2" />
              Export My Data
            </Button>

            <Separator />

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="w-full justify-start"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                    Delete Account
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete your account? This action cannot be undone. All your data, matches, and conversations will be permanently deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>

      <BottomNav active="menu" />
    </div>
  );
}

