/**
 * create_virtual_tour — Create an embeddable 3D virtual tour configuration
 * from photos or text descriptions of property rooms.
 *
 * v2.0: Improved HTML with smooth transitions, fullscreen mode, touch/swipe
 * support, photo gallery per room, progress bar, and keyboard navigation.
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
    agentEmail?: string;
  };
  settings?: {
    autoPlay?: boolean;
    autoPlayInterval?: number; // seconds, default 8
    showProgressBar?: boolean;
    showThumbnails?: boolean;
    enableFullscreen?: boolean;
    enableKeyboard?: boolean;
    enableSwipe?: boolean;
  };
}

export interface TourRoom {
  name: string;
  description?: string;
  photoUrls?: string[];
  features?: string[];
  order?: number;
  dimensions?: { width: number; length: number };
}

export interface VirtualTourOutput {
  tourId: string;
  embedHtml: string;
  manifest: TourManifest;
  shareUrl: string;
  roomCount: number;
  totalPhotos: number;
}

interface TourManifest {
  id: string;
  propertyName: string;
  address?: string;
  createdAt: string;
  rooms: TourManifestRoom[];
  branding: NonNullable<VirtualTourInput["branding"]>;
  settings: NonNullable<VirtualTourInput["settings"]>;
}

interface TourManifestRoom {
  id: string;
  name: string;
  description: string;
  photoUrls: string[];
  features: string[];
  order: number;
  dimensions?: { width: number; length: number };
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
  const settings = {
    autoPlay: input.settings?.autoPlay ?? false,
    autoPlayInterval: input.settings?.autoPlayInterval ?? 8,
    showProgressBar: input.settings?.showProgressBar !== false,
    showThumbnails: input.settings?.showThumbnails !== false,
    enableFullscreen: input.settings?.enableFullscreen !== false,
    enableKeyboard: input.settings?.enableKeyboard !== false,
    enableSwipe: input.settings?.enableSwipe !== false,
  };

  const rooms: TourManifestRoom[] = input.rooms.map((room, idx) => ({
    id: slugify(room.name) || `room-${idx}`,
    name: room.name,
    description: room.description ?? `View of the ${room.name.toLowerCase()}`,
    photoUrls: room.photoUrls ?? [],
    features: room.features ?? [],
    order: room.order ?? idx,
    dimensions: room.dimensions,
  }));

  rooms.sort((a, b) => a.order - b.order);

  const totalPhotos = rooms.reduce((sum, r) => sum + r.photoUrls.length, 0);

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
      agentEmail: input.branding?.agentEmail,
    },
    settings,
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
  <title>${input.propertyName} \u2014 Virtual Tour</title>
  <meta name="description" content="Virtual tour of ${input.propertyName}${input.address ? ` at ${input.address}` : ""}">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #111; color: #fff; overflow: hidden; }
    .tour-container { width: 100vw; height: 100vh; display: flex; flex-direction: column; }

    /* Header */
    .header { padding: 12px 24px; background: linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd); display: flex; justify-content: space-between; align-items: center; z-index: 10; }
    .header h1 { font-size: 18px; font-weight: 600; }
    .header .address { font-size: 13px; opacity: 0.85; margin-top: 2px; }
    .header-right { display: flex; align-items: center; gap: 12px; }
    .agent-info { text-align: right; font-size: 13px; opacity: 0.9; }
    .btn-icon { background: rgba(255,255,255,0.2); border: none; color: #fff; width: 36px; height: 36px; border-radius: 8px; cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center; transition: background 0.2s; }
    .btn-icon:hover { background: rgba(255,255,255,0.3); }

    /* Progress bar */
    .progress-bar { height: 3px; background: rgba(255,255,255,0.15); }
    .progress-fill { height: 100%; background: ${primaryColor}; transition: width 0.5s ease; }

    /* Main viewer */
    .viewer { flex: 1; position: relative; background: #1a1a1a; overflow: hidden; }
    .room-content { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.5s ease, transform 0.3s ease; pointer-events: none; }
    .room-content.active { opacity: 1; pointer-events: auto; }
    .room-info { padding: 20px; text-align: center; max-width: 700px; }
    .room-info h2 { font-size: 32px; margin-bottom: 8px; font-weight: 700; }
    .room-info .dim { font-size: 14px; color: #888; margin-bottom: 8px; }
    .room-info p { font-size: 16px; color: #aaa; margin-bottom: 16px; line-height: 1.5; }
    .features { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
    .feature { background: rgba(255,255,255,0.08); backdrop-filter: blur(8px); padding: 6px 14px; border-radius: 20px; font-size: 13px; border: 1px solid rgba(255,255,255,0.1); }

    /* Photo gallery */
    .photo-grid { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin-top: 16px; }
    .photo-thumb { width: 120px; height: 80px; border-radius: 8px; object-fit: cover; border: 2px solid transparent; cursor: pointer; transition: border-color 0.2s, transform 0.2s; }
    .photo-thumb:hover { border-color: ${primaryColor}; transform: scale(1.05); }

    /* Navigation arrows */
    .nav-arrow { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); color: #fff; border: none; width: 48px; height: 48px; border-radius: 50%; cursor: pointer; font-size: 24px; transition: background 0.2s, transform 0.2s; z-index: 5; display: flex; align-items: center; justify-content: center; }
    .nav-arrow:hover { background: rgba(0,0,0,0.7); transform: translateY(-50%) scale(1.1); }
    .nav-arrow.prev { left: 16px; }
    .nav-arrow.next { right: 16px; }
    .nav-arrow:disabled { opacity: 0.3; cursor: default; }

    /* Counter */
    .counter { position: absolute; bottom: 16px; right: 16px; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); padding: 6px 14px; border-radius: 20px; font-size: 13px; z-index: 5; }

    /* Bottom nav */
    .nav { padding: 10px 16px; background: #1a1a1a; display: flex; gap: 6px; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; border-top: 1px solid #333; }
    .nav::-webkit-scrollbar { display: none; }
    .nav-btn { background: #2a2a2a; color: #ccc; border: 2px solid transparent; padding: 8px 16px; border-radius: 10px; cursor: pointer; font-size: 13px; white-space: nowrap; transition: all 0.2s; font-weight: 500; }
    .nav-btn:hover { background: #333; color: #fff; }
    .nav-btn.active { border-color: ${primaryColor}; background: ${primaryColor}22; color: #fff; }

    /* Fullscreen */
    .tour-container.fullscreen { position: fixed; inset: 0; z-index: 9999; }

    /* Mobile */
    @media (max-width: 640px) {
      .header h1 { font-size: 15px; }
      .room-info h2 { font-size: 24px; }
      .nav-arrow { width: 40px; height: 40px; font-size: 20px; }
      .photo-thumb { width: 80px; height: 56px; }
    }
  </style>
</head>
<body>
  <div class="tour-container" id="tourContainer">
    <div class="header">
      <div>
        <h1>${input.propertyName}</h1>
        ${input.address ? `<div class="address">${input.address}</div>` : ""}
      </div>
      <div class="header-right">
        <div class="agent-info">
          ${input.branding?.agentName ? `<div>${input.branding.agentName}</div>` : ""}
          ${input.branding?.agentPhone ? `<div>${input.branding.agentPhone}</div>` : ""}
        </div>
        ${settings.enableFullscreen ? '<button class="btn-icon" onclick="toggleFullscreen()" title="Fullscreen">\u26F6</button>' : ""}
      </div>
    </div>
    ${settings.showProgressBar ? '<div class="progress-bar"><div class="progress-fill" id="progressFill"></div></div>' : ""}
    <div class="viewer" id="viewer">
      ${rooms.map((_, i) => `<div class="room-content${i === 0 ? " active" : ""}" id="room-${i}"></div>`).join("\n      ")}
      <button class="nav-arrow prev" id="prevBtn" onclick="prevRoom()">\u2039</button>
      <button class="nav-arrow next" id="nextBtn" onclick="nextRoom()">\u203A</button>
      <div class="counter" id="counter"></div>
    </div>
    <div class="nav" id="nav">
      ${roomNavItems}
    </div>
  </div>
  <script>
    const rooms = ${roomDataJson};
    let current = 0;
    let touchStartX = 0;

    function renderRoomContent(room) {
      let html = '<div class="room-info">';
      html += '<h2>' + room.name + '</h2>';
      if (room.dimensions) {
        html += '<div class="dim">' + room.dimensions.width + 'm \\u00D7 ' + room.dimensions.length + 'm (' + (room.dimensions.width * room.dimensions.length).toFixed(1) + ' m\\u00B2)</div>';
      }
      html += '<p>' + room.description + '</p>';
      if (room.features.length > 0) {
        html += '<div class="features">' + room.features.map(function(f) { return '<span class="feature">' + f + '</span>'; }).join('') + '</div>';
      }
      if (room.photoUrls.length > 0) {
        html += '<div class="photo-grid">' + room.photoUrls.map(function(url) { return '<img class="photo-thumb" src="' + url + '" alt="Photo" onerror="this.style.display=\\'none\\'"/>'; }).join('') + '</div>';
      }
      html += '</div>';
      return html;
    }

    function showRoom(idx) {
      if (idx < 0 || idx >= rooms.length) return;
      document.querySelectorAll('.room-content').forEach(function(el, i) {
        el.classList.toggle('active', i === idx);
        if (i === idx && !el.dataset.rendered) {
          el.innerHTML = renderRoomContent(rooms[i]);
          el.dataset.rendered = 'true';
        }
      });
      current = idx;
      document.getElementById('counter').textContent = (idx + 1) + ' / ' + rooms.length;
      document.querySelectorAll('.nav-btn').forEach(function(btn, i) {
        btn.classList.toggle('active', i === idx);
      });
      var prevBtn = document.getElementById('prevBtn');
      var nextBtn = document.getElementById('nextBtn');
      if (prevBtn) prevBtn.disabled = idx === 0;
      if (nextBtn) nextBtn.disabled = idx === rooms.length - 1;
      var fill = document.getElementById('progressFill');
      if (fill) fill.style.width = ((idx + 1) / rooms.length * 100) + '%';
      // Scroll active nav button into view
      var activeNav = document.getElementById('nav-' + idx);
      if (activeNav) activeNav.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }

    function nextRoom() { showRoom(Math.min(current + 1, rooms.length - 1)); }
    function prevRoom() { showRoom(Math.max(current - 1, 0)); }

    function toggleFullscreen() {
      document.getElementById('tourContainer').classList.toggle('fullscreen');
    }

    // Keyboard navigation
    ${settings.enableKeyboard ? `
    document.addEventListener('keydown', function(e) {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); nextRoom(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prevRoom(); }
      if (e.key === 'Escape') { document.getElementById('tourContainer').classList.remove('fullscreen'); }
      if (e.key === 'f' || e.key === 'F') { toggleFullscreen(); }
    });` : ""}

    // Touch/swipe
    ${settings.enableSwipe ? `
    var viewer = document.getElementById('viewer');
    viewer.addEventListener('touchstart', function(e) { touchStartX = e.touches[0].clientX; });
    viewer.addEventListener('touchend', function(e) {
      var diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) { diff > 0 ? nextRoom() : prevRoom(); }
    });` : ""}

    // Auto-play
    ${settings.autoPlay ? `setInterval(function() { showRoom(current < rooms.length - 1 ? current + 1 : 0); }, ${settings.autoPlayInterval * 1000});` : ""}

    showRoom(0);
  </script>
</body>
</html>`;

  const shareUrl = `https://tour.realestate-mcp.com/${tourId}`;

  return {
    tourId,
    embedHtml,
    manifest,
    shareUrl,
    roomCount: rooms.length,
    totalPhotos,
  };
}
