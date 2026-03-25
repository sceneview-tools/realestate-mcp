/**
 * staging_suggestions — Suggest virtual staging options for empty rooms.
 *
 * Given a room type, dimensions, style preference, and budget level,
 * produces a curated list of furniture/decor suggestions with placement hints.
 */

export interface StagingInput {
  roomType: "bedroom" | "living-room" | "dining-room" | "kitchen" | "bathroom" | "office" | "nursery" | "outdoor";
  width?: number;   // meters
  length?: number;  // meters
  style?: "modern" | "traditional" | "scandinavian" | "industrial" | "bohemian" | "coastal" | "farmhouse" | "mid-century";
  budget?: "low" | "medium" | "high";
  targetBuyer?: "young-professional" | "family" | "retiree" | "investor" | "luxury";
  existingFeatures?: string[];
}

export interface StagingSuggestion {
  item: string;
  category: "furniture" | "decor" | "lighting" | "textile" | "plant" | "art";
  placement: string;
  estimatedCost: string;
  priority: "essential" | "recommended" | "optional";
  rationale: string;
}

export interface StagingOutput {
  roomType: string;
  style: string;
  suggestions: StagingSuggestion[];
  colorPalette: ColorPalette;
  tips: string[];
  estimatedTotalCost: string;
}

interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  neutral: string;
  description: string;
}

const STYLE_PALETTES: Record<string, ColorPalette> = {
  modern: { primary: "#2C3E50", secondary: "#ECF0F1", accent: "#E74C3C", neutral: "#BDC3C7", description: "Cool grays with bold red accent" },
  traditional: { primary: "#8B4513", secondary: "#F5F5DC", accent: "#DAA520", neutral: "#D2B48C", description: "Warm woods with gold accents" },
  scandinavian: { primary: "#FFFFFF", secondary: "#F5F5F0", accent: "#4A7C59", neutral: "#C8C8C0", description: "Clean whites with natural green" },
  industrial: { primary: "#36454F", secondary: "#A9A9A9", accent: "#CD7F32", neutral: "#808080", description: "Charcoal and bronze tones" },
  bohemian: { primary: "#8B4513", secondary: "#FFF8DC", accent: "#FF6347", neutral: "#DEB887", description: "Earthy warmth with vibrant coral" },
  coastal: { primary: "#4682B4", secondary: "#F0F8FF", accent: "#FFD700", neutral: "#D3D3D3", description: "Ocean blue with sandy gold" },
  farmhouse: { primary: "#556B2F", secondary: "#FFFAF0", accent: "#B22222", neutral: "#C4B7A6", description: "Sage green with barn red" },
  "mid-century": { primary: "#D2691E", secondary: "#FAEBD7", accent: "#008080", neutral: "#C0C0C0", description: "Warm wood tones with teal accent" },
};

type RoomKey = StagingInput["roomType"];

