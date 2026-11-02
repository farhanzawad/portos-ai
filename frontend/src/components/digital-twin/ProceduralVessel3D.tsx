"use client";

import React, { useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { VesselCallRead } from "@/types/api";

interface ProceduralVessel3DProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  call: VesselCallRead;
  isSelected?: boolean;
  onSelect?: () => void;
  isSimulating?: boolean;
  isBerthed?: boolean;
}

export function ProceduralVessel3D({
  position,
  rotation = [0, 0, 0],
  scale = 1,
  call,
  isSelected = false,
  onSelect,
  isSimulating = false,
  isBerthed = true,
}: ProceduralVessel3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const radarRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Buoyancy wave sway and radar rotation
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current && isSimulating) {
      // Natural maritime wave heave and roll
      const swayFactor = isBerthed ? 0.35 : 1.0;
      groupRef.current.position.y = position[1] + Math.sin(t * 1.4) * 0.04 * swayFactor;
      groupRef.current.rotation.z = Math.sin(t * 1.1) * 0.008 * swayFactor;
      groupRef.current.rotation.x = Math.cos(t * 0.9) * 0.004 * swayFactor;
    }

    // Continuous rotation of the navigation radar scanner on the mast
    if (radarRef.current) {
      radarRef.current.rotation.y = t * 3.5;
    }
  });

  // Authentic marine coating colors
  const hullUpperColor = isSelected ? "#0e7490" : hovered ? "#1e3a5f" : "#111827"; // Dark industrial hull steel
  const antiFoulingKeelColor = "#881337"; // Deep oxide red anti-fouling
  const bootToppingWhite = "#f8fafc"; // Waterline demarcation stripe
  const deckPlateColor = "#334155"; // Non-skid green/grey deck
  const superstructureColor = "#f1f5f9"; // Clean maritime white superstructure
  const windowGlassColor = "#0f172a"; // Tinted panoramic bridge glass
  const funnelColor = "#1e4967"; // Portos maritime blue funnel

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      scale={scale}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* ============================================================ */}
      {/* 1. SELECTION & TELEMETRY BEACON                              */}
      {/* ============================================================ */}
      {isSelected && (
        <group position={[0, 0.02, 0]}>
          {/* Outer Rotating Tactical Ring */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[5.2, 5.6, 36]} />
            <meshBasicMaterial color="#16a394" side={THREE.DoubleSide} transparent opacity={0.8} />
          </mesh>
          {/* Inner Pulsing Radar Disk */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.5, 4.8, 36]} />
            <meshBasicMaterial color="#16a394" side={THREE.DoubleSide} transparent opacity={0.12} />
          </mesh>
        </group>
      )}

      {/* ============================================================ */}
      {/* 2. SHIP HULL ARCHITECTURE                                    */}
      {/* ============================================================ */}

      {/* Underwater Bulbous Bow (Hydrodynamic efficiency sphere) */}
      <mesh position={[5.4, 0.35, 0]}>
        <sphereGeometry args={[0.5, 16, 12]} />
        <meshStandardMaterial color={antiFoulingKeelColor} roughness={0.4} />
      </mesh>

      {/* Lower Hull (Red Anti-fouling Keel) */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[10.2, 0.75, 2.5]} />
        <meshStandardMaterial color={antiFoulingKeelColor} roughness={0.5} />
      </mesh>

      {/* Waterline Boot-Topping White Stripe */}
      <mesh position={[0, 0.78, 0]}>
        <boxGeometry args={[10.25, 0.06, 2.54]} />
        <meshStandardMaterial color={bootToppingWhite} roughness={0.3} />
      </mesh>

      {/* Main Hull Body (Dark Marine Grade Steel) */}
      <mesh position={[0, 1.25, 0]}>
        <boxGeometry args={[10.3, 0.88, 2.55]} />
        <meshStandardMaterial color={hullUpperColor} roughness={0.4} metalness={0.2} />
      </mesh>

      {/* Flared Bow Wedge (Forward Stem Section) */}
      <mesh position={[5.35, 1.35, 0]} rotation={[0, 0, -Math.PI / 18]}>
        <boxGeometry args={[1.5, 0.95, 2.3]} />
        <meshStandardMaterial color={hullUpperColor} roughness={0.4} metalness={0.2} />
      </mesh>

      {/* Raised Forecastle Deck Plate & Wave Breakwater */}
      <mesh position={[5.6, 1.88, 0]}>
        <boxGeometry args={[1.1, 0.22, 2.1]} />
        <meshStandardMaterial color={deckPlateColor} roughness={0.7} />
      </mesh>
      {/* V-Shape Breakwater Cowl */}
      <mesh position={[4.9, 2.05, 0]} rotation={[0, 0, -Math.PI / 10]}>
        <boxGeometry args={[0.15, 0.3, 1.9]} />
        <meshStandardMaterial color={superstructureColor} roughness={0.4} />
      </mesh>

      {/* Mooring Hawseholes (Port & Starboard Anchor Pockets) */}
      <mesh position={[5.5, 1.45, 1.15]} rotation={[0, Math.PI / 2, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.2, 8]} />
        <meshStandardMaterial color="#0b1320" metalness={0.8} />
      </mesh>
      <mesh position={[5.5, 1.45, -1.15]} rotation={[0, Math.PI / 2, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.2, 8]} />
        <meshStandardMaterial color="#0b1320" metalness={0.8} />
      </mesh>

      {/* Transom Stern Keel / Skeg */}
      <mesh position={[-5.1, 0.9, 0]}>
        <boxGeometry args={[0.6, 0.9, 2.2]} />
        <meshStandardMaterial color={hullUpperColor} roughness={0.5} />
      </mesh>

      {/* ============================================================ */}
      {/* 3. AFT ACCOMMODATION SUPERSTRUCTURE & NAVIGATION BRIDGE     */}
      {/* ============================================================ */}

      {/* Lower Superstructure Housing (Crew Quarters & Galley) */}
      <mesh position={[-3.6, 2.25, 0]}>
        <boxGeometry args={[2.0, 1.2, 2.2]} />
        <meshStandardMaterial color={superstructureColor} roughness={0.3} />
      </mesh>

      {/* Upper Deckhouse Tier */}
      <mesh position={[-3.6, 3.0, 0]}>
        <boxGeometry args={[1.8, 0.8, 2.2]} />
        <meshStandardMaterial color={superstructureColor} roughness={0.3} />
      </mesh>

      {/* Panoramic Navigation Bridge with Flying Wings */}
      <mesh position={[-3.5, 3.55, 0]}>
        <boxGeometry args={[1.6, 0.55, 2.65]} />
        <meshStandardMaterial color={superstructureColor} roughness={0.3} />
      </mesh>
      {/* Tinted Panoramic Front Bridge Windows */}
      <mesh position={[-2.68, 3.55, 0]}>
        <boxGeometry args={[0.08, 0.32, 2.4]} />
        <meshStandardMaterial color={windowGlassColor} roughness={0.1} metalness={0.85} />
      </mesh>
      {/* Side Wing Windows (Port / Starboard) */}
      <mesh position={[-3.5, 3.55, 1.33]}>
        <boxGeometry args={[1.2, 0.32, 0.05]} />
        <meshStandardMaterial color={windowGlassColor} roughness={0.1} metalness={0.85} />
      </mesh>
      <mesh position={[-3.5, 3.55, -1.33]}>
        <boxGeometry args={[1.2, 0.32, 0.05]} />
        <meshStandardMaterial color={windowGlassColor} roughness={0.1} metalness={0.85} />
      </mesh>

      {/* Modern Aero Funnel Exhaust Stack */}
      <group position={[-4.5, 2.9, 0]}>
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[0.8, 1.5, 0.9]} />
          <meshStandardMaterial color={funnelColor} roughness={0.4} />
        </mesh>
        {/* Funnel CPA Stripe / Livery Badge */}
        <mesh position={[0, 0.8, 0]}>
          <boxGeometry args={[0.82, 0.25, 0.92]} />
          <meshStandardMaterial color="#16a394" roughness={0.3} />
        </mesh>
        {/* Dual Exhaust Uptake Pipes */}
        <mesh position={[-0.15, 1.35, 0.2]}>
          <cylinderGeometry args={[0.08, 0.09, 0.4, 8]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} />
        </mesh>
        <mesh position={[-0.15, 1.35, -0.2]}>
          <cylinderGeometry args={[0.08, 0.09, 0.4, 8]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} />
        </mesh>
      </group>

      {/* Main Radar & Avionics Mast */}
      <group position={[-3.5, 4.1, 0]}>
        <mesh>
          <cylinderGeometry args={[0.04, 0.07, 1.1, 8]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.7} />
        </mesh>
        {/* Cross Arm with Nav Light Beacons */}
        <mesh position={[0, 0.35, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.02, 0.02, 1.2, 6]} />
          <meshStandardMaterial color="#64748b" metalness={0.6} />
        </mesh>
        {/* Rotating Marine Radar Scanner */}
        <mesh ref={radarRef} position={[0, 0.55, 0]}>
          <boxGeometry args={[0.7, 0.06, 0.12]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.4} />
        </mesh>
        {/* White Satellite Comm Radome Dome */}
        <mesh position={[0.4, 0.15, 0.4]}>
          <sphereGeometry args={[0.18, 12, 10]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} />
        </mesh>
      </group>

      {/* Symmetrical Enclosed Lifeboats on Gravity Davits */}
      <mesh position={[-3.6, 2.7, 1.25]} rotation={[0, 0, 0]}>
        <capsuleGeometry args={[0.18, 0.7, 4, 8]} />
        <meshStandardMaterial color="#ea580c" roughness={0.4} />
      </mesh>
      <mesh position={[-3.6, 2.7, -1.25]} rotation={[0, 0, 0]}>
        <capsuleGeometry args={[0.18, 0.7, 4, 8]} />
        <meshStandardMaterial color="#ea580c" roughness={0.4} />
      </mesh>

      {/* ============================================================ */}
      {/* 4. MODULAR CONTAINER CARGO STACKS (TEU Bays)                 */}
      {/* ============================================================ */}

      {/* Bay 1: Aft Midships (20ft & 40ft mix) */}
      <group position={[-1.75, 1.68, 0]}>
        {/* Tier 1 Containers */}
        <mesh position={[0, 0.35, 0.5]}>
          <boxGeometry args={[1.7, 0.7, 0.95]} />
          <meshStandardMaterial color="#1e3a8a" roughness={0.6} metalness={0.15} />
        </mesh>
        <mesh position={[0, 0.35, -0.5]}>
          <boxGeometry args={[1.7, 0.7, 0.95]} />
          <meshStandardMaterial color="#047857" roughness={0.6} metalness={0.15} />
        </mesh>
        {/* Tier 2 Containers */}
        <mesh position={[0, 1.05, 0.5]}>
          <boxGeometry args={[1.7, 0.7, 0.95]} />
          <meshStandardMaterial color="#c2410c" roughness={0.6} metalness={0.15} />
        </mesh>
        <mesh position={[0, 1.05, -0.5]}>
          <boxGeometry args={[1.7, 0.7, 0.95]} />
          <meshStandardMaterial color="#475569" roughness={0.6} metalness={0.15} />
        </mesh>
        {/* Tier 3 Partial Top Container */}
        <mesh position={[0, 1.75, 0]}>
          <boxGeometry args={[1.7, 0.7, 1.8]} />
          <meshStandardMaterial color="#1d4ed8" roughness={0.6} metalness={0.15} />
        </mesh>
      </group>

      {/* Bay 2: Center Midships (Highest Stack with Reefer Units) */}
      <group position={[0.2, 1.68, 0]}>
        {/* Tier 1 */}
        <mesh position={[0, 0.35, 0.5]}>
          <boxGeometry args={[1.7, 0.7, 0.95]} />
          <meshStandardMaterial color="#047857" roughness={0.6} metalness={0.15} />
        </mesh>
        <mesh position={[0, 0.35, -0.5]}>
          <boxGeometry args={[1.7, 0.7, 0.95]} />
          <meshStandardMaterial color="#b45309" roughness={0.6} metalness={0.15} />
        </mesh>
        {/* Tier 2 */}
        <mesh position={[0, 1.05, 0.5]}>
          <boxGeometry args={[1.7, 0.7, 0.95]} />
          <meshStandardMaterial color="#1e3a8a" roughness={0.6} metalness={0.15} />
        </mesh>
        <mesh position={[0, 1.05, -0.5]}>
          <boxGeometry args={[1.7, 0.7, 0.95]} />
          <meshStandardMaterial color="#be185d" roughness={0.6} metalness={0.15} />
        </mesh>
        {/* Tier 3 (White Reefer Container) */}
        <mesh position={[0, 1.75, 0.5]}>
          <boxGeometry args={[1.7, 0.7, 0.95]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.4} metalness={0.1} />
        </mesh>
        <mesh position={[0, 1.75, -0.5]}>
          <boxGeometry args={[1.7, 0.7, 0.95]} />
          <meshStandardMaterial color="#0369a1" roughness={0.6} metalness={0.15} />
        </mesh>
      </group>

      {/* Bay 3: Forward Midships */}
      <group position={[2.15, 1.68, 0]}>
        {/* Tier 1 */}
        <mesh position={[0, 0.35, 0.5]}>
          <boxGeometry args={[1.7, 0.7, 0.95]} />
          <meshStandardMaterial color="#b91c1c" roughness={0.6} metalness={0.15} />
        </mesh>
        <mesh position={[0, 0.35, -0.5]}>
          <boxGeometry args={[1.7, 0.7, 0.95]} />
          <meshStandardMaterial color="#1e3a8a" roughness={0.6} metalness={0.15} />
        </mesh>
        {/* Tier 2 */}
        <mesh position={[0, 1.05, 0]}>
          <boxGeometry args={[1.7, 0.7, 1.9]} />
          <meshStandardMaterial color="#047857" roughness={0.6} metalness={0.15} />
        </mesh>
      </group>

      {/* Bay 4: Forward Bow Deck Stack (Low 1-Tier Stacking) */}
      <group position={[3.95, 1.68, 0]}>
        <mesh position={[0, 0.35, 0]}>
          <boxGeometry args={[1.5, 0.7, 1.75]} />
          <meshStandardMaterial color="#ea580c" roughness={0.6} metalness={0.15} />
        </mesh>
      </group>

      {/* Lashing Bridges & Cell Guide Vertical Ribs */}
      {[-0.8, 1.15, 3.05].map((x, i) => (
        <group key={i} position={[x, 2.2, 0]}>
          <mesh position={[0, 0, 1.05]}>
            <cylinderGeometry args={[0.02, 0.02, 1.6, 6]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.8} />
          </mesh>
          <mesh position={[0, 0, -1.05]}>
            <cylinderGeometry args={[0.02, 0.02, 1.6, 6]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.8} />
          </mesh>
        </group>
      ))}

      {/* ============================================================ */}
      {/* 5. TIGHT MOORING LINES (Active when berthed)                 */}
      {/* ============================================================ */}
      {isBerthed && (
        <group position={[0, 0, 0]}>
          {/* Forward Head Line tethered to quay */}
          <mesh position={[5.2, 1.2, 1.6]} rotation={[0.4, 0.6, 0]}>
            <cylinderGeometry args={[0.018, 0.018, 1.8, 4]} />
            <meshStandardMaterial color="#1e293b" roughness={0.9} />
          </mesh>
          {/* Aft Stern Line tethered to quay */}
          <mesh position={[-4.8, 1.2, 1.6]} rotation={[-0.4, 0.6, 0]}>
            <cylinderGeometry args={[0.018, 0.018, 1.8, 4]} />
            <meshStandardMaterial color="#1e293b" roughness={0.9} />
          </mesh>
        </group>
      )}
    </group>
  );
}
