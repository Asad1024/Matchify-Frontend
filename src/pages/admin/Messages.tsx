import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, ChevronLeft, MessageCircle } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { buildApiUrl, getAuthHeaders } from "@/services/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type PublicUser = {
  id?: string;
  name?: string;
  avatar?: string | null;
};

type ConversationListItem = {
  id: string;
  lastMessageAt: string | null;
  lastPreview: string;
  participant1: PublicUser;
  participant2: PublicUser;
};

type ThreadMessage = {
  id: string;
  senderId: string;
  content: string;
  type?: string;
  isDeleted?: boolean;
  createdAt: string | null;
  sender: PublicUser;
};

type ThreadResponse = {
  conversation: {
    id: string;
    participant1: PublicUser;
    participant2: PublicUser;
  };
  messages: ThreadMessage[];
};

function initials(name: string | undefined) {
  const n = (name || "U").trim();
  return n.slice(0, 2).toUpperCase();
}

function formatMsgTime(iso: string | null) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function Messages() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileShowThread, setMobileShowThread] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/admin/conversations", search, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        search,
        page: String(page),
        limit: "40",
      });
      const url = buildApiUrl(`/api/admin/conversations?${params.toString()}`);
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
      return res.json() as Promise<{
        conversations: ConversationListItem[];
        totalPages: number;
        total: number;
      }>;
    },
  });

  const { data: threadData, isLoading: threadLoading } = useQuery({
    queryKey: ["/api/admin/conversations", selectedId, "messages"],
    enabled: !!selectedId,
    queryFn: async () => {
      const url = buildApiUrl(`/api/admin/conversations/${encodeURIComponent(selectedId!)}/messages`);
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
      return res.json() as Promise<ThreadResponse>;
    },
  });

  const conversations = data?.conversations || [];
  const totalPages = data?.totalPages || 1;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [selectedId, threadData?.messages?.length]);

  const p1Id = threadData?.conversation.participant1?.id;
  const titleA = threadData?.conversation.participant1?.name || "User A";
  const titleB = threadData?.conversation.participant2?.name || "User B";

  const selectConversation = (id: string) => {
    setSelectedId(id);
    setMobileShowThread(true);
  };

  return (
    <AdminLayout>
      <div className="flex min-h-0 flex-col gap-4 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">Messages</h1>
            <p className="text-sm text-muted-foreground">Chats between members (read-only)</p>
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Loading conversations…</div>
        ) : error ? (
          <Card>
            <div className="p-6 text-center">
              <p className="mb-4 text-sm text-destructive">
                {error instanceof Error ? error.message : "Error"}
              </p>
              <Button variant="outline" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="flex min-h-[min(720px,calc(100dvh-12rem))] flex-1 flex-col overflow-hidden border-border/80 p-0 shadow-sm">
            <div className="flex min-h-0 flex-1 flex-col md:flex-row">
              {/* Conversation list */}
              <div
                className={cn(
                  "flex min-h-0 w-full flex-col border-border/60 md:w-[min(100%,340px)] md:border-r",
                  mobileShowThread ? "hidden md:flex" : "flex",
                )}
              >
                <div className="shrink-0 border-b border-border/60 bg-muted/30 p-3">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, username, or email…"
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                      }}
                      className="h-9 border-0 bg-background pl-9 shadow-sm"
                    />
                  </div>
                </div>
                <ScrollArea className="min-h-[280px] flex-1 md:min-h-0">
                  <div className="p-2">
                    {conversations.length === 0 ? (
                      <p className="px-2 py-8 text-center text-sm text-muted-foreground">
                        No conversations match your search.
                      </p>
                    ) : (
                      conversations.map((c) => {
                        const a = c.participant1?.name || "User";
                        const b = c.participant2?.name || "User";
                        const active = selectedId === c.id;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => selectConversation(c.id)}
                            className={cn(
                              "mb-1 flex w-full gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                              active
                                ? "bg-primary/10 ring-1 ring-primary/20"
                                : "hover:bg-muted/80",
                            )}
                          >
                            <div className="relative flex shrink-0">
                              <Avatar className="z-[1] h-9 w-9 border-2 border-background">
                                <AvatarImage src={c.participant1?.avatar || undefined} />
                                <AvatarFallback className="text-[10px]">{initials(a)}</AvatarFallback>
                              </Avatar>
                              <Avatar className="-ml-2.5 h-9 w-9 border-2 border-background">
                                <AvatarImage src={c.participant2?.avatar || undefined} />
                                <AvatarFallback className="text-[10px]">{initials(b)}</AvatarFallback>
                              </Avatar>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium leading-tight">
                                {a} & {b}
                              </p>
                              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                                {c.lastPreview || "No messages yet"}
                              </p>
                              {c.lastMessageAt ? (
                                <p className="mt-1 text-[10px] text-muted-foreground">
                                  {formatMsgTime(c.lastMessageAt)}
                                </p>
                              ) : null}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
                {totalPages > 1 ? (
                  <div className="flex shrink-0 items-center justify-center gap-2 border-t border-border/60 py-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Prev
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {page} / {totalPages}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                ) : null}
              </div>

              {/* Thread */}
              <div
                className={cn(
                  "flex min-h-0 min-w-0 flex-1 flex-col bg-background",
                  mobileShowThread ? "flex" : "hidden md:flex",
                )}
              >
                {!selectedId ? (
                  <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center text-muted-foreground">
                    <MessageCircle className="h-12 w-12 opacity-40" />
                    <p className="max-w-xs text-sm">Select a conversation to view the full chat.</p>
                  </div>
                ) : threadLoading ? (
                  <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                    Loading chat…
                  </div>
                ) : threadData ? (
                  <>
                    <div className="flex shrink-0 items-center gap-2 border-b border-border/60 bg-muted/20 px-3 py-3 sm:px-4">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 md:hidden"
                        onClick={() => setMobileShowThread(false)}
                        aria-label="Back to list"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">Chat</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {titleA} · {titleB}
                        </p>
                      </div>
                    </div>
                    <ScrollArea className="min-h-0 flex-1">
                      <div className="space-y-4 px-3 py-4 sm:px-6">
                        {threadData.messages.length === 0 ? (
                          <p className="text-center text-sm text-muted-foreground">No messages in this thread.</p>
                        ) : (
                          threadData.messages.map((m) => {
                            const p2Id = threadData.conversation.participant2?.id;
                            const fromP1 =
                              p1Id != null
                                ? m.senderId === p1Id
                                : p2Id != null
                                  ? m.senderId !== p2Id
                                  : true;
                            const name = m.sender?.name || "User";
                            const deleted = m.isDeleted;
                            return (
                              <div
                                key={m.id}
                                className={cn("flex gap-2", fromP1 ? "justify-start" : "justify-end")}
                              >
                                <div
                                  className={cn(
                                    "flex max-w-[min(100%,420px)] gap-2",
                                    fromP1 ? "flex-row" : "flex-row-reverse",
                                  )}
                                >
                                  <Avatar className="mt-0.5 h-8 w-8 shrink-0">
                                    <AvatarImage src={m.sender?.avatar || undefined} />
                                    <AvatarFallback className="text-[10px]">{initials(name)}</AvatarFallback>
                                  </Avatar>
                                  <div className="min-w-0">
                                    <div
                                      className={cn(
                                        "break-words rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm",
                                        fromP1
                                          ? "rounded-tl-sm bg-muted text-foreground"
                                          : "rounded-tr-sm bg-primary text-primary-foreground",
                                        deleted && "italic opacity-80",
                                      )}
                                    >
                                      {m.content}
                                    </div>
                                    <p
                                      className={cn(
                                        "mt-1 px-1 text-[10px] text-muted-foreground",
                                        fromP1 ? "text-left" : "text-right",
                                      )}
                                    >
                                      {name} · {formatMsgTime(m.createdAt)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                        <div ref={bottomRef} className="h-1 shrink-0" aria-hidden />
                      </div>
                    </ScrollArea>
                  </>
                ) : (
                  <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                    Could not load this chat.
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
