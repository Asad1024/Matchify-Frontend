import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Trash2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import AdminLayout from "@/components/admin/AdminLayout";
import { buildApiUrl } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

export default function Groups() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [deleteGroup, setDeleteGroup] = useState<any>(null);
  const { toast } = useToast();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/admin/groups', search, page],
    queryFn: async () => {
      const url = buildApiUrl(`/api/admin/groups?search=${encodeURIComponent(search)}&page=${page}&limit=50`);
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) { const t = await res.text(); try { throw new Error(JSON.parse(t).message); } catch { throw new Error(`HTTP ${res.status}`); } }
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(buildApiUrl(`/api/admin/groups/${id}`), { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Failed to delete');
    },
    onSuccess: () => { refetch(); toast({ title: "Group deleted" }); setDeleteGroup(null); },
    onError: () => toast({ title: "Error", description: "Failed to delete group", variant: "destructive" }),
  });

  const groups = data?.groups || [];
  const totalPages = data?.totalPages || 1;

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Groups</h1>
            <p className="text-muted-foreground text-sm">Manage all groups</p>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search groups..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-8 w-48" />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Loading groups...</div>
        ) : error ? (
          <Card><div className="p-6 text-center"><p className="text-destructive text-sm mb-4">{error instanceof Error ? error.message : 'Error'}</p><Button onClick={() => refetch()}>Retry</Button></div></Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Name</TableHead>
                    <TableHead className="whitespace-nowrap">Description</TableHead>
                    <TableHead className="whitespace-nowrap">Members</TableHead>
                    <TableHead className="whitespace-nowrap">Created</TableHead>
                    <TableHead className="whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groups.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No groups found</TableCell></TableRow>
                  ) : groups.map((g: any) => (
                    <TableRow key={g.id}>
                      <TableCell className="font-medium whitespace-nowrap">{g.name}</TableCell>
                      <TableCell className="max-w-[160px] truncate text-sm text-muted-foreground">{g.description || '—'}</TableCell>
                      <TableCell className="whitespace-nowrap">{g.memberCount || 0}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm">{new Date(g.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => setDeleteGroup(g)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
            <span className="flex items-center px-3 text-sm">Page {page} of {totalPages}</span>
            <Button variant="outline" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteGroup} onOpenChange={open => !open && setDeleteGroup(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete '{deleteGroup?.name}'?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive" onClick={() => deleteGroup && deleteMutation.mutate(deleteGroup.id)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
