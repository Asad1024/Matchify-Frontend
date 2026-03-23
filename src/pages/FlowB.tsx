import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Grid3x3, ArrowRight, ArrowLeft, Check, X, ChevronRight, Sparkles, Info, Loader2, ArrowLeft as BackArrow, Heart } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useCurrentUser } from "@/contexts/UserContext";
import { useQuery } from "@tanstack/react-query";
import { saveAttractionBlueprint, getAIMatches, type AIMatch } from "@/services/aiMatchmaker.service";
import type { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { recordAiMatchClaimed } from "@/hooks/useAiMatchCooldown";
import { MatchDetails } from "@/components/matches/MatchDetails";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { getFlowBOptionImage } from "@/lib/attractionFlowImages";
import { getFlowBOptions, getFlowBSectionOptions, isFlowBImageQuestion, isFlowBSectionQuestion } from "@/lib/flowBImages";
import { getActorImage } from "@/lib/actorImages";
import { MATCHIFY_LOGO_URL } from "@/lib/matchifyBranding";

/** AI Matchmaker / Flow B screen theme (Matchify pink, not legacy purple). */
const FLOW_BG =
  "min-h-screen h-[100dvh] bg-gradient-to-br from-zinc-950 via-rose-950/85 to-zinc-950";

/** AI Matchmaker flow: exactly 30 steps per gender (see MALE_/FEMALE_FLOW_ORDER). */
const FLOW_B_STEP_COUNT = 30;

// Build option with actor-style image by index
const actorOpt = (i: number, id: string, label: string, description = "") =>
  ({ id, image: getActorImage(i), label, description });

// Body type options - gender-specific
const FEMALE_BODY_TYPES = [
  { id: "hourglass", image: "/body-types/female/hourglass.png", label: "Hourglass", description: "Balanced bust and hips" },
  { id: "round_apple", image: "/body-types/female/round-apple.png", label: "Round/Apple", description: "Fuller midsection" },
  { id: "pear", image: "/body-types/female/pear.png", label: "Pear", description: "Narrower shoulders, wider hips" },
  { id: "inverted_triangle", image: "/body-types/female/inverted-triangle.png", label: "Inverted Triangle", description: "Broad shoulders, narrow hips" },
  { id: "lean_column", image: "/body-types/female/lean-column.png", label: "Lean Column", description: "Athletic, straight build" },
  { id: "rectangle", image: "/body-types/female/rectangle.png", label: "Rectangle", description: "Straight silhouette" },
  { id: "petite", image: "/body-types/female/petite.png", label: "Petite", description: "Smaller, delicate frame" },
  { id: "plus_size", image: "/body-types/female/plus-size.png", label: "Plus Size", description: "Fuller figure" },
];

const MALE_BODY_TYPES = [
  { id: "rectangle", image: "/body-types/male/rectangle.png", label: "Rectangle", description: "Uniform width" },
  { id: "inverted_triangle", image: "/body-types/male/inverted-triangle.png", label: "Inverted Triangle", description: "Broad shoulders, narrow waist" },
  { id: "trapezoid", image: "/body-types/male/trapezoid.png", label: "Trapezoid", description: "Athletic V-shape" },
  { id: "triangle", image: "/body-types/male/triangle.png", label: "Triangle", description: "Narrower shoulders, wider hips" },
  { id: "oval", image: "/body-types/male/oval.png", label: "Oval", description: "Rounded midsection" },
];

// Face shape options - gender-specific
const MALE_FACE_SHAPES = [
  { id: "oval", image: "/face-shapes/male/oval.png", label: "Oval", description: "Balanced proportions" },
  { id: "square", image: "/face-shapes/male/square.png", label: "Square", description: "Strong angular jawline" },
  { id: "round", image: "/face-shapes/male/round.png", label: "Round", description: "Soft curves" },
  { id: "oblong", image: "/face-shapes/male/oblong.png", label: "Oblong", description: "Longer face" },
  { id: "diamond", image: "/face-shapes/male/diamond.png", label: "Diamond", description: "Wider cheekbones" },
  { id: "heart", image: "/face-shapes/male/heart.png", label: "Heart", description: "Wider forehead, pointed chin" },
];

const FEMALE_FACE_SHAPES = [
  { id: "oval", image: "/face-shapes/female/oval.png", label: "Oval", description: "Balanced proportions" },
  { id: "square", image: "/face-shapes/female/square.png", label: "Square", description: "Strong angular jawline" },
  { id: "round", image: "/face-shapes/female/round.png", label: "Round", description: "Soft curves" },
  { id: "oblong", image: "/face-shapes/female/oblong.png", label: "Oblong", description: "Longer face" },
  { id: "diamond", image: "/face-shapes/female/diamond.png", label: "Diamond", description: "Wider cheekbones" },
  { id: "heart", image: "/face-shapes/female/heart.png", label: "Heart", description: "Wider forehead, pointed chin" },
];

// Eye shape options - universal (same for all genders)
const EYE_SHAPES = [
  { id: "round", image: "/eye-shapes/round.png", label: "Round", description: "Visible whites above and below" },
  { id: "almond", image: "/eye-shapes/almond.png", label: "Almond", description: "Classic almond shape" },
  { id: "monolid", image: "/eye-shapes/monolid.png", label: "Monolid", description: "No visible crease" },
  { id: "hooded", image: "/eye-shapes/hooded.png", label: "Hooded", description: "Brow bone folds over lid" },
  { id: "upturned", image: "/eye-shapes/upturned.png", label: "Upturned", description: "Outer corners lift up" },
  { id: "downturned", image: "/eye-shapes/downturned.png", label: "Downturned", description: "Outer corners droop down" },
];

// Lip shape options - universal (same for all genders)
const LIP_SHAPES = [
  { id: "heart_shaped", image: "/lip-shapes/heart-shaped.png", label: "Heart-Shaped", description: "Distinct cupid's bow" },
  { id: "full", image: "/lip-shapes/full.png", label: "Full", description: "Equally plump upper and lower" },
  { id: "thin", image: "/lip-shapes/thin.png", label: "Thin", description: "Slender and less voluminous" },
  { id: "wide", image: "/lip-shapes/wide.png", label: "Wide", description: "Extends horizontally" },
  { id: "round", image: "/lip-shapes/round.png", label: "Round", description: "Circular, plump appearance" },
  { id: "top_heavy", image: "/lip-shapes/top-heavy.png", label: "Top-Heavy", description: "Fuller upper lip" },
  { id: "bottom_heavy", image: "/lip-shapes/bottom-heavy.png", label: "Bottom-Heavy", description: "Fuller lower lip" },
  { id: "balanced", image: "/lip-shapes/balanced.png", label: "Balanced", description: "Evenly proportioned" },
];

// Base questions structure - will be customized by gender (MESHK-style)
const BASE_QUESTIONS = [
  // SECTION 1: PERSONALITY & ATTRACTION (MESHK-style)
  {
    id: "personality_turn_on",
    title: "", // Will be set dynamically based on gender
    subtitle: "Pick 2-4",
    description: "",
    type: "image",
    max: 4,
    options: [], // Will be set dynamically based on gender
  },
  {
    id: "physical_attraction",
    title: "", // Will be set dynamically based on gender
    subtitle: "Pick 1-3",
    description: "",
    type: "image",
    max: 3,
    options: [], // Will be set dynamically based on gender
  },
  {
    id: "face_shape_preference",
    title: "", // Will be set dynamically based on gender
    subtitle: "Pick 1-3",
    description: "",
    type: "image",
    max: 3,
    options: [], // Will be set dynamically based on gender
  },
  {
    id: "eye_shape_preference",
    title: "What eye shapes do you find attractive?",
    subtitle: "Pick 2-4",
    description: "",
    type: "image",
    max: 4,
    options: EYE_SHAPES,
  },
  {
    id: "lip_shape_preference",
    title: "What lip shapes attract you?",
    subtitle: "Pick 1-3",
    description: "",
    type: "image",
    max: 3,
    options: LIP_SHAPES,
  },
  {
    id: "energy_vibe",
    title: "", // Will be set dynamically based on gender
    subtitle: "Pick 2-4",
    description: "",
    type: "image",
    max: 4,
    options: [
      actorOpt(0, "calm", "Calm and peaceful"),
      actorOpt(1, "confident", "Confident and strong"),
      actorOpt(2, "playful", "Playful and fun"),
      actorOpt(3, "mysterious", "Mysterious and intriguing"),
      actorOpt(4, "intellectual", "Intellectual and thoughtful"),
      actorOpt(5, "adventurous", "Adventurous and bold"),
    ],
  },
  
  // SECTION 2: VALUES & CHARACTER
  {
    id: "core_values",
    title: "", // Will be set dynamically based on gender
    subtitle: "Pick 3-5",
    description: "",
    type: "image",
    max: 5,
    options: [
      actorOpt(0, "honesty", "Honesty & Transparency", "Truth in all interactions"),
      actorOpt(1, "family", "Family First", "Family is top priority"),
      actorOpt(2, "growth", "Personal Growth", "Continuous learning"),
      actorOpt(3, "adventure", "Adventure & Freedom", "Exploring new experiences"),
      actorOpt(4, "stability", "Stability & Security", "Consistency and safety"),
      actorOpt(5, "creativity", "Creativity & Expression", "Artistic expression"),
      actorOpt(6, "kindness", "Kindness & Empathy", "Compassion for others"),
      actorOpt(7, "ambition", "Ambition & Success", "Driven to achieve"),
    ],
  },
  {
    id: "communication",
    title: "How do you prefer to connect?",
    subtitle: "Pick 2-3",
    description: "",
    type: "image",
    max: 3,
    options: [
      actorOpt(0, "texter", "Constant texting"),
      actorOpt(1, "caller", "Voice calls"),
      actorOpt(2, "inperson", "Face-to-face time"),
      actorOpt(3, "memes", "Memes & humor"),
      actorOpt(4, "deep", "Deep conversations"),
      actorOpt(5, "quick", "Quick check-ins"),
    ],
  },
  {
    id: "conflict_style",
    title: "How do you handle disagreements?",
    subtitle: "Pick 1-2",
    description: "",
    type: "image",
    max: 2,
    options: [
      actorOpt(0, "discuss", "Talk it through immediately"),
      actorOpt(1, "space", "Need space to process"),
      actorOpt(2, "compromise", "Find middle ground"),
      actorOpt(3, "avoid", "Let small things pass"),
    ],
  },
  
  // SECTION 3: LIFESTYLE
  {
    id: "lifestyle",
    title: "How do you want to spend time together?",
    subtitle: "Pick 2-4",
    description: "",
    type: "image",
    max: 4,
    options: [
      actorOpt(0, "travel", "Traveling together"),
      actorOpt(1, "fitness", "Staying active"),
      actorOpt(2, "cozy", "Cozy nights in"),
      actorOpt(3, "social", "Social events"),
      actorOpt(4, "nature", "Outdoor adventures"),
      actorOpt(5, "luxury", "Luxury experiences"),
      actorOpt(6, "creative", "Arts & culture"),
      actorOpt(7, "work", "Career-focused"),
    ],
  },
  {
    id: "hobbies",
    title: "What interests excite you?",
    subtitle: "Pick 3-4",
    description: "",
    type: "image",
    max: 4,
    options: [
      actorOpt(0, "reading", "Reading"),
      actorOpt(1, "gaming", "Gaming"),
      actorOpt(2, "cooking", "Cooking"),
      actorOpt(3, "art", "Art"),
      actorOpt(4, "music", "Music"),
      actorOpt(5, "sports", "Sports"),
      actorOpt(6, "movies", "Movies & TV"),
      actorOpt(7, "outdoors", "Outdoors"),
    ],
  },
  {
    id: "sociallife",
    title: "What's your ideal weekend?",
    subtitle: "Pick 2-3",
    description: "",
    type: "image",
    max: 3,
    options: [
      actorOpt(0, "party", "Night out"),
      actorOpt(1, "dinner", "Dinner dates"),
      actorOpt(2, "netflix", "Netflix & chill"),
      actorOpt(3, "adventure", "Day trips"),
      actorOpt(4, "brunch", "Brunch"),
      actorOpt(5, "quiet", "Quiet time"),
    ],
  },
  {
    id: "food",
    title: "What's your food vibe?",
    subtitle: "Pick 2-3",
    description: "",
    type: "image",
    max: 3,
    options: [
      actorOpt(0, "foodie", "Foodie"),
      actorOpt(1, "healthy", "Health-focused"),
      actorOpt(2, "adventurous", "Try anything"),
      actorOpt(3, "veg", "Veg/Vegan"),
      actorOpt(4, "home", "Home cooking"),
      actorOpt(5, "dining", "Fine dining"),
    ],
  },
  
  // SECTION 4: FUTURE & GOALS
  {
    id: "career",
    title: "What's your career approach?",
    subtitle: "Pick 2-3",
    description: "",
    type: "image",
    max: 3,
    options: [
      actorOpt(0, "ambitious", "Highly ambitious"),
      actorOpt(1, "stable", "Stable and secure"),
      actorOpt(2, "creative", "Creative career"),
      actorOpt(3, "entrepreneur", "Building my own"),
      actorOpt(4, "flexible", "Work-life balance"),
      actorOpt(5, "driven", "Driven to succeed"),
    ],
  },
  {
    id: "future",
    title: "What matters most for your future?",
    subtitle: "Pick 2-3",
    description: "",
    type: "image",
    max: 3,
    options: [
      actorOpt(0, "marriage", "Marriage"),
      actorOpt(1, "kids", "Kids"),
      actorOpt(2, "travel", "Travel the world"),
      actorOpt(3, "career", "Career growth"),
      actorOpt(4, "peace", "Simple and content"),
      actorOpt(5, "wealth", "Financial success"),
    ],
  },
  {
    id: "timeline",
    title: "When are you looking for something serious?",
    subtitle: "Pick 1",
    description: "",
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
    title: "What about kids?",
    subtitle: "Pick 1",
    description: "",
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
    title: "What are absolute dealbreakers?",
    subtitle: "Pick up to 3",
    description: "",
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
    title: "What are your must-haves?",
    subtitle: "Pick 3",
    description: "",
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
  // SECTION 6: Readiness & relationship goals
  {
    id: "sd_commitment",
    title: "What are you looking for right now?",
    subtitle: "Pick 1",
    description: "",
    type: "text",
    max: 1,
    options: [
      { id: "hookup", label: "Casual connections" },
      { id: "casual", label: "Casual dating" },
      { id: "serious", label: "Serious relationship" },
      { id: "marriage", label: "Marriage-minded" },
    ],
  },
  {
    id: "sd_love_language",
    title: "How do you most feel loved?",
    subtitle: "Pick 1",
    description: "",
    type: "text",
    max: 1,
    options: [
      { id: "words", label: "Words of Affirmation" },
      { id: "acts", label: "Acts of Service" },
      { id: "gifts", label: "Receiving Gifts" },
      { id: "time", label: "Quality Time" },
      { id: "touch", label: "Physical Touch" },
    ],
  },
  {
    id: "sd_priorities",
    title: "Choose your top relationship priorities",
    subtitle: "Pick 3",
    description: "",
    type: "text",
    max: 3,
    options: [
      { id: "faith", label: "Faith & Spirituality" },
      { id: "family", label: "Family" },
      { id: "career", label: "Career & Ambition" },
      { id: "travel", label: "Travel & Adventure" },
      { id: "health", label: "Health & Fitness" },
      { id: "growth", label: "Personal Growth" },
      { id: "loyalty", label: "Loyalty & Trust" },
      { id: "humor", label: "Fun & Humour" },
    ],
  },
  {
    id: "sd_ready_healed",
    title: "I have healed from past relationship wounds",
    subtitle: "Pick 1",
    description: "Rate from 1 (not yet) to 5 (absolutely)",
    type: "text",
    max: 1,
    options: [{ id: "1", label: "1" }, { id: "2", label: "2" }, { id: "3", label: "3" }, { id: "4", label: "4" }, { id: "5", label: "5" }],
  },
  {
    id: "sd_ready_values",
    title: "I know my own values and deal-breakers",
    subtitle: "Pick 1",
    description: "Rate from 1 (not yet) to 5 (absolutely)",
    type: "text",
    max: 1,
    options: [{ id: "1", label: "1" }, { id: "2", label: "2" }, { id: "3", label: "3" }, { id: "4", label: "4" }, { id: "5", label: "5" }],
  },
  {
    id: "sd_ready_communication",
    title: "I communicate openly and honestly",
    subtitle: "Pick 1",
    description: "Rate from 1 (not yet) to 5 (absolutely)",
    type: "text",
    max: 1,
    options: [{ id: "1", label: "1" }, { id: "2", label: "2" }, { id: "3", label: "3" }, { id: "4", label: "4" }, { id: "5", label: "5" }],
  },
  {
    id: "sd_ready_available",
    title: "I'm emotionally available for a new relationship",
    subtitle: "Pick 1",
    description: "Rate from 1 (not yet) to 5 (absolutely)",
    type: "text",
    max: 1,
    options: [{ id: "1", label: "1" }, { id: "2", label: "2" }, { id: "3", label: "3" }, { id: "4", label: "4" }, { id: "5", label: "5" }],
  },
  {
    id: "sd_ready_respect",
    title: "I respect different perspectives and boundaries",
    subtitle: "Pick 1",
    description: "Rate from 1 (not yet) to 5 (absolutely)",
    type: "text",
    max: 1,
    options: [{ id: "1", label: "1" }, { id: "2", label: "2" }, { id: "3", label: "3" }, { id: "4", label: "4" }, { id: "5", label: "5" }],
  },
  {
    id: "sd_ready_accountability",
    title: "I take accountability for my actions",
    subtitle: "Pick 1",
    description: "Rate from 1 (not yet) to 5 (absolutely)",
    type: "text",
    max: 1,
    options: [{ id: "1", label: "1" }, { id: "2", label: "2" }, { id: "3", label: "3" }, { id: "4", label: "4" }, { id: "5", label: "5" }],
  },
  {
    id: "sd_relationship_goal",
    title: "What relationship dynamic feels right for you?",
    subtitle: "Pick 1",
    description: "",
    type: "text",
    max: 1,
    options: [
      { id: "slow", label: "Slow and intentional" },
      { id: "balanced", label: "Balanced pace" },
      { id: "fast", label: "Move quickly if it feels right" },
    ],
  },
  {
    id: "sd_partner_pace",
    title: "How should your match approach commitment?",
    subtitle: "Pick 1",
    description: "",
    type: "text",
    max: 1,
    options: [
      { id: "careful", label: "Careful and steady" },
      { id: "confident", label: "Confident and clear" },
      { id: "flexible", label: "Flexible and adaptive" },
    ],
  },
];

// Male flow: Visual → Energy → Emotional → Stability
const MALE_FLOW_ORDER: string[] = [
  "physical_attraction",
  "face_shape_preference",
  "eye_shape_preference",
  "lip_shape_preference",
  "energy_vibe",
  "personality_turn_on",
  "communication",
  "lifestyle",
  "sociallife",
  "hobbies",
  "core_values",
  "conflict_style",
  "future",
  "kidsQ",
  "timeline",
  "food",
  "career",
  "sd_commitment",
  "sd_love_language",
  "sd_priorities",
  "sd_ready_healed",
  "sd_ready_values",
  "sd_ready_communication",
  "sd_ready_available",
  "sd_ready_respect",
  "sd_ready_accountability",
  "sd_relationship_goal",
  "sd_partner_pace",
  "dealbreakers",
  "mustHave",
];

// Female flow: Emotional safety → Character → Lifestyle → Physical
const FEMALE_FLOW_ORDER: string[] = [
  "personality_turn_on",
  "energy_vibe",
  "core_values",
  "communication",
  "career",
  "future",
  "conflict_style",
  "timeline",
  "kidsQ",
  "lifestyle",
  "hobbies",
  "sociallife",
  "food",
  "sd_commitment",
  "sd_love_language",
  "sd_priorities",
  "sd_ready_healed",
  "sd_ready_values",
  "sd_ready_communication",
  "sd_ready_available",
  "sd_ready_respect",
  "sd_ready_accountability",
  "sd_relationship_goal",
  "sd_partner_pace",
  "physical_attraction",
  "face_shape_preference",
  "eye_shape_preference",
  "lip_shape_preference",
  "dealbreakers",
  "mustHave",
];

// Gender-specific titles (override after options are set)
const FLOW_TITLES: Record<string, { male?: string; female?: string }> = {
  physical_attraction: { male: "What physical traits attract you?", female: "What physical traits attract you?" },
  face_shape_preference: { male: "What facial features catch your attention?", female: "What facial features do you like?" },
  energy_vibe: { male: "What energy do you want her to bring?", female: "What energy resonates with you?" },
  personality_turn_on: { male: "What personality traits turn you on?", female: "What kind of character attracts you?" },
  communication: { male: "What communication style works best for you?", female: "How do you prefer to connect?" },
  lifestyle: { male: "How do you want to spend time together?", female: "How do you want to spend time together?" },
  sociallife: { male: "What kind of social life do you prefer?", female: "What's your ideal weekend?" },
  hobbies: { male: "What hobbies excite you?", female: "What interests excite you?" },
  core_values: { male: "What values matter most to you?", female: "What values are non-negotiable?" },
  conflict_style: { male: "How do you handle disagreements?", female: "How does he handle conflict?" },
  future: { male: "What's your future vision?", female: "What future goals matter most?" },
  career: { female: "What's his career mindset?" },
  timeline: { male: "When are you looking for something serious?", female: "When is he looking for something serious?" },
};

// Helper function to get gender-specific image options
const getGenderSpecificOptions = (options: any[], userGender?: string | null) => {
  if (userGender === 'male') {
    // Male users see female images - keep as is
    return options;
  } else if (userGender === 'female') {
    // Female users see male images - adjust labels for character focus
    return options.map(opt => {
      // Map style options to character-focused labels for women
      const labelMap: Record<string, string> = {
        'classy': 'Confident',
        'sporty': 'Athletic',
        'creative': 'Creative',
        'minimal': 'Simple',
        'glam': 'Polished',
        'casual': 'Relaxed',
        'bohemian': 'Free-Spirited',
        'edgy': 'Bold',
      };
      
      return {
        ...opt,
        label: labelMap[opt.id] || opt.label,
        // Use male images (same URLs but different context)
        image: opt.image, // Keep same for now, but could swap to male-specific images
      };
    });
  }
  return options;
};

// Helper function to get gender-specific questions (ordered by flow: Male = Visual→Energy→Stability, Female = Emotional→Stability→Lifestyle→Physical)
const getQuestions = (userGender?: "male" | "female" | null) => {
  const questions = JSON.parse(JSON.stringify(BASE_QUESTIONS)); // Deep clone

  questions.forEach((q: any) => {
    if (isFlowBSectionQuestion(q.id)) {
      q.options = getFlowBSectionOptions(q.id, userGender ?? undefined);
      return;
    }
    if (isFlowBImageQuestion(q.id)) {
      q.options = getFlowBOptions(q.id, userGender ?? undefined);
      if (q.id === 'personality_turn_on') {
        q.title = userGender === 'male' ? "What personality traits turn you on?" : "What kind of character attracts you?";
      } else if (q.id === 'physical_attraction') {
        q.title = "What physical traits attract you?";
      } else if (q.id === 'face_shape_preference') {
        q.title = userGender === 'male' ? "What facial features catch your attention?" : "What facial features do you like?";
      } else if (q.id === 'energy_vibe') {
        q.title = userGender === 'male' ? "What energy do you want her to bring?" : "What energy resonates with you?";
      }
      return;
    }

    if (q.id === 'core_values') {
      q.title = userGender === 'male' ? "What values matter most to you?" : "What values are non-negotiable?";
    }
  });

  const byId: Record<string, any> = {};
  questions.forEach((q: any) => { byId[q.id] = q; });

  const order = userGender === 'female' ? FEMALE_FLOW_ORDER : MALE_FLOW_ORDER;
  const ordered = order.map((id) => {
    const q = byId[id];
    if (!q) return null;
    const titles = FLOW_TITLES[id];
    if (titles && userGender === 'male' && titles.male) q.title = titles.male;
    if (titles && userGender === 'female' && titles.female) q.title = titles.female;
    return q;
  }).filter(Boolean) as any[];

  const trimmed = ordered.slice(0, FLOW_B_STEP_COUNT);

  const staticImagePrefixes = ["/body-types/", "/face-shapes/", "/eye-shapes/", "/lip-shapes/", "/flowB/"];
  trimmed.forEach((q: any) => {
    if (q.type !== "image" || !Array.isArray(q.options) || !q.options.length) return;
    const firstImg = String(q.options[0]?.image || "");
    if (staticImagePrefixes.some((p) => firstImg.startsWith(p))) return;
    q.options = q.options.map((opt: any, i: number) => ({
      ...opt,
      image: getFlowBOptionImage(i, userGender ?? undefined),
    }));
  });

  return trimmed;
};

export default function FlowB() {
  const [, setLocation] = useLocation();
  const { userId } = useCurrentUser();
  const { toast } = useToast();
  const [currentQ, setCurrentQ] = useState(-1);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  /** Start 48h AI pacing when user sees their single curated match (once per completion). */
  const curatedCooldownRecordedRef = useRef(false);

  // Get user gender for gender-specific matching
  const { data: currentUser } = useQuery<User>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });

  const rawGenderB = currentUser?.gender;
  const userGender: "male" | "female" | null | undefined =
    rawGenderB === "male" || rawGenderB === "female" ? rawGenderB : null;
  const matchmakerLocked = !!(currentUser as any)?.matchmakerLocked;
  const hasBlueprint = !!(currentUser as any)?.attractionBlueprint;
  
  // Get gender-specific questions
  const QUESTIONS = getQuestions(userGender);

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
    if (matchmakerLocked && hasBlueprint) {
      return (
        <div className={`${FLOW_BG} flex flex-col items-center justify-center px-6 text-center`}>
          <img src={MATCHIFY_LOGO_URL} alt="" className="h-32 w-auto object-contain mb-5" />
          <h2 className="text-2xl font-bold text-white mb-2">AI Matchmaker completed</h2>
          <p className="text-sm text-white/75 max-w-sm mb-6">
            Your 30-question profile is locked and now powers future matching and Luna coaching.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" className="rounded-full px-8" onClick={() => setLocation('/ai-matchmaker')}>
              Back to AI Matchmaker
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full px-8 border-white/40 text-white bg-white/10 hover:bg-white/20"
              onClick={() => setLocation('/directory')}
            >
              Open People
            </Button>
          </div>
        </div>
      );
    }
    return (
      <div className={`${FLOW_BG} flex flex-col overflow-hidden safe-top safe-bottom`}>
        {/* Header with back button */}
        <div className="px-4 pt-3 pb-2 flex items-center gap-3">
          <button
            onClick={() => setLocation('/ai-matchmaker')}
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <BackArrow className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center"
          >
            <img src={MATCHIFY_LOGO_URL} alt="" className="h-36 sm:h-40 w-auto object-contain mb-4" />
            <div className="w-32 h-1.5 bg-primary/40 rounded-full mx-auto mb-8">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="h-full bg-primary rounded-full"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold text-white mb-2">AI Matchmaker</h2>
            <p className="text-white/80 text-sm mb-1">
              {QUESTIONS.length} questions · order adapts to your profile gender
            </p>
            <p className="text-white/60 text-xs">
              Attraction, lifestyle, values, and readiness. One curated match when you finish — then a
              fresh pick every 48 hours.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-left space-y-2 mb-8 p-4 bg-white/10 backdrop-blur-md rounded-xl text-xs w-full max-w-[280px] border border-white/20"
          >
            <div className="flex items-center gap-2 text-white">
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[11px] text-white font-bold">1</div>
              <span className="font-medium">{userGender === 'male' ? 'Style & Attraction' : 'Character & Values'}</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[11px] text-white font-bold">2</div>
              <span className="font-medium">Core Values (Research-backed)</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[11px] text-white font-bold">3</div>
              <span className="font-medium">Lifestyle & Habits</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[11px] text-white font-bold">4</div>
              <span className="font-medium">Future Goals</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[11px] text-white font-bold">5</div>
              <span className="font-medium">Dealbreakers & Must-Haves</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[11px] text-white font-bold">6</div>
              <span className="font-medium">Relationship readiness & goals</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <Button 
              size="lg"
              className="rounded-full px-8 py-6 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-base shadow-lg shadow-primary/25"
              onClick={() => {
                curatedCooldownRecordedRef.current = false;
                setCurrentQ(0);
              }}
              data-testid="button-start-flow-b"
            >
              Start {QUESTIONS.length} questions (~12 min)
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  if (currentQ >= QUESTIONS.length) {
    const [isSaving, setIsSaving] = useState(false);
    const [matches, setMatches] = useState<AIMatch[]>([]);
    const [isLoadingMatches, setIsLoadingMatches] = useState(true);
    const [selectedMatch, setSelectedMatch] = useState<AIMatch | null>(null);

    // Save preferences and fetch matches when results screen loads
    useEffect(() => {
      const saveAndFetch = async () => {
        if (!userId) return;
        
        setIsSaving(true);
        try {
          // Map Flow B answers to blueprint format
          const blueprint = {
            flowType: 'flow-b' as const,
            stylePreferences: answers.personality_turn_on || [],
            bodyPreferences: answers.physical_attraction || [],
            faceShapePreferences: answers.face_shape_preference || [],
            eyeShapePreferences: answers.eye_shape_preference || [],
            lipShapePreferences: answers.lip_shape_preference || [],
            energyPreferences: answers.energy_vibe || [],
            coreValues: answers.core_values || [],
            communicationStyle: answers.communication || [],
            conflictStyle: answers.conflict_style || [],
            lifestylePreferences: answers.lifestyle || [],
            hobbies: answers.hobbies || [],
            socialLife: answers.sociallife || [],
            foodPreferences: answers.food || [],
            career: answers.career || [],
            futureVision: answers.future || [],
            timeline: answers.timeline?.[0] || '',
            kidsPreference: answers.kidsQ?.[0] || '',
            dealbreakers: answers.dealbreakers || [],
            mustHaves: answers.mustHave || [],
            weights: {
              looks: userGender === 'male' ? 0.3 : 0.15,
              energy: userGender === 'male' ? 0.2 : 0.15,
              lifestyle: 0.15,
              goals: userGender === 'female' ? 0.25 : 0.15,
              personality: 0.1,
              values: userGender === 'female' ? 0.2 : 0.15,
            },
          };
          
          const readinessKeys = [
            "sd_ready_healed",
            "sd_ready_values",
            "sd_ready_communication",
            "sd_ready_available",
            "sd_ready_respect",
            "sd_ready_accountability",
          ] as const;
          const readinessByQuestion: Record<string, string> = {
            sd_ready_healed: "I have healed from past relationship wounds",
            sd_ready_values: "I know my own values and deal-breakers",
            sd_ready_communication: "I communicate openly and honestly",
            sd_ready_available: "I'm emotionally available for a new relationship",
            sd_ready_respect: "I respect different perspectives and boundaries",
            sd_ready_accountability: "I take accountability for my actions",
          };
          const readinessScores = readinessKeys.map((k) => Number(answers[k]?.[0] || "3"));
          const readinessAvg = readinessScores.reduce((sum, value) => sum + value, 0) / readinessScores.length;
          const readinessPercent = Math.round((readinessAvg / 5) * 100);
          const lowReadinessItems = readinessKeys
            .filter((k) => Number(answers[k]?.[0] || "3") <= 2)
            .map((k) => readinessByQuestion[k]);

          // Save attraction blueprint
          await saveAttractionBlueprint(userId, blueprint);

          // Also persist merged self-discovery into profile
          await fetch(`/api/users/${userId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              selfDiscoveryCompleted: true,
              commitmentIntention: answers.sd_commitment?.[0] || null,
              loveLanguage: answers.sd_love_language?.[0] || null,
              topPriorities: answers.sd_priorities || [],
              relationshipReadiness: {
                score: readinessPercent,
                blindSpots: lowReadinessItems.slice(0, 2),
                needsWork: lowReadinessItems.slice(2, 4),
              },
            }),
          });
          
          // Fetch AI matches — show only the top curated pick; start 48h pacing once
          const aiMatches = await getAIMatches(userId);
          const top = aiMatches[0];
          setMatches(top ? [top] : []);
          if (top && !curatedCooldownRecordedRef.current) {
            await recordAiMatchClaimed(userId);
            curatedCooldownRecordedRef.current = true;
          }
        } catch (error) {
          console.error('Error saving blueprint or fetching matches:', error);
          toast({
            title: "Error",
            description: "Failed to save preferences. Showing sample matches.",
            variant: "destructive",
          });
          // Fallback: single sample match
          const fallback: AIMatch = {
            id: "1",
            name: "Emily",
            age: 28,
            image: getActorImage(0),
            compatibility: 85,
            reasons: ["Shared life goals", "Values match"],
            emphasis: "Goals, Education & Values",
          };
          setMatches([fallback]);
          if (!curatedCooldownRecordedRef.current) {
            await recordAiMatchClaimed(userId);
            curatedCooldownRecordedRef.current = true;
          }
        } finally {
          setIsSaving(false);
          setIsLoadingMatches(false);
        }
      };
      
      saveAndFetch();
    }, [userId, answers, userGender]);

    const totalAnswers = Object.values(answers).flat();
    const dealbreakers = answers.dealbreakers || [];
    const coreValues = answers.core_values || [];

    if (isSaving || isLoadingMatches) {
      return (
        <div className={`${FLOW_BG} flex items-center justify-center`}>
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-sm text-white/80">Finding your curated match...</p>
          </div>
        </div>
      );
    }

    return (
      <div className={`${FLOW_BG} px-3 pt-3 pb-16`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-2xl font-bold text-white drop-shadow-lg">Your curated match</h2>
            <p className="text-xs text-white/60">From {totalAnswers.length} answers across {FLOW_B_STEP_COUNT} steps</p>
          </div>
          <Badge className="bg-white/20 text-white border border-white/30 text-xs px-3 py-1">AI</Badge>
        </div>

        <div className="mb-4 rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 backdrop-blur-md">
          <p className="text-xs text-white/90 leading-relaxed">
            <span className="font-semibold text-white">Next pick in 48 hours.</span> We surface one
            highly compatible profile per cycle so you can focus. Directory boost on the AI Matchmaker
            home uses the same timer.
          </p>
        </div>

        {coreValues.length > 0 && (
          <div className="mb-3 p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-white" />
              <p className="text-sm font-medium text-white">Your Core Values</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {coreValues.map((v, i) => {
                const value = QUESTIONS.find((q: any) => q.id === 'core_values')?.options.find((o: any) => o.id === v);
                return (
                  <Badge key={i} className="text-xs px-2 py-1 bg-white/20 text-white border border-white/30">
                    {value?.label || v}
                  </Badge>
                );
              })}
            </div>
            {userGender && (
              <p className="text-xs text-white/70 mt-3 font-medium">
                {userGender === 'male' 
                  ? '🎯 Matching based on physical attraction & style preferences'
                  : '🎯 Matching based on life goals, education & values alignment'}
              </p>
            )}
          </div>
        )}

        {dealbreakers.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {dealbreakers.map((d, i) => (
              <Badge key={i} className="text-xs px-2 py-1 bg-red-500/20 text-red-300 border border-red-500/30">
                <X className="w-3 h-3 mr-1" />
                {QUESTIONS.find((q: any) => q.id === 'dealbreakers')?.options.find((o: any) => o.id === d)?.label}
              </Badge>
            ))}
          </div>
        )}

        <div className="space-y-3">
          {matches.length > 0 ? (
            (() => {
              const match = matches[0];
              return (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 hover:border-white/40 transition-all"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="relative flex-shrink-0">
                    <img 
                      src={match.image || "/placeholder.png"} 
                      alt={match.name}
                      className="w-16 h-16 rounded-full object-cover ring-2 ring-primary/30"
                    />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary border-2 border-background flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-bold text-white text-base">
                        {match.name}{match.age ? `, ${match.age}` : ''}
                      </h3>
                      <Badge className="bg-white/20 text-white border border-white/30 text-xs px-2.5 py-1 font-bold">
                        {match.compatibility}%
                      </Badge>
                      {match.mutualCompatibility && (
                        <Badge className="bg-primary/25 text-primary border border-primary/35 text-xs px-2 py-0.5">
                          {match.mutualCompatibility}% Mutual
                        </Badge>
                      )}
                    </div>
                    {match.emphasis && (
                      <p className="text-xs text-white/70 mb-2 font-medium">{match.emphasis}</p>
                    )}
                    <div className="space-y-1 mb-3">
                      {match.reasons.slice(0, 3).map((reason, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs text-white/80">
                          <Check className="w-3 h-3 text-white flex-shrink-0" />
                          <span>{reason}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs flex-1 bg-white/10 text-white border-white/30 hover:bg-white/20"
                        onClick={() => setSelectedMatch(match)}
                      >
                        <Info className="w-3.5 h-3.5 mr-1.5" />
                        Insights
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 px-3 text-xs flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
                        onClick={() => setLocation(`/profile/${match.id}`)}
                      >
                        View Profile
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
              );
            })()
          ) : (
            <div className="text-center py-12">
              <p className="text-sm text-white/80 mb-2">No curated pick this cycle.</p>
              <p className="text-xs text-white/60">Try People to explore more profiles, or check back after the next 48h window.</p>
            </div>
          )}
        </div>

        {selectedMatch && (
          <MatchDetails
            match={selectedMatch}
            onClose={() => setSelectedMatch(null)}
          />
        )}

        <div className="fixed bottom-0 left-0 right-0 p-3 bg-black/90 backdrop-blur border-t border-primary/20">
          <Button 
            size="lg"
            className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-lg shadow-primary/20"
            onClick={() => setLocation('/directory')}
          >
            Browse People
          </Button>
        </div>
      </div>
    );
  }

  const q = QUESTIONS[currentQ];
  const selected = answers[q.id] || [];

  return (
    <div className={`${FLOW_BG} flex flex-col overflow-hidden safe-top safe-bottom relative`}>
      {/* Header with back button and progress */}
      <div className="px-4 pt-3 pb-2 flex items-center gap-3">
        <button
          onClick={() => {
            if (currentQ > 0) {
              setCurrentQ(currentQ - 1);
            } else {
              setCurrentQ(-1);
            }
          }}
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
        >
          <BackArrow className="w-5 h-5 text-white" />
        </button>
        <div className="flex-1 flex items-center gap-2">
          <img src={MATCHIFY_LOGO_URL} alt="" className="h-12 w-auto object-contain" />
          <div className="relative flex-1 min-w-0">
            <Progress value={progress} className="h-2 bg-white/10" />
            <div className="absolute inset-0 h-2 bg-gradient-to-r from-primary/60 via-pink-400/50 to-rose-500/50 rounded-full blur-sm pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 overflow-y-auto pb-20">
        <motion.div
          key={`${currentQ}-${userGender}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">{q.title}</h2>
          <p className="text-white/80 text-sm mb-2">{q.subtitle}</p>
          {q.description && (
            <div className="flex items-start gap-2 mt-3 p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
              <Info className="w-4 h-4 text-white/80 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-white/70 leading-relaxed">{q.description}</p>
            </div>
          )}
          <div className="flex justify-between items-center mt-4 text-white/60 text-xs">
            <span>Question {currentQ + 1} of {QUESTIONS.length}</span>
            <span>{selected.length}/{q.max} selected</span>
          </div>
        </motion.div>

        {q.type === "image" ? (
          <div className="grid grid-cols-3 gap-3">
            {q.options.map((opt: any, index: number) => {
              const isSelected = selected.includes(opt.id);
              return (
                <motion.button
                  key={opt.id}
                  onClick={() => toggleAnswer(q.id, opt.id, q.max)}
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    scale: isSelected ? 1.05 : 1,
                    y: 0
                  }}
                  transition={{ 
                    delay: index * 0.05,
                    type: "spring",
                    stiffness: 300,
                    damping: 25
                  }}
                  className={`relative aspect-square rounded-xl overflow-hidden transition-all ${
                    isSelected 
                      ? 'ring-3 ring-primary shadow-[0_0_22px_hsl(346_96%_62%/0.45)]' 
                      : 'ring-2 ring-white/20 hover:ring-primary/40'
                  }`}
                  data-testid={`option-${q.id}-${opt.id}`}
                  whileHover={!isSelected ? { scale: 1.05, y: -4 } : {}}
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    className="w-full h-full"
                    animate={isSelected ? { scale: 1.1, filter: "brightness(1.1)" } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    <ImageWithFallback
                      src={opt.image}
                      fallbackSrc={getActorImage(q.options.indexOf(opt))}
                      alt={opt.label}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                  <motion.div 
                    className={`absolute inset-0 transition-all duration-300 ${
                      isSelected 
                        ? 'bg-gradient-to-t from-black/90 via-black/50 to-black/30' 
                        : 'bg-gradient-to-t from-black/85 via-black/45 to-black/25'
                    }`}
                    animate={isSelected ? {
                      opacity: [0.85, 0.9, 0.85]
                    } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  
                  {/* Animated glow for selected */}
                  {isSelected && (
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-white/30 via-transparent to-white/30"
                      animate={{
                        x: ['-100%', '100%'],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                    />
                  )}
                  
                  {/* Heart icon for selected */}
                  {isSelected && (
                    <motion.div 
                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10"
                      animate={{
                        scale: [1, 1.2, 1.1],
                        rotate: [0, 10, -10, 0],
                      }}
                      transition={{ 
                        duration: 0.6,
                        times: [0, 0.5, 1]
                      }}
                    >
                      <Heart className="w-8 h-8 text-primary fill-primary drop-shadow-[0_0_14px_hsl(346_96%_62%/0.85)]" />
                    </motion.div>
                  )}
                  
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 via-black/70 to-transparent backdrop-blur-sm">
                    <motion.span 
                      className="text-[10px] font-bold text-white text-center block truncate"
                      animate={isSelected ? {
                        scale: [1, 1.05, 1]
                      } : {}}
                      transition={{ duration: 0.5 }}
                    >
                      {opt.label}
                    </motion.span>
                    {opt.description && (
                      <motion.span 
                        className="text-[8px] text-white/80 block truncate mt-0.5"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        {opt.description}
                      </motion.span>
                    )}
                  </div>
                  
                  {/* Check mark badge */}
                  {isSelected && (
                    <motion.div 
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg z-10"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    >
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </motion.div>
                  )}
                  
                  {/* Particle effect on selection */}
                  {isSelected && (
                    <motion.div
                      className="absolute inset-0 pointer-events-none"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {[...Array(4)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-1.5 h-1.5 bg-white rounded-full"
                          style={{
                            left: '50%',
                            top: '50%',
                          }}
                          animate={{
                            x: [0, Math.cos(i * 90 * Math.PI / 180) * 60],
                            y: [0, Math.sin(i * 90 * Math.PI / 180) * 60],
                            opacity: [1, 0],
                            scale: [1, 0],
                          }}
                          transition={{
                            duration: 0.6,
                            delay: i * 0.1,
                          }}
                        />
                      ))}
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {q.options.map((opt: any, index: number) => {
              const isSelected = selected.includes(opt.id);
              const isDealbreaker = q.type === "dealbreaker";
              return (
                <motion.button
                  key={opt.id}
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ 
                    opacity: 1, 
                    scale: isSelected ? 1.05 : 1,
                    y: 0
                  }}
                  transition={{ 
                    delay: index * 0.05,
                    type: "spring",
                    stiffness: 300,
                    damping: 25
                  }}
                  onClick={() => toggleAnswer(q.id, opt.id, q.max)}
                  className={`px-4 py-3 rounded-full text-sm font-medium transition-all backdrop-blur-md ${
                    isSelected 
                      ? isDealbreaker 
                        ? 'bg-red-500/30 text-red-200 ring-3 ring-red-400/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
                        : 'bg-primary/25 text-white ring-3 ring-primary/60 shadow-[0_0_16px_hsl(346_96%_62%/0.35)]'
                      : 'bg-white/10 text-white/70 hover:bg-white/15 border border-white/20'
                  }`}
                  data-testid={`option-${q.id}-${opt.id}`}
                  whileHover={!isSelected ? { scale: 1.05, y: -2 } : {}}
                  whileTap={{ scale: 0.95 }}
                >
                  {isDealbreaker && isSelected && (
                    <motion.span
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    >
                      <X className="w-4 h-4 inline mr-1.5" />
                    </motion.span>
                  )}
                  {!isDealbreaker && isSelected && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    >
                      <Check className="w-4 h-4 inline mr-1.5" />
                    </motion.span>
                  )}
                  {opt.label}
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-3 bg-black/90 backdrop-blur border-t border-primary/20">
        <Button 
          size="lg"
          className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-lg shadow-primary/20"
          onClick={goNext}
          disabled={!canProceed()}
        >
          {currentQ === QUESTIONS.length - 1 ? 'See Matches' : 'Next'}
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}

