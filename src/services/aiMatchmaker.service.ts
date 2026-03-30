import { buildApiUrl, getAuthHeaders } from "./api";

export interface AttractionBlueprint {
  flowType: 'flow-a' | 'flow-b';
  stylePreferences?: string[];
  energyPreferences?: string[];
  lifestylePreferences?: string[];
  futureVision?: string[];
  bodyPreferences?: string[];
  faceShapePreferences?: string[];
  eyeShapePreferences?: string[];
  lipShapePreferences?: string[];
  coreValues?: string[];
  communicationStyle?: string[];
  conflictStyle?: string[];
  hobbies?: string[];
  socialLife?: string[];
  foodPreferences?: string[];
  career?: string[];
  timeline?: string;
  kidsPreference?: string;
  dealbreakers?: string[];
  mustHaves?: string[];
  weights?: {
    looks?: number;
    energy?: number;
    lifestyle?: number;
    goals?: number;
    personality?: number;
    values?: number;
  };
}

export interface CategoryScore {
  score: number; // 0-10
  details: string[];
  suggestions: string[];
}

export interface AttributeMatch {
  match: boolean;
  details: string;
}

export interface AIMatch {
  id: string;
  name: string;
  age?: number;
  image?: string;
  bio?: string;
  compatibility: number;
  mutualCompatibility?: number;
  reasons: string[];
  emphasis: string;
  categories?: {
    futureTogether: CategoryScore;
    lifestyleTravel: CategoryScore;
    fitness: CategoryScore;
    foodCompatibility: CategoryScore;
    communication: CategoryScore;
    values: CategoryScore;
  };
  attributeMatches?: {
    age: AttributeMatch;
    relationshipGoal: AttributeMatch;
    values: AttributeMatch;
    lifestyle: AttributeMatch;
    career: AttributeMatch;
    education?: AttributeMatch;
    income?: AttributeMatch;
  };
}

export const saveAttractionBlueprint = async (
  userId: string,
  blueprint: AttractionBlueprint
): Promise<void> => {
  const response = await fetch(buildApiUrl(`/api/users/${userId}/attraction-blueprint`), {
    method: "POST",
    headers: getAuthHeaders(true),
    credentials: "include",
    body: JSON.stringify(blueprint),
  });
  
  if (!response.ok) {
    let message = 'Failed to save attraction blueprint';
    try {
      const data = await response.json();
      if (data?.message) message = data.message;
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(message);
  }
};

export type AiRankingSource = "openai" | "fallback";

export type AIMatchesResponse = {
  rankingSource: AiRankingSource;
  matches: AIMatch[];
};

export type GetAIMatchesOptions = {
  /** 1–8; default 8 (Discover sorting / insights). */
  limit?: number;
  /** Omit people already shown as curated picks (requires auth). */
  excludeShown?: boolean;
};

export const getAIMatches = async (
  userId: string,
  opts?: GetAIMatchesOptions,
): Promise<AIMatchesResponse> => {
  const params = new URLSearchParams();
  if (opts?.limit != null && opts.limit >= 1) {
    params.set("limit", String(Math.min(8, Math.floor(opts.limit))));
  }
  if (opts?.excludeShown) params.set("excludeShown", "1");
  const q = params.toString();
  const path = `/api/users/${userId}/ai-matches${q ? `?${q}` : ""}`;
  const response = await fetch(buildApiUrl(path), {
    credentials: "include",
    headers: getAuthHeaders(false),
  });

  if (!response.ok) {
    throw new Error("Failed to get AI matches");
  }

  const data: unknown = await response.json();
  if (Array.isArray(data)) {
    return { rankingSource: "fallback", matches: data as AIMatch[] };
  }
  const obj = data as { rankingSource?: string; matches?: AIMatch[] };
  const rankingSource: AiRankingSource =
    obj.rankingSource === "openai" ? "openai" : "fallback";
  return {
    rankingSource,
    matches: Array.isArray(obj.matches) ? obj.matches : [],
  };
};

/** Unlock the 30-question flow so the user can change answers and save a new blueprint. */
export async function reopenAIMatchmakerSession(userId: string): Promise<void> {
  const response = await fetch(buildApiUrl(`/api/users/${userId}/ai-matchmaker/reopen`), {
    method: "POST",
    headers: getAuthHeaders(true),
    credentials: "include",
    body: JSON.stringify({}),
  });
  if (!response.ok) {
    let message = "Could not reopen AI Matchmaker";
    try {
      const j = (await response.json()) as { message?: string };
      if (j?.message) message = j.message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  const { queryClient } = await import("@/lib/queryClient");
  await queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
}

/** Temporary testing helper: clear saved questionnaire answers so user can submit again. */
export async function resetAIMatchmakerSubmission(userId: string): Promise<void> {
  const response = await fetch(buildApiUrl(`/api/users/${userId}/ai-matchmaker/submission`), {
    method: "DELETE",
    headers: getAuthHeaders(true),
    credentials: "include",
  });
  if (!response.ok) {
    let message = "Could not reset AI Matchmaker submission";
    try {
      const j = (await response.json()) as { message?: string };
      if (j?.message) message = j.message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  const { queryClient } = await import("@/lib/queryClient");
  await queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
}

export type ClaimNextCuratedResult = {
  rankingSource: AiRankingSource;
  match: AIMatch | null;
};

/** Server assigns one pick per cooldown, updates profile, and creates an in-app notification when a match exists. */
export async function claimNextCuratedMatch(userId: string): Promise<ClaimNextCuratedResult> {
  const response = await fetch(buildApiUrl(`/api/users/${userId}/curated-match/claim-next`), {
    method: "POST",
    headers: getAuthHeaders(true),
    credentials: "include",
    body: JSON.stringify({}),
  });

  if (response.status === 409) {
    const err = new Error("CuratedMatchCooldown") as Error & { status: number; msLeft?: number };
    err.status = 409;
    try {
      const j = (await response.json()) as { msLeft?: number };
      if (typeof j.msLeft === "number") err.msLeft = j.msLeft;
    } catch {
      /* ignore */
    }
    throw err;
  }

  if (!response.ok) {
    let message = "Could not claim curated match";
    try {
      const j = (await response.json()) as { message?: string };
      if (j?.message) message = j.message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  const data = (await response.json()) as ClaimNextCuratedResult;
  const { queryClient } = await import("@/lib/queryClient");
  await queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
  return data;
}

/** Remember a curated pick so the next `excludeShown` request can surface someone new. */
export async function ackCuratedMatchShown(
  userId: string,
  shownUserId: string,
): Promise<void> {
  const response = await fetch(buildApiUrl(`/api/users/${userId}/curated-match-shown`), {
    method: "POST",
    headers: getAuthHeaders(true),
    credentials: "include",
    body: JSON.stringify({ shownUserId }),
  });
  if (!response.ok) {
    let message = "Failed to record curated match";
    try {
      const j = (await response.json()) as { message?: string };
      if (j?.message) message = j.message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  const { queryClient } = await import("@/lib/queryClient");
  await queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
}

