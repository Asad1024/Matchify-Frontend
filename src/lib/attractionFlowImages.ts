/**
 * AttractionFlow images and card definitions for Flow A.
 * MaleUser = male user selecting female; FemaleUser = female user selecting male.
 * Images live in public/attractionFlow/{MaleUser|FemaleUser}/{1_Looks|2_Energy|3_Lifestyle|4_Future}/
 */
const baseUrl = (typeof import.meta !== "undefined" && import.meta.env?.BASE_URL) ? String(import.meta.env.BASE_URL).replace(/\/$/, "") : "";
const BASE = baseUrl ? `${baseUrl}/attractionFlow` : "/attractionFlow";

export type AttractionCard = {
  id: number;
  image: string;
  label: string;
  description: string;
};

/** Male user (selecting female) – 2 cards per step */
export const ATTRACTION_FLOW_MALE = {
  looks: [
    { id: 1, image: `${BASE}/MaleUser/1_Looks/glamorous_bold.jpg`, label: "Glamorous", description: "Bold and polished" },
    { id: 2, image: `${BASE}/MaleUser/1_Looks/natural_elegant.jpg`, label: "Natural", description: "Elegant and genuine" },
  ] as AttractionCard[],
  energy: [
    { id: 1, image: `${BASE}/MaleUser/2_Energy/powerful_energy.jpg`, label: "Powerful", description: "Intense and strong" },
    { id: 2, image: `${BASE}/MaleUser/2_Energy/warm_energy.jpg`, label: "Warm", description: "Approachable and kind" },
  ] as AttractionCard[],
  lifestyle: [
    { id: 1, image: `${BASE}/MaleUser/3_Lifestyle/ambitious_lifestyle.jpg`, label: "Ambitious", description: "Driven and career-focused" },
    { id: 2, image: `${BASE}/MaleUser/3_Lifestyle/creative_lifestyle.jpg`, label: "Creative", description: "Arts and culture lover" },
  ] as AttractionCard[],
  future: [
    { id: 1, image: `${BASE}/MaleUser/4_Future/family_future.jpg`, label: "Family-Oriented", description: "Marriage and children" },
    { id: 2, image: `${BASE}/MaleUser/4_Future/visionary_future.jpg`, label: "Visionary", description: "Big-picture thinker" },
  ] as AttractionCard[],
};

/** Female user (selecting male) – 2 cards per step */
export const ATTRACTION_FLOW_FEMALE = {
  looks: [
    { id: 1, image: `${BASE}/FemaleUser/1_Looks/confident_traits.jpg`, label: "Confident", description: "Self-assured and strong" },
    { id: 2, image: `${BASE}/FemaleUser/1_Looks/gentle_traits.jpg`, label: "Gentle", description: "Soft and thoughtful" },
  ] as AttractionCard[],
  energy: [
    { id: 1, image: `${BASE}/FemaleUser/2_Energy/driven_energy.jpg`, label: "Driven", description: "Focused and ambitious" },
    { id: 2, image: `${BASE}/FemaleUser/2_Energy/calm_energy.jpg`, label: "Calm", description: "Relaxed and centered" },
  ] as AttractionCard[],
  lifestyle: [
    { id: 1, image: `${BASE}/FemaleUser/3_Lifestyle/elite_lifestyle.jpg`, label: "Elite", description: "Polished and successful" },
    { id: 2, image: `${BASE}/FemaleUser/3_Lifestyle/adventurous_lifestyle.jpg`, label: "Adventurous", description: "Outdoor and bold" },
  ] as AttractionCard[],
  future: [
    { id: 1, image: `${BASE}/FemaleUser/4_Future/stable_future.jpg`, label: "Stable", description: "Secure and dependable" },
    { id: 2, image: `${BASE}/FemaleUser/4_Future/impact_future.jpg`, label: "Visionary", description: "Impact and legacy" },
  ] as AttractionCard[],
};

export type AttractionFlowStep = "looks" | "energy" | "lifestyle" | "future";

export function getAttractionCards(
  gender: "male" | "female" | null | undefined
): typeof ATTRACTION_FLOW_MALE {
  return gender === "female" ? ATTRACTION_FLOW_FEMALE : ATTRACTION_FLOW_MALE;
}

/** Flattened image lists for Flow B (same AttractionFlow images, 8 per gender) */
const FLOW_B_IMAGES_MALE = [
  ...ATTRACTION_FLOW_MALE.looks.map((c) => c.image),
  ...ATTRACTION_FLOW_MALE.energy.map((c) => c.image),
  ...ATTRACTION_FLOW_MALE.lifestyle.map((c) => c.image),
  ...ATTRACTION_FLOW_MALE.future.map((c) => c.image),
];
const FLOW_B_IMAGES_FEMALE = [
  ...ATTRACTION_FLOW_FEMALE.looks.map((c) => c.image),
  ...ATTRACTION_FLOW_FEMALE.energy.map((c) => c.image),
  ...ATTRACTION_FLOW_FEMALE.lifestyle.map((c) => c.image),
  ...ATTRACTION_FLOW_FEMALE.future.map((c) => c.image),
];

/**
 * Returns an AttractionFlow image for Flow B option by index.
 * Cycles through the 8 images for the user's gender (male = female images, female = male images).
 */
export function getFlowBOptionImage(
  index: number,
  gender: "male" | "female" | null | undefined
): string {
  const list = gender === "female" ? FLOW_B_IMAGES_FEMALE : FLOW_B_IMAGES_MALE;
  return list[Math.abs(index) % list.length];
}
