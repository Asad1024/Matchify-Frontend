import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight, ArrowLeft, Sparkles, Heart, Brain, Target, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface SelfDiscoveryFlowProps {
  userId: string;
  onComplete: (data: SelfDiscoveryData) => void;
}

interface SelfDiscoveryData {
  commitmentIntention: string;
  loveLanguage: string;
  topPriorities: string[];
  relationshipReadiness: { score: number; blindSpots: string[]; needsWork: string[] };
}

type Step = "commitment" | "love-language" | "priorities" | "readiness" | "results";

const COMMITMENT_OPTIONS = [
  { value: "hookup", label: "Casual connections", emoji: "✨", description: "Exploring and meeting people" },
  { value: "casual", label: "Casual dating", emoji: "☕", description: "Fun dates, no pressure" },
  { value: "serious", label: "Serious relationship", emoji: "❤️", description: "Looking for a real partner" },
  { value: "marriage", label: "Marriage-minded", emoji: "💍", description: "Ready for forever" },
];

const LOVE_LANGUAGE_OPTIONS = [
  { value: "words", label: "Words of Affirmation", emoji: "💬", description: "Verbal love, compliments, encouragement" },
  { value: "acts", label: "Acts of Service", emoji: "🛠️", description: "Actions speak louder than words" },
  { value: "gifts", label: "Receiving Gifts", emoji: "🎁", description: "Thoughtful gestures and tokens" },
  { value: "time", label: "Quality Time", emoji: "⏰", description: "Undivided attention and presence" },
  { value: "touch", label: "Physical Touch", emoji: "🤝", description: "Hugs, hand-holding, closeness" },
];

const PRIORITY_OPTIONS = [
  "Faith & Spirituality", "Family", "Career & Ambition", "Travel & Adventure",
  "Health & Fitness", "Creativity & Arts", "Social Life", "Personal Growth",
  "Financial Stability", "Intellectual Stimulation", "Loyalty & Trust", "Fun & Humour",
];

const READINESS_QUESTIONS = [
  { q: "I have healed from past relationship wounds", key: "healed" },
  { q: "I know my own values and deal-breakers", key: "values" },
  { q: "I communicate openly and honestly", key: "communication" },
  { q: "I'm emotionally available for a new relationship", key: "available" },
  { q: "I respect different perspectives and boundaries", key: "respect" },
  { q: "I take accountability for my actions", key: "accountability" },
];

const STEPS: Step[] = ["commitment", "love-language", "priorities", "readiness", "results"];
const STEP_LABELS = ["Intention", "Love Language", "Priorities", "Readiness", "Results"];

