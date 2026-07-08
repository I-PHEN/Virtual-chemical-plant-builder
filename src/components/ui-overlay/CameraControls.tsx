"use client";

import { useEffect, useRef } from "react";
import { Plus, Minus, Compass } from "lucide-react";
import * as THREE from "three";

/**
 * CameraControls — professional manual camera control buttons.
 *
 * Uses a custom event bus to communicate with the CameraController
 * component that lives inside the R3F canvas (which has access to the
 * camera and OrbitControls).
 *
 * Keyboard controls are also available:
 *  - W/A/S/D or arrow keys: pan the camera
 *  - Q/E or +/-: zoom in/out
 *  - R: reset view
 *
 * These are handled by the CameraController inside the canvas.
 */
const CAM_EVENT = "plant-camera-command";

export function dispatchCameraCommand(command: "zoomIn" | "zoomOut" | "reset") {
  window.dispatchEvent(new CustomEvent(CAM_EVENT, { detail: { command } }));
}

export function CameraControls() {
  // Register keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
      const k = e.key.toLowerCase();
      if (k === "r") dispatchCameraCommand("reset");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="pointer-events-auto flex flex-col gap-1">
      <div className="flex flex-col overflow-hidden rounded-lg border border-slate-800/80 bg-slate-950/80 backdrop-blur">
        <button
          onClick={() => dispatchCameraCommand("zoomIn")}
          title="Zoom in (E or +)"
          aria-label="Zoom in"
          className="flex h-8 w-8 items-center justify-center text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
        <div className="h-px bg-slate-800/80" />
        <button
          onClick={() => dispatchCameraCommand("zoomOut")}
          title="Zoom out (Q or -)"
          aria-label="Zoom out"
          className="flex h-8 w-8 items-center justify-center text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <div className="h-px bg-slate-800/80" />
        <button
          onClick={() => dispatchCameraCommand("reset")}
          title="Reset view (R)"
          aria-label="Reset view"
          className="flex h-8 w-8 items-center justify-center text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
        >
          <Compass className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
