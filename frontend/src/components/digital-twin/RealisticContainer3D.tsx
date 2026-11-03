"use client";

import React, { useMemo } from "react";
import * as THREE from "three";

export type ContainerCarrier =
  | "MAERSK"
  | "EVERGREEN"
  | "HAPAG"
  | "MSC"
  | "CMACGM"
  | "ONE"
  | "REEFER"
  | "HAZARDOUS"
  | "COSCO";

export interface ContainerProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  carrier?: ContainerCarrier;
  is20ft?: boolean;
  color?: string;
  isReefer?: boolean;
  isHazardous?: boolean;
}

const CARRIER_THEMES: Record<
  ContainerCarrier,
  { main: string; dark: string; roof: string; label: string; serialPrefix: string }
> = {
  MAERSK: { main: "#0284c7", dark: "#0369a1", roof: "#075985", label: "MAERSK", serialPrefix: "MSKU" },
  EVERGREEN: { main: "#047857", dark: "#065f46", roof: "#064e3b", label: "EVERGREEN", serialPrefix: "EGLV" },
  HAPAG: { main: "#ea580c", dark: "#c2410c", roof: "#9a3412", label: "HAPAG-LLOYD", serialPrefix: "HLCU" },
  MSC: { main: "#d97706", dark: "#b45309", roof: "#78350f", label: "MSC", serialPrefix: "MSCU" },
  CMACGM: { main: "#1e3a8a", dark: "#172554", roof: "#1e1b4b", label: "CMA CGM", serialPrefix: "CMAU" },
  ONE: { main: "#be185d", dark: "#9d174d", roof: "#831843", label: "ONE", serialPrefix: "ONEU" },
  REEFER: { main: "#f1f5f9", dark: "#cbd5e1", roof: "#94a3b8", label: "CARRIER", serialPrefix: "MRFU" },
  HAZARDOUS: { main: "#dc2626", dark: "#991b1b", roof: "#7f1d1d", label: "IMO HAZ", serialPrefix: "HAZU" },
  COSCO: { main: "#0284c7", dark: "#0c4a6e", roof: "#082f49", label: "COSCO", serialPrefix: "COSU" },
};

// Global memory cache for procedural PBR textures and materials (O(1) reuse)
const textureCache = new Map<string, THREE.CanvasTexture>();
const materialCache = new Map<string, THREE.Material[]>();

/**
 * Procedurally generates high-fidelity PBR canvas textures with:
 * - Vertical corrugated trapezoidal wave ribbing with specular highlights & drop shadows
 * - Crisp white stenciled carrier brand typography & ISO technical container specifications
 * - Dual rear cargo doors with rubber gaskets, 4 vertical stainless steel locking bars, cams & handles
 * - Front wall or Carrier Transicold / Thermo King reefer refrigeration unit
 * - Weatherized roof and corner casting plates
 */
