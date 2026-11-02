"use client";

import React, { useState } from "react";
import * as THREE from "three";
import { BerthRead } from "@/types/api";

interface BerthZone3DProps {
  position: [number, number, number];
  length: number;
  berth: BerthRead;
  isSelected?: boolean;
  onSelect?: () => void;
}

export function BerthZone3D({
  position,
  length,
  berth,
  isSelected = false,
  onSelect,
}: BerthZone3DProps) {
  const [hovered, setHovered] = useState(false);

  const isOccupied = berth.status === "OCCUPIED";
  const isMaintenance = berth.status === "MAINTENANCE";

  const surfaceColor = isSelected
    ? "#16a394"
    : hovered
    ? "#475569"
    : isOccupied
    ? "#334155"
    : "#1e293b";

  return (
    <group
      position={position}
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
      {/* Quay Apron Surface for this Berth Zone */}
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[length - 0.4, 0.2, 5.8]} />
        <meshStandardMaterial color={surfaceColor} roughness={0.7} />
      </mesh>

      {/* Yellow Safety Waterfront Edge Curb */}
      <mesh position={[0, 0.22, -2.85]}>
        <boxGeometry args={[length - 0.4, 0.05, 0.15]} />
        <meshStandardMaterial color="#eab308" roughness={0.4} />
      </mesh>

      {/* Mooring Bollards along Quay Edge (3 per berth) */}
      {[-length / 3, 0, length / 3].map((bollardX, idx) => (
        <group key={idx} position={[bollardX, 0.35, -2.7]}>
          <mesh>
            <cylinderGeometry args={[0.08, 0.1, 0.3, 10]} />
            <meshStandardMaterial color="#0f172a" metalness={0.8} />
          </mesh>
          <mesh position={[0, 0.15, 0]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshStandardMaterial color="#0f172a" metalness={0.8} />
          </mesh>
        </group>
      ))}

      {/* Crane Rail Grooves in Concrete (Dual Rail Lines) */}
      <mesh position={[0, 0.21, -1.8]}>
        <boxGeometry args={[length - 0.4, 0.02, 0.08]} />
        <meshStandardMaterial color="#020617" metalness={0.9} />
      </mesh>
      <mesh position={[0, 0.21, 0.4]}>
        <boxGeometry args={[length - 0.4, 0.02, 0.08]} />
        <meshStandardMaterial color="#020617" metalness={0.9} />
      </mesh>

      {/* Selection Border / Outline */}
      {isSelected && (
        <mesh position={[0, 0.22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[length - 0.3, 5.9]} />
          <meshBasicMaterial
            color="#16a394"
            wireframe
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}

