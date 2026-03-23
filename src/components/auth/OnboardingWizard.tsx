import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PhotoUpload from "@/components/profile/PhotoUpload";
import { ArrowRight, ArrowLeft, Check, Sparkles, Heart, Star, Camera, Target, Users, Smile, X, Zap, BookOpen, MessageCircle, Trophy, Award, TrendingUp, Send } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RELIGION_OPTIONS, MEET_PREFERENCE_OPTIONS } from "@/lib/religionOptions";

const RELIGION_FIELD_OPTIONS = RELIGION_OPTIONS.map((r) => ({ value: r.value, label: r.label }));

const basicInfoSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  age: z.coerce.number().min(18, "Must be at least 18").max(100, "Invalid age"),
  location: z.string().min(2, "Location is required"),
  bio: z.string().min(10, "Bio must be at least 10 characters").max(500, "Bio too long"),
  gender: z.enum(['male', 'female', 'other'], { required_error: "Please select your gender" }),
  education: z.string().optional(),
  career: z.string().optional(),
  incomeRange: z.string().optional(),
  zodiacSign: z.enum(['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces']).optional(),
  birthDate: z.string().optional(),
  religion: z.string().optional(),
});

type BasicInfoData = z.infer<typeof basicInfoSchema>;

interface OnboardingWizardProps {
  userId: string;
  initialData?: {
    name?: string;
    email?: string;
  };
  onComplete: () => void;
  onClose?: () => void;
}

const RELATIONSHIP_GOALS = [
  { value: "marriage", label: "Marriage", icon: Heart },
  { value: "dating", label: "Serious Dating", icon: Heart },
  { value: "friendship", label: "Friendship", icon: Users },
  { value: "networking", label: "Professional Networking", icon: Users },
];

const VALUES = [
  "Family-Oriented", "Career-Focused", "Adventurous", "Spiritual",
  "Health-Conscious", "Creative", "Ambitious", "Honest",
  "Loyal", "Fun-Loving", "Intellectual", "Empathetic"
];

const LIFESTYLE = [
  "Fitness Enthusiast", "Foodie", "Travel Lover", "Homebody",
  "Night Owl", "Early Bird", "Pet Lover", "Social Butterfly",
  "Bookworm", "Tech Savvy", "Artist", "Entrepreneur"
];

const INTERESTS = [
  "Technology", "Travel", "Fitness", "Reading", "Cooking",
  "Music", "Art", "Sports", "Photography", "Gaming",
  "Fashion", "Movies", "Dancing", "Hiking"
];

const EDUCATION_LEVELS = [
  "High School", "Some College", "Bachelor's Degree",
  "Master's Degree", "PhD/Doctorate", "Professional Degree",
];

const INCOME_RANGES = [
  "Under $30k", "$30k - $50k", "$50k - $75k",
  "$75k - $100k", "$100k - $150k", "$150k+", "Prefer not to say",
];

const ZODIAC_SIGNS = [
  { value: 'aries', label: 'Aries (Mar 21 - Apr 19)' },
  { value: 'taurus', label: 'Taurus (Apr 20 - May 20)' },
  { value: 'gemini', label: 'Gemini (May 21 - Jun 20)' },
  { value: 'cancer', label: 'Cancer (Jun 21 - Jul 22)' },
  { value: 'leo', label: 'Leo (Jul 23 - Aug 22)' },
  { value: 'virgo', label: 'Virgo (Aug 23 - Sep 22)' },
  { value: 'libra', label: 'Libra (Sep 23 - Oct 22)' },
  { value: 'scorpio', label: 'Scorpio (Oct 23 - Nov 21)' },
  { value: 'sagittarius', label: 'Sagittarius (Nov 22 - Dec 21)' },
  { value: 'capricorn', label: 'Capricorn (Dec 22 - Jan 19)' },
  { value: 'aquarius', label: 'Aquarius (Jan 20 - Feb 18)' },
  { value: 'pisces', label: 'Pisces (Feb 19 - Mar 20)' },
];

type JourneyStyle = 'fast' | 'deep' | 'conversational' | null;
type ChapterType = 'intro' | 'who-are-you' | 'what-matters' | 'how-connect' | 'ideal-day' | 'future-together' | 'photos' | 'blueprint';

const JOURNEY_STYLES = [
  {
    id: 'fast' as JourneyStyle,
    title: "Fast & Fun",
    subtitle: "Quick game-style setup",
    icon: Zap,
    description: "Complete in 5 minutes with interactive games",
    color: "from-primary/80 to-primary/40",
    timeEstimate: "~5 min",
  },
  {
    id: 'deep' as JourneyStyle,
    title: "Deep & Thoughtful",
    subtitle: "Story-driven exploration",
    icon: BookOpen,
    description: "Take your time with narrative chapters",
    color: "from-primary/80 to-primary/50",
    timeEstimate: "~10 min",
  },
  {
    id: 'conversational' as JourneyStyle,
    title: "Conversational",
    subtitle: "Chat with AI matchmaker",
    icon: MessageCircle,
    description: "Natural conversation with real-time insights",
    color: "from-primary/70 to-primary/40",
    timeEstimate: "~8 min",
  },
];

