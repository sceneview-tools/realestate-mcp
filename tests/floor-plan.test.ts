import { describe, it, expect } from "vitest";
import { generateFloorPlan } from "../src/tools/generate-floor-plan.js";

describe("generateFloorPlan", () => {
  it("generates valid SVG for a single room", () => {
    const result = generateFloorPlan({
      rooms: [{ name: "Living Room", width: 5, length: 4, type: "living" }],
    });

    expect(result.svg).toContain("<svg");
    expect(result.svg).toContain("Living Room");
    expect(result.svg).toContain("5m x 4m");
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
    // modern style has rounded corners (rx="4")
    expect(result.svg).toContain('rx="4"');
  });

  it("applies classic style when specified", () => {
    const result = generateFloorPlan({
      rooms: [{ name: "Room", width: 3, length: 3 }],
      style: "classic",
    });
    // classic has sharper corners (rx="0")
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
});
