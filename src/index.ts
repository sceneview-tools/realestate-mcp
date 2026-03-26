#!/usr/bin/env node

/**
 * realestate-mcp v2.0.0 — MCP server for real estate agents.
 *
 * Tools:
 *   generate_floor_plan      — SVG floor plan from room dimensions
 *   create_virtual_tour      — Embeddable 3D virtual tour
 *   property_description     — AI-optimized listing descriptions (EN/FR)
 *   staging_suggestions      — Virtual staging recommendations
 *   neighborhood_analysis    — Neighborhood summary for an address
 *   render_property_preview  — 3D model-viewer embed
 *   estimate_price           — Rough property price estimation
 *   compare_properties       — Side-by-side property comparison
 *
 * Tiers:
 *   Free  — 50 requests/month
 *   Pro   — unlimited ($19/month)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { trackRequest, getUsage } from "./usage.js";
import { generateFloorPlan, type FloorPlanInput } from "./tools/generate-floor-plan.js";
import { createVirtualTour, type VirtualTourInput } from "./tools/create-virtual-tour.js";
import { generatePropertyDescription, type PropertyDescriptionInput } from "./tools/property-description.js";
import { generateStagingSuggestions, type StagingInput } from "./tools/staging-suggestions.js";
import { generateNeighborhoodAnalysis, type NeighborhoodInput } from "./tools/neighborhood-analysis.js";
import { renderPropertyPreview, type PropertyPreviewInput } from "./tools/render-property-preview.js";
import { estimatePrice, type PriceEstimateInput } from "./tools/estimate-price.js";
import { compareProperties, type ComparePropertiesInput } from "./tools/compare-properties.js";

// ---------------------------------------------------------------------------
// Legal disclaimer
// ---------------------------------------------------------------------------

const DISCLAIMER = '\n\n---\n*Informational purposes only. Not professional real estate, legal, or financial advice. Consult a licensed professional. See [TERMS.md](https://github.com/sceneview/realestate-mcp/blob/main/TERMS.md).*';

function addDisclaimer(text: string): string {
  return text + DISCLAIMER;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const API_KEY = process.env.REALESTATE_MCP_API_KEY;

function checkUsage(): { allowed: boolean; error?: string } {
  const result = trackRequest(API_KEY);
  if (!result.allowed) {
    return { allowed: false, error: result.reason };
  }
  return { allowed: true };
}

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

const server = new McpServer({
  name: "realestate-mcp",
  version: "2.0.0",
});

// ---------------------------------------------------------------------------
// Tool: generate_floor_plan
// ---------------------------------------------------------------------------

server.tool(
  "generate_floor_plan",
  "Generate an SVG floor plan from room dimensions. Returns SVG markup, total area (metric + imperial), room breakdown, legend, and scale bar.",
  {
    rooms: z.array(
      z.object({
        name: z.string().describe("Room name, e.g. 'Master Bedroom'"),
        width: z.number().positive().describe("Room width in meters"),
        length: z.number().positive().describe("Room length in meters"),
        type: z
          .enum(["bedroom", "bathroom", "kitchen", "living", "dining", "office", "hallway", "garage", "storage", "laundry", "balcony", "other"])
          .optional()
          .describe("Room type for color coding and icons"),
      })
    ).min(1).describe("List of rooms with dimensions"),
    title: z.string().optional().describe("Floor plan title"),
    style: z.enum(["modern", "classic", "minimal"]).optional().describe("Visual style (default: modern)"),
    showLegend: z.boolean().optional().describe("Show room type legend (default: true)"),
    showScaleBar: z.boolean().optional().describe("Show scale bar (default: true)"),
    unit: z.enum(["metric", "imperial"]).optional().describe("Measurement unit (default: metric)"),
  },
  async (args) => {
    const usage = checkUsage();
    if (!usage.allowed) {
      return { content: [{ type: "text", text: usage.error! }], isError: true };
    }

    const result = generateFloorPlan(args as FloorPlanInput);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              totalArea: result.totalArea,
              totalAreaSqFt: result.totalAreaSqFt,
              roomCount: result.roomCount,
              rooms: result.rooms,
            },
            null,
            2
          ),
        },
        { type: "text", text: addDisclaimer(result.svg) },
      ],
    };
  }
);

// ---------------------------------------------------------------------------
// Tool: create_virtual_tour
// ---------------------------------------------------------------------------

server.tool(
  "create_virtual_tour",
  "Create an embeddable virtual tour from room descriptions and photos. Returns HTML with smooth transitions, fullscreen, keyboard/touch navigation, and progress bar.",
  {
    propertyName: z.string().describe("Property name or address for the tour"),
    address: z.string().optional().describe("Full property address"),
    rooms: z.array(
      z.object({
        name: z.string().describe("Room name"),
        description: z.string().optional().describe("Room description"),
        photoUrls: z.array(z.string().url()).optional().describe("Photo URLs for this room"),
        features: z.array(z.string()).optional().describe("Notable features"),
        order: z.number().optional().describe("Display order"),
        dimensions: z.object({
          width: z.number().positive(),
          length: z.number().positive(),
        }).optional().describe("Room dimensions in meters"),
      })
    ).min(1).describe("Rooms in the tour"),
    branding: z.object({
      primaryColor: z.string().optional().describe("Hex color, e.g. #2563EB"),
      logo: z.string().url().optional().describe("Logo URL"),
      agentName: z.string().optional().describe("Agent name to display"),
      agentPhone: z.string().optional().describe("Agent phone number"),
      agentEmail: z.string().optional().describe("Agent email"),
    }).optional().describe("Branding options"),
    settings: z.object({
      autoPlay: z.boolean().optional().describe("Auto-advance rooms"),
      autoPlayInterval: z.number().optional().describe("Seconds between auto-advance (default: 8)"),
      showProgressBar: z.boolean().optional().describe("Show progress bar (default: true)"),
      showThumbnails: z.boolean().optional().describe("Show photo thumbnails (default: true)"),
      enableFullscreen: z.boolean().optional().describe("Enable fullscreen button (default: true)"),
      enableKeyboard: z.boolean().optional().describe("Enable keyboard navigation (default: true)"),
      enableSwipe: z.boolean().optional().describe("Enable touch/swipe (default: true)"),
    }).optional().describe("Tour settings"),
  },
  async (args) => {
    const usage = checkUsage();
    if (!usage.allowed) {
      return { content: [{ type: "text", text: usage.error! }], isError: true };
    }

    const result = createVirtualTour(args as VirtualTourInput);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              tourId: result.tourId,
              shareUrl: result.shareUrl,
              roomCount: result.roomCount,
              totalPhotos: result.totalPhotos,
            },
            null,
            2
          ),
        },
        { type: "text", text: addDisclaimer(result.embedHtml) },
      ],
    };
  }
);

// ---------------------------------------------------------------------------
// Tool: property_description
// ---------------------------------------------------------------------------

server.tool(
  "property_description",
  "Generate optimized property listing descriptions in English or French. Returns MLS, social media, luxury, and investor variants plus headline, SEO title/description, JSON-LD structured data, and character counts.",
  {
    address: z.string().describe("Property address"),
    propertyType: z.enum(["house", "apartment", "condo", "townhouse", "land", "commercial"]).describe("Property type"),
    bedrooms: z.number().int().nonnegative().optional().describe("Number of bedrooms"),
    bathrooms: z.number().nonnegative().optional().describe("Number of bathrooms"),
    squareFootage: z.number().positive().optional().describe("Square footage"),
    squareMeters: z.number().positive().optional().describe("Square meters"),
    lotSize: z.string().optional().describe("Lot size description, e.g. '0.25 acres'"),
    yearBuilt: z.number().int().optional().describe("Year built"),
    price: z.number().positive().optional().describe("Listing price"),
    currency: z.enum(["USD", "EUR", "GBP", "CAD"]).optional().describe("Currency (default: USD)"),
    features: z.array(z.string()).optional().describe("Property features"),
    style: z.string().optional().describe("Architectural style"),
    condition: z.enum(["new", "renovated", "good", "needs-work"]).optional().describe("Property condition"),
    neighborhood: z.string().optional().describe("Neighborhood name"),
    highlights: z.array(z.string()).optional().describe("Special highlights"),
    language: z.enum(["en", "fr"]).optional().describe("Language: en (English) or fr (French). Default: en"),
    targetAudience: z.enum(["general", "luxury", "investor", "first-time-buyer"]).optional().describe("Target audience"),
  },
  async (args) => {
    const usage = checkUsage();
    if (!usage.allowed) {
      return { content: [{ type: "text", text: usage.error! }], isError: true };
    }

    const result = generatePropertyDescription(args as PropertyDescriptionInput);
    return {
      content: [{ type: "text", text: addDisclaimer(JSON.stringify(result, null, 2)) }],
    };
  }
);

// ---------------------------------------------------------------------------
// Tool: staging_suggestions
// ---------------------------------------------------------------------------

server.tool(
  "staging_suggestions",
  "Suggest virtual staging options for empty rooms — furniture, decor, lighting, textiles, plants, and art with placement instructions.",
  {
    roomType: z
      .enum(["bedroom", "living-room", "dining-room", "kitchen", "bathroom", "office", "nursery", "outdoor"])
      .describe("Room type to stage"),
    width: z.number().positive().optional().describe("Room width in meters"),
    length: z.number().positive().optional().describe("Room length in meters"),
    style: z
      .enum(["modern", "traditional", "scandinavian", "industrial", "bohemian", "coastal", "farmhouse", "mid-century"])
      .optional()
      .describe("Desired style (default: modern)"),
    budget: z.enum(["low", "medium", "high"]).optional().describe("Budget level (default: medium)"),
    targetBuyer: z
      .enum(["young-professional", "family", "retiree", "investor", "luxury"])
      .optional()
      .describe("Target buyer persona"),
    existingFeatures: z.array(z.string()).optional().describe("Existing features to work with"),
  },
  async (args) => {
    const usage = checkUsage();
    if (!usage.allowed) {
      return { content: [{ type: "text", text: usage.error! }], isError: true };
    }

    const result = generateStagingSuggestions(args as StagingInput);
    return {
      content: [{ type: "text", text: addDisclaimer(JSON.stringify(result, null, 2)) }],
    };
  }
);

// ---------------------------------------------------------------------------
// Tool: neighborhood_analysis
// ---------------------------------------------------------------------------

server.tool(
  "neighborhood_analysis",
  "Generate a comprehensive neighborhood summary — walk score, schools, transit, amenities, demographics, safety, and market context.",
  {
    address: z.string().describe("Property address"),
    city: z.string().optional().describe("City name"),
    state: z.string().optional().describe("State abbreviation"),
    zipCode: z.string().optional().describe("ZIP code"),
    radius: z.number().positive().optional().describe("Search radius in miles (default: 1)"),
    focus: z
      .array(z.enum(["schools", "transit", "dining", "safety", "demographics", "parks"]))
      .optional()
      .describe("Focus areas for the analysis"),
  },
  async (args) => {
    const usage = checkUsage();
    if (!usage.allowed) {
      return { content: [{ type: "text", text: usage.error! }], isError: true };
    }

    const result = generateNeighborhoodAnalysis(args as NeighborhoodInput);
    return {
      content: [{ type: "text", text: addDisclaimer(JSON.stringify(result, null, 2)) }],
    };
  }
);

// ---------------------------------------------------------------------------
// Tool: render_property_preview
// ---------------------------------------------------------------------------

server.tool(
  "render_property_preview",
  "Generate an embeddable 3D model-viewer HTML snippet for property visualization. Supports AR on mobile and annotation hotspots.",
  {
    propertyName: z.string().describe("Property name for the preview"),
    modelUrl: z.string().url().optional().describe("URL to a .glb or .gltf 3D model file"),
    posterUrl: z.string().url().optional().describe("Fallback poster image URL"),
    backgroundColor: z.string().optional().describe("Background color (default: #f5f5f5)"),
    enableAR: z.boolean().optional().describe("Enable AR on mobile (default: true)"),
    autoRotate: z.boolean().optional().describe("Auto-rotate the 3D model (default: true)"),
    cameraOrbit: z.string().optional().describe("Camera orbit, e.g. '45deg 55deg 2.5m'"),
    annotations: z
      .array(
        z.object({
          label: z.string().describe("Annotation label"),
          position: z.string().describe("3D position 'x y z'"),
          normal: z.string().optional().describe("Surface normal 'x y z'"),
        })
      )
      .optional()
      .describe("Annotation hotspots on the model"),
    dimensions: z
      .object({
        width: z.number().positive().describe("Width in meters"),
        depth: z.number().positive().describe("Depth in meters"),
        height: z.number().positive().describe("Height in meters"),
      })
      .optional()
      .describe("Property dimensions for the placeholder"),
  },
  async (args) => {
    const usage = checkUsage();
    if (!usage.allowed) {
      return { content: [{ type: "text", text: usage.error! }], isError: true };
    }

    const result = renderPropertyPreview(args as PropertyPreviewInput);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              embedUrl: result.embedUrl,
              modelViewerVersion: result.modelViewerVersion,
              features: result.features,
            },
            null,
            2
          ),
        },
        { type: "text", text: addDisclaimer(result.embedHtml) },
      ],
    };
  }
);

// ---------------------------------------------------------------------------
// Tool: estimate_price
// ---------------------------------------------------------------------------

server.tool(
  "estimate_price",
  "Estimate a property's market value based on location, size, rooms, condition, and features. Returns price range, confidence level, price factors, and comparable sales. NOT a professional appraisal.",
  {
    address: z.string().describe("Property address"),
    city: z.string().describe("City name"),
    state: z.string().optional().describe("State/province"),
    country: z.string().optional().describe("Country (for non-US properties)"),
    propertyType: z.enum(["house", "apartment", "condo", "townhouse", "land", "commercial"]).describe("Property type"),
    squareFootage: z.number().positive().optional().describe("Square footage"),
    squareMeters: z.number().positive().optional().describe("Square meters"),
    bedrooms: z.number().int().nonnegative().optional().describe("Number of bedrooms"),
    bathrooms: z.number().nonnegative().optional().describe("Number of bathrooms"),
    yearBuilt: z.number().int().optional().describe("Year built"),
    condition: z.enum(["new", "renovated", "good", "needs-work"]).optional().describe("Property condition"),
    lotSize: z.number().positive().optional().describe("Lot size in acres"),
    features: z.array(z.string()).optional().describe("Property features (pool, garage, etc.)"),
    currency: z.enum(["USD", "EUR", "GBP", "CAD"]).optional().describe("Currency (default: USD)"),
  },
  async (args) => {
    const usage = checkUsage();
    if (!usage.allowed) {
      return { content: [{ type: "text", text: usage.error! }], isError: true };
    }

    const result = estimatePrice(args as PriceEstimateInput);
    return {
      content: [{ type: "text", text: addDisclaimer(JSON.stringify(result, null, 2)) }],
    };
  }
);

// ---------------------------------------------------------------------------
// Tool: compare_properties
// ---------------------------------------------------------------------------

server.tool(
  "compare_properties",
  "Compare 2-5 properties side by side. Returns comparison table, weighted scores, pros/cons, and a recommendation. Output in Markdown and/or HTML.",
  {
    properties: z.array(
      z.object({
        name: z.string().describe("Short name for this property, e.g. 'Oak Street House'"),
        address: z.string().describe("Property address"),
        price: z.number().positive().describe("Listing price"),
        propertyType: z.enum(["house", "apartment", "condo", "townhouse", "land", "commercial"]).optional(),
        bedrooms: z.number().int().nonnegative().optional(),
        bathrooms: z.number().nonnegative().optional(),
        squareFootage: z.number().positive().optional(),
        squareMeters: z.number().positive().optional(),
        yearBuilt: z.number().int().optional(),
        condition: z.enum(["new", "renovated", "good", "needs-work"]).optional(),
        features: z.array(z.string()).optional(),
        lotSize: z.string().optional(),
        hoaFees: z.number().nonnegative().optional().describe("Monthly HOA fees"),
        parkingSpaces: z.number().int().nonnegative().optional(),
        neighborhood: z.string().optional(),
      })
    ).min(2).max(5).describe("Properties to compare (2-5)"),
    priorities: z.array(
      z.enum(["price", "size", "location", "condition", "bedrooms", "value"])
    ).optional().describe("Scoring priorities (default: price, size, bedrooms, condition, value)"),
    format: z.enum(["markdown", "html", "both"]).optional().describe("Output format (default: both)"),
    currency: z.enum(["USD", "EUR", "GBP", "CAD"]).optional().describe("Currency (default: USD)"),
  },
  async (args) => {
    const usage = checkUsage();
    if (!usage.allowed) {
      return { content: [{ type: "text", text: usage.error! }], isError: true };
    }

    const result = compareProperties(args as ComparePropertiesInput);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              winner: result.winner,
              winnerReason: result.winnerReason,
              summary: result.summary,
              scores: result.scores,
              comparison: result.comparison,
            },
            null,
            2
          ),
        },
        { type: "text", text: addDisclaimer(result.markdown || result.html) },
      ],
    };
  }
);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
