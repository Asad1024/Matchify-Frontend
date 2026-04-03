import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bot, Send, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { apiRequestJson, isClientOnlyApi } from "@/services/api";
import { useUpgrade } from "@/contexts/UpgradeContext";
import { dailyKey, dailyCount, incrementDailyCount, lunaDailyLimitForTier } from "@/lib/entitlements";
import { markClientStateDirty } from "@/lib/clientStateSync";

type AssistantMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt: number;
};

function randomIdPart(bytes = 8) {
  try {
    const arr = new Uint8Array(bytes);
    crypto.getRandomValues(arr);
    return Array.from(arr)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2);
  }
}

function makeId() {
  return `${Date.now().toString(36)}_${randomIdPart(10)}_${Math.random().toString(36).slice(2)}`;
}

/** Persisted thread from a previous free-tier session — must not block Luna after upgrade. */
const FREE_TIER_LUNA_OPENER =
  "Luna is available on Plus. Upgrade to unlock AI chat.";

function isPersistedFreeTierPlaceholder(msgs: AssistantMessage[]): boolean {
  if (!msgs.length) return false;
  return msgs.every(
    (m) =>
      m.role === "assistant" &&
      (m.text === FREE_TIER_LUNA_OPENER || m.text.includes("Upgrade to unlock AI chat")),
  );
}

