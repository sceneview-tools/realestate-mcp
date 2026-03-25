#!/usr/bin/env node

/**
 * realestate-mcp — MCP server for real estate agents.
 *
 * Tools:
 *   generate_floor_plan      — SVG floor plan from room dimensions
 *   create_virtual_tour      — Embeddable 3D virtual tour
 *   property_description     — AI-optimized listing descriptions
 *   staging_suggestions      — Virtual staging recommendations
 *   neighborhood_analysis    — Neighborhood summary for an address
 *   render_property_preview  — 3D model-viewer embed
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
  version: "1.0.0",
});

// ---------------------------------------------------------------------------
// Tool: generate_floor_plan
// ---------------------------------------------------------------------------

server.tool(
  "generate_floor_plan",
  "Generate an SVG floor plan from room dimensions. Returns SVG markup, total area, and room count.",
  {
    rooms: z.array(
      z.object({
        name: z.string().describe("Room name, e.g. 'Master Bedroom'"),
        width: z.number().positive().describe("Room width in meters"),
        length: z.number().positive().describe("Room length in meters"),
        type: z
          .enum(["bedroom", "bathroom", "kitchen", "living", "dining", "office", "hallway", "garage", "other"])
          .optional()
          .describe("Room type for color coding"),
      })
    ).min(1).describe("List of rooms with dimensions"),
    title: z.string().optional().describe("Floor plan title"),
    style: z.enum(["modern", "classic", "minimal"]).optional().describe("Visual style (default: modern)"),
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
            { totalArea: result.totalArea, roomCount: result.roomCount },
            null,
            2
          ),
        },
        { type: "text", text: result.svg },
      ],
    };
  }
);

// ---------------------------------------------------------------------------
// Tool: create_virtual_tour
// ---------------------------------------------------------------------------

server.tool(
  "create_virtual_tour",
  "Create an embeddable 3D virtual tour from room descriptions and photos. Returns HTML, manifest, and share URL.",
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
      })
    ).min(1).describe("Rooms in the tour"),
    branding: z.object({
      primaryColor: z.string().optional().describe("Hex color, e.g. #2563EB"),
      logo: z.string().url().optional().describe("Logo URL"),
      agentName: z.string().optional().describe("Agent name to display"),
      agentPhone: z.string().optional().describe("Agent phone number"),
    }).optional().describe("Branding options"),
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
              roomCount: result.manifest.rooms.length,
            },
            null,
            2
          ),
        },
        { type: "text", text: result.embedHtml },
      ],
    };
  }
);

// ---------------------------------------------------------------------------
// Tool: property_description
// ---------------------------------------------------------------------------

server.tool(
  "property_description",
  "Generate optimized property listing descriptions (MLS, social media, luxury, investor). Returns 4 variants plus headline and SEO keywords.",
  {
    address: z.string().describe("Property address"),
    propertyType: z.enum(["house", "apartment", "condo", "townhouse", "land", "commercial"]).describe("Property type"),
    bedrooms: z.number().int().nonnegative().optional().describe("Number of bedrooms"),
    bathrooms: z.number().nonnegative().optional().describe("Number of bathrooms"),
    squareFootage: z.number().positive().optional().describe("Square footage"),
    lotSize: z.string().optional().describe("Lot size description, e.g. '0.25 acres'"),
    yearBuilt: z.number().int().optional().describe("Year built"),
    price: z.number().positive().optional().describe("Listing price in USD"),
    features: z.array(z.string()).optional().describe("Property features, e.g. ['Hardwood floors', 'Granite counters']"),
    style: z.string().optional().describe("Architectural style, e.g. 'Colonial'"),
    condition: z.enum(["new", "renovated", "good", "needs-work"]).optional().describe("Property condition"),
    neighborhood: z.string().optional().describe("Neighborhood name"),
    highlights: z.array(z.string()).optional().describe("Special highlights to emphasize"),
  },
  async (args) => {
    const usage = checkUsage();
    if (!usage.allowed) {
      return { content: [{ type: "text", text: usage.error! }], isError: true };
    }

    const result = generatePropertyDescription(args as PropertyDescriptionInput);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
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
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
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
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
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
        { type: "text", text: result.embedHtml },
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
