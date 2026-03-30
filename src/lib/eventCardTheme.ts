import { Heart, Coffee, Music, Utensils, Dumbbell } from "lucide-react";

export const EVENT_THEMES = [
  { gradient: "from-red-900 via-primary to-red-800", icon: Heart },
  { gradient: "from-amber-400 via-orange-400 to-yellow-500", icon: Coffee },
  { gradient: "from-violet-500 via-purple-500 to-indigo-400", icon: Music },
  { gradient: "from-emerald-400 via-green-500 to-teal-400", icon: Utensils },
  { gradient: "from-blue-400 via-cyan-500 to-sky-400", icon: Dumbbell },
] as const;

export function getEventTheme(id: string) {
  const idx = id.charCodeAt(0) % EVENT_THEMES.length;
  return EVENT_THEMES[idx];
}
