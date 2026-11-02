import { VesselCallRead, VesselTrackResponse } from "@/types/api";

export interface VesselFilterState {
  search: string;
  status: string;
  delayRisk: string;
}

export interface MapLayerState {
  anchorageZones: boolean;
  fairwayChannel: boolean;
  historicalTrack: boolean;
  predictedRoute: boolean;
}