function formatTime(ms: number) {
  try {
    return new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 px-0.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block h-2 w-2 rounded-full bg-muted-foreground/60"
          initial={{ opacity: 0.35, y: 0 }}
          animate={{ opacity: [0.35, 0.9, 0.35], y: [0, -2, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.12, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

async function getAssistantReply(params: {
  userMessage: string;
  context?: Record<string, unknown>;
  transcript?: Array<{ role: "user" | "luna"; content: string }>;
}) {
  if (isClientOnlyApi()) {
    const text = params.userMessage.trim();
    const smallTalk = [
      "Hi! How are you feeling today?",
      "How’s your day going so far?",
      "Tell me what’s happening—who are we talking to?",
    ];
    const idx = Math.abs(text.length * 31) % smallTalk.length;
    return { reply: smallTalk[idx] };
  }

  return await apiRequestJson<{ reply: string; nudge?: string }>("POST", "/api/assistant/chat", params);
}

async function getAssistantOpener(params: { pathname: string }) {
  if (isClientOnlyApi()) {
    return { reply: "Hey—what are we working on today?" };
  }
  return await apiRequestJson<{ reply: string }>("POST", "/api/assistant/open", params);
}

function loadPersistedAssistantMessages(key: string): AssistantMessage[] | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return null;
    const out: AssistantMessage[] = [];
    for (const row of data) {
      if (!row || typeof row !== "object") continue;
      const r = row as Record<string, unknown>;
      if (r.role !== "user" && r.role !== "assistant") continue;
      if (typeof r.text !== "string" || typeof r.createdAt !== "number") continue;
      const id = typeof r.id === "string" ? r.id : makeId();
      out.push({ id, role: r.role, text: r.text, createdAt: r.createdAt });
    }
    return out.length > 0 ? out : null;
  } catch {
    return null;
  }
}

export function LunaChatPanel({
  assistantPathname,
  className,
  persistKey,
}: {
  /** Sent to `/api/assistant/*` so Luna opens with the right context (e.g. embedded on coaching page). */
  assistantPathname?: string;
  className?: string;
  /** When set, messages are restored from and saved to `localStorage` under this key (e.g. per user). */
  persistKey?: string;
} = {}) {
  const { tier, requireTier } = useUpgrade();
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [openerLoading, setOpenerLoading] = useState(true);
  const [messages, setMessages] = useState<AssistantMessage[]>(() => []);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const lastUserMessageAtRef = useRef<number>(0);
  const lastAssistantMessageAtRef = useRef<number>(0);

  const context = useMemo(() => {
    const pathname =
      (assistantPathname && assistantPathname.trim()) ||
      (typeof window !== "undefined" ? window.location.pathname : "/");
    return { pathname };
  }, [assistantPathname]);

  useEffect(() => {
    const t = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, []);

  const applyFreeTierOpener = useCallback(() => {
    setMessages([
      {
        id: makeId(),
        role: "assistant",
        text: FREE_TIER_LUNA_OPENER,
        createdAt: Date.now(),
      },
    ]);
  }, []);

  const fetchAssistantOpener = useCallback(async () => {
    if (tier === "free") {
      applyFreeTierOpener();
      return;
    }
    const res = await getAssistantOpener({ pathname: String(context.pathname || "") });
    const replyText = String(res?.reply || "").trim();
    if (replyText) {
      setMessages([{ id: makeId(), role: "assistant", text: replyText, createdAt: Date.now() }]);
    }
  }, [tier, context.pathname, applyFreeTierOpener]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (tier === "free") {
          if (!cancelled) {
            applyFreeTierOpener();
            setOpenerLoading(false);
          }
          return;
        }
        if (persistKey) {
          const restored = loadPersistedAssistantMessages(persistKey);
          if (restored && restored.length > 0) {
            if (isPersistedFreeTierPlaceholder(restored)) {
              try {
                localStorage.removeItem(persistKey);
                markClientStateDirty();
              } catch {
                /* ignore */
              }
              if (!cancelled) {
                await fetchAssistantOpener();
                setOpenerLoading(false);
              }
              return;
            }
            if (!cancelled) {
              setMessages(restored);
              setOpenerLoading(false);
            }
            return;
          }
        }
        await fetchAssistantOpener();
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setOpenerLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tier, persistKey, applyFreeTierOpener, fetchAssistantOpener]);

  const clearPersistedThread = useCallback(() => {
    if (!persistKey) return;
    try {
      localStorage.removeItem(persistKey);
      markClientStateDirty();
    } catch {
      /* ignore */
    }
    setMessages([]);
    setOpenerLoading(true);
    void (async () => {
      try {
        if (tier === "free") {
          applyFreeTierOpener();
        } else {
          await fetchAssistantOpener();
        }
      } catch {
        /* ignore */
      } finally {
        setOpenerLoading(false);
      }
    })();
  }, [persistKey, tier, applyFreeTierOpener, fetchAssistantOpener]);

  useEffect(() => {
    if (!persistKey || openerLoading) return;
    // Never persist the free-tier paywall placeholder — after upgrade it would reload and block Luna.
    if (tier === "free") return;
    const t = window.setTimeout(() => {
      try {
        localStorage.setItem(persistKey, JSON.stringify(messages));
        markClientStateDirty();
      } catch {
        /* quota or private mode */
      }
    }, 200);
    return () => window.clearTimeout(t);
  }, [messages, persistKey, openerLoading, tier]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 0);
    return () => window.clearTimeout(t);
  }, [messages.length]);

  const send = async () => {
    if (!requireTier({ feature: "Luna (AI chat)", minTier: "plus", reason: "Free plan doesn’t include AI chat." })) {
      return;
    }
    const text = input.trim();
    if (!text || busy) return;

    const limit = lunaDailyLimitForTier(tier);
    if (Number.isFinite(limit)) {
      const key = dailyKey("luna_msgs", "global");
      const used = dailyCount(key);
      if (used >= limit) {
        requireTier({
          feature: "Luna (AI chat)",
          minTier: "premium",
          reason: "You’ve hit today’s Luna message limit on Plus.",
        });
        return;
      }
      incrementDailyCount(key, 1);
    }

    setInput("");
    const userMsg: AssistantMessage = { id: makeId(), role: "user", text, createdAt: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    lastUserMessageAtRef.current = userMsg.createdAt;

    setBusy(true);
    try {
      const transcript = messages
        .slice(-12)
        .map((m) => ({ role: m.role === "assistant" ? ("luna" as const) : ("user" as const), content: m.text }));
      transcript.push({ role: "user", content: text });

      const res = await getAssistantReply({ userMessage: text, context, transcript });
      const replyText = String(res?.reply || "").trim() || "I’m here—tell me a bit more.";
      const assistantMsg: AssistantMessage = { id: makeId(), role: "assistant", text: replyText, createdAt: Date.now() };
      lastAssistantMessageAtRef.current = assistantMsg.createdAt;
      setMessages((prev) => [...prev, assistantMsg]);

      const nudge = String(res?.nudge || "").trim();
      if (nudge) {
        const scheduledAt = Date.now();
        window.setTimeout(() => {
          // Only nudge if user hasn't typed since the assistant reply.
          if (lastUserMessageAtRef.current > assistantMsg.createdAt) return;
          // Avoid stacking nudges back-to-back.
          if (lastAssistantMessageAtRef.current > assistantMsg.createdAt) return;
          const nudgeMsg: AssistantMessage = { id: makeId(), role: "assistant", text: nudge, createdAt: Date.now() };
          lastAssistantMessageAtRef.current = nudgeMsg.createdAt;
          setMessages((prev) => [...prev, nudgeMsg]);
        }, 2200 + (scheduledAt % 600)); // slight natural jitter
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Request failed";
      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          role: "assistant",
          text: `I couldn’t reach the assistant right now (${msg}). Try again in a moment.`,
          createdAt: Date.now(),
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const canSend = !busy && Boolean(input.trim());
  // (Quick prompt chips removed for a simpler Luna chat.)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={cn("h-full w-full bg-transparent flex flex-col", className)}
    >
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
            >
              <div className="max-w-[min(720px,92%)]">
                <div className={cn("flex items-end gap-2", m.role === "user" ? "justify-end" : "justify-start")}>
                  {m.role === "assistant" ? (
                    <div
                      className="mb-1 grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-white bg-gradient-to-br from-[#722F37] to-[#8B2942] shadow-[0_10px_30px_-18px_rgba(114,47,55,0.55)]"
                      aria-label="Luna"
                      title="Luna"
                    >
                      <Bot className="h-4 w-4 text-white" strokeWidth={1.75} aria-hidden />
                    </div>
                  ) : null}

                  <div
                    className={cn(
                      "rounded-[20px] px-4 py-3 shadow-sm",
                      m.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-[8px]"
                        : "border border-white/60 bg-primary/[0.05] text-slate-900 backdrop-blur-md rounded-bl-[8px]",
                    )}
                  >
                    <div
                      className={cn(
                        "whitespace-pre-wrap",
                        m.role === "assistant" ? "text-[16px] leading-[1.6]" : "text-[14px] leading-relaxed",
                      )}
                    >
                      {m.text}
                    </div>
                  </div>
                </div>
                <div
                  className={cn(
                    "mt-1 text-[10px] text-muted-foreground/80",
                    m.role === "user" ? "text-right pr-1" : "pl-1",
                  )}
                >
                  {formatTime(m.createdAt)}
                </div>
              </div>
            </motion.div>
          ))}

          {(openerLoading || busy) && (
            <motion.div
              key="typing"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.14, ease: "easeOut" }}
              className="flex justify-start"
            >
              <div className="max-w-[min(720px,90%)]">
                <div className="flex items-end gap-2">
                  <div
                    className="mb-1 grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-white bg-gradient-to-br from-[#722F37] to-[#8B2942] shadow-[0_10px_30px_-18px_rgba(114,47,55,0.55)]"
                    aria-hidden
                  >
                    <Bot className="h-4 w-4 text-white" strokeWidth={1.75} aria-hidden />
                  </div>
                  <div className="rounded-[20px] rounded-bl-[8px] border border-white/60 bg-primary/[0.05] px-4 py-3 text-slate-900 shadow-sm backdrop-blur-md">
                    <TypingDots />
                  </div>
                </div>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground/80 pl-1">
                  <span className="relative inline-flex h-2 w-2">
                    <span className="absolute inline-flex h-2 w-2 rounded-full bg-primary/30 blur-[1px]" />
                    <motion.span
                      className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary/70"
                      animate={{ opacity: [0.35, 1, 0.35] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </span>
                  <span>{openerLoading ? "Luna is joining…" : "Luna is thinking…"}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      <div className="safe-bottom px-4 pb-3 pt-2">
        <div className="mx-auto max-w-[720px]">
          {tier === "free" ? (
            <div className="mb-2 rounded-[18px] border border-primary/15 bg-primary/[0.06] px-4 py-3 text-[13px] text-slate-700">
              <span className="font-semibold text-slate-900">Upgrade required.</span> Luna is available on Plus and above.
              <Button
                className="mt-3 h-10 w-full rounded-full"
                onClick={() => requireTier({ feature: "Luna (AI chat)", minTier: "plus" })}
              >
                View plans
              </Button>
            </div>
          ) : null}
          <div className="rounded-full border border-[#F0F0F0] bg-white/75 shadow-[0_18px_60px_-28px_rgba(15,23,42,0.35)] backdrop-blur-md">
            <div className="flex items-center gap-2 px-2 py-2">
              <div className="relative flex-1">
                <Sparkles
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/70"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={busy ? "Luna is thinking…" : "Type a message…"}
                  disabled={busy || tier === "free"}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") send();
                  }}
                  className={cn(
                    "h-11 w-full rounded-full border-0 bg-transparent pl-10 pr-10 text-[14px] shadow-none",
                    "placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0",
                  )}
                />
              </div>

              <Button
                type="button"
                onClick={send}
                disabled={!canSend || tier === "free"}
                size="icon"
                aria-label="Send"
                className={cn(
                  "h-11 w-11 rounded-full",
                  canSend
                    ? "bg-primary text-primary-foreground shadow-[0_18px_60px_-28px_rgba(114,47,55,0.55)] glow-primary hover:brightness-[0.98]"
                    : "bg-slate-200 text-slate-500 shadow-none",
                )}
              >
                <Send className="h-4 w-4" strokeWidth={2} />
              </Button>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 px-1 text-[11px] text-slate-500/90">
            <span className="min-w-0 truncate">Tip: tell me who you’re talking to and the vibe you want.</span>
            <div className="flex shrink-0 items-center gap-2">
              {persistKey && tier !== "free" ? (
                <button
                  type="button"
                  className="font-semibold text-primary hover:underline"
                  onClick={clearPersistedThread}
                >
                  Clear saved chat
                </button>
              ) : null}
              <span>{busy ? "Thinking…" : "Ready"}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

