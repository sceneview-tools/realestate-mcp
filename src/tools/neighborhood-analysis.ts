/**
 * neighborhood_analysis — Generate a neighborhood summary for a property address.
 *
 * In production this would integrate with real APIs (Google Places, Walk Score,
 * Census Bureau, school ratings). This scaffold generates realistic structured
 * output that agents can present to clients.
 */

export interface NeighborhoodInput {
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
  radius?: number; // miles, default 1
  focus?: ("schools" | "transit" | "dining" | "safety" | "demographics" | "parks")[];
}

export interface NeighborhoodOutput {
  address: string;
  summary: string;
  scores: NeighborhoodScores;
  schools: SchoolInfo[];
  transit: TransitInfo;
  amenities: AmenityCategory[];
  demographics: DemographicSummary;
  safetyProfile: SafetyProfile;
  marketContext: MarketContext;
}

interface NeighborhoodScores {
  walkScore: number;
  transitScore: number;
  bikeScore: number;
  overallLivability: number;
  description: string;
}

interface SchoolInfo {
  name: string;
  type: "elementary" | "middle" | "high" | "private";
  rating: number; // 1-10
  distance: string;
}

interface TransitInfo {
  nearestBusStop: string;
  nearestTrainStation: string;
  commuteToDowntown: string;
  transitOptions: string[];
}

interface AmenityCategory {
  category: string;
  items: { name: string; distance: string; rating?: number }[];
}

interface DemographicSummary {
  medianAge: number;
  medianHouseholdIncome: string;
  ownerOccupied: string;
  collegeEducated: string;
  populationDensity: string;
}

interface SafetyProfile {
  crimeIndex: string;
  trend: "improving" | "stable" | "declining";
  comparedToCity: string;
  notes: string;
}

interface MarketContext {
  medianHomePrice: string;
  priceChange1Year: string;
  avgDaysOnMarket: number;
  inventoryLevel: string;
  marketType: "seller" | "buyer" | "balanced";
}