const ROOM_ESSENTIALS: Record<RoomKey, StagingSuggestion[]> = {
  bedroom: [
    { item: "Queen/King bed with upholstered headboard", category: "furniture", placement: "Centered on the main wall, facing the window", estimatedCost: "$800-2,500", priority: "essential", rationale: "The bed is the focal point; an upholstered headboard photographs beautifully" },
    { item: "Matching nightstands (pair)", category: "furniture", placement: "Flanking the bed, symmetrically", estimatedCost: "$200-600", priority: "essential", rationale: "Symmetry creates a sense of balance and luxury in listing photos" },
    { item: "Table lamps (pair)", category: "lighting", placement: "On each nightstand", estimatedCost: "$100-300", priority: "essential", rationale: "Warm lighting makes the room feel inviting" },
    { item: "Area rug (8x10 or 9x12)", category: "textile", placement: "Under the bed, extending 2-3 feet on each side", estimatedCost: "$200-800", priority: "recommended", rationale: "Adds warmth and defines the sleeping area" },
    { item: "Throw pillows (3-5)", category: "textile", placement: "Arranged on the bed", estimatedCost: "$50-150", priority: "recommended", rationale: "Adds color and texture to photos" },
    { item: "Dresser or chest of drawers", category: "furniture", placement: "Opposite wall from bed", estimatedCost: "$400-1,200", priority: "recommended", rationale: "Shows functional storage space" },
    { item: "Framed artwork or mirror", category: "art", placement: "Above the bed or dresser", estimatedCost: "$50-300", priority: "optional", rationale: "Adds personality without overwhelming the space" },
    { item: "Potted plant", category: "plant", placement: "Corner near the window", estimatedCost: "$30-80", priority: "optional", rationale: "Adds life and freshness to the room" },
  ],
  "living-room": [
    { item: "Sectional sofa or sofa + accent chairs", category: "furniture", placement: "Facing the focal wall (fireplace/TV/window)", estimatedCost: "$1,200-4,000", priority: "essential", rationale: "Defines the conversation area and shows the room's scale" },
    { item: "Coffee table", category: "furniture", placement: "Centered in the seating arrangement", estimatedCost: "$200-800", priority: "essential", rationale: "Anchors the seating group and provides surface for styling" },
    { item: "Area rug (8x10 or larger)", category: "textile", placement: "Under the seating area, all front legs on rug", estimatedCost: "$300-1,200", priority: "essential", rationale: "Defines the living area and adds warmth to hard floors" },
    { item: "Floor lamp + table lamp", category: "lighting", placement: "Floor lamp by sofa arm, table lamp on side table", estimatedCost: "$150-400", priority: "recommended", rationale: "Layered lighting creates depth in photos" },
    { item: "Side table(s)", category: "furniture", placement: "Next to sofa arms", estimatedCost: "$100-400", priority: "recommended", rationale: "Functional surfaces that complete the look" },
    { item: "Large statement artwork", category: "art", placement: "Above sofa or on focal wall", estimatedCost: "$100-500", priority: "recommended", rationale: "Creates a focal point and adds personality" },
    { item: "Throw blanket and pillows", category: "textile", placement: "Draped on sofa", estimatedCost: "$50-200", priority: "optional", rationale: "Adds texture and warmth" },
    { item: "Tall plant (fiddle leaf fig or similar)", category: "plant", placement: "Empty corner", estimatedCost: "$50-150", priority: "optional", rationale: "Fills empty corners and adds vertical interest" },
  ],
  "dining-room": [
    { item: "Dining table (seats 6-8)", category: "furniture", placement: "Centered in the room or centered under light fixture", estimatedCost: "$600-2,000", priority: "essential", rationale: "Shows the room can host gatherings" },
    { item: "Dining chairs (6)", category: "furniture", placement: "Around the table, evenly spaced", estimatedCost: "$400-1,200", priority: "essential", rationale: "Must match or complement the table style" },
    { item: "Pendant light or chandelier", category: "lighting", placement: "Centered over the table, 30-36 inches above", estimatedCost: "$200-800", priority: "recommended", rationale: "Defines the dining space and adds elegance" },
    { item: "Table centerpiece (vase with flowers)", category: "decor", placement: "Center of table", estimatedCost: "$30-80", priority: "recommended", rationale: "Adds life and color to listing photos" },
    { item: "Buffet or sideboard", category: "furniture", placement: "Along the longest wall", estimatedCost: "$400-1,200", priority: "optional", rationale: "Shows additional storage and serving space" },
    { item: "Wall art or mirror", category: "art", placement: "Above the buffet or on empty wall", estimatedCost: "$50-300", priority: "optional", rationale: "Adds dimension to the space" },
  ],
  kitchen: [
    { item: "Bar stools (2-3)", category: "furniture", placement: "At the kitchen island or breakfast bar", estimatedCost: "$200-600", priority: "essential", rationale: "Shows the kitchen as a social space" },
    { item: "Pendant lights (2-3)", category: "lighting", placement: "Over the island, evenly spaced", estimatedCost: "$150-500", priority: "recommended", rationale: "Task lighting that photographs well" },
    { item: "Fresh fruit bowl", category: "decor", placement: "On the island or counter", estimatedCost: "$10-30", priority: "recommended", rationale: "Adds color and makes the kitchen feel lived-in" },
    { item: "Cookbook display stand", category: "decor", placement: "On counter near stove", estimatedCost: "$20-50", priority: "optional", rationale: "Adds personality and warmth" },
    { item: "Herb plant in decorative pot", category: "plant", placement: "Kitchen windowsill", estimatedCost: "$15-40", priority: "optional", rationale: "Freshness and natural touch" },
    { item: "Matching kitchen textiles (towels, runner)", category: "textile", placement: "Hung on oven, along counter", estimatedCost: "$20-60", priority: "optional", rationale: "Color coordination ties the look together" },
  ],
  bathroom: [
    { item: "Plush towel set (white or neutral)", category: "textile", placement: "Rolled on shelf or hung neatly", estimatedCost: "$30-80", priority: "essential", rationale: "Hotel-style towels suggest luxury" },
    { item: "Bath mat", category: "textile", placement: "In front of shower/tub", estimatedCost: "$20-50", priority: "essential", rationale: "Adds warmth and defines the space" },
    { item: "Decorative soap dispenser and tray", category: "decor", placement: "On vanity counter", estimatedCost: "$20-50", priority: "recommended", rationale: "Polished accessories suggest attention to detail" },
    { item: "Framed artwork or mirror", category: "art", placement: "Above towel bar or toilet", estimatedCost: "$30-100", priority: "recommended", rationale: "Elevates the space beyond basic" },
    { item: "Small potted plant (fern or succulent)", category: "plant", placement: "On vanity or shelf", estimatedCost: "$15-30", priority: "optional", rationale: "Adds spa-like freshness" },
    { item: "Candle or diffuser", category: "decor", placement: "On vanity or tub ledge", estimatedCost: "$15-40", priority: "optional", rationale: "Suggests a relaxing experience" },
  ],
  office: [
    { item: "Desk (modern or executive style)", category: "furniture", placement: "Facing the door or window", estimatedCost: "$300-1,200", priority: "essential", rationale: "Core furniture piece that defines the room's function" },
    { item: "Ergonomic desk chair", category: "furniture", placement: "At the desk", estimatedCost: "$200-800", priority: "essential", rationale: "Shows the office is work-ready" },
    { item: "Desk lamp", category: "lighting", placement: "On desk, non-dominant side", estimatedCost: "$50-150", priority: "recommended", rationale: "Task lighting is essential for a functional office" },
    { item: "Bookshelf with styled books/objects", category: "furniture", placement: "Against wall behind or beside desk", estimatedCost: "$150-500", priority: "recommended", rationale: "Adds warmth and intellectual character" },
    { item: "Small potted plant", category: "plant", placement: "On desk or bookshelf", estimatedCost: "$20-50", priority: "optional", rationale: "Adds life to the workspace" },
    { item: "Framed artwork or motivational print", category: "art", placement: "Wall behind desk or above bookshelf", estimatedCost: "$30-100", priority: "optional", rationale: "Personalizes the space" },
  ],
  nursery: [
    { item: "Crib with fitted sheet", category: "furniture", placement: "Centered on the main wall", estimatedCost: "$200-800", priority: "essential", rationale: "Core piece that defines the room for families with children" },
    { item: "Rocking chair or glider", category: "furniture", placement: "Corner near the crib", estimatedCost: "$200-600", priority: "essential", rationale: "Shows functional comfort for parents" },
    { item: "Dresser/changing table", category: "furniture", placement: "Adjacent wall to crib", estimatedCost: "$200-600", priority: "recommended", rationale: "Practical storage that families need" },
    { item: "Soft area rug", category: "textile", placement: "Center of room", estimatedCost: "$100-300", priority: "recommended", rationale: "Soft surface for play and visual warmth" },
    { item: "Mobile or wall decals", category: "decor", placement: "Above crib or on accent wall", estimatedCost: "$20-80", priority: "optional", rationale: "Whimsical touch that appeals to families" },
    { item: "Stuffed animals (2-3, tasteful)", category: "decor", placement: "In crib or on shelf", estimatedCost: "$20-50", priority: "optional", rationale: "Adds softness and warmth" },
  ],
  outdoor: [
    { item: "Outdoor dining set (table + 4-6 chairs)", category: "furniture", placement: "On patio, centered", estimatedCost: "$400-1,500", priority: "essential", rationale: "Shows the outdoor space as an entertainment area" },
    { item: "Lounge chairs or outdoor sofa", category: "furniture", placement: "Separate seating area or poolside", estimatedCost: "$300-1,200", priority: "recommended", rationale: "Creates a relaxation zone" },
    { item: "Outdoor rug", category: "textile", placement: "Under the seating area", estimatedCost: "$50-200", priority: "recommended", rationale: "Defines the outdoor living space" },
    { item: "String lights or lanterns", category: "lighting", placement: "Overhead or along railing", estimatedCost: "$30-100", priority: "recommended", rationale: "Creates ambiance for evening photos" },
    { item: "Potted plants (large, 3-5)", category: "plant", placement: "Corners and along edges", estimatedCost: "$50-200", priority: "optional", rationale: "Adds lush greenery and frames the space" },
    { item: "Throw pillows (outdoor fabric)", category: "textile", placement: "On outdoor seating", estimatedCost: "$40-100", priority: "optional", rationale: "Adds color and comfort" },
  ],
};

