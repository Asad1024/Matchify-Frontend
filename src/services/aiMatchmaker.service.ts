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
  const response = await fetch(`/api/users/${userId}/attraction-blueprint`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
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

export const getAIMatches = async (userId: string): Promise<AIMatch[]> => {
  const response = await fetch(`/api/users/${userId}/ai-matches`);
  
  if (!response.ok) {
    throw new Error('Failed to get AI matches');
  }
  
  return response.json();
};

