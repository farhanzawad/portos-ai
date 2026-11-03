"use client";

import React, { useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { EquipmentRead } from "@/types/api";
import { RealisticContainer3D } from "./RealisticContainer3D";

interface STSCrane3DProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  crane: EquipmentRead;
  isSelected?: boolean;
  onSelect?: () => void;
  isSimulating?: boolean;
}

export function STSCrane3D({
  position,
  rotation = [0, 0, 0],
  scale = 1,
  crane,
  isSelected = false,
  onSelect,
  isSimulating = false,
}: STSCrane3DProps) {
  const trolleyRef = useRef<THREE.Group>(null);
  const spreaderRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  // Dynamic hoisting and traversing cycle during simulation
  useFrame(({ clock }) => {
    if (trolleyRef.current && spreaderRef.current && isSimulating) {
      const t = clock.getElapsedTime() * 1.2;
      // Trolley cycle: Traverse from quay truck lane (Z = 0.5) to vessel hold (Z = -4.5)
      const cycleZ = Math.sin(t) * 2.5 - 2.0;
      trolleyRef.current.position.z = cycleZ;

      // Spreader hoisting cycle: Lifts up over ship coaming and lowers into vessel hold
      const liftPhase = Math.sin(t * 2);
      const hoistY = -1.9 + Math.max(-1.4, Math.min(0.2, liftPhase * 0.95));
      spreaderRef.current.position.y = hoistY;
    }
  });

  // Marine Industrial Coating Palette (Matching Reference Image 3)
  const structuralBlue = isSelected ? "#0284c7" : hovered ? "#0284c7" : "#0369a1"; // Vibrant ZPMC / DP World Blue
  const machinerySteel = "#f8fafc"; // Machinery house white enclosure
  const warningYellow = "#eab308"; // Industrial safety high-vis yellow for walkways and spreader
  const safetyRed = "#ef4444"; // Aviation & maritime hazard warning red
  const cableSteel = "#94a3b8"; // Galvanized wire rope

  return (
    <group
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
      {/* 1. SELECTION RING & BASE ANCHOR                             */}
      {/* ============================================================ */}
      {isSelected && (
        <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.5, 2.9, 32]} />
          <meshBasicMaterial color="#16a394" side={THREE.DoubleSide} transparent opacity={0.8} />
        </mesh>
      )}

      {/* ============================================================ */}
      {/* 2. EQUALIZER GANTRY BOGIES & RAIL WHEELS                     */}
      {/* ============================================================ */}
      {/* 4 Multi-Wheel Equalizer Bogie Trucks on Embedded Crane Rails */}
      {[
        [-1.3, -1.2],
        [1.3, -1.2],
        [-1.3, 1.2],
        [1.3, 1.2],
      ].map(([x, z], i) => (
        <group key={i} position={[x, 0.18, z]}>
          {/* Main Bogie Rocker Box */}
          <mesh>
            <boxGeometry args={[0.7, 0.32, 0.38]} />
            <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Flanged Steel Rail Wheels */}
          {[-0.24, 0, 0.24].map((wx, wi) => (
            <mesh key={wi} position={[wx, -0.09, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.11, 0.11, 0.42, 12]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
            </mesh>
          ))}
          {/* Rail Sweeper & Storm Pin Bracket */}
          <mesh position={[0.34, -0.06, 0]}>
            <boxGeometry args={[0.08, 0.12, 0.36]} />
            <meshStandardMaterial color={warningYellow} roughness={0.4} />
          </mesh>
          <mesh position={[-0.34, -0.06, 0]}>
            <boxGeometry args={[0.08, 0.12, 0.36]} />
            <meshStandardMaterial color={warningYellow} roughness={0.4} />
          </mesh>
        </group>
      ))}

      {/* Electric High-Voltage Cable Reel Drum (Waterside Leg Base) */}
      <group position={[1.45, 0.55, -1.2]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.42, 0.42, 0.3, 16]} />
        <meshStandardMaterial color="#ea580c" roughness={0.5} />
      </group>

      {/* ============================================================ */}
      {/* 3. PORTAL A-FRAME LEGS & LATTICE X-TRUSS BRACING             */}
      {/* ============================================================ */}
      {/* Waterside Legs (Front Left & Front Right) */}
      <mesh position={[-1.3, 3.2, -1.2]}>
        <boxGeometry args={[0.28, 5.8, 0.28]} />
        <meshStandardMaterial color={structuralBlue} roughness={0.4} metalness={0.2} />
      </mesh>
      <mesh position={[1.3, 3.2, -1.2]}>
        <boxGeometry args={[0.28, 5.8, 0.28]} />
        <meshStandardMaterial color={structuralBlue} roughness={0.4} metalness={0.2} />
      </mesh>

      {/* Landside Legs (Rear Left & Rear Right) */}
      <mesh position={[-1.3, 3.2, 1.2]}>
        <boxGeometry args={[0.28, 5.8, 0.28]} />
        <meshStandardMaterial color={structuralBlue} roughness={0.4} metalness={0.2} />
      </mesh>
      <mesh position={[1.3, 3.2, 1.2]}>
        <boxGeometry args={[0.28, 5.8, 0.28]} />
        <meshStandardMaterial color={structuralBlue} roughness={0.4} metalness={0.2} />
      </mesh>

      {/* Portal Cross Beams (Upper clearance for container trucks) */}
      <mesh position={[0, 5.9, -1.2]}>
        <boxGeometry args={[2.9, 0.48, 0.32]} />
        <meshStandardMaterial color={structuralBlue} roughness={0.4} />
      </mesh>
      <mesh position={[0, 5.9, 1.2]}>
        <boxGeometry args={[2.9, 0.48, 0.32]} />
        <meshStandardMaterial color={structuralBlue} roughness={0.4} />
      </mesh>

      {/* Longitudinal Girders */}
      <mesh position={[-1.3, 5.9, 0]}>
        <boxGeometry args={[0.32, 0.48, 2.7]} />
        <meshStandardMaterial color={structuralBlue} roughness={0.4} />
      </mesh>
      <mesh position={[1.3, 5.9, 0]}>
        <boxGeometry args={[0.32, 0.48, 2.7]} />
        <meshStandardMaterial color={structuralBlue} roughness={0.4} />
      </mesh>

      {/* Portal Diagonal X-Braces (Structural Truss Work) */}
      {[-1.3, 1.3].map((lx, li) => (
        <React.Fragment key={`x-brace-${li}`}>
          <mesh position={[lx, 3.2, 0]} rotation={[Math.PI / 4.8, 0, 0]}>
            <boxGeometry args={[0.14, 3.4, 0.14]} />
            <meshStandardMaterial color={structuralBlue} roughness={0.5} />
          </mesh>
          <mesh position={[lx, 3.2, 0]} rotation={[-Math.PI / 4.8, 0, 0]}>
            <boxGeometry args={[0.14, 3.4, 0.14]} />
            <meshStandardMaterial color={structuralBlue} roughness={0.5} />
          </mesh>
        </React.Fragment>
      ))}

      {/* Access Stairway / Ladder with Yellow Safety Cage */}
      <group position={[-1.48, 3.2, 1.2]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.18, 5.6, 0.18]} />
          <meshStandardMaterial color={warningYellow} roughness={0.4} />
        </mesh>
      </group>

      {/* ============================================================ */}
      {/* 4. MACHINERY HOUSE, A-FRAME PYLON & FORESTAY CABLES          */}
      {/* ============================================================ */}
      {/* Upper Machinery House Enclosure (Electric Winch Room) */}
      <group position={[0, 6.78, 0.8]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[2.6, 1.35, 1.9]} />
          <meshStandardMaterial color={machinerySteel} roughness={0.3} metalness={0.2} />
        </mesh>
        {/* Machinery Branding Stencil Stripe */}
        <mesh position={[0, 0.2, 0.96]}>
          <boxGeometry args={[2.4, 0.22, 0.02]} />
          <meshStandardMaterial color={structuralBlue} roughness={0.3} />
        </mesh>
        {/* Louver Vents */}
        <mesh position={[0, -0.15, 0.96]}>
          <boxGeometry args={[1.8, 0.45, 0.02]} />
          <meshStandardMaterial color="#334155" roughness={0.8} />
        </mesh>
      </group>

      {/* A-Frame Apex Pylon Tower */}
      <mesh position={[-0.95, 8.4, 0.1]} rotation={[0, 0, -Math.PI / 20]}>
        <boxGeometry args={[0.22, 2.8, 0.22]} />
        <meshStandardMaterial color={structuralBlue} roughness={0.4} />
      </mesh>
      <mesh position={[0.95, 8.4, 0.1]} rotation={[0, 0, Math.PI / 20]}>
        <boxGeometry args={[0.22, 2.8, 0.22]} />
        <meshStandardMaterial color={structuralBlue} roughness={0.4} />
      </mesh>
      {/* Apex Pylon Crosshead Beam */}
      <mesh position={[0, 9.8, 0.1]}>
        <boxGeometry args={[1.8, 0.32, 0.38]} />
        <meshStandardMaterial color={structuralBlue} roughness={0.4} />
      </mesh>

      {/* High-Intensity Aviation Obstruction Hazard Beacons */}
      {[-0.8, 0.8].map((ax, ai) => (
        <mesh key={ai} position={[ax, 10.05, 0.1]}>
          <sphereGeometry args={[0.08, 10, 8]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1.2} />
        </mesh>
      ))}

      {/* High-Tension Stay Cables (Forestay to Boom & Backstay to Gantry) */}
      <mesh position={[0, 8.1, -2.8]} rotation={[-Math.PI / 5.2, 0, 0]}>
        <cylinderGeometry args={[0.022, 0.022, 6.4, 6]} />
        <meshStandardMaterial color={cableSteel} metalness={0.9} />
      </mesh>
      <mesh position={[0, 8.1, 1.8]} rotation={[Math.PI / 4.8, 0, 0]}>
        <cylinderGeometry args={[0.022, 0.022, 4.2, 6]} />
        <meshStandardMaterial color={cableSteel} metalness={0.9} />
      </mesh>

      {/* ============================================================ */}
      {/* 5. CANTILEVERED BOOM WITH RED & WHITE HAZARD STRIPES         */}
      {/* ============================================================ */}
      {/* Main Boom Twin Box Girders */}
      <mesh position={[-0.7, 6.25, -2.2]}>
        <boxGeometry args={[0.2, 0.44, 9.6]} />
        <meshStandardMaterial color={structuralBlue} roughness={0.4} />
      </mesh>
      <mesh position={[0.7, 6.25, -2.2]}>
        <boxGeometry args={[0.2, 0.44, 9.6]} />
        <meshStandardMaterial color={structuralBlue} roughness={0.4} />
      </mesh>

      {/* Red & White Alternating Hazard Stripes on Waterside Boom Tip (Image 3) */}
      {[-6.8, -6.2, -5.6, -5.0, -4.4].map((sz, si) => (
        <group key={`hazard-${si}`} position={[0, 6.25, sz]}>
          {[-0.7, 0.7].map((gx, gi) => (
            <mesh key={`h-patch-${gi}`} position={[gx, 0, 0]}>
              <boxGeometry args={[0.22, 0.46, 0.58]} />
              <meshStandardMaterial
                color={si % 2 === 0 ? safetyRed : "#ffffff"}
                roughness={0.3}
              />
            </mesh>
          ))}
        </group>
      ))}

      {/* Walkway with Yellow Safety Handrails running along the boom */}
      <mesh position={[0, 6.48, -2.2]}>
        <boxGeometry args={[1.2, 0.03, 9.2]} />
        <meshStandardMaterial color="#334155" metalness={0.6} />
      </mesh>
      {/* Yellow Handrails */}
      {[-0.6, 0.6].map((rx, ri) => (
        <mesh key={`rail-${ri}`} position={[rx, 6.72, -2.2]}>
          <boxGeometry args={[0.03, 0.45, 9.2]} />
          <meshStandardMaterial color={warningYellow} roughness={0.4} />
        </mesh>
      ))}

      {/* ============================================================ */}
      {/* 6. DYNAMIC TROLLEY, OPERATOR CAB & CONTAINER SPREADER        */}
      {/* ============================================================ */}
      <group ref={trolleyRef} position={[0, 6.0, -1.8]}>
        {/* Motorized Trolley Carriage */}
        <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={[1.45, 0.28, 1.25]} />
          <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.7} />
        </mesh>

        {/* Suspended Operator Cabin with 360-degree Panoramic Glass Floor */}
        <group position={[0.48, -0.65, 0.2]}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.55, 0.78, 0.68]} />
            <meshStandardMaterial color="#0284c7" roughness={0.3} />
          </mesh>
          {/* Panoramic Windshield & Downward Floor Window */}
          <mesh position={[0, -0.15, -0.35]}>
            <boxGeometry args={[0.48, 0.55, 0.04]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>

        {/* 4 Heavy Steel Hoist Wire Ropes */}
        {[
          [-0.48, -0.42],
          [0.48, -0.42],
          [-0.48, 0.42],
          [0.48, 0.42],
        ].map(([hx, hz], i) => (
          <mesh key={i} position={[hx, -1.2, hz]}>
            <cylinderGeometry args={[0.014, 0.014, 2.4, 6]} />
            <meshStandardMaterial color={cableSteel} metalness={0.9} />
          </mesh>
        ))}

        {/* Telescopic Container Spreader Bar */}
        <group ref={spreaderRef} position={[0, -2.4, 0]}>
          {/* Main Telescopic Spreader Beam */}
          <mesh position={[0, 0.12, 0]}>
            <boxGeometry args={[1.5, 0.24, 2.4]} />
            <meshStandardMaterial color={warningYellow} roughness={0.3} metalness={0.2} />
          </mesh>

          {/* 4 Corner Guide Flippers */}
          {[
            [-0.78, -1.22],
            [0.78, -1.22],
            [-0.78, 1.22],
            [0.78, 1.22],
          ].map(([fx, fz], i) => (
            <mesh key={i} position={[fx, -0.08, fz]}>
              <boxGeometry args={[0.15, 0.35, 0.15]} />
              <meshStandardMaterial color="#111827" metalness={0.8} />
            </mesh>
          ))}

          {/* Actively Suspended 40ft Intermodal Container under Spreader */}
          <group position={[0, -0.58, 0]}>
            <RealisticContainer3D carrier="MAERSK" scale={0.72} />
          </group>
        </group>
      </group>
    </group>
  );
}
