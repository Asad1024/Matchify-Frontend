import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Search, Trash2, Eye, RefreshCw, MoreHorizontal } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { buildApiUrl, getAuthHeaders } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type PostAuthor = {
  id?: string;
  name?: string;
  username?: string;
  email?: string;
  avatar?: string | null;
} | null;

type AdminPostRow = {
  id: string;
  userId?: string;
  content: string;
  image?: string | null;
  images?: unknown;
  likesCount?: number;
  commentsCount?: number;
  createdAt?: string;
  author?: PostAuthor;
};

type AdminCommentRow = {
  id: string;
  postId?: string;
  userId?: string;
  content: string;
  createdAt?: string;
  replyToCommentId?: string | null;
  likes?: number;
  user?: PostAuthor;
};

function resolvePublicMediaUrl(url: string | null | undefined): string | undefined {
  const t = typeof url === "string" ? url.trim() : "";
  if (!t) return undefined;
  if (/^(https?:|data:|blob:)/i.test(t)) return t;
  if (t.startsWith("/")) return buildApiUrl(t);
  return t;
}

function collectPostImageUrls(post: AdminPostRow): string[] {
  const out: string[] = [];
  const primary = post.image?.trim();
  if (primary) out.push(primary);
  const raw = post.images;
  if (Array.isArray(raw)) {
    for (const x of raw) {
      if (typeof x === "string" && x.trim() && !out.includes(x.trim())) out.push(x.trim());
    }
  }
  return out;
}