// Story Chapters Configuration - Different for each journey style
const getChaptersForStyle = (style: JourneyStyle) => {
  if (style === 'fast') {
    // Fast & Fun: Shorter, simpler questions, fewer fields
    return {
      'who-are-you': {
        title: "Quick Start",
        subtitle: "Let's get to know you fast!",
        description: "Just the essentials - we'll make this quick",
        questions: [
          { id: 'name', label: "Your name?", type: 'text', required: true, placeholder: "Full name" },
          { id: 'age', label: "Age?", type: 'number', required: true, placeholder: "Age" },
          { id: 'location', label: "Where are you?", type: 'text', required: true, placeholder: "City" },
          { id: 'gender', label: "Gender?", type: 'select', required: true, options: [
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
            { value: 'other', label: 'Other' },
          ]},
          { id: 'bio', label: "Quick bio (min 10 chars)", type: 'textarea', required: true, placeholder: "Tell us about yourself in a few words..." },
        ],
      },
      'what-matters': {
        title: "What You Want",
        subtitle: "Your goal & top values",
        description: "What are you looking for?",
        questions: [
          { id: 'relationshipGoal', label: "What are you looking for?", type: 'goal-select', required: true },
          { id: 'meetPreference', label: "People & groups — what should we highlight?", type: 'meet-preference-select', required: true },
          { id: 'values', label: "Top 3 values", type: 'multi-select', required: true, max: 3 },
        ],
      },
      'how-connect': {
        title: "Your Vibe",
        subtitle: "Lifestyle & interests",
        description: "How do you like to spend your time?",
        questions: [
          { id: 'lifestyle', label: "Lifestyle tags", type: 'multi-select', required: false, max: 5 },
          { id: 'interests', label: "Interests", type: 'multi-select', required: false, max: 5 },
        ],
      },
      'ideal-day': {
        title: "About You",
        subtitle: "Quick details",
        description: "A few more quick details",
        questions: [
          { id: 'career', label: "What do you do?", type: 'text', required: false, placeholder: "Job title" },
        ],
      },
      'future-together': {
        title: "Almost Done!",
        subtitle: "Optional extras",
        description: "Anything else? (Optional)",
        questions: [],
      },
    };
  } else if (style === 'deep') {
    // Deep & Thoughtful: More detailed, narrative questions
    return {
      'who-are-you': {
        title: "Chapter 1: The Foundation of You",
        subtitle: "Building your authentic identity",
        description: "Every great story begins with understanding who you are at your core. Let's explore the fundamental aspects that make you uniquely you.",
        questions: [
          { id: 'name', label: "What name do you go by?", type: 'text', required: true, placeholder: "The name that represents you" },
          { id: 'age', label: "How many years of life experience have you gathered?", type: 'number', required: true, placeholder: "Your age" },
          { id: 'location', label: "Where do you call home?", type: 'text', required: true, placeholder: "The place where your heart feels at peace" },
          { id: 'gender', label: "How do you identify yourself?", type: 'select', required: true, options: [
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
            { value: 'other', label: 'Other' },
          ]},
          { id: 'religion', label: "How would you describe your faith or worldview?", type: 'select', required: true, options: RELIGION_FIELD_OPTIONS },
          { id: 'bio', label: "Share your story with us", type: 'textarea', required: true, placeholder: "Tell us your story — passions, dreams, what you're seeking in life. What makes you, you?" },
        ],
      },
      'what-matters': {
        title: "Chapter 2: The Values That Guide You",
        subtitle: "Discovering what truly matters",
        description: "Our values are the compass that guides our decisions and shapes our relationships. What principles do you hold dear?",
        questions: [
          { id: 'relationshipGoal', label: "What kind of connection are you seeking?", type: 'goal-select', required: true },
          { id: 'meetPreference', label: "For matches and communities, what should we prioritize?", type: 'meet-preference-select', required: true },
          { id: 'values', label: "Select your core values (up to 5)", type: 'multi-select', required: true, max: 5 },
        ],
      },
      'how-connect': {
        title: "Chapter 3: The Art of Connection",
        subtitle: "How you relate to the world",
        description: "Connection is an art form. How do you prefer to engage with others and express yourself?",
        questions: [
          { id: 'lifestyle', label: "Which lifestyle elements resonate with you?", type: 'multi-select', required: false },
          { id: 'interests', label: "What activities and interests light you up?", type: 'multi-select', required: false },
        ],
      },
      'ideal-day': {
        title: "Chapter 4: The Canvas of Your Life",
        subtitle: "Painting your ideal reality",
        description: "Imagine your perfect day. What does it look like? What elements would make it meaningful?",
        questions: [
          { id: 'education', label: "What level of education have you achieved?", type: 'select', required: false, options: EDUCATION_LEVELS.map(l => ({ value: l, label: l })) },
          { id: 'career', label: "What work or calling do you pursue?", type: 'text', required: false, placeholder: "Tell us about your career path" },
          { id: 'incomeRange', label: "Income range", type: 'select', required: false, options: INCOME_RANGES.map(r => ({ value: r, label: r })) },
        ],
      },
      'future-together': {
        title: "Chapter 5: Visions of Tomorrow",
        subtitle: "Envisioning your future",
        description: "As we look ahead, what do you envision for your future relationships and life path?",
        questions: [
          { id: 'zodiacSign', label: "Do you identify with a zodiac sign?", type: 'select', required: false, options: ZODIAC_SIGNS.map(s => ({ value: s.value, label: s.label })) },
          { id: 'birthDate', label: "When were you born?", type: 'birthday', required: false },
        ],
      },
    };
  } else {
    // Conversational: Chat-like, interactive prompts
    return {
      'who-are-you': {
        title: "Let's Chat",
        subtitle: "Getting to know you",
        description: "Hi! I'm here to help you create an amazing profile. Let's start with the basics - just like we're having a conversation.",
        questions: [
          { id: 'name', label: "First things first - what should I call you?", type: 'text', required: true, placeholder: "Your name" },
          { id: 'age', label: "How old are you? (Don't worry, I won't judge!)", type: 'number', required: true, placeholder: "Your age" },
          { id: 'location', label: "Where are you based? I'd love to know where you're from!", type: 'text', required: true, placeholder: "Your location" },
          { id: 'gender', label: "How do you identify?", type: 'select', required: true, options: [
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
            { value: 'other', label: 'Other' },
          ]},
          { id: 'religion', label: "What faith or worldview fits you best? (Everyone’s welcome here)", type: 'select', required: true, options: RELIGION_FIELD_OPTIONS },
          { id: 'bio', label: "Now, tell me about yourself! What makes you unique?", type: 'textarea', required: true, placeholder: "Share whatever you'd like - your interests, what you're looking for, your personality..." },
        ],
      },
      'what-matters': {
        title: "What Matters to You?",
        subtitle: "Let's talk about your goals",
        description: "I'm curious - what are you really looking for in a relationship? And what values drive you?",
        questions: [
          { id: 'relationshipGoal', label: "What kind of relationship are you seeking?", type: 'goal-select', required: true },
          { id: 'meetPreference', label: "Should we highlight people & groups closer to your background, or keep everything open?", type: 'meet-preference-select', required: true },
          { id: 'values', label: "What values are most important to you? (Pick up to 5)", type: 'multi-select', required: true, max: 5 },
        ],
      },
      'how-connect': {
        title: "How You Connect",
        subtitle: "Tell me about your lifestyle",
        description: "I want to understand how you like to live and what gets you excited. What are you into?",
        questions: [
          { id: 'lifestyle', label: "Which of these describe your lifestyle?", type: 'multi-select', required: false },
          { id: 'interests', label: "What are your interests? What do you love doing?", type: 'multi-select', required: false },
        ],
      },
      'ideal-day': {
        title: "A Bit More About You",
        subtitle: "Just a few more questions",
        description: "Almost there! Just a couple more things I'm curious about...",
        questions: [
          { id: 'education', label: "What's your education level?", type: 'select', required: false, options: EDUCATION_LEVELS.map(l => ({ value: l, label: l })) },
          { id: 'career', label: "What do you do for work?", type: 'text', required: false, placeholder: "Your profession" },
          { id: 'incomeRange', label: "Income range (totally optional!)", type: 'select', required: false, options: INCOME_RANGES.map(r => ({ value: r, label: r })) },
        ],
      },
      'future-together': {
        title: "Wrapping Up",
        subtitle: "Any final details?",
        description: "We're almost done! Anything else you'd like to share? (This is optional)",
        questions: [
          { id: 'zodiacSign', label: "Are you into astrology? What's your sign?", type: 'select', required: false, options: ZODIAC_SIGNS.map(s => ({ value: s.value, label: s.label })) },
          { id: 'birthDate', label: "When's your birthday?", type: 'birthday', required: false },
        ],
      },
    };
  }
};

// AI Insights Generator
const generateInsight = (chapter: string, answers: any, journeyStyle: JourneyStyle): string => {
  const insights: Record<string, Record<string, string[]>> = {
    'who-are-you': {
      fast: [
        "Great start! I'm learning about you...",
        "Your bio tells a story - I like it!",
        "I'm building your profile as we go!",
      ],
      deep: [
        "I'm getting a sense of who you are...",
        "Your bio tells me you value authenticity.",
        "I can see you're someone who appreciates meaningful connections.",
      ],
      conversational: [
        "Thank you for sharing that with me.",
        "I'm noticing patterns in what you're telling me.",
        "This helps me understand you better.",
      ],
    },
    'what-matters': {
      fast: [
        "Your values are clear - excellent!",
        "These values will guide your matches.",
        "I see what matters most to you.",
      ],
      deep: [
        "Your values reveal what's truly important to you.",
        "I notice you prioritize authenticity - that's beautiful.",
        "These values will guide us to find your perfect match.",
      ],
      conversational: [
        "I'm learning what truly matters to you.",
        "Your values say a lot about who you are.",
        "This is important for finding the right connection.",
      ],
    },
    'how-connect': {
      fast: [
        "I see how you like to connect!",
        "Your lifestyle choices are interesting.",
        "This helps me match you better.",
      ],
      deep: [
        "Your lifestyle reveals how you want to live.",
        "I'm understanding your communication style.",
        "These preferences shape your ideal match.",
      ],
      conversational: [
        "I'm learning about your lifestyle preferences.",
        "This tells me how you like to spend your time.",
        "Your interests are coming together nicely.",
      ],
    },
  };
  
  const chapterInsights = insights[chapter]?.[journeyStyle || 'deep'] || [
    "I'm learning more about you...",
    "This information is valuable.",
    "Your profile is taking shape.",
  ];
  
  return chapterInsights[Math.floor(Math.random() * chapterInsights.length)];
};

// Gamification: Points and Achievements
const ACHIEVEMENTS = [
  { id: 'first-step', name: 'First Steps', description: 'Completed your first chapter', icon: TrendingUp },
  { id: 'value-master', name: 'Values Master', description: 'Selected your core values', icon: Star },
  { id: 'storyteller', name: 'Storyteller', description: 'Wrote a compelling bio', icon: BookOpen },
  { id: 'photo-ready', name: 'Photo Ready', description: 'Added your photos', icon: Camera },
  { id: 'complete', name: 'Journey Complete', description: 'Finished your onboarding', icon: Trophy },
];

interface ChatMessage {
  id: string;
  content: string;
  sender: 'ai' | 'user';
  timestamp: Date;
}

