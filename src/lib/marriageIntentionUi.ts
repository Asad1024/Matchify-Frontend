/** Normalize API / form commitment values to a 4-step path for the marriage strip. */
const INTENTION_ALIASES: Record<string, "chatting" | "casual" | "serious" | "marriage"> = {
  figuring_out: "chatting",
  hookup: "chatting",
  talking: "chatting",
  chatting: "chatting",
  friends: "chatting",
  date: "casual",
  dating: "casual",
  casual: "casual",
  serious: "serious",
  committed: "serious",
  marriage: "marriage",
  engaged: "marriage",
  nikkah: "marriage",
};

const STEPS: { key: "chatting" | "casual" | "serious" | "marriage"; pill: string }[] = [
  { key: "chatting", pill: "Exploring" },
  { key: "casual", pill: "Dating" },
  { key: "serious", pill: "Serious" },
  { key: "marriage", pill: "Marriage" },
];

export function normalizeCommitmentKey(
  raw: string | null | undefined,
): "chatting" | "casual" | "serious" | "marriage" {
  if (!raw || typeof raw !== "string") return "chatting";
  const k = raw.toLowerCase().trim();
  if (k === "chatting" || k === "casual" || k === "serious" || k === "marriage") {
    return k;
  }
  return INTENTION_ALIASES[k] ?? "chatting";
}

const TIMELINE_SHORT: Record<string, string> = {
  within_6mo: "Within 6 mo",
  "6_12mo": "6–12 mo",
  "1_2yr": "1–2 yr",
  "2yr_plus": "2+ yr",
  unsure: "Open timeline",
  na: "",
  prefer_not_say: "",
};

export type MarriageIntentProfileInput = {
  commitmentIntention?: string | null;
  marriageTimeline?: string | null;
  marriageApproach?: string | null;
  wantsChildren?: string | null;
  /** "first" = you/your on own profile; "third" = neutral when viewing someone else */
  narration?: "first" | "third";
};

export type MarriageStripMilestones = {
  /** Primary human-readable line — composed from answers */
  headline: string;
  left: string;
  middle: string;
  right: string;
  /** 0–100, how far along the rail is filled */
  progressPercent: number;
  /** Supporting line under headline */
  subline: string | null;
};

function timelinePhrase(timelineRaw: string): string {
  if (!timelineRaw || timelineRaw === "na" || timelineRaw === "prefer_not_say") return "";
  return TIMELINE_SHORT[timelineRaw] || timelineRaw.replace(/_/g, " ");
}

function wantsChildrenPhrase(w: string | null | undefined, narration: "first" | "third"): string | null {
  if (!w || w === "prefer_not_say") return null;
  const I = narration === "first";
  if (w === "yes" || w === "true")
    return I ? "You hope to have children down the line." : "Hopes to have children down the line.";
  if (w === "no" || w === "false")
    return I ? "You're not planning to have children." : "Not planning to have children.";
  if (w === "open") return I ? "You're open-minded about children." : "Open-minded about children.";
  return null;
}

function approachClause(
  approach: string | undefined | null,
  narration: "first" | "third",
): string | null {
  if (!approach) return null;
  const a = approach.trim();
  const I = narration === "first";
  const mapThird: Record<string, string> = {
    values_first: "Prioritizing character and shared values before locking a date.",
    actively_searching: "Actively looking for the right person, not just browsing.",
    open_when_right: "Happy to move forward when the fit genuinely feels right.",
    family_community: "Family and community context matter in how they meet someone.",
    events_social: "Often meets people through events, classes, or social circles.",
    rebuilding: "Taking time to heal and be intentional after something difficult.",
    no_rush: "Deliberately unhurried — prefers depth over rushing milestones.",
  };
  const mapFirst: Record<string, string> = {
    values_first: "You prioritize character and shared values before locking a date.",
    actively_searching: "You're actively looking for the right person, not just browsing.",
    open_when_right: "You're happy to move forward when the fit genuinely feels right.",
    family_community: "Family and community matter in how you meet someone.",
    events_social: "You often meet people through events, classes, or social circles.",
    rebuilding: "You're taking time to heal and be intentional after something difficult.",
    no_rush: "You're deliberately unhurried — depth over rushing milestones.",
  };
  return (I ? mapFirst : mapThird)[a] ?? null;
}

