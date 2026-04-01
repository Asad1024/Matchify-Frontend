import { useRef, useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation, useSearchParams } from "wouter";
import { motion } from "framer-motion";
import Header from "@/components/common/Header";
import BottomNav from "@/components/common/BottomNav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  Users,
  ClipboardList,
  ImagePlus,
  Loader2,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { buildApiUrl } from "@/services/api";
import { uploadPostPhoto } from "@/services/upload.service";
import { DEFAULT_EVENT_QUESTIONS, type EventQuestionItem } from "@/lib/eventQuestionnaireDefaults";
import { Plus, Trash2 } from "lucide-react";

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

function apiErrorMessage(err: unknown): string {
  if (!(err instanceof Error)) return "Something went wrong. Try again.";
  const raw = err.message;
  const m = raw.match(/^\d+:\s*([\s\S]+)$/);
  const payload = m?.[1] ?? raw;
  try {
    const j = JSON.parse(payload) as { message?: string };
    if (j?.message && typeof j.message === "string") return j.message;
  } catch {
    /* plain text */
  }
  return payload.length > 200 ? `${payload.slice(0, 197)}…` : payload;
}

export default function CreateEvent() {
  const [, setLocation] = useLocation();
  const [searchParams] = useSearchParams();
  const fromAdmin = searchParams.get("from") === "admin";
  const editEventId = searchParams.get("edit")?.trim() || "";
  const eventsBackPath = fromAdmin
    ? "/admin/events"
    : searchParams.get("from") === "explore"
      ? "/explore?tab=events"
      : "/events";
  const returnFromExploreRef = useRef(false);
  returnFromExploreRef.current = searchParams.get("from") === "explore";
  const { toast } = useToast();
  const { userId: currentUserId } = useCurrentUser();
  const { logout } = useAuth();
  const [activePage, setActivePage] = useState("explore");
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageFileRef = useRef<HTMLInputElement>(null);

  // Redirect if not logged in
  if (!currentUserId) {
    return (
      <div className="min-h-screen bg-[hsl(var(--surface-2))] pb-24">
        <Header
          showSearch={false}
          unreadNotifications={0}
          onNotifications={() => setLocation('/notifications')}
          onCreate={() => {}}
          onSettings={() => setLocation('/profile')}
          onLogout={logout}
        />
        <div className="mx-auto max-w-lg px-4 pb-6 pt-2">
          <Card className="matchify-surface rounded-[24px] border-white/0 bg-card/70">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground mb-4">You must be logged in to create an event.</p>
              <Button onClick={() => setLocation('/login')}>Go to Login</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    type: "offline" as "online" | "offline",
    capacity: 50,
    price: "Free",
    image: "",
    hasQuestionnaire: true,
    questionnaireQuestions: [...DEFAULT_EVENT_QUESTIONS] as EventQuestionItem[],
  });

  const editHydratedRef = useRef(false);

  const { data: existingEvent, isLoading: loadingExistingEvent } = useQuery({
    queryKey: ["/api/events", editEventId],
    enabled: !!editEventId,
    queryFn: async () => {
      const res = await fetch(buildApiUrl(`/api/events/${editEventId}`), {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load event");
      return (await res.json()) as Record<string, unknown>;
    },
  });

  useEffect(() => {
    if (!editEventId || !existingEvent || editHydratedRef.current) return;
    editHydratedRef.current = true;
    let questions: EventQuestionItem[] = [...DEFAULT_EVENT_QUESTIONS];
    const raw = existingEvent.questionnaireQuestions;
    if (typeof raw === "string" && raw.trim()) {
      try {
        const parsed = JSON.parse(raw) as EventQuestionItem[];
        if (Array.isArray(parsed) && parsed.length > 0) questions = parsed;
      } catch {
        /* keep defaults */
      }
    }
    setFormData({
      title: String(existingEvent.title ?? ""),
      description: String(existingEvent.description ?? ""),
      date: String(existingEvent.date ?? ""),
      time: String(existingEvent.time ?? ""),
      location: String(existingEvent.location ?? ""),
      type: existingEvent.type === "online" ? "online" : "offline",
      capacity: Math.max(1, Number(existingEvent.capacity) || 50),
      price: String(existingEvent.price ?? "Free"),
      image: String(existingEvent.image ?? ""),
      hasQuestionnaire: existingEvent.hasQuestionnaire !== false,
      questionnaireQuestions: questions,
    });
  }, [editEventId, existingEvent]);

  const saveEventMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!currentUserId) {
        throw new Error("You must be logged in to create an event");
      }
      const imageTrim = data.image?.trim() || "";
      let hasBearer = false;
      try {
        hasBearer = !!localStorage.getItem("authToken");
      } catch {
        /* ignore */
      }
      const questionnaireQuestions =
        data.hasQuestionnaire && data.questionnaireQuestions?.length
          ? JSON.stringify(data.questionnaireQuestions)
          : undefined;
      const baseBody: Record<string, unknown> = {
        title: data.title,
        description: data.description,
        date: data.date,
        time: data.time,
        location: data.location,
        type: data.type,
        capacity: Number(data.capacity),
        price: data.price,
        image: imageTrim || undefined,
        hasQuestionnaire: data.hasQuestionnaire !== false,
        questionnaireQuestions,
      };
      if (!editEventId && !hasBearer) {
        baseBody.userId = currentUserId;
      }

      let res: Response;
      if (editEventId) {
        res = await apiRequest("PATCH", `/api/events/${editEventId}`, baseBody);
      } else if (fromAdmin) {
        res = await apiRequest("POST", "/api/admin/events", baseBody);
      } else {
        res = await apiRequest("POST", "/api/events", baseBody);
      }

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        let message = editEventId ? "Failed to update event" : "Failed to create event";
        try {
          const j = JSON.parse(text) as { message?: string };
          if (j?.message) message = j.message;
        } catch {
          if (text) message = text.length > 200 ? `${text.slice(0, 197)}…` : text;
        }
        throw new Error(message);
      }
      if (res.status === 204) {
        return { id: editEventId };
      }
      return res.json();
    },
    onSuccess: (data: { id?: string }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      if (editEventId) {
        queryClient.invalidateQueries({ queryKey: [`/api/events/${editEventId}`] });
      }
      if (fromAdmin) {
        toast({
          title: editEventId ? "Event updated" : "Event created",
          description: editEventId
            ? "Changes are saved and visible in the app."
            : "The event is live (approved) in demo mode.",
        });
        setLocation("/admin/events");
        return;
      }
      toast({
        title: "Event created",
        description:
          "Your event has been submitted for approval. You'll be notified once it's approved.",
      });
      const id = data?.id ?? editEventId;
      if (id) {
        setLocation(
          returnFromExploreRef.current ? `/event/${id}?from=explore` : `/event/${id}`,
        );
      }
    },
    onError: (error: Error) => {
      toast({
        title: editEventId ? "Failed to save event" : "Failed to Create Event",
        description: apiErrorMessage(error),
        variant: "destructive",
      });
    },
  });

  const handlePickEventImage = () => imageFileRef.current?.click();

  const handleEventImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Not an image",
        description: "Choose a photo (JPEG, PNG, WebP, etc.).",
        variant: "destructive",
      });
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      toast({
        title: "File too large",
        description: "Photos must be 8 MB or smaller.",
        variant: "destructive",
      });
      return;
    }
    setUploadingImage(true);
    try {
      const url = await uploadPostPhoto(file);
      setFormData((prev) => ({ ...prev, image: url }));
      toast({ title: "Cover photo ready", description: "Preview below — it will be saved with your event." });
    } catch (err) {
      toast({
        title: "Upload failed",
        description: apiErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter an event title",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.description.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter an event description",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.date) {
      toast({
        title: "Validation Error",
        description: "Please select an event date",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.time) {
      toast({
        title: "Validation Error",
        description: "Please enter an event time",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.location.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter an event location",
        variant: "destructive",
      });
      return;
    }

    saveEventMutation.mutate(formData);
  };

  if (editEventId && loadingExistingEvent) {
    return (
      <div className="min-h-screen bg-[hsl(var(--surface-2))] pb-24">
        <Header
          showSearch={false}
          unreadNotifications={0}
          onNotifications={() => setLocation("/notifications")}
          onCreate={() => {}}
          onSettings={() => setLocation("/profile")}
          onLogout={logout}
        />
        <div className="mx-auto max-w-lg px-4 py-12 text-center text-muted-foreground">
          Loading event…
        </div>
        {!fromAdmin ? <BottomNav active={activePage} onNavigate={setActivePage} /> : null}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--surface-2))] pb-24">
      <Header
        showSearch={false}
        unreadNotifications={0}
        onNotifications={() => setLocation('/notifications')}
        onCreate={() => {}}
        onSettings={() => setLocation('/profile')}
        onLogout={logout}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto w-full min-w-0 max-w-lg px-3 pb-6 pt-2"
      >
        <Button
          variant="ghost"
          onClick={() => setLocation(eventsBackPath)}
          className="mb-3 -ml-2 h-10 px-2 text-slate-700 hover:bg-slate-900/[0.03]"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {fromAdmin
            ? "Back to Admin Events"
            : searchParams.get("from") === "explore"
              ? "Back to Explore"
              : "Back to Events"}
        </Button>

        <Card className="matchify-surface overflow-hidden border-white/0 bg-card/70">
          <CardHeader className="space-y-1 border-b border-border/70 pb-4">
            <CardTitle className="font-display text-xl sm:text-2xl">
              {editEventId ? "Edit Event" : fromAdmin ? "Create Event (Admin)" : "Create New Event"}
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              {fromAdmin
                ? "Create or edit events directly. In demo mode, new events are approved immediately."
                : "Share your event with the community. All events require admin approval before going live."}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="min-w-0 space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Speed Dating Night"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Tell people about your event..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={5}
                  required
                />
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Date *
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">
                    <Clock className="w-4 h-4 inline mr-2" />
                    Time *
                  </Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Location *
                </Label>
                <Input
                  id="location"
                  placeholder="e.g., The Social Hub, Dubai Marina"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                />
              </div>

              {/* Type and Capacity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Event Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: "online" | "offline") => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="offline">Offline</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">
                    <Users className="w-4 h-4 inline mr-2" />
                    Capacity *
                  </Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
                    required
                  />
                </div>
              </div>

              {/* Price */}
              <div className="space-y-2">
                <Label htmlFor="price">
                  <DollarSign className="w-4 h-4 inline mr-2" />
                  Price
                </Label>
                <Input
                  id="price"
                  placeholder="e.g., Free, AED 150, $25"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>

              {/* Cover image: upload + preview (same flow as posts) */}
              <div className="space-y-3 rounded-[22px] border border-stone-200 bg-stone-50/70 p-4">
                <Label className="text-sm font-semibold text-slate-900">Cover image (optional)</Label>
                <input
                  ref={imageFileRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleEventImageFile}
                  aria-hidden
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full border-stone-200 bg-white"
                    disabled={uploadingImage || saveEventMutation.isPending}
                    onClick={handlePickEventImage}
                  >
                    {uploadingImage ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ImagePlus className="mr-2 h-4 w-4" />
                    )}
                    {uploadingImage ? "Uploading…" : "Upload image"}
                  </Button>
                  {formData.image.trim() ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="rounded-full text-destructive hover:text-destructive"
                      onClick={() => setFormData({ ...formData, image: "" })}
                    >
                      Remove photo
                    </Button>
                  ) : null}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Or paste an image URL (e.g. from the web).
                </p>
                <Input
                  id="image"
                  type="url"
                  placeholder="https://…"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="rounded-xl"
                />
                {formData.image.trim() ? (
                  <div className="overflow-hidden rounded-[18px] border border-stone-200 bg-white">
                    <img
                      src={formData.image.trim()}
                      alt=""
                      className="max-h-52 w-full object-contain bg-black/[0.03]"
                    />
                  </div>
                ) : null}
              </div>

              {/* Questionnaire when RSVP */}
              <div className="space-y-4 rounded-[22px] border border-primary/15 bg-gradient-to-br from-primary/[0.08] via-white to-white p-4">
                <div className="flex items-center gap-3">
                  <ClipboardList className="w-5 h-5 text-primary shrink-0" />
                  <div className="flex-1">
                    <Label htmlFor="hasQuestionnaire" className="cursor-pointer font-medium">
                      Match questionnaire when attendees RSVP
                    </Label>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Attendees will see a short questionnaire after RSVPing so you can match them at the event.
                    </p>
                  </div>
                  <input
                    id="hasQuestionnaire"
                    type="checkbox"
                    checked={formData.hasQuestionnaire}
                    onChange={(e) => setFormData({ ...formData, hasQuestionnaire: e.target.checked })}
                    className="h-4 w-4 rounded border-primary text-primary"
                  />
                </div>
                {formData.hasQuestionnaire && (
                  <div className="border-t border-primary/20 pt-4 space-y-4">
                    <p className="text-sm font-medium text-foreground">Set up questions (attendees answer these when they RSVP)</p>
                    {formData.questionnaireQuestions.map((q, index) => (
                      <div
                        key={q.id}
                        className="space-y-2 rounded-[22px] border border-stone-200 bg-white p-4 shadow-sm"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-muted-foreground font-medium">Question {index + 1}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => {
                              const next = formData.questionnaireQuestions.filter((_, i) => i !== index);
                              setFormData({ ...formData, questionnaireQuestions: next });
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <Input
                          placeholder="Question text"
                          value={q.text}
                          onChange={(e) => {
                            const next = [...formData.questionnaireQuestions];
                            next[index] = { ...next[index], text: e.target.value };
                            setFormData({ ...formData, questionnaireQuestions: next });
                          }}
                        />
                        <Textarea
                          placeholder="Options (one per line or comma-separated)"
                          value={q.options.join("\n")}
                          rows={2}
                          className="text-sm"
                          onChange={(e) => {
                            const raw = e.target.value;
                            const options = raw.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
                            const next = [...formData.questionnaireQuestions];
                            next[index] = { ...next[index], options: options.length ? options : next[index].options };
                            setFormData({ ...formData, questionnaireQuestions: next });
                          }}
                        />
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={q.required}
                            onChange={(e) => {
                              const next = [...formData.questionnaireQuestions];
                              next[index] = { ...next[index], required: e.target.checked };
                              setFormData({ ...formData, questionnaireQuestions: next });
                            }}
                            className="rounded border-primary text-primary"
                          />
                          Required
                        </label>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full rounded-full border-stone-200 bg-white"
                      onClick={() => {
                        const id = `q${Date.now()}`;
                        setFormData({
                          ...formData,
                          questionnaireQuestions: [
                            ...formData.questionnaireQuestions,
                            { id, text: "", options: ["Option 1", "Option 2"], required: false },
                          ],
                        });
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add question
                    </Button>
                  </div>
                )}
              </div>

              {/* Submit */}
              <div className="flex flex-col gap-3 border-t border-border/70 pt-4 sm:flex-row sm:gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation(eventsBackPath)}
                  className="h-11 flex-1 rounded-full border-stone-200 bg-white font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saveEventMutation.isPending || uploadingImage}
                  className="h-11 flex-1 rounded-full font-semibold"
                >
                  {saveEventMutation.isPending
                    ? editEventId
                      ? "Saving…"
                      : "Creating…"
                    : editEventId
                      ? "Save changes"
                      : "Create Event"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {!fromAdmin ? <BottomNav active={activePage} onNavigate={setActivePage} /> : null}
    </div>
  );
}
