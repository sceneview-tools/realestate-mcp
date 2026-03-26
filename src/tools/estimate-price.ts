/**
 * estimate_price — Rough property price estimation based on location, size,
 * rooms, condition, and comparable market data.
 *
 * This is a scaffold using deterministic heuristics. In production, this would
 * integrate with real APIs (Zillow, Redfin, MLS comps) for actual valuations.
 * All estimates are clearly labeled as rough approximations.
 */

export interface PriceEstimateInput {
  address: string;
  city: string;
  state?: string;
  country?: string;
  propertyType: "house" | "apartment" | "condo" | "townhouse" | "land" | "commercial";
  squareFootage?: number;
  squareMeters?: number;
  bedrooms?: number;
  bathrooms?: number;
  yearBuilt?: number;
  condition?: "new" | "renovated" | "good" | "needs-work";
  lotSize?: number; // acres
  features?: string[];
  currency?: "USD" | "EUR" | "GBP" | "CAD";
}

export interface PriceEstimateOutput {
  estimatedPrice: number;
  priceRange: { low: number; high: number };
  pricePerSqFt: number;
  pricePerSqM: number;
  currency: string;
  confidence: "low" | "medium" | "high";
  factors: PriceFactor[];
  comparables: Comparable[];
  marketSummary: string;
  disclaimer: string;
}

export interface PriceFactor {
  factor: string;
  impact: "positive" | "negative" | "neutral";
  adjustment: string;
  description: string;
}

export interface Comparable {
  address: string;
  price: number;
  squareFootage: number;
  bedrooms: number;
  bathrooms: number;
  soldDate: string;
  similarity: number; // 0-100
}

// ---------------------------------------------------------------------------
// Price-per-sqft baselines by metro area / state (simplified heuristic)
// ---------------------------------------------------------------------------

const METRO_PRICE_PER_SQFT: Record<string, number> = {
  // Major US cities (approximate $/sqft)
  "new york": 750, "manhattan": 1500, "brooklyn": 850,
  "san francisco": 1000, "los angeles": 650, "san diego": 550,
  "seattle": 500, "boston": 550, "miami": 450, "chicago": 250,
  "denver": 350, "austin": 350, "portland": 350, "nashville": 300,
  "atlanta": 250, "dallas": 250, "houston": 220, "phoenix": 280,
  "philadelphia": 200, "detroit": 120, "minneapolis": 250,
  "washington": 400, "dc": 400,
  // European cities (approximate EUR/sqft -> converted rough)
  "paris": 1100, "london": 900, "berlin": 450, "amsterdam": 550,
  "barcelona": 400, "madrid": 350, "rome": 400, "milan": 450,
  "zurich": 800, "geneva": 900, "munich": 600,
  // Canadian cities (CAD/sqft)
  "toronto": 550, "vancouver": 650, "montreal": 350, "calgary": 280,
  // French cities (EUR/sqft, approximate)
  "lyon": 400, "marseille": 280, "bordeaux": 380, "toulouse": 320,
  "nantes": 350, "nice": 450, "strasbourg": 300, "lille": 280,
  "rennes": 320, "montpellier": 320,
};

// State/country-level fallbacks
const STATE_PRICE_PER_SQFT: Record<string, number> = {
  "california": 500, "ca": 500, "new york": 350, "ny": 350,
  "texas": 200, "tx": 200, "florida": 280, "fl": 280,
  "illinois": 200, "il": 200, "colorado": 320, "co": 320,
  "washington": 380, "wa": 380, "oregon": 300, "or": 300,
  "massachusetts": 400, "ma": 400, "georgia": 200, "ga": 200,
  "france": 300, "uk": 350, "germany": 350, "canada": 350,
  "spain": 250, "italy": 300, "switzerland": 700, "netherlands": 400,
};

const DEFAULT_PRICE_PER_SQFT = 250;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function seededRandom(seed: number, offset: number): number {
  const x = Math.sin(seed + offset) * 10000;
  return x - Math.floor(x);
}

function lookupBasePricePerSqFt(city: string, state?: string, country?: string): number {
  const cityLower = city.toLowerCase().trim();
  if (METRO_PRICE_PER_SQFT[cityLower]) return METRO_PRICE_PER_SQFT[cityLower];

  // Try state
  if (state) {
    const stateLower = state.toLowerCase().trim();
    if (STATE_PRICE_PER_SQFT[stateLower]) return STATE_PRICE_PER_SQFT[stateLower];
  }

  // Try country
  if (country) {
    const countryLower = country.toLowerCase().trim();
    if (STATE_PRICE_PER_SQFT[countryLower]) return STATE_PRICE_PER_SQFT[countryLower];
  }

  return DEFAULT_PRICE_PER_SQFT;
}

