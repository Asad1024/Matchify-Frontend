import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Trash2, Eye, RefreshCw } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { buildApiUrl } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Posts() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const { toast } = useToast();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/admin/posts', search, page],
    queryFn: async () => {
      const url = buildApiUrl(`/api/admin/posts?search=${encodeURIComponent(search)}&page=${page}&limit=50`);
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) {
        const text = await res.text();
        let msg = `HTTP ${res.status}`;
        try { msg = JSON.parse(text).message || msg; } catch {}
        throw new Error(msg);
      }
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (postId: string) => {
      const url = buildApiUrl(`/api/admin/posts/${postId}`);
      const res = await fetch(url, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Failed to delete post');
      return res.json();
    },
    onSuccess: () => { refetch(); toast({ title: "Post deleted" }); },
    onError: () => toast({ title: "Error", description: "Failed to delete post", variant: "destructive" }),
  });

  const posts = data?.posts || [];
  const totalPages = data?.totalPages || 1;

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Posts</h1>
            <p className="text-muted-foreground text-sm">Manage all posts</p>
          </div>
          <div className="flex gap-2 items-center">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search posts..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-8 w-40 sm:w-56"
              />
            </div>
            <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Loading posts...</div>
        ) : error ? (
          <Card>
            <div className="p-6 text-center">
              <p className="text-destructive mb-4 text-sm">{error instanceof Error ? error.message : 'Error loading posts'}</p>
              <Button onClick={() => refetch()}>Retry</Button>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Author</TableHead>
                    <TableHead className="whitespace-nowrap">Content</TableHead>
                    <TableHead className="whitespace-nowrap">Likes</TableHead>
                    <TableHead className="whitespace-nowrap">Comments</TableHead>
                    <TableHead className="whitespace-nowrap">Created</TableHead>
                    <TableHead className="whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No posts found</TableCell>
                    </TableRow>
                  ) : (
                    posts.map((post: any) => (
                      <TableRow key={post.id}>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-7 h-7">
                              <AvatarImage src={post.author?.avatar || undefined} />
                              <AvatarFallback>{post.author?.name?.[0] || 'U'}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{post.author?.name || 'Unknown'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm">{post.content}</TableCell>
                        <TableCell className="whitespace-nowrap">{post.likesCount || 0}</TableCell>
                        <TableCell className="whitespace-nowrap">{post.commentsCount || 0}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">{new Date(post.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setSelectedPost(post)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                              onClick={() => deleteMutation.mutate(post.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
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
            <Button variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
            <span className="flex items-center px-4 text-sm">Page {page} of {totalPages}</span>
            <Button variant="outline" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
          </div>
        )}

        {/* Post detail dialog */}
        <Dialog open={!!selectedPost} onOpenChange={open => !open && setSelectedPost(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Post Details</DialogTitle>
            </DialogHeader>
            {selectedPost && (
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={selectedPost.author?.avatar} />
                    <AvatarFallback>{selectedPost.author?.name?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{selectedPost.author?.name || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground">{new Date(selectedPost.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <p className="leading-relaxed">{selectedPost.content}</p>
                <div className="flex gap-4 text-muted-foreground text-xs">
                  <span>❤️ {selectedPost.likesCount || 0} likes</span>
                  <span>💬 {selectedPost.commentsCount || 0} comments</span>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
