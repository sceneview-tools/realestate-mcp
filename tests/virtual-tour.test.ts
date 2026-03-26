import { describe, it, expect } from "vitest";
import { createVirtualTour } from "../src/tools/create-virtual-tour.js";

describe("createVirtualTour", () => {
  const baseInput = {
    propertyName: "123 Main Street",
    address: "123 Main Street, Springfield, IL",
    rooms: [
      { name: "Living Room", description: "Spacious living area", features: ["Hardwood floors", "Bay window"] },
      { name: "Kitchen", description: "Modern kitchen", features: ["Granite counters"] },
      { name: "Bedroom", description: "Master suite" },
    ],
  };

  it("generates a tour with unique ID", () => {
    const result = createVirtualTour(baseInput);
    expect(result.tourId).toMatch(/^tour_/);
    expect(result.shareUrl).toContain(result.tourId);
  });

  it("produces valid HTML with all rooms", () => {
    const result = createVirtualTour(baseInput);
    expect(result.embedHtml).toContain("<!DOCTYPE html>");
    expect(result.embedHtml).toContain("Living Room");
    expect(result.embedHtml).toContain("Kitchen");
    expect(result.embedHtml).toContain("Bedroom");
  });

  it("includes branding in output", () => {
    const result = createVirtualTour({
      ...baseInput,
      branding: {
        primaryColor: "#FF0000",
        agentName: "Jane Smith",
        agentPhone: "555-1234",
      },
    });
    expect(result.embedHtml).toContain("Jane Smith");
    expect(result.embedHtml).toContain("555-1234");
    expect(result.embedHtml).toContain("#FF0000");
  });

  it("manifest contains ordered rooms", () => {
    const result = createVirtualTour({
      propertyName: "Test",
      rooms: [
        { name: "B", order: 2 },
        { name: "A", order: 1 },
        { name: "C", order: 3 },
      ],
    });
    expect(result.manifest.rooms[0].name).toBe("A");
    expect(result.manifest.rooms[1].name).toBe("B");
    expect(result.manifest.rooms[2].name).toBe("C");
  });

  it("returns roomCount and totalPhotos", () => {
    const result = createVirtualTour({
      propertyName: "Test",
      rooms: [
        { name: "R1", photoUrls: ["https://example.com/a.jpg", "https://example.com/b.jpg"] },
        { name: "R2", photoUrls: ["https://example.com/c.jpg"] },
        { name: "R3" },
      ],
    });
    expect(result.roomCount).toBe(3);
    expect(result.totalPhotos).toBe(3);
  });

  it("includes keyboard navigation by default", () => {
    const result = createVirtualTour(baseInput);
    expect(result.embedHtml).toContain("ArrowRight");
    expect(result.embedHtml).toContain("ArrowLeft");
  });

  it("includes touch/swipe support by default", () => {
    const result = createVirtualTour(baseInput);
    expect(result.embedHtml).toContain("touchstart");
    expect(result.embedHtml).toContain("touchend");
  });

  it("includes fullscreen toggle by default", () => {
    const result = createVirtualTour(baseInput);
    expect(result.embedHtml).toContain("toggleFullscreen");
  });

  it("includes progress bar by default", () => {
    const result = createVirtualTour(baseInput);
    expect(result.embedHtml).toContain("progressFill");
  });

  it("supports room dimensions", () => {
    const result = createVirtualTour({
      propertyName: "Test",
      rooms: [
        { name: "Room", dimensions: { width: 5, length: 4 } },
      ],
    });
    expect(result.manifest.rooms[0].dimensions).toEqual({ width: 5, length: 4 });
  });

  it("respects settings overrides", () => {
    const result = createVirtualTour({
      ...baseInput,
      settings: {
        enableKeyboard: false,
        enableSwipe: false,
        enableFullscreen: false,
        showProgressBar: false,
      },
    });
    // Keyboard and swipe code should not be in output
    expect(result.embedHtml).not.toContain("ArrowRight");
    expect(result.embedHtml).not.toContain("touchstart");
  });
});
