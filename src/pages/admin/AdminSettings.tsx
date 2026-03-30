import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import AdminLayout from "@/components/admin/AdminLayout";
import { LogOut } from "lucide-react";

const SETTINGS_KEY = 'admin_settings';

const DEFAULT_SETTINGS = {
  maintenanceMode: false,
  newRegistrations: true,
  emailNotifications: true,
  pushNotifications: true,
  autoModeration: false,
  maxPostLength: 500,
  maxImageSize: 10,
};

export default function AdminSettings() {
  const { toast } = useToast();
  const { logout } = useAuth();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
    } catch {}
  }, []);

  const save = () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    toast({ title: "Settings saved", description: "Your changes have been persisted." });
  };

  const toggle = (key: keyof typeof settings) =>
    setSettings(s => ({ ...s, [key]: !s[key] }));

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 space-y-4 max-w-2xl">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground text-sm">Configure platform settings</p>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Platform Controls</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {([
              ['maintenanceMode', 'Maintenance Mode', 'Take the platform offline for maintenance'],
              ['newRegistrations', 'Allow New Registrations', 'Allow new users to sign up'],
              ['emailNotifications', 'Email Notifications', 'Send email notifications to users'],
              ['pushNotifications', 'Push Notifications', 'Enable push notifications'],
              ['autoModeration', 'Auto Moderation', 'Automatically flag suspicious content'],
            ] as [keyof typeof settings, string, string][]).map(([key, label, desc]) => (
              <div key={key} className="flex items-center justify-between gap-3">
                <div>
                  <Label className="text-sm font-medium">{label}</Label>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <Switch
                  checked={!!settings[key]}
                  onCheckedChange={() => toggle(key)}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Limits</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label className="text-sm">Max Post Length (characters)</Label>
              <Input
                type="number"
                value={settings.maxPostLength}
                onChange={e => setSettings(s => ({ ...s, maxPostLength: parseInt(e.target.value) || 500 }))}
                className="w-40"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">Max Image Size (MB)</Label>
              <Input
                type="number"
                value={settings.maxImageSize}
                onChange={e => setSettings(s => ({ ...s, maxImageSize: parseInt(e.target.value) || 10 }))}
                className="w-40"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Session</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full justify-start border-red-200/90 font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 sm:w-auto"
              onClick={() => logout()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </Button>
          </CardContent>
        </Card>

        <Button onClick={save} className="w-full sm:w-auto">Save Changes</Button>
      </div>
    </AdminLayout>
  );
}
