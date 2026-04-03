import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { buildApiUrl, getAuthHeaders } from "@/services/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type MatchUser = {
  id: string;
  name?: string;
  username?: string;
  email?: string;
  avatar?: string | null;
};

type AdminMatchRow = {
  id: string;
  user1Id: string;
  user2Id: string;
  compatibility?: number | null;
  revealed?: boolean;
  createdAt?: string | null;
  user1?: MatchUser;
  user2?: MatchUser;
};

type CompatBand = "all" | "high" | "medium" | "low";

function resolvePublicMediaUrl(url: string | null | undefined): string | undefined {
  const t = typeof url === "string" ? url.trim() : "";
  if (!t) return undefined;
  if (/^(https?:|data:|blob:)/i.test(t)) return t;
  if (t.startsWith("/")) return buildApiUrl(t);
  return t;
}

function buildMatchesQuery(params: {
  search: string;
  page: number;
  revealed: string;
  compatBand: CompatBand;
}): string {
  const sp = new URLSearchParams();
  sp.set("page", String(params.page));
  sp.set("limit", "50");
  if (params.search.trim()) sp.set("search", params.search.trim());
  if (params.revealed !== "all") sp.set("revealed", params.revealed);
  if (params.compatBand === "high") {
    sp.set("minCompatibility", "80");
  } else if (params.compatBand === "medium") {
    sp.set("minCompatibility", "50");
    sp.set("maxCompatibility", "79");
  } else if (params.compatBand === "low") {
    sp.set("maxCompatibility", "49");
  }
  return `/api/admin/matches?${sp.toString()}`;
}

export default function Matches() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [revealedFilter, setRevealedFilter] = useState<string>("all");
  const [compatBand, setCompatBand] = useState<CompatBand>("all");

  const queryPath = useMemo(
    () =>
      buildMatchesQuery({
        search,
        page,
        revealed: revealedFilter,
        compatBand,
      }),
    [search, page, revealedFilter, compatBand],
  );

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/admin/matches", queryPath],
    queryFn: async () => {
      const url = buildApiUrl(queryPath);
      const res = await fetch(url, {
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
      return res.json() as Promise<{ matches: AdminMatchRow[]; totalPages: number; total: number }>;
    },
  });

  const matches = data?.matches || [];
  const totalPages = data?.totalPages || 1;

  const resetPage = () => setPage(1);

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap justify-between items-start gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Matches</h1>
            <p className="text-muted-foreground text-sm">View all user matches</p>
          </div>
          <div className="relative w-full sm:w-auto min-w-[200px] max-w-md">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by user name, email, or username…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                resetPage();
              }}
              className="pl-8"
            />
          </div>
        </div>

        <Card className="p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Filters</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Compatibility</Label>
              <Select
                value={compatBand}
                onValueChange={(v) => {
                  setCompatBand(v as CompatBand);
                  resetPage();
                }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Compatibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All scores</SelectItem>
                  <SelectItem value="high">80% and above</SelectItem>
                  <SelectItem value="medium">50% – 79%</SelectItem>
                  <SelectItem value="low">Below 50%</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Revealed</Label>
              <Select
                value={revealedFilter}
                onValueChange={(v) => {
                  setRevealedFilter(v);
                  resetPage();
                }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Revealed" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="true">Revealed</SelectItem>
                  <SelectItem value="false">Not revealed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {isLoading ? (
          <div className="text-center py-8">Loading matches...</div>
        ) : error ? (
          <Card>
            <div className="p-6 text-center">
              <p className="text-destructive text-sm mb-4">{error instanceof Error ? error.message : "Error"}</p>
              <Button onClick={() => refetch()}>Retry</Button>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="px-4 py-2 border-b text-sm text-muted-foreground">
              {data?.total != null ? `${data.total} match${data.total === 1 ? "" : "es"}` : "—"}
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">User 1</TableHead>
                    <TableHead className="whitespace-nowrap">User 2</TableHead>
                    <TableHead className="whitespace-nowrap">Compatibility</TableHead>
                    <TableHead className="whitespace-nowrap">Revealed</TableHead>
                    <TableHead className="whitespace-nowrap">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matches.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No matches found
                      </TableCell>
                    </TableRow>
                  ) : (
                    matches.map((m) => {
                      const u1 = m.user1;
                      const u2 = m.user2;
                      const c = m.compatibility;
                      return (
                        <TableRow key={m.id}>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8 shrink-0">
                                <AvatarImage
                                  src={resolvePublicMediaUrl(u1?.avatar ?? null)}
                                  alt=""
                                />
                                <AvatarFallback>{u1?.name?.[0] || "U"}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <span className="text-sm font-medium block truncate">{u1?.name || "Unknown"}</span>
                                {u1?.username ? (
                                  <span className="text-xs text-muted-foreground block truncate">@{u1.username}</span>
                                ) : null}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8 shrink-0">
                                <AvatarImage
                                  src={resolvePublicMediaUrl(u2?.avatar ?? null)}
                                  alt=""
                                />
                                <AvatarFallback>{u2?.name?.[0] || "U"}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <span className="text-sm font-medium block truncate">{u2?.name || "Unknown"}</span>
                                {u2?.username ? (
                                  <span className="text-xs text-muted-foreground block truncate">@{u2.username}</span>
                                ) : null}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {c != null && Number.isFinite(Number(c)) ? `${c}%` : "—"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {m.revealed ? (
                              <Badge variant="secondary" className="text-[10px]">
                                Yes
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px]">
                                No
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                            {m.createdAt ? new Date(m.createdAt).toLocaleDateString() : "—"}
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
            <span className="flex items-center px-3 text-sm">
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
      </div>
    </AdminLayout>
  );
}
