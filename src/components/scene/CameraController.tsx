"use client";

import { useEffect, useRef, useCallback } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const CAM_EVENT = "plant-camera-command";

/**
 * CameraController — lives inside the R3F canvas.
 *
 * Handles:
 *  - Keyboard: W/A/S/D or arrows to pan, Q/E or +/- to zoom, R to reset.
 *  - Custom events from the HTML CameraControls buttons (zoom in/out/reset).
 *
 * Panning moves both the camera AND the OrbitControls target together so
 * the view stays natural. Zoom moves the camera along its view direction
 * but clamps to min/max distance from the target.
 *
 * This controller does NOT override OrbitControls — it works alongside it.
 */
export function CameraController() {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as any;
  const invalidate = useThree((s) => s.invalidate);
  const keys = useRef<Set<string>>(new Set());

  const zoom = useCallback((amount: number) => {
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    const target = controls?.target ?? new THREE.Vector3(0, 1, 0);
    const newPos = camera.position.clone().add(dir.multiplyScalar(amount));
    const dist = newPos.distanceTo(target);
    if (dist > 1.5 && dist < 80) {
      camera.position.copy(newPos);
    }
    invalidate();
  }, [camera, controls, invalidate]);

  const resetView = useCallback(() => {
    camera.position.set(24, 32, 48);
    if (controls) {
      controls.target.set(0, 1, 0);
      controls.update();
    }
    invalidate();
  }, [camera, controls, invalidate]);

  // Keyboard input
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
      keys.current.add(e.key.toLowerCase());
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys.current.delete(e.key.toLowerCase());
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  // Button commands
  useEffect(() => {
    const handler = (e: Event) => {
      const { command } = (e as CustomEvent).detail;
      if (command === "zoomIn") zoom(3);
      else if (command === "zoomOut") zoom(-3);
      else if (command === "reset") resetView();
    };
    window.addEventListener(CAM_EVENT, handler as EventListener);
    return () => window.removeEventListener(CAM_EVENT, handler as EventListener);
  }, [zoom, resetView]);

  // Per-frame keyboard movement
  useFrame(() => {
    const k = keys.current;
    if (k.size === 0) return;

    const speed = 0.4;
    const target = controls?.target ?? new THREE.Vector3(0, 1, 0);

    // Pan: move camera + target together along the view plane
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    const move = new THREE.Vector3();
    if (k.has("w") || k.has("arrowup")) move.add(forward.clone().multiplyScalar(speed));
    if (k.has("s") || k.has("arrowdown")) move.add(forward.clone().multiplyScalar(-speed));
    if (k.has("a") || k.has("arrowleft")) move.add(right.clone().multiplyScalar(-speed));
    if (k.has("d") || k.has("arrowright")) move.add(right.clone().multiplyScalar(speed));

    if (move.lengthSq() > 0) {
      camera.position.add(move);
      target.add(move);
      if (controls) controls.update();
    }

    // Zoom via keyboard
    const zoomDir = new THREE.Vector3();
    camera.getWorldDirection(zoomDir);
    if (k.has("e") || k.has("=") || k.has("+")) {
      const newPos = camera.position.clone().add(zoomDir.multiplyScalar(speed));
      const dist = newPos.distanceTo(target);
      if (dist > 1.5) {
        camera.position.copy(newPos);
        if (controls) controls.update();
      }
    }
    if (k.has("q") || k.has("-")) {
      const newPos = camera.position.clone().add(zoomDir.multiplyScalar(-speed));
      const dist = newPos.distanceTo(target);
      if (dist < 80) {
        camera.position.copy(newPos);
        if (controls) controls.update();
      }
    }

    invalidate();
  });

  return null;
}
