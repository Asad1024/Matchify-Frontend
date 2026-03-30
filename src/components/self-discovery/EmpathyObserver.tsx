import { useState, useEffect } from "react";
import { buildApiUrl, getAuthHeaders } from "@/services/api";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Eye, Brain, Heart, Check, ArrowRight, Lightbulb, Send } from "lucide-react";

interface EmpathyObserverProps {
  userId: string;
}

type Scenario = {
  id: string;
  title: string;
  description: string;
  perspective: string;
  question: string;
  emotionOptions: string[];
  insight: string;
};

const SCENARIOS: Scenario[] = [
  {
    id: "s1",
    title: "The Cancelled Plans",
    description:
      "Your partner cancels a long-planned date two hours before, saying they're exhausted after a difficult week at work. You were really looking forward to it.",
    perspective: "Your partner's perspective",
    question: "What might your partner be feeling?",
    emotionOptions: ["Guilty", "Relieved", "Exhausted", "Worried about disappointing you", "Grateful you understand"],
    insight:
      "Even when we're hurt, our partners often feel just as bad about disappointing us. Practising empathy here builds trust and deepens your bond.",
  },
  {
    id: "s2",
    title: "The Silent Treatment",
    description:
      "After a disagreement, your partner goes quiet and withdraws instead of talking. You feel shut out and frustrated.",
    perspective: "Their inner world",
    question: "What might be driving this behaviour?",
    emotionOptions: ["Overwhelmed", "Fear of conflict escalating", "Processing emotions", "Feeling unheard", "Protecting themselves"],
    insight:
      "Withdrawal often comes from emotional overwhelm, not indifference. Creating a safe space for them to re-engage — without pressure — can break the cycle.",
  },
  {
    id: "s3",
    title: "The Critical Comment",
    description:
      "Your partner makes a comment criticising how you handled a social situation. You feel embarrassed and defensive.",
    perspective: "Their underlying intention",
    question: "What might they really mean?",
    emotionOptions: ["They want to help you", "They felt embarrassed too", "They have high standards", "They care about your image", "They're processing their own insecurities"],
    insight:
      "Criticism often comes wrapped in care. Asking 'What were you hoping to communicate?' opens dialogue and reduces defensiveness on both sides.",
  },
  {
    id: "s4",
    title: "The Jealousy Moment",
    description:
      "You notice your partner seems uneasy when you talk enthusiastically about a close friend of the opposite gender.",
    perspective: "Your partner's fear",
    question: "What might they be feeling underneath the jealousy?",
    emotionOptions: ["Insecurity about themselves", "Fear of losing you", "They deeply value the relationship", "Past wounds resurfacing", "Feeling excluded"],
    insight:
      "Jealousy is rarely just about the person — it's about a fear of not being enough. Reassurance and transparency can help dissolve it without dismissing their feelings.",
  },
];

const REFLECTION_PROMPTS = [
  "Describe a time you misjudged someone's intentions. What did you learn?",
  "How do you typically respond when your partner is upset? What works and what doesn't?",
  "What's one thing you wish your partner understood better about how you feel loved?",
  "When have you found it hardest to empathise with someone close to you?",
];

