import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MoreHorizontal, Trash2, Users, ExternalLink, Eye, Loader2, Plus, Pencil } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import AdminLayout from "@/components/admin/AdminLayout";
import { buildApiUrl, getAuthHeaders } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { RELIGION_OPTIONS } from "@/lib/religionOptions";

type AdminGroupRow = {
  id: string;
  name: string;
  description?: string | null;
  tags?: unknown;
  image?: string | null;
  creatorId?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  memberCount?: number;
  filterByReligion?: boolean | number | null;
  targetReligion?: string | null;
  filterByCountry?: boolean | number | null;
  targetCountry?: string | null;
  membershipMode?: string | null;
};

type GroupEditorForm = {
  name: string;
  description: string;
  filterByReligion: boolean;
  targetReligion: string;
  filterByCountry: boolean;
  targetCountry: string;
  membershipMode: "open" | "join";
  image: string;
};

const emptyEditorForm = (): GroupEditorForm => ({
  name: "",
  description: "",
  filterByReligion: false,
  targetReligion: "",
  filterByCountry: false,
  targetCountry: "",
  membershipMode: "join",
  image: "",
});

function rowToEditorForm(g: AdminGroupRow): GroupEditorForm {
  const fr = g.filterByReligion === true || g.filterByReligion === 1;
  const fc = g.filterByCountry === true || g.filterByCountry === 1;
  const mode = g.membershipMode === "open" ? "open" : "join";
  return {
    name: g.name || "",
    description: (g.description as string) || "",
    filterByReligion: fr,
    targetReligion: (g.targetReligion as string) || "",
    filterByCountry: fc,
    targetCountry: (g.targetCountry as string) || "",
    membershipMode: mode,
    image: (g.image as string) || "",
  };
}

type GroupMemberRow = {
  id: string;
  userId: string;
  createdAt?: string | null;
  user: {
    id?: string;
    name?: string | null;
    username?: string | null;
    email?: string | null;
    avatar?: string | null;
  } | null;
};

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name_asc", label: "Name A–Z" },
  { value: "name_desc", label: "Name Z–A" },
  { value: "members_desc", label: "Most members" },
  { value: "members_asc", label: "Fewest members" },
] as const;

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    headers: getAuthHeaders(false),
  });
  if (!res.ok) {
    const t = await res.text();
    try {
      throw new Error(JSON.parse(t).message || `HTTP ${res.status}`);
    } catch {
      throw new Error(t || `HTTP ${res.status}`);
    }
  }
  return res.json() as Promise<T>;
}

