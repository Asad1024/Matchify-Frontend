import { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Header from "@/components/common/Header";
import BottomNav from "@/components/common/BottomNav";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  Bell, 
  Lock, 
  Shield, 
  Trash2, 
  Download, 
  LogOut,
  AlertTriangle,
  UserX,
  Ban,
  KeyRound,
  ChevronRight,
  Mail,
  Phone,
  HelpCircle,
  UserRound,
} from "lucide-react";
import { useCurrentUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { apiRequestJson } from "@/services/api";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";
import { cn } from "@/lib/utils";
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
  phone?: string | null;
  privacy?: {
    profileVisible?: boolean;
    showOnlineStatus?: boolean;
    allowMessagesFrom?: "everyone" | "matches" | "none";
    showLocation?: boolean;
  };
  notificationSettings?: {
    newMatches?: boolean;
    messages?: boolean;
    events?: boolean;
    groups?: boolean;
    marketing?: boolean;
  };
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

  const { data: me } = useQuery<User>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });

  useEffect(() => {
    if (!me) return;
    const priv = me.privacy;
    if (priv && typeof priv === "object") {
      setPrivacySettings((prev) => ({
        ...prev,
        ...priv,
        allowMessagesFrom: priv.allowMessagesFrom ?? prev.allowMessagesFrom,
      }));
    }
    const notif = me.notificationSettings;
    if (notif && typeof notif === "object") {
      setNotificationSettings((prev) => ({
        ...prev,
        ...notif,
      }));
    }
  }, [me]);

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
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
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
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
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

  const maskedEmail = useMemo(() => {
    const raw = String(me?.email || "").trim();
    if (!raw.includes("@")) return raw || "—";
    const [u, d] = raw.split("@");
    if (!u || !d) return raw;
    const keep = Math.min(2, u.length);
    const masked = `${u.slice(0, keep)}***@${d}`;
    return masked;
  }, [me?.email]);

  const maskedPhone = useMemo(() => {
    const raw = String((me as any)?.phone || "").trim();
    if (!raw) return "";
    const digits = raw.replace(/\D/g, "");
    if (digits.length < 6) return raw;
    return `${digits.slice(0, 2)}***${digits.slice(-2)}`;
  }, [me]);

  const messageAccessLabel = useMemo(() => {
    switch (privacySettings.allowMessagesFrom) {
      case "matches":
        return "Matches only";
      case "none":
        return "No one";
      case "everyone":
      default:
        return "Everyone";
    }
  }, [privacySettings.allowMessagesFrom]);

  const cycleMessageAccess = () => {
    const next: "everyone" | "matches" | "none" =
      privacySettings.allowMessagesFrom === "everyone"
        ? "matches"
        : privacySettings.allowMessagesFrom === "matches"
          ? "none"
          : "everyone";
    const newSettings = { ...privacySettings, allowMessagesFrom: next };
    setPrivacySettings(newSettings);
    updatePrivacyMutation.mutate(newSettings);
  };

  function SettingsSectionTitle({ children }: { children: string }) {
    return (
      <div className="px-1 pt-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          {children}
        </p>
      </div>
    );
  }

  function SettingsCard({ children }: { children: React.ReactNode }) {
    return (
      <div className="rounded-[24px] border border-[#F0F0F0] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
        <div className="px-4 py-2.5">{children}</div>
      </div>
    );
  }

  function IconBubble({ children }: { children: React.ReactNode }) {
    return (
      <div className="grid h-9 w-9 place-items-center rounded-full bg-[#F4F4F7] text-slate-600">
        {children}
      </div>
    );
  }

  function Row({
    icon,
    label,
    value,
    right,
    onClick,
    danger,
    badge,
  }: {
    icon: React.ReactNode;
    label: string;
    value?: string;
    right?: React.ReactNode;
    onClick?: () => void;
    danger?: boolean;
    badge?: { label: string; tone?: "help" | "new" };
  }) {
    const Comp: any = onClick ? "button" : "div";
    return (
      <Comp
        type={onClick ? "button" : undefined}
        onClick={onClick}
        className={cn(
          "flex w-full items-center justify-between gap-3 py-3 text-left",
          onClick ? "hover:bg-slate-900/[0.02] -mx-4 px-4 rounded-2xl transition" : "",
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <IconBubble>{icon}</IconBubble>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className={cn("text-[15px] font-medium", danger ? "text-red-600" : "text-slate-900")}>
                {label}
              </p>
              {badge ? (
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                    badge.tone === "help"
                      ? "border-sky-200 bg-sky-50 text-sky-700"
                      : "border-primary/20 bg-primary/[0.06] text-primary",
                  )}
                >
                  {badge.label}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {value ? <span className="text-[12px] font-medium text-slate-500">{value}</span> : null}
          {right ?? (onClick ? <ChevronRight className="h-5 w-5 text-slate-400" strokeWidth={1.75} /> : null)}
        </div>
      </Comp>
    );
  }

  const unblockMutation = useMutation({
    mutationFn: (blockedId: string) =>
      apiRequest("DELETE", `/api/users/${userId}/blocks/${encodeURIComponent(blockedId)}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/blocked`] });
      void queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      void queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "social-summary"] });
      void queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "social-feed-lists"] });
      toast({ title: "User unblocked" });
    },
    onError: () => toast({ title: "Couldn’t unblock", variant: "destructive" }),
  });

  return (
    <div className="min-h-screen bg-[#F8F9FB] pb-24">
      <Header
        showSearch={false}
        onLogout={logout}
        title="Marriage settings"
      />

      <div className="mx-auto mt-2 max-w-lg space-y-3 px-3">
        <SettingsSectionTitle>Account settings</SettingsSectionTitle>
        <SettingsCard>
          <Row
            icon={<UserRound className="h-4.5 w-4.5" strokeWidth={1.75} aria-hidden />}
            label="Profile"
            onClick={() => setLocation("/profile?marriage=1&tab=edit")}
          />
          <Row
            icon={<Mail className="h-4.5 w-4.5" strokeWidth={1.75} aria-hidden />}
            label="Email"
            value={maskedEmail}
            onClick={() => toast({ title: "Email", description: "Email editing coming soon." })}
          />
          {maskedPhone ? (
            <Row
              icon={<Phone className="h-4.5 w-4.5" strokeWidth={1.75} aria-hidden />}
              label="Phone"
              value={maskedPhone}
              onClick={() => toast({ title: "Phone", description: "Phone editing coming soon." })}
            />
          ) : null}

          <div className="pt-2">
            {userId ? <ChangePasswordForm userId={userId} /> : null}
          </div>
        </SettingsCard>

        <SettingsSectionTitle>Discovery preferences</SettingsSectionTitle>
        <SettingsCard>
          <Row
            icon={<Lock className="h-4.5 w-4.5" strokeWidth={1.75} aria-hidden />}
            label="Show me on Matchify"
            right={
              <Switch
                checked={privacySettings.profileVisible}
                onCheckedChange={(checked) => {
                  const newSettings = { ...privacySettings, profileVisible: checked };
                  setPrivacySettings(newSettings);
                  updatePrivacyMutation.mutate(newSettings);
                }}
                aria-label="Show me on Matchify"
              />
            }
          />
          <Row
            icon={<UserX className="h-4.5 w-4.5" strokeWidth={1.75} aria-hidden />}
            label="Show online status"
            right={
              <Switch
                checked={privacySettings.showOnlineStatus}
                onCheckedChange={(checked) => {
                  const newSettings = { ...privacySettings, showOnlineStatus: checked };
                  setPrivacySettings(newSettings);
                  updatePrivacyMutation.mutate(newSettings);
                }}
                aria-label="Show online status"
              />
            }
          />
          <Row
            icon={<UserRound className="h-4.5 w-4.5" strokeWidth={1.75} aria-hidden />}
            label="Show location on profile"
            right={
              <Switch
                checked={privacySettings.showLocation}
                onCheckedChange={(checked) => {
                  const newSettings = { ...privacySettings, showLocation: checked };
                  setPrivacySettings(newSettings);
                  updatePrivacyMutation.mutate(newSettings);
                }}
                aria-label="Show location"
              />
            }
          />
          <Row
            icon={<Shield className="h-4.5 w-4.5" strokeWidth={1.75} aria-hidden />}
            label="Who can message you"
            value={messageAccessLabel}
            onClick={cycleMessageAccess}
          />
        </SettingsCard>

        <SettingsSectionTitle>Notifications</SettingsSectionTitle>
        <SettingsCard>
          <Row
            icon={<Bell className="h-4.5 w-4.5" strokeWidth={1.75} aria-hidden />}
            label="New matches"
            right={
              <Switch
                checked={notificationSettings.newMatches}
                onCheckedChange={(checked) => {
                  const newSettings = { ...notificationSettings, newMatches: checked };
                  setNotificationSettings(newSettings);
                  updateNotificationMutation.mutate(newSettings);
                }}
                aria-label="New matches notifications"
              />
            }
          />
          <Row
            icon={<Bell className="h-4.5 w-4.5" strokeWidth={1.75} aria-hidden />}
            label="Messages"
            right={
              <Switch
                checked={notificationSettings.messages}
                onCheckedChange={(checked) => {
                  const newSettings = { ...notificationSettings, messages: checked };
                  setNotificationSettings(newSettings);
                  updateNotificationMutation.mutate(newSettings);
                }}
                aria-label="Messages notifications"
              />
            }
          />
          <Row
            icon={<Bell className="h-4.5 w-4.5" strokeWidth={1.75} aria-hidden />}
            label="Events"
            right={
              <Switch
                checked={notificationSettings.events}
                onCheckedChange={(checked) => {
                  const newSettings = { ...notificationSettings, events: checked };
                  setNotificationSettings(newSettings);
                  updateNotificationMutation.mutate(newSettings);
                }}
                aria-label="Events notifications"
              />
            }
          />
          <Row
            icon={<Bell className="h-4.5 w-4.5" strokeWidth={1.75} aria-hidden />}
            label="Marketing"
            right={
              <Switch
                checked={notificationSettings.marketing}
                onCheckedChange={(checked) => {
                  const newSettings = { ...notificationSettings, marketing: checked };
                  setNotificationSettings(newSettings);
                  updateNotificationMutation.mutate(newSettings);
                }}
                aria-label="Marketing notifications"
              />
            }
          />
        </SettingsCard>

        <SettingsSectionTitle>Support</SettingsSectionTitle>
        <SettingsCard>
          <Row
            icon={<HelpCircle className="h-4.5 w-4.5" strokeWidth={1.75} aria-hidden />}
            label="Contact support"
            badge={{ label: "Help", tone: "help" }}
            onClick={() => toast({ title: "Support", description: "Support chat coming soon." })}
          />
          <Row
            icon={<Shield className="h-4.5 w-4.5" strokeWidth={1.75} aria-hidden />}
            label="Invite friends"
            badge={{ label: "New", tone: "new" }}
            onClick={() => toast({ title: "Invite friends", description: "Share link coming soon." })}
          />
          <Row
            icon={<Download className="h-4.5 w-4.5" strokeWidth={1.75} aria-hidden />}
            label="Export my data"
            onClick={handleExportData}
          />
          <Row
            icon={<Ban className="h-4.5 w-4.5" strokeWidth={1.75} aria-hidden />}
            label="Manage blocked accounts"
            onClick={() => setLocation("/settings/social")}
          />
        </SettingsCard>

        <SettingsSectionTitle>Danger zone</SettingsSectionTitle>
        <SettingsCard>
          <Row
            icon={<LogOut className="h-4.5 w-4.5" strokeWidth={1.75} aria-hidden />}
            label="Logout"
            onClick={() => logout()}
          />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button type="button" className="w-full">
                <Row
                  icon={<Trash2 className="h-4.5 w-4.5 text-red-600" strokeWidth={1.75} aria-hidden />}
                  label="Delete account"
                  danger
                  onClick={() => {}}
                  right={<ChevronRight className="h-5 w-5 text-slate-400" strokeWidth={1.75} aria-hidden />}
                />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  Delete Account
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete your account? This action cannot be undone. All your data, matches, and
                  conversations will be permanently deleted.
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
        </SettingsCard>
      </div>

      <BottomNav active="menu" />
    </div>
  );
}

