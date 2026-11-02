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

  // Derive visual status and stacking tiers
  const isCongested = block.code === "YB-04";
  const isWatch = block.code === "YB-02";
  const stackTier = isCongested ? 4 : isWatch ? 3 : 2;

  // Authentic Shipping Line Livery Palette
  const carrierColors = [
    "#0284c7", // Maersk Line Cyan Blue
    "#047857", // Evergreen Marine Green
    "#ea580c", // Hapag-Lloyd Flame Orange
    "#d97706", // Mediterranean Shipping Co (MSC) Yellow
    "#1d4ed8", // CMA CGM Deep Navy
    "#be185d", // Ocean Network Express (ONE) Magenta
    "#f8fafc", // Thermo King / Carrier Reefer White
    "#334155", // Neutral Slate Grey
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
      {/* ============================================================ */}
      {/* 1. PAVEMENT FOUNDATION & HAZARD HATCHING                     */}
      {/* ============================================================ */}
      {/* Concrete Heavy Pavement Pad */}
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[6.8, 0.1, 4.6]} />
        <meshStandardMaterial
          color={isSelected ? "#0e7490" : hovered ? "#334155" : "#1e293b"}
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>

      {/* Perimeter Safety Border Striping */}
      <mesh position={[0, 0.11, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6.95, 4.75]} />
        <meshBasicMaterial
          color={isCongested ? "#ef4444" : isWatch ? "#eab308" : isSelected ? "#16a394" : "#475569"}
          wireframe
          transparent
          opacity={isCongested ? 0.9 : 0.4}
        />
      </mesh>

      {/* Safety Stanchion Corner Markers */}
      {[
        [-3.25, -2.15],
        [3.25, -2.15],
        [-3.25, 2.15],
        [3.25, 2.15],
      ].map(([sx, sz], i) => (
        <mesh key={i} position={[sx, 0.25, sz]}>
          <cylinderGeometry args={[0.06, 0.06, 0.4, 8]} />
          <meshStandardMaterial color="#eab308" roughness={0.4} />
        </mesh>
      ))}

      {/* ============================================================ */}
      {/* 2. REALISTIC CONTAINER CARGO STACKS (3 Bays x 2 Rows)        */}
      {/* ============================================================ */}
      {[-2.0, 0.0, 2.0].map((bayX, bx) =>
        [-1.1, 1.1].map((rowZ, rz) => {
          // Dynamic tier height variation per stack column
          const tiers = Math.max(1, stackTier - ((bx + rz) % 2));

          return Array.from({ length: tiers }).map((_, tier) => {
            // Pick color based on position, tier, and congestion
            const colorIdx = (bx * 3 + rz * 2 + tier) % carrierColors.length;
            const containerColor =
              isCongested && tier === tiers - 1 && (bx + rz) % 2 === 0
                ? "#ef4444" // Top container flagged red for congestion highlight
                : carrierColors[colorIdx];

            return (
              <group key={`${bx}-${rz}-${tier}`} position={[bayX, 0.46 + tier * 0.72, rowZ]}>
                {/* Main 40ft / 20ft Intermodal Container Box */}
                <mesh>
                  <boxGeometry args={[1.75, 0.68, 1.85]} />
                  <meshStandardMaterial
                    color={containerColor}
                    roughness={0.5}
                    metalness={0.15}
                  />
                </mesh>

                {/* Container End Door Bevel Framing */}
                <mesh position={[0.88, 0, 0]}>
                  <boxGeometry args={[0.02, 0.64, 1.78]} />
                  <meshStandardMaterial color="#0f172a" roughness={0.7} />
                </mesh>

                {/* ISO Corner Castings (Dark steel twistlock corner points) */}
                {[
                  [-0.86, -0.32, -0.91],
                  [0.86, -0.32, -0.91],
                  [-0.86, 0.32, -0.91],
                  [0.86, 0.32, -0.91],
                  [-0.86, -0.32, 0.91],
                  [0.86, -0.32, 0.91],
                  [-0.86, 0.32, 0.91],
                  [0.86, 0.32, 0.91],
                ].map(([cx, cy, cz], ci) => (
                  <mesh key={ci} position={[cx, cy, cz]}>
                    <boxGeometry args={[0.05, 0.05, 0.05]} />
                    <meshStandardMaterial color="#0b1320" metalness={0.8} />
                  </mesh>
                ))}
              </group>
            );
          });
        })
      )}

      {/* ============================================================ */}
      {/* 3. RUBBER-TYRED GANTRY (RTG) CRANE STRADDLING YARD BLOCK     */}
      {/* ============================================================ */}
      <group position={[0.6, 0, 0]}>
        {/* RTG Left Runway Bogies (Heavy Industrial Rubber Tires) */}
        <group position={[-2.85, 0.3, 0]}>
          <mesh position={[0, 0, -1.6]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.28, 0.28, 0.22, 16]} />
            <meshStandardMaterial color="#0f172a" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0, 1.6]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.28, 0.28, 0.22, 16]} />
            <meshStandardMaterial color="#0f172a" roughness={0.9} />
          </mesh>
        </group>

        {/* RTG Right Runway Bogies */}
        <group position={[2.85, 0.3, 0]}>
          <mesh position={[0, 0, -1.6]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.28, 0.28, 0.22, 16]} />
            <meshStandardMaterial color="#0f172a" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0, 1.6]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.28, 0.28, 0.22, 16]} />
            <meshStandardMaterial color="#0f172a" roughness={0.9} />
          </mesh>
        </group>

        {/* 4 Vertical Portal Legs */}
        {[-2.85, 2.85].map((lx, li) =>
          [-1.6, 1.6].map((lz, lzi) => (
            <mesh key={`${li}-${lzi}`} position={[lx, 2.2, lz]}>
              <boxGeometry args={[0.18, 3.8, 0.18]} />
              <meshStandardMaterial color="#eab308" roughness={0.4} />
            </mesh>
          ))
        )}

        {/* Top Cross Girders (Gantry Header Beams spanning above containers) */}
        <mesh position={[0, 4.15, -1.6]}>
          <boxGeometry args={[5.9, 0.28, 0.22]} />
          <meshStandardMaterial color="#eab308" roughness={0.4} />
        </mesh>
        <mesh position={[0, 4.15, 1.6]}>
          <boxGeometry args={[5.9, 0.28, 0.22]} />
          <meshStandardMaterial color="#eab308" roughness={0.4} />
        </mesh>

        {/* RTG Hoist Trolley & Spreader hanging over stack */}
        <mesh position={[0, 3.95, 0]}>
          <boxGeometry args={[1.2, 0.18, 1.6]} />
          <meshStandardMaterial color="#334155" roughness={0.6} metalness={0.4} />
        </mesh>

        {/* Diesel Generator Power Pack Unit (Mounted on lower right leg) */}
        <mesh position={[2.85, 0.9, 0]}>
          <boxGeometry args={[0.42, 0.65, 1.2]} />
          <meshStandardMaterial color="#1e293b" roughness={0.7} />
        </mesh>
      </group>
    </group>
  );
}