export default function Groups() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<string>("newest");
  const [minMembers, setMinMembers] = useState<string>("");
  const [deleteGroup, setDeleteGroup] = useState<AdminGroupRow | null>(null);
  const [detailGroup, setDetailGroup] = useState<AdminGroupRow | null>(null);
  const [membersForGroup, setMembersForGroup] = useState<AdminGroupRow | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorGroupId, setEditorGroupId] = useState<string | null>(null);
  const [editorForm, setEditorForm] = useState<GroupEditorForm>(emptyEditorForm);
  const { toast } = useToast();

  const minMembersNum = Math.max(0, parseInt(minMembers, 10) || 0);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/admin/groups", search, page, sort, minMembersNum],
    queryFn: async () => {
      const params = new URLSearchParams({
        search,
        page: String(page),
        limit: "50",
        sort,
        minMembers: String(minMembersNum),
      });
      const url = buildApiUrl(`/api/admin/groups?${params.toString()}`);
      return fetchJson<{ groups: AdminGroupRow[]; totalPages: number; total: number }>(url);
    },
  });

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ["/api/admin/groups/detail", detailGroup?.id],
    enabled: !!detailGroup?.id,
    queryFn: async () => {
      const url = buildApiUrl(`/api/admin/groups/${detailGroup!.id}`);
      return fetchJson<AdminGroupRow & { memberCount?: number }>(url);
    },
  });

  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ["/api/admin/groups/members", membersForGroup?.id],
    enabled: !!membersForGroup?.id,
    queryFn: async () => {
      const url = buildApiUrl(`/api/admin/groups/${membersForGroup!.id}/members`);
      return fetchJson<{ members: GroupMemberRow[] }>(url);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(buildApiUrl(`/api/admin/groups/${id}`), {
        method: "DELETE",
        credentials: "include",
        headers: getAuthHeaders(false),
      });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/groups"] });
      refetch();
      toast({ title: "Group deleted" });
      setDeleteGroup(null);
      setDetailGroup(null);
      setMembersForGroup(null);
    },
    onError: () => toast({ title: "Error", description: "Failed to delete group", variant: "destructive" }),
  });

  const saveGroupMutation = useMutation({
    mutationFn: async ({ id, form }: { id: string | null; form: GroupEditorForm }) => {
      const body = {
        name: form.name.trim(),
        description: form.description.trim(),
        filterByReligion: form.filterByReligion,
        targetReligion: form.filterByReligion ? form.targetReligion.trim() : null,
        filterByCountry: form.filterByCountry,
        targetCountry: form.filterByCountry ? form.targetCountry.trim() : null,
        membershipMode: form.membershipMode,
        image: form.image.trim() || null,
      };
      if (!body.name || !body.description) {
        throw new Error("Name and description are required");
      }
      const url = id ? buildApiUrl(`/api/admin/groups/${id}`) : buildApiUrl("/api/admin/groups");
      const res = await fetch(url, {
        method: id ? "PATCH" : "POST",
        credentials: "include",
        headers: getAuthHeaders(true),
        body: JSON.stringify(body),
      });
      const text = await res.text();
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const j = JSON.parse(text) as { message?: string };
          if (j?.message && typeof j.message === "string") msg = j.message;
        } catch {
          if (text) msg = text.length > 200 ? `${text.slice(0, 197)}…` : text;
        }
        throw new Error(msg);
      }
      return text ? JSON.parse(text) : {};
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/groups"] });
      refetch();
      toast({ title: vars.id ? "Group updated" : "Group created" });
      setEditorOpen(false);
      setEditorGroupId(null);
      setEditorForm(emptyEditorForm());
    },
    onError: (e: Error) =>
      toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });

  const openCreateGroup = () => {
    setEditorGroupId(null);
    setEditorForm(emptyEditorForm());
    setEditorOpen(true);
  };

  const openEditGroup = (g: AdminGroupRow) => {
    setEditorGroupId(g.id);
    setEditorForm(rowToEditorForm(g));
    setEditorOpen(true);
  };

  const groups = data?.groups || [];
  const totalPages = data?.totalPages || 1;

  return (
    <AdminLayout>
      <div className="space-y-4 p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">Groups</h1>
              <p className="text-sm text-muted-foreground">Create, edit, or remove community groups</p>
            </div>
            <Button type="button" onClick={openCreateGroup} className="shrink-0 gap-2">
              <Plus className="h-4 w-4" />
              New group
            </Button>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name or description…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-8"
              />
            </div>
            <div className="grid w-full gap-1.5 sm:w-44">
              <Label className="text-xs text-muted-foreground">Sort</Label>
              <Select
                value={sort}
                onValueChange={(v) => {
                  setSort(v);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid w-full gap-1.5 sm:w-32">
              <Label className="text-xs text-muted-foreground">Min members</Label>
              <Input
                type="number"
                min={0}
                placeholder="0"
                value={minMembers}
                onChange={(e) => {
                  setMinMembers(e.target.value.replace(/[^\d]/g, ""));
                  setPage(1);
                }}
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading groups…
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
                    <TableHead className="whitespace-nowrap">Name</TableHead>
                    <TableHead className="whitespace-nowrap">Description</TableHead>
                    <TableHead className="whitespace-nowrap">Access</TableHead>
                    <TableHead className="whitespace-nowrap">Audience</TableHead>
                    <TableHead className="whitespace-nowrap">Members</TableHead>
                    <TableHead className="whitespace-nowrap">Created</TableHead>
                    <TableHead className="w-12 text-right"> </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groups.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                        No groups match your filters
                      </TableCell>
                    </TableRow>
                  ) : (
                    groups.map((g) => (
                      <TableRow key={g.id}>
                        <TableCell className="whitespace-nowrap font-medium">{g.name}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                          {g.description || "—"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {g.membershipMode === "open" ? "Open" : "Join"}
                        </TableCell>
                        <TableCell className="max-w-[140px] truncate text-xs text-muted-foreground">
                          {[
                            g.filterByReligion === true || g.filterByReligion === 1
                              ? `Faith: ${g.targetReligion || "?"}`
                              : null,
                            g.filterByCountry === true || g.filterByCountry === 1
                              ? `Place: ${g.targetCountry || "?"}`
                              : null,
                          ]
                            .filter(Boolean)
                            .join(" · ") || "Anyone"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{g.memberCount ?? 0}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {g.createdAt ? new Date(g.createdAt).toLocaleDateString() : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Group actions">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                              <DropdownMenuItem onSelect={() => setDetailGroup(g)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View group
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => openEditGroup(g)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit group
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => setMembersForGroup(g)}>
                                <Users className="mr-2 h-4 w-4" />
                                View members
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => setLocation(`/group/${g.id}`)}>
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Open in app
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onSelect={() => setDeleteGroup(g)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete group
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

      <Dialog open={!!detailGroup} onOpenChange={(open) => !open && setDetailGroup(null)}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{detailData?.name ?? detailGroup?.name ?? "Group"}</DialogTitle>
            <DialogDescription>Admin view — metadata and identifiers</DialogDescription>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex justify-center py-8 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : detailData ? (
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs font-medium text-muted-foreground">ID</p>
                <p className="font-mono text-xs break-all">{detailData.id}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Description</p>
                <p className="whitespace-pre-wrap">{detailData.description || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Members</p>
                <p>{detailData.memberCount ?? 0}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Membership</p>
                <p>{detailData.membershipMode === "open" ? "Open (auto for eligible users)" : "Join (explicit)"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Audience filters</p>
                <p className="text-sm">
                  {detailData.filterByReligion === true || detailData.filterByReligion === 1
                    ? `Religion: ${detailData.targetReligion || "—"}`
                    : "Religion: not filtered"}
                  <br />
                  {detailData.filterByCountry === true || detailData.filterByCountry === 1
                    ? `Country: ${detailData.targetCountry || "—"}`
                    : "Country: not filtered"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Creator ID</p>
                <p className="font-mono text-xs break-all">{detailData.creatorId || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Tags</p>
                <pre className="max-h-32 overflow-auto rounded-md bg-muted p-2 text-xs">
                  {detailData.tags != null ? JSON.stringify(detailData.tags, null, 2) : "—"}
                </pre>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Image URL</p>
                <p className="break-all text-xs">{detailData.image || "—"}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Created</p>
                  <p>{detailData.createdAt ? new Date(detailData.createdAt).toLocaleString() : "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Updated</p>
                  <p>{detailData.updatedAt ? new Date(detailData.updatedAt).toLocaleString() : "—"}</p>
                </div>
              </div>
              <Button type="button" variant="outline" className="w-full" onClick={() => setLocation(`/group/${detailData.id}`)}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Open in app
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!membersForGroup} onOpenChange={(open) => !open && setMembersForGroup(null)}>
        <DialogContent className="max-h-[85vh] max-w-md overflow-hidden sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Members — {membersForGroup?.name}</DialogTitle>
            <DialogDescription>
              {membersLoading
                ? "Loading…"
                : `${membersData?.members?.length ?? 0} member${(membersData?.members?.length ?? 0) === 1 ? "" : "s"}`}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[55vh] overflow-y-auto rounded-md border">
            {membersLoading ? (
              <div className="flex justify-center py-12 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : !membersData?.members?.length ? (
              <p className="p-6 text-center text-sm text-muted-foreground">No members yet</p>
            ) : (
              <ul className="divide-y">
                {membersData.members.map((m) => {
                  const label =
                    m.user?.name?.trim() ||
                    m.user?.username?.trim() ||
                    m.userId;
                  const sub = m.user?.email || m.userId;
                  return (
                    <li key={m.id} className="flex items-center gap-3 p-3">
                      {m.user?.avatar ? (
                        <img src={m.user.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-medium">
                          {(label || "?").slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{label}</p>
                        <p className="truncate text-xs text-muted-foreground">{sub}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="shrink-0"
                        onClick={() => setLocation(`/profile/${m.userId}`)}
                      >
                        Profile
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editorOpen}
        onOpenChange={(open) => {
          setEditorOpen(open);
          if (!open) {
            setEditorGroupId(null);
            setEditorForm(emptyEditorForm());
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editorGroupId ? "Edit group" : "New group"}</DialogTitle>
            <DialogDescription>
              Open groups add eligible members automatically when they register, sign in, or update their profile.
              Join groups require an explicit Join. Religion and country filters apply only when enabled.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="g-name">Name</Label>
              <Input
                id="g-name"
                value={editorForm.name}
                onChange={(e) => setEditorForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Group name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="g-desc">Description</Label>
              <Textarea
                id="g-desc"
                value={editorForm.description}
                onChange={(e) => setEditorForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="What is this group about?"
                rows={4}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="g-image">Image URL (optional)</Label>
              <Input
                id="g-image"
                value={editorForm.image}
                onChange={(e) => setEditorForm((f) => ({ ...f, image: e.target.value }))}
                placeholder="https://…"
              />
            </div>
            <div className="space-y-3 rounded-lg border p-3">
              <p className="text-sm font-medium">Membership</p>
              <RadioGroup
                value={editorForm.membershipMode}
                onValueChange={(v) =>
                  setEditorForm((f) => ({ ...f, membershipMode: v === "open" ? "open" : "join" }))
                }
                className="grid gap-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="open" id="mode-open" />
                  <Label htmlFor="mode-open" className="cursor-pointer font-normal">
                    Open — eligible users are added automatically (no Join step)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="join" id="mode-join" />
                  <Label htmlFor="mode-join" className="cursor-pointer font-normal">
                    Join — user must tap Join to become a member
                  </Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-3 rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="g-filter-rel"
                  checked={editorForm.filterByReligion}
                  onCheckedChange={(c) =>
                    setEditorForm((f) => ({ ...f, filterByReligion: c === true }))
                  }
                />
                <Label htmlFor="g-filter-rel" className="cursor-pointer font-normal">
                  Limit by religion
                </Label>
              </div>
              {editorForm.filterByReligion ? (
                <div className="grid gap-1.5 pl-6">
                  <Label className="text-xs text-muted-foreground">Religion (must match user profile)</Label>
                  <Select
                    value={editorForm.targetReligion || undefined}
                    onValueChange={(v) => setEditorForm((f) => ({ ...f, targetReligion: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose religion" />
                    </SelectTrigger>
                    <SelectContent>
                      {RELIGION_OPTIONS.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
            </div>
            <div className="space-y-3 rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="g-filter-cty"
                  checked={editorForm.filterByCountry}
                  onCheckedChange={(c) =>
                    setEditorForm((f) => ({ ...f, filterByCountry: c === true }))
                  }
                />
                <Label htmlFor="g-filter-cty" className="cursor-pointer font-normal">
                  Limit by country
                </Label>
              </div>
              {editorForm.filterByCountry ? (
                <div className="grid gap-1.5 pl-6">
                  <Label className="text-xs text-muted-foreground">Country (matches profile country or location)</Label>
                  <Input
                    value={editorForm.targetCountry}
                    onChange={(e) => setEditorForm((f) => ({ ...f, targetCountry: e.target.value }))}
                    placeholder="e.g. United Arab Emirates"
                  />
                </div>
              ) : null}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditorOpen(false);
                  setEditorGroupId(null);
                  setEditorForm(emptyEditorForm());
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={saveGroupMutation.isPending}
                onClick={() => saveGroupMutation.mutate({ id: editorGroupId, form: editorForm })}
              >
                {saveGroupMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : editorGroupId ? (
                  "Save changes"
                ) : (
                  "Create group"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteGroup} onOpenChange={(open) => !open && setDeleteGroup(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &apos;{deleteGroup?.name}&apos;?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the group and all member records for it. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteGroup && deleteMutation.mutate(deleteGroup.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
