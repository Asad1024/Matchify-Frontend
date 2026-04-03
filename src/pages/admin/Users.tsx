import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Search, Shield, CheckCircle, MoreHorizontal, Mail } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { buildApiUrl, getAuthHeaders } from "@/services/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VerifiedTick } from "@/components/common/VerifiedTick";

type VerificationQueueItem = {
  userId: string;
  name: string;
  email: string;
  username: string;
  message: string;
  submittedAt: string;
};

type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  username: string;
  avatar?: string | null;
  verified?: boolean;
  isAdmin?: boolean;
  banned?: boolean;
  accountActive?: boolean;
  membershipTier?: string;
  createdAt?: string;
  deletionRequestedAt?: string | null;
};

function buildUsersQuery(params: {
  search: string;
  page: number;
  verified: string;
  accountActive: string;
  tier: string;
  pendingDeletion: string;
  isAdmin: string;
  banned: string;
}) {
  const sp = new URLSearchParams();
  sp.set("page", String(params.page));
  sp.set("limit", "50");
  if (params.search.trim()) sp.set("search", params.search.trim());
  if (params.verified !== "all") sp.set("verified", params.verified);
  if (params.accountActive !== "all") sp.set("accountActive", params.accountActive);
  if (params.tier !== "all") sp.set("tier", params.tier);
  if (params.pendingDeletion !== "all") sp.set("pendingDeletion", params.pendingDeletion);
  if (params.isAdmin !== "all") sp.set("isAdmin", params.isAdmin);
  if (params.banned !== "all") sp.set("banned", params.banned);
  return `/api/admin/users?${sp.toString()}`;
}

