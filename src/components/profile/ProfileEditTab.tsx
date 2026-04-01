import { useState, useEffect, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { buildApiUrl, getAuthHeaders } from "@/services/api";
import { notifyHeaderUserUpdated } from "@/components/common/Header";
import PhotoUpload from "@/components/profile/PhotoUpload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RELIGION_OPTIONS, MEET_PREFERENCE_OPTIONS } from "@/lib/religionOptions";
import { useLocation } from "wouter";
import {
  Loader2,
  ChevronRight,
  Sparkles,
  Heart,
  Shield,
  Camera,
  UserRound,
  HeartHandshake,
  Brain,
  GraduationCap,
  Flame,
  Globe2,
  ImageIcon,
  LayoutGrid,
  AtSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { buildProfileGalleryUrls, sanitizeProfileGalleryUrls } from "@/lib/profileLabels";
import { ALCOHOL_OPTIONS, ETHNICITY_OPTIONS, SMOKING_OPTIONS } from "@/lib/profileDemographics";
import { ProfilePreviewCard } from "@/components/profile/ProfilePreviewCard";
import {
  COMMITMENT_INTENTION_OPTIONS,
  MARRIAGE_APPROACH_OPTIONS,
  MARRIAGE_TIMELINE_OPTIONS,
} from "@/lib/marriageIntentFields";

const RELATIONSHIP_GOALS = [
  { value: "marriage", label: "Marriage" },
  { value: "dating", label: "Serious dating" },
  { value: "friendship", label: "Friendship" },
  { value: "networking", label: "Professional networking" },
];

const GOAL_TO_COMMITMENT: Record<string, "marriage" | "serious" | "casual"> = {
  marriage: "marriage",
  dating: "serious",
  friendship: "casual",
  networking: "casual",
};

const VALUES = [
  "Family-Oriented",
  "Career-Focused",
  "Adventurous",
  "Spiritual",
  "Health-Conscious",
  "Creative",
  "Ambitious",
  "Honest",
  "Loyal",
  "Fun-Loving",
  "Intellectual",
  "Empathetic",
];

const LIFESTYLE = [
  "Fitness Enthusiast",
  "Foodie",
  "Travel Lover",
  "Homebody",
  "Night Owl",
  "Early Bird",
  "Pet Lover",
  "Social Butterfly",
  "Bookworm",
  "Tech Savvy",
  "Artist",
  "Entrepreneur",
];

const EDUCATION_LEVELS = [
  "High School",
  "Some College",
  "Bachelor's Degree",
  "Master's Degree",
  "PhD/Doctorate",
  "Professional Degree",
];

const INCOME_RANGES = [
  "Under $30k",
  "$30k - $50k",
  "$50k - $75k",
  "$75k - $100k",
  "$100k - $150k",
  "$150k+",
  "Prefer not to say",
];

const ZODIAC_SIGNS = [
  { value: "aries", label: "Aries" },
  { value: "taurus", label: "Taurus" },
  { value: "gemini", label: "Gemini" },
  { value: "cancer", label: "Cancer" },
  { value: "leo", label: "Leo" },
  { value: "virgo", label: "Virgo" },
  { value: "libra", label: "Libra" },
  { value: "scorpio", label: "Scorpio" },
  { value: "sagittarius", label: "Sagittarius" },
  { value: "capricorn", label: "Capricorn" },
  { value: "aquarius", label: "Aquarius" },
  { value: "pisces", label: "Pisces" },
];

const LOVE_LANG = [
  { value: "words", label: "Words of affirmation" },
  { value: "acts", label: "Acts of service" },
  { value: "gifts", label: "Receiving gifts" },
  { value: "time", label: "Quality time" },
  { value: "touch", label: "Physical touch" },
];

const WANTS_CHILDREN_OPTS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "open", label: "Open / unsure" },
  { value: "prefer_not_say", label: "Prefer not to say" },
];

