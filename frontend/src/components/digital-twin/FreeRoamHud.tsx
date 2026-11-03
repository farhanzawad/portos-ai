"use client";

import React, { useState } from "react";
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ChevronUp,
  ChevronDown,
  Plus,
  Minus,
  RotateCcw,
  RotateCw,
  Compass,
  Move,
  Maximize2,
  X,
  Keyboard,
} from "lucide-react";
import { NavActionType, CameraPreset } from "./types";

interface FreeRoamHudProps {
  onNavigate: (action: NavActionType) => void;
  onResetCamera: () => void;
  cameraPreset?: CameraPreset;
  onSetPreset?: (preset: CameraPreset) => void;
}

export function FreeRoamHud({
  onNavigate,
  onResetCamera,
  cameraPreset,
  onSetPreset,
}: FreeRoamHudProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showKeysHelp, setShowKeysHelp] = useState(true);

  return (
    <div className="absolute bottom-4 right-4 z-20 flex flex-col items-end gap-2 select-none pointer-events-auto">
      {/* 1. Keyboard Shortcuts Floating Banner */}
      {showKeysHelp && (
        <div className="bg-portos-navy/95 backdrop-blur-md border border-portos-navy-secondary text-slate-200 rounded-lg px-3 py-1.5 shadow-2xl text-[11px] flex items-center gap-2 max-w-md animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Keyboard className="h-3.5 w-3.5 text-portos-teal flex-shrink-0" />
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-white">Free Movement:</span>
            <span className="bg-slate-800 text-slate-300 px-1 py-0.2 rounded font-mono text-[10px]">WASD</span>
            <span className="text-slate-400">or</span>
            <span className="bg-slate-800 text-slate-300 px-1 py-0.2 rounded font-mono text-[10px]">Arrows</span>
            <span className="text-slate-400">to move</span>
            <span className="text-slate-500">·</span>
            <span className="bg-slate-800 text-slate-300 px-1 py-0.2 rounded font-mono text-[10px]">Q / E</span>
            <span className="text-slate-400">elevate</span>
            <span className="text-slate-500">·</span>
            <span className="bg-slate-800 text-slate-300 px-1 py-0.2 rounded font-mono text-[10px]">Shift</span>
            <span className="text-slate-400">sprint</span>
          </div>
          <button
            onClick={() => setShowKeysHelp(false)}
            className="text-slate-400 hover:text-white p-0.5 ml-1 transition-colors"
            title="Dismiss shortcut tips"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* 2. On-screen Navigation Controller D-Pad & Camera Gizmo */}
      <div className="bg-portos-navy/95 backdrop-blur-md border border-portos-navy-secondary rounded-lg shadow-2xl p-2.5 text-white flex flex-col items-center">
        {/* Header bar */}
        <div className="w-full flex items-center justify-between gap-3 pb-2 border-b border-portos-navy-secondary/60 mb-2">
          <div className="flex items-center gap-1.5 text-portos-teal font-semibold text-xs">
            <Compass className="h-3.5 w-3.5" />
            <span>Move Freely</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onSetPreset?.("free")}
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                cameraPreset === "free"
                  ? "bg-portos-teal text-white font-bold"
                  : "text-slate-300 hover:text-white hover:bg-portos-navy-secondary/60"
              }`}
              title="Activate Free Roam Camera Mode"
            >
              Free Cam
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-slate-400 hover:text-white p-1 rounded transition-colors"
              title={isExpanded ? "Collapse Navigation Pad" : "Expand Navigation Pad"}
            >
              <Move className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Directional Pad Grid */}
        {isExpanded && (
          <div className="flex flex-col items-center gap-2">
            {/* Horizontal Movement Cross (Forward, Backward, Strafe Left, Strafe Right) */}
            <div className="grid grid-cols-3 gap-1 w-28">
              <div />
              <button
                onClick={() => onNavigate("forward")}
                className="flex items-center justify-center p-2 rounded bg-portos-navy-secondary/70 hover:bg-portos-teal hover:text-white text-slate-200 transition-colors active:scale-95 shadow-sm border border-portos-navy-secondary"
                title="Move Forward (W or ↑)"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
              <div />

              <button
                onClick={() => onNavigate("left")}
                className="flex items-center justify-center p-2 rounded bg-portos-navy-secondary/70 hover:bg-portos-teal hover:text-white text-slate-200 transition-colors active:scale-95 shadow-sm border border-portos-navy-secondary"
                title="Strafe Left (A or ←)"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={onResetCamera}
                className="flex items-center justify-center p-2 rounded bg-portos-navy-secondary/90 hover:bg-portos-navy-secondary text-portos-teal hover:text-white transition-colors active:scale-95 text-[10px] font-bold border border-portos-navy-secondary"
                title="Reset to Port Center"
              >
                <Maximize2 className="h-3 w-3" />
              </button>
              <button
                onClick={() => onNavigate("right")}
                className="flex items-center justify-center p-2 rounded bg-portos-navy-secondary/70 hover:bg-portos-teal hover:text-white text-slate-200 transition-colors active:scale-95 shadow-sm border border-portos-navy-secondary"
                title="Strafe Right (D or →)"
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </button>

              <div />
              <button
                onClick={() => onNavigate("backward")}
                className="flex items-center justify-center p-2 rounded bg-portos-navy-secondary/70 hover:bg-portos-teal hover:text-white text-slate-200 transition-colors active:scale-95 shadow-sm border border-portos-navy-secondary"
                title="Move Backward (S or ↓)"
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
              <div />
            </div>

            {/* Vertical Elevation, Zoom & Rotation Bar */}
            <div className="w-full flex items-center justify-between gap-1 pt-2 border-t border-portos-navy-secondary/60 text-slate-300">
              {/* Elevate Up / Down */}
              <div className="flex items-center gap-0.5 bg-portos-navy-secondary/40 p-0.5 rounded border border-portos-navy-secondary">
                <button
                  onClick={() => onNavigate("up")}
                  className="p-1 rounded hover:bg-portos-teal hover:text-white transition-colors text-slate-300"
                  title="Elevate Up (E or Space)"
                >
                  <ChevronUp className="h-3 w-3" />
                </button>
                <button
                  onClick={() => onNavigate("down")}
                  className="p-1 rounded hover:bg-portos-teal hover:text-white transition-colors text-slate-300"
                  title="Lower Down (Q or C)"
                >
                  <ChevronDown className="h-3 w-3" />
                </button>
              </div>

              {/* Rotate Sightline Left / Right */}
              <div className="flex items-center gap-0.5 bg-portos-navy-secondary/40 p-0.5 rounded border border-portos-navy-secondary">
                <button
                  onClick={() => onNavigate("rotateLeft")}
                  className="p-1 rounded hover:bg-portos-teal hover:text-white transition-colors text-slate-300"
                  title="Rotate Sightline Left"
                >
                  <RotateCcw className="h-3 w-3" />
                </button>
                <button
                  onClick={() => onNavigate("rotateRight")}
                  className="p-1 rounded hover:bg-portos-teal hover:text-white transition-colors text-slate-300"
                  title="Rotate Sightline Right"
                >
                  <RotateCw className="h-3 w-3" />
                </button>
              </div>

              {/* Zoom In / Out */}
              <div className="flex items-center gap-0.5 bg-portos-navy-secondary/40 p-0.5 rounded border border-portos-navy-secondary">
                <button
                  onClick={() => onNavigate("zoomIn")}
                  className="p-1 rounded hover:bg-portos-teal hover:text-white transition-colors text-slate-300"
                  title="Zoom In (+)"
                >
                  <Plus className="h-3 w-3" />
                </button>
                <button
                  onClick={() => onNavigate("zoomOut")}
                  className="p-1 rounded hover:bg-portos-teal hover:text-white transition-colors text-slate-300"
                  title="Zoom Out (-)"
                >
                  <Minus className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

