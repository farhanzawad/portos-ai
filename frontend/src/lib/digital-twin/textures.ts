/**
 * Procedural PBR Texture Generator for PORTOS AI 3D Terminal Digital Twin
 * Generates photorealistic, lightweight, self-contained CanvasTextures in Three.js:
 * - Reinforced concrete terminal apron with expansion joints, roadway lane stripes, and zebra crossings
 * - Continuous quay wall with 45° yellow/black safety hazard chevrons and embedded crane rails
 * - Individual yard block pads with container bay slot brackets and stenciled block labels
 * - Procedural water normal maps and deep hydrographic depth gradients
 * - Industrial facility textures (workshop corrugated siding, control tower glass, fuel tank sheet metal)
 */

import * as THREE from "three";

// In-memory cache for textures so each unique texture is synthesized once and reused with zero GC
const textureCache = new Map<string, THREE.CanvasTexture>();

/**
 * Helper to ensure textures are created safely in browser environments
 */
function createOffscreenCanvas(width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  return { canvas, ctx };
}

/**
 * 1. TERMINAL GROUND APTRON & ROADWAY PAVEMENT TEXTURE
 * Generates high-density concrete paving slab grid with embedded asphalt haulage roadway,
 * dashed yellow centerlines, solid white edge lines, directional arrows, and pedestrian crosswalks.
 */
