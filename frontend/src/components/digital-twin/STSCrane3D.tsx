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
  const [hovered, setHovered] = useState(false);

  // Animate trolley and spreader moving along the boom during simulation
  useFrame(({ clock }) => {
    if (trolleyRef.current && isSimulating) {
      const t = clock.getElapsedTime() * 1.5;
      // Oscillate trolley along the boom (Z-axis over water)
      const offsetZ = Math.sin(t) * 2.2 - 1.5;
      trolleyRef.current.position.z = offsetZ;

      // Slight hoist cable bob
      trolleyRef.current.position.y = 5.6 + Math.sin(t * 2) * 0.15;
    }
  });

  const frameColor = isSelected ? "#16a394" : hovered ? "#0284c7" : "#0284c7"; // Port machinery blue/cyan
  const machineryColor = "#334155"; // Charcoal machinery house
  const spreaderColor = "#eab308"; // Industrial safety yellow spreader

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
      {/* Selection Base Indicator */}
      {isSelected && (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.2, 2.6, 24]} />
          <meshBasicMaterial color="#16a394" side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* 4 Gantry Legs (Spanning quay crane tracks) */}
      {/* Front-Left Leg */}
      <mesh position={[-1.2, 2.8, -1.0]}>
        <boxGeometry args={[0.2, 5.6, 0.2]} />
        <meshStandardMaterial color={frameColor} metalness={0.4} />
      </mesh>
      {/* Front-Right Leg */}
      <mesh position={[1.2, 2.8, -1.0]}>
        <boxGeometry args={[0.2, 5.6, 0.2]} />
        <meshStandardMaterial color={frameColor} metalness={0.4} />
      </mesh>
      {/* Rear-Left Leg */}
      <mesh position={[-1.2, 2.8, 1.0]}>
        <boxGeometry args={[0.2, 5.6, 0.2]} />
        <meshStandardMaterial color={frameColor} metalness={0.4} />
      </mesh>
      {/* Rear-Right Leg */}
      <mesh position={[1.2, 2.8, 1.0]}>
        <boxGeometry args={[0.2, 5.6, 0.2]} />
        <meshStandardMaterial color={frameColor} metalness={0.4} />
      </mesh>

      {/* Cross Beams / Portal Portal Frame */}
      <mesh position={[0, 5.4, 0]}>
        <boxGeometry args={[2.8, 0.4, 2.4]} />
        <meshStandardMaterial color={frameColor} metalness={0.4} />
      </mesh>

      {/* Upper Machinery House */}
      <mesh position={[0, 6.2, 0.6]}>
        <boxGeometry args={[2.2, 1.2, 1.6]} />
        <meshStandardMaterial color={machineryColor} roughness={0.4} />
      </mesh>

      {/* A-Frame Tower Atop Machinery */}
      <mesh position={[0, 7.8, 0]}>
        <boxGeometry args={[0.8, 2.4, 1.8]} />
        <meshStandardMaterial color={frameColor} metalness={0.5} />
      </mesh>

      {/* Horizontal Boom reaching out over water (-Z axis) */}
      <mesh position={[0, 5.8, -2.5]}>
        <boxGeometry args={[0.8, 0.4, 7.5]} />
        <meshStandardMaterial color={frameColor} metalness={0.5} />
      </mesh>

      {/* Backreach Counterweight Boom (+Z axis) */}
      <mesh position={[0, 5.8, 2.5]}>
        <boxGeometry args={[0.8, 0.4, 2.5]} />
        <meshStandardMaterial color={frameColor} metalness={0.5} />
      </mesh>

      {/* Animated Trolley & Spreader Hoist */}
      <group ref={trolleyRef} position={[0, 5.6, -1.5]}>
        {/* Trolley Box */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.6, 0.2, 0.8]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>

        {/* 4 Hoist Wire Cables */}
        <mesh position={[0, -1.2, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 2.2, 6]} />
          <meshBasicMaterial color="#94a3b8" />
        </mesh>

        {/* Spreader Frame (Safety Yellow) */}
        <mesh position={[0, -2.3, 0]}>
          <boxGeometry args={[1.4, 0.2, 0.7]} />
          <meshStandardMaterial color={spreaderColor} roughness={0.4} />
        </mesh>
      </group>
    </group>
  );
}