export default function EmpathyObserver({ userId }: EmpathyObserverProps) {
  const [activeScenario, setActiveScenario] = useState<Scenario | null>(null);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [showInsight, setShowInsight] = useState(false);
  const [activeTab, setActiveTab] = useState<"scenarios" | "reflection">("scenarios");
  const [reflectionText, setReflectionText] = useState("");
  const [activePrompt, setActivePrompt] = useState(0);
  const [reflectionSaved, setReflectionSaved] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!showInsight || !activeScenario) {
      setAiInsight(null);
      return;
    }
    let cancelled = false;
    const reflection = `User selected feelings: ${selectedEmotions.join(", ") || "(none)"}.\nGuiding question: ${activeScenario.question}`;
    setAiLoading(true);
    (async () => {
      try {
        const res = await fetch(buildApiUrl("/api/empathy/insight"), {
          method: "POST",
          headers: getAuthHeaders(true),
          credentials: "include",
          body: JSON.stringify({
            scenarioTitle: activeScenario.title,
            reflection,
          }),
        });
        if (cancelled) return;
        if (res.ok) {
          const j = (await res.json()) as { insight?: string };
          setAiInsight(j.insight || null);
        } else {
          setAiInsight(null);
        }
      } catch {
        if (!cancelled) setAiInsight(null);
      } finally {
        if (!cancelled) setAiLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showInsight, activeScenario?.id, selectedEmotions, activeScenario?.question, activeScenario?.title]);

  const toggleEmotion = (emotion: string) => {
    setSelectedEmotions((prev) =>
      prev.includes(emotion) ? prev.filter((e) => e !== emotion) : [...prev, emotion]
    );
  };

  const handleRevealInsight = () => setShowInsight(true);

  const handleSaveReflection = () => {
    setReflectionSaved(true);
    setTimeout(() => setReflectionSaved(false), 3000);
    setReflectionText("");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="text-center mb-4">
        <div className="w-12 h-12 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-2">
          <Eye className="w-6 h-6 text-violet-600" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Empathy Observer</h2>
        <p className="text-sm text-muted-foreground">
          Train yourself to see through another person's eyes.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {(["scenarios", "reflection"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setActiveScenario(null);
              setSelectedEmotions([]);
              setShowInsight(false);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors capitalize ${
              activeTab === tab
                ? "bg-violet-600 text-white shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {tab === "scenarios" ? "🎭 Scenarios" : "📝 Reflection"}
          </button>
        ))}
      </div>

      {/* Scenarios tab */}
      {activeTab === "scenarios" && (
        <div className="flex-1 overflow-y-auto space-y-3">
          {!activeScenario ? (
            <>
              <p className="text-xs text-muted-foreground text-center mb-2">
                Choose a scenario to practise perspective-taking.
              </p>
              {SCENARIOS.map((scenario) => (
                <motion.div key={scenario.id} whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
                  <Card
                    className="cursor-pointer hover:border-violet-400 transition-colors"
                    onClick={() => {
                      setActiveScenario(scenario);
                      setSelectedEmotions([]);
                      setShowInsight(false);
                    }}
                  >
                    <CardContent className="p-4">
                      <h4 className="text-sm font-bold text-foreground mb-1">{scenario.title}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {scenario.description}
                      </p>
                      <div className="flex items-center gap-1 mt-2 text-xs text-violet-500 font-semibold">
                        <ArrowRight className="w-3 h-3" />
                        <span>Explore this scenario</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeScenario.id + showInsight}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                <button
                  onClick={() => setActiveScenario(null)}
                  className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground"
                >
                  ← Back to scenarios
                </button>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-sm font-bold text-foreground mb-2">{activeScenario.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{activeScenario.description}</p>
                  </CardContent>
                </Card>

                <Card className="border-violet-200 bg-violet-50/50">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-xs font-bold text-violet-700 flex items-center gap-1.5">
                      <Brain className="w-3.5 h-3.5" />
                      {activeScenario.perspective}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <p className="text-sm font-medium text-foreground mb-3">{activeScenario.question}</p>
                    <div className="flex flex-wrap gap-2">
                      {activeScenario.emotionOptions.map((emotion) => (
                        <button
                          key={emotion}
                          onClick={() => toggleEmotion(emotion)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all ${
                            selectedEmotions.includes(emotion)
                              ? "bg-violet-600 text-white border-violet-600"
                              : "border-violet-200 text-violet-600 hover:border-violet-400"
                          }`}
                        >
                          {selectedEmotions.includes(emotion) && <Check className="w-3 h-3 inline mr-1" />}
                          {emotion}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {selectedEmotions.length > 0 && !showInsight && (
                  <Button
                    className="w-full rounded-full bg-violet-600 hover:bg-violet-700 text-white"
                    onClick={handleRevealInsight}
                  >
                    <Lightbulb className="w-4 h-4 mr-2" />
                    Reveal Insight
                  </Button>
                )}

                {showInsight && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-3"
                  >
                    <Card className="border-amber-200 bg-amber-50/50">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-2">
                          <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-bold text-amber-700 mb-1">Empathy Insight</p>
                            <p className="text-sm text-amber-800 leading-relaxed">{activeScenario.insight}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    {aiLoading && (
                      <p className="text-xs text-center text-muted-foreground">Getting an AI coach perspective…</p>
                    )}
                    {aiInsight && (
                      <Card className="border-violet-200 bg-violet-50/40">
                        <CardContent className="p-4">
                          <p className="text-xs font-bold text-violet-700 mb-1">AI coach perspective</p>
                          <p className="text-sm text-violet-900/90 leading-relaxed whitespace-pre-wrap">{aiInsight}</p>
                        </CardContent>
                      </Card>
                    )}
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      )}

      {/* Reflection tab */}
      {activeTab === "reflection" && (
        <div className="flex-1 space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {REFLECTION_PROMPTS.map((_, i) => (
              <button
                key={i}
                onClick={() => setActivePrompt(i)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  activePrompt === i
                    ? "bg-violet-600 text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                Prompt {i + 1}
              </button>
            ))}
          </div>

          <Card className="border-violet-200">
            <CardContent className="p-4">
              <p className="text-sm font-medium text-foreground leading-relaxed">
                {REFLECTION_PROMPTS[activePrompt]}
              </p>
            </CardContent>
          </Card>

          <Textarea
            value={reflectionText}
            onChange={(e) => setReflectionText(e.target.value)}
            placeholder="Write your honest reflection here..."
            rows={5}
            className="resize-none rounded-xl text-sm"
          />

          {reflectionSaved ? (
            <div className="flex items-center justify-center gap-2 text-primary text-sm font-semibold py-2">
              <Check className="w-4 h-4" />
              Reflection saved!
            </div>
          ) : (
            <Button
              className="w-full rounded-full"
              disabled={!reflectionText.trim()}
              onClick={handleSaveReflection}
            >
              <Send className="w-4 h-4 mr-2" />
              Save Reflection
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
