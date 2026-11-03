"use client";

import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { SelectedEntity, LayerVisibility, CameraPreset } from "./types";
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
  cameraPreset?: CameraPreset;
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
  cameraPreset = "isometric",
}: TerminalScene3DProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const approachingVesselRef = useRef<THREE.Group>(null);
  const tankerVesselRef = useRef<THREE.Group>(null);
  const truck1Ref = useRef<THREE.Group>(null);
  const truck2Ref = useRef<THREE.Group>(null);
  const truck3Ref = useRef<THREE.Group>(null);
  const radarRef = useRef<THREE.Mesh>(null);
  const buoyGreenRef = useRef<THREE.Mesh>(null);
  const buoyRedRef = useRef<THREE.Mesh>(null);
  const waterRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

  // Camera Presets handler
  useEffect(() => {
    if (!controlsRef.current) return;
    if (cameraPreset === "topdown") {
      camera.position.set(0, 95, 14);
      controlsRef.current.target.set(0, 0, 14);
    } else if (cameraPreset === "operational") {
      camera.position.set(-26, 12, 12);
      controlsRef.current.target.set(0, 4, -4);
    } else {
      // Default Isometric
      camera.position.set(42, 45, 48);
      controlsRef.current.target.set(0, 0, 8);
    }
    controlsRef.current.update();
  }, [cameraPreset, camera]);

  // Reset Camera action handler
  useEffect(() => {
    if (resetCameraSignal > 0 && controlsRef.current) {
      camera.position.set(42, 45, 48);
      controlsRef.current.target.set(0, 0, 8);
      controlsRef.current.update();
    }
  }, [resetCameraSignal, camera]);

  // Focus on Selected Entity
  useEffect(() => {
    if (!selectedEntity || !controlsRef.current) return;

    if (selectedEntity.type === "berth") {
      controlsRef.current.target.set(-10, 0, -3);
      controlsRef.current.update();
    } else if (selectedEntity.type === "yard") {
      controlsRef.current.target.set(0, 2, 16);
      controlsRef.current.update();
    } else if (selectedEntity.type === "facility") {
      controlsRef.current.target.set(-20, 2, 32);
      controlsRef.current.update();
    }
  }, [selectedEntity]);

  // Frame animations: water shimmer, radar antenna rotation, approaching vessel, haulage trucks
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // 1. Water subtle wave shimmer
    if (waterRef.current) {
      const mat = waterRef.current.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.roughness = 0.22 + Math.sin(t * 0.8) * 0.04;
      }
    }

    // 2. Control Tower Radar Antenna Rotation
    if (radarRef.current) {
      radarRef.current.rotation.y = t * 2.2;
    }

    // 3. Animate approaching vessel along Karnaphuli channel
    if (approachingVesselRef.current && isSimulating) {
      const cycleTime = t * 0.22 * simulationSpeed;
      const newX = -52 + ((cycleTime * 5.5) % 85);
      approachingVesselRef.current.position.x = newX;
      approachingVesselRef.current.rotation.y = Math.PI / 1.96 + Math.sin(t * 0.4) * 0.02;
    }

    // 4. Animate Internal Terminal Haulage Trucks along circulation lanes
    if (truck1Ref.current && isSimulating) {
      const truckSpeed = t * 3.5 * simulationSpeed;
      const truck1X = -46 + (truckSpeed % 92);
      truck1Ref.current.position.x = truck1X;
    }
    if (truck2Ref.current && isSimulating) {
      const truckSpeed2 = t * 2.8 * simulationSpeed;
      const truck2X = 42 - (truckSpeed2 % 88);
      truck2Ref.current.position.x = truck2X;
    }
    if (truck3Ref.current && isSimulating) {
      const truckSpeed3 = t * 3.1 * simulationSpeed;
      const truck3X = -35 + (truckSpeed3 % 75);
      truck3Ref.current.position.x = truck3X;
    }

    // 5. Rhythmic flashing of Channel Lateral Buoys
    const flashGreen = Math.sin(t * 3.0) > 0.4;
    const flashRed = Math.sin((t + 0.8) * 3.0) > 0.4;
    if (buoyGreenRef.current) {
      (buoyGreenRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = flashGreen ? 1.4 : 0.1;
    }
    if (buoyRedRef.current) {
      (buoyRedRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = flashRed ? 1.4 : 0.1;
    }
  });

  const berthedCalls = vesselCalls.filter((c) => c.status === "BERTHED");
  const queueCalls = vesselCalls.filter((c) => c.status !== "BERTHED");
  const approachingCall = queueCalls[0];

  // RSGT PCT Layout: 580m continuous quay with Berths 1, 2, 3 + Berth 4 Tanker
  // X positions along quay edge (Z = -2.8):
  const berthPositions = [-34, -18, -2, 14, 30, 48];

  // Specific PCT 12 Stacking Blocks designations matching masterplan Drawing No. PCT-MP-001
  const pctBlockDesignations = [
    { code: "C01", name: "Block C01 (Import)", category: "IMPORT" },
    { code: "C02", name: "Block C02 (Import)", category: "IMPORT" },
    { code: "C03", name: "Block C03 (Export)", category: "EXPORT" },
    { code: "C04", name: "Block C04 (Export)", category: "EXPORT" },
    { code: "C05", name: "Block C05 (Transshipment)", category: "TRANSSHIPMENT" },
    { code: "C06", name: "Block C06 (Empty)", category: "EMPTY" },
    { code: "C07", name: "Block C07 (Import)", category: "IMPORT" },
    { code: "C08", name: "Block C08 (Export)", category: "EXPORT" },
    { code: "C09", name: "Block C09 (Export)", category: "EXPORT" },
    { code: "C10", name: "Block C10 (Empty)", category: "EMPTY" },
    { code: "C11", name: "Block C11 (Reefer)", category: "REEFER" },
    { code: "C12", name: "Block C12 (Hazardous IMO)", category: "HAZARDOUS_IMO" },
  ];

  return (
    <>
      {/* ============================================================ */}
      {/* 1. PROFESSIONAL MARITIME LIGHTING RIG                        */}
      {/* ============================================================ */}
      <ambientLight intensity={0.68} color="#e0f2fe" />
      <directionalLight
        position={[45, 62, 40]}
        intensity={1.4}
        color="#fffbeb"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={10}
        shadow-camera-far={160}
        shadow-camera-left={-75}
        shadow-camera-right={75}
        shadow-camera-top={75}
        shadow-camera-bottom={-75}
      />
      <directionalLight position={[-40, 32, -35]} intensity={0.45} color="#38bdf8" />
      <fog attach="fog" args={["#0c1926", 50, 155]} />

      <OrbitControls
        ref={controlsRef}
        makeDefault
        minDistance={14}
        maxDistance={135}
        maxPolarAngle={Math.PI / 2.08}
        minPolarAngle={Math.PI / 8.5}
        enableDamping
        dampingFactor={0.06}
      />

      {/* ============================================================ */}
      {/* 2. KARNAPHULI RIVER FAIRWAY, BASIN & BREAKWATERS             */}
      {/* ============================================================ */}
      {/* River Water Surface */}
      <mesh ref={waterRef} position={[0, -0.06, -34]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[165, 60, 32, 32]} />
        <meshStandardMaterial color="#0a2239" roughness={0.22} metalness={0.45} />
      </mesh>

      {/* 600m Turning Basin Boundary Ring (Depth -11m) */}
      <group position={[0, -0.04, -28]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[17.5, 18.2, 48]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.35} />
      </group>

      {/* West Breakwater (~1,200m Rock Armor Revetment) */}
      <group position={[-58, 0.4, -14]} rotation={[0, -Math.PI / 5.2, 0]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[26, 1.2, 3.2]} />
          <meshStandardMaterial color="#475569" roughness={0.9} />
        </mesh>
        {/* Stone Crest Top */}
        <mesh position={[0, 0.7, 0]}>
          <boxGeometry args={[25.5, 0.4, 2.2]} />
          <meshStandardMaterial color="#64748b" roughness={0.95} />
        </mesh>
      </group>

      {/* East Breakwater (~1,000m Rock Armor) */}
      <group position={[56, 0.4, -22]} rotation={[0, Math.PI / 4.8, 0]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[22, 1.2, 3.0]} />
          <meshStandardMaterial color="#475569" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.7, 0]}>
          <boxGeometry args={[21.5, 0.4, 2.0]} />
          <meshStandardMaterial color="#64748b" roughness={0.95} />
        </mesh>
      </group>

      {/* Terminal Land Surface (Reinforced Yard Concrete) */}
      <mesh position={[0, -0.05, 20]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[145, 48]} />
        <meshStandardMaterial color="#0b1322" roughness={0.85} metalness={0.1} />
      </mesh>

      {/* Fairway Channel Lateral Marker Buoys */}
      <group position={[-32, 0.45, -38]}>
        <mesh>
          <cylinderGeometry args={[0.22, 0.38, 0.9, 12]} />
          <meshStandardMaterial color="#059669" roughness={0.4} />
        </mesh>
        <mesh ref={buoyGreenRef} position={[0, 0.58, 0]}>
          <sphereGeometry args={[0.1, 10, 8]} />
          <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={1.0} />
        </mesh>
      </group>

      <group position={[32, 0.45, -38]}>
        <mesh>
          <coneGeometry args={[0.38, 0.9, 12]} />
          <meshStandardMaterial color="#dc2626" roughness={0.4} />
        </mesh>
        <mesh ref={buoyRedRef} position={[0, 0.58, 0]}>
          <sphereGeometry args={[0.1, 10, 8]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1.0} />
        </mesh>
      </group>

      {/* ============================================================ */}
      {/* 3. CONTINUOUS QUAY WALL (580m Berths 1-3 + Berth 4 Tanker)    */}
      {/* ============================================================ */}
      {/* Concrete Quay Apron Slab (Width ~45m) */}
      <mesh position={[0, 0.08, -1.8]}>
        <boxGeometry args={[116, 0.28, 4.2]} />
        <meshStandardMaterial color="#1e293b" roughness={0.7} metalness={0.2} />
      </mesh>

      {/* Quay Crane Rail Tracks (Dual continuous steel rails) */}
      {[-3.6, -0.6].map((rz, ri) => (
        <mesh key={ri} position={[0, 0.23, rz]}>
          <boxGeometry args={[116, 0.04, 0.12]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}

      {/* Rubber Arch Fenders & Bollards along Quayside Frontage */}
      {Array.from({ length: 24 }).map((_, fi) => {
        const fx = -54 + fi * 4.8;
        return (
          <group key={fi} position={[fx, 0, -4.0]}>
            {/* Rubber Fender on Face */}
            <mesh position={[0, -0.15, 0]}>
              <boxGeometry args={[0.8, 0.45, 0.35]} />
              <meshStandardMaterial color="#020617" roughness={0.9} />
            </mesh>
            {/* Mooring Bollard on Coping */}
            <mesh position={[0, 0.28, 0.2]}>
              <cylinderGeometry args={[0.14, 0.16, 0.32, 10]} />
              <meshStandardMaterial color="#eab308" roughness={0.4} />
            </mesh>
          </group>
        );
      })}

      {/* Berth 4: Oil/Tanker Service Jetty (~150m at X = 50, Z = -5) */}
      <group position={[50, 0.1, -5.2]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[16, 0.3, 3.6]} />
          <meshStandardMaterial color="#334155" roughness={0.8} />
        </mesh>
        {/* Product/Fuel Pipeline Racks extending towards storage tanks */}
        {[-0.8, 0, 0.8].map((pz, pi) => (
          <mesh key={pi} position={[-0.5, 0.3, pz]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.08, 0.08, 15, 8]} />
            <meshStandardMaterial color="#0284c7" metalness={0.8} />
          </mesh>
        ))}
      </group>

      {/* Tug / Workboat Jetty (between Berth 3 & 4) */}
      <group position={[40, 0.06, -5.0]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[3.2, 0.25, 2.8]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
      </group>

      {/* High-Mast Yard Floodlight Towers */}
      {[
        [-52, 16],
        [-18, 16],
        [18, 16],
        [52, 16],
        [-52, 2],
        [52, 2],
      ].map(([tx, tz], i) => (
        <group key={i} position={[tx, 0, tz]}>
          <mesh position={[0, 0.25, 0]}>
            <cylinderGeometry args={[0.3, 0.4, 0.5, 8]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
          <mesh position={[0, 5.2, 0]}>
            <cylinderGeometry args={[0.1, 0.18, 10.4, 8]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.8} />
          </mesh>
          <mesh position={[0, 10.4, 0]}>
            <boxGeometry args={[1.6, 0.15, 0.5]} />
            <meshStandardMaterial color="#e2e8f0" />
          </mesh>
          {[-0.6, 0, 0.6].map((lx, li) => (
            <mesh key={li} position={[lx, 10.3, 0]}>
              <sphereGeometry args={[0.08, 8, 6]} />
              <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={0.8} />
            </mesh>
          ))}
        </group>
      ))}

      {/* ============================================================ */}
      {/* 4. BERTH ZONES (Demarcated Berths along Quay)                 */}
      {/* ============================================================ */}
      {layers.berths &&
        berths.slice(0, 6).map((berth, index) => {
          const posX = berthPositions[index];
          const isSelected = selectedEntity?.type === "berth" && selectedEntity.id === berth.id;

          return (
            <BerthZone3D
              key={berth.id}
              position={[posX, 0, -2.8]}
              length={14.8}
              berth={berth}
              isSelected={isSelected}
              onSelect={() => onSelectEntity({ type: "berth", id: berth.id, data: berth })}
            />
          );
        })}

      {/* ============================================================ */}
      {/* 5. CONTAINER VESSELS (Berthed Along Continuous Quay)         */}
      {/* ============================================================ */}
      {layers.vessels && (
        <>
          {berthedCalls.map((call, idx) => {
            const berthIdx = [0, 1, 3, 2, 4][idx % 5];
            const posX = berthPositions[berthIdx];
            const isSelected = selectedEntity?.type === "vessel" && selectedEntity.id === call.id;

            return (
              <ProceduralVessel3D
                key={call.id}
                position={[posX, 0, -6.8]}
                rotation={[0, 0, 0]}
                scale={0.96}
                call={call}
                isSelected={isSelected}
                onSelect={() => onSelectEntity({ type: "vessel", id: call.id, data: call })}
                isSimulating={isSimulating}
                isBerthed={true}
              />
            );
          })}

          {/* Approaching Feeder Vessel in River Channel */}
          {approachingCall && (
            <group ref={approachingVesselRef} position={[-25, 0, -24]}>
              <ProceduralVessel3D
                position={[0, 0, 0]}
                rotation={[0, Math.PI / 1.95, 0]}
                scale={0.92}
                call={approachingCall}
                isSelected={selectedEntity?.type === "vessel" && selectedEntity.id === approachingCall.id}
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
      {/* 6. SHIP-TO-SHORE (STS) GANTRY CRANES (30-35m Spacing)        */}
      {/* ============================================================ */}
      {layers.cranes &&
        equipment.slice(0, 6).map((crane, idx) => {
          const posX = berthPositions[idx] + 2.2;
          const isSelected = selectedEntity?.type === "crane" && selectedEntity.id === crane.id;

          return (
            <STSCrane3D
              key={crane.id}
              position={[posX, 0.2, -2.1]}
              rotation={[0, 0, 0]}
              scale={0.96}
              crane={crane}
              isSelected={isSelected}
              onSelect={() => onSelectEntity({ type: "crane", id: crane.id, data: crane })}
              isSimulating={isSimulating}
            />
          );
        })}

      {/* ============================================================ */}
      {/* 7. 12 CONTAINER YARD STACKING BLOCKS (C01 - C12)             */}
      {/* ============================================================ */}
      {layers.yardBlocks &&
        pctBlockDesignations.map((designation, idx) => {
          const isRow2 = idx >= 6;
          const colIdx = idx % 6;
          // 6 blocks per row spaced across terminal
          const posX = (colIdx - 2.5) * 13.5;
          const posZ = isRow2 ? 23.5 : 9.5;

          const blockData = yardBlocks[idx] || {
            id: `pct-block-${designation.code.toLowerCase()}`,
            code: designation.code,
            name: designation.name,
            terminal_id: "pct-terminal",
            zone: designation.category as any,
            max_capacity_teu: 720,
            current_occupancy_teu: 450,
            utilization_rate: 0.62,
            data_status: "CONCEPTUAL" as any,
            source_name: "RSGT PCT Masterplan PCT-MP-001",
          };

          const isSelected = selectedEntity?.type === "yard" && selectedEntity.id === blockData.id;

          return (
            <YardBlock3D
              key={designation.code}
              position={[posX, 0, posZ]}
              block={blockData as any}
              isSelected={isSelected}
              onSelect={() => onSelectEntity({ type: "yard", id: blockData.id, data: blockData as any })}
            />
          );
        })}

      {/* ============================================================ */}
      {/* 8. INTERNAL TERMINAL ROADS & HAULAGE TRUCKS (One-Way Loop)   */}
      {/* ============================================================ */}
      {/* Circulation Lane 1 (Quayside Apron to Yard Row 1) */}
      <mesh position={[0, 0.015, 3.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[128, 4.0]} />
        <meshStandardMaterial color="#1a2333" roughness={0.7} />
      </mesh>
      {[-50, -35, -20, -5, 10, 25, 40].map((lx, li) => (
        <mesh key={li} position={[lx, 0.02, 3.5]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[6, 0.15]} />
          <meshBasicMaterial color="#eab308" />
        </mesh>
      ))}

      {/* Circulation Lane 2 (Between Yard Rows 1 & 2) */}
      <mesh position={[0, 0.015, 16.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[128, 4.0]} />
        <meshStandardMaterial color="#1a2333" roughness={0.7} />
      </mesh>
      {[-50, -35, -20, -5, 10, 25, 40].map((lx, li) => (
        <mesh key={li} position={[lx, 0.02, 16.5]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[6, 0.15]} />
          <meshBasicMaterial color="#eab308" />
        </mesh>
      ))}

      {/* Dynamic Terminal Tractor 1 */}
      <group ref={truck1Ref} position={[-25, 0.02, 3.5]}>
        <mesh position={[1.4, 0.75, 0]}>
          <boxGeometry args={[1.0, 1.1, 0.9]} />
          <meshStandardMaterial color="#ea580c" roughness={0.4} />
        </mesh>
        <mesh position={[-0.8, 0.95, 0]}>
          <boxGeometry args={[3.2, 0.95, 0.88]} />
          <meshStandardMaterial color="#0284c7" roughness={0.5} />
        </mesh>
      </group>

      {/* Dynamic Terminal Tractor 2 */}
      <group ref={truck2Ref} position={[20, 0.02, 16.5]} rotation={[0, Math.PI, 0]}>
        <mesh position={[1.4, 0.75, 0]}>
          <boxGeometry args={[1.0, 1.1, 0.9]} />
          <meshStandardMaterial color="#eab308" roughness={0.4} />
        </mesh>
        <mesh position={[-0.8, 0.95, 0]}>
          <boxGeometry args={[3.2, 0.95, 0.88]} />
          <meshStandardMaterial color="#047857" roughness={0.5} />
        </mesh>
      </group>

      {/* ============================================================ */}
      {/* 9. PCT MASTERPLAN OPERATIONAL FACILITIES & BUILDINGS          */}
      {/* ============================================================ */}
      {/* Control Tower: 6-storey shaft + elevated octagonal observation cabin */}
      <group
        position={[-26, 0, 31]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectEntity({
            type: "facility",
            id: "pct-control-tower",
            data: { name: "PCT Port Operations Control Tower", status: "OPERATIONAL" },
          });
        }}
      >
        {/* Tower Concrete Shaft */}
        <mesh position={[0, 4.0, 0]}>
          <boxGeometry args={[2.4, 8.0, 2.4]} />
          <meshStandardMaterial color="#334155" roughness={0.8} />
        </mesh>
        {/* Octagonal Glass Observation Cabin */}
        <mesh position={[0, 8.8, 0]}>
          <cylinderGeometry args={[2.0, 1.6, 1.8, 8]} />
          <meshStandardMaterial color="#0284c7" roughness={0.1} metalness={0.9} transparent opacity={0.85} />
        </mesh>
        {/* Tower Roof Slab */}
        <mesh position={[0, 9.8, 0]}>
          <cylinderGeometry args={[2.2, 2.2, 0.25, 8]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        {/* Rotating Radar Scanner */}
        <mesh ref={radarRef} position={[0, 10.3, 0]}>
          <boxGeometry args={[1.4, 0.15, 0.2]} />
          <meshStandardMaterial color="#f8fafc" />
        </mesh>
      </group>

      {/* Administration Building (3-storey modern office with glass curtain wall) */}
      <group position={[-42, 0, 31]}>
        <mesh position={[0, 2.5, 0]}>
          <boxGeometry args={[8.5, 5.0, 5.5]} />
          <meshStandardMaterial color="#1e293b" roughness={0.5} />
        </mesh>
        {/* Entrance Canopy */}
        <mesh position={[0, 1.2, 2.9]}>
          <boxGeometry args={[3.2, 0.2, 1.2]} />
          <meshStandardMaterial color="#16a394" />
        </mesh>
        {/* Staff Parking Area */}
        <mesh position={[0, 0.02, 6.2]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[8.5, 3.2]} />
          <meshStandardMaterial color="#334155" roughness={0.9} />
        </mesh>
      </group>

      {/* Marine & Berth Operations Office */}
      <group position={[-16, 0, 31]}>
        <mesh position={[0, 1.8, 0]}>
          <boxGeometry args={[6.5, 3.6, 4.5]} />
          <meshStandardMaterial color="#334155" roughness={0.6} />
        </mesh>
      </group>

      {/* Customs & Port Security + First Aid Clinic */}
      <group position={[-6, 0, 31]}>
        <mesh position={[0, 1.8, 0]}>
          <boxGeometry args={[8.0, 3.6, 4.5]} />
          <meshStandardMaterial color="#334155" roughness={0.6} />
        </mesh>
      </group>

      {/* Fire Station with 2 Appliance Bays */}
      <group position={[6, 0, 31]}>
        <mesh position={[0, 1.9, 0]}>
          <boxGeometry args={[7.2, 3.8, 4.8]} />
          <meshStandardMaterial color="#475569" roughness={0.6} />
        </mesh>
        {/* Fire Bay Doors (Red) */}
        {[-1.5, 1.5].map((bx, bi) => (
          <mesh key={bi} position={[bx, 1.4, 2.45]}>
            <boxGeometry args={[2.2, 2.6, 0.1]} />
            <meshStandardMaterial color="#dc2626" />
          </mesh>
        ))}
      </group>

      {/* Equipment Maintenance Yard (Workshop & Spare Parts Store) */}
      <group position={[-52, 0, 14]}>
        <mesh position={[0, 2.8, 0]}>
          <boxGeometry args={[7.5, 5.6, 8.5]} />
          <meshStandardMaterial color="#1e293b" roughness={0.6} />
        </mesh>
        {/* Gabled Workshop Roof */}
        <mesh position={[0, 5.8, 0]} rotation={[0, 0, 0]}>
          <boxGeometry args={[7.8, 0.4, 8.8]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
      </group>

      {/* Electrical Substation & Backup Generator House */}
      <group position={[22, 0, 31]}>
        <mesh position={[0, 1.5, 0]}>
          <boxGeometry args={[6.5, 3.0, 4.2]} />
          <meshStandardMaterial color="#475569" roughness={0.7} />
        </mesh>
      </group>

      {/* Fuel Storage Area (3 Cylindrical Steel Tanks with Safety Containment Bund) */}
      <group position={[48, 0, 16]}>
        {/* Concrete Secondary Containment Bund Wall */}
        <mesh position={[0, 0.4, 0]}>
          <boxGeometry args={[11.5, 0.8, 8.5]} />
          <meshStandardMaterial color="#334155" wireframe />
        </mesh>
        {/* 3 Large Cylindrical Storage Tanks */}
        {[-3.2, 0, 3.2].map((tx, ti) => (
          <mesh key={ti} position={[tx, 2.2, 0]}>
            <cylinderGeometry args={[1.5, 1.5, 4.2, 16]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.6} roughness={0.3} />
          </mesh>
        ))}
      </group>

      {/* ============================================================ */}
      {/* 10. PCT GATE COMPLEX & TRUCK STAGING AREA (Drawing PCT-MP-001) */}
      {/* ============================================================ */}
      {/* In-Gate Complex (3 OCR Portals, Weighbridges) */}
      <group position={[-10, 0, 38]}>
        <mesh position={[0, 2.6, 0]}>
          <boxGeometry args={[8.5, 0.3, 3.2]} />
          <meshStandardMaterial color="#1e4967" />
        </mesh>
      </group>

      {/* Customs Inspection & Container Scanner Canopy */}
      <group position={[4, 0, 38]}>
        <mesh position={[0, 3.2, 0]}>
          <boxGeometry args={[12.0, 0.35, 4.0]} />
          <meshStandardMaterial color="#16a394" />
        </mesh>
        {/* Mobile / Portal Container Scanner Unit */}
        <mesh position={[0, 1.6, 0]}>
          <boxGeometry args={[3.2, 3.0, 2.8]} />
          <meshStandardMaterial color="#334155" roughness={0.5} />
        </mesh>
      </group>

      {/* Out-Gate Complex (OCR Portals, Weighbridges) */}
      <group position={[18, 0, 38]}>
        <mesh position={[0, 2.6, 0]}>
          <boxGeometry args={[8.5, 0.3, 3.2]} />
          <meshStandardMaterial color="#1e4967" />
        </mesh>
      </group>

      {/* Truck Staging / Holding Area (~200 Trucks Capacity) */}
      <group position={[36, 0, 38]}>
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[18, 7.5]} />
          <meshStandardMaterial color="#1a2333" roughness={0.9} />
        </mesh>
        {/* Parked Container Chassis Trailers */}
        {[-6, -2, 2, 6].map((tx, ti) => (
          <mesh key={ti} position={[tx, 0.65, 0]}>
            <boxGeometry args={[2.8, 1.1, 1.0]} />
            <meshStandardMaterial color={["#0284c7", "#047857", "#ea580c", "#d97706"][ti % 4]} />
          </mesh>
        ))}
      </group>
    </>
  );
}
