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

  // --- v2.0 new tests ---

  it("generates French descriptions when language is fr", () => {
    const result = generatePropertyDescription({
      ...baseInput,
      language: "fr",
    });
    expect(result.language).toBe("fr");
    expect(result.social).toContain("NOUVELLE ANNONCE");
    expect(result.social).toContain("Contactez-nous");
    expect(result.mls).toContain("propose");
  });

  it("generates SEO title and description", () => {
    const result = generatePropertyDescription(baseInput);
    expect(result.seoTitle).toBeTruthy();
    expect(result.seoTitle.length).toBeLessThanOrEqual(70);
    expect(result.seoDescription).toBeTruthy();
    expect(result.seoDescription.length).toBeLessThanOrEqual(160);
  });

  it("generates JSON-LD structured data", () => {
    const result = generatePropertyDescription(baseInput);
    expect(result.jsonLd).toBeDefined();
    expect((result.jsonLd as any)["@context"]).toBe("https://schema.org");
    expect((result.jsonLd as any)["@type"]).toBe("RealEstateListing");
    expect((result.jsonLd as any).numberOfBedrooms).toBe(3);
  });

  it("includes character counts for all variants", () => {
    const result = generatePropertyDescription(baseInput);
    expect(result.characterCounts).toBeDefined();
    expect(result.characterCounts.mls).toBeGreaterThan(0);
    expect(result.characterCounts.social).toBeGreaterThan(0);
    expect(result.characterCounts.headline).toBeGreaterThan(0);
  });

  it("supports EUR currency", () => {
    const result = generatePropertyDescription({
      ...baseInput,
      currency: "EUR",
      price: 500000,
    });
    expect(result.mls).toContain("\u20AC");
  });

  it("supports square meters input", () => {
    const result = generatePropertyDescription({
      ...baseInput,
      squareMeters: 150,
      squareFootage: undefined,
    });
    expect(result.mls).toContain("150");
    expect(result.mls).toContain("m\u00B2");
  });

  it("French description converts sqft to m2", () => {
    const result = generatePropertyDescription({
      ...baseInput,
      language: "fr",
    });
    // 1800 sqft ~ 167 m2
    expect(result.mls).toContain("m\u00B2");
  });
});
