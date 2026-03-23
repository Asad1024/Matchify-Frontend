import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useSearchParams } from "wouter";
import { buildApiUrl } from "@/services/api";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/common/Header";
import PageWrapper from "@/components/common/PageWrapper";
import BottomNav from "@/components/common/BottomNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, Search, MoreVertical, Phone, Video, Check, CheckCheck, Mic, ArrowLeft, Sparkles } from "lucide-react";
import { useCurrentUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { VoiceNoteRecorder } from "@/components/chat/VoiceNoteRecorder";
import { Icebreakers } from "@/components/chat/Icebreakers";
import { AutoDeleteTimer } from "@/components/chat/AutoDeleteTimer";
import { EmptyState } from "@/components/common/EmptyState";

type Conversation = {
  id: string;
  participant1Id: string;
  participant2Id: string;
  lastMessageAt: Date | null;
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
};

type User = {
  id: string;
  name: string;
  avatar: string | null;
};

export default function Chat() {
  const [activePage, setActivePage] = useState('chat');
  const [, setLocation] = useLocation();
  const [searchParams] = useSearchParams();
  const queryUserId = searchParams.get("user");
  const handoffInFlight = useRef(false);
  const handoffDoneKey = useRef<string | null>(null);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showIcebreakers, setShowIcebreakers] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { userId } = useCurrentUser();
  const { logout } = useAuth();
  const { toast } = useToast();

  // Fetch conversations
  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: [`/api/users/${userId}/conversations`],
    enabled: !!userId,
  });

  // Fetch all users
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // Fetch messages for selected conversation
  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ['/api/messages', selectedChat],
    enabled: !!selectedChat,
  });

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!selectedChat || !userId) return;
      const response = await fetch(`/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedChat,
          senderId: userId,
          content,
        }),
      });
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages', selectedChat] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/conversations`] });
      setMessage('');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  // Ensure arrays are safe (must be declared before use)
  const safeConversations = Array.isArray(conversations) ? conversations : [];
  const safeUsers = Array.isArray(users) ? users : [];
  const safeMessages = Array.isArray(messages) ? messages : [];

  const handleSend = () => {
    if (message.trim() && selectedChat) {
      sendMutation.mutate(message);
    }
  };

  // Get other participant's info
  const getOtherUser = (conv: Conversation) => {
    if (!conv || !userId) return undefined;
    const otherId = conv.participant1Id === userId ? conv.participant2Id : conv.participant1Id;
    return safeUsers.find(u => u && u.id === otherId);
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [safeMessages]);

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
          headers: { "Content-Type": "application/json" },
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

  // Auto-select first conversation when not opening from query
  useEffect(() => {
    if (queryUserId) return;
    if (!selectedChat && safeConversations.length > 0 && safeConversations[0]?.id) {
      setSelectedChat(safeConversations[0].id);
    }
  }, [safeConversations, selectedChat, queryUserId]);

  // Filter conversations by search
  const filteredConversations = safeConversations.filter(conv => {
    if (!conv) return false;
    const otherUser = getOtherUser(conv);
    return otherUser?.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const selectedConversation = safeConversations.find(c => c && c.id === selectedChat);
  const selectedOtherUser = selectedConversation ? getOtherUser(selectedConversation) : null;

  return (
    <PageWrapper>
    <div className="min-h-screen bg-gray-50 pb-24">
      {!selectedChat && (
        <Header
          showSearch={false}
          onLogout={logout}
          title="Messages"
        />
      )}

      <div className="max-w-lg mx-auto h-[calc(100vh-56px)] flex flex-col">
        {/* Conversations List */}
        {!selectedChat ? (
          <div className="flex flex-col flex-1 overflow-hidden bg-white">
            {/* Search */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search messages..."
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-100 rounded-2xl text-sm outline-none placeholder-gray-400"
                  data-testid="input-search-chats"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
              {!userId ? (
                <div className="p-4 text-center text-gray-400 text-sm">Loading...</div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8">
                  <EmptyState
                    useMascot={true}
                    mascotType="default"
                    title={searchQuery ? 'No conversations found' : 'No messages yet'}
                    description={searchQuery ? 'Try a different search term' : 'Start matching with people to begin conversations!'}
                  />
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const otherUser = getOtherUser(conv);
                  return (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedChat(conv.id)}
                      className="w-full px-4 py-3.5 flex items-center gap-3 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
                      data-testid={`conversation-${conv.id}`}
                    >
                      <div className="relative flex-shrink-0">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={otherUser?.avatar || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary font-bold">
                            {otherUser?.name.slice(0, 2).toUpperCase() || '??'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-primary rounded-full border-2 border-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <p className="font-bold text-gray-900 text-sm truncate">
                            {otherUser?.name || 'Unknown User'}
                          </p>
                          <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                            {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 truncate">Tap to view messages</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          /* Chat Area */
          <div className="flex flex-col flex-1 overflow-hidden bg-white">
            {/* Chat Header */}
            <div className="px-4 py-3 bg-white border-b border-gray-100 flex items-center gap-3">
              <button
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                onClick={() => setSelectedChat(null)}
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
              <div className="relative flex-shrink-0">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={selectedOtherUser?.avatar || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                    {selectedOtherUser?.name.slice(0, 2).toUpperCase() || '??'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-primary rounded-full border-2 border-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm leading-tight">
                  {selectedOtherUser?.name || 'Unknown User'}
                </p>
                <p className="text-xs text-primary flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                  Active now
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors hidden sm:flex">
                  <Phone className="w-4 h-4 text-gray-500" />
                </button>
                <button className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors hidden sm:flex">
                  <Video className="w-4 h-4 text-gray-500" />
                </button>
                <button className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors">
                  <MoreVertical className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
              <AnimatePresence initial={false}>
                {safeMessages.map((msg, index) => {
                  if (!msg) return null;
                  const isCurrentUser = msg.senderId === userId;
                  const showAvatar = index === 0 || (safeMessages[index - 1] && safeMessages[index - 1].senderId !== msg.senderId);

                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.15 }}
                      className={`flex gap-2 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      {!isCurrentUser && (
                        <Avatar className={`w-7 h-7 flex-shrink-0 ${showAvatar ? '' : 'invisible'}`}>
                          <AvatarImage src={safeUsers.find(u => u?.id === msg.senderId)?.avatar || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                            {safeUsers.find(u => u?.id === msg.senderId)?.name?.slice(0, 2).toUpperCase() || '??'}
                          </AvatarFallback>
                        </Avatar>
                      )}

                      <div className={`max-w-[75%] flex flex-col gap-1 ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                        <div
                          className={`px-3.5 py-2.5 rounded-2xl ${
                            isCurrentUser
                              ? 'bg-primary text-white rounded-br-sm'
                              : 'bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-100'
                          }`}
                        >
                          {msg.type === 'voice' && msg.voiceUrl ? (
                            <div className="flex items-center gap-2">
                              <Mic className="w-4 h-4" />
                              <audio controls src={msg.voiceUrl} className="max-w-full" />
                            </div>
                          ) : (
                            <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                          )}
                          {msg.isIcebreaker && (
                            <Badge variant="secondary" className="mt-1 text-xs bg-white/20 text-white border-0">Icebreaker</Badge>
                          )}
                        </div>
                        <div className={`flex items-center gap-1 px-1 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
                          <span className="text-[10px] text-gray-400">
                            {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                          {msg.autoDeleteAt && <AutoDeleteTimer deleteAt={msg.autoDeleteAt} />}
                          {isCurrentUser && (
                            msg.read
                              ? <CheckCheck className="w-3 h-3 text-primary" />
                              : <Check className="w-3 h-3 text-gray-300" />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

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

            {/* Voice recorder */}
            <AnimatePresence>
              {showVoiceRecorder && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-gray-100 bg-white"
                >
                  <VoiceNoteRecorder
                    onRecordComplete={(blob: Blob) => {
                      if (selectedChat && userId) {
                        sendMutation.mutate(`[Voice Note]`);
                      }
                      setShowVoiceRecorder(false);
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input area */}
            <div className="px-4 py-3 bg-white border-t border-gray-100 flex items-end gap-2">
              <div className="flex-1 bg-gray-100 rounded-3xl px-4 py-2.5 flex items-center gap-2">
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  data-testid="input-message"
                />
                <button
                  className="text-gray-400 hover:text-primary transition-colors"
                  onClick={() => setShowIcebreakers(!showIcebreakers)}
                >
                  <Sparkles className="w-4 h-4" />
                </button>
                <button
                  className="text-gray-400 hover:text-primary transition-colors"
                  onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
                >
                  <Mic className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={handleSend}
                disabled={!message.trim() || sendMutation.isPending}
                className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-md shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors flex-shrink-0"
                data-testid="button-send"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        )}
      </div>

      {!selectedChat && <BottomNav active={activePage} onNavigate={setActivePage} />}
    </div>
    </PageWrapper>
  );
}