export default function OnboardingWizard({ userId, initialData, onComplete, onClose }: OnboardingWizardProps) {
  const [journeyStyle, setJourneyStyle] = useState<JourneyStyle>(null);
  const [currentChapter, setCurrentChapter] = useState<ChapterType>('intro');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<string>("");
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [selectedLifestyle, setSelectedLifestyle] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [meetPreference, setMeetPreference] = useState<string>("");
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [showInsight, setShowInsight] = useState(false);
  const [points, setPoints] = useState(0);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [fieldCompleted, setFieldCompleted] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useState<HTMLDivElement | null>(null)[0];
  const { toast } = useToast();

  const form = useForm<BasicInfoData>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      name: initialData?.name || "",
      age: undefined,
      location: "",
      bio: "",
      gender: undefined,
      education: "",
      career: "",
      incomeRange: "",
      zodiacSign: undefined,
      birthDate: "",
      religion: "",
    },
  });

  // Initialize chat when entering conversational chapter
  useEffect(() => {
    if (journeyStyle === 'conversational' && currentChapter !== 'intro' && currentChapter !== 'photos' && currentChapter !== 'blueprint') {
      const currentChapterData = getCurrentChapterData();
      if (currentChapterData && currentChapterData.questions.length > 0) {
        // Clear chat when entering a new chapter
        const firstQuestion = currentChapterData.questions[0];
        if (firstQuestion) {
          const welcomeMsg: ChatMessage = {
            id: Date.now().toString(),
            content: firstQuestion.label + ('placeholder' in firstQuestion && firstQuestion.placeholder ? ` (${firstQuestion.placeholder})` : ''),
            sender: 'ai',
            timestamp: new Date(),
          };
          setChatMessages([welcomeMsg]);
          setCurrentQuestionIndex(0); // Reset to first question
        }
      }
    } else if (journeyStyle !== 'conversational') {
      // Clear chat when switching away from conversational
      setChatMessages([]);
    }
  }, [currentChapter, journeyStyle]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        return await apiRequest("PATCH", `/api/users/${userId}`, data);
      } catch (error) {
        const currentUser = localStorage.getItem("currentUser");
        if (currentUser) {
          const user = JSON.parse(currentUser);
          const updatedUser = { ...user, ...data, onboardingCompleted: true };
          localStorage.setItem("currentUser", JSON.stringify(updatedUser));
        }
        return data;
      }
    },
    onSuccess: async () => {
      toast({
        title: "Profile completed!",
        description: "Now let's discover who you are",
      });
      
      // Update user object in localStorage
      const currentUser = localStorage.getItem("currentUser");
      if (currentUser) {
        try {
          const user = JSON.parse(currentUser);
          const updatedUser = { ...user, onboardingCompleted: true };
          localStorage.setItem("currentUser", JSON.stringify(updatedUser));
        } catch (e) {
          // Ignore parse errors
        }
      }
      localStorage.setItem("onboardingCompleted", "true");
      
      try {
        const user = await apiRequest("GET", `/api/users/${userId}`);
        const userData = await user.json();
        if (!userData.selfDiscoveryCompleted) {
          window.location.href = "/ai-matchmaker/flow-b";
          return;
        }
      } catch (error) {
        const currentUser = localStorage.getItem("currentUser");
        if (currentUser) {
          try {
            const user = JSON.parse(currentUser);
            if (!user.selfDiscoveryCompleted) {
              window.location.href = "/ai-matchmaker/flow-b";
              return;
            }
          } catch (e) {
            // Fall through
          }
        }
      }
      
      onComplete();
    },
    onError: () => {
      const currentUserStr = localStorage.getItem("currentUser");
      if (currentUserStr) {
        try {
          const user = JSON.parse(currentUserStr);
        const updatedUser = { ...user, onboardingCompleted: true };
        localStorage.setItem("currentUser", JSON.stringify(updatedUser));
        
        if (!user.selfDiscoveryCompleted) {
          localStorage.setItem("onboardingCompleted", "true");
          window.location.href = "/ai-matchmaker/flow-b";
          return;
        }
        } catch (e) {
          // Ignore parse errors
        }
      }
      localStorage.setItem("onboardingCompleted", "true");
      toast({
        title: "Profile completed!",
        description: "Welcome to Matchify (Demo Mode)",
      });
      onComplete();
    },
  });

  // Award points and achievements
  const awardPoints = (amount: number, achievementId?: string) => {
    if (journeyStyle === 'fast') {
      setPoints(prev => prev + amount);
      if (achievementId && !achievements.includes(achievementId)) {
        setAchievements(prev => [...prev, achievementId]);
        const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
        if (achievement) {
          const AchievementIcon = achievement.icon;
          toast({
            title: "Achievement Unlocked!",
            description: achievement.name,
          });
        }
      }
    }
  };

  // Chapter navigation - different order for Fast & Fun (skip some chapters)
  const getChapterOrder = (): ChapterType[] => {
    if (journeyStyle === 'fast') {
      // Fast & Fun: Skip some optional chapters to make it faster
      return ['who-are-you', 'what-matters', 'how-connect', 'ideal-day', 'photos', 'blueprint'];
    }
    return ['who-are-you', 'what-matters', 'how-connect', 'ideal-day', 'future-together', 'photos', 'blueprint'];
  };
  
  const chapterOrder = getChapterOrder();
  
  const getCurrentChapterData = () => {
    if (currentChapter === 'intro' || currentChapter === 'photos' || currentChapter === 'blueprint') {
      return null;
    }
    if (!journeyStyle) return null;
    const chapters = getChaptersForStyle(journeyStyle);
    return chapters[currentChapter as keyof typeof chapters];
  };

  const handleNextChapter = () => {
    const currentIndex = chapterOrder.indexOf(currentChapter);
    if (currentIndex < chapterOrder.length - 1) {
      const nextChapter = chapterOrder[currentIndex + 1];
      setCurrentChapter(nextChapter);
      setCurrentQuestionIndex(0);
      
      // Award points for completing chapter (Fast & Fun style)
      if (journeyStyle === 'fast' && currentChapter !== 'intro') {
        awardPoints(50, currentIndex === 0 ? 'first-step' : undefined);
      }
      
      // Show AI insight when moving to new chapter
      if (currentChapter !== 'intro' && currentChapter !== 'blueprint') {
        const insight = generateInsight(currentChapter, form.getValues(), journeyStyle);
        setAiInsights(prev => [...prev, insight]);
        setShowInsight(true);
        setTimeout(() => setShowInsight(false), 4000);
      }
    }
  };

  const handlePreviousChapter = () => {
    const currentIndex = chapterOrder.indexOf(currentChapter);
    if (currentIndex > 0) {
      setCurrentChapter(chapterOrder[currentIndex - 1]);
      setCurrentQuestionIndex(0);
    }
  };

  // Enhanced progress calculation - accounts for questions within chapters
  const calculateProgress = () => {
    if (!journeyStyle) return 0;
    
    const currentChapterIndex = chapterOrder.indexOf(currentChapter);
    const totalChapters = chapterOrder.length;
    
    // Base progress from completed chapters
    const chapterProgress = currentChapterIndex / totalChapters;
    
    // Add progress from current chapter
    const currentChapterData = getCurrentChapterData();
    if (currentChapterData && currentChapter !== 'intro' && currentChapter !== 'blueprint' && currentChapter !== 'photos') {
      const totalQuestions = currentChapterData.questions.length;
      const questionProgress = currentQuestionIndex / totalQuestions;
      const chapterWeight = 1 / totalChapters;
      return ((chapterProgress + questionProgress * chapterWeight) * 100);
    }
    
    return ((currentChapterIndex + 1) / totalChapters) * 100;
  };

  const progress = calculateProgress();

  const handleComplete = () => {
    const basicInfo = form.getValues();
    const age = basicInfo.age;
    
    const formValues = form.getValues() as any;
    const birthDay = formValues.birthDay;
    const birthMonth = formValues.birthMonth;
    
    let calculatedBirthDate = basicInfo.birthDate;
    if (birthDay && birthMonth && age) {
      const currentYear = new Date().getFullYear();
      const calculatedYear = currentYear - Number(age);
      const monthStr = String(birthMonth).padStart(2, '0');
      const dayStr = String(birthDay).padStart(2, '0');
      calculatedBirthDate = `${calculatedYear}-${monthStr}-${dayStr}`;
    }
    
    const commitmentMap: Record<string, "marriage" | "serious" | "casual"> = {
      marriage: "marriage",
      dating: "serious",
      friendship: "casual",
      networking: "casual",
    };

    const profileData = {
      ...basicInfo,
      birthDate: calculatedBirthDate,
      photos,
      relationshipGoal: selectedGoal,
      commitmentIntention: commitmentMap[selectedGoal] ?? "casual",
      values: selectedValues,
      lifestyle: selectedLifestyle,
      interests: selectedInterests,
      religion: basicInfo.religion || undefined,
      meetPreference: meetPreference || "open_to_all",
      onboardingCompleted: true,
    };
    
    if (journeyStyle === 'fast') {
      awardPoints(100, 'complete');
    }
    
    updateMutation.mutate(profileData);
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      localStorage.removeItem("authToken");
      localStorage.removeItem("currentUser");
      localStorage.removeItem("onboardingCompleted");
      window.location.href = "/login";
    }
  };

  // Render Journey Style Selection
  if (!journeyStyle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-5xl relative z-10"
        >
          <Card className="shadow-2xl border-primary/20 relative">
            {/* Back button - top left */}
            {onClose && (
              <div className="absolute top-4 left-4 z-20">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="flex items-center gap-2 rounded-full bg-muted/80 hover:bg-muted border border-border px-4 py-2.5 text-sm font-medium"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </motion.button>
              </div>
            )}
            <CardContent className="p-8 sm:p-12">
              <div className="text-center mb-12">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="mb-6"
                >
                  <Sparkles className="w-16 h-16 text-primary mx-auto" />
                </motion.div>
                <h1 className="text-4xl sm:text-5xl font-display font-bold mb-4">
                  Welcome to Your Matchmaking Journey
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Choose how you'd like to discover yourself and find your perfect match. 
                  Every experience is tailored to understand who you are.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {JOURNEY_STYLES.map((style) => {
                  const StyleIcon = style.icon;
                  return (
                    <motion.button
                      key={style.id}
                      whileHover={{ scale: 1.05, y: -5 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setJourneyStyle(style.id);
                        setCurrentChapter('intro');
                        if (style.id === 'conversational') {
                          setChatMessages([]);
                        }
                      }}
                      className={`p-8 rounded-2xl border-2 transition-all text-left bg-gradient-to-br ${style.color} border-primary/30 hover:border-primary/60 shadow-lg hover:shadow-xl relative overflow-hidden group`}
                    >
                      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative z-10">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.1 }}
                          className="mb-4"
                        >
                          <StyleIcon className="w-12 h-12 text-white mx-auto" />
                        </motion.div>
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <h3 className="text-2xl font-bold text-white">{style.title}</h3>
                        </div>
                        <p className="text-white/90 mb-2 font-medium">{style.subtitle}</p>
                        <p className="text-white/80 text-sm mb-3">{style.description}</p>
                        <Badge className="bg-white/20 text-white border-white/30">
                          {style.timeEstimate}
                        </Badge>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Don't worry - you can always change your approach later
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Render Story Chapters
  const chapterData = getCurrentChapterData();
  const currentQuestion = chapterData?.questions[currentQuestionIndex];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/10 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />
      
      <Card className="w-full max-w-2xl relative z-10 shadow-2xl border-primary/20 mx-2 sm:mx-4">
        {/* Close Button */}
        <div className="absolute top-4 right-4 z-20">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleClose}
            className="w-10 h-10 rounded-full bg-muted/80 hover:bg-muted border border-border flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Points & Achievements (Fast & Fun style) */}
        {journeyStyle === 'fast' && (
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
            <div className="bg-primary/10 border border-primary/30 rounded-full px-3 py-1 flex items-center gap-1">
              <Trophy className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-primary">{points}</span>
            </div>
            {achievements.length > 0 && (
              <div className="bg-primary/10 border border-primary/30 rounded-full px-3 py-1 flex items-center gap-1">
                <Award className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">{achievements.length}</span>
              </div>
            )}
          </div>
        )}

        {/* Progress Bar */}
        <div className="p-4 sm:p-6 pb-4">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex-1 min-w-0">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground block truncate">
                {chapterData ? chapterData.title : currentChapter === 'intro' ? "Let's Begin" : currentChapter === 'blueprint' ? "Your Blueprint" : "Building Your Profile"}
              </span>
              {chapterData && chapterData.questions.length > 1 && (
                <span className="text-xs text-muted-foreground/70 mt-1 block">
                  Question {currentQuestionIndex + 1} of {chapterData.questions.length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-primary border-primary text-xs sm:text-sm flex items-center gap-1">
                {journeyStyle === 'fast' && <><Zap className="w-3 h-3" /> Fast</>}
                {journeyStyle === 'deep' && <><BookOpen className="w-3 h-3" /> Deep</>}
                {journeyStyle === 'conversational' && <><MessageCircle className="w-3 h-3" /> Conversational</>}
              </Badge>
              <span className="text-xs sm:text-sm font-medium text-primary">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
          <Progress value={progress} className="h-2 sm:h-2.5 transition-all duration-500" />
        </div>

        <CardContent className="min-h-[400px] sm:min-h-[500px] flex flex-col p-4 sm:p-6">
          <AnimatePresence mode="wait">
            {/* Intro Chapter */}
            {currentChapter === 'intro' && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex-1 flex flex-col items-center justify-center text-center space-y-6"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="mb-6"
                >
                  {journeyStyle === 'fast' && <Zap className="w-16 h-16 text-primary mx-auto" />}
                  {journeyStyle === 'deep' && <BookOpen className="w-16 h-16 text-primary mx-auto" />}
                  {journeyStyle === 'conversational' && <MessageCircle className="w-16 h-16 text-primary mx-auto" />}
                </motion.div>
                <h2 className="text-3xl font-display font-bold">
                  Let's Begin Your Journey
                </h2>
                <p className="text-muted-foreground text-lg max-w-md">
                  {journeyStyle === 'fast' && "We'll make this quick and fun with interactive games! Earn points as you go."}
                  {journeyStyle === 'deep' && "Take your time as we explore who you are through meaningful stories."}
                  {journeyStyle === 'conversational' && "I'll guide you through a natural conversation. Just be yourself!"}
                </p>
                {journeyStyle === 'fast' && (
                  <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 max-w-md">
                    <p className="text-sm text-primary font-medium flex items-center gap-2 justify-center">
                      <Trophy className="w-4 h-4" />
                      Earn points and unlock achievements as you complete each chapter!
                    </p>
                  </div>
                )}
                <Button
                  onClick={() => {
                    setCurrentChapter('who-are-you');
                    if (journeyStyle === 'conversational') {
                      // Initialize chat with first question
                      const chapters = getChaptersForStyle('conversational');
                      const firstChapter = chapters['who-are-you'];
                      if (firstChapter && firstChapter.questions.length > 0) {
                        const firstQuestion = firstChapter.questions[0];
                        const welcomeMsg: ChatMessage = {
                          id: Date.now().toString(),
                          content: firstChapter.description || firstQuestion.label,
                          sender: 'ai',
                          timestamp: new Date(),
                        };
                        setTimeout(() => setChatMessages([welcomeMsg]), 300);
                      }
                    }
                  }}
                  size="lg"
                  className="mt-8 rounded-full px-12 h-14 text-lg glow-primary"
                >
                  Start Journey
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </motion.div>
            )}

            {/* Story Chapters */}
            {chapterData && currentChapter !== 'photos' && currentChapter !== 'blueprint' && journeyStyle === 'conversational' && (
              <motion.div
                key={`chat-${currentChapter}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col h-full w-full"
              >
                    {/* Chat Messages Area */}
                    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 min-h-[400px] max-h-[500px]">
                      {chatMessages.length === 0 && chapterData && chapterData.questions.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-start gap-3 mb-4"
                        >
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <MessageCircle className="w-5 h-5 text-primary" />
                          </div>
                          <div className="bg-muted/50 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
                            <p className="text-sm text-foreground">
                              {chapterData.questions[currentQuestionIndex]?.label || chapterData.description}
                            </p>
                          </div>
                        </motion.div>
                      )}
                  {chatMessages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      {msg.sender === 'ai' && (
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <MessageCircle className="w-5 h-5 text-primary" />
                        </div>
                      )}
                      <div className={`rounded-2xl px-4 py-3 max-w-[80%] ${
                        msg.sender === 'user'
                          ? 'bg-primary text-primary-foreground rounded-tr-sm'
                          : 'bg-muted/50 rounded-tl-sm'
                      }`}>
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    </motion.div>
                  ))}
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-start gap-3"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <MessageCircle className="w-5 h-5 text-primary" />
                      </div>
                      <div className="bg-muted/50 rounded-2xl rounded-tl-sm px-4 py-3">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                  <div ref={(el) => { 
                    if (el) {
                      setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100);
                    }
                  }} />
                </div>

                {/* Chat Input */}
                <div className="border-t p-4 bg-background">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!chatInput.trim()) return;
                      
                      // Add user message
                      const userMsg: ChatMessage = {
                        id: Date.now().toString(),
                        content: chatInput.trim(),
                        sender: 'user',
                        timestamp: new Date(),
                      };
                      setChatMessages(prev => [...prev, userMsg]);
                      const userInput = chatInput.trim();
                      setChatInput("");
                      setIsTyping(true);

                      // Process the message and extract information
                      setTimeout(() => {
                        const currentQuestion = chapterData.questions[currentQuestionIndex];
                        if (!currentQuestion) {
                          setIsTyping(false);
                          return;
                        }
                        
                        // Extract information based on current question type
                        if (currentQuestion.type === 'text' || currentQuestion.type === 'textarea') {
                          if (currentQuestion.id === 'name') {
                            form.setValue('name', userInput);
                          } else if (currentQuestion.id === 'location') {
                            form.setValue('location', userInput);
                          } else if (currentQuestion.id === 'bio') {
                            form.setValue('bio', userInput);
                          } else if (currentQuestion.id === 'career') {
                            form.setValue('career', userInput);
                          }
                        } else if (currentQuestion.type === 'number') {
                          if (currentQuestion.id === 'age') {
                            const ageMatch = userInput.match(/\d+/);
                            if (ageMatch) form.setValue('age', parseInt(ageMatch[0]));
                          }
                        } else if (currentQuestion.type === 'select') {
                          // For select questions, try to match user input to options
                          if ('options' in currentQuestion && Array.isArray(currentQuestion.options)) {
                            const matchedOption = currentQuestion.options.find((opt: any) => 
                              opt.label.toLowerCase().includes(userInput.toLowerCase()) ||
                              userInput.toLowerCase().includes(opt.label.toLowerCase())
                            );
                            if (matchedOption) {
                              form.setValue(currentQuestion.id as keyof BasicInfoData, matchedOption.value as any);
                            }
                          }
                        } else if (currentQuestion.type === 'goal-select') {
                          // For relationship goals, try to match
                          const matchedGoal = RELATIONSHIP_GOALS.find(goal => 
                            goal.label.toLowerCase().includes(userInput.toLowerCase()) ||
                            userInput.toLowerCase().includes(goal.label.toLowerCase())
                          );
                          if (matchedGoal) {
                            setSelectedGoal(matchedGoal.value);
                          }
                        } else if (currentQuestion.type === "meet-preference-select") {
                          const matchedPref = MEET_PREFERENCE_OPTIONS.find(
                            (p) =>
                              p.label.toLowerCase().includes(userInput.toLowerCase()) ||
                              userInput.toLowerCase().includes(p.value.replace(/_/g, " ")) ||
                              (p.value === "same_faith" && /similar|same|background|faith/i.test(userInput)) ||
                              (p.value === "open_to_all" && /everyone|open|all|any/i.test(userInput))
                          );
                          if (matchedPref) {
                            setMeetPreference(matchedPref.value);
                          }
                        } else if (currentQuestion.type === 'multi-select') {
                          // For multi-select, try to match and add to selection
                          const items = currentQuestion.id === 'values' ? VALUES : 
                                      currentQuestion.id === 'lifestyle' ? LIFESTYLE : INTERESTS;
                          const selected = currentQuestion.id === 'values' ? selectedValues :
                                         currentQuestion.id === 'lifestyle' ? selectedLifestyle : selectedInterests;
                          const setter = currentQuestion.id === 'values' ? setSelectedValues :
                                       currentQuestion.id === 'lifestyle' ? setSelectedLifestyle : setSelectedInterests;
                          
                          // Try to find matching items in user input
                          const userWords = userInput.toLowerCase().split(/\s+/);
                          const maxItems = ('max' in currentQuestion && typeof currentQuestion.max === 'number') ? currentQuestion.max : undefined;
                          items.forEach(item => {
                            if (userWords.some(word => item.toLowerCase().includes(word) || word.length > 3 && item.toLowerCase().includes(word))) {
                              if (!selected.includes(item)) {
                                if (maxItems !== undefined && selected.length >= maxItems) {
                                  // Skip if max reached
                                } else {
                                  setter([...selected, item]);
                                }
                              }
                            }
                          });
                        }

                        // Generate AI response based on question type
                        let aiResponse = "";
                        if (currentQuestion.type === 'text' || currentQuestion.type === 'textarea') {
                          if (currentQuestion.id === 'name') {
                            aiResponse = `Nice to meet you, ${userInput}! I'm excited to get to know you better.`;
                          } else if (currentQuestion.id === 'location') {
                            aiResponse = `I love ${userInput}! That's a great place to be.`;
                          } else if (currentQuestion.id === 'bio') {
                            aiResponse = `Wow, that's really interesting! I'm getting a great sense of who you are.`;
                          } else if (currentQuestion.id === 'career') {
                            aiResponse = `That's fascinating! I'd love to hear more about your work.`;
                          } else {
                            aiResponse = "Thanks for sharing that!";
                          }
                        } else if (currentQuestion.type === 'number' && currentQuestion.id === 'age') {
                          aiResponse = `Thanks for sharing! Age is just a number, but it helps me understand you better.`;
                        } else if (currentQuestion.type === 'select') {
                          aiResponse = "Got it! Thanks for letting me know.";
                        } else if (currentQuestion.type === 'goal-select') {
                          aiResponse = "Perfect! That helps me understand what you're looking for.";
                        } else if (currentQuestion.type === "meet-preference-select") {
                          aiResponse = "Got it — I’ll tune your feed that way.";
                        } else if (currentQuestion.type === 'multi-select') {
                          aiResponse = "Great choices! I'm learning more about your preferences.";
                        } else {
                          aiResponse = "Thanks for sharing that! I'm learning more about you.";
                        }
                        
                        const aiMsg: ChatMessage = {
                          id: (Date.now() + 1).toString(),
                          content: aiResponse,
                          sender: 'ai',
                          timestamp: new Date(),
                        };
                        
                        setChatMessages(prev => [...prev, aiMsg]);
                        setIsTyping(false);

                        // Auto-advance to next question after a delay
                        setTimeout(() => {
                          if (currentQuestionIndex < chapterData.questions.length - 1) {
                            const nextIndex = currentQuestionIndex + 1;
                            setCurrentQuestionIndex(nextIndex);
                            // Add AI's next question
                            const nextQuestion = chapterData.questions[nextIndex];
                            if (nextQuestion) {
                              let questionText = nextQuestion.label;
                              if ('placeholder' in nextQuestion && nextQuestion.placeholder) {
                                questionText += ` (${nextQuestion.placeholder})`;
                              } else if (nextQuestion.type === 'select' && 'options' in nextQuestion && Array.isArray(nextQuestion.options)) {
                                // For select questions, show options
                                const optionsText = nextQuestion.options.slice(0, 3).map((opt: any) => opt.label).join(', ');
                                questionText += ` (Options: ${optionsText}${nextQuestion.options.length > 3 ? '...' : ''})`;
                              } else if (nextQuestion.type === 'multi-select') {
                                questionText += ` (You can mention any that apply)`;
                              }
                              const nextAiMsg: ChatMessage = {
                                id: (Date.now() + 2).toString(),
                                content: questionText,
                                sender: 'ai',
                                timestamp: new Date(),
                              };
                              setChatMessages(prev => [...prev, nextAiMsg]);
                            }
                          } else if (isChapterComplete(chapterData)) {
                            // Add completion message before moving to next chapter
                            const completionMsg: ChatMessage = {
                              id: (Date.now() + 3).toString(),
                              content: "Great! I've learned a lot about you. Let's move on to the next topic!",
                              sender: 'ai',
                              timestamp: new Date(),
                            };
                            setChatMessages(prev => [...prev, completionMsg]);
                            setTimeout(() => {
                              setChatMessages([]); // Clear chat for next chapter
                              handleNextChapter();
                            }, 2000);
                          }
                        }, 1500);
                      }, 1000);
                    }}
                    className="flex gap-2"
                  >
                    <Input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 rounded-full"
                      autoFocus
                    />
                    <Button
                      type="submit"
                      size="icon"
                      className="rounded-full"
                      disabled={!chatInput.trim() || isTyping}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              </motion.div>
            )}

            {/* Regular Form Interface for Fast & Deep */}
            {chapterData && currentChapter !== 'photos' && currentChapter !== 'blueprint' && journeyStyle !== 'conversational' && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentChapter}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="flex-1 flex flex-col items-center justify-center text-center space-y-6"
                >
                {/* Chapter Header - Different styling based on journey style */}
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="space-y-4 text-center"
                >
                  <h2 className={`font-display font-bold ${
                    journeyStyle === 'fast' ? 'text-2xl' : 'text-3xl'
                  }`}>
                    {chapterData.title}
                  </h2>
                  <p className={`${
                    journeyStyle === 'fast' ? 'text-base' : 'text-lg'
                  } text-muted-foreground`}>
                    {chapterData.subtitle}
                  </p>
                  <p className={`${
                    journeyStyle === 'fast' ? 'text-xs' : 'text-sm'
                  } text-muted-foreground/80 max-w-md mx-auto`}>
                    {chapterData.description}
                  </p>
                </motion.div>

                {/* AI Insight Badge */}
                {showInsight && aiInsights.length > 0 && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="bg-primary/20 border-2 border-primary/40 rounded-2xl px-5 py-3 shadow-lg max-w-md mx-auto"
                  >
                    <div className="flex items-start gap-3">
                      <Sparkles className="text-primary flex-shrink-0 w-4 h-4" />
                      <span className="text-primary font-medium text-sm">
                        {aiInsights[aiInsights.length - 1]}
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Render Questions Based on Chapter */}
                <AnimatePresence mode="wait">
                  {renderChapterContent(chapterData, currentQuestionIndex, journeyStyle)}
                </AnimatePresence>

                {/* Question Navigation (within chapter) - Hidden for Fast & Fun, simpler for others */}
                {chapterData && chapterData.questions.length > 1 && journeyStyle !== 'fast' && (
                  <div className="flex items-center justify-center gap-2 mt-4 mb-2">
                    {chapterData.questions.map((_, index) => (
                      <motion.button
                        key={index}
                        onClick={() => {
                          setCurrentQuestionIndex(index);
                          setFieldCompleted(false);
                        }}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentQuestionIndex
                            ? 'bg-primary w-8'
                            : index < currentQuestionIndex
                            ? 'bg-primary/50'
                            : 'bg-muted'
                        }`}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        title={`Question ${index + 1}`}
                      />
                    ))}
                  </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between w-full mt-4 sm:mt-8 pt-4 sm:pt-6 border-t gap-2 sm:gap-4">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      if (currentQuestionIndex > 0) {
                        setCurrentQuestionIndex(currentQuestionIndex - 1);
                        setFieldCompleted(false);
                      } else if (currentChapter !== 'who-are-you') {
                        handlePreviousChapter();
                      }
                    }}
                    disabled={currentQuestionIndex === 0 && currentChapter === 'who-are-you'}
                    className="gap-2 text-xs sm:text-sm"
                  >
                    <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Previous</span>
                  </Button>
                  
                  {/* Question-level navigation for multi-question chapters */}
                  {chapterData && chapterData.questions.length > 1 && currentQuestionIndex < chapterData.questions.length - 1 && (
                    <Button
                      onClick={() => {
                        const nextIndex = currentQuestionIndex + 1;
                        const currentQ = chapterData.questions[currentQuestionIndex];
                        const nextQ = chapterData.questions[nextIndex];
                        
                        // Validate current question before moving
                        if (currentQ.required) {
                          if (currentQ.type === 'goal-select' && !selectedGoal) {
                            toast({
                              title: "Required field",
                              description: "Please select an option to continue",
                              variant: "destructive",
                            });
                            return;
                          }
                          if (currentQ.type === "meet-preference-select" && !meetPreference) {
                            toast({
                              title: "Required field",
                              description: "Choose how we should highlight people & groups",
                              variant: "destructive",
                            });
                            return;
                          }
                          if (currentQ.type === 'multi-select' && currentQ.id === 'values' && selectedValues.length === 0) {
                            toast({
                              title: "Required field",
                              description: "Please select at least one value",
                              variant: "destructive",
                            });
                            return;
                          }
                          const value = form.watch(currentQ.id as keyof BasicInfoData);
                          if (!value || String(value).trim() === '') {
                            toast({
                              title: "Required field",
                              description: "Please fill in this field to continue",
                              variant: "destructive",
                            });
                            return;
                          }
                        }
                        
                        setCurrentQuestionIndex(nextIndex);
                        setFieldCompleted(true);
                        setTimeout(() => setFieldCompleted(false), 500);
                      }}
                      className="gap-2 rounded-full text-xs sm:text-sm"
                    >
                      Next Question
                      <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  )}
                  
                  <Button
                    onClick={handleNextChapter}
                    className="gap-2 rounded-full glow-primary text-xs sm:text-sm ml-auto"
                    disabled={!isChapterComplete(chapterData)}
                  >
                    {currentQuestionIndex === (chapterData?.questions.length || 1) - 1 ? 'Continue' : 'Skip to Next Chapter'}
                    <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </div>
                </motion.div>
              </AnimatePresence>
            )}

            {/* Photos Chapter */}
            {currentChapter === 'photos' && (
              <motion.div
                key="photos"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 flex flex-col items-center justify-center text-center space-y-6"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="mb-4"
                >
                  <Camera className="w-16 h-16 text-primary mx-auto" />
                </motion.div>
                <h2 className="text-3xl font-display font-bold">Add Your Photos</h2>
                <p className="text-muted-foreground text-lg">
                  Profiles with photos get 10x more matches!
                </p>
                <div className="w-full mt-8">
                  <PhotoUpload
                    photos={photos}
                    onPhotosChange={(newPhotos) => {
                      setPhotos(newPhotos);
                      if (journeyStyle === 'fast' && newPhotos.length > 0) {
                        awardPoints(25, 'photo-ready');
                      }
                    }}
                    maxPhotos={6}
                  />
                </div>
                <div className="flex items-center justify-between w-full mt-8 pt-6 border-t">
                  <Button variant="ghost" onClick={handlePreviousChapter} className="gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <Button onClick={handleNextChapter} className="gap-2 rounded-full glow-primary">
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Blueprint Reveal Chapter */}
            {currentChapter === 'blueprint' && (
              <motion.div
                key="blueprint"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 flex flex-col items-center justify-center text-center space-y-6"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="mb-4"
                >
                  <Trophy className="w-16 h-16 text-primary mx-auto" />
                </motion.div>
                <h2 className="text-3xl font-display font-bold">Your Profile Blueprint</h2>
                <p className="text-muted-foreground text-lg max-w-md">
                  Here's what we've learned about you...
                </p>
                
                {/* Profile Summary Card */}
                <Card className="w-full mt-8 bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20">
                  <CardContent className="p-6">
                    <div className="space-y-4 text-left">
                      <div>
                        <span className="text-sm text-muted-foreground">Name:</span>
                        <p className="font-semibold text-lg">{form.watch('name') || 'Not provided'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Location:</span>
                        <p className="font-semibold text-lg">{form.watch('location') || 'Not provided'}</p>
                      </div>
                      {form.watch("religion") && (
                        <div>
                          <span className="text-sm text-muted-foreground">Faith / worldview:</span>
                          <p className="font-semibold text-lg">
                            {RELIGION_OPTIONS.find((r) => r.value === form.watch("religion"))?.label ||
                              form.watch("religion")}
                          </p>
                        </div>
                      )}
                      {meetPreference && (
                        <div>
                          <span className="text-sm text-muted-foreground">Discovery:</span>
                          <p className="font-semibold text-lg">
                            {MEET_PREFERENCE_OPTIONS.find((m) => m.value === meetPreference)?.label}
                          </p>
                        </div>
                      )}
                      {selectedGoal && (
                        <div>
                          <span className="text-sm text-muted-foreground">Looking for:</span>
                          <p className="font-semibold text-lg">{RELATIONSHIP_GOALS.find(g => g.value === selectedGoal)?.label}</p>
                        </div>
                      )}
                      {selectedValues.length > 0 && (
                        <div>
                          <span className="text-sm text-muted-foreground">Core Values:</span>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {selectedValues.map(v => (
                              <Badge key={v} variant="secondary" className="text-sm">{v}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedLifestyle.length > 0 && (
                        <div>
                          <span className="text-sm text-muted-foreground">Lifestyle:</span>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {selectedLifestyle.slice(0, 5).map(l => (
                              <Badge key={l} variant="outline" className="text-sm">{l}</Badge>
                            ))}
                            {selectedLifestyle.length > 5 && (
                              <Badge variant="outline" className="text-sm">+{selectedLifestyle.length - 5} more</Badge>
                            )}
                          </div>
                        </div>
                      )}
                      {photos.length > 0 && (
                        <div>
                          <span className="text-sm text-muted-foreground">Photos:</span>
                          <p className="font-semibold text-lg">{photos.length} photo{photos.length !== 1 ? 's' : ''} added</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Final Achievement (Fast & Fun) */}
                {journeyStyle === 'fast' && achievements.length > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="bg-primary/10 border border-primary/30 rounded-lg p-4 max-w-md"
                  >
                    <div className="flex items-center gap-2 justify-center mb-2">
                      <Trophy className="w-5 h-5 text-primary" />
                      <span className="font-bold text-primary">Final Score: {points} points</span>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {achievements.map(aid => {
                        const achievement = ACHIEVEMENTS.find(a => a.id === aid);
                        if (!achievement) return null;
                        const AchievementIcon = achievement.icon;
                        return (
                          <Badge key={aid} variant="secondary" className="gap-1">
                            <AchievementIcon className="w-3 h-3" /> {achievement.name}
                          </Badge>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                <div className="mt-8">
                  <Button
                    size="lg"
                    onClick={handleComplete}
                    className="rounded-full px-12 h-14 text-lg font-bold glow-primary"
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? "Saving..." : "Complete Profile →"}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );

  // Helper function to render chapter content
  function renderChapterContent(chapter: any, questionIndex: number, style: JourneyStyle) {
    const question = chapter.questions[questionIndex];
    if (!question) return null;

    const value = form.watch(question.id as keyof BasicInfoData);
    const hasError = question.required && (!value || String(value).trim() === '');

    // Handle different question types
    if (question.type === 'text' || question.type === 'number') {
      const isConversational = style === 'conversational';
      return (
        <motion.div
          key={`question-${questionIndex}`}
          initial={{ opacity: 0, x: isConversational ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: isConversational ? -20 : -20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`mt-4 sm:mt-8 w-full px-4 ${
            isConversational ? 'max-w-2xl' : 'max-w-md mx-auto'
          }`}
        >
          {isConversational && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-3 flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">AI Matchmaker</span>
            </motion.div>
          )}
          <motion.div
            className={`${isConversational ? 'bg-muted/30 border border-primary/20 rounded-2xl p-4 mb-3' : ''}`}
          >
            <motion.h3
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={`font-semibold mb-3 ${isConversational ? 'text-lg text-left' : 'text-xl sm:text-2xl text-center'}`}
            >
              {question.label}
            </motion.h3>
          </motion.div>
          <Input
            type={question.type}
            placeholder={question.placeholder}
            {...form.register(question.id as keyof BasicInfoData)}
            className={`h-12 sm:h-14 text-sm sm:text-base bg-muted/50 border-2 rounded-2xl transition-all ${
              isConversational ? 'text-left' : 'text-center'
            } ${
              hasError
                ? 'border-destructive focus:border-destructive'
                : 'border-primary/20 focus:border-primary/60'
            }`}
            autoFocus
            onKeyPress={(e) => {
              if (e.key === 'Enter' && value && !hasError) {
                if (questionIndex < chapter.questions.length - 1) {
                  setCurrentQuestionIndex(questionIndex + 1);
                  if (style === 'fast') awardPoints(10);
                } else if (isChapterComplete(chapter)) {
                  handleNextChapter();
                }
              }
            }}
            onChange={(e) => {
              form.setValue(question.id as keyof BasicInfoData, e.target.value as any);
              if (style === 'fast' && e.target.value) {
                // Award points on first valid input
                if (!value) awardPoints(10);
              }
            }}
          />
          {hasError && question.required && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-xs text-destructive mt-2 ${isConversational ? 'text-left' : 'text-center'}`}
            >
              This field is required
            </motion.p>
          )}
          {style === 'fast' && value && !hasError && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="mt-2 text-center"
            >
              <Badge variant="secondary" className="gap-1">
                <Check className="w-3 h-3" />
                +10 points
              </Badge>
            </motion.div>
          )}
        </motion.div>
      );
    }

    if (question.type === 'textarea') {
      const textValue = form.watch(question.id as keyof BasicInfoData) as string;
      const hasError = question.required && (!textValue || textValue.trim().length < 10);
      const charCount = textValue?.length || 0;
      const minChars = 10;
      const isConversational = style === 'conversational';
      
      return (
        <motion.div
          key={`question-${questionIndex}`}
          initial={{ opacity: 0, x: isConversational ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: isConversational ? -20 : -20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`mt-4 sm:mt-8 w-full px-4 ${
            isConversational ? 'max-w-2xl' : 'max-w-md mx-auto'
          }`}
        >
          {isConversational && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-3 flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">AI Matchmaker</span>
            </motion.div>
          )}
          <motion.div
            className={`${isConversational ? 'bg-muted/30 border border-primary/20 rounded-2xl p-4 mb-3' : ''}`}
          >
            <motion.h3
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={`font-semibold mb-3 ${isConversational ? 'text-lg text-left' : 'text-xl sm:text-2xl text-center'}`}
            >
              {question.label}
            </motion.h3>
          </motion.div>
          <Textarea
            placeholder={question.placeholder}
            rows={5}
            {...form.register(question.id as keyof BasicInfoData)}
            className={`text-sm sm:text-base bg-muted/50 border-2 rounded-2xl resize-none transition-all ${
              hasError
                ? 'border-destructive focus:border-destructive'
                : 'border-primary/20 focus:border-primary/60'
            }`}
            autoFocus
            maxLength={500}
          />
          <div className="flex items-center justify-between mt-2">
            <div className="flex-1">
              {hasError && question.required && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-destructive"
                >
                  Minimum {minChars} characters required ({charCount}/{minChars})
                </motion.p>
              )}
            </div>
            <span className={`text-xs ${charCount >= minChars ? 'text-primary' : 'text-muted-foreground'}`}>
              {charCount}/500
            </span>
          </div>
          {style === 'fast' && textValue && textValue.length > 20 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="mt-2 text-center"
            >
              <Badge variant="secondary" className="gap-1">
                <Check className="w-3 h-3" />
                +25 points
              </Badge>
            </motion.div>
          )}
        </motion.div>
      );
    }

    if (question.type === 'select') {
      const value = form.watch(question.id as keyof BasicInfoData);
      const isConversational = style === 'conversational';
      return (
        <motion.div
          key={`question-${questionIndex}`}
          initial={{ opacity: 0, x: isConversational ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: isConversational ? -20 : -20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`mt-4 sm:mt-8 w-full px-4 space-y-3 ${
            isConversational ? 'max-w-2xl' : 'max-w-md mx-auto'
          }`}
        >
          {isConversational && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-3 flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">AI Matchmaker</span>
            </motion.div>
          )}
          <motion.div
            className={`${isConversational ? 'bg-muted/30 border border-primary/20 rounded-2xl p-4 mb-3' : ''}`}
          >
            <motion.h3
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={`font-semibold mb-4 ${isConversational ? 'text-lg text-left' : 'text-xl sm:text-2xl text-center'}`}
            >
              {question.label}
            </motion.h3>
          </motion.div>
          {question.options?.map((option: any, optIndex: number) => (
            <motion.button
              key={option.value}
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + optIndex * 0.05 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                form.setValue(question.id as keyof BasicInfoData, option.value as any);
                if (style === 'fast') awardPoints(10);
                
                // Auto-advance with smooth animation - faster for Fast & Fun
                setFieldCompleted(true);
                const delay = style === 'fast' ? 200 : style === 'conversational' ? 600 : 400;
                setTimeout(() => {
                  setFieldCompleted(false);
                  if (questionIndex < chapter.questions.length - 1) {
                    setCurrentQuestionIndex(questionIndex + 1);
                  } else if (isChapterComplete(chapter)) {
                    handleNextChapter();
                  }
                }, delay);
              }}
              className={`w-full p-3 sm:p-4 rounded-xl border-2 transition-all ${
                value === option.value
                  ? 'border-primary bg-primary/10 shadow-lg ring-2 ring-primary/20'
                  : 'border-border bg-muted/30 hover:border-primary/40 hover:bg-muted/50'
              }`}
            >
              <span className="text-sm sm:text-base font-medium">{option.label}</span>
              {value === option.value && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="inline-block ml-2"
                >
                  <Check className="w-4 h-4 text-primary inline" />
                </motion.div>
              )}
            </motion.button>
          ))}
        </motion.div>
      );
    }

    if (question.type === "meet-preference-select") {
      const isConversational = style === "conversational";
      return (
        <motion.div
          key={`question-${questionIndex}-meetpref`}
          initial={{ opacity: 0, x: isConversational ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: isConversational ? -20 : -20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`mt-4 sm:mt-8 w-full px-4 ${isConversational ? "max-w-2xl" : "max-w-md mx-auto"}`}
        >
          {isConversational && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-3 flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">AI Matchmaker</span>
            </motion.div>
          )}
          <motion.div className={isConversational ? "bg-muted/30 border border-primary/20 rounded-2xl p-4 mb-3" : ""}>
            <motion.h3
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={`font-semibold mb-2 ${isConversational ? "text-lg text-left" : "text-xl sm:text-2xl text-center"}`}
            >
              {question.label}
            </motion.h3>
            <p className="text-xs text-muted-foreground text-center sm:text-center mb-4">
              Matchify welcomes every background — this only changes what we highlight first.
            </p>
          </motion.div>
          <div className="space-y-3">
            {MEET_PREFERENCE_OPTIONS.map((pref, i) => (
              <motion.button
                key={pref.value}
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + i * 0.05 }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => {
                  setMeetPreference(pref.value);
                  if (style === "fast") awardPoints(10);
                  setFieldCompleted(true);
                  const delay = style === "fast" ? 200 : style === "conversational" ? 600 : 400;
                  setTimeout(() => {
                    setFieldCompleted(false);
                    if (questionIndex < chapter.questions.length - 1) {
                      setCurrentQuestionIndex(questionIndex + 1);
                    } else if (isChapterComplete(chapter)) {
                      handleNextChapter();
                    }
                  }, delay);
                }}
                className={`relative w-full p-4 rounded-2xl border-2 text-left transition-all ${
                  meetPreference === pref.value
                    ? "border-primary bg-primary/10 shadow-lg ring-2 ring-primary/20"
                    : "border-border bg-muted/30 hover:border-primary/40"
                }`}
              >
                <div className="font-semibold text-sm sm:text-base pr-8">{pref.label}</div>
                <div className="text-xs text-muted-foreground mt-1">{pref.description}</div>
                {meetPreference === pref.value && (
                  <Check className="w-5 h-5 text-primary absolute top-3 right-3" />
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>
      );
    }

    if (question.type === 'goal-select') {
      const isConversational = style === 'conversational';
      return (
        <motion.div
          key={`question-${questionIndex}`}
          initial={{ opacity: 0, x: isConversational ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: isConversational ? -20 : -20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`mt-4 sm:mt-8 w-full px-4 ${
            isConversational ? 'max-w-2xl' : 'max-w-md mx-auto'
          }`}
        >
          {isConversational && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-3 flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">AI Matchmaker</span>
            </motion.div>
          )}
          <motion.div
            className={`${isConversational ? 'bg-muted/30 border border-primary/20 rounded-2xl p-4 mb-3' : ''}`}
          >
            <motion.h3
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={`font-semibold mb-4 ${isConversational ? 'text-lg text-left' : 'text-xl sm:text-2xl text-center'}`}
            >
              {question.label}
            </motion.h3>
          </motion.div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {RELATIONSHIP_GOALS.map((goal, goalIndex) => {
              const GoalIcon = goal.icon;
              return (
                <motion.button
                  key={goal.value}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + goalIndex * 0.1 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSelectedGoal(goal.value);
                    if (style === 'fast') awardPoints(15);
                    
                    // Auto-advance with smooth animation - faster for Fast & Fun
                    setFieldCompleted(true);
                    const delay = style === 'fast' ? 200 : style === 'conversational' ? 600 : 400;
                    setTimeout(() => {
                      setFieldCompleted(false);
                      if (questionIndex < chapter.questions.length - 1) {
                        setCurrentQuestionIndex(questionIndex + 1);
                      } else if (isChapterComplete(chapter)) {
                        handleNextChapter();
                      }
                    }, delay);
                  }}
                  className={`p-4 sm:p-6 rounded-2xl border-2 transition-all relative ${
                    selectedGoal === goal.value
                      ? 'border-primary bg-primary/10 shadow-lg ring-2 ring-primary/20'
                      : 'border-border bg-muted/30 hover:border-primary/40 hover:bg-muted/50'
                  }`}
                >
                  <GoalIcon className="w-8 h-8 sm:w-10 sm:h-10 mb-2 mx-auto text-primary" />
                  <div className="font-semibold text-sm sm:text-base">{goal.label}</div>
                  {selectedGoal === goal.value && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="absolute top-2 right-2"
                    >
                      <Check className="w-5 h-5 text-primary" />
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      );
    }

    if (question.type === 'multi-select') {
      const isValues = question.id === 'values';
      const isLifestyle = question.id === 'lifestyle';
      const isInterests = question.id === 'interests';
      const items = isValues ? VALUES : isLifestyle ? LIFESTYLE : INTERESTS;
      const selected = isValues ? selectedValues : isLifestyle ? selectedLifestyle : selectedInterests;
      const setter = isValues ? setSelectedValues : isLifestyle ? setSelectedLifestyle : setSelectedInterests;
      const hasError = question.required && question.id === 'values' && selected.length === 0;
      const isConversational = style === 'conversational';

      return (
        <motion.div
          key={`question-${questionIndex}`}
          initial={{ opacity: 0, x: isConversational ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: isConversational ? -20 : -20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`mt-4 sm:mt-8 w-full px-4 ${
            isConversational ? 'max-w-2xl' : 'max-w-2xl mx-auto'
          }`}
        >
          {isConversational && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-3 flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">AI Matchmaker</span>
            </motion.div>
          )}
          <motion.div
            className={`${isConversational ? 'bg-muted/30 border border-primary/20 rounded-2xl p-4 mb-3' : ''}`}
          >
            <motion.h3
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={`font-semibold mb-2 ${isConversational ? 'text-lg text-left' : 'text-xl sm:text-2xl text-center'}`}
            >
              {question.label}
            </motion.h3>
            <p className={`text-xs sm:text-sm text-muted-foreground mb-4 ${isConversational ? 'text-left' : 'text-center'}`}>
              {question.id === 'values' && "Select up to 5 core values"}
              {question.id === 'lifestyle' && "Select as many as apply"}
              {question.id === 'interests' && "Select your interests"}
              {question.max && ` (${selected.length}/${question.max} selected)`}
            </p>
          </motion.div>
          {hasError && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-xs text-destructive mb-2 ${isConversational ? 'text-left' : 'text-center'}`}
            >
              Please select at least one option
            </motion.p>
          )}
          <div className={`flex flex-wrap gap-2 sm:gap-3 ${isConversational ? 'justify-start' : 'justify-center'}`}>
            {items.map((item, itemIndex) => (
              <motion.button
                key={item}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 + itemIndex * 0.02 }}
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  toggleSelection(item, selected, setter, question.max);
                  if (style === 'fast' && !selected.includes(item)) {
                    awardPoints(5);
                    if (question.id === 'values' && selected.length + 1 >= 3) {
                      awardPoints(20, 'value-master');
                    }
                  }
                }}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border-2 transition-all text-xs sm:text-sm font-medium ${
                  selected.includes(item)
                    ? 'border-primary bg-primary text-primary-foreground shadow-md'
                    : 'border-border bg-muted/30 hover:border-primary/40 hover:bg-muted/50'
                }`}
              >
                {selected.includes(item) && (
                  <Check className="w-3 h-3 inline mr-1" />
                )}
                {item}
              </motion.button>
            ))}
          </div>
          {selected.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-4 sm:mt-6 text-center"
            >
              <Button
                onClick={() => {
                  if (questionIndex < chapter.questions.length - 1) {
                    setCurrentQuestionIndex(questionIndex + 1);
                  } else if (isChapterComplete(chapter)) {
                    handleNextChapter();
                  }
                }}
                className="rounded-full"
                size="sm"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          )}
        </motion.div>
      );
    }

    if (question.type === 'birthday') {
      const age = form.watch('age');
      const currentYear = new Date().getFullYear();
      const calculatedYear = age ? currentYear - Number(age) : null;
      
      return (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mt-8 w-full max-w-md space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm mb-2 block text-center">Day</Label>
              <select
                {...form.register('birthDay' as any)}
                className="w-full h-11 sm:h-12 text-base sm:text-lg text-center bg-muted/50 border-2 border-primary/20 focus:border-primary/60 rounded-xl"
              >
                <option value="">Day</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-sm mb-2 block text-center">Month</Label>
              <select
                {...form.register('birthMonth' as any)}
                className="w-full h-11 sm:h-12 text-base sm:text-lg text-center bg-muted/50 border-2 border-primary/20 focus:border-primary/60 rounded-xl"
              >
                <option value="">Month</option>
                {['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'].map((month, index) => (
                  <option key={month} value={index + 1}>{month}</option>
                ))}
              </select>
            </div>
          </div>
          {age && calculatedYear && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-muted-foreground text-center"
            >
              Year calculated: <span className="font-semibold text-primary">{calculatedYear}</span>
            </motion.p>
          )}
        </motion.div>
      );
    }

    return null;
  }

  function isChapterComplete(chapter: any): boolean {
    if (!chapter) return false;
    
    return chapter.questions.every((q: any) => {
      if (!q.required) return true;

      if (q.type === "meet-preference-select") return meetPreference !== "";
      if (q.type === 'goal-select') return selectedGoal !== "";
      if (q.type === 'multi-select') {
        if (q.id === 'values') return selectedValues.length > 0;
        if (q.id === 'lifestyle') return true; // Optional
        if (q.id === 'interests') return true; // Optional
      }
      
      if (q.type === 'textarea') {
        const value = form.watch(q.id as keyof BasicInfoData) as string;
        return value && value.trim().length >= 10;
      }
      
      const value = form.watch(q.id as keyof BasicInfoData);
      return value && String(value).trim() !== '';
    });
  }

  function toggleSelection(item: string, array: string[], setter: (arr: string[]) => void, max?: number) {
    if (array.includes(item)) {
      setter(array.filter(i => i !== item));
    } else {
      if (max && array.length >= max) {
        toast({
          title: "Limit reached",
          description: `You can select up to ${max} items`,
          variant: "destructive",
        });
        return;
      }
      setter([...array, item]);
    }
  }
}

