/** Default event matchmaking questionnaire questions. Used when creating events and when event has no custom questions. */
export interface EventQuestionItem {
  id: string;
  text: string;
  options: string[];
  required: boolean;
}

export const DEFAULT_EVENT_QUESTIONS: EventQuestionItem[] = [
  {
    id: "values",
    text: "What values are most important to you in a relationship?",
    options: ["Honesty & Trust", "Adventure & Fun", "Stability & Security", "Growth & Learning", "Creativity & Expression"],
    required: true,
  },
  {
    id: "lifestyle",
    text: "How would you describe your ideal weekend?",
    options: ["Relaxing at home", "Exploring new places", "Social gatherings", "Pursuing hobbies", "Mix of everything"],
    required: true,
  },
  {
    id: "goals",
    text: "What are you looking for?",
    options: ["Long-term relationship", "Casual dating", "Friendship", "Networking", "Open to anything"],
    required: true,
  },
  {
    id: "dealbreakers",
    text: "Any dealbreakers we should know about?",
    options: ["Smoking", "Excessive drinking", "Dishonesty", "Lack of ambition", "Poor communication", "None"],
    required: false,
  },
];

export function parseEventQuestions(json: string | null | undefined): EventQuestionItem[] | null {
  if (!json || typeof json !== "string") return null;
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed as EventQuestionItem[];
  } catch {
    return null;
  }
}