export default function Posts() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedPost, setSelectedPost] = useState<AdminPostRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminPostRow | null>(null);
  const { toast } = useToast();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/admin/posts", search, page],
    queryFn: async () => {
      const url = buildApiUrl(`/api/admin/posts?search=${encodeURIComponent(search)}&page=${page}&limit=50`);
      const res = await fetch(url, {
        credentials: "include",
        headers: getAuthHeaders(false),
      });
      if (!res.ok) {
        const text = await res.text();
        let msg = `HTTP ${res.status}`;
        try {
          msg = JSON.parse(text).message || msg;
        } catch {
          /* keep */
        }
        throw new Error(msg);
      }
      return res.json() as Promise<{ posts: AdminPostRow[]; totalPages: number; total: number }>;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (postId: string) => {
      const res = await fetch(buildApiUrl(`/api/admin/posts/${postId}`), {
        method: "DELETE",
        credentials: "include",
        headers: getAuthHeaders(false),
      });
      if (!res.ok) throw new Error("Failed to delete post");
      return res.json();
    },
    onSuccess: () => {
      void refetch();
      setDeleteTarget(null);
      setSelectedPost(null);
      toast({ title: "Post deleted" });
    },
    onError: () => toast({ title: "Error", description: "Failed to delete post", variant: "destructive" }),
  });

  const posts = data?.posts || [];
  const totalPages = data?.totalPages || 1;

  const selectedPostId = selectedPost?.id ?? null;
  const { data: postComments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ["/api/posts", selectedPostId, "comments"],
    enabled: !!selectedPostId,
    queryFn: async () => {
      const res = await fetch(buildApiUrl(`/api/posts/${selectedPostId}/comments`), {
        credentials: "include",
        headers: getAuthHeaders(false),
      });
      if (!res.ok) {
        const t = await res.text();
        try {
          throw new Error(JSON.parse(t).message);
        } catch {
          throw new Error(`HTTP ${res.status}`);
        }
      }
      return res.json() as Promise<AdminCommentRow[]>;
    },
  });

  const commentById = useMemo(() => {
    const m = new Map<string, AdminCommentRow>();
    for (const c of postComments) m.set(c.id, c);
    return m;
  }, [postComments]);

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
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-8 w-40 sm:w-56"
              />
            </div>
            <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Loading posts...</div>
        ) : error ? (
          <Card>
            <div className="p-6 text-center">
              <p className="text-destructive mb-4 text-sm">
                {error instanceof Error ? error.message : "Error loading posts"}
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
                    <TableHead className="whitespace-nowrap min-w-[180px]">Author</TableHead>
                    <TableHead className="min-w-[320px]">Content</TableHead>
                    <TableHead className="whitespace-nowrap">Likes</TableHead>
                    <TableHead className="whitespace-nowrap">Comments</TableHead>
                    <TableHead className="whitespace-nowrap">Created</TableHead>
                    <TableHead className="w-[52px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No posts found
                      </TableCell>
                    </TableRow>
                  ) : (
                    posts.map((post) => {
                      const author = post.author;
                      return (
                        <TableRow key={post.id}>
                          <TableCell className="align-top">
                            <div className="flex items-center gap-2 min-w-0">
                              <Avatar className="h-8 w-8 shrink-0">
                                <AvatarImage
                                  src={resolvePublicMediaUrl(author?.avatar ?? null)}
                                  alt=""
                                />
                                <AvatarFallback>{author?.name?.[0] || "U"}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <span className="text-sm font-medium block truncate">
                                  {author?.name || "Unknown"}
                                </span>
                                {author?.username ? (
                                  <span className="text-xs text-muted-foreground block truncate">
                                    @{author.username}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="align-top max-w-xl min-w-[280px]">
                            <p className="text-sm text-foreground whitespace-pre-wrap break-words leading-relaxed">
                              {post.content?.trim() ? post.content : "—"}
                            </p>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{post.likesCount ?? 0}</TableCell>
                          <TableCell className="whitespace-nowrap">{post.commentsCount ?? 0}</TableCell>
                          <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                            {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Post actions">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => setSelectedPost(post)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View full post
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => setDeleteTarget(post)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete post
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              Previous
            </Button>
            <span className="flex items-center px-4 text-sm">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        )}

        <Dialog open={!!selectedPost} onOpenChange={(open) => !open && setSelectedPost(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>Post</DialogTitle>
              <DialogDescription>Full post, images, and every comment on this thread.</DialogDescription>
            </DialogHeader>
            {selectedPost ? (
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage
                      src={resolvePublicMediaUrl(selectedPost.author?.avatar ?? null)}
                      alt=""
                    />
                    <AvatarFallback>{selectedPost.author?.name?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-semibold">{selectedPost.author?.name || "Unknown"}</p>
                    {selectedPost.author?.username ? (
                      <p className="text-xs text-muted-foreground">@{selectedPost.author.username}</p>
                    ) : null}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {selectedPost.createdAt ? new Date(selectedPost.createdAt).toLocaleString() : "—"}
                    </p>
                  </div>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="whitespace-pre-wrap break-words text-foreground leading-relaxed">
                    {selectedPost.content || "—"}
                  </p>
                </div>
                {collectPostImageUrls(selectedPost).length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Images</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {collectPostImageUrls(selectedPost).map((src) => {
                        const resolved = resolvePublicMediaUrl(src);
                        if (!resolved) return null;
                        return (
                          <a
                            key={src}
                            href={resolved}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block overflow-hidden rounded-lg border bg-background"
                          >
                            <img
                              src={resolved}
                              alt=""
                              className="w-full max-h-[320px] object-contain bg-muted/50"
                            />
                          </a>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
                <div className="flex gap-4 text-muted-foreground text-xs pt-1 border-t">
                  <span>{selectedPost.likesCount ?? 0} likes</span>
                  <span>{selectedPost.commentsCount ?? 0} comments</span>
                </div>

                <div className="space-y-2 border-t pt-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Comments ({postComments.length})
                  </p>
                  {commentsLoading ? (
                    <p className="text-sm text-muted-foreground py-4">Loading comments…</p>
                  ) : postComments.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">No comments yet.</p>
                  ) : (
                    <ul className="space-y-3">
                      {postComments.map((c) => (
                        <li
                          key={c.id}
                          className={
                            c.replyToCommentId
                              ? "ml-4 sm:ml-8 pl-3 border-l-2 border-border/80"
                              : ""
                          }
                        >
                          <div className="flex gap-2">
                            <Avatar className="h-8 w-8 shrink-0 mt-0.5">
                              <AvatarImage
                                src={resolvePublicMediaUrl(c.user?.avatar ?? null)}
                                alt=""
                              />
                              <AvatarFallback>{c.user?.name?.[0] || "U"}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
                                <span className="font-medium text-foreground">
                                  {c.user?.name || "Unknown"}
                                </span>
                                {c.user?.username ? (
                                  <span className="text-xs text-muted-foreground">@{c.user.username}</span>
                                ) : null}
                                <span className="text-[11px] text-muted-foreground">
                                  {c.createdAt ? new Date(c.createdAt).toLocaleString() : ""}
                                </span>
                              </div>
                              {c.replyToCommentId ? (
                                <p className="text-[11px] text-muted-foreground italic line-clamp-2">
                                  Replying to:{" "}
                                  {commentById.get(c.replyToCommentId)?.content?.trim() || "(original comment)"}
                                </p>
                              ) : null}
                              <p className="whitespace-pre-wrap break-words text-foreground/90 leading-relaxed">
                                {c.content || "—"}
                              </p>
                              {(c.likes ?? 0) > 0 ? (
                                <p className="text-[11px] text-muted-foreground">{c.likes} like(s)</p>
                              ) : null}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this post?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently removes the post from the database. Comments and likes may be removed by the server.
                This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
