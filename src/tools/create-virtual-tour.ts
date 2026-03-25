/**
 * create_virtual_tour — Create an embeddable 3D virtual tour configuration
 * from photos or text descriptions of property rooms.
 *
 * In production, this would integrate with a 3D tour platform (Matterport, etc.).
 * This scaffold generates a tour manifest and a self-contained HTML viewer.
 */

export interface VirtualTourInput {
  propertyName: string;
  address?: string;
  rooms: TourRoom[];
  branding?: {
    primaryColor?: string;
    logo?: string;
    agentName?: string;
    agentPhone?: string;
  };
}

export interface TourRoom {
  name: string;
  description?: string;
  photoUrls?: string[];
  features?: string[];
  order?: number;
}

export interface VirtualTourOutput {
  tourId: string;
  embedHtml: string;
  manifest: TourManifest;
  shareUrl: string;
}

interface TourManifest {
  id: string;
  propertyName: string;
  address?: string;
  createdAt: string;
  rooms: TourManifestRoom[];
  branding: NonNullable<VirtualTourInput["branding"]>;
}

interface TourManifestRoom {
  id: string;
  name: string;
  description: string;
  photoUrls: string[];
  features: string[];
  order: number;
}

function generateId(): string {
  return `tour_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function createVirtualTour(input: VirtualTourInput): VirtualTourOutput {
  const tourId = generateId();
  const primaryColor = input.branding?.primaryColor ?? "#2563EB";

  const rooms: TourManifestRoom[] = input.rooms.map((room, idx) => ({
    id: slugify(room.name) || `room-${idx}`,
    name: room.name,
    description: room.description ?? `View of the ${room.name.toLowerCase()}`,
    photoUrls: room.photoUrls ?? [],
    features: room.features ?? [],
    order: room.order ?? idx,
  }));

  rooms.sort((a, b) => a.order - b.order);

  const manifest: TourManifest = {
    id: tourId,
    propertyName: input.propertyName,
    address: input.address,
    createdAt: new Date().toISOString(),
    rooms,
    branding: {
      primaryColor,
      logo: input.branding?.logo,
      agentName: input.branding?.agentName,
      agentPhone: input.branding?.agentPhone,
    },
  };

  const roomNavItems = rooms
    .map(
      (r, i) =>
        `<button onclick="showRoom(${i})" class="nav-btn" id="nav-${i}">${r.name}</button>`
    )
    .join("\n          ");

  const roomDataJson = JSON.stringify(rooms, null, 2);

  const embedHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${input.propertyName} — Virtual Tour</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #111; color: #fff; }
    .tour-container { max-width: 1200px; margin: 0 auto; min-height: 100vh; display: flex; flex-direction: column; }
    .header { padding: 16px 24px; background: ${primaryColor}; display: flex; justify-content: space-between; align-items: center; }
    .header h1 { font-size: 20px; }
    .header .agent { font-size: 14px; opacity: 0.9; }
    .viewer { flex: 1; display: flex; align-items: center; justify-content: center; background: #1a1a1a; position: relative; min-height: 500px; }
    .room-info { padding: 20px; text-align: center; }
    .room-info h2 { font-size: 28px; margin-bottom: 8px; }
    .room-info p { font-size: 16px; color: #aaa; max-width: 600px; margin: 0 auto 16px; }
    .features { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
    .feature { background: rgba(255,255,255,0.1); padding: 4px 12px; border-radius: 16px; font-size: 13px; }
    .nav { padding: 12px 24px; background: #222; display: flex; gap: 8px; overflow-x: auto; }
    .nav-btn { background: #333; color: #fff; border: 2px solid transparent; padding: 8px 16px;
               border-radius: 8px; cursor: pointer; font-size: 14px; white-space: nowrap; }
    .nav-btn:hover { background: #444; }
    .nav-btn.active { border-color: ${primaryColor}; background: rgba(37,99,235,0.2); }
    .photo-placeholder { width: 100%; height: 100%; display: flex; align-items: center;
                         justify-content: center; font-size: 48px; color: #444; }
    .counter { position: absolute; bottom: 16px; right: 16px; background: rgba(0,0,0,0.7);
               padding: 4px 12px; border-radius: 4px; font-size: 13px; }
  </style>
</head>
<body>
  <div class="tour-container">
    <div class="header">
      <h1>${input.propertyName}</h1>
      <div class="agent">
        ${input.branding?.agentName ? `${input.branding.agentName}` : ""}
        ${input.branding?.agentPhone ? ` | ${input.branding.agentPhone}` : ""}
      </div>
    </div>
    <div class="viewer" id="viewer">
      <div class="room-info" id="room-info"></div>
      <div class="counter" id="counter"></div>
    </div>
    <div class="nav" id="nav">
      ${roomNavItems}
    </div>
  </div>
  <script>
    const rooms = ${roomDataJson};
    let current = 0;
    function showRoom(idx) {
      current = idx;
      const room = rooms[idx];
      document.getElementById('room-info').innerHTML =
        '<h2>' + room.name + '</h2>' +
        '<p>' + room.description + '</p>' +
        '<div class="features">' +
        room.features.map(f => '<span class="feature">' + f + '</span>').join('') +
        '</div>';
      document.getElementById('counter').textContent = (idx + 1) + ' / ' + rooms.length;
      document.querySelectorAll('.nav-btn').forEach((btn, i) => {
        btn.classList.toggle('active', i === idx);
      });
    }
    showRoom(0);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') showRoom(Math.min(current + 1, rooms.length - 1));
      if (e.key === 'ArrowLeft') showRoom(Math.max(current - 1, 0));
    });
  </script>
</body>
</html>`;

  const shareUrl = `https://tour.realestate-mcp.com/${tourId}`;

  return {
    tourId,
    embedHtml,
    manifest,
    shareUrl,
  };
}
