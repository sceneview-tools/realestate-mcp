import { describe, it, expect } from "vitest";
import { estimatePrice } from "../src/tools/estimate-price.js";

describe("estimatePrice", () => {
  const baseInput = {
    address: "456 Oak Avenue",
    city: "San Francisco",
    state: "CA",
    propertyType: "house" as const,
    squareFootage: 2000,
    bedrooms: 3,
    bathrooms: 2,
    yearBuilt: 2010,
    condition: "good" as const,
  };

  it("returns a positive estimated price", () => {
    const result = estimatePrice(baseInput);
    expect(result.estimatedPrice).toBeGreaterThan(0);
    expect(result.currency).toBe("USD");
  });

  it("returns a price range around the estimate", () => {
    const result = estimatePrice(baseInput);
    expect(result.priceRange.low).toBeLessThan(result.estimatedPrice);
    expect(result.priceRange.high).toBeGreaterThan(result.estimatedPrice);
  });

  it("computes price per sqft and sqm", () => {
    const result = estimatePrice(baseInput);
    expect(result.pricePerSqFt).toBeGreaterThan(0);
    expect(result.pricePerSqM).toBeGreaterThan(result.pricePerSqFt); // m2 > sqft
  });

  it("has high confidence with complete data", () => {
    const result = estimatePrice(baseInput);
    expect(result.confidence).toBe("high");
  });

  it("has lower confidence with minimal data", () => {
    const result = estimatePrice({
      address: "123 Unknown St",
      city: "Smalltown",
      propertyType: "house",
    });
    expect(result.confidence).toBe("low");
  });

  it("new construction costs more than needs-work", () => {
    const newBuild = estimatePrice({ ...baseInput, condition: "new" });
    const needsWork = estimatePrice({ ...baseInput, condition: "needs-work" });
    expect(newBuild.estimatedPrice).toBeGreaterThan(needsWork.estimatedPrice);
  });

  it("SF prices are higher than Detroit prices", () => {
    const sf = estimatePrice({ ...baseInput, city: "San Francisco" });
    const detroit = estimatePrice({ ...baseInput, city: "Detroit" });
    expect(sf.estimatedPrice).toBeGreaterThan(detroit.estimatedPrice);
  });

  it("returns price factors", () => {
    const result = estimatePrice(baseInput);
    expect(result.factors.length).toBeGreaterThan(0);
    expect(result.factors[0].factor).toBe("Location");
  });

  it("returns comparable sales", () => {
    const result = estimatePrice(baseInput);
    expect(result.comparables).toHaveLength(3);
    expect(result.comparables[0].address).toBeTruthy();
    expect(result.comparables[0].price).toBeGreaterThan(0);
    expect(result.comparables[0].similarity).toBeGreaterThanOrEqual(70);
  });

  it("adds premium for features like pool", () => {
    const withPool = estimatePrice({
      ...baseInput,
      features: ["Swimming pool", "Hardwood floors"],
    });
    const without = estimatePrice(baseInput);
    expect(withPool.estimatedPrice).toBeGreaterThan(without.estimatedPrice);
  });

  it("returns a market summary string", () => {
    const result = estimatePrice(baseInput);
    expect(result.marketSummary).toContain("Estimated value");
    expect(result.marketSummary).toContain("San Francisco");
  });

  it("includes a disclaimer", () => {
    const result = estimatePrice(baseInput);
    expect(result.disclaimer).toContain("rough estimate");
  });

  it("supports EUR currency", () => {
    const result = estimatePrice({
      ...baseInput,
      city: "Paris",
      country: "France",
      currency: "EUR",
    });
    expect(result.currency).toBe("EUR");
    expect(result.marketSummary).toContain("\u20AC");
  });

  it("handles square meters input", () => {
    const result = estimatePrice({
      address: "10 Rue de la Paix",
      city: "Paris",
      country: "France",
      propertyType: "apartment",
      squareMeters: 80,
    });
    expect(result.estimatedPrice).toBeGreaterThan(0);
    expect(result.pricePerSqM).toBeGreaterThan(0);
  });

  it("is deterministic for the same address", () => {
    const r1 = estimatePrice(baseInput);
    const r2 = estimatePrice(baseInput);
    expect(r1.estimatedPrice).toBe(r2.estimatedPrice);
    expect(r1.comparables[0].address).toBe(r2.comparables[0].address);
  });
});