const TIPS: Record<RoomKey, string[]> = {
  bedroom: [
    "Make the bed the hero — use crisp white or neutral bedding for photos.",
    "Remove personal items but keep 1-2 styled accessories on nightstands.",
    "Open curtains to maximize natural light in listing photos.",
    "Declutter the closet — buyers will look inside.",
  ],
  "living-room": [
    "Arrange furniture to show traffic flow — buyers need to see they can move through the space.",
    "Remove family photos and replace with neutral artwork.",
    "Use odd numbers for decorative groupings (3 pillows, 3 candles).",
    "Keep window treatments simple and pulled back for maximum light.",
  ],
  "dining-room": [
    "Set the table for photos — place settings suggest entertaining potential.",
    "Use a table runner for added elegance without covering the table surface.",
    "Fresh flowers are the single most cost-effective staging element.",
    "If the room is small, use a round table — it feels more spacious.",
  ],
  kitchen: [
    "Clear all counters except 2-3 styled items — buyers need to see counter space.",
    "Update cabinet hardware for an instant refresh at minimal cost.",
    "Keep the sink empty and sparkling for photos.",
    "Add under-cabinet lighting if possible — it photographs beautifully.",
  ],
  bathroom: [
    "All-white towels rolled spa-style are universally appealing.",
    "Re-caulk tub and shower if needed — it's cheap and makes everything look new.",
    "Keep toilet lid down and add a small plant or candle.",
    "Replace shower curtain with a clean white one for photos.",
  ],
  office: [
    "A home office adds significant value — stage spare bedrooms as offices if appropriate.",
    "Keep technology minimal and cords hidden.",
    "Style the bookshelf with a mix of books, plants, and objects — not just books.",
    "Natural light is key — position the desk to show the best light.",
  ],
  nursery: [
    "Keep colors gender-neutral to appeal to all buyers.",
    "Show the room's versatility — it could also be an office or guest room.",
    "Soft, warm lighting creates an inviting atmosphere.",
    "Less is more — a few quality pieces look better than a cluttered room.",
  ],
  outdoor: [
    "Power-wash patios and decks before photos — the difference is dramatic.",
    "Stage at golden hour (late afternoon) for the best outdoor photos.",
    "Add a fire pit or outdoor heater to suggest year-round use.",
    "Keep landscaping trimmed and add mulch for a fresh, maintained look.",
  ],
};