/**
 * Generates a deterministic-ish hash from a string to seed pseudo-random values.
 * This ensures the same address always gets the same generated data.
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

function seededRandom(seed: number, offset: number = 0): number {
  const x = Math.sin(seed + offset) * 10000;
  return x - Math.floor(x);
}

function pickRange(seed: number, offset: number, min: number, max: number): number {
  return Math.round(min + seededRandom(seed, offset) * (max - min));
}

export function generateNeighborhoodAnalysis(input: NeighborhoodInput): NeighborhoodOutput {
  const seed = simpleHash(input.address);
  const city = input.city ?? "the area";

  const walkScore = pickRange(seed, 1, 40, 95);
  const transitScore = pickRange(seed, 2, 20, 85);
  const bikeScore = pickRange(seed, 3, 30, 90);
  const livability = Math.round((walkScore + transitScore + bikeScore) / 3);

  let walkDesc: string;
  if (walkScore >= 90) walkDesc = "Walker's Paradise";
  else if (walkScore >= 70) walkDesc = "Very Walkable";
  else if (walkScore >= 50) walkDesc = "Somewhat Walkable";
  else walkDesc = "Car-Dependent";

  const scores: NeighborhoodScores = {
    walkScore,
    transitScore,
    bikeScore,
    overallLivability: livability,
    description: `${walkDesc} — daily errands ${walkScore >= 70 ? "do not" : "may"} require a car`,
  };

  const schoolNames = [
    ["Lincoln Elementary", "Washington Elementary", "Jefferson Elementary"],
    ["Martin Luther King Jr. Middle", "Roosevelt Middle", "Adams Middle"],
    ["Central High", "Valley High", "Lakeside High"],
    ["St. Mary's Academy", "Montessori School", "The Learning Tree"],
  ];

  const schools: SchoolInfo[] = [
    { name: schoolNames[0][seed % 3], type: "elementary", rating: pickRange(seed, 10, 5, 10), distance: `${(seededRandom(seed, 11) * 1.5 + 0.2).toFixed(1)} mi` },
    { name: schoolNames[1][seed % 3], type: "middle", rating: pickRange(seed, 12, 4, 9), distance: `${(seededRandom(seed, 13) * 2 + 0.5).toFixed(1)} mi` },
    { name: schoolNames[2][seed % 3], type: "high", rating: pickRange(seed, 14, 5, 10), distance: `${(seededRandom(seed, 15) * 3 + 0.5).toFixed(1)} mi` },
  ];

  const transit: TransitInfo = {
    nearestBusStop: `${(seededRandom(seed, 20) * 0.5 + 0.1).toFixed(1)} mi`,
    nearestTrainStation: `${(seededRandom(seed, 21) * 3 + 0.5).toFixed(1)} mi`,
    commuteToDowntown: `${pickRange(seed, 22, 10, 45)} min`,
    transitOptions: ["Bus", transitScore > 50 ? "Light Rail" : "Park & Ride", "Rideshare"].filter(Boolean),
  };

  const amenities: AmenityCategory[] = [
    {
      category: "Dining & Coffee",
      items: [
        { name: "Local cafe", distance: "0.2 mi", rating: 4.5 },
        { name: "Family restaurant", distance: "0.4 mi", rating: 4.2 },
        { name: "Grocery store", distance: `${(seededRandom(seed, 30) * 0.8 + 0.3).toFixed(1)} mi`, rating: 4.0 },
      ],
    },
    {
      category: "Parks & Recreation",
      items: [
        { name: "Community park", distance: `${(seededRandom(seed, 31) * 0.6 + 0.1).toFixed(1)} mi` },
        { name: "Dog park", distance: `${(seededRandom(seed, 32) * 1.0 + 0.3).toFixed(1)} mi` },
        { name: "Fitness center", distance: `${(seededRandom(seed, 33) * 1.5 + 0.3).toFixed(1)} mi` },
      ],
    },
    {
      category: "Healthcare",
      items: [
        { name: "Urgent care", distance: `${(seededRandom(seed, 34) * 2.0 + 0.5).toFixed(1)} mi` },
        { name: "Hospital", distance: `${(seededRandom(seed, 35) * 5.0 + 1.0).toFixed(1)} mi` },
        { name: "Pharmacy", distance: `${(seededRandom(seed, 36) * 0.8 + 0.2).toFixed(1)} mi` },
      ],
    },
  ];

  const medianIncome = pickRange(seed, 40, 45, 150) * 1000;
  const demographics: DemographicSummary = {
    medianAge: pickRange(seed, 41, 28, 52),
    medianHouseholdIncome: `$${medianIncome.toLocaleString("en-US")}`,
    ownerOccupied: `${pickRange(seed, 42, 40, 85)}%`,
    collegeEducated: `${pickRange(seed, 43, 25, 70)}%`,
    populationDensity: `${pickRange(seed, 44, 1000, 8000).toLocaleString("en-US")} per sq mi`,
  };

  const safetyRating = pickRange(seed, 50, 2, 9);
  const safetyProfile: SafetyProfile = {
    crimeIndex: safetyRating >= 7 ? "Low" : safetyRating >= 4 ? "Moderate" : "Higher than average",
    trend: safetyRating >= 6 ? "improving" : safetyRating >= 4 ? "stable" : "stable",
    comparedToCity: safetyRating >= 6 ? `${pickRange(seed, 51, 15, 40)}% below city average` : `Near city average`,
    notes: safetyRating >= 7
      ? "Active neighborhood watch program. Well-lit streets."
      : "Standard urban environment. Normal precautions recommended.",
  };

  const medianPrice = pickRange(seed, 60, 200, 1500) * 1000;
  const priceChangeNum = pickRange(seed, 61, -5, 15);
  const daysOnMarket = pickRange(seed, 62, 10, 90);
  const marketContext: MarketContext = {
    medianHomePrice: `$${medianPrice.toLocaleString("en-US")}`,
    priceChange1Year: `${priceChangeNum >= 0 ? "+" : ""}${priceChangeNum}%`,
    avgDaysOnMarket: daysOnMarket,
    inventoryLevel: daysOnMarket < 30 ? "Low" : daysOnMarket < 60 ? "Moderate" : "High",
    marketType: daysOnMarket < 30 ? "seller" : daysOnMarket < 60 ? "balanced" : "buyer",
  };

  const summary = [
    `The neighborhood around ${input.address} in ${city} is a ${walkDesc.toLowerCase()} area`,
    `with a livability score of ${livability}/100.`,
    schools[0].rating >= 7
      ? `Local schools are well-rated (${schools[0].rating}/10 elementary).`
      : `Local schools have room for improvement.`,
    `The median home price is ${marketContext.medianHomePrice}`,
    `(${marketContext.priceChange1Year} year-over-year).`,
    `It is currently a ${marketContext.marketType}'s market`,
    `with homes averaging ${daysOnMarket} days on market.`,
    safetyProfile.crimeIndex === "Low"
      ? "The area has a strong safety profile."
      : "Safety is comparable to the broader city.",
  ].join(" ");

  return {
    address: input.address,
    summary,
    scores,
    schools,
    transit,
    amenities,
    demographics,
    safetyProfile,
    marketContext,
  };
}
