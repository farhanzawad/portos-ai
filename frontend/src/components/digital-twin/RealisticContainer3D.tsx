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

const CARRIER_THEMES: Record<ContainerCarrier, { main: string; roof: string; doors: string; label: string }> = {
  MAERSK: { main: "#0284c7", roof: "#0369a1", doors: "#0284c7", label: "MAERSK" },
  EVERGREEN: { main: "#047857", roof: "#065f46", doors: "#047857", label: "EVERGREEN" },
  HAPAG: { main: "#ea580c", roof: "#c2410c", doors: "#ea580c", label: "HAPAG-LLOYD" },
  MSC: { main: "#d97706", roof: "#b45309", doors: "#d97706", label: "MSC" },
  CMACGM: { main: "#1e3a8a", roof: "#172554", doors: "#1e3a8a", label: "CMA CGM" },
  ONE: { main: "#be185d", roof: "#9d174d", doors: "#be185d", label: "ONE" },
  REEFER: { main: "#f8fafc", roof: "#e2e8f0", doors: "#f8fafc", label: "CARRIER" },
  HAZARDOUS: { main: "#dc2626", roof: "#991b1b", doors: "#dc2626", label: "IMO HAZ" },
  COSCO: { main: "#0284c7", roof: "#0369a1", doors: "#0284c7", label: "COSCO" },
};

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
  // Determine dimensions: 40ft is ~3.2m long, 20ft is ~1.6m long
  const length = is20ft ? 1.6 : 3.2;
  const height = 0.95;
  const width = 0.92;

  const theme = useMemo(() => {
    if (isReefer) return CARRIER_THEMES.REEFER;
    if (isHazardous) return CARRIER_THEMES.HAZARDOUS;
    return CARRIER_THEMES[carrier] || CARRIER_THEMES.MAERSK;
  }, [carrier, isReefer, isHazardous]);

  const bodyColor = color || theme.main;
  const corrugationCount = is20ft ? 8 : 16;
  const ribSpacing = (length - 0.2) / corrugationCount;

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* 1. MAIN REINFORCED RECTANGULAR BODY */}
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[length, height, width]} />
        <meshStandardMaterial
          color={bodyColor}
          roughness={0.55}
          metalness={0.2}
        />
      </mesh>

      {/* 2. CORRUGATED SIDE PANELS (Vertical steel ribs on Port & Starboard sides) */}
      {Array.from({ length: corrugationCount }).map((_, i) => {
        const xPos = -length / 2 + 0.1 + i * ribSpacing;
        return (
          <React.Fragment key={i}>
            {/* Starboard Side Rib */}
            <mesh position={[xPos, height / 2, width / 2 + 0.008]}>
              <boxGeometry args={[ribSpacing * 0.45, height * 0.88, 0.015]} />
              <meshStandardMaterial
                color={bodyColor}
                roughness={0.6}
                metalness={0.25}
              />
            </mesh>
            {/* Port Side Rib */}
            <mesh position={[xPos, height / 2, -width / 2 - 0.008]}>
              <boxGeometry args={[ribSpacing * 0.45, height * 0.88, 0.015]} />
              <meshStandardMaterial
                color={bodyColor}
                roughness={0.6}
                metalness={0.25}
              />
            </mesh>
          </React.Fragment>
        );
      })}

      {/* 3. ROOF CORRUGATION RIBS */}
      {Array.from({ length: is20ft ? 6 : 12 }).map((_, i) => {
        const xPos = -length / 2 + 0.25 + i * (length / (is20ft ? 7 : 13));
        return (
          <mesh key={`roof-${i}`} position={[xPos, height + 0.006, 0]}>
            <boxGeometry args={[0.06, 0.012, width * 0.92]} />
            <meshStandardMaterial color={theme.roof} roughness={0.7} />
          </mesh>
        );
      })}

      {/* 4. HEAVY CORNER POSTS & ISO CORNER CASTINGS */}
      {[-length / 2, length / 2].map((cx, cxi) =>
        [-width / 2, width / 2].map((cz, czi) => (
          <group key={`corner-${cxi}-${czi}`} position={[cx, 0, cz]}>
            {/* Vertical Steel Corner Post */}
            <mesh position={[0, height / 2, 0]}>
              <boxGeometry args={[0.08, height, 0.08]} />
              <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.4} />
            </mesh>
            {/* Bottom ISO Corner Casting (with twistlock engagement aperture) */}
            <mesh position={[0, 0.03, 0]}>
              <boxGeometry args={[0.09, 0.06, 0.09]} />
              <meshStandardMaterial color="#0b1320" metalness={0.9} roughness={0.2} />
            </mesh>
            {/* Top ISO Corner Casting */}
            <mesh position={[0, height - 0.03, 0]}>
              <boxGeometry args={[0.09, 0.06, 0.09]} />
              <meshStandardMaterial color="#0b1320" metalness={0.9} roughness={0.2} />
            </mesh>
          </group>
        ))
      )}

      {/* 5. REAR CARGO DOORS & LOCKING GEAR (At X = length / 2) */}
      <group position={[length / 2 + 0.005, height / 2, 0]}>
        {/* Recessed Door Frame with Rubber Weather Gasket */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.02, height * 0.94, width * 0.94]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} />
        </mesh>
        {/* Left & Right Door Leaves */}
        <mesh position={[0.005, 0, -width * 0.23]}>
          <boxGeometry args={[0.02, height * 0.9, width * 0.44]} />
          <meshStandardMaterial color={theme.doors} roughness={0.6} />
        </mesh>
        <mesh position={[0.005, 0, width * 0.23]}>
          <boxGeometry args={[0.02, height * 0.9, width * 0.44]} />
          <meshStandardMaterial color={theme.doors} roughness={0.6} />
        </mesh>

        {/* 4 Vertical Steel Locking Bars (Cams & Keepers) */}
        {[-width * 0.35, -width * 0.12, width * 0.12, width * 0.35].map((bz, bi) => (
          <group key={`bar-${bi}`} position={[0.025, 0, bz]}>
            <mesh>
              <cylinderGeometry args={[0.012, 0.012, height * 0.88, 8]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.3} />
            </mesh>
            {/* Top & Bottom Cam Latch Keepers */}
            <mesh position={[0, height * 0.42, 0]}>
              <boxGeometry args={[0.035, 0.04, 0.03]} />
              <meshStandardMaterial color="#334155" metalness={0.8} />
            </mesh>
            <mesh position={[0, -height * 0.42, 0]}>
              <boxGeometry args={[0.035, 0.04, 0.03]} />
              <meshStandardMaterial color="#334155" metalness={0.8} />
            </mesh>
            {/* Door Handle with Rubber Grip */}
            <mesh position={[0.02, -0.05, 0]}>
              <boxGeometry args={[0.06, 0.018, 0.015]} />
              <meshStandardMaterial color="#ef4444" roughness={0.4} />
            </mesh>
          </group>
        ))}

        {/* Door Hinges (4 along each outer edge) */}
        {[-0.35, -0.12, 0.12, 0.35].map((hy, hi) => (
          <React.Fragment key={`hinge-${hi}`}>
            <mesh position={[0.015, hy, -width * 0.45]}>
              <boxGeometry args={[0.03, 0.04, 0.025]} />
              <meshStandardMaterial color="#334155" metalness={0.8} />
            </mesh>
            <mesh position={[0.015, hy, width * 0.45]}>
              <boxGeometry args={[0.03, 0.04, 0.025]} />
              <meshStandardMaterial color="#334155" metalness={0.8} />
            </mesh>
          </React.Fragment>
        ))}
      </group>

      {/* 6. FRONT REEFER COMPRESSOR UNIT (For Reefer Containers at X = -length / 2) */}
      {isReefer && (
        <group position={[-length / 2 - 0.005, height / 2, 0]}>
          {/* Recessed Machinery Box */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.04, height * 0.85, width * 0.85]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.3} metalness={0.5} />
          </mesh>
          {/* Compressor Louver Grille */}
          <mesh position={[-0.02, 0.1, 0]}>
            <boxGeometry args={[0.01, 0.4, 0.6]} />
            <meshStandardMaterial color="#0284c7" roughness={0.6} />
          </mesh>
          {/* Power Cable & Digital Temperature Telemetry Display */}
          <mesh position={[-0.025, -0.22, 0.2]}>
            <boxGeometry args={[0.01, 0.1, 0.16]} />
            <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.6} />
          </mesh>
        </group>
      )}

      {/* 7. HAZARD PLACARD (For IMO Hazardous Containers) */}
      {isHazardous && (
        <group position={[0, height / 2, width / 2 + 0.02]} rotation={[0, 0, Math.PI / 4]}>
          <mesh>
            <planeGeometry args={[0.2, 0.2]} />
            <meshStandardMaterial color="#f97316" emissive="#f97316" emissiveIntensity={0.4} />
          </mesh>
        </group>
      )}

      {/* 8. FORKLIFT POCKETS ON LOWER FRAME */}
      {[-0.45, 0.45].map((fx, fi) => (
        <mesh key={`forklift-${fi}`} position={[fx, 0.06, 0]}>
          <boxGeometry args={[0.32, 0.08, width + 0.01]} />
          <meshStandardMaterial color="#0f172a" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}
