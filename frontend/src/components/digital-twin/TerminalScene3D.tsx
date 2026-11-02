"use client";

import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { SelectedEntity, LayerVisibility } from "./types";
import {
  BerthRead,
  VesselCallRead,
  EquipmentRead,
  YardBlockRead,
} from "@/types/api";
import { BerthZone3D } from "./BerthZone3D";
import { ProceduralVessel3D } from "./ProceduralVessel3D";
import { STSCrane3D } from "./STSCrane3D";
import { YardBlock3D } from "./YardBlock3D";

interface TerminalScene3DProps {
  berths: BerthRead[];
  vesselCalls: VesselCallRead[];
  equipment: EquipmentRead[];
  yardBlocks: YardBlockRead[];
  layers: LayerVisibility;
  selectedEntity: SelectedEntity | null;
  onSelectEntity: (entity: SelectedEntity) => void;
  isSimulating: boolean;
  simulationSpeed: 1 | 2 | 5;
  resetCameraSignal: number;
}

export function TerminalScene3D({
  berths,
  vesselCalls,
  equipment,
  yardBlocks,
  layers,
  selectedEntity,
  onSelectEntity,
  isSimulating,
  simulationSpeed,
  resetCameraSignal,
}: TerminalScene3DProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const approachingVesselRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  // Reset Camera action handler
  useEffect(() => {
    if (resetCameraSignal > 0 && controlsRef.current) {
      camera.position.set(40, 42, 46);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, [resetCameraSignal, camera]);

  // Animate approaching vessel along Karnaphuli fairway channel during simulation
  useFrame(({ clock }) => {
    if (approachingVesselRef.current && isSimulating) {
      const t = clock.getElapsedTime() * 0.2 * simulationSpeed;
      // Cycle from X = -50 to X = 10 in the river fairway
      const newX = -45 + ((t * 4) % 60);
      approachingVesselRef.current.position.x = newX;
      // Slight channel heading angle
      approachingVesselRef.current.rotation.y = Math.PI / 1.95;
    }
  });

  // Split vessels into berthed vs queue
  const berthedCalls = vesselCalls.filter((c) => c.status === "BERTHED");
  const queueCalls = vesselCalls.filter((c) => c.status !== "BERTHED");
  const approachingCall = queueCalls[0];

  // 6 Berth X positions along quay edge (Z = -2.8)
  const berthPositions = [-35, -21, -7, 7, 21, 35];

  return (
    <>
      {/* Lighting Rig */}
      <ambientLight intensity={0.7} color="#e2e8f0" />
      <directionalLight
        position={[45, 60, 35]}
        intensity={1.3}
        color="#ffffff"
        castShadow
      />
      <directionalLight
        position={[-30, 25, -25]}
        intensity={0.4}
        color="#94a3b8"
      />

      {/* Orbit Controls with bounded angles */}
      <OrbitControls
        ref={controlsRef}
        makeDefault
        minDistance={18}
        maxDistance={110}
        maxPolarAngle={Math.PI / 2.15}
        minPolarAngle={Math.PI / 8}
        enableDamping
        dampingFactor={0.06}
      />

      {/* ============================================================ */}
      {/* 1. Environment: Karnaphuli River Water & Terminal Land Surface */}
      {/* ============================================================ */}

      {/* River Water Surface (Navy-charcoal reflective plane) */}
      <mesh position={[0, -0.05, -28]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[130, 48]} />
        <meshStandardMaterial
          color="#0d1f30"
          roughness={0.25}
          metalness={0.3}
        />
      </mesh>

      {/* Terminal Land Surface (Asphalt yard ground) */}
      <mesh position={[0, -0.05, 18]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[130, 44]} />
        <meshStandardMaterial color="#0f172a" roughness={0.9} />
      </mesh>

      {/* Approach Channel Lateral Navigation Buoys (Green Port, Red Starboard) */}
      <group position={[-25, 0.4, -36]}>
        <mesh>
          <coneGeometry args={[0.3, 0.9, 10]} />
          <meshStandardMaterial color="#16a394" roughness={0.3} />
        </mesh>
      </group>
      <group position={[25, 0.4, -36]}>
        <mesh>
          <coneGeometry args={[0.3, 0.9, 10]} />
          <meshStandardMaterial color="#d95454" roughness={0.3} />
        </mesh>
      </group>

      {/* ============================================================ */}
      {/* 2. Berths: 6 Demarcated Berth Zones along Quay line */}
      {/* ============================================================ */}
      {layers.berths &&
        berths.slice(0, 6).map((berth, index) => {
          const posX = berthPositions[index] || (index - 2.5) * 14;
          const isSelected =
            selectedEntity?.type === "berth" && selectedEntity.id === berth.id;

          return (
            <BerthZone3D
              key={berth.id}
              position={[posX, 0, -2.8]}
              length={13.6}
              berth={berth}
              isSelected={isSelected}
              onSelect={() =>
                onSelectEntity({ type: "berth", id: berth.id, data: berth })
              }
            />
          );
        })}

      {/* ============================================================ */}
      {/* 3. Vessels: Berthed Alongside & Approaching Fairway Track */}
      {/* ============================================================ */}
      {layers.vessels && (
        <>
          {/* Berthed Container Vessels at occupied berths */}
          {berthedCalls.map((call, idx) => {
            // Place at berth position (Berths 2, 3, 5, etc.)
            const berthIdx = [1, 2, 4, 0, 3, 5][idx % 6];
            const posX = berthPositions[berthIdx];
            const isSelected =
              selectedEntity?.type === "vessel" && selectedEntity.id === call.id;

            return (
              <ProceduralVessel3D
                key={call.id}
                position={[posX, 0, -6.4]}
                rotation={[0, 0, 0]}
                scale={0.95}
                call={call}
                isSelected={isSelected}
                onSelect={() =>
                  onSelectEntity({ type: "vessel", id: call.id, data: call })
                }
                isSimulating={isSimulating}
              />
            );
          })}

          {/* Approaching Container Vessel on Channel Track */}
          {approachingCall && (
            <group ref={approachingVesselRef} position={[-25, 0, -22]}>
              <ProceduralVessel3D
                position={[0, 0, 0]}
                rotation={[0, Math.PI / 1.95, 0]}
                scale={0.9}
                call={approachingCall}
                isSelected={
                  selectedEntity?.type === "vessel" &&
                  selectedEntity.id === approachingCall.id
                }
                onSelect={() =>
                  onSelectEntity({
                    type: "vessel",
                    id: approachingCall.id,
                    data: approachingCall,
                  })
                }
                isSimulating={isSimulating}
              />
            </group>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/* 4. STS Container Cranes along Quay Rail */}
      {/* ============================================================ */}
      {layers.cranes &&
        equipment.slice(0, 6).map((crane, idx) => {
          const posX = berthPositions[idx] + 2.0;
          const isSelected =
            selectedEntity?.type === "crane" && selectedEntity.id === crane.id;

          return (
            <STSCrane3D
              key={crane.id}
              position={[posX, 0.2, -2.2]}
              rotation={[0, 0, 0]}
              scale={0.95}
              crane={crane}
              isSelected={isSelected}
              onSelect={() =>
                onSelectEntity({ type: "crane", id: crane.id, data: crane })
              }
              isSimulating={isSimulating}
            />
          );
        })}

      {/* ============================================================ */}
      {/* 5. Yard Blocks: 12 Storage Blocks in 2 Rows */}
      {/* ============================================================ */}
      {layers.yardBlocks &&
        yardBlocks.slice(0, 12).map((block, idx) => {
          const isRow2 = idx >= 6;
          const colIdx = idx % 6;
          const posX = (colIdx - 2.5) * 12.0;
          const posZ = isRow2 ? 24 : 10;
          const isSelected =
            selectedEntity?.type === "yard" && selectedEntity.id === block.id;

          return (
            <YardBlock3D
              key={block.id}
              position={[posX, 0, posZ]}
              block={block}
              isSelected={isSelected}
              onSelect={() =>
                onSelectEntity({ type: "yard", id: block.id, data: block })
              }
            />
          );
        })}

      {/* ============================================================ */}
      {/* 6. Internal Haulage Roads & Landside Terminal Gate */}
      {/* ============================================================ */}
      {/* Internal Circulation Lane 1 (Between Quay and Yard Row 1) */}
      <mesh position={[0, 0.01, 3.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[110, 3.8]} />
        <meshStandardMaterial color="#1e293b" roughness={0.8} />
      </mesh>

      {/* Internal Circulation Lane 2 (Between Yard Row 1 and Yard Row 2) */}
      <mesh position={[0, 0.01, 17]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[110, 3.8]} />
        <meshStandardMaterial color="#1e293b" roughness={0.8} />
      </mesh>

      {/* Landside Gate / Security Barrier Canopy at Z = 34 */}
      <group position={[0, 0, 34]}>
        {/* Gate Canopy Roof */}
        <mesh position={[0, 3.2, 0]}>
          <boxGeometry args={[16, 0.3, 3]} />
          <meshStandardMaterial color="#1e4967" roughness={0.4} />
        </mesh>
        {/* Canopy Support Columns */}
        {[-7, -2.5, 2.5, 7].map((colX, i) => (
          <mesh key={i} position={[colX, 1.5, 0]}>
            <cylinderGeometry args={[0.15, 0.15, 3, 10]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.7} />
          </mesh>
        ))}
      </group>
    </>
  );
}

