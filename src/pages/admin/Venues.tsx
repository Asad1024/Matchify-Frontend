import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import { Switch } from "@/components/ui/switch";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { buildApiUrl, getAuthHeaders } from "@/services/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type VenueRow = {
  id: string;
  name: string;
  address: string;
  city: string;
  region?: string | null;
  /** API / DB may send JSON array, string, or legacy object — always normalize before .map */
  tags?: unknown;
  capacityHint?: number | null;
  imageUrl?: string | null;
  notes?: string | null;
  active: boolean;
};

function venueTagsAsStrings(tags: unknown): string[] {
  if (tags == null) return [];
  if (Array.isArray(tags)) return tags.map((t) => String(t)).filter(Boolean);
  if (typeof tags === "string") return tags.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
}

const emptyForm = {
  name: "",
  address: "",
  city: "",
  region: "",
  tags: "",
  capacityHint: "",
  imageUrl: "",
  notes: "",
  active: true,
};

export default function AdminVenues() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<VenueRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: venues = [], isLoading } = useQuery<VenueRow[]>({
    queryKey: ["/api/admin/venues"],
    queryFn: async () => {
      const res = await fetch(buildApiUrl("/api/admin/venues"), { headers: getAuthHeaders(false), credentials: "include" });
      if (!res.ok) throw new Error("Failed to load venues");
      return res.json();
    },
  });

  const sorted = useMemo(
    () => [...venues].sort((a, b) => `${a.city} ${a.name}`.localeCompare(`${b.city} ${b.name}`)),
    [venues],
  );

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (v: VenueRow) => {
    setEditing(v);
    setForm({
      name: v.name,
      address: v.address,
      city: v.city,
      region: v.region || "",
      tags: venueTagsAsStrings(v.tags).join(", "),
      capacityHint: v.capacityHint != null ? String(v.capacityHint) : "",
      imageUrl: v.imageUrl || "",
      notes: v.notes || "",
      active: v.active !== false,
    });
    setDialogOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = {
        name: form.name.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        region: form.region.trim() || null,
        tags: form.tags
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        capacityHint: form.capacityHint.trim() ? Number(form.capacityHint) : null,
        imageUrl: form.imageUrl.trim() || null,
        notes: form.notes.trim() || null,
        active: form.active,
      };
      if (!body.name || !body.address || !body.city) {
        throw new Error("Name, address, and city are required.");
      }
      const url = editing
        ? buildApiUrl(`/api/admin/venues/${editing.id}`)
        : buildApiUrl("/api/admin/venues");
      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { ...getAuthHeaders(false), "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { message?: string }).message || "Save failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/venues"] });
      setDialogOpen(false);
      toast({ title: editing ? "Venue updated" : "Venue created" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(buildApiUrl(`/api/admin/venues/${id}`), {
        method: "DELETE",
        headers: getAuthHeaders(false),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/venues"] });
      setDeleteId(null);
      toast({ title: "Venue deleted" });
    },
    onError: () => toast({ title: "Delete failed", variant: "destructive" }),
  });

  return (
    <AdminLayout>
      <div className="mx-auto max-w-5xl space-y-4 p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Venues</h1>
          </div>
          <Button onClick={openCreate} className="rounded-full">
            <Plus className="mr-2 h-4 w-4" />
            Add venue
          </Button>
        </div>

        <Card className="overflow-hidden p-0">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-slate-500">Loading…</div>
          ) : sorted.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              No venues yet. Add at least one so the AI event scheduler can run.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{v.name}</TableCell>
                    <TableCell>
                      {v.city}
                      {v.region ? ` · ${v.region}` : ""}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {venueTagsAsStrings(v.tags)
                          .slice(0, 4)
                          .map((t) => (
                            <Badge key={t} variant="secondary" className="text-[10px]">
                              {t}
                            </Badge>
                          ))}
                      </div>
                    </TableCell>
                    <TableCell>{v.active ? "Yes" : "No"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(v)} aria-label="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(v.id)} aria-label="Delete">
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit venue" : "New venue"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label htmlFor="v-name">Name</Label>
              <Input
                id="v-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="v-address">Address</Label>
              <Input
                id="v-address"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="v-city">City</Label>
                <Input
                  id="v-city"
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="v-region">Region / country</Label>
                <Input
                  id="v-region"
                  value={form.region}
                  onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="v-tags">Interest tags (comma-separated)</Label>
              <Input
                id="v-tags"
                placeholder="Coffee, Travel, Music"
                value={form.tags}
                onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                className="mt-1"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Matched against user profile interests for AI invites.
              </p>
            </div>
            <div>
              <Label htmlFor="v-cap">Capacity hint (optional)</Label>
              <Input
                id="v-cap"
                type="number"
                value={form.capacityHint}
                onChange={(e) => setForm((f) => ({ ...f, capacityHint: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="v-img">Image URL (optional)</Label>
              <Input
                id="v-img"
                value={form.imageUrl}
                onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="v-notes">Notes (optional)</Label>
              <Textarea
                id="v-notes"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="mt-1"
                rows={2}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.active} onCheckedChange={(c) => setForm((f) => ({ ...f, active: c }))} id="v-active" />
              <Label htmlFor="v-active">Active (AI can use this venue)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete venue?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone. Past events keep their saved location text.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
