/** Human-readable section titles for stored AI Matchmaker / registration questionnaire fields. */
const SECTION_LABELS: Record<string, string> = {
  flowType: "Flow",
  stylePreferences: "Looks & style",
  energyPreferences: "Energy",
  lifestylePreferences: "Lifestyle",
  futureVision: "Future vision",
  presencePreferences: "Presence & vibe",
  rhythmPreferences: "Day-to-day rhythm",
  presentationStylePreferences: "Presentation style",
  earlyConnectionPreferences: "Early connection",
  bodyPreferences: "Body type (legacy)",
  faceShapePreferences: "Face shape (legacy)",
  eyeShapePreferences: "Eyes (legacy)",
  lipShapePreferences: "Lips (legacy)",
  coreValues: "Core values",
  communicationStyle: "Communication",
  conflictStyle: "Conflict style",
  hobbies: "Hobbies",
  socialLife: "Social life",
  foodPreferences: "Food",
  career: "Career & work",
  timeline: "Timeline",
  kidsPreference: "Children",
  dealbreakers: "Dealbreakers",
  mustHaves: "Must-haves",
  weights: "Match weights",
  completedAt: "Completed",
};

function asNonEmptyStrings(v: unknown): string[] {
  if (Array.isArray(v)) {
    return v.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map((s) => s.trim());
  }
  if (typeof v === "string" && v.trim()) return [v.trim()];
  return [];
}

function formatFlowType(v: unknown): string {
  if (v === "flow-a" || v === "flow-b") return v === "flow-a" ? "Flow A" : "Flow B";
  if (typeof v === "string" && v.trim()) return v.trim();
  return "";
}

function formatWeights(v: unknown): string[] {
  if (!v || typeof v !== "object") return [];
  const o = v as Record<string, number>;
  return Object.entries(o)
    .filter(([, n]) => typeof n === "number" && !Number.isNaN(n))
    .map(([k, n]) => `${k}: ${Math.round(n * 100) / 100}`);
}

/** Ordered keys for stable, sensible grouping in the UI. */
const DISPLAY_ORDER = [
  "flowType",
  "stylePreferences",
  "presencePreferences",
  "rhythmPreferences",
  "presentationStylePreferences",
  "earlyConnectionPreferences",
  "bodyPreferences",
  "faceShapePreferences",
  "eyeShapePreferences",
  "lipShapePreferences",
  "energyPreferences",
  "lifestylePreferences",
  "futureVision",
  "coreValues",
  "communicationStyle",
  "conflictStyle",
  "hobbies",
  "socialLife",
  "foodPreferences",
  "career",
  "timeline",
  "kidsPreference",
  "dealbreakers",
  "mustHaves",
  "weights",
  "completedAt",
];

export type BlueprintSection = { key: string; title: string; lines: string[] };

/**
 * Turns a stored `attractionBlueprint` object into titled sections for read-only display.
 * Only includes keys that have displayable content.
 */
export function blueprintToSections(blueprint: unknown): BlueprintSection[] {
  if (!blueprint || typeof blueprint !== "object") return [];
  const raw = blueprint as Record<string, unknown>;
  const out: BlueprintSection[] = [];

  for (const key of DISPLAY_ORDER) {
    if (!(key in raw)) continue;
    const val = raw[key];
    let lines: string[] = [];

    if (key === "flowType") {
      const t = formatFlowType(val);
      if (t) lines = [t];
    } else if (key === "weights") {
      lines = formatWeights(val);
    } else if (key === "completedAt") {
      if (typeof val === "string" && val.trim()) {
        const d = new Date(val);
        lines = Number.isNaN(d.getTime()) ? [val.trim()] : [d.toLocaleString()];
      }
    } else {
      lines = asNonEmptyStrings(val);
    }

    if (!lines.length) continue;
    const title = SECTION_LABELS[key] || key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()).trim();
    out.push({ key, title, lines });
  }

  return out;
}

export function hasBlueprintContent(blueprint: unknown): boolean {
  return blueprintToSections(blueprint).length > 0;
}
