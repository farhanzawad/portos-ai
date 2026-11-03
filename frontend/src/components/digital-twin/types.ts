import {
  BerthRead,
  VesselCallRead,
  EquipmentRead,
  YardBlockRead,
} from "@/types/api";

export type EntityType =
  | "vessel"
  | "berth"
  | "crane"
  | "yard"
  | "facility"
  | "channel"
  | "anchorage"
  | "hazard";

export interface SelectedEntity {
  type: EntityType;
  id: string;
  data?: VesselCallRead | BerthRead | EquipmentRead | YardBlockRead | Record<string, any>;
  sourceEnvironment?: "2D" | "3D";
  coordinates?: { lat: number; lon: number };
}

export interface LayerVisibility {
  vessels: boolean;
  berths: boolean;
  cranes: boolean;
  yardBlocks: boolean;
  bathymetry?: boolean;
  navigationChannels?: boolean;
  anchorageZones?: boolean;
  facilities?: boolean;
  roads?: boolean;
  tracks?: boolean;
  alerts?: boolean;
}

export type ViewMode = "3d" | "map" | "2d" | "split";

export type CameraPreset = "isometric" | "topdown" | "operational";

export interface SimulationState {
  isPlaying: boolean;
  speed: 1 | 2 | 5;
  elapsedSeconds: number;
}
