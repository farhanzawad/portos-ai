"use client";

import React, { useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { VesselCallRead } from "@/types/api";
import { RealisticContainer3D, ContainerCarrier } from "./RealisticContainer3D";

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

  // Authentic Marine Coating Palette (Matching Reference Images 1 & 2)
  const isMaersk = call.vessel?.name?.toLowerCase().includes("maersk");
  const hullUpperColor = isSelected
    ? "#0284c7"
    : hovered
    ? "#1e3a5f"
    : isMaersk
    ? "#38bdf8" // Maersk Line Sky Blue
    : "#0f172a"; // Deep Marine Navy/Black (CPL / Evergreen style)

  const antiFoulingKeelColor = "#b91c1c"; // Red oxide anti-fouling keel (Image 1)
  const bootToppingWhite = "#f8fafc"; // Waterline demarcation stripe
  const deckPlateColor = "#7f1d1d"; // Red oxide / non-skid forecastle deck plate (Image 1)
  const superstructureColor = "#f1f5f9"; // Clean maritime white superstructure
  const windowGlassColor = "#0f172a"; // Tinted panoramic bridge glass
  const funnelColor = "#1e4967"; // Funnel base color

  // Container bay carriers for diverse realistic stowage
  const bay1Carriers: ContainerCarrier[] = ["MAERSK", "EVERGREEN", "HAPAG", "MSC"];
  const bay2Carriers: ContainerCarrier[] = ["CMACGM", "ONE", "REEFER", "MAERSK"];
  const bay3Carriers: ContainerCarrier[] = ["COSCO", "EVERGREEN", "MSC", "HAPAG"];

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
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[5.2, 5.6, 36]} />
            <meshBasicMaterial color="#16a394" side={THREE.DoubleSide} transparent opacity={0.8} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.5, 4.8, 36]} />
            <meshBasicMaterial color="#16a394" side={THREE.DoubleSide} transparent opacity={0.12} />
          </mesh>
        </group>
      )}

      {/* ============================================================ */}
      {/* 2. REALISTIC SHIP HULL ARCHITECTURE                          */}
      {/* ============================================================ */}
      {/* Underwater Bulbous Bow (Hydrodynamic efficiency sphere - Image 1) */}
      <mesh position={[5.45, 0.35, 0]}>
        <sphereGeometry args={[0.55, 18, 14]} />
        <meshStandardMaterial color={antiFoulingKeelColor} roughness={0.4} />
      </mesh>

      {/* Lower Hull (Red Oxide Anti-Fouling Keel) */}
      <mesh position={[0, 0.42, 0]}>
        <boxGeometry args={[10.3, 0.76, 2.5]} />
        <meshStandardMaterial color={antiFoulingKeelColor} roughness={0.5} />
      </mesh>

      {/* Waterline Boot-Topping White Stripe */}
      <mesh position={[0, 0.81, 0]}>
        <boxGeometry args={[10.32, 0.06, 2.54]} />
        <meshStandardMaterial color={bootToppingWhite} roughness={0.3} />
      </mesh>

      {/* Main Upper Hull Body (Dark Marine Grade Steel) */}
      <mesh position={[0, 1.28, 0]}>
        <boxGeometry args={[10.35, 0.9, 2.56]} />
        <meshStandardMaterial color={hullUpperColor} roughness={0.4} metalness={0.2} />
      </mesh>

      {/* Flared Bow Wedge (Forward Stem Section carving through water) */}
      <mesh position={[5.38, 1.38, 0]} rotation={[0, 0, -Math.PI / 18]}>
        <boxGeometry args={[1.5, 0.95, 2.32]} />
        <meshStandardMaterial color={hullUpperColor} roughness={0.4} metalness={0.2} />
      </mesh>

      {/* Shipping Line Flank Stencil Branding Stripe (Image 1 & 2) */}
      <mesh position={[0, 1.35, 1.29]}>
        <planeGeometry args={[5.8, 0.32]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.88} />
      </mesh>
      <mesh position={[0, 1.35, -1.29]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[5.8, 0.32]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.88} />
      </mesh>

      {/* Raised Forecastle Deck Plate (Red non-skid paint - Image 1) */}
      <mesh position={[5.6, 1.9, 0]}>
        <boxGeometry args={[1.1, 0.22, 2.15]} />
        <meshStandardMaterial color={deckPlateColor} roughness={0.8} />
      </mesh>

      {/* V-Shape Wave Breakwater Coaming on Forecastle Deck */}
      <mesh position={[4.95, 2.1, 0]} rotation={[0, 0, -Math.PI / 10]}>
        <boxGeometry args={[0.15, 0.32, 1.95]} />
        <meshStandardMaterial color={superstructureColor} roughness={0.4} />
      </mesh>

      {/* Mooring Windlasses & Winch Drums on Forecastle Deck */}
      {[-0.45, 0.45].map((wz, wi) => (
        <group key={`windlass-${wi}`} position={[5.5, 2.1, wz]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.22, 10]} />
            <meshStandardMaterial color="#0f172a" metalness={0.8} />
          </mesh>
        </group>
      ))}

      {/* Forward Jackstaff / Bow Navigation Light Mast */}
      <mesh position={[6.0, 2.45, 0]}>
        <cylinderGeometry args={[0.02, 0.03, 0.9, 6]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      {/* Mooring Hawseholes & Recessed Anchor Pockets */}
      <mesh position={[5.5, 1.48, 1.18]} rotation={[0, Math.PI / 2, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.2, 8]} />
        <meshStandardMaterial color="#0b1320" metalness={0.9} />
      </mesh>
      <mesh position={[5.5, 1.48, -1.18]} rotation={[0, Math.PI / 2, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.2, 8]} />
        <meshStandardMaterial color="#0b1320" metalness={0.9} />
      </mesh>

      {/* Transom Stern Skeg & Rudder Post */}
      <mesh position={[-5.1, 0.9, 0]}>
        <boxGeometry args={[0.65, 0.92, 2.2]} />
        <meshStandardMaterial color={hullUpperColor} roughness={0.5} />
      </mesh>

      {/* ============================================================ */}
      {/* 3. AFT ACCOMMODATION SUPERSTRUCTURE & NAVIGATION BRIDGE     */}
      {/* ============================================================ */}
      {/* Lower Superstructure Housing (Crew Quarters Tier 1) */}
      <mesh position={[-3.6, 2.25, 0]}>
        <boxGeometry args={[2.0, 1.2, 2.25]} />
        <meshStandardMaterial color={superstructureColor} roughness={0.3} />
      </mesh>

      {/* Middle Superstructure Deckhouse Tier 2 */}
      <mesh position={[-3.6, 3.0, 0]}>
        <boxGeometry args={[1.8, 0.8, 2.25]} />
        <meshStandardMaterial color={superstructureColor} roughness={0.3} />
      </mesh>

      {/* Red "NO SMOKING" Warning Placard (Image 1) */}
      <mesh position={[-2.68, 2.9, 0]}>
        <planeGeometry args={[1.2, 0.22]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>

      {/* Panoramic Navigation Bridge with Flying Wings */}
      <mesh position={[-3.5, 3.58, 0]}>
        <boxGeometry args={[1.6, 0.58, 2.7]} />
        <meshStandardMaterial color={superstructureColor} roughness={0.3} />
      </mesh>

      {/* Tinted Panoramic Front Bridge Windows */}
      <mesh position={[-2.68, 3.58, 0]}>
        <boxGeometry args={[0.08, 0.34, 2.45]} />
        <meshStandardMaterial color={windowGlassColor} roughness={0.1} metalness={0.85} />
      </mesh>
      {/* Wing Port & Starboard Windows */}
      <mesh position={[-3.5, 3.58, 1.36]}>
        <boxGeometry args={[1.2, 0.34, 0.05]} />
        <meshStandardMaterial color={windowGlassColor} roughness={0.1} metalness={0.85} />
      </mesh>
      <mesh position={[-3.5, 3.58, -1.36]}>
        <boxGeometry args={[1.2, 0.34, 0.05]} />
        <meshStandardMaterial color={windowGlassColor} roughness={0.1} metalness={0.85} />
      </mesh>

      {/* Modern Aero Funnel Exhaust Stack */}
      <group position={[-4.5, 2.9, 0]}>
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[0.85, 1.5, 0.92]} />
          <meshStandardMaterial color={funnelColor} roughness={0.4} />
        </mesh>
        {/* Funnel CPA Stripe / Livery Band */}
        <mesh position={[0, 0.8, 0]}>
          <boxGeometry args={[0.88, 0.25, 0.95]} />
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
      <group position={[-3.5, 4.15, 0]}>
        <mesh>
          <cylinderGeometry args={[0.04, 0.07, 1.15, 8]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.7} />
        </mesh>
        {/* Cross Arm with Nav Light Beacons */}
        <mesh position={[0, 0.38, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.02, 0.02, 1.25, 6]} />
          <meshStandardMaterial color="#64748b" metalness={0.6} />
        </mesh>
        {/* Rotating Marine Radar Scanner */}
        <mesh ref={radarRef} position={[0, 0.6, 0]}>
          <boxGeometry args={[0.75, 0.06, 0.12]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.4} />
        </mesh>
        {/* Dual Satellite Communication Dome Radomes */}
        <mesh position={[0.4, 0.18, 0.4]}>
          <sphereGeometry args={[0.18, 12, 10]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} />
        </mesh>
        <mesh position={[0.4, 0.18, -0.4]}>
          <sphereGeometry args={[0.18, 12, 10]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} />
        </mesh>
      </group>

      {/* Symmetrical Enclosed Lifeboats on Gravity Davits */}
      <mesh position={[-3.6, 2.7, 1.28]} rotation={[0, 0, 0]}>
        <capsuleGeometry args={[0.18, 0.72, 4, 8]} />
        <meshStandardMaterial color="#ea580c" roughness={0.4} />
      </mesh>
      <mesh position={[-3.6, 2.7, -1.28]} rotation={[0, 0, 0]}>
        <capsuleGeometry args={[0.18, 0.72, 4, 8]} />
        <meshStandardMaterial color="#ea580c" roughness={0.4} />
      </mesh>

      {/* ============================================================ */}
      {/* 4. REALISTIC CONTAINER CARGO HATCH STACKS (Image 1 & 2)      */}
      {/* ============================================================ */}
      {/* Bay 1: Aft Midships Stack (Tier 1 & 2 Containers) */}
      <group position={[-1.75, 1.74, 0]}>
        {/* Port & Starboard Tier 1 */}
        <RealisticContainer3D position={[0, 0, -0.55]} scale={0.52} carrier="MAERSK" />
        <RealisticContainer3D position={[0, 0, 0.55]} scale={0.52} carrier="EVERGREEN" />
        {/* Port & Starboard Tier 2 */}
        <RealisticContainer3D position={[0, 0.52, -0.55]} scale={0.52} carrier="HAPAG" />
        <RealisticContainer3D position={[0, 0.52, 0.55]} scale={0.52} carrier="MSC" />
        {/* Tier 3 Center */}
        <RealisticContainer3D position={[0, 1.04, 0]} scale={0.52} carrier="CMACGM" />
      </group>

      {/* Bay 2: Center Midships Stack (Highest 3-Tier Cargo Stack with Reefer) */}
      <group position={[0.2, 1.74, 0]}>
        {/* Tier 1 */}
        <RealisticContainer3D position={[0, 0, -0.55]} scale={0.52} carrier="ONE" />
        <RealisticContainer3D position={[0, 0, 0.55]} scale={0.52} carrier="MAERSK" />
        {/* Tier 2 */}
        <RealisticContainer3D position={[0, 0.52, -0.55]} scale={0.52} carrier="COSCO" />
        <RealisticContainer3D position={[0, 0.52, 0.55]} scale={0.52} carrier="EVERGREEN" />
        {/* Tier 3 (Reefer Unit) */}
        <RealisticContainer3D position={[0, 1.04, -0.55]} scale={0.52} isReefer={true} />
        <RealisticContainer3D position={[0, 1.04, 0.55]} scale={0.52} carrier="HAPAG" />
      </group>

      {/* Bay 3: Forward Midships Stack */}
      <group position={[2.15, 1.74, 0]}>
        {/* Tier 1 */}
        <RealisticContainer3D position={[0, 0, -0.55]} scale={0.52} carrier="MSC" />
        <RealisticContainer3D position={[0, 0, 0.55]} scale={0.52} carrier="CMACGM" />
        {/* Tier 2 */}
        <RealisticContainer3D position={[0, 0.52, 0]} scale={0.52} carrier="ONE" />
      </group>

      {/* Bay 4: Forward Bow Deck Stack (Low 1-Tier Stacking) */}
      <group position={[3.95, 1.74, 0]}>
        <RealisticContainer3D position={[0, 0, 0]} scale={0.52} carrier="MAERSK" />
      </group>

      {/* Cell Guide Vertical Stanchions & Lashing Bridges Between Bays */}
      {[-0.8, 1.18, 3.05].map((x, i) => (
        <group key={`lashing-${i}`} position={[x, 2.25, 0]}>
          <mesh position={[0, 0, 1.15]}>
            <cylinderGeometry args={[0.02, 0.02, 1.8, 6]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.8} />
          </mesh>
          <mesh position={[0, 0, -1.15]}>
            <cylinderGeometry args={[0.02, 0.02, 1.8, 6]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.8} />
          </mesh>
          {/* Diagonal Cross Lashing Rod */}
          <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
            <cylinderGeometry args={[0.01, 0.01, 1.4, 4]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
          </mesh>
        </group>
      ))}

      {/* ============================================================ */}
      {/* 5. TIGHT HAWSER MOORING LINES (Berthed to Quay Bollards)     */}
      {/* ============================================================ */}
      {isBerthed && (
        <group position={[0, 0, 0]}>
          {/* Forward Head Mooring Line */}
          <mesh position={[5.25, 1.25, 1.65]} rotation={[0.4, 0.6, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 1.9, 4]} />
            <meshStandardMaterial color="#0f172a" roughness={0.9} />
          </mesh>
          {/* Aft Stern Mooring Line */}
          <mesh position={[-4.85, 1.25, 1.65]} rotation={[-0.4, 0.6, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 1.9, 4]} />
            <meshStandardMaterial color="#0f172a" roughness={0.9} />
          </mesh>
        </group>
      )}
    </group>
  );
}
