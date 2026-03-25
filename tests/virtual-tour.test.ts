import { describe, it, expect } from "vitest";
import { createVirtualTour } from "../src/tools/create-virtual-tour.js";

describe("createVirtualTour", () => {
  it("generates a tour with all rooms", () => {
    const result = createVirtualTour({
      propertyName: "123 Main Street",
      rooms: [
        { name: "Living Room", description: "Spacious living area", features: ["Hardwood floors"] },
        { name: "Kitchen", description: "Modern kitchen" },
      ],
    });

    expect(result.tourId).toMatch(/^tour_/);
    expect(result.manifest.rooms).toHaveLength(2);
    expect(result.shareUrl).toContain(result.tourId);
    expect(result.embedHtml).toContain("123 Main Street");
  });

  it("includes branding in the HTML", () => {
    const result = createVirtualTour({
      propertyName: "Test Property",
      rooms: [{ name: "Room 1" }],
      branding: {
        agentName: "Jane Smith",
        agentPhone: "555-0123",
        primaryColor: "#FF0000",
      },
    });

    expect(result.embedHtml).toContain("Jane Smith");
    expect(result.embedHtml).toContain("555-0123");
    expect(result.embedHtml).toContain("#FF0000");
  });

  it("sorts rooms by order", () => {
    const result = createVirtualTour({
      propertyName: "Test",
      rooms: [
        { name: "C", order: 3 },
        { name: "A", order: 1 },
        { name: "B", order: 2 },
      ],
    });

    expect(result.manifest.rooms[0].name).toBe("A");
    expect(result.manifest.rooms[1].name).toBe("B");
    expect(result.manifest.rooms[2].name).toBe("C");
  });

  it("includes keyboard navigation script", () => {
    const result = createVirtualTour({
      propertyName: "Test",
      rooms: [{ name: "Room" }],
    });
    expect(result.embedHtml).toContain("ArrowRight");
    expect(result.embedHtml).toContain("ArrowLeft");
  });
});
