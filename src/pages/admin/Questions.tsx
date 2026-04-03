import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/services/api";
import {
  getDefaultOnboardingQuestionnaireItems,
  normalizeOnboardingQuestionnaire,
  type ChapterKey,
  type JourneyStyle,
  type OnboardingQuestionnaireItem,
} from "@/lib/onboardingQuestionnaire";
import { DEFAULT_EVENT_QUESTIONS, type EventQuestionItem } from "@/lib/eventQuestionnaireDefaults";
import { nanoid } from "nanoid";
import { Calendar, ClipboardList, Loader2, Plus, RotateCcw, Trash2 } from "lucide-react";

const CHAPTER_OPTIONS: { value: ChapterKey; label: string }[] = [
  { value: "who-are-you", label: "Who you are" },
  { value: "marriage-essentials", label: "Marriage essentials" },
  { value: "what-matters", label: "What matters" },
  { value: "how-connect", label: "How you connect" },
  { value: "ideal-day", label: "Ideal day / work" },
  { value: "future-together", label: "Future / astrology" },
];

const TYPE_OPTIONS = [
  "text",
  "number",
  "textarea",
  "select",
  "multi-select",
  "goal-select",
  "meet-preference-select",
  "birthday",
] as const;

const FIELD_PRESETS = [
  "name",
  "age",
  "location",
  "gender",
  "religion",
  "faithImportance",
  "bio",
  "extraBio",
  "commitmentIntention",
  "marriageTimeline",
  "marriageApproach",
  "heightCm",
  "maritalStatus",
  "hasChildren",
  "wantsChildren",
  "relationshipGoal",
  "meetPreference",
  "values",
  "lifestyle",
  "interests",
  "loveLanguage",
  "languages",
  "education",
  "career",
  "incomeRange",
  "zodiacSign",
  "birthDate",
  "nationality",
  "ethnicity",
  "smoking",
  "drinksAlcohol",
];

async function putOnboardingQuestionnaire(items: OnboardingQuestionnaireItem[]): Promise<void> {
  const res = await apiRequest("PUT", "/api/admin/onboarding-questionnaire", { items });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error((d as { message?: string }).message || "Save failed");
  }
}

async function putEventTemplate(questions: EventQuestionItem[]): Promise<void> {
  const res = await apiRequest("PUT", "/api/admin/event-questionnaire-template", { questions });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error((d as { message?: string }).message || "Save failed");
  }
}

function parseOptionsJson(s: string): { value: string; label: string }[] | undefined {
  const t = s.trim();
  if (!t) return undefined;
  try {
    const parsed = JSON.parse(t) as unknown;
    if (!Array.isArray(parsed)) return undefined;
    return parsed.map((x) => {
      if (x && typeof x === "object" && "value" in x && "label" in x) {
        return { value: String((x as { value: string }).value), label: String((x as { label: string }).label) };
      }
      return { value: String(x), label: String(x) };
    });
  } catch {
    return undefined;
  }
}

function EventRsvpTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery<{ questions: EventQuestionItem[] }>({
    queryKey: ["/api/event-questionnaire-template"],
  });
  const [local, setLocal] = useState<EventQuestionItem[]>(() => [...DEFAULT_EVENT_QUESTIONS]);

  useEffect(() => {
    if (isLoading || data === undefined) return;
    const q = data.questions;
    setLocal(Array.isArray(q) && q.length > 0 ? q.map((x) => ({ ...x })) : [...DEFAULT_EVENT_QUESTIONS]);
  }, [isLoading, data]);

  const saveMutation = useMutation({
    mutationFn: putEventTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/event-questionnaire-template"] });
      toast({ title: "Saved", description: "Default event RSVP questions updated." });
    },
    onError: (e: Error) => {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5" />
          Event RSVP defaults
        </CardTitle>
        <CardDescription>
          New events start with these questions when the RSVP questionnaire is enabled. Per-event overrides still apply.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading…
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {local.map((q, index) => (
                <div key={q.id} className="space-y-2 rounded-lg border bg-card p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-muted-foreground">Question {index + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setLocal(local.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Input
                    placeholder="Question text"
                    value={q.text}
                    onChange={(e) => {
                      const next = [...local];
                      next[index] = { ...next[index], text: e.target.value };
                      setLocal(next);
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
                      const next = [...local];
                      next[index] = {
                        ...next[index],
                        options: options.length ? options : next[index].options,
                      };
                      setLocal(next);
                    }}
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={q.required}
                      onChange={(e) => {
                        const next = [...local];
                        next[index] = { ...next[index], required: e.target.checked };
                        setLocal(next);
                      }}
                      className="rounded border-primary text-primary"
                    />
                    Required
                  </label>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const id = `q-${nanoid(8)}`;
                  setLocal([...local, { id, text: "", options: ["Option 1", "Option 2"], required: false }]);
                }}
              >
                <Plus className="mr-1 h-4 w-4" />
                Add question
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                disabled={saveMutation.isPending}
                onClick={() => saveMutation.mutate(local)}
              >
                {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save defaults
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function OnboardingTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<OnboardingQuestionnaireItem | null>(null);
  const [optionsText, setOptionsText] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: rawItems = [], isLoading } = useQuery<OnboardingQuestionnaireItem[]>({
    queryKey: ["/api/onboarding-questionnaire"],
  });

  const items = useMemo(() => normalizeOnboardingQuestionnaire(rawItems), [rawItems]);
  const editing = editingId ? items.find((r) => r.id === editingId) : null;

  useEffect(() => {
    if (editing) {
      setDraft({ ...editing });
      setOptionsText(JSON.stringify(editing.options || [], null, 2));
    } else {
      setDraft(null);
      setOptionsText("");
    }
  }, [editing]);

  const saveMutation = useMutation({
    mutationFn: putOnboardingQuestionnaire,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding-questionnaire"] });
      toast({ title: "Saved", description: "Onboarding questionnaire updated." });
    },
    onError: (e: Error) => {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    },
  });

  const updateItem = useCallback(
    (id: string, patch: Partial<OnboardingQuestionnaireItem>) => {
      const next = items.map((row) => (row.id === id ? { ...row, ...patch } : row));
      saveMutation.mutate(next);
    },
    [items, saveMutation],
  );

  const addItem = useCallback(() => {
    const maxOrder = items.reduce((m, r) => Math.max(m, r.order), 0);
    const row: OnboardingQuestionnaireItem = {
      id: `q-custom-${nanoid(8)}`,
      chapterKey: "who-are-you",
      fieldKey: "name",
      type: "text",
      labelFast: "New question",
      labelDeep: "New question",
      labelConversational: "New question",
      required: false,
      order: maxOrder + 1,
      active: true,
    };
    saveMutation.mutate([...items, row]);
    setEditingId(row.id);
  }, [items, saveMutation]);

  const saveDraft = useCallback(() => {
    if (!draft) return;
    let optionsPatch: { value: string; label: string }[] | undefined;
    const t = optionsText.trim();
    if (!t) {
      optionsPatch = undefined;
    } else {
      const parsed = parseOptionsJson(t);
      if (parsed === undefined) {
        toast({
          title: "Invalid options JSON",
          description: "Fix the JSON array or clear the field.",
          variant: "destructive",
        });
        return;
      }
      optionsPatch = parsed.length ? parsed : undefined;
    }
    const finalDraft = { ...draft, options: optionsPatch };
    const next = items.map((row) => (row.id === finalDraft.id ? finalDraft : row));
    saveMutation.mutate(next);
    setEditingId(null);
  }, [draft, items, optionsText, saveMutation, toast]);

  const deactivateOrRemove = useCallback(
    (id: string) => {
      const row = items.find((r) => r.id === id);
      const isDefault = getDefaultOnboardingQuestionnaireItems().some((d) => d.id === id);
      if (isDefault) {
        updateItem(id, { active: false });
      } else {
        saveMutation.mutate(items.filter((r) => r.id !== id));
      }
      setDeleteId(null);
      if (editingId === id) setEditingId(null);
    },
    [items, saveMutation, updateItem, editingId],
  );

  const resetDefaults = useCallback(() => {
    saveMutation.mutate(getDefaultOnboardingQuestionnaireItems());
  }, [saveMutation]);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardList className="h-5 w-5" />
              Onboarding questionnaire
            </CardTitle>
            <CardDescription>Shown in the matchmaking onboarding flow. Table toggles save immediately.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={addItem} disabled={saveMutation.isPending}>
              <Plus className="mr-1 h-4 w-4" />
              Add question
            </Button>
            <Button variant="outline" size="sm" onClick={resetDefaults} disabled={saveMutation.isPending}>
              <RotateCcw className="mr-1 h-4 w-4" />
              Reset to defaults
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading…
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left">
                    <th className="w-10 p-2">On</th>
                    <th className="p-2">Order</th>
                    <th className="p-2">Chapter</th>
                    <th className="p-2">Field</th>
                    <th className="p-2">Type</th>
                    <th className="min-w-[200px] p-2">Label (Fast)</th>
                    <th className="p-2">Req</th>
                    <th className="w-24 p-2" />
                  </tr>
                </thead>
                <tbody>
                  {[...items]
                    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
                    .map((row) => (
                      <tr key={row.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="p-2">
                          <Switch
                            checked={row.active}
                            onCheckedChange={(c) => updateItem(row.id, { active: c })}
                            disabled={saveMutation.isPending}
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            className="h-8 w-16"
                            defaultValue={row.order}
                            key={`ord-${row.id}-${row.order}`}
                            onBlur={(e) => updateItem(row.id, { order: parseInt(e.target.value, 10) || 0 })}
                            disabled={saveMutation.isPending}
                          />
                        </td>
                        <td className="p-2 text-xs">{row.chapterKey}</td>
                        <td className="p-2 font-mono text-xs">{row.fieldKey}</td>
                        <td className="p-2 text-xs">{row.type}</td>
                        <td className="max-w-xs truncate p-2" title={row.labelFast}>
                          {row.labelFast}
                        </td>
                        <td className="p-2">{row.required ? "Yes" : "—"}</td>
                        <td className="flex gap-1 p-2">
                          <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => setEditingId(row.id)}>
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => setDeleteId(row.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!draft && !!editingId} onOpenChange={(o) => !o && setEditingId(null)}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit question</DialogTitle>
            <DialogDescription className="font-mono text-xs">{draft?.id}</DialogDescription>
          </DialogHeader>
          {draft && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Chapter</Label>
                  <Select
                    value={draft.chapterKey}
                    onValueChange={(v) => setDraft((d) => (d ? { ...d, chapterKey: v as ChapterKey } : d))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CHAPTER_OPTIONS.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Field key</Label>
                  <Select
                    value={draft.fieldKey}
                    onValueChange={(v) => setDraft((d) => (d ? { ...d, fieldKey: v } : d))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {FIELD_PRESETS.map((f) => (
                        <SelectItem key={f} value={f}>
                          {f}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={draft.type}
                    onValueChange={(v) =>
                      setDraft((d) => (d ? { ...d, type: v as OnboardingQuestionnaireItem["type"] } : d))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPE_OPTIONS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end gap-3 pb-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={draft.required}
                      onCheckedChange={(c) => setDraft((d) => (d ? { ...d, required: c } : d))}
                    />
                    <Label>Required</Label>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Label — Fast</Label>
                <Input
                  value={draft.labelFast}
                  onChange={(e) => setDraft((d) => (d ? { ...d, labelFast: e.target.value } : d))}
                />
              </div>
              <div className="space-y-2">
                <Label>Label — Deep</Label>
                <Input
                  value={draft.labelDeep}
                  onChange={(e) => setDraft((d) => (d ? { ...d, labelDeep: e.target.value } : d))}
                />
              </div>
              <div className="space-y-2">
                <Label>Label — Conversational</Label>
                <Input
                  value={draft.labelConversational}
                  onChange={(e) => setDraft((d) => (d ? { ...d, labelConversational: e.target.value } : d))}
                />
              </div>
              <div className="space-y-2">
                <Label>Placeholder</Label>
                <Input
                  value={draft.placeholder || ""}
                  onChange={(e) => setDraft((d) => (d ? { ...d, placeholder: e.target.value || undefined } : d))}
                />
              </div>
              <div className="space-y-2">
                <Label>Max (multi-select)</Label>
                <Input
                  type="number"
                  value={draft.max ?? ""}
                  onChange={(e) =>
                    setDraft((d) =>
                      d ? { ...d, max: e.target.value ? parseInt(e.target.value, 10) : undefined } : d,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Min length (textarea)</Label>
                <Input
                  type="number"
                  value={draft.minLength ?? ""}
                  onChange={(e) =>
                    setDraft((d) =>
                      d ? { ...d, minLength: e.target.value ? parseInt(e.target.value, 10) : undefined } : d,
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Journey styles</Label>
                <div className="flex flex-wrap gap-3">
                  {(["fast", "deep", "conversational"] as const).map((s) => {
                    const all = !draft.styles || draft.styles.length === 0;
                    const on = all || (draft.styles?.includes(s) ?? false);
                    return (
                      <label key={s} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={() => {
                            setDraft((d) => {
                              if (!d) return d;
                              let cur = new Set<JourneyStyle>(
                                !d.styles || d.styles.length === 0
                                  ? ["fast", "deep", "conversational"]
                                  : d.styles,
                              );
                              if (cur.has(s)) cur.delete(s);
                              else cur.add(s);
                              const next = Array.from(cur);
                              return {
                                ...d,
                                styles: next.length === 0 || next.length === 3 ? undefined : next,
                              };
                            });
                          }}
                        />
                        {s}
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Options JSON (select / multi-select)</Label>
                <Textarea
                  rows={6}
                  placeholder='[{"value":"a","label":"A"}]'
                  value={optionsText}
                  onChange={(e) => setOptionsText(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="secondary" onClick={() => setEditingId(null)}>
              Cancel
            </Button>
            <Button onClick={saveDraft} disabled={saveMutation.isPending || !draft}>
              {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove or deactivate?</AlertDialogTitle>
            <AlertDialogDescription>
              Built-in questions are deactivated (hidden). Custom questions are removed from the list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deactivateOrRemove(deleteId)}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function Questions() {
  return (
    <AdminLayout>
      <div className="mx-auto max-w-5xl space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold">Questions</h1>
          <p className="text-muted-foreground">Event RSVP defaults and onboarding questionnaire.</p>
        </div>
        <Tabs defaultValue="event" className="w-full">
          <TabsList>
            <TabsTrigger value="event">Event RSVP</TabsTrigger>
            <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
          </TabsList>
          <TabsContent value="event" className="mt-4">
            <EventRsvpTab />
          </TabsContent>
          <TabsContent value="onboarding" className="mt-4">
            <OnboardingTab />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
