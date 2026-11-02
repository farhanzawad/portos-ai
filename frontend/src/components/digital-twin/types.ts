import {
  BerthRead,
  VesselCallRead,
  EquipmentRead,
  YardBlockRead,
} from "@/types/api";

export type EntityType = "vessel" | "berth" | "crane" | "yard";

export interface SelectedEntity {
  type: EntityType;
  id: string;
  data: VesselCallRead | BerthRead | EquipmentRead | YardBlockRead;
}

export interface LayerVisibility {
  vessels: boolean;
  berths: boolean;
  cranes: boolean;
  yardBlocks: boolean;
}

export interface SimulationState {
  isPlaying: boolean;
  speed: 1 | 2 | 5;
  elapsedSeconds: number;
}

