import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { buildApiUrl } from "@/services/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Matches() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/admin/matches', search, page],
    queryFn: async () => {
      const url = buildApiUrl(`/api/admin/matches?search=${encodeURIComponent(search)}&page=${page}&limit=50`);
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) { const t = await res.text(); try { throw new Error(JSON.parse(t).message); } catch { throw new Error(`HTTP ${res.status}`); } }
      return res.json();
    },
  });

  const matches = data?.matches || [];
  const totalPages = data?.totalPages || 1;

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Matches</h1>
            <p className="text-muted-foreground text-sm">View all user matches</p>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search matches..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-8 w-48" />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Loading matches...</div>
        ) : error ? (
          <Card><div className="p-6 text-center"><p className="text-destructive text-sm mb-4">{error instanceof Error ? error.message : 'Error'}</p><Button onClick={() => refetch()}>Retry</Button></div></Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">User 1</TableHead>
                    <TableHead className="whitespace-nowrap">User 2</TableHead>
                    <TableHead className="whitespace-nowrap">Compatibility</TableHead>
                    <TableHead className="whitespace-nowrap">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matches.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No matches found</TableCell></TableRow>
                  ) : matches.map((m: any) => (
                    <TableRow key={m.id}>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-7 h-7"><AvatarFallback>{m.user1?.name?.[0] || 'U'}</AvatarFallback></Avatar>
                          <span className="text-sm">{m.user1?.name || 'Unknown'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-7 h-7"><AvatarFallback>{m.user2?.name?.[0] || 'U'}</AvatarFallback></Avatar>
                          <span className="text-sm">{m.user2?.name || 'Unknown'}</span>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline">{m.compatibility}%</Badge></TableCell>
                      <TableCell className="whitespace-nowrap text-sm">{new Date(m.createdAt).toLocaleDateString()}</TableCell>
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
    </AdminLayout>
  );
}
