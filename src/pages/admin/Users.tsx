import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Search, Shield, Ban, CheckCircle, Eye, RefreshCw, GraduationCap } from "lucide-react";
import { useLocation } from "wouter";
import AdminLayout from "@/components/admin/AdminLayout";
import { buildApiUrl } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VerifiedTick } from "@/components/common/VerifiedTick";

export default function Users() {
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [page, setPage] = useState(1);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/admin/users', search, page],
    queryFn: async () => {
      const url = buildApiUrl(`/api/admin/users?search=${encodeURIComponent(search)}&page=${page}&limit=50`);
      const res = await fetch(url, { credentials: 'include', headers: { 'Content-Type': 'application/json' } });
      if (!res.ok) {
        const errorText = await res.text();
        let errorData;
        try { errorData = JSON.parse(errorText); } catch { errorData = { message: `HTTP ${res.status}: ${res.statusText}` }; }
        throw new Error(errorData.message || `Failed to fetch users: ${res.status}`);
      }
      return res.json();
    },
    retry: 1,
    staleTime: 0,
  });

  const verifyMutation = useMutation({
    mutationFn: async (userId: string) => {
      const url = buildApiUrl(`/api/admin/users/${userId}/verify`);
      const res = await fetch(url, { method: 'PATCH' });
      if (!res.ok) throw new Error('Failed to verify user');
      return res.json();
    },
    onSuccess: () => {
      refetch();
      toast({ title: "Success", description: "User verified successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to verify user", variant: "destructive" });
    },
  });

  const banMutation = useMutation({
    mutationFn: async (userId: string) => {
      const url = buildApiUrl(`/api/admin/users/${userId}/ban`);
      const res = await fetch(url, { 
        method: 'PATCH', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Admin action' }) 
      });
      if (!res.ok) throw new Error('Failed to ban user');
      return res.json();
    },
    onSuccess: () => {
      refetch();
      toast({ title: "Success", description: "User banned successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to ban user", variant: "destructive" });
    },
  });

  const users = data?.users || [];
  const totalPages = data?.totalPages || 1;
  const totalUsers = data?.total || 0;

  const handleExportCsv = () => {
    const headers = ['Name', 'Username', 'Email', 'Status', 'Membership', 'Joined'];
    const rows = users.map((u: any) => [
      u.name, u.username, u.email,
      u.verified ? 'Verified' : 'Unverified',
      u.membershipTier || 'free',
      new Date(u.createdAt).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map(r => r.map((v: string) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'users.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground text-sm">Manage all users in the system</p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-8 w-40 sm:w-64"
              />
            </div>
            <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 sm:mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button variant="outline" onClick={() => setLocation('/admin/coaches')}>
              <GraduationCap className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Coaches</span>
            </Button>
            <Button variant="outline" onClick={handleExportCsv}>
              <span>Export CSV</span>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Loading users...</div>
        ) : error ? (
          <Card>
            <div className="p-6 text-center">
              <p className="text-destructive mb-4">Error loading users: {error instanceof Error ? error.message : 'Unknown error'}</p>
              <Button onClick={() => refetch()}>Retry</Button>
            </div>
          </Card>
        ) : (
          <>
            <Card>
              <div className="p-4 border-b flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Showing {users.length} of {totalUsers} users
                </p>
                {isLoading && (
                  <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
                )}
              </div>
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Membership</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user: any) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={user.avatar || undefined} />
                              <AvatarFallback>{user.name?.[0] || 'U'}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-1.5 font-medium">
                                <span>{user.name}</span>
                                {user.verified ? <VerifiedTick size="xs" /> : null}
                              </div>
                              <div className="text-sm text-muted-foreground">@{user.username}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {user.verified && <Badge variant="default">Verified</Badge>}
                            {user.isAdmin && <Badge variant="secondary">Admin</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.membershipTier || 'free'}</Badge>
                        </TableCell>
                        <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => setSelectedUser(user)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {!user.verified && (
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => verifyMutation.mutate(user.id)}
                                disabled={verifyMutation.isPending}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => banMutation.mutate(user.id)}
                              disabled={banMutation.isPending}
                            >
                              <Ban className="w-4 h-4" />
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="flex items-center px-4">
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
          </>
        )}

        {/* User Detail Dialog */}
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
              <DialogDescription>View and manage user information</DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={selectedUser.avatar || undefined} />
                    <AvatarFallback>{selectedUser.name?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedUser.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Username</label>
                    <p className="text-sm">{selectedUser.username}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Age</label>
                    <p className="text-sm">{selectedUser.age || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Location</label>
                    <p className="text-sm">{selectedUser.location || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Membership Tier</label>
                    <p className="text-sm">{selectedUser.membershipTier || 'free'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Verified</label>
                    <p className="text-sm">{selectedUser.verified ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Joined</label>
                    <p className="text-sm">{new Date(selectedUser.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                {selectedUser.bio && (
                  <div>
                    <label className="text-sm font-medium">Bio</label>
                    <p className="text-sm">{selectedUser.bio}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

