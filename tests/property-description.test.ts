import { describe, it, expect } from "vitest";
import { generatePropertyDescription } from "../src/tools/property-description.js";

describe("generatePropertyDescription", () => {
  const baseInput = {
    address: "456 Oak Avenue, Springfield, IL 62701",
    propertyType: "house" as const,
    bedrooms: 3,
    bathrooms: 2,
    squareFootage: 1800,
    price: 350000,
    features: ["Hardwood floors", "Granite counters", "Stainless appliances"],
    neighborhood: "Historic Downtown",
  };

  it("generates all 4 description variants", () => {
    const result = generatePropertyDescription(baseInput);

    expect(result.mls).toBeTruthy();
    expect(result.social).toBeTruthy();
    expect(result.luxury).toBeTruthy();
    expect(result.investor).toBeTruthy();
    expect(result.headline).toBeTruthy();
  });

  it("includes price in formatted output", () => {
    const result = generatePropertyDescription(baseInput);
    expect(result.mls).toContain("$350,000");
    expect(result.headline).toContain("$350");
  });

  it("formats million-dollar prices correctly", () => {
    const result = generatePropertyDescription({
      ...baseInput,
      price: 2500000,
    });
    expect(result.headline).toContain("$2.5M");
  });

  it("includes bed/bath in MLS description", () => {
    const result = generatePropertyDescription(baseInput);
    expect(result.mls).toContain("3 bedrooms");
    expect(result.mls).toContain("2 bathrooms");
  });

  it("includes features in descriptions", () => {
    const result = generatePropertyDescription(baseInput);
    expect(result.mls).toContain("Hardwood floors");
    expect(result.mls).toContain("Granite counters");
  });

  it("generates SEO keywords", () => {
    const result = generatePropertyDescription(baseInput);
    expect(result.seoKeywords).toContain("house");
    expect(result.seoKeywords).toContain("for sale");
    expect(result.seoKeywords).toContain("real estate");
  });

  it("handles minimal input", () => {
    const result = generatePropertyDescription({
      address: "789 Simple St",
      propertyType: "apartment",
    });
    expect(result.mls).toBeTruthy();
    expect(result.headline).toBeTruthy();
  });

  it("social description has emoji formatting", () => {
    const result = generatePropertyDescription(baseInput);
    expect(result.social).toContain("NEW LISTING");
    expect(result.social).toContain("DM for details");
  });
});
