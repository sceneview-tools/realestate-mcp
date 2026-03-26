/**
 * property_description — Generate optimized property listing descriptions
 * from basic property information.
 *
 * v2.0: Multi-language (EN/FR), SEO meta tags, structured data (JSON-LD),
 * character counts per platform, and improved description quality.
 */

export type Language = "en" | "fr";

export interface PropertyDescriptionInput {
  address: string;
  propertyType: "house" | "apartment" | "condo" | "townhouse" | "land" | "commercial";
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
  squareMeters?: number;
  lotSize?: string;
  yearBuilt?: number;
  price?: number;
  currency?: "USD" | "EUR" | "GBP" | "CAD";
  features?: string[];
  style?: string;
  condition?: "new" | "renovated" | "good" | "needs-work";
  neighborhood?: string;
  highlights?: string[];
  language?: Language;
  targetAudience?: "general" | "luxury" | "investor" | "first-time-buyer";
}

export interface PropertyDescriptionOutput {
  mls: string;
  social: string;
  luxury: string;
  investor: string;
  headline: string;
  seoKeywords: string[];
  seoTitle: string;
  seoDescription: string;
  jsonLd: object;
  language: Language;
  characterCounts: {
    mls: number;
    social: number;
    luxury: number;
    investor: number;
    headline: number;
  };
}

// ---------------------------------------------------------------------------
// Localization
// ---------------------------------------------------------------------------