function selectByBudget(suggestions: StagingSuggestion[], budget: string): StagingSuggestion[] {
  if (budget === "low") return suggestions.filter((s) => s.priority === "essential");
  if (budget === "medium") return suggestions.filter((s) => s.priority !== "optional");
  return suggestions; // high budget: everything
}

function estimateTotal(budget: string, roomType: RoomKey): string {
  const ranges: Record<string, Record<RoomKey, string>> = {
    low: {
      bedroom: "$1,100-3,400", "living-room": "$1,700-6,000", "dining-room": "$1,000-3,200",
      kitchen: "$200-600", bathroom: "$50-130", office: "$500-2,000",
      nursery: "$400-1,400", outdoor: "$400-1,500",
    },
    medium: {
      bedroom: "$1,500-5,000", "living-room": "$2,200-7,800", "dining-room": "$1,600-4,880",
      kitchen: "$400-1,200", bathroom: "$100-280", office: "$700-2,650",
      nursery: "$700-2,300", outdoor: "$800-3,000",
    },
    high: {
      bedroom: "$1,900-6,000", "living-room": "$2,700-9,500", "dining-room": "$2,100-6,200",
      kitchen: "$600-1,800", bathroom: "$200-450", office: "$900-3,300",
      nursery: "$900-3,000", outdoor: "$1,200-4,500",
    },
  };
  return ranges[budget]?.[roomType] ?? "$500-3,000";
}

export function generateStagingSuggestions(input: StagingInput): StagingOutput {
  const style = input.style ?? "modern";
  const budget = input.budget ?? "medium";
  const roomType = input.roomType;

  const baseSuggestions = ROOM_ESSENTIALS[roomType] ?? ROOM_ESSENTIALS["living-room"];
  const suggestions = selectByBudget(baseSuggestions, budget);
  const palette = STYLE_PALETTES[style] ?? STYLE_PALETTES.modern;
  const tips = TIPS[roomType] ?? TIPS["living-room"];

  return {
    roomType,
    style,
    suggestions,
    colorPalette: palette,
    tips,
    estimatedTotalCost: estimateTotal(budget, roomType),
  };
}
