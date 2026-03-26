/**
 * generate_floor_plan — Generate an SVG floor plan from room dimensions.
 *
 * v2.0: Added scale bar, legend, wall thickness, improved labels with
 * room type icons, and dimension arrows.
 */

export interface FloorPlanInput {
  rooms: RoomSpec[];
  title?: string;
  style?: "modern" | "classic" | "minimal";
  showLegend?: boolean;
  showScaleBar?: boolean;
  unit?: "metric" | "imperial";
}

export interface RoomSpec {
  name: string;
  width: number;  // meters
  length: number; // meters
  type?: "bedroom" | "bathroom" | "kitchen" | "living" | "dining" | "office" | "hallway" | "garage" | "storage" | "laundry" | "balcony" | "other";
}

interface PlacedRoom extends RoomSpec {
  x: number;
  y: number;
  svgWidth: number;
  svgHeight: number;
}

const SCALE = 60; // pixels per meter
const PADDING = 30;
const ROOM_GAP = 2; // pixels between rooms
const WALL_THICKNESS = 4;

const TYPE_COLORS: Record<string, string> = {
  bedroom: "#E8D5B7",
  bathroom: "#B7D5E8",
  kitchen: "#D5E8B7",
  living: "#F0E6CC",
  dining: "#E8CCB7",
  office: "#D5CCE8",
  hallway: "#E0E0E0",
  garage: "#C8C8C8",
  storage: "#D4D4D4",
  laundry: "#C8D8E8",
  balcony: "#C8E8C8",
  other: "#F5F5F5",
};

const TYPE_ICONS: Record<string, string> = {
  bedroom: "\u{1F6CF}",  // bed
  bathroom: "\u{1F6BF}", // shower
  kitchen: "\u{1F373}",  // cooking
  living: "\u{1F6CB}",   // couch
  dining: "\u{1F37D}",   // plate
  office: "\u{1F4BB}",   // laptop
  hallway: "\u{1F6AA}",  // door
  garage: "\u{1F697}",   // car
  storage: "\u{1F4E6}",  // package
  laundry: "\u{1F9FA}",  // soap
  balcony: "\u{2600}",   // sun
  other: "",
};

function layoutRooms(rooms: RoomSpec[]): PlacedRoom[] {
  const placed: PlacedRoom[] = [];
  let cursorX = PADDING;
  let cursorY = PADDING;
  let rowMaxHeight = 0;
  const maxRowWidth = Math.max(800, rooms.length * 200);

  for (const room of rooms) {
    const svgW = room.width * SCALE;
    const svgH = room.length * SCALE;

    if (cursorX + svgW > maxRowWidth && placed.length > 0) {
      cursorX = PADDING;
      cursorY += rowMaxHeight + ROOM_GAP;
      rowMaxHeight = 0;
    }

    placed.push({
      ...room,
      x: cursorX,
      y: cursorY,
      svgWidth: svgW,
      svgHeight: svgH,
    });

    cursorX += svgW + ROOM_GAP;
    rowMaxHeight = Math.max(rowMaxHeight, svgH);
  }

  return placed;
}

function renderDoorSymbol(x: number, y: number, horizontal: boolean): string {
  if (horizontal) {
    return `<path d="M${x},${y} A20,20 0 0,1 ${x + 20},${y - 20}" fill="none" stroke="#666" stroke-width="1"/>
    <line x1="${x}" y1="${y}" x2="${x + 20}" y2="${y}" stroke="#666" stroke-width="1.5"/>`;
  }
  return `<path d="M${x},${y} A20,20 0 0,1 ${x + 20},${y + 20}" fill="none" stroke="#666" stroke-width="1"/>
  <line x1="${x}" y1="${y}" x2="${x}" y2="${y + 20}" stroke="#666" stroke-width="1.5"/>`;
}

function renderDimensionArrow(x1: number, y1: number, x2: number, y2: number, label: string, offset: number): string {
  const isHorizontal = Math.abs(y2 - y1) < 1;
  if (isHorizontal) {
    const ay = y1 + offset;
    return `
      <line x1="${x1}" y1="${ay}" x2="${x2}" y2="${ay}" stroke="#E74C3C" stroke-width="0.8" marker-start="url(#arrowStart)" marker-end="url(#arrowEnd)"/>
      <text x="${(x1 + x2) / 2}" y="${ay - 4}" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" fill="#E74C3C" font-weight="bold">${label}</text>
    `;
  } else {
    const ax = x1 + offset;
    return `
      <line x1="${ax}" y1="${y1}" x2="${ax}" y2="${y2}" stroke="#E74C3C" stroke-width="0.8" marker-start="url(#arrowStart)" marker-end="url(#arrowEnd)"/>
      <text x="${ax + 4}" y="${(y1 + y2) / 2}" text-anchor="start" font-family="Arial, sans-serif" font-size="9" fill="#E74C3C" font-weight="bold" transform="rotate(-90, ${ax + 4}, ${(y1 + y2) / 2})">${label}</text>
    `;
  }
}