export function getTerminalApronTexture(): THREE.CanvasTexture | null {
  const cacheKey = "terminal_apron_pavement_v2";
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const res = createOffscreenCanvas(1024, 1024);
  if (!res) return null;
  const { canvas, ctx } = res;

  // Base Heavy-Duty Port Concrete (#1e2736)
  ctx.fillStyle = "#1e2736";
  ctx.fillRect(0, 0, 1024, 1024);

  // Subtle concrete aggregate noise
  ctx.fillStyle = "rgba(255, 255, 255, 0.025)";
  for (let i = 0; i < 4000; i++) {
    const nx = Math.random() * 1024;
    const ny = Math.random() * 1024;
    const sz = Math.random() * 2 + 1;
    ctx.fillRect(nx, ny, sz, sz);
  }
  ctx.fillStyle = "rgba(0, 0, 0, 0.04)";
  for (let i = 0; i < 3000; i++) {
    const nx = Math.random() * 1024;
    const ny = Math.random() * 1024;
    ctx.fillRect(nx, ny, 2, 2);
  }

  // 4m x 4m Pre-cast Concrete Slab Seam Grid
  ctx.strokeStyle = "rgba(10, 15, 25, 0.6)";
  ctx.lineWidth = 1.5;
  const gridSize = 64;
  ctx.beginPath();
  for (let x = 0; x <= 1024; x += gridSize) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 1024);
  }
  for (let y = 0; y <= 1024; y += gridSize) {
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
  }
  ctx.stroke();

  // Highlight along slab joints for 3D bevel relief
  ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 1; x <= 1024; x += gridSize) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 1024);
  }
  for (let y = 1; y <= 1024; y += gridSize) {
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
  }
  ctx.stroke();

  // Internal Circulation Roadway Band (Central East-West Traffic Corridor)
  const roadY = 440;
  const roadH = 144;
  ctx.fillStyle = "#141c24"; // Dark dense asphalt
  ctx.fillRect(0, roadY, 1024, roadH);

  // Roadway Outer Solid White Edge Lines (4-inch highway specification)
  ctx.strokeStyle = "#f8fafc";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, roadY + 4);
  ctx.lineTo(1024, roadY + 4);
  ctx.moveTo(0, roadY + roadH - 4);
  ctx.lineTo(1024, roadY + roadH - 4);
  ctx.stroke();

  // Roadway Center Dashed Yellow Dividing Line
  ctx.strokeStyle = "#eab308";
  ctx.lineWidth = 5;
  ctx.setLineDash([28, 20]);
  ctx.beginPath();
  ctx.moveTo(0, roadY + roadH / 2);
  ctx.lineTo(1024, roadY + roadH / 2);
  ctx.stroke();
  ctx.setLineDash([]); // Reset dash

  // Directional Arrows on Eastbound Lane (top lane)
  ctx.fillStyle = "#f8fafc";
  const drawArrow = (ax: number, ay: number, isEast: boolean) => {
    ctx.save();
    ctx.translate(ax, ay);
    if (!isEast) ctx.scale(-1, 1);
    ctx.beginPath();
    ctx.moveTo(-16, -4);
    ctx.lineTo(8, -4);
    ctx.lineTo(8, -10);
    ctx.lineTo(24, 0);
    ctx.lineTo(8, 10);
    ctx.lineTo(8, 4);
    ctx.lineTo(-16, 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  drawArrow(220, roadY + 36, true);
  drawArrow(720, roadY + 36, true);
  drawArrow(340, roadY + 108, false);
  drawArrow(840, roadY + 108, false);

  // Pedestrian Zebra Crossings near Gate and Administration complex
  const drawCrosswalk = (cx: number) => {
    ctx.fillStyle = "#ffffff";
    const barWidth = 14;
    const barGap = 12;
    for (let by = roadY + 6; by < roadY + roadH - 12; by += barWidth + barGap) {
      ctx.fillRect(cx, by, 48, barWidth);
    }
  };
  drawCrosswalk(80);
  drawCrosswalk(520);
  drawCrosswalk(940);

  // Yellow Safety Hazard Border for Yard Block Staging Areas
  ctx.strokeStyle = "#eab308";
  ctx.lineWidth = 3;
  ctx.strokeRect(30, 80, 440, 280);
  ctx.strokeRect(550, 80, 440, 280);
  ctx.strokeRect(30, 660, 440, 280);
  ctx.strokeRect(550, 660, 440, 280);

  // Container tractor parking stall markings
  ctx.strokeStyle = "#f8fafc";
  ctx.lineWidth = 2;
  for (let px = 60; px < 460; px += 45) {
    ctx.strokeRect(px, 370, 36, 55);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 3);
  texture.anisotropy = 8;
  texture.needsUpdate = true;

  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * 2. QUAY APRON COPING & HAZARD STRIPING TEXTURE
 * Creates prominent 45-degree Safety Yellow & Black chevron stripes running along the
 * entire water frontage, with embedded crane rail troughs, mooring bollard rings, and concrete joints.
 */
export function getQuayCopingTexture(): THREE.CanvasTexture | null {
  const cacheKey = "quay_coping_hazard_v2";
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const res = createOffscreenCanvas(1024, 256);
  if (!res) return null;
  const { canvas, ctx } = res;

  // Marine Structural Quay Concrete (#2d3748)
  ctx.fillStyle = "#2d3748";
  ctx.fillRect(0, 0, 1024, 256);

  // Subtle concrete texture noise
  ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
  for (let i = 0; i < 2000; i++) {
    ctx.fillRect(Math.random() * 1024, Math.random() * 256, 2, 2);
  }

  // 45-Degree Industrial Yellow/Black Safety Chevron Coping Stripe (Front 48px along water edge)
  const stripeW = 32;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, 1024, 48);
  ctx.clip();

  ctx.fillStyle = "#eab308"; // High-visibility yellow
  ctx.fillRect(0, 0, 1024, 48);

  ctx.fillStyle = "#0f172a"; // Midnight black hazard stripe
  for (let x = -64; x < 1100; x += stripeW * 2) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + stripeW, 0);
    ctx.lineTo(x + stripeW + 48, 48);
    ctx.lineTo(x + 48, 48);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // White Border Seam below Hazard Stripe
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 48);
  ctx.lineTo(1024, 48);
  ctx.stroke();

  // Seaward Crane Rail Track (Embedded Steel Girder)
  const rail1Y = 72;
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, rail1Y - 4, 1024, 16);
  ctx.fillStyle = "#cbd5e1"; // Shiny steel rail head
  ctx.fillRect(0, rail1Y, 1024, 8);
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.fillRect(0, rail1Y + 1, 1024, 2); // Specular rail shine

  // Landside Crane Rail Track
  const rail2Y = 210;
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, rail2Y - 4, 1024, 16);
  ctx.fillStyle = "#cbd5e1";
  ctx.fillRect(0, rail2Y, 1024, 8);
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.fillRect(0, rail2Y + 1, 1024, 2);

  // Rail tie clip fasteners every 32px
  ctx.fillStyle = "#475569";
  for (let rx = 16; rx < 1024; rx += 32) {
    ctx.fillRect(rx - 3, rail1Y - 6, 6, 3);
    ctx.fillRect(rx - 3, rail1Y + 11, 6, 3);
    ctx.fillRect(rx - 3, rail2Y - 6, 6, 3);
    ctx.fillRect(rx - 3, rail2Y + 11, 6, 3);
  }

  // Yellow STS Crane Gantry Safety Clearance Standoff Line
  ctx.strokeStyle = "#eab308";
  ctx.lineWidth = 3;
  ctx.setLineDash([20, 16]);
  ctx.beginPath();
  ctx.moveTo(0, 140);
  ctx.lineTo(1024, 140);
  ctx.stroke();
  ctx.setLineDash([]);

  // Mooring Bollard Safety Painted Rings
  ctx.strokeStyle = "#eab308";
  ctx.lineWidth = 3;
  ctx.fillStyle = "#1e293b";
  for (let bx = 64; bx < 1024; bx += 128) {
    ctx.beginPath();
    ctx.arc(bx, 58, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Concrete Dock Expansion Joint Lines every 128px
  ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let jx = 0; jx <= 1024; jx += 128) {
    ctx.moveTo(jx, 48);
    ctx.lineTo(jx, 256);
  }
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(10, 1);
  texture.anisotropy = 8;
  texture.needsUpdate = true;

  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * 3. WATER SURFACE RIPPLE NORMAL MAP
 * Generates dynamic, multi-harmonic normal map vectors for realistic physical water specular ripples.
 */
export function getWaterNormalTexture(): THREE.CanvasTexture | null {
  const cacheKey = "water_normal_pbr_v2";
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const res = createOffscreenCanvas(512, 512);
  if (!res) return null;
  const { canvas, ctx } = res;

  const imgData = ctx.createImageData(512, 512);
  const data = imgData.data;

  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 512; x++) {
      const idx = (y * 512 + x) * 4;

      // Harmonic sinusoidal wave synthesis
      const u = (x / 512) * Math.PI * 2 * 6;
      const v = (y / 512) * Math.PI * 2 * 6;

      const wave1 = Math.sin(u + v * 0.5);
      const wave2 = Math.cos(u * 1.8 - v * 1.4);
      const wave3 = Math.sin(u * 3.2 + v * 2.5) * 0.4;
      const wave4 = Math.cos(u * 0.8 - v * 2.8) * 0.5;

      const height = (wave1 + wave2 + wave3 + wave4) * 0.25;

      // Surface normal derivative
      const dx = (Math.cos(u) * 6 + Math.sin(u * 1.8) * -2.5) * 0.08;
      const dy = (Math.cos(v * 0.5) * 3 + Math.sin(v * 1.4) * 1.4) * 0.08;

      const normX = Math.max(-1, Math.min(1, -dx));
      const normY = Math.max(-1, Math.min(1, -dy));
      const normZ = Math.sqrt(Math.max(0, 1 - normX * normX - normY * normY));

      data[idx] = Math.round((normX * 0.5 + 0.5) * 255);     // Red: Normal X
      data[idx + 1] = Math.round((normY * 0.5 + 0.5) * 255); // Green: Normal Y
      data[idx + 2] = Math.round(normZ * 255);               // Blue: Normal Z (Up)
      data[idx + 3] = 255;                                   // Alpha
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(12, 8);
  texture.needsUpdate = true;

  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * 4. WATER HYDROGRAPHIC COLOR & DEPTH TEXTURE
 * Deep maritime oceanic blue gradient with gentle river navigation channel bathymetry.
 */
export function getWaterColorTexture(): THREE.CanvasTexture | null {
  const cacheKey = "water_color_depth_v2";
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const res = createOffscreenCanvas(512, 256);
  if (!res) return null;
  const { canvas, ctx } = res;

  // Deep River Navigation Channel Bathymetric Gradient
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, "#081d30"); // Deep offshore Karnaphuli fairway (-14m CD)
  grad.addColorStop(0.5, "#0b2a44"); // Mid-channel transit reach (-11m CD)
  grad.addColorStop(0.85, "#0d3b55"); // Turning basin & frontage (-9m CD)
  grad.addColorStop(1, "#0a263d"); // Quayside frontage

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 256);

  // Subtle wave foam crests & glints
  ctx.fillStyle = "rgba(147, 197, 253, 0.08)";
  for (let i = 0; i < 300; i++) {
    const wx = Math.random() * 512;
    const wy = Math.random() * 256;
    const wlen = Math.random() * 25 + 8;
    ctx.fillRect(wx, wy, wlen, 1.5);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 4);
  texture.needsUpdate = true;

  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * 5. YARD BLOCK CONCRETE GROUND SLAB WITH STENCILED MARKINGS
 * Generates slot corner twistlock brackets, bay numbers, and prominent stenciled block labels (e.g. "C01 IMPORT").
 */
export function getYardBlockGroundTexture(code: string, category: string): THREE.CanvasTexture | null {
  const cacheKey = `yard_pad_${code}_${category}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const res = createOffscreenCanvas(512, 384);
  if (!res) return null;
  const { canvas, ctx } = res;

  // Reinforced Heavy Industrial Concrete Pad
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(0, 0, 512, 384);

  // Fine concrete noise
  ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
  for (let i = 0; i < 1500; i++) {
    ctx.fillRect(Math.random() * 512, Math.random() * 384, 2, 2);
  }

  // Exterior Block Safety Line (Yellow / Red / Green depending on category)
  const isHazard = category.includes("HAZARD");
  const isReefer = category.includes("REEFER");
  const isExport = category.includes("EXPORT");
  const borderColor = isHazard ? "#ef4444" : isReefer ? "#0284c7" : isExport ? "#10b981" : "#eab308";

  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 4;
  ctx.strokeRect(8, 8, 496, 368);

  // Container Bay Slots (4 Columns x 2 Rows)
  const slotW = 110;
  const slotH = 150;
  const startX = 28;
  const startY = 32;

  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 1.5;

  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 2; row++) {
      const sx = startX + col * (slotW + 8);
      const sy = startY + row * (slotH + 12);

      // Slot border
      ctx.strokeRect(sx, sy, slotW, slotH);

      // Yellow Corner Twistlock Locators (┏ ┓ ┗ ┛)
      ctx.strokeStyle = "#eab308";
      ctx.lineWidth = 2.5;
      const bracket = 12;

      // Top-Left
      ctx.beginPath();
      ctx.moveTo(sx, sy + bracket);
      ctx.lineTo(sx, sy);
      ctx.lineTo(sx + bracket, sy);
      ctx.stroke();

      // Top-Right
      ctx.beginPath();
      ctx.moveTo(sx + slotW - bracket, sy);
      ctx.lineTo(sx + slotW, sy);
      ctx.lineTo(sx + slotW, sy + bracket);
      ctx.stroke();

      // Bottom-Left
      ctx.beginPath();
      ctx.moveTo(sx, sy + slotH - bracket);
      ctx.lineTo(sx, sy + slotH);
      ctx.lineTo(sx + bracket, sy + slotH);
      ctx.stroke();

      // Bottom-Right
      ctx.beginPath();
      ctx.moveTo(sx + slotW - bracket, sy + slotH);
      ctx.lineTo(sx + slotW, sy + slotH);
      ctx.lineTo(sx + slotW, sy + slotH - bracket);
      ctx.stroke();

      // Slot ID
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.font = "bold 10px monospace";
      ctx.fillText(`BAY ${col + 1}-${row + 1}`, sx + 28, sy + slotH / 2);
    }
  }

  // Large Stenciled Identification Label at Pad Apron
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 20px monospace";
  ctx.textAlign = "center";
  ctx.fillText(`BLOCK ${code} · ${category.toUpperCase()}`, 256, 362);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  texture.needsUpdate = true;

  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * 6. INDUSTRIAL CORRUGATED METAL ROOF & WALL TEXTURE
 * For maintenance workshops, customs facilities, gate canopies, and substations.
 */
export function getCorrugatedMetalTexture(baseColor: string = "#475569"): THREE.CanvasTexture | null {
  const cacheKey = `corrugated_${baseColor}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const res = createOffscreenCanvas(256, 256);
  if (!res) return null;
  const { canvas, ctx } = res;

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 256, 256);

  // Vertical Corrugated Seams
  const seamW = 16;
  for (let x = 0; x < 256; x += seamW) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.fillRect(x, 0, seamW * 0.45, 256);
    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    ctx.fillRect(x + seamW * 0.45, 0, seamW * 0.55, 256);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  texture.needsUpdate = true;

  textureCache.set(cacheKey, texture);
  return texture;
}

