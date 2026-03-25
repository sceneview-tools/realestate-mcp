import { describe, it, expect } from "vitest";
import { renderPropertyPreview } from "../src/tools/render-property-preview.js";

describe("renderPropertyPreview", () => {
  it("generates HTML with model-viewer when modelUrl is provided", () => {
    const result = renderPropertyPreview({
      propertyName: "Test Property",
      modelUrl: "https://example.com/house.glb",
    });

    expect(result.embedHtml).toContain("model-viewer");
    expect(result.embedHtml).toContain("house.glb");
    expect(result.features).toContain("3D model rendering");
  });

  it("generates fallback when no modelUrl", () => {
    const result = renderPropertyPreview({
      propertyName: "Test Property",
      dimensions: { width: 12, depth: 8, height: 3 },
    });

    expect(result.embedHtml).toContain("3D Model Preview");
    expect(result.embedHtml).toContain("12m x 8m x 3m");
    expect(result.embedHtml).not.toContain("model-viewer");
  });

  it("includes AR button when enabled", () => {
    const result = renderPropertyPreview({
      propertyName: "AR House",
      modelUrl: "https://example.com/house.glb",
      enableAR: true,
    });

    expect(result.embedHtml).toContain("ar-button");
    expect(result.embedHtml).toContain("View in AR");
    expect(result.features).toContain("AR view on mobile");
  });

  it("disables AR when requested", () => {
    const result = renderPropertyPreview({
      propertyName: "No AR",
      modelUrl: "https://example.com/house.glb",
      enableAR: false,
    });

    expect(result.embedHtml).not.toContain("ar-button");
  });

  it("includes annotations", () => {
    const result = renderPropertyPreview({
      propertyName: "Annotated",
      modelUrl: "https://example.com/house.glb",
      annotations: [
        { label: "Front Door", position: "0 0 1" },
        { label: "Garage", position: "1 0 0", normal: "0 1 0" },
      ],
    });

    expect(result.embedHtml).toContain("Front Door");
    expect(result.embedHtml).toContain("Garage");
    expect(result.features).toContain("2 annotation(s)");
  });

  it("returns embed URL and model-viewer version", () => {
    const result = renderPropertyPreview({ propertyName: "Test" });
    expect(result.embedUrl).toMatch(/^https:\/\//);
    expect(result.modelViewerVersion).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