export default function SelfDiscoveryFlow({ userId, onComplete }: SelfDiscoveryFlowProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("commitment");
  const [commitment, setCommitment] = useState("");
  const [loveLanguage, setLoveLanguage] = useState("");
  const [priorities, setPriorities] = useState<string[]>([]);
  const [readiness, setReadiness] = useState<Record<string, number>>({});

  const currentStepIdx = STEPS.indexOf(step);
  const progress = ((currentStepIdx) / (STEPS.length - 1)) * 100;

  const saveMutation = useMutation({
    mutationFn: async (data: SelfDiscoveryData) => {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          selfDiscoveryCompleted: true,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
      onComplete(data);
    },
    onError: () => {
      toast({ title: "Failed to save. Please try again.", variant: "destructive" });
    },
  });

  const togglePriority = (p: string) => {
    setPriorities((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : prev.length < 5 ? [...prev, p] : prev
    );
  };

  const computeReadinessScore = () => {
    const scores = Object.values(readiness);
    if (!scores.length) return 50;
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return Math.round((avg / 5) * 100);
  };

  const handleFinish = () => {
    const score = computeReadinessScore();
    const lowScores = READINESS_QUESTIONS.filter((q) => (readiness[q.key] || 3) < 3).map((q) => q.q);
    const data: SelfDiscoveryData = {
      commitmentIntention: commitment,
      loveLanguage,
      topPriorities: priorities,
      relationshipReadiness: {
        score,
        blindSpots: lowScores.slice(0, 2),
        needsWork: lowScores.slice(2, 4),
      },
    };
    saveMutation.mutate(data);
  };

  const canProceed = () => {
    if (step === "commitment") return !!commitment;
    if (step === "love-language") return !!loveLanguage;
    if (step === "priorities") return priorities.length >= 3;
    if (step === "readiness") return Object.keys(readiness).length === READINESS_QUESTIONS.length;
    return true;
  };

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{STEP_LABELS[currentStepIdx]}</span>
          <span>{currentStepIdx + 1} / {STEPS.length}</span>
        </div>
        <Progress value={progress} className="h-1.5" />
        <div className="flex gap-1">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`flex-1 h-1 rounded-full transition-colors ${
                i <= currentStepIdx ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
        >
          {/* Commitment Intention */}
          {step === "commitment" && (
            <div className="space-y-3">
              <div className="text-center mb-4">
                <Heart className="w-8 h-8 text-primary mx-auto mb-2" />
                <h2 className="text-lg font-bold text-foreground">What are you looking for?</h2>
                <p className="text-sm text-muted-foreground">Be honest — there's no wrong answer.</p>
              </div>
              {COMMITMENT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setCommitment(opt.value)}
                  className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all ${
                    commitment === opt.value
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  <span className="text-2xl">{opt.emoji}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-foreground">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.description}</p>
                  </div>
                  {commitment === opt.value && (
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Love Language */}
          {step === "love-language" && (
            <div className="space-y-3">
              <div className="text-center mb-4">
                <Sparkles className="w-8 h-8 text-primary mx-auto mb-2" />
                <h2 className="text-lg font-bold text-foreground">What's your love language?</h2>
                <p className="text-sm text-muted-foreground">How do you most feel loved?</p>
              </div>
              {LOVE_LANGUAGE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setLoveLanguage(opt.value)}
                  className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all ${
                    loveLanguage === opt.value
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  <span className="text-2xl">{opt.emoji}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-foreground">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.description}</p>
                  </div>
                  {loveLanguage === opt.value && (
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Priorities */}
          {step === "priorities" && (
            <div className="space-y-3">
              <div className="text-center mb-4">
                <Target className="w-8 h-8 text-primary mx-auto mb-2" />
                <h2 className="text-lg font-bold text-foreground">Your top priorities</h2>
                <p className="text-sm text-muted-foreground">Pick 3–5 things most important to you.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {PRIORITY_OPTIONS.map((p) => {
                  const selected = priorities.includes(p);
                  return (
                    <button
                      key={p}
                      onClick={() => togglePriority(p)}
                      className={`px-3 py-2 rounded-full text-xs font-semibold border-2 transition-all ${
                        selected
                          ? "bg-primary text-white border-primary shadow-sm"
                          : "bg-card text-foreground border-border hover:border-primary/40"
                      } ${!selected && priorities.length >= 5 ? "opacity-40 cursor-not-allowed" : ""}`}
                    >
                      {selected && <Check className="w-3 h-3 inline mr-1" />}
                      {p}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-center text-muted-foreground">
                {priorities.length}/5 selected {priorities.length < 3 && `(need at least 3)`}
              </p>
            </div>
          )}

          {/* Readiness */}
          {step === "readiness" && (
            <div className="space-y-3">
              <div className="text-center mb-4">
                <Brain className="w-8 h-8 text-primary mx-auto mb-2" />
                <h2 className="text-lg font-bold text-foreground">Relationship readiness</h2>
                <p className="text-sm text-muted-foreground">Rate yourself honestly from 1 (not yet) to 5 (absolutely).</p>
              </div>
              {READINESS_QUESTIONS.map((q) => (
                <Card key={q.key}>
                  <CardContent className="p-4">
                    <p className="text-sm font-medium text-foreground mb-3">{q.q}</p>
                    <div className="flex gap-2 justify-between">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={val}
                          onClick={() => setReadiness((r) => ({ ...r, [q.key]: val }))}
                          className={`flex-1 h-9 rounded-xl text-xs font-bold border-2 transition-all ${
                            readiness[q.key] === val
                              ? "bg-primary text-white border-primary shadow-sm"
                              : "border-border text-muted-foreground hover:border-primary/40"
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1 px-0.5">
                      <span>Not yet</span>
                      <span>Absolutely</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Results preview */}
          {step === "results" && (
            <div className="space-y-4">
              <div className="text-center mb-2">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                >
                  <Star className="w-12 h-12 text-amber-400 fill-amber-300 mx-auto mb-3" />
                </motion.div>
                <h2 className="text-xl font-bold text-foreground">Your AI Matchmaker Profile</h2>
                <p className="text-sm text-muted-foreground mt-1">Here's what we learned about you.</p>
              </div>

              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Commitment Intention</span>
                    <Badge className="bg-primary/20 text-primary border-primary/30 capitalize">
                      {COMMITMENT_OPTIONS.find(c => c.value === commitment)?.emoji} {commitment}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Love Language</span>
                    <Badge className="bg-primary/20 text-primary border-primary/30 capitalize">
                      {LOVE_LANGUAGE_OPTIONS.find(l => l.value === loveLanguage)?.emoji} {loveLanguage}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Top Priorities</span>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {priorities.map((p) => (
                        <Badge key={p} variant="secondary" className="text-xs">
                          {p}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Readiness Score</span>
                    <Badge className="bg-primary/20 text-primary border-primary/30 font-bold text-sm">
                      {computeReadinessScore()}%
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Button
                className="w-full rounded-full glow-primary"
                size="lg"
                onClick={handleFinish}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? (
                  "Saving..."
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Complete & Find Matches
                  </>
                )}
              </Button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      {step !== "results" && (
        <div className="flex gap-3 pt-2">
          {currentStepIdx > 0 && (
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => setStep(STEPS[currentStepIdx - 1])}
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Back
            </Button>
          )}
          <Button
            className="flex-1 rounded-full"
            disabled={!canProceed()}
            onClick={() => setStep(STEPS[currentStepIdx + 1])}
          >
            {step === "readiness" ? "See Results" : "Continue"}
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </div>
      )}
    </div>
  );
}

