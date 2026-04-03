import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, MoreHorizontal, Plus, Pencil, Trash2, Loader2, Upload } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { buildApiUrl, getAuthHeaders } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

type AdminCourseRow = {
  id: string;
  title: string;
  description: string;
  duration?: string;
  level?: string;
  image?: string | null;
  price?: number;
  resourceUrl?: string | null;
  resourceName?: string | null;
  isFree?: boolean | number | null;
  createdAt?: string;
};

type EditorForm = {
  title: string;
  description: string;
  duration: string;
  level: string;
  image: string;
  resourceUrl: string;
  resourceName: string;
  price: string;
  isFree: boolean;
};

const emptyForm = (): EditorForm => ({
  title: "",
  description: "",
  duration: "Self-paced",
  level: "All levels",
  image: "",
  resourceUrl: "",
  resourceName: "",
  price: "0",
  isFree: true,
});

function rowToForm(c: AdminCourseRow): EditorForm {
  const fr = c.isFree === false || c.isFree === 0;
  return {
    title: c.title || "",
    description: c.description || "",
    duration: c.duration || "Self-paced",
    level: c.level || "All levels",
    image: (c.image as string) || "",
    resourceUrl: (c.resourceUrl as string) || "",
    resourceName: (c.resourceName as string) || "",
    price: String(c.price ?? 0),
    isFree: !fr,
  };
}

