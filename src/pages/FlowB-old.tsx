import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Grid3x3, ArrowRight, Check, X, ChevronRight } from "lucide-react";

const QUESTIONS = [
  {
    id: "style",
    title: "Style",
    subtitle: "Pick 2-3",
    type: "image",
    max: 3,
    options: [
      { id: "classy", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop", label: "Classy" },
      { id: "sporty", image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=120&h=120&fit=crop", label: "Sporty" },
      { id: "creative", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop", label: "Creative" },
      { id: "minimal", image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&h=120&fit=crop", label: "Minimal" },
      { id: "glam", image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&h=120&fit=crop", label: "Glam" },
      { id: "casual", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop", label: "Casual" },
    ],
  },
  {
    id: "body",
    title: "Body Type",
    subtitle: "Pick 1-2",
    type: "text",
    max: 2,
    options: [
      { id: "athletic", label: "Athletic" },
      { id: "slim", label: "Slim" },
      { id: "curvy", label: "Curvy" },
      { id: "average", label: "Average" },
      { id: "muscular", label: "Muscular" },
      { id: "petite", label: "Petite" },
    ],
  },
  {
    id: "energy",
    title: "Energy",
    subtitle: "Pick 2-3",
    type: "image",
    max: 3,
    options: [
      { id: "calm", image: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=120&h=120&fit=crop", label: "Calm" },
      { id: "confident", image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=120&h=120&fit=crop", label: "Confident" },
      { id: "playful", image: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=120&h=120&fit=crop", label: "Playful" },
      { id: "mysterious", image: "https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?w=120&h=120&fit=crop", label: "Mysterious" },
      { id: "intellectual", image: "https://images.unsplash.com/photo-1456324504439-367cee3b3c32?w=120&h=120&fit=crop", label: "Intellectual" },
      { id: "adventurous", image: "https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=120&h=120&fit=crop", label: "Adventurous" },
    ],
  },
  {
    id: "communication",
    title: "Communication",
    subtitle: "Pick 2",
    type: "text",
    max: 2,
    options: [
      { id: "texter", label: "Texter" },
      { id: "caller", label: "Calls" },
      { id: "inperson", label: "In-person" },
      { id: "memes", label: "Memes" },
      { id: "deep", label: "Deep talks" },
      { id: "quick", label: "Quick chats" },
    ],
  },
  {
    id: "lifestyle",
    title: "Lifestyle",
    subtitle: "Pick 2-3",
    type: "image",
    max: 3,
    options: [
      { id: "travel", image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=120&h=120&fit=crop", label: "Travel" },
      { id: "fitness", image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=120&h=120&fit=crop", label: "Fitness" },
      { id: "cozy", image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=120&h=120&fit=crop", label: "Homebody" },
      { id: "social", image: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=120&h=120&fit=crop", label: "Social" },
      { id: "nature", image: "https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=120&h=120&fit=crop", label: "Nature" },
      { id: "luxury", image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=120&h=120&fit=crop", label: "Luxury" },
    ],
  },
  {
    id: "hobbies",
    title: "Hobbies",
    subtitle: "Pick 3",
    type: "text",
    max: 3,
    options: [
      { id: "reading", label: "Reading" },
      { id: "gaming", label: "Gaming" },
      { id: "cooking", label: "Cooking" },
      { id: "art", label: "Art" },
      { id: "music", label: "Music" },
      { id: "sports", label: "Sports" },
      { id: "movies", label: "Movies" },
      { id: "outdoors", label: "Outdoors" },
    ],
  },
  {
    id: "sociallife",
    title: "Weekend",
    subtitle: "Pick 2",
    type: "text",
    max: 2,
    options: [
      { id: "party", label: "Night out" },
      { id: "dinner", label: "Dinner" },
      { id: "netflix", label: "Netflix" },
      { id: "adventure", label: "Day trip" },
      { id: "brunch", label: "Brunch" },
      { id: "quiet", label: "Quiet" },
    ],
  },
  {
    id: "career",
    title: "Career",
    subtitle: "Pick 2",
    type: "text",
    max: 2,
    options: [
      { id: "ambitious", label: "Ambitious" },
      { id: "stable", label: "Stable" },
      { id: "creative", label: "Creative" },
      { id: "entrepreneur", label: "Entrepreneur" },
      { id: "flexible", label: "Balanced" },
      { id: "driven", label: "Driven" },
    ],
  },
  {
    id: "values",
    title: "Values",
    subtitle: "Pick 3",
    type: "text",
    max: 3,
    options: [
      { id: "family", label: "Family" },
      { id: "honesty", label: "Honesty" },
      { id: "loyalty", label: "Loyalty" },
      { id: "growth", label: "Growth" },
      { id: "faith", label: "Faith" },
      { id: "freedom", label: "Freedom" },
      { id: "kindness", label: "Kindness" },
      { id: "ambition", label: "Ambition" },
    ],
  },
  {
    id: "emotional",
    title: "Traits",
    subtitle: "Pick 3",
    type: "text",
    max: 3,
    options: [
      { id: "empathy", label: "Empathetic" },
      { id: "humor", label: "Funny" },
      { id: "calm", label: "Calm" },
      { id: "passionate", label: "Passionate" },
      { id: "supportive", label: "Supportive" },
      { id: "independent", label: "Independent" },
      { id: "romantic", label: "Romantic" },
      { id: "secure", label: "Secure" },
    ],
  },
  {
    id: "attachment",
    title: "Love Style",
    subtitle: "Pick 1",
    type: "text",
    max: 1,
    options: [
      { id: "secure", label: "Balanced" },
      { id: "quality", label: "Quality time" },
      { id: "affection", label: "Affection" },
      { id: "independent", label: "Independent" },
      { id: "words", label: "Words" },
      { id: "acts", label: "Acts" },
    ],
  },
  {
    id: "future",
    title: "Future",
    subtitle: "Pick 2",
    type: "image",
    max: 2,
    options: [
      { id: "marriage", image: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=120&h=120&fit=crop", label: "Marriage" },
      { id: "kids", image: "https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=120&h=120&fit=crop", label: "Kids" },
      { id: "travel", image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=120&h=120&fit=crop", label: "Travel" },
      { id: "career", image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=120&h=120&fit=crop", label: "Career" },
      { id: "peace", image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=120&h=120&fit=crop", label: "Peace" },
      { id: "wealth", image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=120&h=120&fit=crop", label: "Wealth" },
    ],
  },
  {
    id: "timeline",
    title: "Timeline",
    subtitle: "Pick 1",
    type: "text",
    max: 1,
    options: [
      { id: "soon", label: "1-2 yrs" },
      { id: "medium", label: "3-5 yrs" },
      { id: "long", label: "5+ yrs" },
      { id: "flexible", label: "Flexible" },
    ],
  },
  {
    id: "kidsQ",
    title: "Kids",
    subtitle: "Pick 1",
    type: "text",
    max: 1,
    options: [
      { id: "want", label: "Want" },
      { id: "maybe", label: "Open" },
      { id: "no", label: "No" },
      { id: "have", label: "Have" },
    ],
  },
  {
    id: "religion",
    title: "Faith",
    subtitle: "Pick 1",
    type: "text",
    max: 1,
    options: [
      { id: "important", label: "Important" },
      { id: "somewhat", label: "Somewhat" },
      { id: "notimportant", label: "Not important" },
      { id: "same", label: "Same faith" },
    ],
  },
  {
    id: "politics",
    title: "Politics",
    subtitle: "Pick 1",
    type: "text",
    max: 1,
    options: [
      { id: "same", label: "Must align" },
      { id: "open", label: "Open" },
      { id: "notimportant", label: "Don't care" },
    ],
  },
  {
    id: "food",
    title: "Food",
    subtitle: "Pick 2",
    type: "text",
    max: 2,
    options: [
      { id: "foodie", label: "Foodie" },
      { id: "healthy", label: "Healthy" },
      { id: "adventurous", label: "Adventurous" },
      { id: "veg", label: "Veg/Vegan" },
      { id: "home", label: "Home cook" },
      { id: "dining", label: "Fine dining" },
    ],
  },
  {
    id: "pets",
    title: "Pets",
    subtitle: "Pick 1",
    type: "text",
    max: 1,
    options: [
      { id: "dogs", label: "Dogs" },
      { id: "cats", label: "Cats" },
      { id: "both", label: "All" },
      { id: "none", label: "None" },
    ],
  },
  {
    id: "living",
    title: "Living",
    subtitle: "Pick 1",
    type: "text",
    max: 1,
    options: [
      { id: "city", label: "City" },
      { id: "suburbs", label: "Suburbs" },
      { id: "rural", label: "Rural" },
      { id: "flexible", label: "Flexible" },
    ],
  },
  {
    id: "morning",
    title: "Schedule",
    subtitle: "Pick 1",
    type: "text",
    max: 1,
    options: [
      { id: "early", label: "Early bird" },
      { id: "night", label: "Night owl" },
      { id: "flexible", label: "Flexible" },
    ],
  },
  {
    id: "exercise",
    title: "Fitness",
    subtitle: "Pick 1",
    type: "text",
    max: 1,
    options: [
      { id: "daily", label: "Daily" },
      { id: "regular", label: "3-4x/wk" },
      { id: "casual", label: "Casual" },
      { id: "rarely", label: "Rarely" },
    ],
  },
  {
    id: "travel_freq",
    title: "Travel",
    subtitle: "Pick 1",
    type: "text",
    max: 1,
    options: [
      { id: "often", label: "Often" },
      { id: "sometimes", label: "Sometimes" },
      { id: "rarely", label: "Rarely" },
      { id: "homebody", label: "Homebody" },
    ],
  },
  {
    id: "money",
    title: "Money",
    subtitle: "Pick 1",
    type: "text",
    max: 1,
    options: [
      { id: "saver", label: "Saver" },
      { id: "spender", label: "Spender" },
      { id: "balanced", label: "Balanced" },
      { id: "investor", label: "Investor" },
    ],
  },
  {
    id: "cleanliness",
    title: "Cleanliness",
    subtitle: "Pick 1",
    type: "text",
    max: 1,
    options: [
      { id: "neat", label: "Very tidy" },
      { id: "normal", label: "Normal" },
      { id: "relaxed", label: "Relaxed" },
    ],
  },
  {
    id: "conflict",
    title: "Conflict",
    subtitle: "Pick 1",
    type: "text",
    max: 1,
    options: [
      { id: "talk", label: "Talk it out" },
      { id: "space", label: "Need space" },
      { id: "quick", label: "Quick fix" },
      { id: "avoid", label: "Avoid" },
    ],
  },
  {
    id: "lovestyle",
    title: "Love Language",
    subtitle: "Pick 1",
    type: "text",
    max: 1,
    options: [
      { id: "words", label: "Words" },
      { id: "touch", label: "Touch" },
      { id: "time", label: "Time" },
      { id: "gifts", label: "Gifts" },
      { id: "acts", label: "Acts" },
    ],
  },
  {
    id: "dates",
    title: "Ideal Date",
    subtitle: "Pick 2",
    type: "text",
    max: 2,
    options: [
      { id: "dinner", label: "Dinner" },
      { id: "adventure", label: "Adventure" },
      { id: "movie", label: "Movie" },
      { id: "cooking", label: "Cooking" },
      { id: "nature", label: "Nature" },
      { id: "concert", label: "Concert" },
    ],
  },
  {
    id: "dealbreakers",
    title: "Dealbreakers",
    subtitle: "Pick up to 3",
    type: "dealbreaker",
    max: 3,
    options: [
      { id: "smoking", label: "Smoking" },
      { id: "drinking", label: "Drinking" },
      { id: "no-ambition", label: "No ambition" },
      { id: "dishonesty", label: "Dishonesty" },
      { id: "jealousy", label: "Jealousy" },
      { id: "communication", label: "Bad comm" },
      { id: "disrespect", label: "Disrespect" },
      { id: "different-values", label: "Diff values" },
    ],
  },
  {
    id: "mustHave",
    title: "Must Haves",
    subtitle: "Pick 3",
    type: "text",
    max: 3,
    options: [
      { id: "chemistry", label: "Chemistry" },
      { id: "trust", label: "Trust" },
      { id: "humor", label: "Humor" },
      { id: "ambition", label: "Ambition" },
      { id: "kindness", label: "Kindness" },
      { id: "attraction", label: "Attraction" },
      { id: "support", label: "Support" },
      { id: "goals", label: "Goals" },
    ],
  },
];

export default function FlowB() {
  const [, setLocation] = useLocation();
  const [currentQ, setCurrentQ] = useState(-1);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});

  const toggleAnswer = (qId: string, optionId: string, max: number) => {
    setAnswers(prev => {
      const current = prev[qId] || [];
      if (current.includes(optionId)) {
        return { ...prev, [qId]: current.filter(id => id !== optionId) };
      } else if (current.length < max) {
        return { ...prev, [qId]: [...current, optionId] };
      }
      return prev;
    });
  };

  const progress = currentQ < 0 ? 0 : currentQ >= QUESTIONS.length ? 100 : ((currentQ + 1) / QUESTIONS.length) * 100;

  const canProceed = () => {
    if (currentQ < 0 || currentQ >= QUESTIONS.length) return true;
    const q = QUESTIONS[currentQ];
    const selected = answers[q.id] || [];
    return selected.length > 0;
  };

  const goNext = () => {
    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      setCurrentQ(QUESTIONS.length);
    }
  };

  if (currentQ === -1) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-12 h-12 mb-3 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <Grid3x3 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-1">Deep Match</h1>
          <p className="text-xs text-muted-foreground mb-4">{QUESTIONS.length} questions for perfect matches</p>
          
          <div className="text-left space-y-1.5 mb-5 p-2.5 bg-card rounded-lg text-xs w-full max-w-[200px]">
            <div className="flex items-center gap-2 text-foreground/80">
              <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[10px] text-primary font-bold">1</div>
              <span>Style & Energy</span>
            </div>
            <div className="flex items-center gap-2 text-foreground/80">
              <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[10px] text-primary font-bold">2</div>
              <span>Values & Lifestyle</span>
            </div>
            <div className="flex items-center gap-2 text-foreground/80">
              <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[10px] text-primary font-bold">3</div>
              <span>Future & Dealbreakers</span>
            </div>
          </div>

          <Button 
            size="sm"
            className="rounded-full px-6 glow-primary"
            onClick={() => setCurrentQ(0)}
            data-testid="button-start-flow-b"
          >
            Start (~5 min)
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </div>
        <button 
          className="p-2 text-xs text-muted-foreground"
          onClick={() => setLocation('/ai-matchmaker')}
        >
          Back
        </button>
      </div>
    );
  }

  if (currentQ >= QUESTIONS.length) {
    const mockMatches = [
      { id: 1, name: "Emily", age: 28, image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop", compatibility: 96 },
      { id: 2, name: "Sarah", age: 26, image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop", compatibility: 91 },
      { id: 3, name: "Jessica", age: 25, image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop", compatibility: 87 },
    ];

    const totalAnswers = Object.values(answers).flat();
    const dealbreakers = answers.dealbreakers || [];

    return (
      <div className="min-h-screen bg-background px-3 pt-3 pb-16">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-bold text-foreground">Deep Matches</h2>
          <Badge className="bg-purple-500/20 text-purple-400 text-[10px] px-1.5 py-0.5">Deep</Badge>
        </div>

        <p className="text-[10px] text-muted-foreground mb-2">
          {totalAnswers.length} prefs across {Object.keys(answers).length} categories
        </p>

        {dealbreakers.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {dealbreakers.map((d, i) => (
              <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0.5 border-red-500/50 text-red-400">
                <X className="w-2 h-2 mr-0.5" />
                {QUESTIONS.find(q => q.id === 'dealbreakers')?.options.find(o => o.id === d)?.label}
              </Badge>
            ))}
          </div>
        )}

        <div className="space-y-2">
          {mockMatches.map((match, index) => (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="flex items-center gap-2.5 p-2.5 rounded-lg bg-card border border-border"
            >
              <img 
                src={match.image} 
                alt={match.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground text-sm">{match.name}, {match.age}</h3>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Check className="w-2.5 h-2.5 text-purple-500" />
                  Deep match
                </div>
              </div>
              <Badge className="bg-purple-500/20 text-purple-400 text-[10px] px-1.5">
                {match.compatibility}%
              </Badge>
            </motion.div>
          ))}
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-2.5 bg-background/95 backdrop-blur border-t border-border">
          <Button 
            size="sm"
            className="w-full rounded-full glow-primary"
            onClick={() => setLocation('/directory')}
          >
            View All Matches
          </Button>
        </div>
      </div>
    );
  }

  const q = QUESTIONS[currentQ];
  const selected = answers[q.id] || [];

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <div className="px-3 pt-2 pb-1">
        <Progress value={progress} className="h-1 mb-1" />
        <div className="flex justify-between items-center text-[10px]">
          <span className="text-muted-foreground">{currentQ + 1}/{QUESTIONS.length}</span>
          <span className="text-foreground/50">{selected.length}/{q.max}</span>
        </div>
      </div>

      <div className="flex-1 px-3 overflow-y-auto pb-16">
        <h2 className="text-base font-bold text-foreground">{q.title}</h2>
        <p className="text-[10px] text-muted-foreground mb-3">{q.subtitle}</p>

        {q.type === "image" ? (
          <div className="grid grid-cols-3 gap-1.5">
            {q.options.map((opt) => {
              const isSelected = selected.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  onClick={() => toggleAnswer(q.id, opt.id, q.max)}
                  className={`relative aspect-square rounded-md overflow-hidden transition-all ${
                    isSelected ? 'ring-2 ring-primary scale-[0.97]' : 'opacity-75'
                  }`}
                  data-testid={`option-${q.id}-${opt.id}`}
                >
                  <img 
                    src={(opt as any).image} 
                    alt={opt.label}
                    className="w-full h-full object-cover"
                  />
                  <div className={`absolute inset-0 transition-colors ${isSelected ? 'bg-primary/30' : 'bg-black/20'}`} />
                  <span className="absolute bottom-0.5 left-0.5 right-0.5 text-[9px] font-medium text-white text-center truncate">
                    {opt.label}
                  </span>
                  {isSelected && (
                    <div className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {q.options.map((opt) => {
              const isSelected = selected.includes(opt.id);
              const isDealbreaker = q.type === "dealbreaker";
              return (
                <button
                  key={opt.id}
                  onClick={() => toggleAnswer(q.id, opt.id, q.max)}
                  className={`px-2.5 py-1 rounded-full text-xs transition-all ${
                    isSelected 
                      ? isDealbreaker 
                        ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/50' 
                        : 'bg-primary/20 text-primary ring-1 ring-primary/50'
                      : 'bg-muted text-muted-foreground'
                  }`}
                  data-testid={`option-${q.id}-${opt.id}`}
                >
                  {isDealbreaker && isSelected && <X className="w-2.5 h-2.5 inline mr-0.5" />}
                  {opt.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-2.5 bg-background/95 backdrop-blur border-t border-border">
        <Button 
          size="sm"
          className="w-full rounded-full glow-primary"
          onClick={goNext}
          disabled={!canProceed()}
        >
          {currentQ === QUESTIONS.length - 1 ? 'See Matches' : 'Next'}
          <ChevronRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      </div>
    </div>
  );
}
