import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { buildApiUrl } from "@/services/api";

export default function Courses() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/admin/courses', search, page],
    queryFn: async () => {
      const url = buildApiUrl(`/api/admin/courses?search=${encodeURIComponent(search)}&page=${page}&limit=50`);
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) { const t = await res.text(); try { throw new Error(JSON.parse(t).message); } catch { throw new Error(`HTTP ${res.status}`); } }
      return res.json();
    },
  });

  const courses = data?.courses || [];
  const totalPages = data?.totalPages || 1;

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Courses</h1>
            <p className="text-muted-foreground text-sm">Manage all courses</p>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search courses..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-8 w-48" />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Loading courses...</div>
        ) : error ? (
          <Card><div className="p-6 text-center"><p className="text-destructive text-sm mb-4">{error instanceof Error ? error.message : 'Error'}</p><Button onClick={() => refetch()}>Retry</Button></div></Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Title</TableHead>
                    <TableHead className="whitespace-nowrap">Level</TableHead>
                    <TableHead className="whitespace-nowrap">Duration</TableHead>
                    <TableHead className="whitespace-nowrap">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No courses found</TableCell></TableRow>
                  ) : courses.map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.title}</TableCell>
                      <TableCell className="whitespace-nowrap">{c.level}</TableCell>
                      <TableCell className="whitespace-nowrap">{c.duration}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm">{new Date(c.createdAt).toLocaleDateString()}</TableCell>
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
