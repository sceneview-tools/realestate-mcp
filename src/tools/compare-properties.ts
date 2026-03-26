/**
 * compare_properties — Side-by-side property comparison.
 *
 * Takes 2-5 properties and produces a structured comparison table
 * with scoring, recommendations, and formatted output (Markdown + HTML).
 */

export interface ComparePropertiesInput {
  properties: PropertyForComparison[];
  priorities?: ("price" | "size" | "location" | "condition" | "bedrooms" | "value")[];
  format?: "markdown" | "html" | "both";
  currency?: "USD" | "EUR" | "GBP" | "CAD";
}

export interface PropertyForComparison {
  name: string;
  address: string;
  price: number;
  propertyType?: "house" | "apartment" | "condo" | "townhouse" | "land" | "commercial";
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
  squareMeters?: number;
  yearBuilt?: number;
  condition?: "new" | "renovated" | "good" | "needs-work";
  features?: string[];
  lotSize?: string;
  hoaFees?: number;
  parkingSpaces?: number;
  neighborhood?: string;
}

export interface ComparePropertiesOutput {
  comparison: ComparisonRow[];
  scores: PropertyScore[];
  winner: string;
  winnerReason: string;
  markdown: string;
  html: string;
  summary: string;
}

export interface ComparisonRow {
  attribute: string;
  values: (string | number)[];
  best?: number; // index of best value
  unit?: string;
}

export interface PropertyScore {
  name: string;
  address: string;
  overallScore: number;
  breakdown: { category: string; score: number; weight: number }[];
  pros: string[];
  cons: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$", EUR: "\u20AC", GBP: "\u00A3", CAD: "CA$",
};

function formatPrice(price: number, symbol: string): string {
  if (price >= 1_000_000) return `${symbol}${(price / 1_000_000).toFixed(2)}M`;
  return `${symbol}${price.toLocaleString("en-US")}`;
}

function getSqft(p: PropertyForComparison): number | undefined {
  if (p.squareFootage) return p.squareFootage;
  if (p.squareMeters) return Math.round(p.squareMeters * 10.764);
  return undefined;
}

function getSqm(p: PropertyForComparison): number | undefined {
  if (p.squareMeters) return p.squareMeters;
  if (p.squareFootage) return Math.round(p.squareFootage * 0.0929);
  return undefined;
}

