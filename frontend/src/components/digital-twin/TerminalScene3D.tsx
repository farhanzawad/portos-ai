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
  const truck1Ref = useRef<THREE.Group>(null);
  const truck2Ref = useRef<THREE.Group>(null);
  const buoyGreenRef = useRef<THREE.Mesh>(null);
  const buoyRedRef = useRef<THREE.Mesh>(null);
  const waterRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

  // Reset Camera action handler
  useEffect(() => {
    if (resetCameraSignal > 0 && controlsRef.current) {
      camera.position.set(38, 40, 44);
      controlsRef.current.target.set(0, 0, 5);
      controlsRef.current.update();
    }
  }, [resetCameraSignal, camera]);

  // Frame animations: water shimmer, approaching vessel, haulage trucks, and navigation buoys
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // 1. Water subtle wave shimmer
    if (waterRef.current) {
      const mat = waterRef.current.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.roughness = 0.22 + Math.sin(t * 0.8) * 0.04;
      }
    }

    // 2. Animate approaching vessel along Karnaphuli river channel during simulation
    if (approachingVesselRef.current && isSimulating) {
      const cycleTime = t * 0.22 * simulationSpeed;
      const newX = -46 + ((cycleTime * 5.5) % 65);
      approachingVesselRef.current.position.x = newX;
      // Slight heading deviation in the river bend
      approachingVesselRef.current.rotation.y = Math.PI / 1.96 + Math.sin(t * 0.4) * 0.02;
    }

    // 3. Animate Internal Terminal Haulage Trucks along circulation lanes
    if (truck1Ref.current && isSimulating) {
      const truckSpeed = t * 3.5 * simulationSpeed;
      const truck1X = -40 + ((truckSpeed) % 80);
      truck1Ref.current.position.x = truck1X;
    }
    if (truck2Ref.current && isSimulating) {
      const truckSpeed2 = t * 2.8 * simulationSpeed;
      const truck2X = 35 - ((truckSpeed2) % 75);
      truck2Ref.current.position.x = truck2X;
    }

    // 4. Rhythmic flashing of Channel Lateral Buoys
    const flashGreen = Math.sin(t * 3.0) > 0.4;
    const flashRed = Math.sin((t + 0.8) * 3.0) > 0.4;
    if (buoyGreenRef.current) {
      (buoyGreenRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = flashGreen ? 1.4 : 0.1;
    }
    if (buoyRedRef.current) {
      (buoyRedRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = flashRed ? 1.4 : 0.1;
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
      {/* ============================================================ */}
      {/* 1. PROFESSIONAL MARITIME LIGHTING RIG                        */}
      {/* ============================================================ */}
      <ambientLight intensity={0.65} color="#e0f2fe" />
      {/* Warm Marine Daylight Sun */}
      <directionalLight
        position={[42, 58, 38]}
        intensity={1.35}
        color="#fffbeb"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={10}
        shadow-camera-far={140}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
      />
      {/* Cool Sky Fill Light (reflecting river water) */}
      <directionalLight
        position={[-35, 30, -30]}
        intensity={0.45}
        color="#38bdf8"
      />
      {/* Atmospheric Fog for Depth */}
      <fog attach="fog" args={["#0c1926", 45, 135]} />

      {/* Orbit Controls with Natural Angle Clamping */}
      <OrbitControls
        ref={controlsRef}
        makeDefault
        minDistance={16}
        maxDistance={115}
        maxPolarAngle={Math.PI / 2.12}
        minPolarAngle={Math.PI / 8.5}
        enableDamping
        dampingFactor={0.06}
      />

      {/* ============================================================ */}
      {/* 2. KARNAPHULI RIVER FAIRWAY & TERMINAL APRON SURFACE        */}
      {/* ============================================================ */}

      {/* Karnaphuli Navigation Channel Water */}
      <mesh
        ref={waterRef}
        position={[0, -0.06, -30]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[140, 52, 24, 24]} />
        <meshStandardMaterial
          color="#0a2239"
          roughness={0.22}
          metalness={0.45}
        />
      </mesh>

      {/* Terminal Land Surface (Heavy Concrete / Asphalt Yard) */}
      <mesh position={[0, -0.05, 18]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[130, 44]} />
        <meshStandardMaterial color="#0b1322" roughness={0.85} metalness={0.1} />
      </mesh>

      {/* Fairway Channel Lateral Marker Buoys */}
      {/* Green Lateral Buoy (Port hand entering Karnaphuli channel) */}
      <group position={[-26, 0.45, -34]}>
        <mesh>
          <cylinderGeometry args={[0.22, 0.38, 0.9, 12]} />
          <meshStandardMaterial color="#059669" roughness={0.4} />
        </mesh>
        <mesh ref={buoyGreenRef} position={[0, 0.58, 0]}>
          <sphereGeometry args={[0.1, 10, 8]} />
          <meshStandardMaterial
            color="#10b981"
            emissive="#10b981"
            emissiveIntensity={1.0}
            roughness={0.2}
          />
        </mesh>
      </group>

      {/* Red Lateral Buoy (Starboard hand entering channel) */}
      <group position={[26, 0.45, -34]}>
        <mesh>
          <coneGeometry args={[0.38, 0.9, 12]} />
          <meshStandardMaterial color="#dc2626" roughness={0.4} />
        </mesh>
        <mesh ref={buoyRedRef} position={[0, 0.58, 0]}>
          <sphereGeometry args={[0.1, 10, 8]} />
          <meshStandardMaterial
            color="#ef4444"
            emissive="#ef4444"
            emissiveIntensity={1.0}
            roughness={0.2}
          />
        </mesh>
      </group>

      {/* High-Mast Floodlight Towers (Yard & Quay Illumination) */}
      {[
        [-46, 17],
        [46, 17],
        [-46, 3],
        [46, 3],
      ].map(([tx, tz], i) => (
        <group key={i} position={[tx, 0, tz]}>
          {/* Base */}
          <mesh position={[0, 0.25, 0]}>
            <cylinderGeometry args={[0.3, 0.4, 0.5, 8]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
          {/* Tower Pole */}
          <mesh position={[0, 4.8, 0]}>
            <cylinderGeometry args={[0.1, 0.18, 9.6, 8]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.8} />
          </mesh>
          {/* Light Cross-arm Head */}
          <mesh position={[0, 9.6, 0]}>
            <boxGeometry args={[1.4, 0.15, 0.5]} />
            <meshStandardMaterial color="#e2e8f0" />
          </mesh>
          {/* LED Spot Emitters */}
          {[-0.5, 0, 0.5].map((lx, li) => (
            <mesh key={li} position={[lx, 9.5, 0]}>
              <sphereGeometry args={[0.08, 8, 6]} />
              <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={0.8} />
            </mesh>
          ))}
        </group>
      ))}

      {/* ============================================================ */}
      {/* 3. BERTH ZONES (6 Demarcated Berths along Quay)              */}
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
      {/* 4. CONTAINER VESSELS (Berthed Alongside & Approaching)       */}
      {/* ============================================================ */}
      {layers.vessels && (
        <>
          {/* Berthed Container Vessels at Quayside */}
          {berthedCalls.map((call, idx) => {
            const berthIdx = [1, 2, 4, 0, 3, 5][idx % 6];
            const posX = berthPositions[berthIdx];
            const isSelected =
              selectedEntity?.type === "vessel" && selectedEntity.id === call.id;

            return (
              <ProceduralVessel3D
                key={call.id}
                position={[posX, 0, -6.6]}
                rotation={[0, 0, 0]}
                scale={0.96}
                call={call}
                isSelected={isSelected}
                onSelect={() =>
                  onSelectEntity({ type: "vessel", id: call.id, data: call })
                }
                isSimulating={isSimulating}
                isBerthed={true}
              />
            );
          })}

          {/* Approaching Feeder Vessel on Karnaphuli Fairway Track */}
          {approachingCall && (
            <group ref={approachingVesselRef} position={[-25, 0, -22]}>
              <ProceduralVessel3D
                position={[0, 0, 0]}
                rotation={[0, Math.PI / 1.95, 0]}
                scale={0.92}
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
                isBerthed={false}
              />
            </group>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/* 5. SHIP-TO-SHORE (STS) QUAYSIDE CONTAINER CRANES             */}
      {/* ============================================================ */}
      {layers.cranes &&
        equipment.slice(0, 6).map((crane, idx) => {
          const posX = berthPositions[idx] + 2.0;
          const isSelected =
            selectedEntity?.type === "crane" && selectedEntity.id === crane.id;

          return (
            <STSCrane3D
              key={crane.id}
              position={[posX, 0.2, -2.1]}
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
      {/* 6. STORAGE YARD BLOCKS & RTG CRANES                          */}
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
      {/* 7. INTERNAL HAULAGE ROADS & DYNAMIC TRUCKS                   */}
      {/* ============================================================ */}
      {/* Circulation Corridor 1 (Quayside Apron to Yard Row 1) */}
      <mesh position={[0, 0.015, 3.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[112, 3.8]} />
        <meshStandardMaterial color="#1a2333" roughness={0.7} />
      </mesh>
      {/* Yellow Centerline Stripes on Lane 1 */}
      {[-45, -30, -15, 0, 15, 30, 45].map((lx, li) => (
        <mesh key={li} position={[lx, 0.02, 3.5]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[6, 0.15]} />
          <meshBasicMaterial color="#eab308" />
        </mesh>
      ))}

      {/* Circulation Corridor 2 (Between Yard Rows 1 & 2) */}
      <mesh position={[0, 0.015, 17]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[112, 3.8]} />
        <meshStandardMaterial color="#1a2333" roughness={0.7} />
      </mesh>
      {/* Centerline Stripes on Lane 2 */}
      {[-45, -30, -15, 0, 15, 30, 45].map((lx, li) => (
        <mesh key={li} position={[lx, 0.02, 17]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[6, 0.15]} />
          <meshBasicMaterial color="#eab308" />
        </mesh>
      ))}

      {/* Dynamic Terminal Tractor Unit 1 (Moving on Lane 1 during simulation) */}
      <group ref={truck1Ref} position={[-20, 0.02, 3.5]}>
        {/* Tractor Cab (Safety Orange / White) */}
        <mesh position={[1.4, 0.75, 0]}>
          <boxGeometry args={[1.0, 1.1, 0.9]} />
          <meshStandardMaterial color="#ea580c" roughness={0.4} />
        </mesh>
        {/* Cab Windshield */}
        <mesh position={[1.85, 0.95, 0]}>
          <boxGeometry args={[0.08, 0.45, 0.75]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.1} />
        </mesh>
        {/* Chassis Trailer Flatbed */}
        <mesh position={[-0.8, 0.4, 0]}>
          <boxGeometry args={[3.6, 0.15, 0.9]} />
          <meshStandardMaterial color="#334155" metalness={0.6} />
        </mesh>
        {/* 40ft Maersk Container on Flatbed */}
        <mesh position={[-0.8, 0.95, 0]}>
          <boxGeometry args={[3.2, 0.95, 0.88]} />
          <meshStandardMaterial color="#0284c7" roughness={0.5} />
        </mesh>
        {/* Wheels */}
        {[-2.2, 0.6, 1.4].map((wx, wi) => (
          <mesh key={wi} position={[wx, 0.28, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.22, 0.22, 1.0, 12]} />
            <meshStandardMaterial color="#0f172a" roughness={0.9} />
          </mesh>
        ))}
      </group>

      {/* Dynamic Terminal Tractor Unit 2 (Moving on Lane 2 during simulation) */}
      <group ref={truck2Ref} position={[15, 0.02, 17]} rotation={[0, Math.PI, 0]}>
        {/* Tractor Cab */}
        <mesh position={[1.4, 0.75, 0]}>
          <boxGeometry args={[1.0, 1.1, 0.9]} />
          <meshStandardMaterial color="#eab308" roughness={0.4} />
        </mesh>
        <mesh position={[1.85, 0.95, 0]}>
          <boxGeometry args={[0.08, 0.45, 0.75]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.1} />
        </mesh>
        {/* Chassis Flatbed */}
        <mesh position={[-0.8, 0.4, 0]}>
          <boxGeometry args={[3.6, 0.15, 0.9]} />
          <meshStandardMaterial color="#334155" metalness={0.6} />
        </mesh>
        {/* 40ft Evergreen Container on Flatbed */}
        <mesh position={[-0.8, 0.95, 0]}>
          <boxGeometry args={[3.2, 0.95, 0.88]} />
          <meshStandardMaterial color="#047857" roughness={0.5} />
        </mesh>
      </group>

      {/* ============================================================ */}
      {/* 8. LANDSIDE GATE CANOPY & INSPECTION LANES                   */}
      {/* ============================================================ */}
      <group position={[0, 0, 34]}>
        {/* Modern Industrial Canopy Roof */}
        <mesh position={[0, 3.4, 0]}>
          <boxGeometry args={[20, 0.35, 3.6]} />
          <meshStandardMaterial color="#1e4967" roughness={0.3} metalness={0.2} />
        </mesh>
        {/* Canopy Under-Light Panel */}
        <mesh position={[0, 3.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[19.6, 3.2]} />
          <meshStandardMaterial color="#f8fafc" emissive="#f8fafc" emissiveIntensity={0.3} />
        </mesh>
        {/* Steel Support Columns */}
        {[-8.5, -3.0, 3.0, 8.5].map((colX, i) => (
          <group key={i} position={[colX, 1.6, 0]}>
            <mesh>
              <cylinderGeometry args={[0.18, 0.18, 3.2, 12]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.8} />
            </mesh>
            {/* Bollard Base */}
            <mesh position={[0, -1.4, 0]}>
              <cylinderGeometry args={[0.26, 0.26, 0.4, 12]} />
              <meshStandardMaterial color="#eab308" roughness={0.4} />
            </mesh>
          </group>
        ))}
      </group>
    </>
  );
}