function createSideTexture(
  carrier: ContainerCarrier,
  is20ft: boolean,
  isHazardous: boolean,
  customColor?: string
): THREE.CanvasTexture {
  const cacheKey = `side_${carrier}_${is20ft}_${isHazardous}_${customColor || ""}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    const fallback = new THREE.CanvasTexture(canvas);
    textureCache.set(cacheKey, fallback);
    return fallback;
  }

  const theme = CARRIER_THEMES[carrier] || CARRIER_THEMES.MAERSK;
  const baseColor = customColor || theme.main;
  const darkColor = theme.dark;

  // 1. Base Container Paint Fill
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 512, 256);

  // 2. Photorealistic Corrugated Ribs (Trapezoidal alternating highlights & shadows)
  const ribCount = is20ft ? 8 : 16;
  const ribWidth = 472 / ribCount;
  const startX = 20;

  for (let i = 0; i < ribCount; i++) {
    const rx = startX + i * ribWidth;
    const innerW = ribWidth * 0.55;

    // Outer shadow gradient
    const grad = ctx.createLinearGradient(rx, 0, rx + ribWidth, 0);
    grad.addColorStop(0, "rgba(0, 0, 0, 0.28)");
    grad.addColorStop(0.2, "rgba(0, 0, 0, 0.08)");
    grad.addColorStop(0.5, "rgba(255, 255, 255, 0.18)");
    grad.addColorStop(0.8, "rgba(0, 0, 0, 0.08)");
    grad.addColorStop(1, "rgba(0, 0, 0, 0.28)");

    ctx.fillStyle = grad;
    ctx.fillRect(rx, 14, ribWidth, 228);

    // Flat face of corrugated rib
    ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
    ctx.fillRect(rx + (ribWidth - innerW) / 2, 14, innerW, 228);
  }

  // 3. Top & Bottom Heavy Steel Frame Rails
  ctx.fillStyle = darkColor;
  ctx.fillRect(0, 0, 512, 14);
  ctx.fillRect(0, 242, 512, 14);

  // 4. ISO Corner Casting Welds (Left & Right Edges)
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, 20, 256);
  ctx.fillRect(492, 0, 20, 256);

  // Twistlock Aperture Holes
  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.ellipse(10, 10, 4, 3, 0, 0, Math.PI * 2);
  ctx.ellipse(10, 246, 4, 3, 0, 0, Math.PI * 2);
  ctx.ellipse(502, 10, 4, 3, 0, 0, Math.PI * 2);
  ctx.ellipse(502, 246, 4, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // 5. Stenciled Carrier Branding
  const textColor = carrier === "REEFER" ? "#0284c7" : "#ffffff";
  ctx.fillStyle = textColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 38px 'Segoe UI', Arial, sans-serif";
  ctx.letterSpacing = "4px";

  // Brand Name Drop Shadow for physical depth
  ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 2;
  ctx.fillText(theme.label, 256, 128);
  ctx.shadowColor = "transparent";

  // 6. Monospace ISO Technical Container Specifications & Serial Numbers
  ctx.textAlign = "right";
  ctx.font = "bold 13px 'Consolas', monospace";
  ctx.letterSpacing = "1px";
  ctx.fillText(`${theme.serialPrefix} 893410 2`, 480, 36);
  ctx.font = "9px 'Consolas', monospace";
  ctx.fillText(is20ft ? "22G1" : "45G1", 480, 50);
  ctx.fillText("MAX. GROSS  32,500 KG", 480, 64);
  ctx.fillText("TARE         3,820 KG", 480, 76);
  ctx.fillText("PAYLOAD     28,680 KG", 480, 88);

  // 7. Hazardous IMO Placard on Side if applicable
  if (isHazardous) {
    ctx.save();
    ctx.translate(120, 130);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = "#f97316";
    ctx.fillRect(-22, -22, 44, 44);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.strokeRect(-20, -20, 40, 40);
    ctx.fillStyle = "#000000";
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("FLAMMABLE", 0, 0);
    ctx.restore();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  textureCache.set(cacheKey, texture);
  return texture;
}

function createDoorTexture(
  carrier: ContainerCarrier,
  isHazardous: boolean,
  customColor?: string
): THREE.CanvasTexture {
  const cacheKey = `door_${carrier}_${isHazardous}_${customColor || ""}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    const fallback = new THREE.CanvasTexture(canvas);
    textureCache.set(cacheKey, fallback);
    return fallback;
  }

  const theme = CARRIER_THEMES[carrier] || CARRIER_THEMES.MAERSK;
  const baseColor = customColor || theme.main;
  const darkColor = theme.dark;

  // Base Door Color
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 256, 256);

  // Black Rubber Perimeter Weather Gasket
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, 256, 12);
  ctx.fillRect(0, 244, 256, 12);
  ctx.fillRect(0, 0, 14, 256);
  ctx.fillRect(242, 0, 14, 256);

  // Vertical Center Split Line between Left and Right Door Leaves
  ctx.fillStyle = "#050b14";
  ctx.fillRect(125, 12, 6, 232);

  // Left and Right Door Paneling Recesses
  ctx.fillStyle = "rgba(0, 0, 0, 0.12)";
  ctx.fillRect(20, 20, 98, 216);
  ctx.fillRect(138, 20, 98, 216);

  // 4 Vertical Stainless Steel Locking Bars (Cams & Keepers)
  const barPositions = [48, 88, 168, 208];
  barPositions.forEach((bx) => {
    // Silver Rod Highlight
    const barGrad = ctx.createLinearGradient(bx - 3, 0, bx + 3, 0);
    barGrad.addColorStop(0, "#475569");
    barGrad.addColorStop(0.5, "#cbd5e1");
    barGrad.addColorStop(1, "#334155");

    ctx.fillStyle = barGrad;
    ctx.fillRect(bx - 3, 14, 6, 228);

    // Top & Bottom Cam Latch Keepers
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(bx - 6, 12, 12, 14);
    ctx.fillRect(bx - 6, 230, 12, 14);

    // Locking Handle with Red Rubber Grip
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(bx + 3, 135, 16, 6);
  });

  // CSC Safety Approval Plate & Decals on Right Door Leaf
  ctx.fillStyle = "#cbd5e1";
  ctx.fillRect(146, 42, 34, 22);
  ctx.fillStyle = "#1e293b";
  ctx.font = "bold 6px monospace";
  ctx.fillText("CSC SAFETY", 149, 52);

  // IMO Hazard Diamond on Doors
  if (isHazardous) {
    ctx.save();
    ctx.translate(70, 75);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(-18, -18, 36, 36);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-16, -16, 32, 32);
    ctx.restore();
  }

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set(cacheKey, texture);
  return texture;
}