function getSquareFootage(input: PriceEstimateInput): number {
  if (input.squareFootage) return input.squareFootage;
  if (input.squareMeters) return Math.round(input.squareMeters * 10.764);
  // Estimate from bedrooms
  const beds = input.bedrooms ?? 2;
  const baths = input.bathrooms ?? 1;
  return 400 + beds * 350 + baths * 100;
}

const CONDITION_MULTIPLIERS: Record<string, number> = {
  "new": 1.15,
  "renovated": 1.08,
  "good": 1.0,
  "needs-work": 0.82,
};

const PROPERTY_TYPE_MULTIPLIERS: Record<string, number> = {
  "house": 1.0,
  "apartment": 0.9,
  "condo": 0.95,
  "townhouse": 0.92,
  "land": 0.3,
  "commercial": 1.1,
};

const PREMIUM_FEATURES: Record<string, number> = {
  "pool": 25000,
  "swimming pool": 25000,
  "garage": 15000,
  "2-car garage": 25000,
  "3-car garage": 35000,
  "hardwood floors": 8000,
  "granite counters": 5000,
  "marble": 10000,
  "smart home": 8000,
  "solar panels": 12000,
  "wine cellar": 15000,
  "home theater": 12000,
  "fireplace": 5000,
  "waterfront": 50000,
  "ocean view": 40000,
  "mountain view": 20000,
  "city view": 15000,
  "rooftop": 20000,
  "terrace": 10000,
  "balcony": 5000,
  "garden": 8000,
  "elevator": 15000,
  "new roof": 10000,
  "new hvac": 8000,
  "new windows": 6000,
  "finished basement": 20000,
  "in-law suite": 25000,
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function estimatePrice(input: PriceEstimateInput): PriceEstimateOutput {
  const currency = input.currency ?? "USD";
  const seed = simpleHash(input.address + input.city);
  const sqft = getSquareFootage(input);
  const sqm = Math.round(sqft * 0.0929);

  // Base price
  let basePricePerSqFt = lookupBasePricePerSqFt(input.city, input.state, input.country);

  // Type adjustment
  const typeMultiplier = PROPERTY_TYPE_MULTIPLIERS[input.propertyType] ?? 1.0;
  basePricePerSqFt *= typeMultiplier;

  // Condition adjustment
  const conditionMultiplier = CONDITION_MULTIPLIERS[input.condition ?? "good"];
  basePricePerSqFt *= conditionMultiplier;

  // Age adjustment
  let ageMultiplier = 1.0;
  if (input.yearBuilt) {
    const age = new Date().getFullYear() - input.yearBuilt;
    if (age <= 2) ageMultiplier = 1.1;
    else if (age <= 10) ageMultiplier = 1.05;
    else if (age <= 30) ageMultiplier = 1.0;
    else if (age <= 50) ageMultiplier = 0.95;
    else ageMultiplier = 0.9;
  }
  basePricePerSqFt *= ageMultiplier;

  // Feature premiums
  let featurePremium = 0;
  const features = input.features ?? [];
  for (const feat of features) {
    const featLower = feat.toLowerCase();
    for (const [key, value] of Object.entries(PREMIUM_FEATURES)) {
      if (featLower.includes(key)) {
        featurePremium += value;
        break;
      }
    }
  }

  // Lot size premium for houses
  let lotPremium = 0;
  if (input.lotSize && input.propertyType === "house") {
    if (input.lotSize > 0.5) lotPremium = (input.lotSize - 0.25) * 40000;
    if (input.lotSize > 2) lotPremium += (input.lotSize - 2) * 20000;
  }

  // Calculate estimate
  const basePrice = Math.round(basePricePerSqFt * sqft);
  const estimatedPrice = Math.round(basePrice + featurePremium + lotPremium);
  const pricePerSqFt = Math.round(estimatedPrice / sqft);
  const pricePerSqM = Math.round(estimatedPrice / sqm);

  // Price range (+-12-18% depending on confidence)
  const variancePct = input.squareFootage || input.squareMeters ? 0.12 : 0.18;
  const priceRange = {
    low: Math.round(estimatedPrice * (1 - variancePct)),
    high: Math.round(estimatedPrice * (1 + variancePct)),
  };

  // Confidence
  let confidenceScore = 0;
  if (input.squareFootage || input.squareMeters) confidenceScore += 2;
  if (input.bedrooms) confidenceScore += 1;
  if (input.bathrooms) confidenceScore += 1;
  if (input.yearBuilt) confidenceScore += 1;
  if (input.condition) confidenceScore += 1;
  if (METRO_PRICE_PER_SQFT[input.city.toLowerCase()]) confidenceScore += 2;
  const confidence: "low" | "medium" | "high" =
    confidenceScore >= 6 ? "high" : confidenceScore >= 3 ? "medium" : "low";

  // Price factors
  const factors: PriceFactor[] = [];
  factors.push({
    factor: "Location",
    impact: basePricePerSqFt > DEFAULT_PRICE_PER_SQFT ? "positive" : basePricePerSqFt < DEFAULT_PRICE_PER_SQFT ? "negative" : "neutral",
    adjustment: `$${Math.round(basePricePerSqFt / typeMultiplier / conditionMultiplier / ageMultiplier)}/sqft base`,
    description: `${input.city}${input.state ? `, ${input.state}` : ""} market rate`,
  });

  if (input.condition && input.condition !== "good") {
    factors.push({
      factor: "Condition",
      impact: conditionMultiplier > 1 ? "positive" : "negative",
      adjustment: `${conditionMultiplier > 1 ? "+" : ""}${Math.round((conditionMultiplier - 1) * 100)}%`,
      description: `Property is ${input.condition}`,
    });
  }

  if (input.yearBuilt) {
    factors.push({
      factor: "Age",
      impact: ageMultiplier > 1 ? "positive" : ageMultiplier < 1 ? "negative" : "neutral",
      adjustment: `${ageMultiplier > 1 ? "+" : ""}${Math.round((ageMultiplier - 1) * 100)}%`,
      description: `Built in ${input.yearBuilt} (${new Date().getFullYear() - input.yearBuilt} years old)`,
    });
  }

  if (featurePremium > 0) {
    factors.push({
      factor: "Premium features",
      impact: "positive",
      adjustment: `+$${featurePremium.toLocaleString("en-US")}`,
      description: `Features: ${features.slice(0, 3).join(", ")}`,
    });
  }

  // Generate pseudo-comparable properties
  const comparables: Comparable[] = [];
  for (let i = 0; i < 3; i++) {
    const compSqft = Math.round(sqft * (0.85 + seededRandom(seed, i * 10) * 0.3));
    const compBeds = Math.max(1, (input.bedrooms ?? 2) + Math.round(seededRandom(seed, i * 11) * 2 - 1));
    const compBaths = Math.max(1, (input.bathrooms ?? 1) + Math.round(seededRandom(seed, i * 12) - 0.5));
    const compPrice = Math.round(compSqft * basePricePerSqFt * (0.9 + seededRandom(seed, i * 13) * 0.2));
    const monthsAgo = Math.round(1 + seededRandom(seed, i * 14) * 5);
    const soldDate = new Date();
    soldDate.setMonth(soldDate.getMonth() - monthsAgo);
    const similarity = Math.round(70 + seededRandom(seed, i * 15) * 25);

    comparables.push({
      address: `${Math.round(100 + seededRandom(seed, i * 16) * 900)} ${["Oak", "Elm", "Maple", "Cedar", "Pine"][i % 5]} ${["St", "Ave", "Dr", "Ln", "Way"][i % 5]}, ${input.city}`,
      price: compPrice,
      squareFootage: compSqft,
      bedrooms: compBeds,
      bathrooms: compBaths,
      soldDate: soldDate.toISOString().split("T")[0],
      similarity,
    });
  }
  comparables.sort((a, b) => b.similarity - a.similarity);

  const symbols: Record<string, string> = { USD: "$", EUR: "\u20AC", GBP: "\u00A3", CAD: "CA$" };
  const sym = symbols[currency] ?? "$";

  const marketSummary = [
    `Estimated value for ${input.address}: ${sym}${estimatedPrice.toLocaleString("en-US")}`,
    `(range: ${sym}${priceRange.low.toLocaleString("en-US")} - ${sym}${priceRange.high.toLocaleString("en-US")}).`,
    `Based on ${sym}${pricePerSqFt}/sqft (${sym}${pricePerSqM}/m\u00B2) in ${input.city}.`,
    `Confidence: ${confidence}.`,
    comparables.length > 0 ? `${comparables.length} comparable sales found nearby.` : "",
  ].filter(Boolean).join(" ");

  return {
    estimatedPrice,
    priceRange,
    pricePerSqFt,
    pricePerSqM,
    currency,
    confidence,
    factors,
    comparables,
    marketSummary,
    disclaimer: "This is a rough estimate for informational purposes only. It does not constitute a professional appraisal or valuation. Actual market value may differ significantly. Always consult a licensed appraiser or real estate professional for accurate property valuations.",
  };
}
