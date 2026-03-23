import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import PhotoUpload from "@/components/profile/PhotoUpload";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RELIGION_OPTIONS, MEET_PREFERENCE_OPTIONS } from "@/lib/religionOptions";

interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  age?: number | null;
  location?: string | null;
  bio?: string | null;
  avatar?: string | null;
  interests?: string[] | null;
  membershipTier?: string | null;
  verified?: boolean | null;
  [key: string]: unknown;
}

interface ProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
}

export default function ProfileEditDialog({ open, onOpenChange, user }: ProfileEditDialogProps) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: user.name || "",
    age: user.age?.toString() || "",
    location: user.location || "",
    bio: user.bio || "",
    interests: user.interests?.join(", ") || "",
    avatar: user.avatar || "",
    religion: typeof user.religion === "string" ? user.religion : "prefer_not_say",
    meetPreference:
      typeof user.meetPreference === "string" ? user.meetPreference : "open_to_all",
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      name: user.name || "",
      age: user.age?.toString() || "",
      location: user.location || "",
      bio: user.bio || "",
      interests: user.interests?.join(", ") || "",
      avatar: user.avatar || "",
      religion: typeof user.religion === "string" ? user.religion : "prefer_not_say",
      meetPreference:
        typeof user.meetPreference === "string" ? user.meetPreference : "open_to_all",
    });
  }, [
    open,
    user.id,
    user.name,
    user.age,
    user.location,
    user.bio,
    user.interests,
    user.avatar,
    user.religion,
    user.meetPreference,
  ]);

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<User>) => {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}`] });
      toast({ title: "Profile updated!" });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Failed to update profile", variant: "destructive" });
    },
  });

  const handleSave = () => {
    const interests = form.interests
      .split(",")
      .map((i) => i.trim())
      .filter(Boolean);

    updateMutation.mutate({
      name: form.name,
      age: form.age ? parseInt(form.age) : null,
      location: form.location || null,
      bio: form.bio || null,
      interests: interests.length > 0 ? interests : null,
      avatar: form.avatar || null,
      religion: form.religion,
      meetPreference: form.meetPreference,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Edit Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Photo */}
          <div className="flex justify-center">
            <PhotoUpload
              currentPhoto={form.avatar}
              userId={user.id}
              onPhotoChange={(url) => setForm((f) => ({ ...f, avatar: url }))}
              size="lg"
              label="Change Photo"
            />
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Your name"
            />
          </div>

          {/* Age */}
          <div className="space-y-1.5">
            <Label htmlFor="age">Age</Label>
            <Input
              id="age"
              type="number"
              value={form.age}
              onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
              placeholder="Your age"
              min={18}
              max={100}
            />
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              placeholder="City, Country"
            />
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              placeholder="Tell people about yourself..."
              rows={3}
              maxLength={300}
            />
            <p className="text-xs text-muted-foreground text-right">{form.bio.length}/300</p>
          </div>

          {/* Interests */}
          <div className="space-y-1.5">
            <Label htmlFor="interests">Interests</Label>
            <Input
              id="interests"
              value={form.interests}
              onChange={(e) => setForm((f) => ({ ...f, interests: e.target.value }))}
              placeholder="Travel, Fitness, Reading (comma-separated)"
            />
            <p className="text-xs text-muted-foreground">Separate with commas</p>
          </div>

          {/* Faith & discovery — drives “For you” groups; inclusive */}
          <div className="space-y-1.5">
            <Label htmlFor="religion">Background / faith</Label>
            <Select
              value={form.religion}
              onValueChange={(value) => setForm((f) => ({ ...f, religion: value }))}
            >
              <SelectTrigger id="religion" className="w-full">
                <SelectValue placeholder="Choose one" />
              </SelectTrigger>
              <SelectContent>
                {RELIGION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Optional — helps personalize communities. Everyone is welcome.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="meetPreference">Community highlights</Label>
            <Select
              value={form.meetPreference}
              onValueChange={(value) => setForm((f) => ({ ...f, meetPreference: value }))}
            >
              <SelectTrigger id="meetPreference" className="w-full">
                <SelectValue placeholder="How we surface groups" />
              </SelectTrigger>
              <SelectContent>
                {MEET_PREFERENCE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              “Similar background” prioritizes faith-focused groups when available.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
