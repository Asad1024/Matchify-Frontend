import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useSearchParams } from "wouter";
import { buildApiUrl, getAuthHeaders } from "@/services/api";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/common/Header";
import PageWrapper from "@/components/common/PageWrapper";
import BottomNav from "@/components/common/BottomNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Search,
  MoreVertical,
  Phone,
  Video,
  Check,
  CheckCheck,
  Mic,
  ArrowLeft,
  Sparkles,
  Smile,
  Copy,
  Pencil,
  UserX,
  Ban,
} from "lucide-react";
import EmojiPicker, { Theme, type EmojiClickData } from "emoji-picker-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { VoiceNoteRecorder } from "@/components/chat/VoiceNoteRecorder";
import { VoiceMessagePlayer } from "@/components/chat/VoiceMessagePlayer";
import { Icebreakers } from "@/components/chat/Icebreakers";
import { AutoDeleteTimer } from "@/components/chat/AutoDeleteTimer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { OnlineIndicator } from "@/components/profile/OnlineIndicator";
import { showOnlineDotForOther } from "@/lib/presence";

type Conversation = {
  id: string;
  participant1Id: string;
  participant2Id: string;
  lastMessageAt: Date | null;
};

type ConversationSummary = Conversation & {
  lastMessage: {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    read: boolean | null;
    createdAt: Date | string | null;
    deletedForEveryone?: boolean;
    type?: string;
    voiceUrl?: string | null;
  } | null;
  unreadCount: number;
};

type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  read: boolean | null;
  createdAt: Date | null;
  type?: 'text' | 'voice' | 'icebreaker';
  voiceUrl?: string | null;
  autoDeleteAt?: string | null;
  isIcebreaker?: boolean;
  deletedForEveryone?: boolean;
  editedAt?: string | Date | null;
};

const chatMessagesQueryKey = (
  conversationId: string | null | undefined,
  uid: string | null | undefined,
) => ["chat-messages", conversationId ?? "", uid ?? ""] as const;

type User = {
  id: string;
  name: string;
  avatar: string | null;
  lastActiveAt?: string | null;
  privacy?: { showOnlineStatus?: boolean } | null;
};

function formatLastSeen(iso: string | null | undefined): string {
  if (!iso?.trim()) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "Last seen just now";
  if (mins < 60) return `Last seen ${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Last seen ${hrs}h ago`;
  return `Last seen ${d.toLocaleDateString([], { month: "short", day: "numeric" })}`;
}

