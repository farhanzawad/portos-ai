"use client";

import React, { useState } from "react";
import * as THREE from "three";
import { YardBlockRead } from "@/types/api";
import { RealisticContainer3D, ContainerCarrier } from "./RealisticContainer3D";

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
  const isCongested = block.code === "YB-04" || block.code === "C04";
  const isWatch = block.code === "YB-02" || block.code === "C02";
  const isReefer =
    block.zone === "REEFER" ||
    (block as any).category === "REEFER" ||
    block.code === "C11" ||
    block.code === "YB-11";
  const isHazardous =
    (block as any).category === "HAZARDOUS_IMO" ||
    block.code === "C12" ||
    block.code === "YB-12";
  const stackTier = isHazardous ? 2 : isCongested ? 4 : isWatch ? 3 : 2;

  const carrierList: ContainerCarrier[] = isReefer
    ? ["REEFER"]
    : isHazardous
    ? ["HAZARDOUS"]
    : ["MAERSK", "EVERGREEN", "HAPAG", "MSC", "CMACGM", "ONE", "COSCO"];

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

      {/* Reefer Power Plug Distribution Gantries (Block C11) */}
      {isReefer && (
        <group position={[0, 0.1, 0]}>
          {[-2.2, 0, 2.2].map((rx, ri) => (
            <group key={ri} position={[rx, 0, 0]}>
              <mesh position={[0, 1.2, 0]}>
                <boxGeometry args={[0.15, 2.3, 0.15]} />
                <meshStandardMaterial color="#38bdf8" metalness={0.7} />
              </mesh>
              <mesh position={[0, 2.3, 0]}>
                <boxGeometry args={[0.5, 0.25, 0.3]} />
                <meshStandardMaterial color="#0284c7" emissive="#0284c7" emissiveIntensity={0.3} />
              </mesh>
            </group>
          ))}
        </group>
      )}

      {/* Hazardous IMO Concrete Safety Containment Bund Wall (Block C12) */}
      {isHazardous && (
        <group position={[0, 0.25, 0]}>
          {/* North and South Bund Walls */}
          {[-2.25, 2.25].map((wz, wi) => (
            <mesh key={`h-ns-${wi}`} position={[0, 0, wz]}>
              <boxGeometry args={[6.7, 0.5, 0.2]} />
              <meshStandardMaterial color="#ef4444" roughness={0.6} />
            </mesh>
          ))}
          {/* East and West Bund Walls */}
          {[-3.35, 3.35].map((wx, wi) => (
            <mesh key={`h-ew-${wi}`} position={[wx, 0, 0]}>
              <boxGeometry args={[0.2, 0.5, 4.5]} />
              <meshStandardMaterial color="#ef4444" roughness={0.6} />
            </mesh>
          ))}
          {/* Flashing Hazardous Warning Beacon */}
          <mesh position={[3.2, 0.6, 2.1]}>
            <cylinderGeometry args={[0.1, 0.1, 0.25, 8]} />
            <meshStandardMaterial color="#f97316" emissive="#f97316" emissiveIntensity={1.2} />
          </mesh>
        </group>
      )}

      {/* ============================================================ */}
      {/* 2. REALISTIC CONTAINER CARGO STACKS (3 Bays x 2 Rows)        */}
      {/* ============================================================ */}
      {[-2.0, 0.0, 2.0].map((bayX, bx) =>
        [-1.1, 1.1].map((rowZ, rz) => {
          const tiers = Math.max(1, stackTier - ((bx + rz) % 2));

          return Array.from({ length: tiers }).map((_, tier) => {
            const colorIdx = (bx * 3 + rz * 2 + tier) % carrierList.length;
            const carrier = carrierList[colorIdx];

            return (
              <group key={`${bx}-${rz}-${tier}`} position={[bayX, 0.1 + tier * 0.56, rowZ]}>
                <RealisticContainer3D
                  carrier={carrier}
                  isReefer={isReefer}
                  isHazardous={isHazardous}
                  scale={0.58}
                />
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
            <cylinderGeometry args={[0.3, 0.3, 0.24, 16]} />
            <meshStandardMaterial color="#0f172a" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0, 1.6]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.3, 0.3, 0.24, 16]} />
            <meshStandardMaterial color="#0f172a" roughness={0.9} />
          </mesh>
        </group>

        {/* RTG Right Runway Bogies */}
        <group position={[2.85, 0.3, 0]}>
          <mesh position={[0, 0, -1.6]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.3, 0.3, 0.24, 16]} />
            <meshStandardMaterial color="#0f172a" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0, 1.6]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.3, 0.3, 0.24, 16]} />
            <meshStandardMaterial color="#0f172a" roughness={0.9} />
          </mesh>
        </group>

        {/* 4 Vertical Portal Legs (Industrial Safety Yellow) */}
        {[-2.85, 2.85].map((lx, li) =>
          [-1.6, 1.6].map((lz, lzi) => (
            <mesh key={`${li}-${lzi}`} position={[lx, 2.2, lz]}>
              <boxGeometry args={[0.2, 3.8, 0.2]} />
              <meshStandardMaterial color="#eab308" roughness={0.4} />
            </mesh>
          ))
        )}

        {/* Top Cross Girders (Gantry Header Beams spanning above containers) */}
        <mesh position={[0, 4.15, -1.6]}>
          <boxGeometry args={[5.9, 0.3, 0.24]} />
          <meshStandardMaterial color="#eab308" roughness={0.4} />
        </mesh>
        <mesh position={[0, 4.15, 1.6]}>
          <boxGeometry args={[5.9, 0.3, 0.24]} />
          <meshStandardMaterial color="#eab308" roughness={0.4} />
        </mesh>

        {/* Longitudinal Crane Runway Rails */}
        {[-2.85, 2.85].map((lx, li) => (
          <mesh key={`runway-${li}`} position={[lx, 4.15, 0]}>
            <boxGeometry args={[0.24, 0.3, 3.4]} />
            <meshStandardMaterial color="#eab308" roughness={0.4} />
          </mesh>
        ))}

        {/* RTG Hoist Trolley with Operator Cab */}
        <group position={[0, 3.95, 0]}>
          <mesh position={[0, 0.1, 0]}>
            <boxGeometry args={[1.3, 0.2, 1.7]} />
            <meshStandardMaterial color="#334155" roughness={0.6} metalness={0.4} />
          </mesh>
          {/* Operator Cab Glass */}
          <mesh position={[0.7, -0.4, 0]}>
            <boxGeometry args={[0.35, 0.45, 0.4]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.1} />
          </mesh>
          {/* Spreader Hoist Cables */}
          {[-0.4, 0.4].map((hx, hi) =>
            [-0.6, 0.6].map((hz, hzi) => (
              <mesh key={`cable-${hi}-${hzi}`} position={[hx, -0.65, hz]}>
                <cylinderGeometry args={[0.01, 0.01, 1.1, 4]} />
                <meshStandardMaterial color="#94a3b8" metalness={0.9} />
              </mesh>
            ))
          )}
          {/* Telescopic Yard Spreader Bar with 4 Corner Twistlocks */}
          <group position={[0, -1.2, 0]}>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[1.1, 0.14, 1.8]} />
              <meshStandardMaterial color="#eab308" roughness={0.3} />
            </mesh>
            {[-0.55, 0.55].map((fx, fi) =>
              [-0.9, 0.9].map((fz, fzi) => (
                <mesh key={`rtg-flipper-${fi}-${fzi}`} position={[fx, -0.08, fz]}>
                  <boxGeometry args={[0.08, 0.16, 0.08]} />
                  <meshStandardMaterial color="#0f172a" metalness={0.8} />
                </mesh>
              ))
            )}
          </group>
        </group>

        {/* Diesel Generator Power Pack Enclosure & Vertical Exhaust Stack */}
        <group position={[2.85, 0.95, 0]}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.45, 0.7, 1.25]} />
            <meshStandardMaterial color="#1e293b" roughness={0.7} />
          </mesh>
          {/* Louvers */}
          <mesh position={[0.23, 0.1, 0]}>
            <boxGeometry args={[0.02, 0.35, 0.8]} />
            <meshStandardMaterial color="#475569" roughness={0.9} />
          </mesh>
          {/* Exhaust Pipe */}
          <mesh position={[0, 0.6, 0.4]}>
            <cylinderGeometry args={[0.04, 0.04, 0.5, 8]} />
            <meshStandardMaterial color="#0f172a" metalness={0.8} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
