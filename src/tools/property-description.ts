/**
 * property_description — Generate optimized property listing descriptions
 * from basic property information.
 *
 * Produces multiple description variants for different platforms
 * (MLS, social media, luxury, investor-focused).
 */

export interface PropertyDescriptionInput {
  address: string;
  propertyType: "house" | "apartment" | "condo" | "townhouse" | "land" | "commercial";
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
  lotSize?: string;
  yearBuilt?: number;
  price?: number;
  features?: string[];
  style?: string;
  condition?: "new" | "renovated" | "good" | "needs-work";
  neighborhood?: string;
  highlights?: string[];
}

export interface PropertyDescriptionOutput {
  mls: string;
  social: string;
  luxury: string;
  investor: string;
  headline: string;
  seoKeywords: string[];
}

function formatPrice(price: number): string {
  if (price >= 1_000_000) {
    return `$${(price / 1_000_000).toFixed(1)}M`;
  }
  return `$${price.toLocaleString("en-US")}`;
}

function formatSqft(sqft: number): string {
  return sqft.toLocaleString("en-US");
}

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  house: "single-family home",
  apartment: "apartment",
  condo: "condominium",
  townhouse: "townhouse",
  land: "lot",
  commercial: "commercial property",
};

const CONDITION_PHRASES: Record<string, string> = {
  new: "brand-new construction",
  renovated: "beautifully renovated",
  good: "well-maintained",
  "needs-work": "full of potential, ready for your vision",
};

function buildBedBath(input: PropertyDescriptionInput): string {
  const parts: string[] = [];
  if (input.bedrooms !== undefined) parts.push(`${input.bedrooms} bedroom${input.bedrooms !== 1 ? "s" : ""}`);
  if (input.bathrooms !== undefined) parts.push(`${input.bathrooms} bathroom${input.bathrooms !== 1 ? "s" : ""}`);
  return parts.join(", ");
}

function buildFeatureList(features: string[]): string {
  if (features.length === 0) return "";
  if (features.length === 1) return features[0];
  const last = features[features.length - 1];
  const rest = features.slice(0, -1);
  return `${rest.join(", ")}, and ${last}`;
}

export function generatePropertyDescription(input: PropertyDescriptionInput): PropertyDescriptionOutput {
  const typeLabel = PROPERTY_TYPE_LABELS[input.propertyType] ?? input.propertyType;
  const condition = CONDITION_PHRASES[input.condition ?? "good"];
  const bedBath = buildBedBath(input);
  const featureText = buildFeatureList(input.features ?? []);
  const priceText = input.price ? formatPrice(input.price) : "";
  const sqftText = input.squareFootage ? `${formatSqft(input.squareFootage)} sq ft` : "";

  // --- Headline ---
  const headlineParts: string[] = [];
  if (input.bedrooms) headlineParts.push(`${input.bedrooms}BR`);
  if (input.bathrooms) headlineParts.push(`${input.bathrooms}BA`);
  const typeShort = input.propertyType.charAt(0).toUpperCase() + input.propertyType.slice(1);
  const headline = [
    condition.charAt(0).toUpperCase() + condition.slice(1),
    headlineParts.length > 0 ? headlineParts.join("/") : "",
    typeShort,
    input.neighborhood ? `in ${input.neighborhood}` : "",
    priceText ? `| ${priceText}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  // --- MLS Description ---
  const mlsParts: string[] = [];
  mlsParts.push(
    `This ${condition} ${typeLabel}${bedBath ? ` offers ${bedBath}` : ""}${sqftText ? ` with ${sqftText} of living space` : ""}.`
  );
  if (input.yearBuilt) mlsParts.push(`Built in ${input.yearBuilt}.`);
  if (featureText) mlsParts.push(`Features include ${featureText}.`);
  if (input.lotSize) mlsParts.push(`Situated on a ${input.lotSize} lot.`);
  if (input.neighborhood) mlsParts.push(`Located in the desirable ${input.neighborhood} neighborhood.`);
  if (input.highlights && input.highlights.length > 0) {
    mlsParts.push(input.highlights.join(". ") + ".");
  }
  if (priceText) mlsParts.push(`Listed at ${priceText}.`);
  const mls = mlsParts.join(" ");

  // --- Social Media Description ---
  const socialEmojis = ["🏠", "✨", "📍", "💰"];
  const socialParts: string[] = [];
  socialParts.push(`${socialEmojis[0]} NEW LISTING${priceText ? ` | ${priceText}` : ""}`);
  socialParts.push("");
  socialParts.push(
    `${socialEmojis[1]} ${condition.charAt(0).toUpperCase() + condition.slice(1)} ${typeLabel}${bedBath ? ` — ${bedBath}` : ""}${sqftText ? ` — ${sqftText}` : ""}`
  );
  if (input.features && input.features.length > 0) {
    socialParts.push("");
    input.features.slice(0, 5).forEach((f) => socialParts.push(`  ${f}`));
  }
  socialParts.push("");
  socialParts.push(`${socialEmojis[2]} ${input.address}`);
  socialParts.push("");
  socialParts.push("DM for details or to schedule a showing!");
  const social = socialParts.join("\n");

  // --- Luxury Description ---
  const luxParts: string[] = [];
  luxParts.push(
    `An exceptional ${typeLabel} that redefines ${input.neighborhood ? `${input.neighborhood} living` : "modern living"}.`
  );
  if (bedBath || sqftText) {
    luxParts.push(
      `This distinguished residence features ${[bedBath, sqftText].filter(Boolean).join(" across ")} of thoughtfully designed space.`
    );
  }
  if (featureText) luxParts.push(`Discerning buyers will appreciate ${featureText}.`);
  if (input.highlights && input.highlights.length > 0) {
    luxParts.push(input.highlights.join(". ") + ".");
  }
  luxParts.push("A rare opportunity for those who demand the extraordinary.");
  if (priceText) luxParts.push(`Offered at ${priceText}.`);
  const luxury = luxParts.join(" ");

  // --- Investor Description ---
  const invParts: string[] = [];
  invParts.push(
    `Investment opportunity: ${typeLabel} at ${input.address}.`
  );
  if (bedBath) invParts.push(`Configuration: ${bedBath}.`);
  if (sqftText) invParts.push(`Size: ${sqftText}.`);
  if (input.yearBuilt) invParts.push(`Year built: ${input.yearBuilt}.`);
  if (input.condition) invParts.push(`Condition: ${input.condition}.`);
  if (input.lotSize) invParts.push(`Lot: ${input.lotSize}.`);
  if (priceText) invParts.push(`Asking: ${priceText}.`);
  if (input.neighborhood) invParts.push(`Area: ${input.neighborhood} — strong rental demand.`);
  const investor = invParts.join(" ");

  // --- SEO Keywords ---
  const seoKeywords: string[] = [
    input.propertyType,
    "for sale",
    input.address,
    input.neighborhood ?? "",
    bedBath,
    "real estate",
    "property listing",
    ...(input.features?.slice(0, 5) ?? []),
  ].filter(Boolean);

  return { mls, social, luxury, investor, headline, seoKeywords };
}