export default function Users() {
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUserRow | null>(null);
  const [page, setPage] = useState(1);
  const [verifiedFilter, setVerifiedFilter] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [pendingDeletionFilter, setPendingDeletionFilter] = useState<string>("all");
  const [adminFilter, setAdminFilter] = useState<string>("all");
  const [bannedFilter, setBannedFilter] = useState<string>("all");

  const [subscriptionUser, setSubscriptionUser] = useState<AdminUserRow | null>(null);
  const [subscriptionTier, setSubscriptionTier] = useState("free");
  const [subscriptionDays, setSubscriptionDays] = useState("30");

  const [deleteTarget, setDeleteTarget] = useState<AdminUserRow | null>(null);

  const { toast } = useToast();

  const queryPath = buildUsersQuery({
    search,
    page,
    verified: verifiedFilter,
    accountActive: activeFilter,
    tier: tierFilter,
    pendingDeletion: pendingDeletionFilter,
    isAdmin: adminFilter,
    banned: bannedFilter,
  });

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["/api/admin/users", queryPath],
    queryFn: async () => {
      const url = buildApiUrl(queryPath);
      const res = await fetch(url, {
        credentials: "include",
        headers: getAuthHeaders(false),
      });
      if (!res.ok) {
        const errorText = await res.text();
        let errorData: { message?: string };
        try {
          errorData = JSON.parse(errorText) as { message?: string };
        } catch {
          errorData = { message: `HTTP ${res.status}: ${res.statusText}` };
        }
        throw new Error(errorData.message || `Failed to fetch users: ${res.status}`);
      }
      return res.json();
    },
    retry: 1,
    staleTime: 0,
  });

  const { data: verificationQueue = [] } = useQuery<VerificationQueueItem[]>({
    queryKey: ["/api/admin/verification-requests"],
    queryFn: async () => {
      const res = await fetch(buildApiUrl("/api/admin/verification-requests"), {
        credentials: "include",
        headers: getAuthHeaders(false),
      });
      if (!res.ok) throw new Error("Failed to load verification requests");
      return res.json();
    },
    staleTime: 15_000,
  });

  const invalidateUsers = () => {
    void refetch();
    void queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
  };

  const verifyMutation = useMutation({
    mutationFn: async (userId: string) => {
      const url = buildApiUrl(`/api/admin/users/${userId}/verify`);
      const res = await fetch(url, { method: "PATCH", headers: getAuthHeaders(false), credentials: "include" });
      if (!res.ok) throw new Error("Failed to verify user");
      return res.json();
    },
    onSuccess: () => {
      invalidateUsers();
      void queryClient.invalidateQueries({ queryKey: ["/api/admin/verification-requests"] });
      toast({ title: "Success", description: "User verified successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to verify user", variant: "destructive" });
    },
  });

  const activeMutation = useMutation({
    mutationFn: async ({ userId, active }: { userId: string; active: boolean }) => {
      const url = buildApiUrl(`/api/admin/users/${userId}/active`);
      const res = await fetch(url, {
        method: "PATCH",
        headers: getAuthHeaders(true),
        credentials: "include",
        body: JSON.stringify({ active }),
      });
      if (!res.ok) throw new Error("Failed to update account status");
      return res.json();
    },
    onSuccess: () => {
      invalidateUsers();
      toast({ title: "Updated", description: "Account status saved" });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not update account status", variant: "destructive" });
    },
  });

  const subscriptionMutation = useMutation({
    mutationFn: async ({ userId, tier, days }: { userId: string; tier: string; days: number }) => {
      const url = buildApiUrl(`/api/admin/users/${userId}/subscription`);
      const res = await fetch(url, {
        method: "PATCH",
        headers: getAuthHeaders(true),
        credentials: "include",
        body: JSON.stringify({ tier, days }),
      });
      if (!res.ok) throw new Error("Failed to update subscription");
      return res.json();
    },
    onSuccess: () => {
      invalidateUsers();
      setSubscriptionUser(null);
      toast({ title: "Updated", description: "Membership updated" });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not update subscription", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const url = buildApiUrl(`/api/admin/users/${userId}`);
      const res = await fetch(url, { method: "DELETE", headers: getAuthHeaders(false), credentials: "include" });
      if (!res.ok) {
        const t = await res.text();
        let msg = "Failed to delete user";
        try {
          const j = JSON.parse(t) as { message?: string };
          if (j.message) msg = j.message;
        } catch {
          /* ignore */
        }
        throw new Error(msg);
      }
      return res.json();
    },
    onSuccess: () => {
      invalidateUsers();
      setDeleteTarget(null);
      setSelectedUser(null);
      toast({ title: "User removed", description: "The account was deleted from the database." });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const users: AdminUserRow[] = data?.users || [];
  const totalPages = data?.totalPages || 1;
  const totalUsers = data?.total || 0;

  const pendingForSelected = useMemo(
    () =>
      selectedUser ? verificationQueue.find((v) => v.userId === selectedUser.id) ?? null : null,
    [selectedUser, verificationQueue],
  );

  const handleExportCsv = () => {
    const headers = [
      "Name",
      "Username",
      "Email",
      "Active",
      "Verified",
      "Deletion requested",
      "Membership",
      "Joined",
    ];
    const rows = users.map((u) => [
      u.name,
      u.username,
      u.email,
      u.accountActive === false ? "No" : "Yes",
      u.verified ? "Yes" : "No",
      u.deletionRequestedAt ? "Yes" : "No",
      u.membershipTier || "free",
      u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "users.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const isUserActive = (u: AdminUserRow) => u.accountActive !== false;

  const openSubscriptionDialog = (u: AdminUserRow) => {
    setSubscriptionUser(u);
    setSubscriptionTier((u.membershipTier || "free").toLowerCase());
    setSubscriptionDays("30");
  };

  const submitSubscription = () => {
    if (!subscriptionUser) return;
    const days = Math.max(1, Math.min(3660, Math.floor(Number(subscriptionDays) || 30)));
    subscriptionMutation.mutate({
      userId: subscriptionUser.id,
      tier: subscriptionTier,
      days: subscriptionTier === "free" ? 30 : days,
    });
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-4">
        <div className="flex flex-wrap justify-between items-start gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground text-sm">Manage accounts, verification, and membership</p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-8 w-40 sm:w-56"
              />
            </div>
            <Button variant="outline" onClick={handleExportCsv}>
              Export CSV
            </Button>
          </div>
        </div>

        <Card className="p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Filters</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <div className="space-y-1.5">
              <Label className="text-xs">Verified</Label>
              <Select
                value={verifiedFilter}
                onValueChange={(v) => {
                  setVerifiedFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Verified" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="true">Verified</SelectItem>
                  <SelectItem value="false">Not verified</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Account</Label>
              <Select
                value={activeFilter}
                onValueChange={(v) => {
                  setActiveFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Active" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Membership</Label>
              <Select
                value={tierFilter}
                onValueChange={(v) => {
                  setTierFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All tiers</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="plus">Plus</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="elite">Elite</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Deletion request</Label>
              <Select
                value={pendingDeletionFilter}
                onValueChange={(v) => {
                  setPendingDeletionFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Deletion" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="true">Requested</SelectItem>
                  <SelectItem value="false">Not requested</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Role</Label>
              <Select
                value={adminFilter}
                onValueChange={(v) => {
                  setAdminFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All users</SelectItem>
                  <SelectItem value="true">Admins</SelectItem>
                  <SelectItem value="false">Non-admins</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Banned</Label>
              <Select
                value={bannedFilter}
                onValueChange={(v) => {
                  setBannedFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Banned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="true">Banned</SelectItem>
                  <SelectItem value="false">Not banned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {isLoading ? (
          <div className="text-center py-8">Loading users...</div>
        ) : error ? (
          <Card>
            <div className="p-6 text-center">
              <p className="text-destructive mb-4">
                Error loading users: {error instanceof Error ? error.message : "Unknown error"}
              </p>
              <Button onClick={() => refetch()}>Retry</Button>
            </div>
          </Card>
        ) : (
          <>
            {verificationQueue.length > 0 ? (
              <Card className="border-amber-500/35 bg-amber-500/[0.06]">
                <div className="flex items-center gap-2 border-b p-4">
                  <Shield className="h-5 w-5 text-amber-700 shrink-0" />
                  <h2 className="font-semibold text-sm sm:text-base">
                    Verification requests ({verificationQueue.length})
                  </h2>
                </div>
                <div className="max-h-[min(360px,50vh)] divide-y overflow-y-auto">
                  {verificationQueue.map((item) => (
                    <div
                      key={item.userId}
                      className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="font-medium">
                          {item.name}{" "}
                          <span className="font-normal text-muted-foreground">@{item.username}</span>
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3 shrink-0" />
                          {item.email}
                        </p>
                        <p className="mt-2 text-sm whitespace-pre-wrap text-foreground/90">{item.message}</p>
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          Submitted {item.submittedAt ? new Date(item.submittedAt).toLocaleString() : "—"}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        className="shrink-0"
                        onClick={() => verifyMutation.mutate(item.userId)}
                        disabled={verifyMutation.isPending}
                      >
                        <CheckCircle className="mr-1 h-4 w-4" />
                        Verify user
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            ) : null}

            <Card className={isFetching ? "opacity-80 transition-opacity" : ""}>
              <div className="p-4 border-b flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Showing {users.length} of {totalUsers} users
                </p>
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
                      <TableHead className="w-[52px] text-right">Actions</TableHead>
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
                      users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={user.avatar || undefined} />
                                <AvatarFallback>{user.name?.[0] || "U"}</AvatarFallback>
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
                            <div className="flex flex-wrap gap-1.5">
                              {user.banned ? (
                                <Badge variant="destructive" className="text-[10px]">
                                  Banned
                                </Badge>
                              ) : null}
                              {isUserActive(user) ? (
                                <Badge variant="secondary" className="text-[10px]">
                                  Active
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] border-amber-600/50 text-amber-800">
                                  Inactive
                                </Badge>
                              )}
                              {user.verified ? (
                                <Badge variant="default" className="text-[10px]">
                                  Verified
                                </Badge>
                              ) : null}
                              {user.isAdmin ? (
                                <Badge variant="secondary" className="text-[10px]">
                                  Admin
                                </Badge>
                              ) : null}
                              {user.deletionRequestedAt ? (
                                <Badge variant="outline" className="text-[10px] border-red-500/40 text-red-700">
                                  Delete requested
                                </Badge>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{user.membershipTier || "free"}</Badge>
                          </TableCell>
                          <TableCell>
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            {user.isAdmin ? (
                              <span
                                className="inline-flex h-8 w-8 items-center justify-center text-muted-foreground"
                                title="Actions are disabled for administrator accounts"
                                role="img"
                                aria-label="Actions disabled for administrator accounts"
                              >
                                <MoreHorizontal className="h-4 w-4 opacity-40" aria-hidden />
                              </span>
                            ) : (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="User actions">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-52">
                                  <DropdownMenuItem onClick={() => setSelectedUser(user)}>View</DropdownMenuItem>
                                  {!user.verified ? (
                                    <DropdownMenuItem
                                      onClick={() => verifyMutation.mutate(user.id)}
                                      disabled={verifyMutation.isPending}
                                    >
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Verify user
                                    </DropdownMenuItem>
                                  ) : null}
                                  <DropdownMenuItem
                                    onClick={() =>
                                      activeMutation.mutate({ userId: user.id, active: !isUserActive(user) })
                                    }
                                    disabled={activeMutation.isPending}
                                  >
                                    {isUserActive(user) ? "Deactivate account" : "Activate account"}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openSubscriptionDialog(user)}>
                                    Change subscription
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => setDeleteTarget(user)}
                                  >
                                    Delete user
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
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

        <Dialog open={!!subscriptionUser} onOpenChange={(o) => !o && setSubscriptionUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change subscription</DialogTitle>
              <DialogDescription>
                Set membership for {subscriptionUser?.name ?? "this user"}. Free clears paid expiry.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Tier</Label>
                <Select value={subscriptionTier} onValueChange={setSubscriptionTier}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="plus">Plus</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="elite">Elite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {subscriptionTier !== "free" ? (
                <div className="space-y-2">
                  <Label>Duration (days)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={3660}
                    value={subscriptionDays}
                    onChange={(e) => setSubscriptionDays(e.target.value)}
                  />
                </div>
              ) : null}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSubscriptionUser(null)}>
                Cancel
              </Button>
              <Button onClick={() => submitSubscription()} disabled={subscriptionMutation.isPending}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete user permanently?</AlertDialogTitle>
              <AlertDialogDescription>
                This removes <strong>{deleteTarget?.name}</strong> ({deleteTarget?.email}) from the database. Related
                data may be removed or fail if foreign keys exist. This cannot be undone.
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

        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
              <DialogDescription>View and manage user information</DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                {pendingForSelected ? (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
                    <p className="text-xs font-semibold text-amber-900 dark:text-amber-100">
                      Pending verification note
                    </p>
                    <p className="mt-1 text-sm whitespace-pre-wrap">{pendingForSelected.message}</p>
                  </div>
                ) : null}
                {selectedUser.deletionRequestedAt ? (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3">
                    <p className="text-xs font-semibold text-red-900 dark:text-red-100">Deletion requested</p>
                    <p className="mt-1 text-sm">
                      User asked to delete their account on{" "}
                      {new Date(selectedUser.deletionRequestedAt).toLocaleString()}.
                    </p>
                  </div>
                ) : null}
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={selectedUser.avatar || undefined} />
                    <AvatarFallback>{selectedUser.name?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedUser.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium">Username</span>
                    <p className="text-sm">{selectedUser.username}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Account</span>
                    <p className="text-sm">{isUserActive(selectedUser) ? "Active" : "Inactive"}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Membership Tier</span>
                    <p className="text-sm">{selectedUser.membershipTier || "free"}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Verified</span>
                    <p className="text-sm">{selectedUser.verified ? "Yes" : "No"}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Joined</span>
                    <p className="text-sm">
                      {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString() : "—"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
