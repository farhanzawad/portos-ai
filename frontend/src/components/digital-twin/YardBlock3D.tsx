"use client";

import React, { useState } from "react";
import * as THREE from "three";
import { YardBlockRead } from "@/types/api";

interface YardBlock3DProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  block: YardBlockRead;
  isSelected?: boolean;
  onSelect?: () => void;
}

export function YardBlock3D({
  position,
  rotation = [0, 0, 0],
  block,
  isSelected = false,
  onSelect,
}: YardBlock3DProps) {
  const [hovered, setHovered] = useState(false);

  // Derive visual density and stack colors based on block code and zone
  const isCongested = block.code === "YB-04"; // Congested demo block
  const isWatch = block.code === "YB-02";

  const stackTier = isCongested ? 4 : isWatch ? 3 : 2;

  // Palette of standard container colors
  const containerColors = [
    "#1e3a8a", // Navy (Maersk / MSC style)
    "#0f766e", // Teal (Evergreen style)
    "#7c2d12", // Rust Red (Hapag-Lloyd style)
    "#334155", // Slate Grey
    "#b45309", // Amber (Reefer / Caution)
  ];

  return (
    <group
      position={position}
      rotation={rotation}
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
      {/* Ground Pavement Pad */}
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[6.2, 0.1, 4.2]} />
        <meshStandardMaterial
          color={isSelected ? "#16a394" : hovered ? "#475569" : "#334155"}
          roughness={0.8}
        />
      </mesh>

      {/* Safety Boundary Markings */}
      {isCongested && (
        <mesh position={[0, 0.11, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[6.4, 4.4]} />
          <meshBasicMaterial
            color="#ef4444"
            wireframe
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Procedural Container Stacks */}
      {/* 3 Bays (along X) x 2 Rows (along Z) */}
      {[-1.8, 0, 1.8].map((bayX, bx) =>
        [-1.0, 1.0].map((rowZ, rz) => {
          // Tier height varies per bay
          const tiers = Math.max(1, stackTier - ((bx + rz) % 2));
          return Array.from({ length: tiers }).map((_, tier) => {
            const color =
              isCongested && tier === tiers - 1
                ? "#ef4444"
                : containerColors[(bx * 2 + rz + tier) % containerColors.length];

            return (
              <mesh
                key={`${bx}-${rz}-${tier}`}
                position={[bayX, 0.5 + tier * 0.75, rowZ]}
              >
                <boxGeometry args={[1.6, 0.7, 1.8]} />
                <meshStandardMaterial color={color} roughness={0.6} />
              </mesh>
            );
          });
        })
      )}

      {/* RTG Crane Gantry spanning over the block */}
      <group position={[0, 2.2, 0]}>
        {/* Left Portal Leg */}
        <mesh position={[-3.0, 0, 0]}>
          <boxGeometry args={[0.15, 4.4, 0.2]} />
          <meshStandardMaterial color="#eab308" metalness={0.5} />
        </mesh>
        {/* Right Portal Leg */}
        <mesh position={[3.0, 0, 0]}>
          <boxGeometry args={[0.15, 4.4, 0.2]} />
          <meshStandardMaterial color="#eab308" metalness={0.5} />
        </mesh>
        {/* Top Cross Beam */}
        <mesh position={[0, 2.2, 0]}>
          <boxGeometry args={[6.2, 0.25, 0.3]} />
          <meshStandardMaterial color="#eab308" metalness={0.5} />
        </mesh>
      </group>
    </group>
  );
}