function renderRoom(room: PlacedRoom, style: string, unit: string): string {
  const fill = TYPE_COLORS[room.type ?? "other"] ?? TYPE_COLORS.other;
  const strokeWidth = style === "classic" ? 3 : WALL_THICKNESS;
  const fontSize = style === "minimal" ? 11 : 13;
  const icon = TYPE_ICONS[room.type ?? "other"] ?? "";

  const centerX = room.x + room.svgWidth / 2;
  const centerY = room.y + room.svgHeight / 2;

  const widthLabel = unit === "imperial"
    ? `${(room.width * 3.281).toFixed(1)}ft`
    : `${room.width}m`;
  const lengthLabel = unit === "imperial"
    ? `${(room.length * 3.281).toFixed(1)}ft`
    : `${room.length}m`;
  const dimLabel = `${widthLabel} \u00D7 ${lengthLabel}`;

  const areaM2 = room.width * room.length;
  const areaLabel = unit === "imperial"
    ? `${(areaM2 * 10.764).toFixed(0)} sq ft`
    : `${areaM2.toFixed(1)} m\u00B2`;

  // Door symbol on the bottom wall
  const doorX = room.x + room.svgWidth / 2 - 10;
  const doorY = room.y + room.svgHeight;

  // Dimension arrows
  const hArrow = renderDimensionArrow(
    room.x, room.y + room.svgHeight, room.x + room.svgWidth, room.y + room.svgHeight,
    widthLabel, 14
  );
  const vArrow = renderDimensionArrow(
    room.x, room.y, room.x, room.y + room.svgHeight,
    lengthLabel, -14
  );

  return `
    <rect x="${room.x}" y="${room.y}" width="${room.svgWidth}" height="${room.svgHeight}"
          fill="${fill}" stroke="#333" stroke-width="${strokeWidth}" rx="${style === "modern" ? 4 : 0}"/>
    ${icon ? `<text x="${centerX}" y="${centerY - 24}" text-anchor="middle" font-size="18">${icon}</text>` : ""}
    <text x="${centerX}" y="${centerY - 6}" text-anchor="middle"
          font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="#333">
      ${room.name}
    </text>
    <text x="${centerX}" y="${centerY + 10}" text-anchor="middle"
          font-family="Arial, sans-serif" font-size="${fontSize - 2}" fill="#666">
      ${dimLabel}
    </text>
    <text x="${centerX}" y="${centerY + 24}" text-anchor="middle"
          font-family="Arial, sans-serif" font-size="${fontSize - 2}" font-weight="bold" fill="#444">
      ${areaLabel}
    </text>
    ${renderDoorSymbol(doorX, doorY, true)}
    ${style !== "minimal" ? hArrow : ""}
  `;
}

function renderScaleBar(x: number, y: number, unit: string): string {
  const meterPx = SCALE;
  const label = unit === "imperial" ? "~3.3 ft" : "1 m";
  return `
    <line x1="${x}" y1="${y}" x2="${x + meterPx}" y2="${y}" stroke="#333" stroke-width="2"/>
    <line x1="${x}" y1="${y - 4}" x2="${x}" y2="${y + 4}" stroke="#333" stroke-width="2"/>
    <line x1="${x + meterPx}" y1="${y - 4}" x2="${x + meterPx}" y2="${y + 4}" stroke="#333" stroke-width="2"/>
    <text x="${x + meterPx / 2}" y="${y - 6}" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#333">${label}</text>
  `;
}

function renderLegend(x: number, y: number, usedTypes: Set<string>): string {
  const entries = Array.from(usedTypes).map((type, i) => {
    const color = TYPE_COLORS[type] ?? TYPE_COLORS.other;
    const label = type.charAt(0).toUpperCase() + type.slice(1);
    const icon = TYPE_ICONS[type] ?? "";
    const ey = y + i * 20;
    return `
      <rect x="${x}" y="${ey}" width="14" height="14" fill="${color}" stroke="#333" stroke-width="1" rx="2"/>
      <text x="${x + 20}" y="${ey + 11}" font-family="Arial, sans-serif" font-size="11" fill="#333">${icon} ${label}</text>
    `;
  });
  return entries.join("");
}

