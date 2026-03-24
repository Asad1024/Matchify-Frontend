import { Card, CardContent } from "@/components/ui/card";

export type IntentBarUser = {
  name: string;
  commitmentIntention?: string | null;
  marriageTimeline?: string | null;
};

const INTENTION_STEPS = [
  { key: "chatting", label: "Getting to know", emoji: "💬" },
  { key: "casual", label: "Casual dating", emoji: "☕" },
  { key: "serious", label: "Serious relationship", emoji: "❤️" },
  { key: "marriage", label: "Marriage", emoji: "💍" },
];

const INTENTION_ALIASES: Record<string, string> = {
  hookup: "chatting",
  talking: "chatting",
  chatting: "chatting",
  friends: "chatting",
  date: "casual",
  dating: "casual",
  casual: "casual",
  serious: "serious",
  committed: "serious",
  marriage: "marriage",
  nikkah: "marriage",
};

export function normalizeCommitmentIntention(raw: string | null | undefined): string {
  if (!raw || typeof raw !== "string") return "chatting";
  const k = raw.toLowerCase().trim();
  if (INTENTION_STEPS.some((s) => s.key === k)) return k;
  return INTENTION_ALIASES[k] || "chatting";
}

type ProfileMarriageIntentBarProps = {
  user: IntentBarUser;
  /** 'self' = your profile copy; 'other' = viewing someone else */
  variant?: "self" | "other";
  className?: string;
};

/**
 * Muzz-style marriage-intentions strip (chatting → casual → serious → marriage).
 */
export function ProfileMarriageIntentBar({
  user,
  variant = "other",
  className = "",
}: ProfileMarriageIntentBarProps) {
  const stepKey = normalizeCommitmentIntention(user.commitmentIntention);
  const activeIdx = INTENTION_STEPS.findIndex((s) => s.key === stepKey);
  const idx = activeIdx === -1 ? 0 : activeIdx;
  const first = user.name.split(" ")[0] || "Member";
  const heading =
    variant === "self"
      ? "Your marriage intentions"
      : `${first}'s marriage intentions`;

  return (
    <Card className={`border-primary/15 shadow-sm overflow-hidden ${className}`}>
      <CardContent className="p-4 sm:p-5">
        <h2 className="font-display font-semibold text-base sm:text-lg mb-1 text-foreground">{heading}</h2>
        <p className="text-[11px] text-muted-foreground mb-4">
          {variant === "self"
            ? "Where you are on the path to marriage — update anytime (e.g. after AI Matchmaker)."
            : `Where they are on the path to marriage — they update this on their profile / AI Matchmaker.`}
        </p>
        <div className="relative flex items-center justify-between mb-2">
          <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-1.5 bg-muted rounded-full" />
          <div
            className="absolute left-4 top-1/2 -translate-y-1/2 h-1.5 bg-primary rounded-full transition-all duration-700"
            style={{
              width:
                idx === 0 ? "0%" : `calc(${(idx / (INTENTION_STEPS.length - 1)) * 100}% - 2rem)`,
            }}
          />
          {INTENTION_STEPS.map((step, i) => (
            <div key={step.key} className="relative z-10 flex flex-col items-center gap-1">
              <div
                className={`flex items-center justify-center rounded-full border-2 transition-all duration-300 ${
                  i < idx
                    ? "w-8 h-8 bg-primary border-primary text-white text-sm"
                    : i === idx
                      ? "w-11 h-11 bg-primary border-primary text-white text-xl shadow-lg shadow-primary/30 ring-4 ring-primary/20"
                      : "w-8 h-8 bg-background border-muted-foreground/30 text-muted-foreground text-sm"
                }`}
              >
                {i <= idx ? (
                  step.emoji
                ) : (
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/30 block" />
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-1">
          {INTENTION_STEPS.map((step, i) => (
            <span
              key={step.key}
              className={`text-[9px] sm:text-[10px] font-medium text-center w-1/4 leading-tight ${
                i === idx ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {step.label}
            </span>
          ))}
        </div>
        {user.marriageTimeline && (
          <div className="mt-3 inline-flex items-center gap-1.5 bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-semibold">
            <span>⏱</span> Ready in {user.marriageTimeline}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