export default function Chat() {
  const [activePage, setActivePage] = useState('chat');
  const [location, setLocation] = useLocation();
  const [searchParams] = useSearchParams();
  const queryUserId = searchParams.get("user");
  const handoffInFlight = useRef(false);
  const handoffDoneKey = useRef<string | null>(null);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showIcebreakers, setShowIcebreakers] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<
    null | { kind: "me" | "everyone"; messageId: string }
  >(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { userId } = useCurrentUser();
  const { logout } = useAuth();
  const { toast } = useToast();
  const lastToastMsgIdRef = useRef<Record<string, string>>({});

  // Inbox with last message preview + unread counts
  const { data: conversationSummaries = [] } = useQuery<ConversationSummary[]>({
    queryKey: [`/api/users/${userId}/conversation-summaries`],
    enabled: !!userId,
    refetchInterval: 4000,
  });

  // Fetch all users
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // Fetch messages for selected conversation (userId filters "delete for me" hidden rows)
  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: chatMessagesQueryKey(selectedChat, userId),
    enabled: !!selectedChat && !!userId,
    refetchInterval: 2500,
    queryFn: async () => {
      const url = buildApiUrl(
        `/api/messages/${selectedChat}?userId=${encodeURIComponent(userId!)}`,
      );
      const res = await fetch(url, {
        credentials: "include",
        headers: getAuthHeaders(false),
      });
      if (!res.ok) {
        const text = (await res.text()) || res.statusText;
        throw new Error(text);
      }
      return res.json() as Promise<Message[]>;
    },
  });

  type SendMessageBody = {
    content: string;
    type?: string;
    voiceUrl?: string | null;
  };

  const coerceOutgoingPayload = (payload: string | SendMessageBody): SendMessageBody => {
    if (typeof payload === "string") return { content: payload, type: "text", voiceUrl: null };
    return {
      content: payload.content,
      type: payload.type ?? "text",
      voiceUrl: payload.voiceUrl ?? null,
    };
  };

  const sendMutation = useMutation({
    mutationFn: async (payload: string | SendMessageBody) => {
      if (!selectedChat || !userId) return;
      const body =
        typeof payload === "string"
          ? { conversationId: selectedChat, senderId: userId, content: payload }
          : {
              conversationId: selectedChat,
              senderId: userId,
              content: payload.content,
              type: payload.type ?? "text",
              voiceUrl: payload.voiceUrl ?? null,
            };
      const response = await fetch(buildApiUrl("/api/messages"), {
        method: "POST",
        headers: { ...getAuthHeaders(true) },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        let detail = response.statusText;
        try {
          const j = (await response.json()) as { message?: string };
          if (j?.message) detail = j.message;
        } catch {
          /* ignore */
        }
        throw new Error(detail || "Failed to send message");
      }
      return response.json();
    },
    onMutate: async (payload: string | SendMessageBody) => {
      if (!selectedChat || !userId) return;
      const outgoing = coerceOutgoingPayload(payload);
      const now = new Date();
      const tempId = `optimistic-${userId}-${now.getTime()}`;

      const optimistic: Message = {
        id: tempId,
        conversationId: selectedChat,
        senderId: userId,
        content: outgoing.content,
        type: (outgoing.type as Message["type"]) ?? "text",
        voiceUrl: outgoing.voiceUrl ?? null,
        read: false,
        createdAt: now,
      };

      const key = chatMessagesQueryKey(selectedChat, userId);
      await queryClient.cancelQueries({ queryKey: key });
      const previousMessages = queryClient.getQueryData<Message[]>(key);
      queryClient.setQueryData<Message[]>(key, (old) => {
        const rows = Array.isArray(old) ? old : [];
        if (rows.some((m) => m?.id === tempId)) return rows;
        return [...rows, optimistic];
      });

      const summariesKey = [`/api/users/${userId}/conversation-summaries`] as const;
      const previousSummaries = queryClient.getQueryData<ConversationSummary[]>(summariesKey);
      queryClient.setQueryData<ConversationSummary[]>(summariesKey, (old) => {
        const rows = Array.isArray(old) ? old : [];
        const idx = rows.findIndex((r) => r?.id === selectedChat);
        if (idx < 0) return rows;
        const updated = [...rows];
        const row = updated[idx]!;
        updated.splice(idx, 1);
        updated.unshift({
          ...row,
          lastMessage: {
            id: tempId,
            conversationId: selectedChat,
            senderId: userId,
            content: outgoing.content,
            read: false,
            createdAt: now.toISOString(),
            type: outgoing.type,
            voiceUrl: outgoing.voiceUrl ?? null,
          },
        });
        return updated;
      });

      return { tempId, key, previousMessages, summariesKey, previousSummaries };
    },
    onSuccess: (serverMsg: unknown, _payload, ctx) => {
      const created = serverMsg as Partial<Message> | undefined;
      if (ctx?.key && ctx?.tempId && created?.id) {
        queryClient.setQueryData<Message[]>(ctx.key, (old) => {
          const rows = Array.isArray(old) ? old : [];
          return rows.map((m) => (m?.id === ctx.tempId ? ({ ...m, ...created } as Message) : m));
        });
      }
      queryClient.invalidateQueries({ queryKey: ["chat-messages"] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/conversations`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/conversation-summaries`] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "chat-unread-count"] });
      setMessage("");
      setShowVoiceRecorder(false);
      toast({ title: "Message sent" });
    },
    onError: (err: Error, _payload, ctx) => {
      if (ctx?.key) queryClient.setQueryData(ctx.key, ctx.previousMessages);
      if (ctx?.summariesKey) queryClient.setQueryData(ctx.summariesKey, ctx.previousSummaries);
      toast({
        title: "Could not send",
        description: err.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const invalidateThreadQueries = () => {
    void queryClient.invalidateQueries({ queryKey: ["chat-messages"] });
    if (userId) {
      void queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/conversation-summaries`] });
    }
  };

  const updateMessageMutation = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      if (!userId) throw new Error("Not signed in");
      const res = await fetch(buildApiUrl(`/api/messages/${id}`), {
        method: "PATCH",
        headers: { ...getAuthHeaders(true) },
        credentials: "include",
        body: JSON.stringify({ userId, content }),
      });
      if (!res.ok) {
        let detail = res.statusText;
        try {
          const j = (await res.json()) as { message?: string };
          if (j?.message) detail = j.message;
        } catch {
          /* ignore */
        }
        throw new Error(detail || "Update failed");
      }
      return res.json() as Promise<Message>;
    },
    onSuccess: () => {
      invalidateThreadQueries();
      setEditingMessageId(null);
      setEditDraft("");
      toast({ title: "Message updated" });
    },
    onError: (err: Error) => {
      toast({
        title: "Could not edit message",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const deleteForMeMutation = useMutation({
    mutationFn: async (messageId: string) => {
      if (!userId) throw new Error("Not signed in");
      const res = await fetch(buildApiUrl(`/api/messages/${messageId}/delete-for-me`), {
        method: "POST",
        headers: { ...getAuthHeaders(true) },
        credentials: "include",
        body: JSON.stringify({ userId }),
      });
      if (!res.ok && res.status !== 204) {
        let detail = res.statusText;
        try {
          const j = (await res.json()) as { message?: string };
          if (j?.message) detail = j.message;
        } catch {
          /* ignore */
        }
        throw new Error(detail || "Delete failed");
      }
    },
    onSuccess: () => {
      invalidateThreadQueries();
      setConfirmDialog(null);
      toast({ title: "Removed from your chat" });
    },
    onError: (err: Error) => {
      toast({
        title: "Could not delete",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const deleteForEveryoneMutation = useMutation({
    mutationFn: async (messageId: string) => {
      if (!userId) throw new Error("Not signed in");
      const res = await fetch(buildApiUrl(`/api/messages/${messageId}/delete-for-everyone`), {
        method: "POST",
        headers: { ...getAuthHeaders(true) },
        credentials: "include",
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        let detail = res.statusText;
        try {
          const j = (await res.json()) as { message?: string };
          if (j?.message) detail = j.message;
        } catch {
          /* ignore */
        }
        throw new Error(detail || "Delete failed");
      }
      return res.json() as Promise<Message>;
    },
    onSuccess: () => {
      invalidateThreadQueries();
      setConfirmDialog(null);
      setEditingMessageId(null);
      setEditDraft("");
      toast({ title: "Deleted for everyone" });
    },
    onError: (err: Error) => {
      toast({
        title: "Could not delete for everyone",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const copyMessageText = async (msg: Message) => {
    let text = "";
    if (msg.deletedForEveryone) text = "This message was deleted";
    else if (msg.voiceUrl || msg.type === "voice") text = "Voice message";
    else text = msg.content || "";
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied to clipboard" });
    } catch {
      toast({
        title: "Could not copy",
        description: "Clipboard permission may be blocked.",
        variant: "destructive",
      });
    }
  };

  // Ensure arrays are safe (must be declared before use)
  const safeConversations = Array.isArray(conversationSummaries) ? conversationSummaries : [];
  const safeUsers = Array.isArray(users) ? users : [];
  const safeMessages = Array.isArray(messages) ? messages : [];

  // Toast on incoming messages when user isn't currently viewing that thread.
  useEffect(() => {
    if (!userId) return;
    for (const conv of safeConversations) {
      if (!conv?.id || !conv.lastMessage) continue;
      const last = conv.lastMessage;
      if (!last?.id || last.senderId === userId) continue; // only incoming
      const alreadyToastedId = lastToastMsgIdRef.current[conv.id];
      if (alreadyToastedId === last.id) continue;

      // If currently viewing this conversation, don't toast (message is visible).
      if (selectedChat && conv.id === selectedChat) {
        lastToastMsgIdRef.current[conv.id] = last.id;
        continue;
      }

      // If user is anywhere in the app and a new message arrives, toast once.
      const otherId = conv.participant1Id === userId ? conv.participant2Id : conv.participant1Id;
      const other = safeUsers.find((u) => u?.id === otherId);
      const preview =
        last.deletedForEveryone
          ? "Message deleted"
          : last.voiceUrl || last.type === "voice"
            ? "Voice message"
            : String(last.content || "").slice(0, 120);

      toast({
        title: other?.name ? `New message from ${other.name}` : "New message",
        description: preview || "Open Chat to reply.",
      });
      lastToastMsgIdRef.current[conv.id] = last.id;
    }
  }, [safeConversations, safeUsers, selectedChat, toast, userId]);

  // Mark incoming unread messages as read when chat is open.
  useEffect(() => {
    if (!selectedChat || !userId) return;
    const unreadIncoming = safeMessages.filter(
      (m) => m.senderId !== userId && !m.read && !m.deletedForEveryone,
    );
    if (!unreadIncoming.length) return;
    void Promise.all(
      unreadIncoming.map((m) =>
        fetch(buildApiUrl(`/api/messages/${m.id}/read`), {
          method: "PATCH",
          headers: { ...getAuthHeaders(true) },
          credentials: "include",
        }).catch(() => null),
      ),
    ).then(() => {
      void queryClient.invalidateQueries({ queryKey: ["chat-messages"] });
      void queryClient.invalidateQueries({
        queryKey: [`/api/users/${userId}/conversation-summaries`],
      });
      void queryClient.invalidateQueries({
        queryKey: ["/api/users", userId, "chat-unread-count"],
      });
    });
  }, [selectedChat, userId, safeMessages]);

  const handleSend = () => {
    if (message.trim() && selectedChat) {
      sendMutation.mutate(message.trim());
    }
  };

  const MAX_VOICE_BYTES = 2 * 1024 * 1024;

  const blobToDataUrl = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onloadend = () => resolve(r.result as string);
      r.onerror = () => reject(new Error("read failed"));
      r.readAsDataURL(blob);
    });

  const handleVoiceComplete = async (blob: Blob) => {
    if (!selectedChat || !userId) return;
    if (blob.size > MAX_VOICE_BYTES) {
      toast({
        title: "Recording too large",
        description: "Try a shorter voice note.",
        variant: "destructive",
      });
      setShowVoiceRecorder(false);
      return;
    }
    try {
      const voiceUrl = await blobToDataUrl(blob);
      await sendMutation.mutateAsync({
        content: "Voice message",
        type: "voice",
        voiceUrl,
      });
    } catch (e) {
      toast({
        title: "Could not send voice note",
        description: e instanceof Error ? e.message : "Try again",
        variant: "destructive",
      });
    }
  };

  // Get other participant's info
  const formatMsgTime = (d: Date | string | null | undefined) => {
    if (!d) return "";
    const date = typeof d === "string" ? new Date(d) : d;
    if (Number.isNaN(date.getTime())) return "";
    const now = new Date();
    const sameDay =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();
    if (sameDay) {
      return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const getOtherUser = (conv: Conversation) => {
    if (!conv || !userId) return undefined;
    const otherId = conv.participant1Id === userId ? conv.participant2Id : conv.participant1Id;
    return safeUsers.find(u => u && u.id === otherId);
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [safeMessages]);

  useEffect(() => {
    if (location.startsWith("/chat")) setActivePage("chat");
  }, [location]);

  // Open or create thread from /chat?user=<id> (e.g. after match reveal)
  useEffect(() => {
    if (!queryUserId) {
      handoffDoneKey.current = null;
      return;
    }
    if (!userId || queryUserId === userId) return;
    const key = `${userId}:${queryUserId}`;
    if (handoffDoneKey.current === key || handoffInFlight.current) return;
    handoffInFlight.current = true;
    (async () => {
      try {
        const res = await fetch(buildApiUrl("/api/conversations"), {
          method: "POST",
          headers: { ...getAuthHeaders(true) },
          credentials: "include",
          body: JSON.stringify({
            participant1Id: userId,
            participant2Id: queryUserId,
          }),
        });
        if (!res.ok) throw new Error("Failed to open conversation");
        const conv = await res.json();
        await queryClient.invalidateQueries({
          queryKey: [`/api/users/${userId}/conversations`],
        });
        await queryClient.invalidateQueries({
          queryKey: [`/api/users/${userId}/conversation-summaries`],
        });
        await queryClient.invalidateQueries({
          queryKey: ["/api/users", userId, "chat-unread-count"],
        });
        handoffDoneKey.current = key;
        setSelectedChat(conv.id);
        setLocation("/chat");
        toast({ title: "Chat ready", description: "You can start messaging." });
      } catch {
        toast({
          title: "Could not open chat",
          description: "Try again from the person's profile.",
          variant: "destructive",
        });
      } finally {
        handoffInFlight.current = false;
      }
    })();
  }, [userId, queryUserId, setLocation, toast]);

  // Do NOT auto-open the first thread when selectedChat is null — that prevented
  // "Back" from ever showing the inbox (effect kept re-selecting the first conv).

  // Filter conversations by search
  const filteredConversations = safeConversations.filter(conv => {
    if (!conv) return false;
    const otherUser = getOtherUser(conv);
    return otherUser?.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const selectedConversation = safeConversations.find(c => c && c.id === selectedChat);
  const selectedOtherUser = selectedConversation ? getOtherUser(selectedConversation) : null;
  /** Used for outgoing message ticks: single = sent (they look offline), double gray = online, double blue = read. */
  const otherRecipientOnline = !!(selectedOtherUser && showOnlineDotForOther(selectedOtherUser));
  const selectedStatusLabel = selectedOtherUser
    ? otherRecipientOnline
      ? "Online"
      : formatLastSeen(selectedOtherUser.lastActiveAt)
    : "";

  return (
    <PageWrapper className="flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-[hsl(var(--surface-2))]">
      {/* Full viewport column: header + chat card fills space above fixed BottomNav */}
      <div className="shrink-0">
        <Header
          showSearch={true}
          title="Chat"
          subtitle="Your conversations and new interests"
          onSearch={(query) => {
            const q = query.trim();
            if (q) {
              try {
                sessionStorage.setItem("matchify_explore_search", q);
              } catch {
                /* ignore */
              }
              setLocation("/explore");
            }
          }}
          onNotifications={() => setLocation("/notifications")}
          onCreate={() => setLocation("/")}
          onSettings={() => setLocation("/profile")}
          onLogout={logout}
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col w-full max-w-lg mx-auto px-4 pb-[calc(5.75rem+env(safe-area-inset-bottom,0px))]">
        <div className="matchify-surface flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-[1.35rem] rounded-b-2xl">
        {/* Conversations List */}
        {!selectedChat ? (
          <div className="flex flex-col flex-1 overflow-hidden bg-transparent min-h-0">
            <div className="px-4 pt-3 pb-1">
              <h1 className="text-lg font-semibold text-gray-900 tracking-tight">Messages</h1>
              <p className="text-xs text-gray-500 mt-0.5">Your conversations</p>
            </div>
            {/* Search */}
            <div className="px-4 py-3 border-b border-border/70">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search messages..."
                  className="w-full pl-9 pr-4 py-2.5 bg-muted/60 rounded-2xl text-sm outline-none placeholder:text-muted-foreground/80"
                  data-testid="input-search-chats"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {!userId ? (
                <div className="p-4 text-center text-gray-400 text-sm">Loading...</div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-4">
                  {searchQuery ? (
                    <>
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                        <Search className="w-7 h-7 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">No conversations found</p>
                        <p className="text-sm text-muted-foreground mt-1">Try a different search term</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-red-100 flex items-center justify-center">
                          <span className="text-3xl">💬</span>
                        </div>
                        <div className="absolute -top-1 -right-1 w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow-md">
                          <span className="text-sm">✨</span>
                        </div>
                      </div>
                      <div>
                        <p className="font-bold text-lg text-foreground">Your inbox is empty</p>
                        <p className="text-sm text-muted-foreground mt-1.5 max-w-[220px] leading-relaxed">
                          Match with someone you like and start a conversation — every great story begins with a message.
                        </p>
                      </div>
                      <button
                        className="mt-1 bg-primary text-primary-foreground text-sm font-semibold px-6 py-2.5 rounded-full shadow-2xs hover:bg-primary/90 transition-colors"
                        onClick={() => setLocation('/explore')}
                      >
                        Explore matches
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <>
                  {/* Matches / New interests row */}
                  <div className="px-4 pt-4 pb-2">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      New interests
                    </p>
                    <div className="mt-2 flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                      {filteredConversations
                        .slice()
                        .sort((a, b) => (b.unreadCount ?? 0) - (a.unreadCount ?? 0))
                        .slice(0, 12)
                        .map((conv) => {
                          const otherUser = getOtherUser(conv);
                          const unread = (conv as ConversationSummary).unreadCount ?? 0;
                          const ring =
                            unread > 0
                              ? "bg-primary"
                              : "bg-border/70";
                          return (
                            <button
                              key={`top-${conv.id}`}
                              type="button"
                              onClick={() => setSelectedChat(conv.id)}
                              className="flex flex-col items-center gap-1 shrink-0"
                              aria-label={otherUser?.name ? `Open chat with ${otherUser.name}` : "Open chat"}
                            >
                              <div className={`rounded-full p-[2px] ${ring}`}>
                                <Avatar className="h-12 w-12 border-2 border-white bg-white">
                                  <AvatarImage src={otherUser?.avatar || undefined} alt="" />
                                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                    {otherUser?.name?.slice(0, 2).toUpperCase() || "??"}
                                  </AvatarFallback>
                                </Avatar>
                              </div>
                              <span className="max-w-[3.5rem] truncate text-[11px] font-semibold text-slate-700">
                                {otherUser?.name?.split(/\s+/)[0] || "Chat"}
                              </span>
                            </button>
                          );
                        })}
                    </div>
                  </div>

                  <div className="divide-y divide-gray-50">
                    {filteredConversations.map((conv) => {
                  const otherUser = getOtherUser(conv);
                  const summary = conv as ConversationSummary;
                  const last = summary.lastMessage;
                  const preview = last?.deletedForEveryone
                    ? "Message deleted"
                    : last?.voiceUrl || last?.type === "voice"
                      ? "Voice message"
                      : last?.content?.slice(0, 80) ||
                        (conv.lastMessageAt ? "Open to continue the chat" : "Say hello 👋");
                  const ts = last?.createdAt ?? conv.lastMessageAt;
                  const unread = summary.unreadCount ?? 0;
                  const isFromMe = last && userId && last.senderId === userId;
                  return (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedChat(conv.id)}
                      className="w-full px-4 py-3.5 flex items-center gap-3 text-left transition-colors hover:bg-[#F9FAFB] active:bg-gray-100"
                      data-testid={`conversation-${conv.id}`}
                    >
                      <div className="relative flex-shrink-0">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={otherUser?.avatar || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary font-bold">
                            {otherUser?.name.slice(0, 2).toUpperCase() || '??'}
                          </AvatarFallback>
                        </Avatar>
                        {otherUser && showOnlineDotForOther(otherUser) ? (
                          <OnlineIndicator className="pointer-events-none absolute bottom-0 right-0 z-[1] h-3 w-3" />
                        ) : null}
                        {unread > 0 && (
                          <span
                            className={
                              unread > 9
                                ? "absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[22px] place-items-center rounded-full border-2 border-white bg-primary px-1 text-[9px] font-bold tabular-nums leading-none tracking-tight text-white"
                                : "absolute -right-0.5 -top-0.5 grid size-[18px] place-items-center rounded-full border-2 border-white bg-primary text-[10px] font-bold tabular-nums leading-none text-white"
                            }
                          >
                            {unread > 9 ? "9+" : unread}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <p className="text-[16px] font-semibold text-slate-900 truncate leading-tight">
                            {otherUser?.name || 'Unknown User'}
                          </p>
                          <span className="text-[12px] text-slate-400 whitespace-nowrap flex-shrink-0">
                            {formatMsgTime(ts)}
                          </span>
                        </div>
                        <p
                          className={`text-[14px] truncate leading-snug ${
                            unread > 0 ? "text-slate-800 font-semibold" : "text-slate-500"
                          }`}
                        >
                          {isFromMe ? `You: ${preview}` : preview}
                        </p>
                      </div>
                    </button>
                  );
                })}
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          /* Chat Area */
          <div className="flex flex-col flex-1 overflow-hidden bg-white min-h-0">
            {/* Chat Header */}
            <div className="px-4 py-3 bg-card/70 backdrop-blur-md border-b border-border/70 flex items-center gap-3 shrink-0">
              <button
                type="button"
                className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors touch-manipulation"
                aria-label="Back to inbox"
                onClick={() => {
                  setSelectedChat(null);
                  if (queryUserId) {
                    setLocation("/chat");
                  }
                }}
              >
                <ArrowLeft className="w-5 h-5" strokeWidth={1.75} />
              </button>
              <div className="relative flex-shrink-0">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedOtherUser?.avatar || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                    {selectedOtherUser?.name.slice(0, 2).toUpperCase() || "??"}
                  </AvatarFallback>
                </Avatar>
                {selectedOtherUser && showOnlineDotForOther(selectedOtherUser) ? (
                  <OnlineIndicator className="pointer-events-none absolute bottom-0 right-0 z-10" />
                ) : null}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 text-[15px] leading-tight truncate">
                  {selectedOtherUser?.name || "Unknown User"}
                </p>
                <p className="text-[12px] text-slate-500 font-medium truncate">
                  {selectedStatusLabel || "Direct message"}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-foreground/[0.05] transition-colors hidden sm:flex border border-transparent hover:border-border/70">
                  <Phone className="w-4 h-4 text-slate-500" strokeWidth={1.75} />
                </button>
                <button className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-foreground/[0.05] transition-colors hidden sm:flex border border-transparent hover:border-border/70">
                  <Video className="w-4 h-4 text-slate-500" strokeWidth={1.75} />
                </button>
                <button className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-foreground/[0.05] transition-colors border border-transparent hover:border-border/70">
                  <MoreVertical className="w-4 h-4 text-slate-500" strokeWidth={1.75} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[hsl(var(--surface-2))] min-h-0">
              <AnimatePresence initial={false}>
                {safeMessages.map((msg, index) => {
                  if (!msg) return null;
                  const isCurrentUser = msg.senderId === userId;
                  const showAvatar =
                    index === 0 ||
                    (safeMessages[index - 1] && safeMessages[index - 1].senderId !== msg.senderId);
                  const isVoice = !!(msg.voiceUrl || msg.type === "voice");
                  const isDeleted = !!msg.deletedForEveryone;
                  const isEditing = editingMessageId === msg.id;
                  const canEditText = isCurrentUser && !isDeleted && !isVoice;
                  const senderUser = !isCurrentUser
                    ? safeUsers.find((u) => u?.id === msg.senderId)
                    : undefined;
                  const showSenderOnlineDot =
                    !!senderUser && showAvatar && showOnlineDotForOther(senderUser);

                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.15 }}
                      className={`flex flex-row gap-0.5 items-start w-full ${isCurrentUser ? "justify-end" : "justify-start"}`}
                    >
                      {!isCurrentUser && (
                        <div
                          className={`relative mt-0.5 flex-shrink-0 ${showAvatar ? "" : "invisible"}`}
                        >
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={senderUser?.avatar || undefined} />
                            <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                              {senderUser?.name?.slice(0, 2).toUpperCase() || "??"}
                            </AvatarFallback>
                          </Avatar>
                          {showSenderOnlineDot ? (
                            <OnlineIndicator className="pointer-events-none absolute bottom-0 right-0 z-10 h-2.5 w-2.5" />
                          ) : null}
                        </div>
                      )}

                      <div
                        className={`flex flex-col gap-1 min-w-0 max-w-[min(100%,20rem)] ${isCurrentUser ? "items-end" : "items-start"}`}
                      >
                        <ContextMenu>
                          <ContextMenuTrigger asChild disabled={isEditing}>
                            <div
                              className={`px-3.5 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
                                isCurrentUser
                                  ? "bg-primary text-white rounded-[18px] rounded-br-[6px]"
                                  : "bg-[#F2F3F5] text-slate-900 rounded-[18px] rounded-bl-[6px]"
                              } ${!isEditing ? "cursor-context-menu touch-manipulation" : ""}`}
                            >
                          {isDeleted ? (
                            <p
                              className={`text-sm italic ${
                                isCurrentUser ? "text-white/85" : "text-gray-500"
                              }`}
                            >
                              This message was deleted
                            </p>
                          ) : isEditing ? (
                            <div className="flex flex-col gap-2 min-w-[min(100vw-6rem,18rem)]">
                              <Textarea
                                value={editDraft}
                                onChange={(e) => setEditDraft(e.target.value)}
                                className={`min-h-[72px] text-sm resize-y ${
                                  isCurrentUser
                                    ? "bg-white/15 border-white/30 text-white placeholder:text-white/50"
                                    : ""
                                }`}
                                rows={3}
                              />
                              <div className="flex gap-2 justify-end flex-wrap">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className={isCurrentUser ? "text-white hover:bg-white/15" : ""}
                                  onClick={() => {
                                    setEditingMessageId(null);
                                    setEditDraft("");
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant={isCurrentUser ? "secondary" : "default"}
                                  disabled={!editDraft.trim() || updateMessageMutation.isPending}
                                  onClick={() => {
                                    const t = editDraft.trim();
                                    if (t) updateMessageMutation.mutate({ id: msg.id, content: t });
                                  }}
                                >
                                  Save
                                </Button>
                              </div>
                            </div>
                          ) : msg.voiceUrl ? (
                            <VoiceMessagePlayer voiceUrl={msg.voiceUrl} isOutgoing={isCurrentUser} />
                          ) : msg.type === "voice" || msg.content === "[Voice Note]" ? (
                            <p
                              className={`text-sm flex items-center gap-2 ${
                                isCurrentUser ? "text-white/90" : "text-gray-600"
                              }`}
                            >
                              <Mic className="w-4 h-4 shrink-0" />
                              Voice message (no audio data)
                            </p>
                          ) : (
                            <p className="text-sm leading-[1.5] break-words whitespace-pre-wrap">{msg.content}</p>
                          )}
                          {!isDeleted && !isEditing && msg.isIcebreaker && (
                            <Badge
                              variant="secondary"
                              className={`mt-1 text-xs border-0 ${
                                isCurrentUser ? "bg-white/20 text-white" : ""
                              }`}
                            >
                              Icebreaker
                            </Badge>
                          )}
                          {!isDeleted && !isEditing && msg.editedAt ? (
                            <p
                              className={`text-[10px] mt-1 ${isCurrentUser ? "text-white/70" : "text-gray-400"}`}
                            >
                              Edited
                            </p>
                          ) : null}
                            </div>
                          </ContextMenuTrigger>
                          <ContextMenuContent className="w-52">
                            <ContextMenuItem
                              onSelect={(e) => {
                                e.preventDefault();
                                void copyMessageText(msg);
                              }}
                            >
                              <span className="flex items-center gap-2">
                                <Copy className="w-4 h-4 shrink-0" />
                                Copy
                              </span>
                            </ContextMenuItem>
                            {canEditText ? (
                              <ContextMenuItem
                                onSelect={(e) => {
                                  e.preventDefault();
                                  setEditingMessageId(msg.id);
                                  setEditDraft(msg.content || "");
                                }}
                              >
                                <span className="flex items-center gap-2">
                                  <Pencil className="w-4 h-4 shrink-0" />
                                  Edit
                                </span>
                              </ContextMenuItem>
                            ) : null}
                            <ContextMenuSeparator />
                            <ContextMenuItem
                              onSelect={(e) => {
                                e.preventDefault();
                                setConfirmDialog({ kind: "me", messageId: msg.id });
                              }}
                            >
                              <span className="flex items-center gap-2">
                                <UserX className="w-4 h-4 shrink-0" />
                                Delete for me
                              </span>
                            </ContextMenuItem>
                            {isCurrentUser && !isDeleted ? (
                              <ContextMenuItem
                                className="text-destructive focus:text-destructive"
                                onSelect={(e) => {
                                  e.preventDefault();
                                  setConfirmDialog({ kind: "everyone", messageId: msg.id });
                                }}
                              >
                                <span className="flex items-center gap-2">
                                  <Ban className="w-4 h-4 shrink-0" />
                                  Delete for everyone
                                </span>
                              </ContextMenuItem>
                            ) : null}
                          </ContextMenuContent>
                        </ContextMenu>
                        <div
                          className={`flex items-center gap-1 px-1 ${isCurrentUser ? "flex-row-reverse" : "flex-row"}`}
                        >
                          <span className="text-[10px] text-gray-400">
                            {msg.createdAt
                              ? new Date(msg.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : ""}
                          </span>
                          {msg.autoDeleteAt && <AutoDeleteTimer deleteAt={msg.autoDeleteAt} />}
                          {isCurrentUser && !isDeleted && (
                            <>
                              {msg.read ? (
                                <CheckCheck
                                  className="h-3 w-3 shrink-0 text-sky-500/90"
                                  strokeWidth={2}
                                  aria-label="Read"
                                />
                              ) : otherRecipientOnline ? (
                                <CheckCheck
                                  className="h-3 w-3 shrink-0 text-slate-400"
                                  strokeWidth={2}
                                  aria-label="Delivered"
                                />
                              ) : (
                                <Check
                                  className="h-3 w-3 shrink-0 text-slate-400"
                                  strokeWidth={2}
                                  aria-label="Sent"
                                />
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0 text-gray-400 hover:text-gray-700 hover:bg-gray-100/80 rounded-full mt-0.5"
                            aria-label="Message actions"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={isCurrentUser ? "end" : "start"} className="w-52">
                          <DropdownMenuItem
                            onSelect={(e) => {
                              e.preventDefault();
                              void copyMessageText(msg);
                            }}
                          >
                            <span className="flex items-center gap-2">
                              <Copy className="w-4 h-4 shrink-0" />
                              Copy
                            </span>
                          </DropdownMenuItem>
                          {canEditText ? (
                            <DropdownMenuItem
                              onSelect={(e) => {
                                e.preventDefault();
                                setEditingMessageId(msg.id);
                                setEditDraft(msg.content || "");
                              }}
                            >
                              <span className="flex items-center gap-2">
                                <Pencil className="w-4 h-4 shrink-0" />
                                Edit
                              </span>
                            </DropdownMenuItem>
                          ) : null}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={(e) => {
                              e.preventDefault();
                              setConfirmDialog({ kind: "me", messageId: msg.id });
                            }}
                          >
                            <span className="flex items-center gap-2">
                              <UserX className="w-4 h-4 shrink-0" />
                              Delete for me
                            </span>
                          </DropdownMenuItem>
                          {isCurrentUser && !isDeleted ? (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onSelect={(e) => {
                                e.preventDefault();
                                setConfirmDialog({ kind: "everyone", messageId: msg.id });
                              }}
                            >
                              <span className="flex items-center gap-2">
                                <Ban className="w-4 h-4 shrink-0" />
                                Delete for everyone
                              </span>
                            </DropdownMenuItem>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            <AlertDialog
              open={confirmDialog !== null}
              onOpenChange={(open) => {
                if (!open) setConfirmDialog(null);
              }}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {confirmDialog?.kind === "everyone"
                      ? "Delete for everyone?"
                      : "Delete for you only?"}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {confirmDialog?.kind === "everyone"
                      ? "This removes the message for both people in the chat."
                      : "The other person will still see this message. You can hide it from your view only."}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <Button
                    variant={confirmDialog?.kind === "everyone" ? "destructive" : "default"}
                    disabled={deleteForMeMutation.isPending || deleteForEveryoneMutation.isPending}
                    onClick={() => {
                      if (!confirmDialog) return;
                      if (confirmDialog.kind === "me") {
                        deleteForMeMutation.mutate(confirmDialog.messageId);
                      } else {
                        deleteForEveryoneMutation.mutate(confirmDialog.messageId);
                      }
                    }}
                  >
                    Delete
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Icebreakers */}
            <AnimatePresence>
              {showIcebreakers && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-gray-100 bg-white"
                >
                  <Icebreakers
                    onSelect={(text: string) => {
                      setMessage(text);
                      setShowIcebreakers(false);
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input area — voice mode replaces the text row (WhatsApp-style inline bar) */}
            <div className="px-4 pt-3 pb-5 bg-card/70 backdrop-blur-md border-t border-border/70 flex items-center gap-2 shrink-0 min-h-[3.25rem]">
              {showVoiceRecorder ? (
                <VoiceNoteRecorder
                  layout="inline"
                  className="flex-1 min-w-0"
                  autoStart
                  onCancel={() => setShowVoiceRecorder(false)}
                  onRecordComplete={(blob) => void handleVoiceComplete(blob)}
                />
              ) : (
                <>
                  <div className="flex-1 rounded-full border border-border/70 bg-card/70 backdrop-blur-md px-3 py-2.5 flex items-center gap-1.5 min-w-0 shadow-2xs">
                    <input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 min-w-0 bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none py-0.5"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      data-testid="input-message"
                    />
                    <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-slate-500 hover:text-primary"
                          aria-label="Emoji"
                        >
                          <Smile className="w-4 h-4" strokeWidth={1.75} />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0 border-border shadow-lg"
                        align="end"
                        side="top"
                        sideOffset={8}
                      >
                        <EmojiPicker
                          theme={Theme.LIGHT}
                          lazyLoadEmojis
                          width={300}
                          height={340}
                          searchPlaceHolder="Search emojis"
                          onEmojiClick={(d: EmojiClickData) => setMessage((p) => p + d.emoji)}
                        />
                      </PopoverContent>
                    </Popover>
                    <button
                      type="button"
                      className="p-1.5 rounded-full text-primary/80 hover:text-primary transition-colors shrink-0 drop-shadow-[0_0_12px_rgba(114,47,55,0.28)]"
                      onClick={() => setShowIcebreakers(!showIcebreakers)}
                      aria-label="Icebreakers"
                    >
                      <Sparkles className="w-4 h-4" strokeWidth={1.75} />
                    </button>
                    <button
                      type="button"
                      className="p-1.5 rounded-full shrink-0 text-slate-400 hover:text-primary transition-colors"
                      onClick={() => {
                        setShowIcebreakers(false);
                        setShowVoiceRecorder(true);
                      }}
                      aria-label="Record voice note"
                    >
                      <Mic className="w-4 h-4" strokeWidth={1.75} />
                    </button>
                  </div>
                  <button
                    onClick={handleSend}
                    disabled={!message.trim() || sendMutation.isPending}
                    className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-[0_10px_30px_-14px_rgba(15,23,42,0.35)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors flex-shrink-0"
                    data-testid="button-send"
                  >
                    <Send className="w-4 h-4 text-white" strokeWidth={1.75} />
                  </button>
                </>
              )}
            </div>
          </div>
        )}
        </div>
      </div>

      <BottomNav active={activePage} onNavigate={setActivePage} />
    </PageWrapper>
  );
}
