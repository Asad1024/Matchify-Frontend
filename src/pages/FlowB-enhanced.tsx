import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Grid3x3, ArrowRight, ArrowLeft, Check, X, ChevronRight, Sparkles, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Enhanced questions with match.box-inspired values-based approach
const QUESTIONS = [
  // SECTION 1: STYLE & ATTRACTION
  {
    id: "style",
    title: "Style Preferences",
    subtitle: "Pick 2-3 styles that attract you",
    description: "Visual attraction is important. Select styles that catch your eye.",
    type: "image",
    max: 3,
    options: [
      { id: "classy", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop", label: "Classy", description: "Sophisticated elegance" },
      { id: "sporty", image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=200&h=200&fit=crop", label: "Sporty", description: "Active and athletic" },
      { id: "creative", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop", label: "Creative", description: "Artistic and expressive" },
      { id: "minimal", image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop", label: "Minimal", description: "Clean and simple" },
      { id: "glam", image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop", label: "Glam", description: "Polished and refined" },
      { id: "casual", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop", label: "Casual", description: "Relaxed and comfortable" },
      { id: "bohemian", image: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=200&h=200&fit=crop", label: "Bohemian", description: "Free-spirited" },
      { id: "edgy", image: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&h=200&fit=crop", label: "Edgy", description: "Bold and unconventional" },
    ],
  },
  {
    id: "body",
    title: "Body Type Preferences",
    subtitle: "Pick 1-2",
    description: "Physical attraction preferences (all body types are beautiful)",
    type: "image",
    max: 2,
    options: [
      { id: "athletic", image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=200&h=200&fit=crop", label: "Athletic", description: "Fit and active" },
      { id: "slim", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop", label: "Slim", description: "Lean build" },
      { id: "curvy", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop", label: "Curvy", description: "Fuller figure" },
      { id: "average", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop", label: "Average", description: "Medium build" },
      { id: "muscular", image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=200&h=200&fit=crop", label: "Muscular", description: "Strong build" },
      { id: "petite", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop", label: "Petite", description: "Smaller frame" },
    ],
  },
  {
    id: "energy",
    title: "Energy & Personality",
    subtitle: "Pick 2-3 energy types you're drawn to",
    description: "What kind of energy attracts you? This reveals compatibility in social dynamics.",
    type: "image",
    max: 3,
    options: [
      { id: "calm", image: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=200&h=200&fit=crop", label: "Calm", description: "Peaceful and centered" },
      { id: "confident", image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=200&h=200&fit=crop", label: "Confident", description: "Self-assured and strong" },
      { id: "playful", image: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=200&h=200&fit=crop", label: "Playful", description: "Fun-loving and light" },
      { id: "mysterious", image: "https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?w=200&h=200&fit=crop", label: "Mysterious", description: "Intriguing and enigmatic" },
      { id: "intellectual", image: "https://images.unsplash.com/photo-1456324504439-367cee3b3c32?w=200&h=200&fit=crop", label: "Intellectual", description: "Thoughtful and curious" },
      { id: "adventurous", image: "https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=200&h=200&fit=crop", label: "Adventurous", description: "Bold and spontaneous" },
      { id: "social", image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=200&h=200&fit=crop", label: "Social", description: "Outgoing and friendly" },
      { id: "passionate", image: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=200&h=200&fit=crop", label: "Passionate", description: "Intense and driven" },
    ],
  },
  
  // SECTION 2: VALUES (Match.box-inspired - Research-backed)
  {
    id: "core_values",
    title: "Core Values",
    subtitle: "Pick 3-4 that matter most",
    description: "Research shows values alignment is the #1 predictor of long-term relationship success. Select what truly matters to you.",
    type: "image",
    max: 4,
    options: [
      { id: "honesty", image: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=200&h=200&fit=crop", label: "Honesty & Transparency", description: "Truth in all interactions" },
      { id: "family", image: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=200&h=200&fit=crop", label: "Family First", description: "Family is top priority" },
      { id: "growth", image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=200&h=200&fit=crop", label: "Personal Growth", description: "Continuous learning" },
      { id: "adventure", image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=200&h=200&fit=crop", label: "Adventure & Freedom", description: "Exploring new experiences" },
      { id: "stability", image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=200&h=200&fit=crop", label: "Stability & Security", description: "Consistency and safety" },
      { id: "creativity", image: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=200&h=200&fit=crop", label: "Creativity & Expression", description: "Artistic expression" },
      { id: "kindness", image: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=200&h=200&fit=crop", label: "Kindness & Empathy", description: "Compassion for others" },
      { id: "ambition", image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=200&h=200&fit=crop", label: "Ambition & Success", description: "Driven to achieve" },
    ],
  },
  {
    id: "communication",
    title: "Communication Style",
    subtitle: "Pick 2 that describe you",
    description: "How do you prefer to connect? This affects daily compatibility.",
    type: "image",
    max: 2,
    options: [
      { id: "texter", image: "https://images.unsplash.com/photo-1577563908411-5077b6dc7624?w=200&h=200&fit=crop", label: "Texter", description: "Love texting throughout the day" },
      { id: "caller", image: "https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=200&h=200&fit=crop", label: "Calls", description: "Prefer voice conversations" },
      { id: "inperson", image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=200&h=200&fit=crop", label: "In-person", description: "Face-to-face connection" },
      { id: "memes", image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=200&h=200&fit=crop", label: "Memes & Humor", description: "Fun and playful communication" },
      { id: "deep", image: "https://images.unsplash.com/photo-1456324504439-367cee3b3c32?w=200&h=200&fit=crop", label: "Deep Talks", description: "Meaningful conversations" },
      { id: "quick", image: "https://images.unsplash.com/photo-1577563908411-5077b6dc7624?w=200&h=200&fit=crop", label: "Quick & Efficient", description: "Brief and to the point" },
    ],
  },
  {
    id: "conflict_style",
    title: "Conflict Resolution",
    subtitle: "Pick 1-2 that describe you",
    description: "Understanding how you handle disagreements helps predict relationship success.",
    type: "image",
    max: 2,
    options: [
      { id: "discuss", image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=200&h=200&fit=crop", label: "Talk it through", description: "Address issues immediately" },
      { id: "space", image: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=200&h=200&fit=crop", label: "Need space", description: "Take time to process first" },
      { id: "compromise", image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=200&h=200&fit=crop", label: "Find middle ground", description: "Seek win-win solutions" },
      { id: "avoid", image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=200&h=200&fit=crop", label: "Let it pass", description: "Don't sweat small things" },
    ],
  },
  
  // SECTION 3: LIFESTYLE & HABITS
  {
    id: "lifestyle",
    title: "Lifestyle",
    subtitle: "Pick 2-3 that describe your ideal lifestyle",
    description: "How do you want to spend your time together?",
    type: "image",
    max: 3,
    options: [
      { id: "travel", image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=200&h=200&fit=crop", label: "Travel", description: "Exploring new places" },
      { id: "fitness", image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=200&h=200&fit=crop", label: "Fitness", description: "Active and health-conscious" },
      { id: "cozy", image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=200&h=200&fit=crop", label: "Homebody", description: "Love staying in" },
      { id: "social", image: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=200&h=200&fit=crop", label: "Social", description: "Out and about" },
      { id: "nature", image: "https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=200&h=200&fit=crop", label: "Nature", description: "Outdoor adventures" },
      { id: "luxury", image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=200&h=200&fit=crop", label: "Luxury", description: "Fine dining and experiences" },
      { id: "creative", image: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=200&h=200&fit=crop", label: "Arts & Culture", description: "Museums, shows, events" },
      { id: "work", image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=200&h=200&fit=crop", label: "Career-focused", description: "Ambitious and driven" },
    ],
  },
  {
    id: "hobbies",
    title: "Hobbies & Interests",
    subtitle: "Pick 3 that excite you",
    description: "What do you love doing in your free time?",
    type: "image",
    max: 3,
    options: [
      { id: "reading", image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200&h=200&fit=crop", label: "Reading", description: "Books and literature" },
      { id: "gaming", image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=200&h=200&fit=crop", label: "Gaming", description: "Video games and esports" },
      { id: "cooking", image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=200&h=200&fit=crop", label: "Cooking", description: "Culinary adventures" },
      { id: "art", image: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=200&h=200&fit=crop", label: "Art", description: "Creating and appreciating" },
      { id: "music", image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop", label: "Music", description: "Concerts and playlists" },
      { id: "sports", image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=200&h=200&fit=crop", label: "Sports", description: "Watching or playing" },
      { id: "movies", image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=200&h=200&fit=crop", label: "Movies & TV", description: "Film and series" },
      { id: "outdoors", image: "https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=200&h=200&fit=crop", label: "Outdoors", description: "Hiking, camping, nature" },
    ],
  },
  {
    id: "sociallife",
    title: "Weekend Vibes",
    subtitle: "Pick 2 ideal weekend activities",
    description: "How do you like to spend your weekends?",
    type: "image",
    max: 2,
    options: [
      { id: "party", image: "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=200&h=200&fit=crop", label: "Night out", description: "Parties and nightlife" },
      { id: "dinner", image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=200&h=200&fit=crop", label: "Dinner dates", description: "Restaurants and dining" },
      { id: "netflix", image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=200&h=200&fit=crop", label: "Netflix & chill", description: "Relaxing at home" },
      { id: "adventure", image: "https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=200&h=200&fit=crop", label: "Day trip", description: "Exploring nearby" },
      { id: "brunch", image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=200&h=200&fit=crop", label: "Brunch", description: "Late morning meals" },
      { id: "quiet", image: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=200&h=200&fit=crop", label: "Quiet time", description: "Solo or peaceful" },
    ],
  },
  {
    id: "food",
    title: "Food Preferences",
    subtitle: "Pick 2 that describe you",
    description: "Food compatibility matters for daily life together.",
    type: "image",
    max: 2,
    options: [
      { id: "foodie", image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=200&h=200&fit=crop", label: "Foodie", description: "Love trying new restaurants" },
      { id: "healthy", image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=200&h=200&fit=crop", label: "Healthy", description: "Nutrition-focused" },
      { id: "adventurous", image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=200&h=200&fit=crop", label: "Adventurous", description: "Try anything once" },
      { id: "veg", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&h=200&fit=crop", label: "Veg/Vegan", description: "Plant-based" },
      { id: "home", image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=200&h=200&fit=crop", label: "Home cook", description: "Love cooking at home" },
      { id: "dining", image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&h=200&fit=crop", label: "Fine dining", description: "Upscale restaurants" },
    ],
  },
  
  // SECTION 4: FUTURE & GOALS
  {
    id: "career",
    title: "Career & Ambition",
    subtitle: "Pick 2 that describe your approach",
    description: "Career values affect lifestyle compatibility.",
    type: "image",
    max: 2,
    options: [
      { id: "ambitious", image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=200&h=200&fit=crop", label: "Ambitious", description: "Driven to succeed" },
      { id: "stable", image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=200&h=200&fit=crop", label: "Stable", description: "Steady and secure" },
      { id: "creative", image: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=200&h=200&fit=crop", label: "Creative", description: "Artistic career" },
      { id: "entrepreneur", image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=200&h=200&fit=crop", label: "Entrepreneur", description: "Building my own" },
      { id: "flexible", image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=200&h=200&fit=crop", label: "Balanced", description: "Work-life balance" },
      { id: "driven", image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=200&h=200&fit=crop", label: "Driven", description: "Highly motivated" },
    ],
  },
  {
    id: "future",
    title: "Future Goals",
    subtitle: "Pick 2 that matter most",
    description: "What do you envision for your future?",
    type: "image",
    max: 2,
    options: [
      { id: "marriage", image: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=200&h=200&fit=crop", label: "Marriage", description: "Looking to marry" },
      { id: "kids", image: "https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=200&h=200&fit=crop", label: "Kids", description: "Want children" },
      { id: "travel", image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=200&h=200&fit=crop", label: "Travel", description: "See the world" },
      { id: "career", image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=200&h=200&fit=crop", label: "Career", description: "Professional growth" },
      { id: "peace", image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=200&h=200&fit=crop", label: "Peace", description: "Simple and content" },
      { id: "wealth", image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=200&h=200&fit=crop", label: "Wealth", description: "Financial success" },
    ],
  },
  {
    id: "timeline",
    title: "Relationship Timeline",
    subtitle: "Pick 1",
    description: "When are you looking for something serious?",
    type: "text",
    max: 1,
    options: [
      { id: "soon", label: "1-2 years" },
      { id: "medium", label: "3-5 years" },
      { id: "long", label: "5+ years" },
      { id: "flexible", label: "Flexible" },
    ],
  },
  {
    id: "kidsQ",
    title: "Kids Preference",
    subtitle: "Pick 1",
    description: "Important for long-term compatibility.",
    type: "text",
    max: 1,
    options: [
      { id: "want", label: "Want" },
      { id: "maybe", label: "Open" },
      { id: "no", label: "No" },
      { id: "have", label: "Have" },
    ],
  },
  
  // SECTION 5: DEALBREAKERS & MUST-HAVES
  {
    id: "dealbreakers",
    title: "Dealbreakers",
    subtitle: "Pick up to 3",
    description: "What are absolute no-gos for you?",
    type: "dealbreaker",
    max: 3,
    options: [
      { id: "smoking", label: "Smoking" },
      { id: "drinking", label: "Excessive drinking" },
      { id: "no-ambition", label: "No ambition" },
      { id: "dishonesty", label: "Dishonesty" },
      { id: "jealousy", label: "Jealousy" },
      { id: "communication", label: "Poor communication" },
      { id: "disrespect", label: "Disrespect" },
      { id: "different-values", label: "Different values" },
    ],
  },
  {
    id: "mustHave",
    title: "Must Haves",
    subtitle: "Pick 3",
    description: "What are non-negotiable qualities?",
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
      { id: "goals", label: "Shared goals" },
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
          <div className="w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <Grid3x3 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Deep Match</h1>
          <p className="text-sm text-muted-foreground mb-1">{QUESTIONS.length} research-backed questions</p>
          <p className="text-xs text-muted-foreground/70 mb-6">Values-based matching for lasting connections</p>
          
          <div className="text-left space-y-2 mb-6 p-4 bg-card rounded-lg text-xs w-full max-w-[280px] border border-primary/20">
            <div className="flex items-center gap-2 text-foreground">
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[11px] text-primary font-bold">1</div>
              <span className="font-medium">Style & Attraction</span>
            </div>
            <div className="flex items-center gap-2 text-foreground">
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[11px] text-primary font-bold">2</div>
              <span className="font-medium">Core Values (Research-backed)</span>
            </div>
            <div className="flex items-center gap-2 text-foreground">
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[11px] text-primary font-bold">3</div>
              <span className="font-medium">Lifestyle & Habits</span>
            </div>
            <div className="flex items-center gap-2 text-foreground">
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[11px] text-primary font-bold">4</div>
              <span className="font-medium">Future Goals</span>
            </div>
            <div className="flex items-center gap-2 text-foreground">
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[11px] text-primary font-bold">5</div>
              <span className="font-medium">Dealbreakers & Must-Haves</span>
            </div>
          </div>

          <Button 
            size="sm"
            className="rounded-full px-8 glow-primary"
            onClick={() => setCurrentQ(0)}
            data-testid="button-start-flow-b"
          >
            Start Deep Match (~5 min)
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation('/ai-matchmaker')}
                className="rounded-full"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Back</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  if (currentQ >= QUESTIONS.length) {
    const mockMatches = [
      { id: 1, name: "Emily", age: 28, image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop", compatibility: 96, insights: ["Shared core values", "Similar lifestyle", "Aligned future goals"] },
      { id: 2, name: "Sarah", age: 26, image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop", compatibility: 91, insights: ["Values alignment", "Compatible communication"] },
      { id: 3, name: "Jessica", age: 25, image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop", compatibility: 87, insights: ["Similar interests", "Compatible energy"] },
    ];

    const totalAnswers = Object.values(answers).flat();
    const dealbreakers = answers.dealbreakers || [];
    const coreValues = answers.core_values || [];

    return (
      <div className="min-h-screen bg-background px-3 pt-3 pb-16">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">Deep Matches</h2>
            <p className="text-[10px] text-muted-foreground">Based on {totalAnswers.length} preferences</p>
          </div>
          <Badge className="bg-purple-500/20 text-purple-400 text-[10px] px-2 py-1">Deep</Badge>
        </div>

        {coreValues.length > 0 && (
          <div className="mb-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Sparkles className="w-3 h-3 text-primary" />
              <p className="text-xs font-medium text-foreground">Your Core Values</p>
            </div>
            <div className="flex flex-wrap gap-1">
              {coreValues.map((v, i) => {
                const value = QUESTIONS.find(q => q.id === 'core_values')?.options.find(o => o.id === v);
                return (
                  <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary">
                    {value?.label || v}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

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

        <div className="space-y-3">
          {mockMatches.map((match, index) => (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-3 rounded-lg bg-card border border-border hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start gap-3 mb-2">
                <div className="relative">
                  <img 
                    src={match.image} 
                    alt={match.name}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/20"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-purple-500 border-2 border-background flex items-center justify-center">
                    <Check className="w-2 h-2 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground text-sm">{match.name}, {match.age}</h3>
                    <Badge className="bg-purple-500/20 text-purple-400 text-[10px] px-1.5">
                      {match.compatibility}%
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    {match.insights.map((insight, i) => (
                      <div key={i} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Check className="w-2.5 h-2.5 text-primary" />
                        {insight}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
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
        <Progress value={progress} className="h-1.5 mb-1" />
        <div className="flex justify-between items-center text-[10px]">
          <span className="text-muted-foreground font-medium">Question {currentQ + 1} of {QUESTIONS.length}</span>
          <span className="text-foreground/50">{selected.length}/{q.max} selected</span>
        </div>
      </div>

      <div className="flex-1 px-3 overflow-y-auto pb-20">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-foreground mb-1">{q.title}</h2>
          <p className="text-xs text-muted-foreground mb-1">{q.subtitle}</p>
          {q.description && (
            <div className="flex items-start gap-1.5 mt-2 p-2 rounded-lg bg-primary/5 border border-primary/10">
              <Info className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-[10px] text-muted-foreground leading-relaxed">{q.description}</p>
            </div>
          )}
        </div>

        {q.type === "image" ? (
          <div className="grid grid-cols-3 gap-2">
            {q.options.map((opt: any) => {
              const isSelected = selected.includes(opt.id);
              return (
                <motion.button
                  key={opt.id}
                  onClick={() => toggleAnswer(q.id, opt.id, q.max)}
                  className={`relative aspect-square rounded-lg overflow-hidden transition-all ${
                    isSelected ? 'ring-2 ring-primary scale-[0.97]' : 'opacity-75 hover:opacity-100'
                  }`}
                  data-testid={`option-${q.id}-${opt.id}`}
                  whileTap={{ scale: 0.95 }}
                >
                  <img 
                    src={opt.image} 
                    alt={opt.label}
                    className="w-full h-full object-cover"
                  />
                  <div className={`absolute inset-0 transition-colors ${isSelected ? 'bg-primary/30' : 'bg-black/20'}`} />
                  <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/80 to-transparent">
                    <span className="text-[9px] font-medium text-white text-center block truncate">
                      {opt.label}
                    </span>
                    {opt.description && (
                      <span className="text-[8px] text-white/80 block truncate">
                        {opt.description}
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <motion.div 
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-lg"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    >
                      <Check className="w-3 h-3 text-white" />
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {q.options.map((opt) => {
              const isSelected = selected.includes(opt.id);
              const isDealbreaker = q.type === "dealbreaker";
              return (
                <motion.button
                  key={opt.id}
                  onClick={() => toggleAnswer(q.id, opt.id, q.max)}
                  className={`px-3 py-2 rounded-full text-xs font-medium transition-all ${
                    isSelected 
                      ? isDealbreaker 
                        ? 'bg-red-500/20 text-red-400 ring-2 ring-red-500/50' 
                        : 'bg-primary/20 text-primary ring-2 ring-primary/50'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                  data-testid={`option-${q.id}-${opt.id}`}
                  whileTap={{ scale: 0.95 }}
                >
                  {isDealbreaker && isSelected && <X className="w-3 h-3 inline mr-1" />}
                  {opt.label}
                </motion.button>
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

