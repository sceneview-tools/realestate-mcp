/**
 * generate_floor_plan — Generate an SVG floor plan from room dimensions.
 *
 * Input: text description of rooms with dimensions
 * Output: SVG markup of a 2D floor plan
 */

export interface FloorPlanInput {
  rooms: RoomSpec[];
  title?: string;
  style?: "modern" | "classic" | "minimal";
}

export interface RoomSpec {
  name: string;
  width: number;  // meters
  length: number; // meters
  type?: "bedroom" | "bathroom" | "kitchen" | "living" | "dining" | "office" | "hallway" | "garage" | "other";
}

interface PlacedRoom extends RoomSpec {
  x: number;
  y: number;
  svgWidth: number;
  svgHeight: number;
}

const SCALE = 60; // pixels per meter
const PADDING = 20;
const ROOM_GAP = 2; // pixels between rooms

const TYPE_COLORS: Record<string, string> = {
  bedroom: "#E8D5B7",
  bathroom: "#B7D5E8",
  kitchen: "#D5E8B7",
  living: "#F0E6CC",
  dining: "#E8CCB7",
  office: "#D5CCE8",
  hallway: "#E0E0E0",
  garage: "#C8C8C8",
  other: "#F5F5F5",
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

function renderRoom(room: PlacedRoom, style: string): string {
  const fill = TYPE_COLORS[room.type ?? "other"] ?? TYPE_COLORS.other;
  const strokeWidth = style === "classic" ? 3 : 2;
  const fontSize = style === "minimal" ? 11 : 13;

  const centerX = room.x + room.svgWidth / 2;
  const centerY = room.y + room.svgHeight / 2;

  const dimLabel = `${room.width}m x ${room.length}m`;
  const area = (room.width * room.length).toFixed(1);

  // Add a door symbol on the bottom wall
  const doorX = room.x + room.svgWidth / 2 - 10;
  const doorY = room.y + room.svgHeight;

  return `
    <rect x="${room.x}" y="${room.y}" width="${room.svgWidth}" height="${room.svgHeight}"
          fill="${fill}" stroke="#333" stroke-width="${strokeWidth}" rx="${style === "modern" ? 4 : 0}"/>
    <text x="${centerX}" y="${centerY - 10}" text-anchor="middle"
          font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="#333">
      ${room.name}
    </text>
    <text x="${centerX}" y="${centerY + 8}" text-anchor="middle"
          font-family="Arial, sans-serif" font-size="${fontSize - 2}" fill="#666">
      ${dimLabel}
    </text>
    <text x="${centerX}" y="${centerY + 22}" text-anchor="middle"
          font-family="Arial, sans-serif" font-size="${fontSize - 3}" fill="#999">
      ${area} m\u00B2
    </text>
    ${renderDoorSymbol(doorX, doorY, true)}
  `;
}

export function generateFloorPlan(input: FloorPlanInput): {
  svg: string;
  totalArea: number;
  roomCount: number;
} {
  const style = input.style ?? "modern";
  const placed = layoutRooms(input.rooms);

  const maxX = Math.max(...placed.map((r) => r.x + r.svgWidth)) + PADDING;
  const maxY = Math.max(...placed.map((r) => r.y + r.svgHeight)) + PADDING + 40;
  const totalArea = input.rooms.reduce((sum, r) => sum + r.width * r.length, 0);

  const title = input.title ?? "Floor Plan";
  const titleY = maxY - 12;

  const roomsSvg = placed.map((r) => renderRoom(r, style)).join("\n");

  // Compass rose
  const compassX = maxX - 40;
  const compassY = 30;
  const compass = `
    <circle cx="${compassX}" cy="${compassY}" r="15" fill="none" stroke="#999" stroke-width="1"/>
    <text x="${compassX}" y="${compassY - 18}" text-anchor="middle" font-family="Arial" font-size="10" fill="#999">N</text>
    <line x1="${compassX}" y1="${compassY - 12}" x2="${compassX}" y2="${compassY + 12}" stroke="#999" stroke-width="1"/>
    <line x1="${compassX - 12}" y1="${compassY}" x2="${compassX + 12}" y2="${compassY}" stroke="#999" stroke-width="1"/>
    <polygon points="${compassX},${compassY - 12} ${compassX - 3},${compassY - 6} ${compassX + 3},${compassY - 6}" fill="#333"/>
  `;

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${maxX} ${maxY}" width="${maxX}" height="${maxY}">
  <rect width="100%" height="100%" fill="${style === "minimal" ? "#fff" : "#fafafa"}"/>
  ${compass}
  ${roomsSvg}
  <text x="${maxX / 2}" y="${titleY}" text-anchor="middle"
        font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#333">
    ${title} \u2014 ${totalArea.toFixed(1)} m\u00B2 total
  </text>
</svg>`;

  return {
    svg,
    totalArea: Math.round(totalArea * 10) / 10,
    roomCount: input.rooms.length,
  };
}