function buildHeadline(
  rawCommitment: string,
  key: "chatting" | "casual" | "serious" | "marriage",
  timelineRaw: string,
  approach: string | null | undefined,
  narration: "first" | "third",
): string {
  const tl = timelinePhrase(timelineRaw);
  const I = narration === "first";

  if (rawCommitment === "engaged") {
    return tl && timelineRaw !== "na" && timelineRaw !== "unsure"
      ? I
        ? `Engaged and heading toward marriage — you're thinking ${tl.toLowerCase()} for the big step.`
        : `Engaged and heading toward marriage — thinking ${tl.toLowerCase()} for the big step.`
      : I
        ? "Engaged — focused on your path to the wedding and what comes after."
        : "Engaged — focused on the path to the wedding and what comes after.";
  }

  if (rawCommitment === "figuring_out" || key === "chatting") {
    if (approach === "actively_searching") {
      return I
        ? "Still mapping what you want, but open and putting real energy into meeting people."
        : "Still mapping what they want, but open and putting real energy into meeting people.";
    }
    if (approach === "no_rush") {
      return I
        ? "Early stage — exploring without pressure while staying honest about your intentions."
        : "Early stage — exploring without pressure while staying honest about intentions.";
    }
    return I
      ? "Getting to know yourself and others before naming a fixed destination."
      : "Getting to know themselves and others before naming a fixed destination.";
  }

  if (key === "casual") {
    if (approach === "open_when_right") {
      return "Dating lightly for now, with room to deepen if the connection earns it.";
    }
    return "Enjoying dating without locking in long-term expectations just yet.";
  }

  if (key === "serious") {
    if (tl && timelineRaw !== "na") {
      return I
        ? `In a serious mindset — if marriage is the goal, you're thinking roughly ${tl.toLowerCase()}.`
        : `In a serious mindset — if marriage is the goal, they're thinking roughly ${tl.toLowerCase()}.`;
    }
    return "Invested in building something real and checking long-term fit before the next step.";
  }

  // marriage-minded
  if (timelineRaw === "within_6mo") {
    return approach === "family_community"
      ? I
        ? "Marriage-minded soon, with family or community part of how you see the journey."
        : "Marriage-minded soon, with family or community part of how they see the journey."
      : "Marriage-focused and thinking on a nearer horizon when the match is right.";
  }
  if (timelineRaw === "2yr_plus" || timelineRaw === "unsure") {
    return I
      ? "Clear on marriage as your direction, flexible on exactly when it happens."
      : "Clear on marriage as the direction, flexible on exactly when it happens.";
  }
  if (tl && timelineRaw !== "na") {
    return I
      ? `Marriage-minded, with a rough horizon around ${tl.toLowerCase()} once you find the right person.`
      : `Marriage-minded, with a rough horizon around ${tl.toLowerCase()} once they find the right person.`;
  }
  return I
    ? "Centered on finding a spouse — timing follows the right connection for you."
    : "Centered on finding a spouse — timing follows the right connection.";
}

function refineProgress(
  base: number,
  key: "chatting" | "casual" | "serious" | "marriage",
  rawCommitment: string,
  timelineRaw: string,
): number {
  let p = base;
  if (rawCommitment === "engaged") p = Math.min(100, p + 10);
  if (key === "marriage") {
    if (timelineRaw === "within_6mo") p = Math.max(p, 92);
    else if (timelineRaw === "6_12mo") p = Math.max(p, 88);
    else if (timelineRaw === "1_2yr") p = Math.max(p, 84);
    else if (timelineRaw === "2yr_plus") p = Math.max(p, 80);
  }
  if (key === "chatting" && timelineRaw === "na") p = Math.min(p, 38);
  return Math.min(100, Math.max(12, Math.round(p)));
}

/**
 * Milestones + copy derived from commitment, timeline, approach, and family intent.
 * All display strings are deterministic from stored answers (no randomness).
 */
export function getMarriageStripMilestones(input: MarriageIntentProfileInput): MarriageStripMilestones {
  const narration = input.narration === "first" ? "first" : "third";
  const rawCommitment = String(input.commitmentIntention ?? "").trim().toLowerCase();
  const key = normalizeCommitmentKey(input.commitmentIntention);
  const idx = Math.max(0, STEPS.findIndex((s) => s.key === key));

  const timelineRaw = String(input.marriageTimeline ?? "").trim();
  const timelineShort = timelineRaw ? TIMELINE_SHORT[timelineRaw] ?? timelineRaw : "";

  const left = STEPS[idx]?.pill ?? "Exploring";

  let middle: string;
  if (rawCommitment === "engaged" && key === "marriage") {
    middle = "Wedding path";
  } else if (idx < STEPS.length - 1) {
    middle = STEPS[idx + 1]!.pill;
  } else {
    middle = "Here now";
  }

  let right: string;
  if (timelineShort && key === "marriage") {
    right = timelineShort;
  } else if (timelineShort && key !== "marriage" && timelineRaw !== "na") {
    right = `Marriage · ${timelineShort}`;
  } else {
    right = "Marriage";
  }

  const baseProgress = Math.round(((idx + 1) / STEPS.length) * 100);
  const progressPercent = refineProgress(baseProgress, key, rawCommitment, timelineRaw);

  const headline = buildHeadline(rawCommitment, key, timelineRaw, input.marriageApproach, narration);

  const tl = timelinePhrase(timelineRaw);
  const approachFrag = approachClause(input.marriageApproach, narration);
  const kidsFrag = wantsChildrenPhrase(input.wantsChildren ?? undefined, narration);
  const detailParts = [tl, approachFrag, kidsFrag].filter(Boolean) as string[];
  const subline = detailParts.length ? detailParts.join(" · ") : null;

  return { headline, left, middle, right, progressPercent, subline };
}