const L = {
  en: {
    forSale: "for sale",
    realEstate: "real estate",
    propertyListing: "property listing",
    bedrooms: (n: number) => `${n} bedroom${n !== 1 ? "s" : ""}`,
    bathrooms: (n: number) => `${n} bathroom${n !== 1 ? "s" : ""}`,
    newListing: "NEW LISTING",
    dmForDetails: "DM for details or to schedule a showing!",
    listedAt: "Listed at",
    offeredAt: "Offered at",
    builtIn: "Built in",
    featuresInclude: "Features include",
    situatedOn: "Situated on a",
    lot: "lot",
    locatedIn: "Located in the desirable",
    neighborhood: "neighborhood",
    investmentOpp: "Investment opportunity",
    configuration: "Configuration",
    size: "Size",
    yearBuilt: "Year built",
    condition: "Condition",
    asking: "Asking",
    area: "Area",
    strongRentalDemand: "strong rental demand",
    rareOpportunity: "A rare opportunity for those who demand the extraordinary.",
    propertyTypes: {
      house: "single-family home",
      apartment: "apartment",
      condo: "condominium",
      townhouse: "townhouse",
      land: "lot",
      commercial: "commercial property",
    } as Record<string, string>,
    conditions: {
      new: "brand-new construction",
      renovated: "beautifully renovated",
      good: "well-maintained",
      "needs-work": "full of potential, ready for your vision",
    } as Record<string, string>,
    discerningBuyers: "Discerning buyers will appreciate",
    exceptional: "An exceptional",
    thatRedefines: "that redefines",
    living: "living",
    modernLiving: "modern living",
    distinguished: "This distinguished residence features",
    ofThoughtfullyDesigned: "of thoughtfully designed space",
    sqft: "sq ft",
    livingSpace: "of living space",
  },
  fr: {
    forSale: "\u00E0 vendre",
    realEstate: "immobilier",
    propertyListing: "annonce immobili\u00E8re",
    bedrooms: (n: number) => `${n} chambre${n !== 1 ? "s" : ""}`,
    bathrooms: (n: number) => `${n} salle${n !== 1 ? "s" : ""} de bain`,
    newListing: "NOUVELLE ANNONCE",
    dmForDetails: "Contactez-nous pour une visite !",
    listedAt: "Prix",
    offeredAt: "Propos\u00E9 \u00E0",
    builtIn: "Construit en",
    featuresInclude: "Prestations incluant",
    situatedOn: "Sur un terrain de",
    lot: "",
    locatedIn: "Situ\u00E9 dans le quartier recherch\u00E9 de",
    neighborhood: "",
    investmentOpp: "Opportunit\u00E9 d\u2019investissement",
    configuration: "Configuration",
    size: "Surface",
    yearBuilt: "Ann\u00E9e de construction",
    condition: "\u00C9tat",
    asking: "Prix demand\u00E9",
    area: "Secteur",
    strongRentalDemand: "forte demande locative",
    rareOpportunity: "Une opportunit\u00E9 rare pour les plus exigeants.",
    propertyTypes: {
      house: "maison individuelle",
      apartment: "appartement",
      condo: "copropri\u00E9t\u00E9",
      townhouse: "maison de ville",
      land: "terrain",
      commercial: "local commercial",
    } as Record<string, string>,
    conditions: {
      new: "construction neuve",
      renovated: "enti\u00E8rement r\u00E9nov\u00E9",
      good: "bon \u00E9tat g\u00E9n\u00E9ral",
      "needs-work": "id\u00E9al pour les amateurs de r\u00E9novation",
    } as Record<string, string>,
    discerningBuyers: "Les acqu\u00E9reurs exigeants appr\u00E9cieront",
    exceptional: "Un(e)",
    thatRedefines: "d\u2019exception qui red\u00E9finit",
    living: "le cadre de vie",
    modernLiving: "l\u2019art de vivre",
    distinguished: "Cette r\u00E9sidence de caract\u00E8re offre",
    ofThoughtfullyDesigned: "d\u2019espaces de vie soigneusement agenc\u00E9s",
    sqft: "sq ft",
    livingSpace: "de surface habitable",
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(price: number, currency: string): string {
  const symbols: Record<string, string> = { USD: "$", EUR: "\u20AC", GBP: "\u00A3", CAD: "CA$" };
  const sym = symbols[currency] ?? "$";
  if (price >= 1_000_000) {
    return `${sym}${(price / 1_000_000).toFixed(1)}M`;
  }
  return `${sym}${price.toLocaleString("en-US")}`;
}

function formatArea(input: PropertyDescriptionInput, lang: Language): string {
  if (input.squareMeters) {
    return `${input.squareMeters.toLocaleString("en-US")} m\u00B2`;
  }
  if (input.squareFootage) {
    if (lang === "fr") {
      const m2 = Math.round(input.squareFootage * 0.0929);
      return `${m2.toLocaleString("en-US")} m\u00B2`;
    }
    return `${input.squareFootage.toLocaleString("en-US")} sq ft`;
  }
  return "";
}

function buildBedBath(input: PropertyDescriptionInput, t: typeof L.en): string {
  const parts: string[] = [];
  if (input.bedrooms !== undefined) parts.push(t.bedrooms(input.bedrooms));
  if (input.bathrooms !== undefined) parts.push(t.bathrooms(input.bathrooms));
  return parts.join(", ");
}

function buildFeatureList(features: string[]): string {
  if (features.length === 0) return "";
  if (features.length === 1) return features[0];
  const last = features[features.length - 1];
  const rest = features.slice(0, -1);
  return `${rest.join(", ")}, and ${last}`;
}

function buildFeatureListFr(features: string[]): string {
  if (features.length === 0) return "";
  if (features.length === 1) return features[0];
  const last = features[features.length - 1];
  const rest = features.slice(0, -1);
  return `${rest.join(", ")} et ${last}`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function generatePropertyDescription(input: PropertyDescriptionInput): PropertyDescriptionOutput {
  const lang: Language = input.language ?? "en";
  const t = L[lang];
  const currency = input.currency ?? "USD";
  const typeLabel = t.propertyTypes[input.propertyType] ?? input.propertyType;
  const condition = t.conditions[input.condition ?? "good"];
  const bedBath = buildBedBath(input, t);
  const featureText = lang === "fr"
    ? buildFeatureListFr(input.features ?? [])
    : buildFeatureList(input.features ?? []);
  const priceText = input.price ? formatPrice(input.price, currency) : "";
  const areaText = formatArea(input, lang);

  // --- Headline ---
  const headlineParts: string[] = [];
  if (input.bedrooms) headlineParts.push(`${input.bedrooms}BR`);
  if (input.bathrooms) headlineParts.push(`${input.bathrooms}BA`);
  const typeShort = input.propertyType.charAt(0).toUpperCase() + input.propertyType.slice(1);
  const headline = [
    condition.charAt(0).toUpperCase() + condition.slice(1),
    headlineParts.length > 0 ? headlineParts.join("/") : "",
    typeShort,
    input.neighborhood ? `${lang === "fr" ? "\u00E0" : "in"} ${input.neighborhood}` : "",
    priceText ? `| ${priceText}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  // --- MLS Description ---
  const mlsParts: string[] = [];
  mlsParts.push(
    `${lang === "fr" ? "Ce" : "This"} ${condition} ${typeLabel}${bedBath ? ` ${lang === "fr" ? "propose" : "offers"} ${bedBath}` : ""}${areaText ? ` ${lang === "fr" ? "avec" : "with"} ${areaText} ${t.livingSpace}` : ""}.`
  );
  if (input.yearBuilt) mlsParts.push(`${t.builtIn} ${input.yearBuilt}.`);
  if (featureText) mlsParts.push(`${t.featuresInclude} ${featureText}.`);
  if (input.lotSize) mlsParts.push(`${t.situatedOn} ${input.lotSize} ${t.lot}.`.replace(/  /g, " "));
  if (input.neighborhood) mlsParts.push(`${t.locatedIn} ${input.neighborhood} ${t.neighborhood}.`.replace(/  /g, " "));
  if (input.highlights && input.highlights.length > 0) {
    mlsParts.push(input.highlights.join(". ") + ".");
  }
  if (priceText) mlsParts.push(`${t.listedAt} ${priceText}.`);
  const mls = mlsParts.join(" ");

  // --- Social Media Description ---
  const socialParts: string[] = [];
  socialParts.push(`\uD83C\uDFE0 ${t.newListing}${priceText ? ` | ${priceText}` : ""}`);
  socialParts.push("");
  socialParts.push(
    `\u2728 ${condition.charAt(0).toUpperCase() + condition.slice(1)} ${typeLabel}${bedBath ? ` \u2014 ${bedBath}` : ""}${areaText ? ` \u2014 ${areaText}` : ""}`
  );
  if (input.features && input.features.length > 0) {
    socialParts.push("");
    input.features.slice(0, 5).forEach((f) => socialParts.push(`\u2022 ${f}`));
  }
  socialParts.push("");
  socialParts.push(`\uD83D\uDCCD ${input.address}`);
  socialParts.push("");
  socialParts.push(t.dmForDetails);
  const social = socialParts.join("\n");

  // --- Luxury Description ---
  const luxParts: string[] = [];
  luxParts.push(
    `${t.exceptional} ${typeLabel} ${t.thatRedefines} ${input.neighborhood ? `${input.neighborhood} ${t.living}` : t.modernLiving}.`
  );
  if (bedBath || areaText) {
    luxParts.push(
      `${t.distinguished} ${[bedBath, areaText].filter(Boolean).join(` ${lang === "fr" ? "sur" : "across"} `)} ${t.ofThoughtfullyDesigned}.`
    );
  }
  if (featureText) luxParts.push(`${t.discerningBuyers} ${featureText}.`);
  if (input.highlights && input.highlights.length > 0) {
    luxParts.push(input.highlights.join(". ") + ".");
  }
  luxParts.push(t.rareOpportunity);
  if (priceText) luxParts.push(`${t.offeredAt} ${priceText}.`);
  const luxury = luxParts.join(" ");

  // --- Investor Description ---
  const invParts: string[] = [];
  invParts.push(`${t.investmentOpp}: ${typeLabel} ${lang === "fr" ? "\u00E0" : "at"} ${input.address}.`);
  if (bedBath) invParts.push(`${t.configuration}: ${bedBath}.`);
  if (areaText) invParts.push(`${t.size}: ${areaText}.`);
  if (input.yearBuilt) invParts.push(`${t.yearBuilt}: ${input.yearBuilt}.`);
  if (input.condition) invParts.push(`${t.condition}: ${input.condition}.`);
  if (input.lotSize) invParts.push(`${t.lot ? t.lot + ": " : "Terrain: "}${input.lotSize}.`);
  if (priceText) invParts.push(`${t.asking}: ${priceText}.`);
  if (input.neighborhood) invParts.push(`${t.area}: ${input.neighborhood} \u2014 ${t.strongRentalDemand}.`);
  const investor = invParts.join(" ");

  // --- SEO ---
  const seoKeywords: string[] = [
    input.propertyType,
    t.forSale,
    input.address,
    input.neighborhood ?? "",
    bedBath,
    t.realEstate,
    t.propertyListing,
    ...(input.features?.slice(0, 5) ?? []),
  ].filter(Boolean);

  const seoTitle = [
    headline.slice(0, 60),
    `| ${t.realEstate.charAt(0).toUpperCase() + t.realEstate.slice(1)}`,
  ].join(" ").slice(0, 70);

  const seoDescription = mls.slice(0, 155) + (mls.length > 155 ? "..." : "");

  // --- JSON-LD Structured Data ---
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: headline,
    description: mls,
    url: `https://example.com/listing/${encodeURIComponent(input.address)}`,
  };
  if (input.price) {
    jsonLd.offers = {
      "@type": "Offer",
      price: input.price,
      priceCurrency: currency,
    };
  }
  if (input.squareFootage || input.squareMeters) {
    jsonLd.floorSize = {
      "@type": "QuantitativeValue",
      value: input.squareMeters ?? Math.round((input.squareFootage ?? 0) * 0.0929),
      unitCode: "MTK",
    };
  }
  if (input.bedrooms) jsonLd.numberOfBedrooms = input.bedrooms;
  if (input.bathrooms) jsonLd.numberOfBathroomsTotal = input.bathrooms;
  jsonLd.address = {
    "@type": "PostalAddress",
    streetAddress: input.address,
  };

  const characterCounts = {
    mls: mls.length,
    social: social.length,
    luxury: luxury.length,
    investor: investor.length,
    headline: headline.length,
  };

  return {
    mls,
    social,
    luxury,
    investor,
    headline,
    seoKeywords,
    seoTitle,
    seoDescription,
    jsonLd,
    language: lang,
    characterCounts,
  };
}