export type ProfileEditUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar?: string | null;
  age?: number | null;
  location?: string | null;
  bio?: string | null;
  extraBio?: string | null;
  interests?: string[] | null;
  photos?: string[] | null;
  gender?: string | null;
  education?: string | null;
  career?: string | null;
  incomeRange?: string | null;
  zodiacSign?: string | null;
  birthDate?: string | null;
  religion?: string | null;
  meetPreference?: string | null;
  relationshipGoal?: string | null;
  commitmentIntention?: string | null;
  marriageTimeline?: string | null;
  marriageApproach?: string | null;
  wantsChildren?: string | null;
  values?: string[] | null;
  lifestyle?: string[] | null;
  loveLanguage?: string | null;
  languages?: string | string[] | null;
  profileBanner?: string | null;
  nationality?: string | null;
  ethnicity?: string | null;
  smoking?: string | null;
  drinksAlcohol?: string | null;
  [key: string]: unknown;
};

type ProfileEditTabProps = {
  user: ProfileEditUser;
  onOpenSecurity: () => void;
  onOpenAddPartner: () => void;
  onGoCoaching: () => void;
  onGoAIMatchmaker: () => void;
  hasPartner: boolean;
  /** Open full-screen image viewer (preview hero + edit photos). Optional list includes unsaved gallery state. */
  onImagePreview?: (url: string, galleryUrls?: string[]) => void;
};

function normalizeExtraPhotos(photos: string[] | null | undefined, avatar: string | null | undefined) {
  const av = avatar?.trim() || "";
  const raw = sanitizeProfileGalleryUrls(photos);
  return raw.filter((p) => !av || p !== av).slice(0, 4);
}

function toggleListItem(list: string[], item: string): string[] {
  if (list.includes(item)) return list.filter((x) => x !== item);
  return [...list, item];
}

