import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
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
import { ArrowLeft, Calendar, MapPin, Clock, DollarSign, Users, Image as ImageIcon, ClipboardList } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { buildApiUrl } from "@/services/api";
import { DEFAULT_EVENT_QUESTIONS, type EventQuestionItem } from "@/lib/eventQuestionnaireDefaults";
import { Plus, Trash2 } from "lucide-react";

export default function CreateEvent() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { userId: currentUserId } = useCurrentUser();
  const { logout } = useAuth();
  const [activePage, setActivePage] = useState('explore');

  // Redirect if not logged in
  if (!currentUserId) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <Header
          showSearch={false}
          unreadNotifications={0}
          onNotifications={() => setLocation('/notifications')}
          onCreate={() => {}}
          onSettings={() => setLocation('/profile')}
          onLogout={logout}
        />
        <div className="max-w-3xl mx-auto p-4 sm:p-6">
          <Card>
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

  const createEventMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!currentUserId) {
        throw new Error('You must be logged in to create an event');
      }
      const res = await apiRequest('POST', '/api/events', {
        ...data,
        capacity: Number(data.capacity),
        userId: currentUserId,
        hasQuestionnaire: data.hasQuestionnaire !== false,
        questionnaireQuestions: data.hasQuestionnaire && data.questionnaireQuestions?.length
          ? JSON.stringify(data.questionnaireQuestions)
          : undefined,
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Failed to create event' }));
        throw new Error(error.message || 'Failed to create event');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({
        title: "Event Created! 🎉",
        description: "Your event has been submitted for approval. You'll be notified once it's approved.",
      });
      setLocation(`/event/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Create Event",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

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

    createEventMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
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
        className="max-w-3xl mx-auto p-4 sm:p-6"
      >
        <Button
          variant="ghost"
          onClick={() => setLocation('/events')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Events
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-display">Create New Event</CardTitle>
            <CardDescription>
              Share your event with the community. All events require admin approval before going live.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
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

              {/* Image URL */}
              <div className="space-y-2">
                <Label htmlFor="image">
                  <ImageIcon className="w-4 h-4 inline mr-2" />
                  Image URL (Optional)
                </Label>
                <Input
                  id="image"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                />
              </div>

              {/* Questionnaire when RSVP */}
              <div className="space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
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
                      <div key={q.id} className="rounded-lg border border-border bg-background p-4 space-y-2">
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
                      className="w-full"
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

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation('/events')}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createEventMutation.isPending}
                  className="flex-1"
                >
                  {createEventMutation.isPending ? "Creating..." : "Create Event"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      <BottomNav active={activePage} onNavigate={setActivePage} />
    </div>
  );
}
