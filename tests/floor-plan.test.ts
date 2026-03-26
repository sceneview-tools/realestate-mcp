import { describe, it, expect } from "vitest";
import { generateFloorPlan } from "../src/tools/generate-floor-plan.js";

describe("generateFloorPlan", () => {
  it("generates valid SVG for a single room", () => {
    const result = generateFloorPlan({
      rooms: [{ name: "Living Room", width: 5, length: 4, type: "living" }],
    });

    expect(result.svg).toContain("<svg");
    expect(result.svg).toContain("Living Room");
    expect(result.svg).toContain("5m");
    expect(result.totalArea).toBe(20);
    expect(result.roomCount).toBe(1);
  });

  it("computes total area for multiple rooms", () => {
    const result = generateFloorPlan({
      rooms: [
        { name: "Bedroom", width: 4, length: 3, type: "bedroom" },
        { name: "Kitchen", width: 3, length: 3, type: "kitchen" },
        { name: "Bathroom", width: 2, length: 2, type: "bathroom" },
      ],
      title: "Apartment 4B",
    });

    expect(result.totalArea).toBe(25); // 12 + 9 + 4
    expect(result.roomCount).toBe(3);
    expect(result.svg).toContain("Apartment 4B");
  });

  it("uses modern style by default", () => {
    const result = generateFloorPlan({
      rooms: [{ name: "Room", width: 3, length: 3 }],
    });
    expect(result.svg).toContain('rx="4"');
  });

  it("applies classic style when specified", () => {
    const result = generateFloorPlan({
      rooms: [{ name: "Room", width: 3, length: 3 }],
      style: "classic",
    });
    expect(result.svg).toContain('rx="0"');
  });

  it("includes compass rose", () => {
    const result = generateFloorPlan({
      rooms: [{ name: "Room", width: 3, length: 3 }],
    });
    expect(result.svg).toContain(">N<");
  });

  it("includes area in square meters per room", () => {
    const result = generateFloorPlan({
      rooms: [{ name: "Office", width: 3.5, length: 4, type: "office" }],
    });
    expect(result.svg).toContain("14.0 m");
  });

  it("returns room breakdown with sqft", () => {
    const result = generateFloorPlan({
      rooms: [
        { name: "Living", width: 5, length: 4, type: "living" },
        { name: "Bed", width: 4, length: 3, type: "bedroom" },
      ],
    });
    expect(result.rooms).toHaveLength(2);
    expect(result.rooms[0].name).toBe("Living");
    expect(result.rooms[0].area).toBe(20);
    expect(result.rooms[0].areaSqFt).toBeGreaterThan(200);
    expect(result.totalAreaSqFt).toBeGreaterThan(300);
  });

  it("renders in imperial units when specified", () => {
    const result = generateFloorPlan({
      rooms: [{ name: "Room", width: 3, length: 3 }],
      unit: "imperial",
    });
    expect(result.svg).toContain("ft");
    expect(result.svg).toContain("sq ft");
  });

  it("renders scale bar by default", () => {
    const result = generateFloorPlan({
      rooms: [{ name: "Room", width: 3, length: 3 }],
    });
    expect(result.svg).toContain("1 m");
  });

  it("hides scale bar when showScaleBar is false", () => {
    const result = generateFloorPlan({
      rooms: [{ name: "Room", width: 3, length: 3 }],
      showScaleBar: false,
    });
    // Scale bar text "1 m" should not appear as a standalone label
    // The title still contains "m²" but the scale bar itself is omitted
    expect(result.svg).not.toContain("~3.3 ft");
  });

  it("renders legend with room type colors", () => {
    const result = generateFloorPlan({
      rooms: [
        { name: "Bed", width: 3, length: 3, type: "bedroom" },
        { name: "Bath", width: 2, length: 2, type: "bathroom" },
      ],
    });
    expect(result.svg).toContain("Bedroom");
    expect(result.svg).toContain("Bathroom");
  });

  it("supports all room types including new ones", () => {
    const result = generateFloorPlan({
      rooms: [
        { name: "Storage", width: 2, length: 2, type: "storage" },
        { name: "Laundry", width: 2, length: 2, type: "laundry" },
        { name: "Balcony", width: 3, length: 1, type: "balcony" },
      ],
    });
    expect(result.roomCount).toBe(3);
    expect(result.svg).toContain("Storage");
    expect(result.svg).toContain("Laundry");
    expect(result.svg).toContain("Balcony");
  });
});
