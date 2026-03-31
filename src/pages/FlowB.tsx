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
import {
  claimNextCuratedMatch,
  getAIMatches,
  reopenAIMatchmakerSession,
  saveAttractionBlueprint,
  type AIMatch,
} from "@/services/aiMatchmaker.service";
import { queryClient } from "@/lib/queryClient";
import type { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { MatchDetails } from "@/components/matches/MatchDetails";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { getFlowBOptionImage } from "@/lib/attractionFlowImages";
import { getFlowBOptions, getFlowBSectionOptions, isFlowBImageQuestion, isFlowBSectionQuestion } from "@/lib/flowBImages";
import { getActorImage } from "@/lib/actorImages";
import { getAiMatchCooldownLabel, MATCHIFY_LOGO_URL } from "@/lib/matchifyBranding";
import { FEMALE_FLOW_ORDER, FLOW_B_STEP_COUNT, MALE_FLOW_ORDER } from "@/lib/flowBStepOrder";

/** AI Matchmaker / Flow B screen theme (Matchify red wine, not legacy purple). */
const FLOW_BG =
  "min-h-screen h-[100dvh] bg-gradient-to-br from-zinc-950 via-red-950/90 to-zinc-950";

/** Centered column — a bit wider on sm+ so wide monitors aren’t all empty margin */
const FLOW_COL = "mx-auto w-full min-w-0 max-w-lg sm:max-w-xl";

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
// ── Shared questions — identical for both genders (self-discovery + dealbreakers) ──
const SHARED_QUESTIONS = [
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
  {
    id: "timeline",
    title: "When are you looking for something serious?",
    subtitle: "Pick 1",
    description: "",
    type: "text",
    max: 1,
    options: [
      { id: "soon", label: "1–2 years" },
      { id: "medium", label: "3–5 years" },
      { id: "long", label: "5+ years" },
      { id: "flexible", label: "Flexible" },
    ],
  },
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
];

// ── Male questions (15 unique) — what HE looks for in a woman ───────────────
const buildMaleQuestions = (): any[] => [
  {
    id: "m_her_personality",
    title: "What personality draws you to a woman?",
    subtitle: "Pick 2-4",
    description: "",
    type: "image",
    max: 4,
    options: getFlowBOptions("personality_turn_on", "male"),
  },
  {
    id: "m_her_energy",
    title: "What energy do you want her to bring?",
    subtitle: "Pick 2-3",
    description: "",
    type: "image",
    max: 3,
    options: getFlowBOptions("energy_vibe", "male"),
  },
  {
    id: "m_her_physical",
    title: "What physical type attracts you in a woman?",
    subtitle: "Pick 1-3",
    description: "",
    type: "image",
    max: 3,
    options: FEMALE_BODY_TYPES,
  },
  {
    id: "m_her_face",
    title: "What facial features do you love in a woman?",
    subtitle: "Pick 1-3",
    description: "",
    type: "image",
    max: 3,
    options: FEMALE_FACE_SHAPES,
  },
  {
    id: "m_her_eyes",
    title: "What eye shapes do you find beautiful?",
    subtitle: "Pick 1-3",
    description: "",
    type: "image",
    max: 3,
    options: getFlowBOptions("eye_shape_preference", "male"),
  },
  {
    id: "m_her_lips",
    title: "What lip shapes attract you in a woman?",
    subtitle: "Pick 1-3",
    description: "",
    type: "image",
    max: 3,
    options: getFlowBOptions("lip_shape_preference", "male"),
  },
  {
    id: "m_her_values",
    title: "What values must she have?",
    subtitle: "Pick 3-5",
    description: "",
    type: "image",
    max: 5,
    options: getFlowBSectionOptions("core_values", "male"),
  },
  {
    id: "m_her_style",
    title: "What lifestyle do you want her to have?",
    subtitle: "Pick 2-4",
    description: "",
    type: "image",
    max: 4,
    options: getFlowBSectionOptions("lifestyle", "male"),
  },
  {
    id: "m_how_connect",
    title: "How do you want to connect as a couple?",
    subtitle: "Pick 2-3",
    description: "",
    type: "image",
    max: 3,
    options: getFlowBSectionOptions("communication", "male"),
  },
  {
    id: "m_conflict",
    title: "How do you handle disagreements?",
    subtitle: "Pick 1-2",
    description: "",
    type: "image",
    max: 2,
    options: getFlowBSectionOptions("conflict_style", "male"),
  },
  {
    id: "m_future_vision",
    title: "What future do you want to build?",
    subtitle: "Pick 2-3",
    description: "",
    type: "image",
    max: 3,
    options: getFlowBSectionOptions("future", "male"),
  },
  {
    id: "m_his_career",
    title: "What's your own career approach?",
    subtitle: "Pick 2-3",
    description: "",
    type: "image",
    max: 3,
    options: getFlowBSectionOptions("career", "male"),
  },
  {
    id: "m_hobbies",
    title: "What shared hobbies matter most to you?",
    subtitle: "Pick 3-4",
    description: "",
    type: "image",
    max: 4,
    options: getFlowBSectionOptions("hobbies", "male"),
  },
  {
    id: "m_social_life",
    title: "What social life do you prefer as a couple?",
    subtitle: "Pick 2-3",
    description: "",
    type: "image",
    max: 3,
    options: getFlowBSectionOptions("sociallife", "male"),
  },
  {
    id: "m_food",
    title: "What's your food vibe together?",
    subtitle: "Pick 2-3",
    description: "",
    type: "image",
    max: 3,
    options: getFlowBSectionOptions("food", "male"),
  },
  ...SHARED_QUESTIONS,
];

// ── Female questions (15 unique) — what SHE looks for in a man ─────────────
const buildFemaleQuestions = (): any[] => {
  const femaleEnergyOpts = getFlowBOptions("energy_vibe", "female");
  const providerOptions = [
    { id: "provider",       image: femaleEnergyOpts[0]?.image ?? "", label: "Traditional provider",  description: "Financial security first" },
    { id: "equal_partner",  image: femaleEnergyOpts[1]?.image ?? "", label: "Equal partnership",     description: "Both contribute equally" },
    { id: "emotional_anchor", image: femaleEnergyOpts[2]?.image ?? "", label: "Emotional anchor",    description: "Steady and grounding" },
    { id: "motivator",      image: femaleEnergyOpts[3]?.image ?? "", label: "Motivator",             description: "Pushes you to grow" },
    { id: "protector",      image: femaleEnergyOpts[4]?.image ?? "", label: "Protector",             description: "Makes you feel safe" },
    { id: "flexible",       image: femaleEnergyOpts[5]?.image ?? "", label: "Flexible supporter",    description: "Adapts to your needs" },
  ];
  return [
    {
      id: "f_his_personality",
      title: "What personality attracts you in a man?",
      subtitle: "Pick 2-4",
      description: "",
      type: "image",
      max: 4,
      options: getFlowBOptions("personality_turn_on", "female"),
    },
    {
      id: "f_his_energy",
      title: "What energy do you want him to have?",
      subtitle: "Pick 2-3",
      description: "",
      type: "image",
      max: 3,
      options: femaleEnergyOpts,
    },
    {
      id: "f_his_values",
      title: "What values are non-negotiable in a man?",
      subtitle: "Pick 3-5",
      description: "",
      type: "image",
      max: 5,
      options: getFlowBSectionOptions("core_values", "female"),
    },
    {
      id: "f_how_connect",
      title: "How do you want to connect as a couple?",
      subtitle: "Pick 2-3",
      description: "",
      type: "image",
      max: 3,
      options: getFlowBSectionOptions("communication", "female"),
    },
    {
      id: "f_his_career",
      title: "What career mindset do you want in a man?",
      subtitle: "Pick 2-3",
      description: "",
      type: "image",
      max: 3,
      options: getFlowBSectionOptions("career", "female"),
    },
    {
      id: "f_future_vision",
      title: "What future do you want to build together?",
      subtitle: "Pick 2-3",
      description: "",
      type: "image",
      max: 3,
      options: getFlowBSectionOptions("future", "female"),
    },
    {
      id: "f_conflict",
      title: "How do you want him to handle conflict?",
      subtitle: "Pick 1-2",
      description: "",
      type: "image",
      max: 2,
      options: getFlowBSectionOptions("conflict_style", "female"),
    },
    {
      id: "f_hobbies",
      title: "What shared interests matter most to you?",
      subtitle: "Pick 3-4",
      description: "",
      type: "image",
      max: 4,
      options: getFlowBSectionOptions("hobbies", "female"),
    },
    {
      id: "f_social_life",
      title: "What's your ideal social life together?",
      subtitle: "Pick 2-3",
      description: "",
      type: "image",
      max: 3,
      options: getFlowBSectionOptions("sociallife", "female"),
    },
    {
      id: "f_food",
      title: "What's your food vibe together?",
      subtitle: "Pick 2-3",
      description: "",
      type: "image",
      max: 3,
      options: getFlowBSectionOptions("food", "female"),
    },
    {
      id: "f_his_physical",
      title: "What physical type draws you to a man?",
      subtitle: "Pick 1-3",
      description: "",
      type: "image",
      max: 3,
      options: MALE_BODY_TYPES,
    },
    {
      id: "f_his_face",
      title: "What facial features attract you in a man?",
      subtitle: "Pick 1-3",
      description: "",
      type: "image",
      max: 3,
      options: MALE_FACE_SHAPES,
    },
    {
      id: "f_his_eyes",
      title: "What eye shapes attract you in a man?",
      subtitle: "Pick 1-3",
      description: "",
      type: "image",
      max: 3,
      options: getFlowBOptions("eye_shape_preference", "female"),
    },
    {
      id: "f_his_lips",
      title: "What lip shapes do you prefer in a man?",
      subtitle: "Pick 1-3",
      description: "",
      type: "image",
      max: 3,
      options: getFlowBOptions("lip_shape_preference", "female"),
    },
    {
      id: "f_his_provider",
      title: "What kind of support do you need from a partner?",
      subtitle: "Pick 2-3",
      description: "",
      type: "image",
      max: 3,
      options: providerOptions,
    },
    ...SHARED_QUESTIONS,
  ];
};

/** Returns the correctly ordered 30-question array for the given gender. */
const getQuestions = (userGender?: "male" | "female" | null): any[] =>
  userGender === "female" ? buildFemaleQuestions() : buildMaleQuestions();

/** Map gender-specific question ids into canonical blueprint buckets. */
function getAnswerBucket(questionId: string): string {
  const map: Record<string, string> = {
    m_her_personality: "personality_turn_on",
    f_his_personality: "personality_turn_on",
    m_her_energy: "energy_vibe",
    f_his_energy: "energy_vibe",
    m_her_physical: "physical_attraction",
    f_his_physical: "physical_attraction",
    m_her_face: "face_shape_preference",
    f_his_face: "face_shape_preference",
    m_her_eyes: "eye_shape_preference",
    f_his_eyes: "eye_shape_preference",
    m_her_lips: "lip_shape_preference",
    f_his_lips: "lip_shape_preference",
    m_her_values: "core_values",
    f_his_values: "core_values",
    m_her_style: "lifestyle",
    m_how_connect: "communication",
    f_how_connect: "communication",
    m_conflict: "conflict_style",
    f_conflict: "conflict_style",
    m_future_vision: "future",
    f_future_vision: "future",
    m_his_career: "career",
    f_his_career: "career",
    m_hobbies: "hobbies",
    f_hobbies: "hobbies",
    m_social_life: "sociallife",
    f_social_life: "sociallife",
    m_food: "food",
    f_food: "food",
  };
  return map[questionId] ?? questionId;
}

// ── FlowB component ───────────────────────────────────────────────────────────
const _LEGACY_UNUSED = [
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

export default function FlowB() {
  const [, setLocation] = useLocation();
  const { userId } = useCurrentUser();
  const { toast } = useToast();
  const [currentQ, setCurrentQ] = useState(-1);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  /** Start AI-match cooldown when user sees their single curated match (once per completion). */
  const curatedCooldownRecordedRef = useRef(false);
  /** Latest answers for results effect (avoid effect deps on every tap). */
  const answersRef = useRef(answers);
  answersRef.current = answers;

  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [matches, setMatches] = useState<AIMatch[]>([]);
  /** Set when /ai-matches returns — openai = LLM-ranked; fallback = placeholder scores. */
  const [matchRankingSource, setMatchRankingSource] = useState<"openai" | "fallback" | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<AIMatch | null>(null);

  // Get user gender for gender-specific matching
  const { data: currentUser, isLoading: userProfileLoading } = useQuery<User>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });

  const rawGenderB = currentUser?.gender;
  const userGender: "male" | "female" | null | undefined =
    rawGenderB === "male" || rawGenderB === "female" ? rawGenderB : null;
  const matchmakerLocked = !!(currentUser as any)?.matchmakerLocked;
  const hasBlueprint = !!(currentUser as any)?.attractionBlueprint;

  /** Frozen list for the active run so profile/gender hydration can't swap question ids mid-flow. */
  const [sessionQuestions, setSessionQuestions] = useState<any[] | null>(null);
  const liveQuestions = getQuestions(userGender);
  const QUESTIONS = sessionQuestions ?? liveQuestions;

  useEffect(() => {
    if (currentQ !== QUESTIONS.length) return;
    if (!userId) {
      setIsSaving(false);
      setIsLoadingMatches(false);
      return;
    }
    let cancelled = false;

    const saveAndFetch = async () => {
      const a = answersRef.current;
      setIsSaving(true);
      setIsLoadingMatches(true);
      try {
        const blueprint = {
          flowType: "flow-b" as const,
          stylePreferences: a.personality_turn_on || [],
          bodyPreferences: a.physical_attraction || [],
          faceShapePreferences: a.face_shape_preference || [],
          eyeShapePreferences: a.eye_shape_preference || [],
          lipShapePreferences: a.lip_shape_preference || [],
          energyPreferences: a.energy_vibe || [],
          coreValues: a.core_values || [],
          communicationStyle: a.communication || [],
          conflictStyle: a.conflict_style || [],
          lifestylePreferences: a.lifestyle || [],
          hobbies: a.hobbies || [],
          socialLife: a.sociallife || [],
          foodPreferences: a.food || [],
          career: a.career || [],
          futureVision: a.future || [],
          timeline: a.timeline?.[0] || "",
          kidsPreference: a.kidsQ?.[0] || "",
          dealbreakers: a.dealbreakers || [],
          mustHaves: a.mustHave || [],
          weights: {
            looks: userGender === "male" ? 0.3 : 0.15,
            energy: userGender === "male" ? 0.2 : 0.15,
            lifestyle: 0.15,
            goals: userGender === "female" ? 0.25 : 0.15,
            personality: 0.1,
            values: userGender === "female" ? 0.2 : 0.15,
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
        const readinessScores = readinessKeys.map((k) => Number(a[k]?.[0] || "3"));
        const readinessAvg = readinessScores.reduce((sum, value) => sum + value, 0) / readinessScores.length;
        const readinessPercent = Math.round((readinessAvg / 5) * 100);
        const lowReadinessItems = readinessKeys
          .filter((k) => Number(a[k]?.[0] || "3") <= 2)
          .map((k) => readinessByQuestion[k]);

        await saveAttractionBlueprint(userId, blueprint);

        await fetch(`/api/users/${userId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            selfDiscoveryCompleted: true,
            commitmentIntention: a.sd_commitment?.[0] || null,
            loveLanguage: a.sd_love_language?.[0] || null,
            topPriorities: a.sd_priorities || [],
            relationshipReadiness: {
              score: readinessPercent,
              blindSpots: lowReadinessItems.slice(0, 2),
              needsWork: lowReadinessItems.slice(2, 4),
            },
          }),
        });

        let rankingSource: "openai" | "fallback" = "fallback";
        let top: AIMatch | undefined;
        try {
          const claimed = await claimNextCuratedMatch(userId);
          rankingSource = claimed.rankingSource;
          top = claimed.match ?? undefined;
        } catch (claimErr) {
          const st = (claimErr as { status?: number })?.status;
          if (st === 409) {
            const { matches: aiList, rankingSource: rs } = await getAIMatches(userId, { limit: 1 });
            rankingSource = rs;
            top = aiList[0];
          } else {
            throw claimErr;
          }
        }
        if (!cancelled) {
          setMatchRankingSource(rankingSource);
          setMatches(top ? [top] : []);
          curatedCooldownRecordedRef.current = true;
        }
      } catch (error) {
        console.error("Error saving blueprint or fetching matches:", error);
        if (!cancelled) {
          setMatchRankingSource("fallback");
          toast({
            title: "Error",
            description: "Failed to save preferences. Showing sample matches.",
            variant: "destructive",
          });
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
          curatedCooldownRecordedRef.current = true;
        }
      } finally {
        if (!cancelled) {
          setIsSaving(false);
          setIsLoadingMatches(false);
        }
      }
    };

    saveAndFetch();
    return () => {
      cancelled = true;
    };
  }, [currentQ, QUESTIONS.length, userId, userGender, toast]);

  const toggleAnswer = (qId: string, optionId: string, max: number) => {
    setAnswers(prev => {
      const key = getAnswerBucket(qId);
      const current = prev[key] || [];
      if (current.includes(optionId)) {
        return { ...prev, [key]: current.filter(id => id !== optionId) };
      } else if (current.length < max) {
        return { ...prev, [key]: [...current, optionId] };
      }
      return prev;
    });
  };

  const progress = currentQ < 0 ? 0 : currentQ >= QUESTIONS.length ? 100 : ((currentQ + 1) / QUESTIONS.length) * 100;

  const canProceed = () => {
    if (currentQ < 0 || currentQ >= QUESTIONS.length) return true;
    const q = QUESTIONS[currentQ];
    const selected = answers[getAnswerBucket(q.id)] || [];
    return selected.length > 0;
  };

  const goNext = () => {
    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      setIsLoadingMatches(true);
      setCurrentQ(QUESTIONS.length);
    }
  };

  if (currentQ === -1) {
    if (matchmakerLocked && hasBlueprint) {
      return (
        <div className={`${FLOW_BG} flex flex-col items-center justify-center px-4 py-8 text-center`}>
          <div className={`${FLOW_COL} px-4`}>
          <div className="inline-flex rounded-2xl bg-white/95 px-6 py-3 shadow-lg mb-5">
            <img src={MATCHIFY_LOGO_URL} alt="" className="h-14 w-auto object-contain" />
          </div>
          <h2 className="text-xl font-bold text-white sm:text-2xl mb-2">AI Matchmaker completed</h2>
          <p className="mx-auto mb-6 max-w-sm text-sm text-white/75 leading-relaxed">
            Your 30-question profile is saved and powers matching and Luna coaching. You can run through the
            questions again anytime if your preferences change.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
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
            <Button
              size="lg"
              variant="secondary"
              className="rounded-full px-8 bg-white/95 text-foreground hover:bg-white"
              disabled={!userId}
              onClick={async () => {
                if (!userId) return;
                try {
                  await reopenAIMatchmakerSession(userId);
                  await queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
                } catch {
                  toast({
                    title: "Could not unlock",
                    description: "Sign in and try again, or use AI Matchmaker from your profile.",
                    variant: "destructive",
                  });
                }
              }}
            >
              Change my answers
            </Button>
          </div>
          </div>
        </div>
      );
    }
    return (
      <div
        className={`${FLOW_BG} flex h-[100dvh] min-h-0 flex-col overflow-hidden safe-top safe-bottom`}
      >
        <div className={`${FLOW_COL} flex min-h-0 flex-1 flex-col px-4`}>
          <div className="flow-b-intro-scroll min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain py-3 pb-[max(8rem,env(safe-area-inset-bottom,0px)+5rem)]">
            <button
              type="button"
              onClick={() => setLocation("/ai-matchmaker")}
              className="mb-5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 transition-colors hover:bg-white/20"
              aria-label="Back to AI Matchmaker"
            >
              <BackArrow className="h-5 w-5 text-white" />
            </button>

            <div className="flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center"
          >
            <div className="mb-4 inline-flex rounded-2xl bg-white/95 px-6 py-3 shadow-lg">
              <img src={MATCHIFY_LOGO_URL} alt="" className="h-16 w-auto object-contain sm:h-20" />
            </div>
            <div className="mx-auto mb-6 h-1.5 w-32 rounded-full bg-primary/40">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="h-full rounded-full bg-primary"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-6 w-full sm:mb-8"
          >
            <h2 className="mb-2 text-2xl font-bold text-white sm:text-3xl">AI Matchmaker</h2>
            <p className="mb-1 text-sm text-white/80">
              {QUESTIONS.length} questions · order adapts to your profile gender
            </p>
            <p className="mx-auto max-w-md text-xs leading-relaxed text-white/60">
              We rank members from a wider pool (richer profiles first). When you finish, your top pick is
              scored with AI from your answers. Next curated pick every {getAiMatchCooldownLabel()}.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mb-6 w-full space-y-2 rounded-xl border border-white/20 bg-white/10 p-4 text-left text-xs backdrop-blur-md sm:mb-8"
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
            className="w-full max-w-sm"
          >
            <Button 
              size="lg"
              className="h-12 w-full rounded-full bg-primary px-6 text-base font-bold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 sm:h-14 sm:px-8"
              disabled={!userId || userProfileLoading}
              onClick={() => {
                curatedCooldownRecordedRef.current = false;
                setMatchRankingSource(null);
                const resolvedGender = userGender === "female" ? "female" : "male";
                setSessionQuestions(getQuestions(resolvedGender));
                setCurrentQ(0);
              }}
              data-testid="button-start-flow-b"
            >
              Start {liveQuestions.length} questions (~12 min)
              <ArrowRight className="ml-2 h-5 w-5 shrink-0" />
            </Button>
            {(!userId || userProfileLoading) && (
              <p className="mt-3 text-center text-[11px] text-white/50">
                {userProfileLoading ? "Loading your profile…" : "Sign in to start."}
              </p>
            )}
          </motion.div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentQ >= QUESTIONS.length) {
    const totalAnswers = Object.values(answers).flat();
    const dealbreakers = answers.dealbreakers || [];
    const coreValues = answers.core_values || [];
    const coreValuesOptions =
      QUESTIONS.find((qq: any) => getAnswerBucket(qq.id) === "core_values")?.options ?? [];

    if (isSaving || isLoadingMatches) {
      return (
        <div className={`${FLOW_BG} flex items-center justify-center px-4`}>
          <div className={`${FLOW_COL} text-center`}>
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-white/80">Finding your curated match…</p>
          </div>
        </div>
      );
    }

    return (
      <div className={`${FLOW_BG} pb-24 pt-3`}>
        <div className={`${FLOW_COL} space-y-3 px-4`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-white drop-shadow-lg sm:text-2xl">Your curated match</h2>
            <p className="mt-0.5 text-[11px] text-white/60 sm:text-xs">
              From {totalAnswers.length} answers across {FLOW_B_STEP_COUNT} steps
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <Badge className="border border-white/30 bg-white/20 px-2.5 py-1 text-xs text-white">AI</Badge>
            {matchRankingSource === "openai" && (
              <span className="text-[10px] font-medium text-emerald-200/90">AI-ranked</span>
            )}
            {matchRankingSource === "fallback" && (
              <span className="max-w-[9rem] text-right text-[10px] text-amber-200/90">
                Suggested (AI unavailable)
              </span>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 backdrop-blur-md">
          <p className="text-xs leading-relaxed text-white/90">
            <span className="font-semibold text-white">
              Next pick in {getAiMatchCooldownLabel()}.
            </span>{" "}
            {matchRankingSource === "openai"
              ? "Compatibility scores and reasons below are from AI using your blueprint and member profiles."
              : "Scores below are approximate until AI ranking succeeds (e.g. network or API issue)."}
            {" "}Directory boost on the AI Matchmaker home uses the same timer.
          </p>
        </div>

        {coreValues.length > 0 && (
          <div className="rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-md">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-white" />
              <p className="text-sm font-medium text-white">Your Core Values</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {coreValues.map((v, i) => {
                const value = coreValuesOptions.find((o: any) => o.id === v);
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
          <div className="flex flex-wrap gap-2">
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
              <p className="text-xs text-white/60">
                Try People to explore more profiles, or check back after the next {getAiMatchCooldownLabel()} cooldown.
              </p>
            </div>
          )}
        </div>

        {selectedMatch && (
          <MatchDetails
            match={selectedMatch}
            onClose={() => setSelectedMatch(null)}
          />
        )}

        </div>

        <div className="fixed bottom-0 left-0 right-0 border-t border-primary/20 bg-black/90 backdrop-blur safe-bottom">
          <div className={`${FLOW_COL} px-4 py-3`}>
            <Button 
              size="lg"
              className="h-11 w-full rounded-full bg-primary font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 sm:h-12"
              onClick={() => setLocation('/directory')}
            >
              Browse People
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const q = QUESTIONS[currentQ];
  const selected = answers[getAnswerBucket(q.id)] || [];

  return (
    <div className={`${FLOW_BG} relative flex flex-col overflow-hidden safe-top safe-bottom`}>
      {/* Header with back button and progress */}
      <div className={`${FLOW_COL} flex items-center gap-3 px-4 pb-2 pt-3`}>
        <button
          type="button"
          onClick={() => {
            if (currentQ > 0) {
              setCurrentQ(currentQ - 1);
            } else {
              setSessionQuestions(null);
              setCurrentQ(-1);
            }
          }}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 transition-colors hover:bg-white/20"
        >
          <BackArrow className="h-5 w-5 text-white" />
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="shrink-0 rounded-xl bg-white/95 px-2.5 py-1 shadow-sm">
            <img src={MATCHIFY_LOGO_URL} alt="" className="h-7 w-auto object-contain sm:h-8" />
          </div>
          <div className="relative min-w-0 flex-1">
            <Progress value={progress} className="h-2 bg-white/10" />
            <div className="pointer-events-none absolute inset-0 h-2 rounded-full bg-gradient-to-r from-primary/60 via-red-900/50 to-red-950/50 blur-sm" />
          </div>
        </div>
      </div>

      <div className={`${FLOW_COL} min-h-0 flex-1 overflow-y-auto px-4 pb-24`}>
        <motion.div
          key={currentQ}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 sm:mb-6"
        >
          <h2 className="mb-2 text-xl font-bold leading-tight text-white drop-shadow-lg sm:text-2xl md:text-3xl">
            {q.title}
          </h2>
          <p className="mb-2 text-sm text-white/80">{q.subtitle}</p>
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
          <div className="mx-auto grid w-full max-w-md grid-cols-2 gap-2 sm:max-w-none sm:grid-cols-3 sm:gap-3">
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
                  className={`relative aspect-square overflow-hidden rounded-xl transition-all ${
                    isSelected 
                      ? 'ring-2 ring-primary shadow-[0_0_22px_hsl(349_52%_38%/0.45)] sm:ring-[3px]' 
                      : 'ring-1 ring-white/20 hover:ring-primary/40 sm:ring-2'
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
                      <Heart className="h-6 w-6 fill-primary text-primary drop-shadow-[0_0_14px_hsl(349_52%_38%/0.85)] sm:h-8 sm:w-8" />
                    </motion.div>
                  )}
                  
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-1.5 backdrop-blur-sm sm:p-2">
                    <motion.span 
                      className="block truncate text-center text-[9px] font-bold text-white sm:text-[10px]"
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
          <div className="flex flex-wrap gap-2 sm:gap-3">
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
                  className={`rounded-full px-3 py-2.5 text-left text-xs font-medium backdrop-blur-md transition-all sm:px-4 sm:py-3 sm:text-sm ${
                    isSelected 
                      ? isDealbreaker 
                        ? 'bg-red-500/30 text-red-200 ring-2 ring-red-400/50 shadow-[0_0_15px_rgba(239,68,68,0.3)] sm:ring-[3px]' 
                        : 'bg-primary/25 text-white ring-2 ring-primary/60 shadow-[0_0_16px_hsl(349_52%_38%/0.35)] sm:ring-[3px]'
                      : 'border border-white/20 bg-white/10 text-white/70 hover:bg-white/15'
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

      <div className="fixed bottom-0 left-0 right-0 border-t border-primary/20 bg-black/90 backdrop-blur safe-bottom">
        <div className={`${FLOW_COL} px-4 py-3`}>
          <Button 
            size="lg"
            className="h-11 w-full rounded-full bg-primary font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 sm:h-12"
            onClick={goNext}
            disabled={!canProceed()}
          >
            {currentQ === QUESTIONS.length - 1 ? "See matches" : "Next"}
            <ChevronRight className="ml-2 h-5 w-5 shrink-0" />
          </Button>
        </div>
      </div>
    </div>
  );
}

