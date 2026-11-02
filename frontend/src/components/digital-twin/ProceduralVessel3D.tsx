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
}

export function ProceduralVessel3D({
  position,
  rotation = [0, 0, 0],
  scale = 1,
  call,
  isSelected = false,
  onSelect,
  isSimulating = false,
}: ProceduralVessel3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  // Subtle floating sway effect when on water
  useFrame(({ clock }) => {
    if (groupRef.current && isSimulating) {
      const t = clock.getElapsedTime();
      groupRef.current.position.y = position[1] + Math.sin(t * 1.5) * 0.08;
      groupRef.current.rotation.z = Math.sin(t * 1.2) * 0.015;
    }
  });

  const hullColor = isSelected ? "#16a394" : hovered ? "#2a4365" : "#1a2536";
  const waterlineColor = "#991b1b"; // Maritime red anti-fouling boot-topping
  const superstructureColor = "#f1f5f9"; // Clean maritime white

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
      {/* Selection Glow / Ring */}
      {isSelected && (
        <mesh position={[0, -0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[5, 5.8, 32]} />
          <meshBasicMaterial color="#16a394" side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Main Hull Body (Lower anti-fouling keel) */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[10, 0.8, 2.4]} />
        <meshStandardMaterial color={waterlineColor} roughness={0.6} />
      </mesh>

      {/* Upper Hull (Navy / dark steel) */}
      <mesh position={[0, 1.2, 0]}>
        <boxGeometry args={[10.2, 0.8, 2.5]} />
        <meshStandardMaterial color={hullColor} roughness={0.5} />
      </mesh>

      {/* Tapered Bow / Forecastle (Wedge) */}
      <mesh position={[5.4, 1.3, 0]} rotation={[0, 0, -Math.PI / 14]}>
        <boxGeometry args={[1.6, 0.9, 2.2]} />
        <meshStandardMaterial color={hullColor} roughness={0.5} />
      </mesh>

      {/* Raised Forecastle Head */}
      <mesh position={[5.8, 1.8, 0]}>
        <boxGeometry args={[0.9, 0.4, 2.0]} />
        <meshStandardMaterial color={superstructureColor} roughness={0.4} />
      </mesh>

      {/* Bridge / Accommodation Superstructure at Stern */}
      <mesh position={[-3.6, 2.4, 0]}>
        <boxGeometry args={[1.8, 1.6, 2.1]} />
        <meshStandardMaterial color={superstructureColor} roughness={0.3} />
      </mesh>

      {/* Wheelhouse Navigation Bridge (Upper tier with dark windows) */}
      <mesh position={[-3.6, 3.4, 0]}>
        <boxGeometry args={[1.5, 0.6, 2.4]} />
        <meshStandardMaterial color="#334155" roughness={0.2} metalness={0.7} />
      </mesh>

      {/* Funnel / Exhaust Stack */}
      <mesh position={[-4.5, 3.2, 0]}>
        <cylinderGeometry args={[0.3, 0.35, 1.4, 12]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} />
      </mesh>

      {/* Radar Mast */}
      <mesh position={[-3.6, 4.0, 0]}>
        <cylinderGeometry args={[0.04, 0.06, 0.9, 8]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.8} />
      </mesh>

      {/* Container Cargo Stacks in Bays */}
      {/* Bay 1 (Midships-Aft) */}
      <mesh position={[-1.8, 2.1, 0]}>
        <boxGeometry args={[1.6, 1.0, 2.0]} />
        <meshStandardMaterial color="#1e3a8a" roughness={0.7} />
      </mesh>
      {/* Bay 2 (Midships-Center) */}
      <mesh position={[0.1, 2.3, 0]}>
        <boxGeometry args={[1.6, 1.4, 2.0]} />
        <meshStandardMaterial color="#0f766e" roughness={0.7} />
      </mesh>
      {/* Bay 3 (Midships-Forward) */}
      <mesh position={[2.0, 2.2, 0]}>
        <boxGeometry args={[1.6, 1.2, 2.0]} />
        <meshStandardMaterial color="#b45309" roughness={0.7} />
      </mesh>
      {/* Bay 4 (Forward Bay) */}
      <mesh position={[3.8, 2.0, 0]}>
        <boxGeometry args={[1.5, 0.8, 1.9]} />
        <meshStandardMaterial color="#991b1b" roughness={0.7} />
      </mesh>
    </group>
  );
}

