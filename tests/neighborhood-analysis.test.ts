import { describe, it, expect } from "vitest";
import { generateNeighborhoodAnalysis } from "../src/tools/neighborhood-analysis.js";

describe("generateNeighborhoodAnalysis", () => {
  it("returns a complete analysis for an address", () => {
    const result = generateNeighborhoodAnalysis({
      address: "123 Main St, Springfield, IL",
    });

    expect(result.address).toBe("123 Main St, Springfield, IL");
    expect(result.summary).toBeTruthy();
    expect(result.scores.walkScore).toBeGreaterThanOrEqual(0);
    expect(result.scores.walkScore).toBeLessThanOrEqual(100);
    expect(result.schools.length).toBeGreaterThan(0);
    expect(result.transit).toBeTruthy();
    expect(result.amenities.length).toBeGreaterThan(0);
    expect(result.demographics).toBeTruthy();
    expect(result.safetyProfile).toBeTruthy();
    expect(result.marketContext).toBeTruthy();
  });

  it("produces deterministic results for the same address", () => {
    const a = generateNeighborhoodAnalysis({ address: "456 Oak Ave" });
    const b = generateNeighborhoodAnalysis({ address: "456 Oak Ave" });

    expect(a.scores.walkScore).toBe(b.scores.walkScore);
    expect(a.demographics.medianAge).toBe(b.demographics.medianAge);
    expect(a.marketContext.medianHomePrice).toBe(b.marketContext.medianHomePrice);
  });

  it("produces different results for different addresses", () => {
    const a = generateNeighborhoodAnalysis({ address: "123 Main St" });
    const b = generateNeighborhoodAnalysis({ address: "789 Elm Dr" });

    // Extremely unlikely to match on all three
    const sameAll =
      a.scores.walkScore === b.scores.walkScore &&
      a.demographics.medianAge === b.demographics.medianAge &&
      a.marketContext.avgDaysOnMarket === b.marketContext.avgDaysOnMarket;
    expect(sameAll).toBe(false);
  });

  it("includes school ratings", () => {
    const result = generateNeighborhoodAnalysis({ address: "Test Address" });
    for (const school of result.schools) {
      expect(school.rating).toBeGreaterThanOrEqual(1);
      expect(school.rating).toBeLessThanOrEqual(10);
      expect(school.distance).toMatch(/mi$/);
    }
  });

  it("market type is consistent with days on market", () => {
    // Run a few addresses and check consistency
    for (const addr of ["A", "B", "C", "D", "E", "F", "G"]) {
      const result = generateNeighborhoodAnalysis({ address: addr });
      const dom = result.marketContext.avgDaysOnMarket;
      if (dom < 30) expect(result.marketContext.marketType).toBe("seller");
      else if (dom >= 60) expect(result.marketContext.marketType).toBe("buyer");
      else expect(result.marketContext.marketType).toBe("balanced");
    }
  });

  it("uses city name in summary when provided", () => {
    const result = generateNeighborhoodAnalysis({
      address: "100 Test Rd",
      city: "Portland",
    });
    expect(result.summary).toContain("Portland");
  });
});
