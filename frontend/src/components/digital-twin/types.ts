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

export type SplitLayoutMode = "balanced" | "gis-focus" | "twin-focus" | "pip";

export type CameraPreset =
  | "isometric"
  | "topdown"
  | "operational"
  | "free"
  | "overview"
  | "berths"
  | "fairway"
  | "yard"
  | "cranes";

export type NavActionType =
  | "forward"
  | "backward"
  | "left"
  | "right"
  | "up"
  | "down"
  | "zoomIn"
  | "zoomOut"
  | "rotateLeft"
  | "rotateRight"
  | "panNorth"
  | "panSouth"
  | "panEast"
  | "panWest"
  | "resetNorth"
  | "togglePitch";

export type MouseInteractionMode = "pan" | "orbit";

export interface CameraMetrics {
  bearing: number;  // 0° = North, 90° = East, 180° = South, 270° = West
  pitch: number;    // 0° = top-down 2D plan, ~50° = 3D perspective
  distance: number; // Distance to orbit target in meters
  altitude?: number; // Camera elevation (Y) above ground level in meters
}

export interface NavSignal {
  action: NavActionType;
  timestamp: number;
}

export interface SimulationState {
  isPlaying: boolean;
  speed: 1 | 2 | 5;
  elapsedSeconds: number;
}