const CONDITION_SCORES: Record<string, number> = {
  "new": 10, "renovated": 8, "good": 6, "needs-work": 3,
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function compareProperties(input: ComparePropertiesInput): ComparePropertiesOutput {
  const properties = input.properties;
  const currency = input.currency ?? "USD";
  const sym = CURRENCY_SYMBOLS[currency] ?? "$";
  const format = input.format ?? "both";
  const priorities = input.priorities ?? ["price", "size", "bedrooms", "condition", "value"];

  // Build comparison rows
  const rows: ComparisonRow[] = [];

  // Price
  const prices = properties.map((p) => p.price);
  const minPrice = Math.min(...prices);
  rows.push({
    attribute: "Price",
    values: properties.map((p) => formatPrice(p.price, sym)),
    best: prices.indexOf(minPrice),
  });

  // Price per sqft
  const ppsf = properties.map((p) => {
    const sqft = getSqft(p);
    return sqft ? Math.round(p.price / sqft) : null;
  });
  if (ppsf.some((v) => v !== null)) {
    const validPpsf = ppsf.filter((v): v is number => v !== null);
    const minPpsf = Math.min(...validPpsf);
    rows.push({
      attribute: "Price/sqft",
      values: ppsf.map((v) => v !== null ? `${sym}${v}` : "N/A"),
      best: ppsf.indexOf(minPpsf),
      unit: "/sqft",
    });
  }

  // Size
  const sqfts = properties.map((p) => getSqft(p));
  if (sqfts.some((v) => v !== undefined)) {
    const validSqfts = sqfts.filter((v): v is number => v !== undefined);
    const maxSqft = Math.max(...validSqfts);
    rows.push({
      attribute: "Size (sqft)",
      values: sqfts.map((v) => v !== undefined ? v.toLocaleString("en-US") : "N/A"),
      best: sqfts.indexOf(maxSqft),
      unit: "sqft",
    });
  }

  const sqms = properties.map((p) => getSqm(p));
  if (sqms.some((v) => v !== undefined)) {
    const validSqms = sqms.filter((v): v is number => v !== undefined);
    const maxSqm = Math.max(...validSqms);
    rows.push({
      attribute: "Size (m\u00B2)",
      values: sqms.map((v) => v !== undefined ? `${v}` : "N/A"),
      best: sqms.indexOf(maxSqm),
      unit: "m\u00B2",
    });
  }

  // Bedrooms
  const beds = properties.map((p) => p.bedrooms);
  if (beds.some((v) => v !== undefined)) {
    const validBeds = beds.filter((v): v is number => v !== undefined);
    const maxBeds = Math.max(...validBeds);
    rows.push({
      attribute: "Bedrooms",
      values: beds.map((v) => v !== undefined ? v : "N/A"),
      best: beds.indexOf(maxBeds),
    });
  }

  // Bathrooms
  const baths = properties.map((p) => p.bathrooms);
  if (baths.some((v) => v !== undefined)) {
    const validBaths = baths.filter((v): v is number => v !== undefined);
    const maxBaths = Math.max(...validBaths);
    rows.push({
      attribute: "Bathrooms",
      values: baths.map((v) => v !== undefined ? v : "N/A"),
      best: baths.indexOf(maxBaths),
    });
  }

  // Year built
  const years = properties.map((p) => p.yearBuilt);
  if (years.some((v) => v !== undefined)) {
    const validYears = years.filter((v): v is number => v !== undefined);
    const maxYear = Math.max(...validYears);
    rows.push({
      attribute: "Year built",
      values: years.map((v) => v !== undefined ? v : "N/A"),
      best: years.indexOf(maxYear),
    });
  }

  // Condition
  const conditions = properties.map((p) => p.condition ?? "good");
  rows.push({
    attribute: "Condition",
    values: conditions,
    best: conditions.indexOf(
      conditions.reduce((best, c) =>
        (CONDITION_SCORES[c] ?? 0) > (CONDITION_SCORES[best] ?? 0) ? c : best
      )
    ),
  });

  // Property type
  rows.push({
    attribute: "Type",
    values: properties.map((p) => p.propertyType ?? "N/A"),
  });

  // HOA fees
  const hoas = properties.map((p) => p.hoaFees);
  if (hoas.some((v) => v !== undefined)) {
    const validHoas = hoas.filter((v): v is number => v !== undefined);
    const minHoa = Math.min(...validHoas);
    rows.push({
      attribute: "HOA/month",
      values: hoas.map((v) => v !== undefined ? `${sym}${v}` : "None"),
      best: hoas.indexOf(minHoa),
    });
  }

  // Parking
  const parking = properties.map((p) => p.parkingSpaces);
  if (parking.some((v) => v !== undefined)) {
    const validParking = parking.filter((v): v is number => v !== undefined);
    const maxParking = Math.max(...validParking);
    rows.push({
      attribute: "Parking",
      values: parking.map((v) => v !== undefined ? v : "N/A"),
      best: parking.indexOf(maxParking),
    });
  }

  // Features count
  rows.push({
    attribute: "Features",
    values: properties.map((p) => (p.features ?? []).length),
  });

  // Neighborhood
  const neighborhoods = properties.map((p) => p.neighborhood);
  if (neighborhoods.some((v) => v !== undefined)) {
    rows.push({
      attribute: "Neighborhood",
      values: neighborhoods.map((v) => v ?? "N/A"),
    });
  }

  // --- Scoring ---
  const priorityWeights: Record<string, number> = {
    price: 3, size: 2, bedrooms: 2, condition: 2, value: 3, location: 1,
  };

  const scores: PropertyScore[] = properties.map((p, idx) => {
    const breakdown: { category: string; score: number; weight: number }[] = [];
    const pros: string[] = [];
    const cons: string[] = [];

    // Price score (lower is better)
    const priceScore = Math.round(10 * (1 - (p.price - minPrice) / (Math.max(...prices) - minPrice + 1)));
    const priceWeight = priorityWeights.price ?? 2;
    breakdown.push({ category: "Price", score: priceScore, weight: priceWeight });
    if (p.price === minPrice) pros.push("Lowest price");
    if (p.price === Math.max(...prices)) cons.push("Highest price");

    // Size score
    const sqft = getSqft(p);
    if (sqft) {
      const allSqft = properties.map((pp) => getSqft(pp) ?? 0);
      const maxSq = Math.max(...allSqft);
      const sizeScore = maxSq > 0 ? Math.round(10 * sqft / maxSq) : 5;
      breakdown.push({ category: "Size", score: sizeScore, weight: priorityWeights.size ?? 2 });
      if (sqft === maxSq) pros.push("Largest property");
    }

    // Value score (price per sqft, lower is better)
    if (sqft && sqft > 0) {
      const ppsfVal = p.price / sqft;
      const allPpsf = properties.map((pp) => {
        const s = getSqft(pp);
        return s && s > 0 ? pp.price / s : Infinity;
      });
      const minVal = Math.min(...allPpsf);
      const maxVal = Math.max(...allPpsf.filter((v) => v < Infinity));
      const valueScore = maxVal > minVal
        ? Math.round(10 * (1 - (ppsfVal - minVal) / (maxVal - minVal)))
        : 7;
      breakdown.push({ category: "Value", score: valueScore, weight: priorityWeights.value ?? 3 });
      if (ppsfVal === minVal) pros.push("Best value per sqft");
    }

    // Bedrooms score
    if (p.bedrooms !== undefined) {
      const allBeds = properties.map((pp) => pp.bedrooms ?? 0);
      const maxB = Math.max(...allBeds);
      const bedScore = maxB > 0 ? Math.round(10 * (p.bedrooms / maxB)) : 5;
      breakdown.push({ category: "Bedrooms", score: bedScore, weight: priorityWeights.bedrooms ?? 2 });
      if (p.bedrooms === maxB && maxB > 0) pros.push("Most bedrooms");
    }

    // Condition score
    const condScore = CONDITION_SCORES[p.condition ?? "good"] ?? 6;
    breakdown.push({ category: "Condition", score: condScore, weight: priorityWeights.condition ?? 2 });
    if (p.condition === "new") pros.push("New construction");
    if (p.condition === "renovated") pros.push("Recently renovated");
    if (p.condition === "needs-work") cons.push("Needs renovation");

    // Features
    const featCount = (p.features ?? []).length;
    if (featCount > 3) pros.push(`${featCount} notable features`);
    if (featCount === 0) cons.push("No standout features listed");

    // Calculate weighted overall score
    const totalWeight = breakdown.reduce((sum, b) => sum + b.weight, 0);
    const overallScore = totalWeight > 0
      ? Math.round(breakdown.reduce((sum, b) => sum + b.score * b.weight, 0) / totalWeight * 10) / 10
      : 5;

    return {
      name: p.name,
      address: p.address,
      overallScore,
      breakdown,
      pros,
      cons,
    };
  });

  // Winner
  const sorted = [...scores].sort((a, b) => b.overallScore - a.overallScore);
  const winner = sorted[0].name;
  const winnerProps = properties.find((p) => p.name === winner)!;
  const winnerScore = sorted[0];
  const winnerReason = [
    `${winner} scores highest overall (${winnerScore.overallScore}/10)`,
    winnerScore.pros.length > 0 ? `: ${winnerScore.pros.join(", ")}` : "",
    ".",
  ].join("");

  // --- Markdown output ---
  const mdHeader = `| Attribute | ${properties.map((p) => p.name).join(" | ")} |`;
  const mdSep = `| --- | ${properties.map(() => "---").join(" | ")} |`;
  const mdRows = rows.map((r) => {
    const vals = r.values.map((v, i) => {
      const str = String(v);
      return r.best === i ? `**${str}** \u2705` : str;
    });
    return `| ${r.attribute} | ${vals.join(" | ")} |`;
  });
  const mdScores = scores.map((s) =>
    `- **${s.name}**: ${s.overallScore}/10 \u2014 Pros: ${s.pros.join(", ") || "none"} | Cons: ${s.cons.join(", ") || "none"}`
  );
  const markdown = [
    `## Property Comparison`,
    "",
    mdHeader,
    mdSep,
    ...mdRows,
    "",
    `### Scores`,
    "",
    ...mdScores,
    "",
    `### Recommendation`,
    "",
    `\u{1F3C6} **${winner}** \u2014 ${winnerReason}`,
  ].join("\n");

  // --- HTML output ---
  const htmlRows = rows.map((r) => {
    const cells = r.values.map((v, i) => {
      const str = String(v);
      const style = r.best === i ? ' style="background:#E8F5E9;font-weight:bold;"' : "";
      return `<td${style}>${str}${r.best === i ? " \u2705" : ""}</td>`;
    }).join("");
    return `<tr><td style="font-weight:600;">${r.attribute}</td>${cells}</tr>`;
  }).join("\n");

  const html = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:900px;">
<h2>Property Comparison</h2>
<table style="width:100%;border-collapse:collapse;font-size:14px;">
<thead><tr style="background:#f0f0f0;">
<th style="padding:8px;text-align:left;">Attribute</th>
${properties.map((p) => `<th style="padding:8px;text-align:left;">${p.name}</th>`).join("")}
</tr></thead>
<tbody>
${htmlRows}
</tbody>
</table>
<h3 style="margin-top:20px;">Scores</h3>
<ul>
${scores.map((s) => `<li><strong>${s.name}</strong>: ${s.overallScore}/10</li>`).join("\n")}
</ul>
<div style="margin-top:16px;padding:12px;background:#E3F2FD;border-radius:8px;">
<strong>\u{1F3C6} Recommendation: ${winner}</strong> \u2014 ${winnerReason}
</div>
</div>`;

  const summary = [
    `Compared ${properties.length} properties.`,
    `Winner: ${winner} (${winnerScore.overallScore}/10).`,
    winnerReason,
  ].join(" ");

  return {
    comparison: rows,
    scores,
    winner,
    winnerReason,
    markdown: format === "html" ? "" : markdown,
    html: format === "markdown" ? "" : html,
    summary,
  };
}