export function generateFloorPlan(input: FloorPlanInput): {
  svg: string;
  totalArea: number;
  totalAreaSqFt: number;
  roomCount: number;
  rooms: { name: string; type: string; area: number; areaSqFt: number }[];
} {
  const style = input.style ?? "modern";
  const unit = input.unit ?? "metric";
  const showLegend = input.showLegend !== false;
  const showScaleBar = input.showScaleBar !== false;
  const placed = layoutRooms(input.rooms);

  const legendWidth = showLegend ? 140 : 0;
  const maxX = Math.max(...placed.map((r) => r.x + r.svgWidth)) + PADDING + legendWidth + 20;
  const bottomExtra = showScaleBar ? 70 : 40;
  const maxY = Math.max(...placed.map((r) => r.y + r.svgHeight)) + PADDING + bottomExtra;
  const totalArea = input.rooms.reduce((sum, r) => sum + r.width * r.length, 0);
  const totalAreaSqFt = totalArea * 10.764;

  const title = input.title ?? "Floor Plan";
  const titleY = maxY - 12;
  const areaDisplay = unit === "imperial"
    ? `${Math.round(totalAreaSqFt)} sq ft total`
    : `${totalArea.toFixed(1)} m\u00B2 total`;

  const roomsSvg = placed.map((r) => renderRoom(r, style, unit)).join("\n");

  // Compass rose
  const compassX = maxX - legendWidth - 40;
  const compassY = 30;
  const compass = `
    <circle cx="${compassX}" cy="${compassY}" r="15" fill="none" stroke="#999" stroke-width="1"/>
    <text x="${compassX}" y="${compassY - 18}" text-anchor="middle" font-family="Arial" font-size="10" fill="#999">N</text>
    <line x1="${compassX}" y1="${compassY - 12}" x2="${compassX}" y2="${compassY + 12}" stroke="#999" stroke-width="1"/>
    <line x1="${compassX - 12}" y1="${compassY}" x2="${compassX + 12}" y2="${compassY}" stroke="#999" stroke-width="1"/>
    <polygon points="${compassX},${compassY - 12} ${compassX - 3},${compassY - 6} ${compassX + 3},${compassY - 6}" fill="#333"/>
  `;

  // Scale bar
  const scaleBarSvg = showScaleBar
    ? renderScaleBar(PADDING, maxY - 30, unit)
    : "";

  // Legend
  const usedTypes = new Set(input.rooms.map((r) => r.type ?? "other"));
  const legendSvg = showLegend
    ? renderLegend(maxX - legendWidth, PADDING + 10, usedTypes)
    : "";

  // Arrow marker defs
  const defs = `
    <defs>
      <marker id="arrowStart" markerWidth="6" markerHeight="6" refX="0" refY="3" orient="auto">
        <path d="M6,0 L0,3 L6,6" fill="none" stroke="#E74C3C" stroke-width="0.8"/>
      </marker>
      <marker id="arrowEnd" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto">
        <path d="M0,0 L6,3 L0,6" fill="none" stroke="#E74C3C" stroke-width="0.8"/>
      </marker>
    </defs>
  `;

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${maxX} ${maxY}" width="${maxX}" height="${maxY}">
  ${defs}
  <rect width="100%" height="100%" fill="${style === "minimal" ? "#fff" : "#fafafa"}"/>
  ${compass}
  ${roomsSvg}
  ${scaleBarSvg}
  ${legendSvg}
  <text x="${maxX / 2}" y="${titleY}" text-anchor="middle"
        font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#333">
    ${title} \u2014 ${areaDisplay}
  </text>
</svg>`;

  const rooms = input.rooms.map((r) => ({
    name: r.name,
    type: r.type ?? "other",
    area: Math.round(r.width * r.length * 10) / 10,
    areaSqFt: Math.round(r.width * r.length * 10.764 * 10) / 10,
  }));

  return {
    svg,
    totalArea: Math.round(totalArea * 10) / 10,
    totalAreaSqFt: Math.round(totalAreaSqFt * 10) / 10,
    roomCount: input.rooms.length,
    rooms,
  };
}
