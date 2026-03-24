import { describe, expect, it } from "vitest";
import {
  FEMALE_FLOW_ORDER,
  FEMALE_ONLY_QUESTION_IDS,
  FLOW_B_STEP_COUNT,
  MALE_FLOW_ORDER,
  MALE_ONLY_QUESTION_IDS,
  SHARED_QUESTION_IDS,
} from "./flowBStepOrder";

describe("AI Matchmaker Flow B (30 questions)", () => {
  it("male and female flows each have exactly 30 steps", () => {
    expect(MALE_FLOW_ORDER.length).toBe(FLOW_B_STEP_COUNT);
    expect(FEMALE_FLOW_ORDER.length).toBe(FLOW_B_STEP_COUNT);
    expect(FLOW_B_STEP_COUNT).toBe(30);
  });

  it("no duplicate step ids within a flow", () => {
    expect(new Set(MALE_FLOW_ORDER).size).toBe(MALE_FLOW_ORDER.length);
    expect(new Set(FEMALE_FLOW_ORDER).size).toBe(FEMALE_FLOW_ORDER.length);
  });

  it("male and female gender-specific questions are COMPLETELY DIFFERENT (no overlap)", () => {
    const maleSet = new Set(MALE_ONLY_QUESTION_IDS);
    const femaleSet = new Set(FEMALE_ONLY_QUESTION_IDS);
    for (const id of maleSet) {
      expect(femaleSet.has(id)).toBe(false);
    }
    for (const id of femaleSet) {
      expect(maleSet.has(id)).toBe(false);
    }
  });

  it("each flow has exactly 15 gender-specific questions + 15 shared questions", () => {
    const sharedSet = new Set(SHARED_QUESTION_IDS);
    const maleSpecific = MALE_FLOW_ORDER.filter((id) => !sharedSet.has(id as never));
    const femaleSpecific = FEMALE_FLOW_ORDER.filter((id) => !sharedSet.has(id as never));
    expect(maleSpecific.length).toBe(15);
    expect(femaleSpecific.length).toBe(15);
    expect(MALE_FLOW_ORDER.filter((id) => sharedSet.has(id as never)).length).toBe(15);
    expect(FEMALE_FLOW_ORDER.filter((id) => sharedSet.has(id as never)).length).toBe(15);
  });

  it("male questions are framed about women (m_ prefix)", () => {
    for (const id of MALE_ONLY_QUESTION_IDS) {
      expect(id.startsWith("m_")).toBe(true);
    }
  });

  it("female questions are framed about men (f_ prefix)", () => {
    for (const id of FEMALE_ONLY_QUESTION_IDS) {
      expect(id.startsWith("f_")).toBe(true);
    }
  });
});
