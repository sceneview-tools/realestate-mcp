import { describe, it, expect } from "vitest";
import { generateStagingSuggestions } from "../src/tools/staging-suggestions.js";

describe("generateStagingSuggestions", () => {
  it("returns suggestions for a bedroom", () => {
    const result = generateStagingSuggestions({ roomType: "bedroom" });

    expect(result.roomType).toBe("bedroom");
    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.colorPalette).toBeTruthy();
    expect(result.tips.length).toBeGreaterThan(0);
  });

  it("filters by budget level", () => {
    const low = generateStagingSuggestions({ roomType: "living-room", budget: "low" });
    const high = generateStagingSuggestions({ roomType: "living-room", budget: "high" });

    expect(low.suggestions.length).toBeLessThan(high.suggestions.length);
    expect(low.suggestions.every((s) => s.priority === "essential")).toBe(true);
  });

  it("returns correct color palette for style", () => {
    const scandi = generateStagingSuggestions({ roomType: "bedroom", style: "scandinavian" });
    expect(scandi.colorPalette.description).toContain("white");

    const industrial = generateStagingSuggestions({ roomType: "office", style: "industrial" });
    expect(industrial.colorPalette.description).toContain("bronze");
  });

  it("covers all room types", () => {
    const roomTypes = [
      "bedroom", "living-room", "dining-room", "kitchen",
      "bathroom", "office", "nursery", "outdoor",
    ] as const;

    for (const roomType of roomTypes) {
      const result = generateStagingSuggestions({ roomType });
      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.tips.length).toBeGreaterThan(0);
    }
  });

  it("includes placement instructions for each item", () => {
    const result = generateStagingSuggestions({ roomType: "dining-room" });
    for (const s of result.suggestions) {
      expect(s.placement).toBeTruthy();
      expect(s.rationale).toBeTruthy();
      expect(s.estimatedCost).toBeTruthy();
    }
  });

  it("includes estimated total cost", () => {
    const result = generateStagingSuggestions({ roomType: "kitchen", budget: "medium" });
    expect(result.estimatedTotalCost).toMatch(/\$/);
  });
});
