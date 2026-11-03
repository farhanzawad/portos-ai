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
  onHover?: (isHovered: boolean) => void;
}

export function BerthZone3D({
  position,
  length,
  berth,
  isSelected = false,
  onSelect,
  onHover,
}: BerthZone3DProps) {
  const [hovered, setHovered] = useState(false);

  const isOccupied = berth.status === "OCCUPIED";
  const isMaintenance = berth.status === "MAINTENANCE";

  const surfaceColor = isSelected
    ? "#0e7490"
    : hovered
    ? "#334155"
    : isOccupied
    ? "#1e293b"
    : isMaintenance
    ? "#451a03"
    : "#0f172a";

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
        onHover?.(true);
      }}
      onPointerOut={() => {
        setHovered(false);
        onHover?.(false);
      }}
    >
      {/* ============================================================ */}
      {/* 1. QUAYSIDE APRON HEAVY REINFORCED CONCRETE DECK             */}
      {/* ============================================================ */}
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[length - 0.2, 0.22, 6.0]} />
        <meshStandardMaterial
          color={surfaceColor}
          roughness={0.7}
          metalness={0.15}
        />
      </mesh>

      {/* Vertical Concrete Quay Wall (facing river at Z = -3.0) */}
      <mesh position={[0, -0.65, -3.0]}>
        <boxGeometry args={[length - 0.2, 1.3, 0.2]} />
        <meshStandardMaterial color="#1e293b" roughness={0.9} />
      </mesh>

      {/* ============================================================ */}
      {/* 2. WATERFRONT FENDERS & MOORING BOLLARDS                     */}
      {/* ============================================================ */}
      {/* Heavy Cylindrical Rubber Arch Fenders (Prevent Ship Impact) */}
      {[-length * 0.35, -length * 0.12, length * 0.12, length * 0.35].map((fx, fi) => (
        <group key={fi} position={[fx, -0.4, -3.15]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.22, 0.22, 0.7, 12]} />
            <meshStandardMaterial color="#090d16" roughness={0.9} metalness={0.1} />
          </mesh>
        </group>
      ))}

      {/* Yellow Safety Waterfront Coping Curb */}
      <mesh position={[0, 0.23, -2.94]}>
        <boxGeometry args={[length - 0.2, 0.05, 0.14]} />
        <meshStandardMaterial color="#eab308" roughness={0.3} />
      </mesh>

      {/* Cast Iron Mooring Bollards (4 double-bitt bollards per berth) */}
      {[-length * 0.38, -length * 0.14, length * 0.14, length * 0.38].map((bollardX, idx) => (
        <group key={idx} position={[bollardX, 0.36, -2.75]}>
          {/* Base plate */}
          <mesh position={[0, -0.08, 0]}>
            <boxGeometry args={[0.3, 0.04, 0.18]} />
            <meshStandardMaterial color="#0b1320" metalness={0.85} roughness={0.2} />
          </mesh>
          {/* Twin Bitt Posts */}
          <mesh position={[-0.08, 0.08, 0]}>
            <cylinderGeometry args={[0.06, 0.07, 0.28, 10]} />
            <meshStandardMaterial color="#0b1320" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[0.08, 0.08, 0]}>
            <cylinderGeometry args={[0.06, 0.07, 0.28, 10]} />
            <meshStandardMaterial color="#0b1320" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {/* ============================================================ */}
      {/* 3. QUAYSIDE STS CRANE RUNWAY RAILS                           */}
      {/* ============================================================ */}
      {/* Waterside Rail (embedded at Z = -1.9) */}
      <mesh position={[0, 0.22, -1.9]}>
        <boxGeometry args={[length - 0.2, 0.025, 0.09]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.15} />
      </mesh>
      {/* Landside Rail (embedded at Z = 0.5) */}
      <mesh position={[0, 0.22, 0.5]}>
        <boxGeometry args={[length - 0.2, 0.025, 0.09]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.15} />
      </mesh>

      {/* Berth Demarcation White Boundary Seam */}
      <mesh position={[length / 2 - 0.1, 0.22, 0]}>
        <boxGeometry args={[0.08, 0.015, 5.8]} />
        <meshStandardMaterial color="#ffffff" roughness={0.4} />
      </mesh>

      {/* ============================================================ */}
      {/* 4. SELECTION / HIGHLIGHT OUTLINE                             */}
      {/* ============================================================ */}
      {isSelected && (
        <mesh position={[0, 0.23, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[length - 0.15, 5.95]} />
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