function createFrontTexture(carrier: ContainerCarrier, isReefer: boolean, customColor?: string): THREE.CanvasTexture {
  const cacheKey = `front_${carrier}_${isReefer}_${customColor || ""}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    const fallback = new THREE.CanvasTexture(canvas);
    textureCache.set(cacheKey, fallback);
    return fallback;
  }

  const theme = CARRIER_THEMES[carrier] || CARRIER_THEMES.MAERSK;
  const baseColor = customColor || theme.main;

  if (isReefer) {
    // Carrier Transicold White Refrigeration Compressor Unit
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, 256, 256);

    // Recessed Machinery Grille Frame
    ctx.fillStyle = "#e2e8f0";
    ctx.fillRect(16, 16, 224, 224);

    // Condenser Louver Horizontal Grille Lines
    ctx.fillStyle = "#0284c7";
    for (let y = 38; y < 150; y += 8) {
      ctx.fillRect(28, y, 200, 4);
    }

    // Digital LED Temperature Display (-18.2 °C)
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(40, 165, 80, 28);
    ctx.fillStyle = "#10b981";
    ctx.font = "bold 13px monospace";
    ctx.fillText("-18.2 °C", 48, 184);

    // 440V Shore Power Cable Socket
    ctx.fillStyle = "#ea580c";
    ctx.beginPath();
    ctx.arc(180, 180, 14, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Standard Corrugated Steel Front Wall
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, 256, 256);

    // Vertical Ribs
    for (let x = 20; x < 236; x += 24) {
      const grad = ctx.createLinearGradient(x, 0, x + 24, 0);
      grad.addColorStop(0, "rgba(0, 0, 0, 0.25)");
      grad.addColorStop(0.5, "rgba(255, 255, 255, 0.15)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0.25)");
      ctx.fillStyle = grad;
      ctx.fillRect(x, 10, 24, 236);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set(cacheKey, texture);
  return texture;
}

function createRoofTexture(carrier: ContainerCarrier): THREE.CanvasTexture {
  const cacheKey = `roof_${carrier}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    const fallback = new THREE.CanvasTexture(canvas);
    textureCache.set(cacheKey, fallback);
    return fallback;
  }

  const theme = CARRIER_THEMES[carrier] || CARRIER_THEMES.MAERSK;
  ctx.fillStyle = theme.roof;
  ctx.fillRect(0, 0, 512, 256);

  // Transverse Corrugated Roof Ribs
  for (let x = 16; x < 496; x += 32) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.fillRect(x, 0, 8, 256);
    ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
    ctx.fillRect(x + 8, 0, 16, 256);
  }

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Returns an optimized 6-material array for BoxGeometry faces:
 * [+X (Doors), -X (Front), +Y (Roof), -Y (Floor), +Z (Side), -Z (Side)]
 * Materials and textures are cached globally to ensure zero duplicate allocations.
 */