export default function ProfileEditTab({
  user,
  onOpenSecurity,
  onOpenAddPartner,
  onGoCoaching,
  onGoAIMatchmaker,
  hasPartner,
  onImagePreview,
}: ProfileEditTabProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [avatar, setAvatar] = useState(user.avatar || "");
  const [extraPhotos, setExtraPhotos] = useState<string[]>(() =>
    normalizeExtraPhotos(user.photos as string[] | null, user.avatar),
  );
  const [form, setForm] = useState({
    name: user.name || "",
    age: user.age != null ? String(user.age) : "",
    location: user.location || "",
    bio: user.bio || "",
    extraBio: (user.extraBio as string) || "",
    interests: Array.isArray(user.interests) ? user.interests.join(", ") : "",
    gender: (user.gender as string) || "",
    education: (user.education as string) || "",
    career: (user.career as string) || "",
    incomeRange: (user.incomeRange as string) || "",
    zodiacSign: (user.zodiacSign as string) || "",
    birthDate: (user.birthDate as string) || "",
    religion: typeof user.religion === "string" ? user.religion : "prefer_not_say",
    meetPreference: typeof user.meetPreference === "string" ? user.meetPreference : "open_to_all",
    relationshipGoal: (user.relationshipGoal as string) || "marriage",
    commitmentIntention: (user.commitmentIntention as string) || "serious",
    marriageTimeline: typeof user.marriageTimeline === "string" ? user.marriageTimeline : "",
    marriageApproach: typeof user.marriageApproach === "string" ? user.marriageApproach : "",
    wantsChildren: typeof user.wantsChildren === "string" ? user.wantsChildren : "",
    values: Array.isArray(user.values) ? [...user.values] : [],
    lifestyle: Array.isArray(user.lifestyle) ? [...user.lifestyle] : [],
    loveLanguage: (user.loveLanguage as string) || "",
    languages: Array.isArray(user.languages)
      ? (user.languages as string[]).join(", ")
      : typeof user.languages === "string"
        ? user.languages
        : "",
    nationality: typeof user.nationality === "string" ? user.nationality : "",
    ethnicity: typeof user.ethnicity === "string" ? user.ethnicity : "",
    smoking: typeof user.smoking === "string" ? user.smoking : "",
    drinksAlcohol: typeof user.drinksAlcohol === "string" ? user.drinksAlcohol : "",
    profileBanner: typeof user.profileBanner === "string" ? user.profileBanner : "",
  });

  useEffect(() => {
    setAvatar(user.avatar || "");
    setExtraPhotos(normalizeExtraPhotos(user.photos as string[] | null, user.avatar));
    setForm({
      name: user.name || "",
      age: user.age != null ? String(user.age) : "",
      location: user.location || "",
      bio: user.bio || "",
      extraBio: (user.extraBio as string) || "",
      interests: Array.isArray(user.interests) ? user.interests.join(", ") : "",
      gender: (user.gender as string) || "",
      education: (user.education as string) || "",
      career: (user.career as string) || "",
      incomeRange: (user.incomeRange as string) || "",
      zodiacSign: (user.zodiacSign as string) || "",
      birthDate: (user.birthDate as string) || "",
      religion: typeof user.religion === "string" ? user.religion : "prefer_not_say",
      meetPreference: typeof user.meetPreference === "string" ? user.meetPreference : "open_to_all",
      relationshipGoal: (user.relationshipGoal as string) || "marriage",
      commitmentIntention: (user.commitmentIntention as string) || "serious",
    marriageTimeline: typeof user.marriageTimeline === "string" ? user.marriageTimeline : "",
    marriageApproach: typeof user.marriageApproach === "string" ? user.marriageApproach : "",
    wantsChildren: typeof user.wantsChildren === "string" ? user.wantsChildren : "",
      values: Array.isArray(user.values) ? [...user.values] : [],
      lifestyle: Array.isArray(user.lifestyle) ? [...user.lifestyle] : [],
      loveLanguage: (user.loveLanguage as string) || "",
      languages: Array.isArray(user.languages)
        ? (user.languages as string[]).join(", ")
        : typeof user.languages === "string"
          ? user.languages
          : "",
      nationality: typeof user.nationality === "string" ? user.nationality : "",
      ethnicity: typeof user.ethnicity === "string" ? user.ethnicity : "",
      smoking: typeof user.smoking === "string" ? user.smoking : "",
      drinksAlcohol: typeof user.drinksAlcohol === "string" ? user.drinksAlcohol : "",
      profileBanner: typeof user.profileBanner === "string" ? user.profileBanner : "",
    });
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch(buildApiUrl(`/api/users/${user.id}`), {
        method: "PATCH",
        headers: getAuthHeaders(true),
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      return res.json() as Promise<Record<string, unknown>>;
    },
    onSuccess: (updated, variables) => {
      queryClient.setQueryData([`/api/users/${user.id}`], (prev) => {
        const base =
          prev && typeof prev === "object" ? { ...(prev as Record<string, unknown>) } : {};
        return { ...base, ...updated } as Record<string, unknown>;
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user.id}`] });
      try {
        const raw = localStorage.getItem("currentUser");
        if (raw) {
          const cur = JSON.parse(raw) as Record<string, unknown>;
          if (cur.id === user.id) {
            localStorage.setItem("currentUser", JSON.stringify({ ...cur, ...updated }));
            notifyHeaderUserUpdated();
          }
        }
      } catch {
        /* ignore */
      }
      const vars = variables as Record<string, unknown>;
      const keys = Object.keys(vars);
      const photoOnlyPatch =
        keys.length === 1 &&
        (keys[0] === "photos" || keys[0] === "avatar" || keys[0] === "profileBanner");
      if (!photoOnlyPatch) {
        toast({ title: "Profile saved" });
      }
    },
    onError: () => {
      toast({ title: "Could not save profile", variant: "destructive" });
    },
  });

  const languagesArray = useMemo(
    () =>
      form.languages
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    [form.languages],
  );

  const persistExtraPhotos = (next: string[]) => {
    setExtraPhotos(next);
    const cleaned = sanitizeProfileGalleryUrls(next);
    updateMutation.mutate({ photos: cleaned.length ? cleaned : null });
  };

  const handleSave = () => {
    const interests = form.interests
      .split(",")
      .map((i) => i.trim())
      .filter(Boolean);
    const commitmentFromGoal = GOAL_TO_COMMITMENT[form.relationshipGoal] || "casual";
    const cleanedExtras = sanitizeProfileGalleryUrls(extraPhotos);
    const photosPayload = cleanedExtras.length ? cleanedExtras : null;

    updateMutation.mutate({
      name: form.name,
      age: form.age ? parseInt(form.age, 10) : null,
      location: form.location || null,
      bio: form.bio || null,
      extraBio: form.extraBio?.trim() ? form.extraBio.trim() : null,
      interests: interests.length ? interests : null,
      avatar: avatar?.trim() ? avatar.trim() : null,
      photos: photosPayload,
      gender: form.gender || null,
      education: form.education || null,
      career: form.career || null,
      incomeRange: form.incomeRange || null,
      zodiacSign: form.zodiacSign || null,
      birthDate: form.birthDate || null,
      religion: form.religion,
      meetPreference: form.meetPreference,
      relationshipGoal: form.relationshipGoal,
      commitmentIntention: form.commitmentIntention || commitmentFromGoal,
      marriageTimeline: form.marriageTimeline || null,
      marriageApproach: form.marriageApproach || null,
      wantsChildren: form.wantsChildren || null,
      values: form.values.length ? form.values : null,
      lifestyle: form.lifestyle.length ? form.lifestyle : null,
      loveLanguage: form.loveLanguage || null,
      languages: languagesArray.length ? languagesArray : null,
      profileBanner: form.profileBanner?.trim() ? form.profileBanner.trim() : null,
      nationality: form.nationality?.trim() ? form.nationality.trim() : null,
      ethnicity: form.ethnicity || null,
      smoking: form.smoking || null,
      drinksAlcohol: form.drinksAlcohol || null,
    });
  };

  const chipClass = (on: boolean) =>
    cn(
      "rounded-lg px-3 py-2 text-xs font-bold transition-colors border",
      on
        ? "border-primary/25 bg-primary/[0.08] text-primary shadow-sm"
        : "border-stone-200 bg-white text-foreground/80 hover:border-primary/30",
    );

  const inputCls = "rounded-xl border-stone-200 bg-white";
  const triggerCls = "w-full rounded-xl border-stone-200";
  const textareaCls =
    "rounded-xl border-stone-200 bg-white min-h-[100px] resize-y focus-visible:ring-primary/30";

  const linkRow =
    "flex w-full items-center justify-between rounded-2xl border border-transparent px-3 py-3.5 text-left transition-colors hover:bg-stone-50 hover:border-stone-100";

  const handlePhotosLightbox = (url: string) => {
    const all = buildProfileGalleryUrls(avatar, extraPhotos);
    onImagePreview?.(url, all);
  };

  const photosCard = (
    <ProfilePreviewCard
      icon={Camera}
      title="Photos"
      description="Main photo plus up to four gallery shots — same as your preview layout."
    >
        <div className="flex justify-center rounded-2xl bg-stone-50/80 py-4">
          <PhotoUpload
            suppressSuccessToast
            currentPhoto={avatar}
            userId={user.id}
            onOpenPreview={handlePhotosLightbox}
            onPhotoChange={(url) => {
              setAvatar(url);
              updateMutation.mutate({ avatar: url?.trim() ? url.trim() : null });
            }}
            size="lg"
            label="Change main photo"
          />
        </div>
        <div className="mt-4 rounded-2xl border border-stone-100 bg-stone-50/50 p-3">
          <PhotoUpload
            photos={extraPhotos}
            onPhotosChange={persistExtraPhotos}
            maxPhotos={4}
            userId={user.id}
            suppressSuccessToast
            onOpenPreview={handlePhotosLightbox}
          />
        </div>
    </ProfilePreviewCard>
  );

  return (
    <div className="space-y-3">
      {photosCard}

      <ProfilePreviewCard
        icon={UserRound}
        title="Basics"
        description="Name, location, and what shows in About me / Bio on preview."
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-name" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Name
            </Label>
            <Input
              id="edit-name"
              className={inputCls}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-age" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Age
              </Label>
              <Input
                id="edit-age"
                className={inputCls}
                type="number"
                min={18}
                max={100}
                value={form.age}
                onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Gender</Label>
              <Select
                value={form.gender || "unset"}
                onValueChange={(v) => setForm((f) => ({ ...f, gender: v === "unset" ? "" : v }))}
              >
                <SelectTrigger className={triggerCls}>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unset">Not set</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-location" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              City &amp; country
            </Label>
            <Input
              id="edit-location"
              className={inputCls}
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              placeholder="e.g. Dubai, UAE"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-bio" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              About me
            </Label>
            <Textarea
              id="edit-bio"
              className={textareaCls}
              rows={4}
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              maxLength={500}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-extra" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Extended bio (optional)
            </Label>
            <Textarea
              id="edit-extra"
              className={textareaCls}
              rows={3}
              value={form.extraBio}
              onChange={(e) => setForm((f) => ({ ...f, extraBio: e.target.value }))}
              placeholder="Longer text for the Bio block on preview"
              maxLength={1200}
            />
          </div>
        </div>
      </ProfilePreviewCard>

      <ProfilePreviewCard
        icon={Globe2}
        title="Languages & background"
        description="Nationality, ethnicity, languages, smoking, and alcohol — same as profile preview."
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Nationality
            </Label>
            <Input
              className={inputCls}
              value={form.nationality}
              onChange={(e) => setForm((f) => ({ ...f, nationality: e.target.value }))}
              placeholder="e.g. Emirati, British"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Ethnicity / heritage
            </Label>
            <Select
              value={form.ethnicity || "unset"}
              onValueChange={(v) => setForm((f) => ({ ...f, ethnicity: v === "unset" ? "" : v }))}
            >
              <SelectTrigger className={triggerCls}>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="unset">Not set</SelectItem>
                {ETHNICITY_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Languages (comma-separated)
            </Label>
            <Input
              className={inputCls}
              value={form.languages}
              onChange={(e) => setForm((f) => ({ ...f, languages: e.target.value }))}
              placeholder="English, Arabic…"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Smoking
              </Label>
              <Select
                value={form.smoking || "unset"}
                onValueChange={(v) => setForm((f) => ({ ...f, smoking: v === "unset" ? "" : v }))}
              >
                <SelectTrigger className={triggerCls}>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unset">Not set</SelectItem>
                  {SMOKING_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Alcohol
              </Label>
              <Select
                value={form.drinksAlcohol || "unset"}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, drinksAlcohol: v === "unset" ? "" : v }))
                }
              >
                <SelectTrigger className={triggerCls}>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unset">Not set</SelectItem>
                  {ALCOHOL_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </ProfilePreviewCard>

      <ProfilePreviewCard
        icon={HeartHandshake}
        title="Goals & commitment"
        description="What you’re looking for and where you are on the path to marriage."
      >
        <div className="space-y-4">
          <div className="space-y-1.5 rounded-2xl bg-stone-50/90 px-3.5 py-3">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Primary relationship goal
            </Label>
            <Select value={form.relationshipGoal} onValueChange={(v) => setForm((f) => ({ ...f, relationshipGoal: v }))}>
              <SelectTrigger className={cn(triggerCls, "mt-1 border-white bg-white")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RELATIONSHIP_GOALS.map((g) => (
                  <SelectItem key={g.value} value={g.value}>
                    {g.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 rounded-2xl bg-stone-50/90 px-3.5 py-3">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Commitment stage
            </Label>
            <Select
              value={form.commitmentIntention}
              onValueChange={(v) => setForm((f) => ({ ...f, commitmentIntention: v }))}
            >
              <SelectTrigger className={cn(triggerCls, "mt-1 border-white bg-white")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMMITMENT_INTENTION_OPTIONS.map((g) => (
                  <SelectItem key={g.value} value={g.value}>
                    {g.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 rounded-2xl bg-stone-50/90 px-3.5 py-3">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Marriage timeline
            </Label>
            <Select
              value={form.marriageTimeline || "unset"}
              onValueChange={(v) => setForm((f) => ({ ...f, marriageTimeline: v === "unset" ? "" : v }))}
            >
              <SelectTrigger className={cn(triggerCls, "mt-1 border-white bg-white")}>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unset">Not set</SelectItem>
                {MARRIAGE_TIMELINE_OPTIONS.map((g) => (
                  <SelectItem key={g.value} value={g.value}>
                    {g.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 rounded-2xl bg-stone-50/90 px-3.5 py-3">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              How you approach marriage
            </Label>
            <Select
              value={form.marriageApproach || "unset"}
              onValueChange={(v) => setForm((f) => ({ ...f, marriageApproach: v === "unset" ? "" : v }))}
            >
              <SelectTrigger className={cn(triggerCls, "mt-1 border-white bg-white")}>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unset">Not set</SelectItem>
                {MARRIAGE_APPROACH_OPTIONS.map((g) => (
                  <SelectItem key={g.value} value={g.value}>
                    {g.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 rounded-2xl bg-stone-50/90 px-3.5 py-3">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Children in the future
            </Label>
            <Select
              value={form.wantsChildren || "unset"}
              onValueChange={(v) => setForm((f) => ({ ...f, wantsChildren: v === "unset" ? "" : v }))}
            >
              <SelectTrigger className={cn(triggerCls, "mt-1 border-white bg-white")}>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unset">Not set</SelectItem>
                {WANTS_CHILDREN_OPTS.map((g) => (
                  <SelectItem key={g.value} value={g.value}>
                    {g.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </ProfilePreviewCard>

      <ProfilePreviewCard
        icon={Brain}
        title="Personality"
        description="Love language, values, and lifestyle — matches your preview cards."
      >
        <div className="space-y-4">
          <div className="space-y-1.5 rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/[0.06] to-transparent px-3.5 py-3">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-primary">Love language</Label>
            <Select
              value={form.loveLanguage || "unset"}
              onValueChange={(v) => setForm((f) => ({ ...f, loveLanguage: v === "unset" ? "" : v }))}
            >
              <SelectTrigger className={cn(triggerCls, "mt-1 bg-white")}>
                <SelectValue placeholder="Optional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unset">Not set</SelectItem>
                {LOVE_LANG.map((g) => (
                  <SelectItem key={g.value} value={g.value}>
                    {g.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Core values</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {VALUES.map((v) => (
                <button
                  key={v}
                  type="button"
                  className={chipClass(form.values.includes(v))}
                  onClick={() => setForm((f) => ({ ...f, values: toggleListItem(f.values, v) }))}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Lifestyle</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {LIFESTYLE.map((v) => (
                <button
                  key={v}
                  type="button"
                  className={chipClass(form.lifestyle.includes(v))}
                  onClick={() => setForm((f) => ({ ...f, lifestyle: toggleListItem(f.lifestyle, v) }))}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>
      </ProfilePreviewCard>

      <ProfilePreviewCard
        icon={GraduationCap}
        title="Education & work"
        description="Schooling, job, birth date, and optional income — shown on preview."
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Education</Label>
            <Select
              value={form.education || "unset"}
              onValueChange={(v) => setForm((f) => ({ ...f, education: v === "unset" ? "" : v }))}
            >
              <SelectTrigger className={triggerCls}>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unset">Not set</SelectItem>
                {EDUCATION_LEVELS.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-career" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Job / career
            </Label>
            <Input
              id="edit-career"
              className={inputCls}
              value={form.career}
              onChange={(e) => setForm((f) => ({ ...f, career: e.target.value }))}
              placeholder="e.g. Teacher, engineer"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Income range</Label>
            <Select
              value={form.incomeRange || "unset"}
              onValueChange={(v) => setForm((f) => ({ ...f, incomeRange: v === "unset" ? "" : v }))}
            >
              <SelectTrigger className={triggerCls}>
                <SelectValue placeholder="Optional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unset">Not set</SelectItem>
                {INCOME_RANGES.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Zodiac</Label>
              <Select
                value={form.zodiacSign || "unset"}
                onValueChange={(v) => setForm((f) => ({ ...f, zodiacSign: v === "unset" ? "" : v }))}
              >
                <SelectTrigger className={triggerCls}>
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unset">Not set</SelectItem>
                  {ZODIAC_SIGNS.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-birth" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Birth date
              </Label>
              <Input
                id="edit-birth"
                className={inputCls}
                type="date"
                value={form.birthDate}
                onChange={(e) => setForm((f) => ({ ...f, birthDate: e.target.value }))}
              />
            </div>
          </div>
        </div>
      </ProfilePreviewCard>

      <ProfilePreviewCard
        icon={Flame}
        title="Interests & languages"
        description="Comma-separated interests and languages — same pills and line on preview."
      >
        <div className="space-y-4">
          <div className="space-y-1.5 rounded-2xl bg-stone-50/90 px-3.5 py-3">
            <Label htmlFor="edit-interests" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Interests
            </Label>
            <Input
              id="edit-interests"
              className={cn(inputCls, "mt-1 bg-white")}
              value={form.interests}
              onChange={(e) => setForm((f) => ({ ...f, interests: e.target.value }))}
              placeholder="Travel, fitness, reading…"
            />
          </div>
          <div className="space-y-1.5 rounded-2xl bg-stone-50/90 px-3.5 py-3">
            <Label htmlFor="edit-lang" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Languages
            </Label>
            <Input
              id="edit-lang"
              className={cn(inputCls, "mt-1 bg-white")}
              value={form.languages}
              onChange={(e) => setForm((f) => ({ ...f, languages: e.target.value }))}
              placeholder="English, Arabic, …"
            />
          </div>
        </div>
      </ProfilePreviewCard>

      <ProfilePreviewCard
        icon={Globe2}
        title="Faith & communities"
        description="Background and how we surface groups — mirrors preview."
      >
        <div className="space-y-4">
          <div className="space-y-1.5 rounded-2xl bg-stone-50/90 px-3.5 py-3">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Background / faith
            </Label>
            <Select value={form.religion} onValueChange={(v) => setForm((f) => ({ ...f, religion: v }))}>
              <SelectTrigger className={cn(triggerCls, "mt-1 border-white bg-white")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RELIGION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 rounded-2xl bg-card/60 px-3.5 py-3 border border-border/70 shadow-2xs">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Community highlights
            </Label>
            <Select value={form.meetPreference} onValueChange={(v) => setForm((f) => ({ ...f, meetPreference: v }))}>
              <SelectTrigger className={cn(triggerCls, "mt-1 border-white bg-white")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MEET_PREFERENCE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </ProfilePreviewCard>

      <ProfilePreviewCard
        icon={ImageIcon}
        title="Profile banner"
        description="Wide cover used on some screens; preview hero uses your main photo."
      >
        <div className="rounded-2xl border border-border/70 bg-card/60 p-3 shadow-2xs">
          <PhotoUpload
            variant="banner"
            suppressSuccessToast
            currentPhoto={form.profileBanner}
            userId={user.id}
            onOpenPreview={(url) =>
              onImagePreview?.(url, url.trim() ? [url.trim()] : [])
            }
            onPhotoChange={(url) => {
              setForm((f) => ({ ...f, profileBanner: url || "" }));
              updateMutation.mutate({
                profileBanner: url?.trim() ? url.trim() : null,
              });
            }}
            label="Change banner"
          />
        </div>
      </ProfilePreviewCard>

      <Button
        className="h-12 w-full rounded-2xl bg-primary font-semibold text-primary-foreground shadow-2xs"
        onClick={handleSave}
        disabled={updateMutation.isPending}
      >
        {updateMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving…
          </>
        ) : (
          "Save changes"
        )}
      </Button>

      <ProfilePreviewCard
        icon={LayoutGrid}
        title="Shortcuts"
        description="Jump to matchmaker, coaching, and settings."
      >
        <div className="space-y-1">
          <button type="button" className={linkRow} onClick={onGoAIMatchmaker}>
            <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Sparkles className="h-4 w-4 text-primary" /> AI Matchmaker
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
          <button
            type="button"
            className={linkRow}
            onClick={hasPartner ? onGoCoaching : onOpenAddPartner}
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Heart className="h-4 w-4 text-primary" />
              {hasPartner ? "Relationship coaching" : "Add partner · coaching"}
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
          <button type="button" className={linkRow} onClick={() => setLocation("/settings")}>
            <span className="text-sm font-semibold text-foreground">Privacy &amp; notifications</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
          <button type="button" className={linkRow} onClick={onOpenSecurity}>
            <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Shield className="h-4 w-4 text-muted-foreground" /> Security &amp; password
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </ProfilePreviewCard>

      <ProfilePreviewCard icon={AtSign} title="Account" description="Sign-in identity — read only here.">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-stone-50/90 px-3.5 py-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Username</span>
            <span className="text-sm font-semibold text-foreground">@{user.username}</span>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-stone-50/90 px-3.5 py-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</span>
            <span className="max-w-[58%] truncate text-sm font-bold text-foreground">{user.email}</span>
          </div>
        </div>
      </ProfilePreviewCard>

    </div>
  );
}
