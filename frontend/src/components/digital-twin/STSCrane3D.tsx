"use client";

import React, { useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { EquipmentRead } from "@/types/api";

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
      // Trolley cycle: Traverse from quay lane (Z = 0.5) to vessel hold (Z = -4.2)
      const cycleZ = Math.sin(t) * 2.4 - 1.8;
      trolleyRef.current.position.z = cycleZ;

      // Spreader hoisting cycle: Lifts up over ship cell guides and drops into vessel hold
      const liftPhase = Math.sin(t * 2);
      const hoistY = -1.8 + Math.max(-1.5, Math.min(0.2, liftPhase * 0.9));
      spreaderRef.current.position.y = hoistY;
    }
  });

  // Marine Industrial Coating Palette
  const structuralBlue = isSelected ? "#0e7490" : hovered ? "#0284c7" : "#0369a1"; // CPA / Kalmar Port Blue
  const machinerySteel = "#1e293b"; // Slate machinery house
  const warningYellow = "#eab308"; // Industrial safety high-vis yellow
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
      {/* 2. GANTRY BOGIES & RAIL TRUCKS                               */}
      {/* ============================================================ */}
      {/* 4 Heavy-Duty Gantry Wheel Bogies on Embedded Rails */}
      {[
        [-1.3, -1.2],
        [1.3, -1.2],
        [-1.3, 1.2],
        [1.3, 1.2],
      ].map(([x, z], i) => (
        <group key={i} position={[x, 0.18, z]}>
          {/* Wheel Truck Box */}
          <mesh>
            <boxGeometry args={[0.55, 0.32, 0.4]} />
            <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Rail Wheels */}
          <mesh position={[-0.18, -0.08, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.12, 0.12, 0.44, 12]} />
            <meshStandardMaterial color="#64748b" metalness={0.9} />
          </mesh>
          <mesh position={[0.18, -0.08, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.12, 0.12, 0.44, 12]} />
            <meshStandardMaterial color="#64748b" metalness={0.9} />
          </mesh>
          {/* Hazard Chevron Base Collar (Yellow Safety Band) */}
          <mesh position={[0, 0.28, 0]}>
            <boxGeometry args={[0.34, 0.22, 0.34]} />
            <meshStandardMaterial color={warningYellow} roughness={0.4} />
          </mesh>
        </group>
      ))}

      {/* ============================================================ */}
      {/* 3. PORTAL TOWER LEGS & LATTICE FRAME                         */}
      {/* ============================================================ */}
      {/* Waterside Legs (Front Left & Front Right) */}
      <mesh position={[-1.3, 3.2, -1.2]}>
        <boxGeometry args={[0.26, 5.8, 0.26]} />
        <meshStandardMaterial color={structuralBlue} roughness={0.4} metalness={0.2} />
      </mesh>
      <mesh position={[1.3, 3.2, -1.2]}>
        <boxGeometry args={[0.26, 5.8, 0.26]} />
        <meshStandardMaterial color={structuralBlue} roughness={0.4} metalness={0.2} />
      </mesh>

      {/* Landside Legs (Rear Left & Rear Right) */}
      <mesh position={[-1.3, 3.2, 1.2]}>
        <boxGeometry args={[0.26, 5.8, 0.26]} />
        <meshStandardMaterial color={structuralBlue} roughness={0.4} metalness={0.2} />
      </mesh>
      <mesh position={[1.3, 3.2, 1.2]}>
        <boxGeometry args={[0.26, 5.8, 0.26]} />
        <meshStandardMaterial color={structuralBlue} roughness={0.4} metalness={0.2} />
      </mesh>

      {/* Portal Cross Beams (Clearance for Terminal Trucks) */}
      <mesh position={[0, 5.9, -1.2]}>
        <boxGeometry args={[2.9, 0.45, 0.3]} />
        <meshStandardMaterial color={structuralBlue} roughness={0.4} />
      </mesh>
      <mesh position={[0, 5.9, 1.2]}>
        <boxGeometry args={[2.9, 0.45, 0.3]} />
        <meshStandardMaterial color={structuralBlue} roughness={0.4} />
      </mesh>
      {/* Longitudinal Girders */}
      <mesh position={[-1.3, 5.9, 0]}>
        <boxGeometry args={[0.3, 0.45, 2.7]} />
        <meshStandardMaterial color={structuralBlue} roughness={0.4} />
      </mesh>
      <mesh position={[1.3, 5.9, 0]}>
        <boxGeometry args={[0.3, 0.45, 2.7]} />
        <meshStandardMaterial color={structuralBlue} roughness={0.4} />
      </mesh>

      {/* Portal Diagonal Wind Braces */}
      <mesh position={[-1.3, 3.2, 0]} rotation={[Math.PI / 5, 0, 0]}>
        <boxGeometry args={[0.12, 3.2, 0.12]} />
        <meshStandardMaterial color={structuralBlue} roughness={0.5} />
      </mesh>
      <mesh position={[-1.3, 3.2, 0]} rotation={[-Math.PI / 5, 0, 0]}>
        <boxGeometry args={[0.12, 3.2, 0.12]} />
        <meshStandardMaterial color={structuralBlue} roughness={0.5} />
      </mesh>
      <mesh position={[1.3, 3.2, 0]} rotation={[Math.PI / 5, 0, 0]}>
        <boxGeometry args={[0.12, 3.2, 0.12]} />
        <meshStandardMaterial color={structuralBlue} roughness={0.5} />
      </mesh>
      <mesh position={[1.3, 3.2, 0]} rotation={[-Math.PI / 5, 0, 0]}>
        <boxGeometry args={[0.12, 3.2, 0.12]} />
        <meshStandardMaterial color={structuralBlue} roughness={0.5} />
      </mesh>

      {/* ============================================================ */}
      {/* 4. UPPER MACHINERY DECK & A-FRAME TOWER                      */}
      {/* ============================================================ */}
      {/* Machinery House Enclosure (Electric Winches & Electrical Inverters) */}
      <mesh position={[0, 6.75, 0.8]}>
        <boxGeometry args={[2.5, 1.3, 1.8]} />
        <meshStandardMaterial color={machinerySteel} roughness={0.5} metalness={0.3} />
      </mesh>
      {/* Ventilation Grille / Louver on Machinery House */}
      <mesh position={[0, 6.75, 1.72]}>
        <boxGeometry args={[1.8, 0.7, 0.05]} />
        <meshStandardMaterial color="#475569" roughness={0.8} />
      </mesh>

      {/* Apex A-Frame Pylon Tower */}
      <mesh position={[-0.9, 8.4, 0.1]} rotation={[0, 0, -Math.PI / 22]}>
        <boxGeometry args={[0.2, 2.8, 0.2]} />
        <meshStandardMaterial color={structuralBlue} roughness={0.4} />
      </mesh>
      <mesh position={[0.9, 8.4, 0.1]} rotation={[0, 0, Math.PI / 22]}>
        <boxGeometry args={[0.2, 2.8, 0.2]} />
        <meshStandardMaterial color={structuralBlue} roughness={0.4} />
      </mesh>
      {/* Apex Cross Head */}
      <mesh position={[0, 9.8, 0.1]}>
        <boxGeometry args={[1.6, 0.28, 0.35]} />
        <meshStandardMaterial color={structuralBlue} roughness={0.4} />
      </mesh>

      {/* Red Aviation Warning Obstacle Light on Apex */}
      <mesh position={[0, 10.05, 0.1]}>
        <sphereGeometry args={[0.1, 10, 8]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.6} roughness={0.2} />
      </mesh>

      {/* High-Tension Stay Cables (Forestay to Boom & Backstay to Gantry) */}
      <mesh position={[0, 8.1, -2.8]} rotation={[-Math.PI / 5.2, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 6.4, 4]} />
        <meshStandardMaterial color={cableSteel} metalness={0.9} />
      </mesh>
      <mesh position={[0, 8.1, 1.8]} rotation={[Math.PI / 4.8, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 4.2, 4]} />
        <meshStandardMaterial color={cableSteel} metalness={0.9} />
      </mesh>

      {/* ============================================================ */}
      {/* 5. CANTILEVERED OUTREACH BOOM (Over Karnaphuli River)        */}
      {/* ============================================================ */}
      {/* Main Boom Box Girders spanning Z = 2.4 down to Z = -6.8 */}
      <mesh position={[-0.7, 6.25, -2.2]}>
        <boxGeometry args={[0.18, 0.42, 9.2]} />
        <meshStandardMaterial color={structuralBlue} roughness={0.4} />
      </mesh>
      <mesh position={[0.7, 6.25, -2.2]}>
        <boxGeometry args={[0.18, 0.42, 9.2]} />
        <meshStandardMaterial color={structuralBlue} roughness={0.4} />
      </mesh>
      {/* Transverse Cross Ties on Boom */}
      {[-6.4, -4.8, -3.2, -1.6, 0.0, 1.6].map((bz, i) => (
        <mesh key={i} position={[0, 6.38, bz]}>
          <boxGeometry args={[1.45, 0.1, 0.12]} />
          <meshStandardMaterial color={warningYellow} roughness={0.4} />
        </mesh>
      ))}

      {/* ============================================================ */}
      {/* 6. DYNAMIC TROLLEY, OPERATOR CABIN & CONTAINER SPREADER      */}
      {/* ============================================================ */}
      <group ref={trolleyRef} position={[0, 6.0, -1.8]}>
        {/* Motorized Trolley Carriage on Tracks */}
        <mesh position={[0, 0.18, 0]}>
          <boxGeometry args={[1.4, 0.26, 1.2]} />
          <meshStandardMaterial color={machinerySteel} roughness={0.4} metalness={0.6} />
        </mesh>

        {/* Suspended Operator Cabin with 360-degree Glass */}
        <mesh position={[0.45, -0.65, 0.2]}>
          <boxGeometry args={[0.55, 0.75, 0.65]} />
          <meshStandardMaterial color="#0284c7" roughness={0.3} />
        </mesh>
        {/* Cabin Glass Floor & Front Window */}
        <mesh position={[0.45, -0.65, -0.14]}>
          <boxGeometry args={[0.48, 0.65, 0.04]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.1} />
        </mesh>

        {/* 4 Vertical Hoist Wire Ropes (Tethering Trolley to Spreader) */}
        {[
          [-0.45, -0.4],
          [0.45, -0.4],
          [-0.45, 0.4],
          [0.45, 0.4],
        ].map(([hx, hz], i) => (
          <mesh key={i} position={[hx, -1.2, hz]}>
            <cylinderGeometry args={[0.012, 0.012, 2.4, 4]} />
            <meshStandardMaterial color={cableSteel} metalness={0.9} />
          </mesh>
        ))}

        {/* Telescopic Container Spreader Bar */}
        <group ref={spreaderRef} position={[0, -2.4, 0]}>
          {/* Main Spreader Beam */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[1.5, 0.22, 2.3]} />
            <meshStandardMaterial color={warningYellow} roughness={0.3} metalness={0.2} />
          </mesh>

          {/* 4 Corner Twistlock Safety Flippers */}
          {[
            [-0.78, -1.18],
            [0.78, -1.18],
            [-0.78, 1.18],
            [0.78, 1.18],
          ].map(([fx, fz], i) => (
            <mesh key={i} position={[fx, -0.18, fz]}>
              <boxGeometry args={[0.14, 0.32, 0.14]} />
              <meshStandardMaterial color="#111827" metalness={0.8} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
}