function getContainerMaterials(
  carrier: ContainerCarrier,
  is20ft: boolean,
  isReefer: boolean,
  isHazardous: boolean,
  customColor?: string
): THREE.Material[] {
  const matKey = `${carrier}_${is20ft}_${isReefer}_${isHazardous}_${customColor || ""}`;
  if (materialCache.has(matKey)) {
    return materialCache.get(matKey)!;
  }

  // SSR Guard: return clean standard materials during server-side build
  if (typeof document === "undefined") {
    const theme = CARRIER_THEMES[carrier] || CARRIER_THEMES.MAERSK;
    const fallbackMat = new THREE.MeshStandardMaterial({
      color: customColor || theme.main,
      roughness: 0.6,
      metalness: 0.2,
    });
    return [fallbackMat, fallbackMat, fallbackMat, fallbackMat, fallbackMat, fallbackMat];
  }

  const theme = CARRIER_THEMES[carrier] || CARRIER_THEMES.MAERSK;
  const sideTex = createSideTexture(carrier, is20ft, isHazardous, customColor);
  const doorTex = createDoorTexture(carrier, isHazardous, customColor);
  const frontTex = createFrontTexture(carrier, isReefer, customColor);
  const roofTex = createRoofTexture(carrier);

  // Face +X: Rear Cargo Doors
  const doorMat = new THREE.MeshStandardMaterial({
    map: doorTex,
    roughness: 0.48,
    metalness: 0.25,
  });

  // Face -X: Front Wall (or Reefer unit)
  const frontMat = new THREE.MeshStandardMaterial({
    map: frontTex,
    roughness: 0.52,
    metalness: 0.22,
  });

  // Face +Y: Corrugated Weathered Roof
  const roofMat = new THREE.MeshStandardMaterial({
    map: roofTex,
    roughness: 0.72,
    metalness: 0.15,
  });

  // Face -Y: Underside Chassis Floor
  const bottomMat = new THREE.MeshStandardMaterial({
    color: "#0f172a",
    roughness: 0.9,
    metalness: 0.3,
  });

  // Faces +Z and -Z: Corrugated Side Panels with Brand Stencils & Technical Spec Markings
  const sideMat = new THREE.MeshStandardMaterial({
    map: sideTex,
    roughness: 0.54,
    metalness: 0.24,
  });

  const materials = [doorMat, frontMat, roofMat, bottomMat, sideMat, sideMat];
  materialCache.set(matKey, materials);
  return materials;
}

export function RealisticContainer3D({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  carrier = "MAERSK",
  is20ft = false,
  color,
  isReefer = false,
  isHazardous = false,
}: ContainerProps) {
  const length = is20ft ? 1.6 : 3.2;
  const height = 0.95;
  const width = 0.92;

  const effectiveCarrier: ContainerCarrier = isReefer
    ? "REEFER"
    : isHazardous
    ? "HAZARDOUS"
    : carrier;

  const materials = useMemo(() => {
    return getContainerMaterials(effectiveCarrier, is20ft, isReefer, isHazardous, color);
  }, [effectiveCarrier, is20ft, isReefer, isHazardous, color]);

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* High-Fidelity Consolidated PBR Container Mesh */}
      <mesh position={[0, height / 2, 0]} material={materials}>
        <boxGeometry args={[length, height, width]} />
      </mesh>
    </group>
  );
}
