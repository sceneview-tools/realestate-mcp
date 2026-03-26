import { describe, it, expect } from "vitest";
import { compareProperties } from "../src/tools/compare-properties.js";

describe("compareProperties", () => {
  const twoProperties = {
    properties: [
      {
        name: "Oak House",
        address: "123 Oak St",
        price: 400000,
        propertyType: "house" as const,
        bedrooms: 3,
        bathrooms: 2,
        squareFootage: 2000,
        yearBuilt: 2015,
        condition: "good" as const,
        features: ["Pool", "Garage"],
      },
      {
        name: "Elm Condo",
        address: "456 Elm Ave",
        price: 300000,
        propertyType: "condo" as const,
        bedrooms: 2,
        bathrooms: 1,
        squareFootage: 1200,
        yearBuilt: 2020,
        condition: "new" as const,
        features: ["Gym"],
      },
    ],
  };

  it("compares two properties and picks a winner", () => {
    const result = compareProperties(twoProperties);
    expect(result.winner).toBeTruthy();
    expect(["Oak House", "Elm Condo"]).toContain(result.winner);
    expect(result.winnerReason).toBeTruthy();
  });

  it("returns comparison rows for key attributes", () => {
    const result = compareProperties(twoProperties);
    const attributes = result.comparison.map((r) => r.attribute);
    expect(attributes).toContain("Price");
    expect(attributes).toContain("Bedrooms");
    expect(attributes).toContain("Condition");
  });

  it("returns scores for each property", () => {
    const result = compareProperties(twoProperties);
    expect(result.scores).toHaveLength(2);
    expect(result.scores[0].overallScore).toBeGreaterThan(0);
    expect(result.scores[0].overallScore).toBeLessThanOrEqual(10);
    expect(result.scores[0].breakdown.length).toBeGreaterThan(0);
  });

  it("returns pros and cons per property", () => {
    const result = compareProperties(twoProperties);
    // At least one property should have pros
    const hasPros = result.scores.some((s) => s.pros.length > 0);
    expect(hasPros).toBe(true);
  });

  it("generates Markdown output by default", () => {
    const result = compareProperties(twoProperties);
    expect(result.markdown).toContain("## Property Comparison");
    expect(result.markdown).toContain("Oak House");
    expect(result.markdown).toContain("Elm Condo");
  });

  it("generates HTML output by default", () => {
    const result = compareProperties(twoProperties);
    expect(result.html).toContain("<table");
    expect(result.html).toContain("Oak House");
  });

  it("returns only markdown when format is markdown", () => {
    const result = compareProperties({ ...twoProperties, format: "markdown" });
    expect(result.markdown).toBeTruthy();
    expect(result.html).toBe("");
  });

  it("returns only html when format is html", () => {
    const result = compareProperties({ ...twoProperties, format: "html" });
    expect(result.html).toBeTruthy();
    expect(result.markdown).toBe("");
  });

  it("handles 3+ properties", () => {
    const result = compareProperties({
      properties: [
        { name: "A", address: "1 St", price: 300000, bedrooms: 2, squareFootage: 1500 },
        { name: "B", address: "2 St", price: 400000, bedrooms: 3, squareFootage: 2000 },
        { name: "C", address: "3 St", price: 500000, bedrooms: 4, squareFootage: 2500 },
      ],
    });
    expect(result.scores).toHaveLength(3);
    expect(result.comparison[0].values).toHaveLength(3);
  });

  it("marks best value in each comparison row", () => {
    const result = compareProperties(twoProperties);
    const priceRow = result.comparison.find((r) => r.attribute === "Price");
    expect(priceRow).toBeDefined();
    expect(priceRow!.best).toBeDefined();
    // Elm Condo (index 1) is cheaper
    expect(priceRow!.best).toBe(1);
  });

  it("returns a summary string", () => {
    const result = compareProperties(twoProperties);
    expect(result.summary).toContain("Compared 2 properties");
    expect(result.summary).toContain("Winner");
  });

  it("supports EUR currency", () => {
    const result = compareProperties({
      ...twoProperties,
      currency: "EUR",
    });
    const priceRow = result.comparison.find((r) => r.attribute === "Price");
    expect(priceRow!.values[0]).toContain("\u20AC");
  });

  it("includes HOA fees when provided", () => {
    const result = compareProperties({
      properties: [
        { name: "A", address: "1 St", price: 300000, hoaFees: 250 },
        { name: "B", address: "2 St", price: 400000, hoaFees: 0 },
      ],
    });
    const hoaRow = result.comparison.find((r) => r.attribute === "HOA/month");
    expect(hoaRow).toBeDefined();
  });

  it("includes neighborhood when provided", () => {
    const result = compareProperties({
      properties: [
        { name: "A", address: "1 St", price: 300000, neighborhood: "Downtown" },
        { name: "B", address: "2 St", price: 400000, neighborhood: "Suburbs" },
      ],
    });
    const nhRow = result.comparison.find((r) => r.attribute === "Neighborhood");
    expect(nhRow).toBeDefined();
    expect(nhRow!.values).toContain("Downtown");
  });
});