export default function AdminCourses() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EditorForm>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<AdminCourseRow | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/admin/courses", search, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        search,
        page: String(page),
        limit: "50",
      });
      const url = buildApiUrl(`/api/admin/courses?${params.toString()}`);
      const res = await fetch(url, { credentials: "include", headers: getAuthHeaders(false) });
      if (!res.ok) {
        const t = await res.text();
        try {
          throw new Error(JSON.parse(t).message);
        } catch {
          throw new Error(`HTTP ${res.status}`);
        }
      }
      return res.json() as Promise<{ courses: AdminCourseRow[]; totalPages: number; total: number }>;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: { id: string | null; body: Record<string, unknown> }) => {
      const url = payload.id
        ? buildApiUrl(`/api/admin/courses/${payload.id}`)
        : buildApiUrl("/api/admin/courses");
      const res = await fetch(url, {
        method: payload.id ? "PATCH" : "POST",
        credentials: "include",
        headers: getAuthHeaders(true),
        body: JSON.stringify(payload.body),
      });
      const text = await res.text();
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const j = JSON.parse(text) as { message?: string };
          if (j?.message) msg = j.message;
        } catch {
          if (text) msg = text.slice(0, 200);
        }
        throw new Error(msg);
      }
      return text ? JSON.parse(text) : {};
    },
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      refetch();
      toast({ title: vars.id ? "Course updated" : "Course created" });
      setEditorOpen(false);
      setEditingId(null);
      setForm(emptyForm());
    },
    onError: (e: Error) => toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(buildApiUrl(`/api/admin/courses/${id}`), {
        method: "DELETE",
        credentials: "include",
        headers: getAuthHeaders(false),
      });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      refetch();
      toast({ title: "Course deleted" });
      setDeleteTarget(null);
    },
    onError: () => toast({ title: "Delete failed", variant: "destructive" }),
  });

  const uploadFile = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(buildApiUrl("/api/admin/upload-course-file"), {
      method: "POST",
      credentials: "include",
      headers: getAuthHeaders(false),
      body: fd,
    });
    const text = await res.text();
    if (!res.ok) {
      let msg = "Upload failed";
      try {
        msg = JSON.parse(text).message || msg;
      } catch {
        /* ignore */
      }
      throw new Error(msg);
    }
    return JSON.parse(text) as { url: string; name: string };
  };

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const { url, name } = await uploadFile(file);
      setForm((f) => ({ ...f, resourceUrl: url, resourceName: name }));
      toast({ title: "File uploaded", description: name });
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
    }
  };

  const submitEditor = () => {
    const price = Math.max(0, parseInt(form.price, 10) || 0);
    const body = {
      title: form.title.trim(),
      description: form.description.trim(),
      duration: form.duration.trim() || "Self-paced",
      level: form.level.trim() || "All levels",
      image: form.image.trim() || null,
      resourceUrl: form.resourceUrl.trim() || null,
      resourceName: form.resourceName.trim() || null,
      price,
      isFree: form.isFree,
    };
    if (!body.title || !body.description) {
      toast({ title: "Title and description required", variant: "destructive" });
      return;
    }
    saveMutation.mutate({ id: editingId, body });
  };

  const courses = data?.courses || [];
  const totalPages = data?.totalPages || 1;

  return (
    <AdminLayout>
      <div className="space-y-4 p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">Courses</h1>
            <p className="text-sm text-muted-foreground">Create and manage member courses (PDFs, free / paid)</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative min-w-[200px]">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search title or description…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-8"
              />
            </div>
            <Button
              type="button"
              className="gap-2"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm());
                setEditorOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              New course
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading…
          </div>
        ) : error ? (
          <Card>
            <div className="p-6 text-center">
              <p className="mb-4 text-sm text-destructive">
                {error instanceof Error ? error.message : "Error"}
              </p>
              <Button onClick={() => refetch()}>Retry</Button>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead className="whitespace-nowrap">Access</TableHead>
                    <TableHead className="whitespace-nowrap">File</TableHead>
                    <TableHead className="whitespace-nowrap">Created</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                        No courses
                      </TableCell>
                    </TableRow>
                  ) : (
                    courses.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="max-w-[220px]">
                          <p className="font-medium truncate">{c.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{c.description}</p>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {c.isFree === false || c.isFree === 0 ? (
                            <span>Paid {c.price ? `($${c.price})` : ""}</span>
                          ) : (
                            "Free"
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {c.resourceUrl ? "Yes" : "—"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Actions">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onSelect={() => {
                                  setEditingId(c.id);
                                  setForm(rowToForm(c));
                                  setEditorOpen(true);
                                }}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onSelect={() => setDeleteTarget(c)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Previous
            </Button>
            <span className="flex items-center px-3 text-sm">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      <Dialog
        open={editorOpen}
        onOpenChange={(o) => {
          setEditorOpen(o);
          if (!o) {
            setEditingId(null);
            setForm(emptyForm());
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit course" : "New course"}</DialogTitle>
            <DialogDescription>
              Members see this in Courses. Paid courses use the same simulated checkout as coach bookings (one tap to
              unlock).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid gap-1.5">
              <Label htmlFor="c-title">Title</Label>
              <Input
                id="c-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="c-desc">Description</Label>
              <Textarea
                id="c-desc"
                rows={4}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-1.5">
                <Label htmlFor="c-dur">Duration label</Label>
                <Input
                  id="c-dur"
                  value={form.duration}
                  onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="c-level">Level</Label>
                <Input
                  id="c-level"
                  value={form.level}
                  onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="c-image">Cover image URL</Label>
              <Input
                id="c-image"
                value={form.image}
                onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
                placeholder="https://…"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Course file (PDF, etc.)</Label>
              <input ref={fileInputRef} type="file" className="hidden" onChange={onPickFile} />
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4" />
                  Upload
                </Button>
                {form.resourceUrl ? (
                  <span className="text-xs text-muted-foreground truncate max-w-[200px]">{form.resourceName || "File set"}</span>
                ) : (
                  <span className="text-xs text-muted-foreground">Optional</span>
                )}
              </div>
              <Input
                placeholder="Or paste file URL"
                value={form.resourceUrl}
                onChange={(e) => setForm((f) => ({ ...f, resourceUrl: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="c-free"
                checked={form.isFree}
                onCheckedChange={(c) => setForm((f) => ({ ...f, isFree: c === true }))}
              />
              <Label htmlFor="c-free" className="cursor-pointer font-normal">
                Free course (uncheck for paid)
              </Label>
            </div>
            {!form.isFree && (
              <div className="grid gap-1.5">
                <Label htmlFor="c-price">Price (USD, whole dollars)</Label>
                <Input
                  id="c-price"
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value.replace(/[^\d]/g, "") }))}
                />
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditorOpen(false)}>
                Cancel
              </Button>
              <Button type="button" disabled={saveMutation.isPending} onClick={submitEditor}>
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? "Save" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{deleteTarget?.title}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              Removes enrollments for this course and the course itself. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
