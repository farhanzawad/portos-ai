"use client";

import React, { useRef, useEffect, useMemo } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { SelectedEntity, LayerVisibility, CameraPreset, NavSignal } from "./types";
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
import { RealisticContainer3D } from "./RealisticContainer3D";
import { localEnuToWgs84, PCT_TERMINAL_ORIGIN } from "@/lib/geospatial/coordinates";
import {
  getTerminalApronTexture,
  getQuayCopingTexture,
  getWaterNormalTexture,
  getWaterColorTexture,
  getCorrugatedMetalTexture,
} from "@/lib/digital-twin/textures";

export interface HoverEntityInfo {
  type: string;
  title: string;
  subtitle: string;
  status?: string;
  metric?: string;
}

// RSGT PCT Layout: 580m continuous quay with Berths 1, 2, 3 + Berth 4 Tanker
// X positions along quay edge (Z = -2.8):
const BERTH_POSITIONS = [-34, -18, -2, 14, 30, 48];

// Specific PCT 12 Stacking Blocks designations matching masterplan Drawing No. PCT-MP-001
const PCT_BLOCK_DESIGNATIONS = [
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

interface TerminalScene3DProps {
  berths: BerthRead[];
  vesselCalls: VesselCallRead[];
  equipment: EquipmentRead[];
  yardBlocks: YardBlockRead[];
  layers: LayerVisibility;
  selectedEntity: SelectedEntity | null;
  onSelectEntity: (entity: SelectedEntity) => void;
  onHoverEntity?: (info: HoverEntityInfo | null) => void;
  isSimulating: boolean;
  simulationSpeed: 1 | 2 | 5;
  resetCameraSignal: number;
  cameraPreset?: CameraPreset;
  navSignal?: NavSignal | null;
}

export function TerminalScene3D({
  berths,
  vesselCalls,
  equipment,
  yardBlocks,
  layers,
  selectedEntity,
  onSelectEntity,
  onHoverEntity,
  isSimulating,
  simulationSpeed,
  resetCameraSignal,
  cameraPreset = "isometric",
  navSignal,
}: TerminalScene3DProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const approachingVesselRef = useRef<THREE.Group>(null);
  const truck1Ref = useRef<THREE.Group>(null);
  const truck2Ref = useRef<THREE.Group>(null);
  const truck3Ref = useRef<THREE.Group>(null);
  const radarRef = useRef<THREE.Mesh>(null);
  const buoyGreenRef = useRef<THREE.Mesh>(null);
  const buoyRedRef = useRef<THREE.Mesh>(null);
  const waterRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

  // Procedural PBR Textures for High-Fidelity Industrial Visualization
  const terminalApronTexture = useMemo(() => getTerminalApronTexture(), []);
  const quayCopingTexture = useMemo(() => getQuayCopingTexture(), []);
  const waterNormalTexture = useMemo(() => getWaterNormalTexture(), []);
  const waterColorTexture = useMemo(() => getWaterColorTexture(), []);
  const corrugatedRoofTexture = useMemo(() => getCorrugatedMetalTexture("#475569"), []);

  // Smooth Camera Lerping Targets
  const targetCamPos = useRef(new THREE.Vector3(42, 45, 48));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 8));
  const isAnimatingCamera = useRef(false);

  // Smoothly trigger a camera flight
  const flyToTarget = (camX: number, camY: number, camZ: number, lookX: number, lookY: number, lookZ: number) => {
    targetCamPos.current.set(camX, camY, camZ);
    targetLookAt.current.set(lookX, lookY, lookZ);
    isAnimatingCamera.current = true;
  };

  // Camera Presets handler with smooth gliding transition
  useEffect(() => {
    if (cameraPreset === "topdown") {
      flyToTarget(0, 95, 14, 0, 0, 14);
    } else if (cameraPreset === "operational") {
      flyToTarget(-26, 12, 12, 0, 4, -4);
    } else if (cameraPreset === "free") {
      // Free Roam low-altitude inspection overview
      flyToTarget(0, 16, 26, 0, 3, 0);
    } else {
      // Default Isometric overview
      flyToTarget(42, 45, 48, 0, 0, 8);
    }
  }, [cameraPreset]);

  // Reset Camera action handler
  useEffect(() => {
    if (resetCameraSignal > 0) {
      flyToTarget(42, 45, 48, 0, 0, 8);
    }
  }, [resetCameraSignal]);

  // Keyboard Free-Roam Movement Engine (WASD, Arrow Keys, QE, Space, Shift)
  const keysPressed = useRef<Set<string>>(new Set());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl) {
        const tag = activeEl.tagName.toLowerCase();
        if (tag === "input" || tag === "textarea" || (activeEl as HTMLElement).isContentEditable) {
          return;
        }
      }

      const code = e.code;
      if (
        [
          "KeyW", "KeyA", "KeyS", "KeyD",
          "KeyQ", "KeyE", "KeyC", "Space",
          "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
          "ShiftLeft", "ShiftRight",
        ].includes(code)
      ) {
        if (e.key.startsWith("Arrow") || e.key === " ") {
          e.preventDefault();
        }
        keysPressed.current.add(code);
        isAnimatingCamera.current = false;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.code);
    };

    const handleBlur = () => {
      keysPressed.current.clear();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  // Listen to manual mouse/touch orbit & pan on OrbitControls to immediately yield control
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const onControlsStart = () => {
      isAnimatingCamera.current = false;
    };

    controls.addEventListener("start", onControlsStart);
    return () => {
      controls.removeEventListener("start", onControlsStart);
    };
  }, []);

  // Handle On-Screen Navigation Button Signals (D-Pad, Elevate, Zoom, Rotate)
  useEffect(() => {
    if (!navSignal || !controlsRef.current) return;
    isAnimatingCamera.current = false;
    const controls = controlsRef.current;

    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    if (forward.lengthSq() > 0.001) forward.normalize();
    else forward.set(0, 0, -1);

    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    const moveStep = 6.0;

    switch (navSignal.action) {
      case "forward": {
        const delta = forward.clone().multiplyScalar(moveStep);
        camera.position.add(delta);
        controls.target.add(delta);
        break;
      }
      case "backward": {
        const delta = forward.clone().multiplyScalar(-moveStep);
        camera.position.add(delta);
        controls.target.add(delta);
        break;
      }
      case "left": {
        const delta = right.clone().multiplyScalar(-moveStep);
        camera.position.add(delta);
        controls.target.add(delta);
        break;
      }
      case "right": {
        const delta = right.clone().multiplyScalar(moveStep);
        camera.position.add(delta);
        controls.target.add(delta);
        break;
      }
      case "up": {
        camera.position.y += 4.5;
        controls.target.y += 4.5;
        break;
      }
      case "down": {
        camera.position.y = Math.max(1.5, camera.position.y - 4.5);
        controls.target.y = Math.max(0.5, controls.target.y - 4.5);
        break;
      }
      case "zoomIn": {
        const dir = new THREE.Vector3().subVectors(controls.target, camera.position);
        if (dir.length() > 2.0) {
          camera.position.addScaledVector(dir, 0.22);
        }
        break;
      }
      case "zoomOut": {
        const dir = new THREE.Vector3().subVectors(camera.position, controls.target);
        camera.position.addScaledVector(dir, 0.25);
        break;
      }
      case "rotateLeft": {
        const offset = new THREE.Vector3().subVectors(camera.position, controls.target);
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 12);
        camera.position.copy(controls.target).add(offset);
        break;
      }
      case "rotateRight": {
        const offset = new THREE.Vector3().subVectors(camera.position, controls.target);
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 12);
        camera.position.copy(controls.target).add(offset);
        break;
      }
    }
    controls.update();
  }, [navSignal, camera]);

  const berthedCalls = vesselCalls.filter((c) => c.status === "BERTHED");
  const queueCalls = vesselCalls.filter((c) => c.status !== "BERTHED");
  const approachingCall = queueCalls[0];

  // Focus on Selected Entity (from 3D interaction or synchronized 2D map selection)
  useEffect(() => {
    if (!selectedEntity) return;

    if (selectedEntity.type === "berth") {
      const idx = berths.findIndex((b) => b.id === selectedEntity.id);
      const posX = idx >= 0 ? BERTH_POSITIONS[idx % BERTH_POSITIONS.length] : -10;
      flyToTarget(posX + 16, 14, 10, posX, 1, -2.8);
    } else if (selectedEntity.type === "vessel") {
      const bIdx = berthedCalls.findIndex((c) => c.id === selectedEntity.id);
      if (bIdx >= 0) {
        const berthIdx = [0, 1, 3, 2, 4][bIdx % 5];
        const posX = BERTH_POSITIONS[berthIdx];
        flyToTarget(posX + 16, 14, 8, posX, 2, -6.8);
      } else {
        // Approaching channel vessel
        flyToTarget(-12, 14, -12, -25, 2, -24);
      }
    } else if (selectedEntity.type === "crane") {
      const cIdx = equipment.findIndex((e) => e.id === selectedEntity.id);
      const posX = cIdx >= 0 ? BERTH_POSITIONS[cIdx % BERTH_POSITIONS.length] + 2.2 : 0;
      flyToTarget(posX + 14, 12, 10, posX, 3, -1.8);
    } else if (selectedEntity.type === "yard") {
      const bIdx = PCT_BLOCK_DESIGNATIONS.findIndex(
        (b) => b.code.toLowerCase() === selectedEntity.id.toLowerCase() || `pct-block-${b.code.toLowerCase()}` === selectedEntity.id
      );
      if (bIdx >= 0) {
        const isRow2 = bIdx >= 6;
        const colIdx = bIdx % 6;
        const posX = (colIdx - 2.5) * 13.5;
        const posZ = isRow2 ? 23.5 : 9.5;
        flyToTarget(posX + 12, 14, posZ + 14, posX, 2, posZ);
      } else {
        flyToTarget(12, 14, 20, 0, 2, 16);
      }
    } else if (selectedEntity.type === "facility") {
      const fId = selectedEntity.id;
      if (fId.includes("tower")) {
        flyToTarget(-16, 14, 40, -26, 4, 31);
      } else if (fId.includes("admin")) {
        flyToTarget(-30, 12, 40, -42, 2, 31);
      } else if (fId.includes("gate")) {
        flyToTarget(0, 12, 46, -10, 2, 38);
      } else if (fId.includes("fuel") || fId.includes("tank")) {
        flyToTarget(58, 14, 26, 48, 2, 16);
      } else if (fId.includes("workshop") || fId.includes("maintenance")) {
        flyToTarget(-40, 12, 22, -52, 2, 14);
      } else {
        flyToTarget(-10, 14, 42, -20, 2, 32);
      }
    }
  }, [selectedEntity, berths, berthedCalls, equipment]);

  // Frame animations: water wave shader, radar antenna, vessels, trucks, smooth camera lerp
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // 0. Smooth Camera Lerp
    if (isAnimatingCamera.current && controlsRef.current) {
      camera.position.lerp(targetCamPos.current, 0.06);
      controlsRef.current.target.lerp(targetLookAt.current, 0.06);
      controlsRef.current.update();
      if (
        camera.position.distanceTo(targetCamPos.current) < 0.15 &&
        controlsRef.current.target.distanceTo(targetLookAt.current) < 0.15
      ) {
        isAnimatingCamera.current = false;
      }
    }

    // 0b. Continuous Free Roam Keyboard Navigation (WASD / Arrows / QE / Space / Shift)
    const activeKeys = keysPressed.current;
    if (activeKeys.size > 0 && controlsRef.current) {
      isAnimatingCamera.current = false;
      const isSprint = activeKeys.has("ShiftLeft") || activeKeys.has("ShiftRight");
      const moveSpeed = isSprint ? 45.0 : 20.0;
      const moveDelta = moveSpeed * 0.016;

      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0;
      if (forward.lengthSq() > 0.001) {
        forward.normalize();
      } else {
        forward.set(0, 0, -1);
      }

      const right = new THREE.Vector3();
      right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

      const moveVec = new THREE.Vector3();
      if (activeKeys.has("KeyW") || activeKeys.has("ArrowUp")) moveVec.add(forward);
      if (activeKeys.has("KeyS") || activeKeys.has("ArrowDown")) moveVec.sub(forward);
      if (activeKeys.has("KeyD") || activeKeys.has("ArrowRight")) moveVec.add(right);
      if (activeKeys.has("KeyA") || activeKeys.has("ArrowLeft")) moveVec.sub(right);
      if (activeKeys.has("KeyE") || activeKeys.has("Space")) moveVec.y += 1;
      if (activeKeys.has("KeyQ") || activeKeys.has("KeyC")) moveVec.y -= 1;

      if (moveVec.lengthSq() > 0) {
        moveVec.normalize().multiplyScalar(moveDelta);
        camera.position.add(moveVec);
        controlsRef.current.target.add(moveVec);
        controlsRef.current.update();
      }
    }

    // 1. Water waves: continuous procedural ripple flow and specular shimmer
    if (waterNormalTexture) {
      waterNormalTexture.offset.x = (t * 0.025 * simulationSpeed) % 1;
      waterNormalTexture.offset.y = (t * 0.015 * simulationSpeed) % 1;
    }
    if (waterRef.current) {
      const mat = waterRef.current.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.roughness = 0.18 + Math.sin(t * 0.8) * 0.03;
      }
    }

    // 2. Control Tower Radar Antenna Rotation
    if (radarRef.current) {
      radarRef.current.rotation.y = t * 2.2;
    }

    // 3. Animate approaching vessel along Karnaphuli channel in closed-circuit loop
    // Follows Inbound Lane -> 600m Turning Basin 180° swing -> Outbound Lane -> Sea Reach turnaround
    if (approachingVesselRef.current && isSimulating) {
      const vTrackLen = 193.7;
      const vSpeed = 1.6 * simulationSpeed; // Calm, realistic harbor speed
      const vDist = (t * vSpeed) % vTrackLen;

      let vX = -58;
      let vZ = -26.0;
      let vRotY = 0;

      if (vDist < 78) {
        // Leg 1: Inbound Fairway Transit (Eastbound towards berths)
        const u = vDist / 78;
        vX = -58 + u * 78;
        vZ = -26.0;
        vRotY = 0;
      } else if (vDist < 96.85) {
        // Leg 2: Karnaphuli Ø 600m Turning Basin 180° Swing Maneuver
        const u = (vDist - 78) / 18.85;
        const theta = -Math.PI / 2 + u * Math.PI;
        vX = 20 + 6.0 * Math.cos(theta);
        vZ = -32 + 6.0 * Math.sin(theta);
        vRotY = u * Math.PI;
      } else if (vDist < 174.85) {
        // Leg 3: Outbound Fairway Transit (Westbound towards Sea)
        const u = (vDist - 96.85) / 78;
        vX = 20 - u * 78;
        vZ = -38.0;
        vRotY = Math.PI;
      } else {
        // Leg 4: Bay of Bengal Sea Reach Turnaround Maneuver
        const u = (vDist - 174.85) / 18.85;
        const theta = Math.PI / 2 + u * Math.PI;
        vX = -58 + 6.0 * Math.cos(theta);
        vZ = -32 + 6.0 * Math.sin(theta);
        vRotY = Math.PI + u * Math.PI;
      }

      // Add subtle tidal roll & heave
      approachingVesselRef.current.position.set(vX, Math.sin(t * 1.2) * 0.03, vZ);
      approachingVesselRef.current.rotation.y = vRotY + Math.sin(t * 0.3) * 0.015;
    }

    // 4. Animate Internal Terminal Haulage Tractors along PCT-MP-001 One-Way Loop
    // Quayside Apron (Z = 3.5) -> East Turnaround -> Yard Road (Z = 16.5) -> West Turnaround
    const trackLen = 208.84;
    const truckSpeed = 3.8 * simulationSpeed;

    const calcTruckPose = (offsetDist: number) => {
      const normDist = ((offsetDist % trackLen) + trackLen) % trackLen;
      if (normDist < 84) {
        // Apron Road heading East
        const p = normDist / 84;
        return { x: -42 + p * 84, z: 3.5, rotY: 0 };
      } else if (normDist < 104.42) {
        // East Turnaround Loop
        const p = (normDist - 84) / 20.42;
        const angle = -Math.PI / 2 + p * Math.PI;
        return {
          x: 42 + 6.5 * Math.cos(angle),
          z: 10.0 + 6.5 * Math.sin(angle),
          rotY: p * Math.PI,
        };
      } else if (normDist < 188.42) {
        // Yard Road heading West
        const p = (normDist - 104.42) / 84;
        return { x: 42 - p * 84, z: 16.5, rotY: Math.PI };
      } else {
        // West Turnaround Loop
        const p = (normDist - 188.42) / 20.42;
        const angle = Math.PI / 2 + p * Math.PI;
        return {
          x: -42 + 6.5 * Math.cos(angle),
          z: 10.0 + 6.5 * Math.sin(angle),
          rotY: Math.PI + p * Math.PI,
        };
      }
    };

    if (truck1Ref.current && isSimulating) {
      const pose1 = calcTruckPose(t * truckSpeed);
      truck1Ref.current.position.set(pose1.x, 0.02, pose1.z);
      truck1Ref.current.rotation.y = pose1.rotY;
    }
    if (truck2Ref.current && isSimulating) {
      const pose2 = calcTruckPose(t * truckSpeed + 0.333 * trackLen);
      truck2Ref.current.position.set(pose2.x, 0.02, pose2.z);
      truck2Ref.current.rotation.y = pose2.rotY;
    }
    if (truck3Ref.current && isSimulating) {
      const pose3 = calcTruckPose(t * truckSpeed + 0.666 * trackLen);
      truck3Ref.current.position.set(pose3.x, 0.02, pose3.z);
      truck3Ref.current.rotation.y = pose3.rotY;
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

  return (
    <>
      {/* ============================================================ */}
      {/* 1. PROFESSIONAL MARITIME LIGHTING RIG                        */}
      {/* ============================================================ */}
      <ambientLight intensity={0.68} color="#e0f2fe" />
      <directionalLight
        position={[45, 62, 40]}
        intensity={1.35}
        color="#fffbeb"
        castShadow
        shadow-bias={-0.0004}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
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
        minDistance={1.2}
        maxDistance={350}
        maxPolarAngle={Math.PI / 2.005}
        minPolarAngle={0.01}
        enablePan={true}
        panSpeed={1.5}
        screenSpacePanning={true}
        enableDamping={true}
        dampingFactor={0.08}
        rotateSpeed={0.9}
        zoomSpeed={1.2}
      />

      {/* ============================================================ */}
      {/* 2. KARNAPHULI RIVER FAIRWAY, BASIN & BREAKWATERS             */}
      {/* ============================================================ */}
      {/* River Water Surface with High-Resolution Wave Normal Map & Bathymetry */}
      <mesh ref={waterRef} position={[0, -0.06, -34]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[165, 60, 64, 64]} />
        <meshStandardMaterial
          map={waterColorTexture || undefined}
          normalMap={waterNormalTexture || undefined}
          normalScale={new THREE.Vector2(0.4, 0.4)}
          roughness={0.16}
          metalness={0.65}
          color="#0c2e48"
        />
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

      {/* Terminal Land Surface (Reinforced Concrete Apron & Roadway Pavement Grid) */}
      <mesh position={[0, -0.05, 20]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[145, 48]} />
        <meshStandardMaterial
          map={terminalApronTexture || undefined}
          roughness={0.75}
          metalness={0.12}
          color="#f8fafc"
        />
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
      {/* Quay Frontage with 45° Yellow/Black Safety Chevrons & Rails */}
      <mesh position={[0, 0.08, -1.8]}>
        <boxGeometry args={[116, 0.28, 4.2]} />
        <meshStandardMaterial
          map={quayCopingTexture || undefined}
          roughness={0.62}
          metalness={0.28}
          color="#f8fafc"
        />
      </mesh>

      {/* Quay Crane Rail Tracks */}
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
            <mesh position={[0, -0.15, 0]}>
              <boxGeometry args={[0.8, 0.45, 0.35]} />
              <meshStandardMaterial color="#020617" roughness={0.9} />
            </mesh>
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
        {[-0.8, 0, 0.8].map((pz, pi) => (
          <mesh key={pi} position={[-0.5, 0.3, pz]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.08, 0.08, 15, 8]} />
            <meshStandardMaterial color="#0284c7" metalness={0.8} />
          </mesh>
        ))}
      </group>

      {/* Tug / Workboat Jetty */}
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
          const posX = BERTH_POSITIONS[index];
          const isSelected = selectedEntity?.type === "berth" && selectedEntity.id === berth.id;
          const geoCoord = localEnuToWgs84(posX, 0, -2.8, PCT_TERMINAL_ORIGIN.lat, PCT_TERMINAL_ORIGIN.lon);

          return (
            <BerthZone3D
              key={berth.id}
              position={[posX, 0, -2.8]}
              length={14.8}
              berth={berth}
              isSelected={isSelected}
              onSelect={() =>
                onSelectEntity({
                  type: "berth",
                  id: berth.id,
                  data: berth,
                  sourceEnvironment: "3D",
                  coordinates: geoCoord,
                })
              }
              onHover={(isHovered) =>
                onHoverEntity?.(
                  isHovered
                    ? {
                        type: "Quayside Berth",
                        title: berth.name,
                        subtitle: `Design Depth -11.0m · Quay Length 190m`,
                        status: berth.status,
                        metric: `Berth Status: ${berth.status === "OCCUPIED" ? "Active Vessel Berthed" : "Available"}`,
                      }
                    : null
                )
              }
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
            const posX = BERTH_POSITIONS[berthIdx];
            const isSelected = selectedEntity?.type === "vessel" && selectedEntity.id === call.id;
            const geoCoord = localEnuToWgs84(posX, 0, -6.8, PCT_TERMINAL_ORIGIN.lat, PCT_TERMINAL_ORIGIN.lon);

            return (
              <ProceduralVessel3D
                key={call.id}
                position={[posX, 0, -6.8]}
                rotation={[0, 0, 0]}
                scale={0.96}
                call={call}
                isSelected={isSelected}
                onSelect={() =>
                  onSelectEntity({
                    type: "vessel",
                    id: call.id,
                    data: call,
                    sourceEnvironment: "3D",
                    coordinates: geoCoord,
                  })
                }
                onHover={(isHovered) =>
                  onHoverEntity?.(
                    isHovered
                      ? {
                          type: "Container Vessel",
                          title: call.vessel?.name || "Vessel",
                          subtitle: `IMO ${call.vessel?.imo_number || "9123456"} · Flag: ${call.vessel?.flag_country || "Bangladesh"}`,
                          status: call.status,
                          metric: `LOA ${call.vessel?.length_overall_m || 172}m · Cargo: ${call.inbound_teu || 850} TEU · Draft: ${call.vessel?.max_draft_m || 8.5}m`,
                        }
                      : null
                  )
                }
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
                rotation={[0, 0, 0]}
                scale={0.92}
                call={approachingCall}
                isSelected={selectedEntity?.type === "vessel" && selectedEntity.id === approachingCall.id}
                onSelect={() =>
                  onSelectEntity({
                    type: "vessel",
                    id: approachingCall.id,
                    data: approachingCall,
                    sourceEnvironment: "3D",
                    coordinates: localEnuToWgs84(-25, 0, -24, PCT_TERMINAL_ORIGIN.lat, PCT_TERMINAL_ORIGIN.lon),
                  })
                }
                onHover={(isHovered) =>
                  onHoverEntity?.(
                    isHovered
                      ? {
                          type: "Inbound Feeder Vessel",
                          title: approachingCall.vessel?.name || "Vessel",
                          subtitle: `Fairway Channel Transit · Speed: 11.5 kts`,
                          status: approachingCall.status,
                          metric: `Reported ETA: ${approachingCall.reported_eta ? new Date(approachingCall.reported_eta).toLocaleTimeString() : "Incoming"}`,
                        }
                      : null
                  )
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
          const posX = BERTH_POSITIONS[idx] + 2.2;
          const isSelected = selectedEntity?.type === "crane" && selectedEntity.id === crane.id;
          const geoCoord = localEnuToWgs84(posX, 0, -2.1, PCT_TERMINAL_ORIGIN.lat, PCT_TERMINAL_ORIGIN.lon);

          return (
            <STSCrane3D
              key={crane.id}
              position={[posX, 0.2, -2.1]}
              rotation={[0, 0, 0]}
              scale={0.96}
              crane={crane}
              isSelected={isSelected}
              onSelect={() =>
                onSelectEntity({
                  type: "crane",
                  id: crane.id,
                  data: crane,
                  sourceEnvironment: "3D",
                  coordinates: geoCoord,
                })
              }
              onHover={(isHovered) =>
                onHoverEntity?.(
                  isHovered
                    ? {
                        type: "Ship-to-Shore Gantry Crane",
                        title: (crane as any).name || `STS Crane ${crane.code}`,
                        subtitle: `Code: ${crane.code} · Super Post-Panamax (65m Outreach)`,
                        status: crane.status,
                        metric: `Cycle: 42s · Moves: 32/hr · Spreader: Dual 20ft/40ft`,
                      }
                    : null
                )
              }
              isSimulating={isSimulating}
            />
          );
        })}

      {/* ============================================================ */}
      {/* 7. 12 CONTAINER YARD STACKING BLOCKS (C01 - C12)             */}
      {/* ============================================================ */}
      {layers.yardBlocks &&
        PCT_BLOCK_DESIGNATIONS.map((designation, idx) => {
          const isRow2 = idx >= 6;
          const colIdx = idx % 6;
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
          const geoCoord = localEnuToWgs84(posX, 0, posZ, PCT_TERMINAL_ORIGIN.lat, PCT_TERMINAL_ORIGIN.lon);

          return (
            <YardBlock3D
              key={designation.code}
              position={[posX, 0, posZ]}
              block={blockData as any}
              isSelected={isSelected}
              onSelect={() =>
                onSelectEntity({
                  type: "yard",
                  id: blockData.id,
                  data: blockData as any,
                  sourceEnvironment: "3D",
                  coordinates: geoCoord,
                })
              }
              onHover={(isHovered) =>
                onHoverEntity?.(
                  isHovered
                    ? {
                        type: "Container Stacking Block",
                        title: `Block ${designation.code} (${designation.category})`,
                        subtitle: designation.name,
                        status: (blockData as any).status || "NORMAL",
                        metric: `Capacity: ${(blockData as any).max_capacity_teu || blockData.teu_capacity || 720} TEU · Utilization: ${Math.round(((blockData as any).utilization_rate || 0.6) * 100)}%`,
                      }
                    : null
                )
              }
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

      {/* East Turnaround Road Connector (Connecting Apron to Yard Road at X = 42) */}
      <mesh position={[42, 0.014, 10.0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[5.2, 17.0]} />
        <meshStandardMaterial color="#1a2333" roughness={0.7} />
      </mesh>

      {/* West Turnaround Road Connector (Connecting Yard Road to Apron at X = -42) */}
      <mesh position={[-42, 0.014, 10.0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[5.2, 17.0]} />
        <meshStandardMaterial color="#1a2333" roughness={0.7} />
      </mesh>

      {/* Dynamic Terminal Tractor 1 */}
      <group ref={truck1Ref} position={[-25, 0.02, 3.5]}>
        <mesh position={[1.4, 0.75, 0]}>
          <boxGeometry args={[1.0, 1.1, 0.9]} />
          <meshStandardMaterial color="#ea580c" roughness={0.4} />
        </mesh>
        <group position={[-0.8, 0.45, 0]}>
          <RealisticContainer3D carrier="MAERSK" scale={0.92} />
        </group>
      </group>

      {/* Dynamic Terminal Tractor 2 */}
      <group ref={truck2Ref} position={[20, 0.02, 16.5]} rotation={[0, Math.PI, 0]}>
        <mesh position={[1.4, 0.75, 0]}>
          <boxGeometry args={[1.0, 1.1, 0.9]} />
          <meshStandardMaterial color="#eab308" roughness={0.4} />
        </mesh>
        <group position={[-0.8, 0.45, 0]}>
          <RealisticContainer3D carrier="EVERGREEN" scale={0.92} />
        </group>
      </group>

      {/* Dynamic Terminal Tractor 3 */}
      <group ref={truck3Ref} position={[0, 0.02, 16.5]} rotation={[0, Math.PI, 0]}>
        <mesh position={[1.4, 0.75, 0]}>
          <boxGeometry args={[1.0, 1.1, 0.9]} />
          <meshStandardMaterial color="#0284c7" roughness={0.4} />
        </mesh>
        <group position={[-0.8, 0.45, 0]}>
          <RealisticContainer3D carrier="HAPAG" scale={0.92} />
        </group>
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
            sourceEnvironment: "3D",
            coordinates: localEnuToWgs84(-26, 0, 31, PCT_TERMINAL_ORIGIN.lat, PCT_TERMINAL_ORIGIN.lon),
          });
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHoverEntity?.({
            type: "Port Operations Facility",
            title: "PCT Control Tower",
            subtitle: "Elevated VTS & Fairway Surveillance",
            status: "ONLINE",
            metric: "Radar 360° Fairway Coverage · Channel 12 VHF",
          });
        }}
        onPointerOut={() => onHoverEntity?.(null)}
      >
        <mesh position={[0, 4.0, 0]}>
          <boxGeometry args={[2.4, 8.0, 2.4]} />
          <meshStandardMaterial color="#334155" roughness={0.8} />
        </mesh>
        <mesh position={[0, 8.8, 0]}>
          <cylinderGeometry args={[2.0, 1.6, 1.8, 8]} />
          <meshStandardMaterial color="#0284c7" roughness={0.1} metalness={0.9} transparent opacity={0.85} />
        </mesh>
        <mesh position={[0, 9.8, 0]}>
          <cylinderGeometry args={[2.2, 2.2, 0.25, 8]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        <mesh ref={radarRef} position={[0, 10.3, 0]}>
          <boxGeometry args={[1.4, 0.15, 0.2]} />
          <meshStandardMaterial color="#f8fafc" />
        </mesh>
      </group>

      {/* Administration Building (3-storey modern office with glass curtain wall) */}
      <group
        position={[-42, 0, 31]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectEntity({
            type: "facility",
            id: "pct-admin",
            data: { name: "PCT Administration Headquarters", status: "OPERATIONAL" },
            sourceEnvironment: "3D",
            coordinates: localEnuToWgs84(-42, 0, 31, PCT_TERMINAL_ORIGIN.lat, PCT_TERMINAL_ORIGIN.lon),
          });
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHoverEntity?.({
            type: "Port Headquarters",
            title: "PCT Administration Building",
            subtitle: "Terminal Management & Customs Clearing Center",
            status: "OPERATIONAL",
            metric: "3-Storey Office Complex · Operations Command",
          });
        }}
        onPointerOut={() => onHoverEntity?.(null)}
      >
        <mesh position={[0, 2.5, 0]}>
          <boxGeometry args={[8.5, 5.0, 5.5]} />
          <meshStandardMaterial color="#1e293b" roughness={0.5} />
        </mesh>
        <mesh position={[0, 1.2, 2.9]}>
          <boxGeometry args={[3.2, 0.2, 1.2]} />
          <meshStandardMaterial color="#16a394" />
        </mesh>
        <mesh position={[0, 0.02, 6.2]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[8.5, 3.2]} />
          <meshStandardMaterial color="#334155" roughness={0.9} />
        </mesh>
      </group>

      {/* Marine & Berth Operations Office */}
      <group
        position={[-16, 0, 31]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectEntity({
            type: "facility",
            id: "pct-marine-ops",
            data: { name: "Marine & Berth Operations Office", status: "OPERATIONAL" },
            sourceEnvironment: "3D",
            coordinates: localEnuToWgs84(-16, 0, 31, PCT_TERMINAL_ORIGIN.lat, PCT_TERMINAL_ORIGIN.lon),
          });
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHoverEntity?.({
            type: "Operations Facility",
            title: "Marine & Berth Operations Office",
            subtitle: "Quay Operations & Stevedoring Coordination",
            status: "ACTIVE",
            metric: "Berths 1-3 Dispatch & Harbor Tug Control",
          });
        }}
        onPointerOut={() => onHoverEntity?.(null)}
      >
        <mesh position={[0, 1.8, 0]}>
          <boxGeometry args={[6.5, 3.6, 4.5]} />
          <meshStandardMaterial color="#334155" roughness={0.6} />
        </mesh>
      </group>

      {/* Customs & Port Security + First Aid Clinic */}
      <group
        position={[-6, 0, 31]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectEntity({
            type: "facility",
            id: "pct-security-clinic",
            data: { name: "Customs Security & Port Clinic", status: "OPERATIONAL" },
            sourceEnvironment: "3D",
            coordinates: localEnuToWgs84(-6, 0, 31, PCT_TERMINAL_ORIGIN.lat, PCT_TERMINAL_ORIGIN.lon),
          });
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHoverEntity?.({
            type: "Safety Facility",
            title: "Customs & Port Security Complex",
            subtitle: "ISPS Code Access Control & Medical Post",
            status: "ACTIVE",
            metric: "24/7 Security Patrol & Emergency First Aid",
          });
        }}
        onPointerOut={() => onHoverEntity?.(null)}
      >
        <mesh position={[0, 1.8, 0]}>
          <boxGeometry args={[8.0, 3.6, 4.5]} />
          <meshStandardMaterial color="#334155" roughness={0.6} />
        </mesh>
      </group>

      {/* Fire Station with 2 Appliance Bays */}
      <group
        position={[6, 0, 31]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectEntity({
            type: "facility",
            id: "pct-fire-station",
            data: { name: "Terminal Fire & Rescue Station", status: "STANDBY" },
            sourceEnvironment: "3D",
            coordinates: localEnuToWgs84(6, 0, 31, PCT_TERMINAL_ORIGIN.lat, PCT_TERMINAL_ORIGIN.lon),
          });
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHoverEntity?.({
            type: "Safety Facility",
            title: "Terminal Fire & Emergency Station",
            subtitle: "2 Heavy Foam Fire Tenders & Hazmat Team",
            status: "STANDBY",
            metric: "Response Time: < 3 Minutes to Quay/Yard",
          });
        }}
        onPointerOut={() => onHoverEntity?.(null)}
      >
        <mesh position={[0, 1.9, 0]}>
          <boxGeometry args={[7.2, 3.8, 4.8]} />
          <meshStandardMaterial color="#475569" roughness={0.6} />
        </mesh>
        {[-1.5, 1.5].map((bx, bi) => (
          <mesh key={bi} position={[bx, 1.4, 2.45]}>
            <boxGeometry args={[2.2, 2.6, 0.1]} />
            <meshStandardMaterial color="#dc2626" />
          </mesh>
        ))}
      </group>

      {/* Equipment Maintenance Yard (Workshop & Spare Parts Store) */}
      <group
        position={[-52, 0, 14]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectEntity({
            type: "facility",
            id: "pct-workshop",
            data: { name: "Equipment Maintenance Yard & Heavy Workshop", status: "OPERATIONAL" },
            sourceEnvironment: "3D",
            coordinates: localEnuToWgs84(-52, 0, 14, PCT_TERMINAL_ORIGIN.lat, PCT_TERMINAL_ORIGIN.lon),
          });
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHoverEntity?.({
            type: "Engineering Facility",
            title: "Equipment Maintenance Yard & Workshop",
            subtitle: "Heavy Gantry Crane & Spreader Service Bay",
            status: "OPERATIONAL",
            metric: "Isolation Forest Telemetry Monitored · 3 Bays",
          });
        }}
        onPointerOut={() => onHoverEntity?.(null)}
      >
        <mesh position={[0, 2.8, 0]}>
          <boxGeometry args={[7.5, 5.6, 8.5]} />
          <meshStandardMaterial
            map={corrugatedRoofTexture || undefined}
            color="#475569"
            roughness={0.6}
            metalness={0.25}
          />
        </mesh>
        <mesh position={[0, 5.8, 0]} rotation={[0, 0, 0]}>
          <boxGeometry args={[7.8, 0.4, 8.8]} />
          <meshStandardMaterial
            map={corrugatedRoofTexture || undefined}
            color="#334155"
            roughness={0.5}
            metalness={0.3}
          />
        </mesh>
      </group>

      {/* Electrical Substation & Backup Generator House */}
      <group
        position={[22, 0, 31]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectEntity({
            type: "facility",
            id: "pct-substation",
            data: { name: "Electrical Substation & Generator House", status: "ONLINE" },
            sourceEnvironment: "3D",
            coordinates: localEnuToWgs84(22, 0, 31, PCT_TERMINAL_ORIGIN.lat, PCT_TERMINAL_ORIGIN.lon),
          });
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHoverEntity?.({
            type: "Utility Facility",
            title: "Primary 33kV Electrical Substation",
            subtitle: "Quay Crane Shore Power & Reefer Distribution",
            status: "ONLINE",
            metric: "Capacity: 12 MVA · Dual Diesel Generators",
          });
        }}
        onPointerOut={() => onHoverEntity?.(null)}
      >
        <mesh position={[0, 1.5, 0]}>
          <boxGeometry args={[6.5, 3.0, 4.2]} />
          <meshStandardMaterial color="#475569" roughness={0.7} />
        </mesh>
      </group>

      {/* Fuel Storage Area (3 Cylindrical Steel Tanks with Safety Containment Bund) */}
      <group
        position={[48, 0, 16]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectEntity({
            type: "facility",
            id: "pct-fuel-tanks",
            data: { name: "Bunker Fuel Storage Area", status: "SECURE" },
            sourceEnvironment: "3D",
            coordinates: localEnuToWgs84(48, 0, 16, PCT_TERMINAL_ORIGIN.lat, PCT_TERMINAL_ORIGIN.lon),
          });
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHoverEntity?.({
            type: "Fuel Infrastructure",
            title: "Bunker Fuel Storage Complex",
            subtitle: "3 Cylindrical Tanks with Secondary Containment",
            status: "SECURE",
            metric: "Capacity: 12,000 m³ HFO/MGO · Berth 4 Pipeline",
          });
        }}
        onPointerOut={() => onHoverEntity?.(null)}
      >
        <mesh position={[0, 0.4, 0]}>
          <boxGeometry args={[11.5, 0.8, 8.5]} />
          <meshStandardMaterial color="#334155" wireframe />
        </mesh>
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
      <group
        position={[-10, 0, 38]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectEntity({
            type: "facility",
            id: "pct-ingate",
            data: { name: "PCT Automated In-Gate Complex", status: "ACTIVE" },
            sourceEnvironment: "3D",
            coordinates: localEnuToWgs84(-10, 0, 38, PCT_TERMINAL_ORIGIN.lat, PCT_TERMINAL_ORIGIN.lon),
          });
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHoverEntity?.({
            type: "Gate Complex",
            title: "PCT Automated In-Gate Complex",
            subtitle: "3 OCR Inbound Portals & Static Weighbridges",
            status: "ACTIVE",
            metric: "Avg Processing Time: 45s/truck · OCR Match: 99.2%",
          });
        }}
        onPointerOut={() => onHoverEntity?.(null)}
      >
        <mesh position={[0, 2.6, 0]}>
          <boxGeometry args={[8.5, 0.3, 3.2]} />
          <meshStandardMaterial color="#1e4967" />
        </mesh>
      </group>

      {/* Customs Inspection & Container Scanner Canopy */}
      <group
        position={[4, 0, 38]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectEntity({
            type: "facility",
            id: "pct-customs-scanner",
            data: { name: "Customs Inspection & Portal Scanner", status: "ACTIVE" },
            sourceEnvironment: "3D",
            coordinates: localEnuToWgs84(4, 0, 38, PCT_TERMINAL_ORIGIN.lat, PCT_TERMINAL_ORIGIN.lon),
          });
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHoverEntity?.({
            type: "Customs Facility",
            title: "Customs Inspection & Portal Scanner",
            subtitle: "High-Energy Non-Intrusive X-Ray Cargo Inspection",
            status: "ACTIVE",
            metric: "Throughput: 20 Containers/hr · ASYCUDA Linked",
          });
        }}
        onPointerOut={() => onHoverEntity?.(null)}
      >
        <mesh position={[0, 3.2, 0]}>
          <boxGeometry args={[12.0, 0.35, 4.0]} />
          <meshStandardMaterial
            map={corrugatedRoofTexture || undefined}
            color="#16a394"
            roughness={0.4}
            metalness={0.3}
          />
        </mesh>
        <mesh position={[0, 1.6, 0]}>
          <boxGeometry args={[3.2, 3.0, 2.8]} />
          <meshStandardMaterial color="#334155" roughness={0.5} />
        </mesh>
      </group>

      {/* Out-Gate Complex (OCR Portals, Weighbridges) */}
      <group
        position={[18, 0, 38]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectEntity({
            type: "facility",
            id: "pct-outgate",
            data: { name: "PCT Automated Out-Gate Complex", status: "ACTIVE" },
            sourceEnvironment: "3D",
            coordinates: localEnuToWgs84(18, 0, 38, PCT_TERMINAL_ORIGIN.lat, PCT_TERMINAL_ORIGIN.lon),
          });
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHoverEntity?.({
            type: "Gate Complex",
            title: "PCT Automated Out-Gate Complex",
            subtitle: "3 OCR Outbound Lanes & Exit Weighbridges",
            status: "ACTIVE",
            metric: "Throughput: 18 Trucks/hr · E-Gate Clearance",
          });
        }}
        onPointerOut={() => onHoverEntity?.(null)}
      >
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
