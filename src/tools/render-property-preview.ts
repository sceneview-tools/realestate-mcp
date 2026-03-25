/**
 * render_property_preview — Generate an embeddable 3D model-viewer HTML snippet
 * for property visualization.
 *
 * Uses Google's <model-viewer> web component for cross-platform 3D/AR display.
 * In production, the modelUrl would come from a 3D scanning service (Matterport,
 * Polycam, RealityScan) or from generated floor plan extrusion.
 */

export interface PropertyPreviewInput {
  propertyName: string;
  modelUrl?: string;        // URL to .glb/.gltf file
  posterUrl?: string;       // Fallback image while model loads
  backgroundColor?: string;
  enableAR?: boolean;       // Enable AR on mobile (default true)
  autoRotate?: boolean;     // Auto-rotate the model (default true)
  cameraOrbit?: string;     // e.g. "45deg 55deg 2.5m"
  annotations?: Annotation[];
  dimensions?: PropertyDimensions;
}

export interface Annotation {
  label: string;
  position: string; // "x y z" in model space
  normal?: string;  // "x y z" surface normal
}

export interface PropertyDimensions {
  width: number;  // meters
  depth: number;  // meters
  height: number; // meters
}

export interface PropertyPreviewOutput {
  embedHtml: string;
  embedUrl: string;
  modelViewerVersion: string;
  features: string[];
}

function buildAnnotations(annotations: Annotation[]): string {
  return annotations
    .map(
      (a, i) =>
        `<button class="hotspot" slot="hotspot-${i}"
           data-position="${a.position}"${a.normal ? ` data-normal="${a.normal}"` : ""}
           data-visibility-attribute="visible">
          <div class="annotation">${a.label}</div>
        </button>`
    )
    .join("\n    ");
}

function generateFallbackModel(dims?: PropertyDimensions): string {
  // Generate an inline simple house model as a data URI placeholder
  // In production, this would be a real .glb URL
  const w = dims?.width ?? 10;
  const d = dims?.depth ?? 8;
  const h = dims?.height ?? 3;

  return `<!-- Placeholder: in production, provide a .glb model URL -->
    <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;flex-direction:column;color:#666;">
      <svg width="200" height="160" viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg">
        <rect x="30" y="70" width="140" height="80" fill="#e8e0d5" stroke="#333" stroke-width="2"/>
        <polygon points="100,20 20,70 180,70" fill="#c0392b" stroke="#333" stroke-width="2"/>
        <rect x="80" y="100" width="40" height="50" fill="#8B4513" stroke="#333" stroke-width="1"/>
        <rect x="45" y="85" width="25" height="25" fill="#87CEEB" stroke="#333" stroke-width="1"/>
        <rect x="130" y="85" width="25" height="25" fill="#87CEEB" stroke="#333" stroke-width="1"/>
        <line x1="57" y1="85" x2="57" y2="110" stroke="#333" stroke-width="0.5"/>
        <line x1="45" y1="97" x2="70" y2="97" stroke="#333" stroke-width="0.5"/>
        <line x1="142" y1="85" x2="142" y2="110" stroke="#333" stroke-width="0.5"/>
        <line x1="130" y1="97" x2="155" y2="97" stroke="#333" stroke-width="0.5"/>
      </svg>
      <p style="margin-top:12px;font-size:14px;">3D Model Preview</p>
      <p style="font-size:12px;color:#999;">${w}m x ${d}m x ${h}m</p>
    </div>`;
}

export function renderPropertyPreview(input: PropertyPreviewInput): PropertyPreviewOutput {
  const bgColor = input.backgroundColor ?? "#f5f5f5";
  const enableAR = input.enableAR !== false;
  const autoRotate = input.autoRotate !== false;
  const cameraOrbit = input.cameraOrbit ?? "45deg 55deg 2.5m";
  const modelViewerVersion = "4.0.0";

  const features: string[] = [];
  if (input.modelUrl) features.push("3D model rendering");
  if (enableAR) features.push("AR view on mobile");
  if (autoRotate) features.push("Auto-rotation");
  if (input.annotations?.length) features.push(`${input.annotations.length} annotation(s)`);
  if (input.posterUrl) features.push("Poster fallback");

  const hasModel = !!input.modelUrl;

  const annotationHtml = input.annotations?.length
    ? buildAnnotations(input.annotations)
    : "";

  const arAttr = enableAR ? "ar ar-modes=\"webxr scene-viewer quick-look\"" : "";
  const autoRotateAttr = autoRotate ? "auto-rotate" : "";
  const posterAttr = input.posterUrl ? `poster="${input.posterUrl}"` : "";

  const modelViewerHtml = hasModel
    ? `<model-viewer
        src="${input.modelUrl}"
        alt="${input.propertyName} — 3D Preview"
        ${arAttr}
        ${autoRotateAttr}
        camera-controls
        touch-action="pan-y"
        camera-orbit="${cameraOrbit}"
        ${posterAttr}
        style="width:100%;height:100%;background:${bgColor};"
        shadow-intensity="1"
        exposure="0.75"
      >
        ${annotationHtml}
        ${enableAR ? '<button slot="ar-button" class="ar-btn">View in AR</button>' : ""}
      </model-viewer>`
    : generateFallbackModel(input.dimensions);

  const embedHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${input.propertyName} — 3D Preview</title>
  ${hasModel ? `<script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/${modelViewerVersion}/model-viewer.min.js"><\/script>` : ""}
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .container { width: 100%; max-width: 1200px; margin: 0 auto; }
    .viewer { width: 100%; height: 600px; position: relative; background: ${bgColor}; border-radius: 12px; overflow: hidden; }
    .title-bar { padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; }
    .title-bar h1 { font-size: 20px; color: #333; }
    .badge { background: #10B981; color: white; padding: 4px 12px; border-radius: 16px; font-size: 12px; }
    .ar-btn { position: absolute; bottom: 16px; right: 16px; background: #2563EB; color: white;
              border: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; cursor: pointer; z-index: 10; }
    .ar-btn:hover { background: #1D4ED8; }
    .hotspot { background: #fff; border: 2px solid #2563EB; border-radius: 50%; width: 28px; height: 28px;
               cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .annotation { background: #2563EB; color: white; padding: 4px 10px; border-radius: 4px;
                  font-size: 12px; white-space: nowrap; position: absolute; bottom: 36px; left: 50%;
                  transform: translateX(-50%); pointer-events: none; }
    .info-bar { padding: 12px 24px; display: flex; gap: 16px; flex-wrap: wrap; }
    .info-item { font-size: 13px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="title-bar">
      <h1>${input.propertyName}</h1>
      <span class="badge">${hasModel ? "3D" : "Preview"}${enableAR ? " + AR" : ""}</span>
    </div>
    <div class="viewer">
      ${modelViewerHtml}
    </div>
    <div class="info-bar">
      ${input.dimensions ? `<span class="info-item">${input.dimensions.width}m x ${input.dimensions.depth}m x ${input.dimensions.height}m</span>` : ""}
      ${enableAR ? '<span class="info-item">AR available on mobile</span>' : ""}
      ${autoRotate ? '<span class="info-item">Auto-rotating</span>' : ""}
    </div>
  </div>
</body>
</html>`;

  const embedUrl = `https://preview.realestate-mcp.com/embed/${Date.now().toString(36)}`;

  return {
    embedHtml,
    embedUrl,
    modelViewerVersion,
    features,
  };
}
