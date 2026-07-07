"use client";

import { useRef, useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useAppStore } from "@/lib/store/useAppStore";
import type { EquipmentInstance } from "@/lib/plant/types";

type OrbitControlsImpl = {
  target: THREE.Vector3;
  update: () => void;
};

interface CameraRigProps {
  equipment: EquipmentInstance[];
}

/**
 * Camera rig with clear ownership rules:
 *
 *  - MANUAL mode (default): the user has full control via OrbitControls.
 *    The rig never touches the camera. This is what the user expects.
 *
 *  - CINEMATIC mode: triggered when the AI focuses on equipment or jumps
 *    to a tour step. The rig flies the camera to the target, then slowly
 *    orbits while the AI speaks. The moment the user grabs the camera
 *    (pointer down or wheel), cinematic mode ENDS immediately and control
 *    returns to the user. It does not resume on its own — only a new AI
 *    focus/tour action re-enters cinematic mode.
 *
 *  - IDLE drift: only when no plant is focused AND the user hasn't
 *    interacted yet. Stops the moment the user touches anything.
 */
export function CameraRig({ equipment }: CameraRigProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera, gl } = useThree();

  const focusId = useAppStore((s) => s.focusEquipmentId);
  const tourStep = useAppStore((s) => s.tourStep);
  const currentPlant = useAppStore((s) => s.currentPlant);
  const isAssistantSpeaking = useAppStore((s) => s.isAssistantSpeaking);

  // Cinematic state
  const mode = useRef<"manual" | "flying" | "orbiting">("manual");
  const targetPos = useRef(new THREE.Vector3(0, 7, 20));
  const targetLook = useRef(new THREE.Vector3(0, 1, 0));
  const orbitCenter = useRef(new THREE.Vector3(0, 1, 0));
  const orbitAngle = useRef(0);
  const orbitRadius = useRef(8);
  const orbitHeight = useRef(4);
  const orbitUntil = useRef(0); // timestamp when orbiting should stop
  const idleTime = useRef(0);
  const userInteracted = useRef(false);
  const lastFocusId = useRef<string | null>(null);
  const lastTourStep = useRef<number | null>(null);

  // Track manual interaction — immediately ends cinematic mode
  useEffect(() => {
    const dom = gl.domElement;
    const onInteract = () => {
      userInteracted.current = true;
      if (mode.current !== "manual") {
        mode.current = "manual";
      }
    };
    dom.addEventListener("pointerdown", onInteract);
    dom.addEventListener("wheel", onInteract, { passive: true });
    dom.addEventListener("touchstart", onInteract, { passive: true });
    return () => {
      dom.removeEventListener("pointerdown", onInteract);
      dom.removeEventListener("wheel", onInteract);
      dom.removeEventListener("touchstart", onInteract);
    };
  }, [gl]);

  // Trigger cinematic move when focus changes
  useEffect(() => {
    if (!focusId || focusId === lastFocusId.current) return;
    lastFocusId.current = focusId;
    const eq = equipment.find((e) => e.id === focusId);
    if (!eq) return;
    const target = new THREE.Vector3(...eq.position);
    orbitCenter.current.copy(target);
    orbitRadius.current = 7.5;
    orbitHeight.current = 3.5;
    orbitAngle.current = 0.6;
    const startPos = new THREE.Vector3(
      target.x + Math.cos(orbitAngle.current) * orbitRadius.current,
      target.y + orbitHeight.current,
      target.z + Math.sin(orbitAngle.current) * orbitRadius.current
    );
    targetPos.current.copy(startPos);
    targetLook.current.copy(target).add(new THREE.Vector3(0, 1, 0));
    userInteracted.current = false;
    mode.current = "flying";
  }, [focusId, equipment]);

  // Trigger cinematic move when tour step changes
  useEffect(() => {
    if (tourStep === null || tourStep === lastTourStep.current) return;
    lastTourStep.current = tourStep;
    if (!currentPlant) return;
    const step = currentPlant.processSteps[tourStep];
    if (!step) return;
    const eq = equipment.find((e) => e.id === step.equipmentId);
    if (!eq) return;
    const target = new THREE.Vector3(...eq.position);
    orbitCenter.current.copy(target);
    orbitRadius.current = 7.0;
    orbitHeight.current = 3.2;
    orbitAngle.current = 0.6 + tourStep * 0.4;
    const startPos = new THREE.Vector3(
      target.x + Math.cos(orbitAngle.current) * orbitRadius.current,
      target.y + orbitHeight.current,
      target.z + Math.sin(orbitAngle.current) * orbitRadius.current
    );
    targetPos.current.copy(startPos);
    targetLook.current.copy(target).add(new THREE.Vector3(0, 1, 0));
    userInteracted.current = false;
    mode.current = "flying";
  }, [tourStep, currentPlant, equipment]);

  // When focus/tour cleared, return to manual (no auto-reset of position)
  useEffect(() => {
    if (focusId === null && tourStep === null) {
      mode.current = "manual";
      lastFocusId.current = null;
      lastTourStep.current = null;
    }
  }, [focusId, tourStep]);

  useFrame((_, delta) => {
    // MANUAL mode — do nothing. User has full control via OrbitControls.
    if (mode.current === "manual") {
      // Gentle idle drift only if user has never interacted AND nothing is focused
      if (!userInteracted.current && !focusId && tourStep === null) {
        idleTime.current += delta;
        const t = idleTime.current;
        const driftX = Math.sin(t * 0.1) * 1.2;
        const driftY = 7 + Math.sin(t * 0.15) * 0.3;
        const driftZ = 20 + Math.cos(t * 0.1) * 1.2;
        camera.position.lerp(new THREE.Vector3(driftX, driftY, driftZ), 0.015);
        if (controlsRef.current) {
          controlsRef.current.target.lerp(new THREE.Vector3(0, 1, 0), 0.02);
          controlsRef.current.update();
        }
      }
      return;
    }

    // FLYING mode — approach the target position
    if (mode.current === "flying") {
      camera.position.lerp(targetPos.current, 0.05);
      if (controlsRef.current) {
        controlsRef.current.target.lerp(targetLook.current, 0.06);
        controlsRef.current.update();
      }
      if (camera.position.distanceTo(targetPos.current) < 0.3) {
        mode.current = "orbiting";
        // orbit for a fixed window; extends while AI is speaking
        orbitUntil.current = performance.now() + 12000;
      }
      return;
    }

    // ORBITING mode — slow cinematic orbit, but only while AI is speaking
    // OR for a limited window after arriving. Stops the moment the user
    // touches the camera (handled by the pointer/wheel listener which sets
    // mode to "manual").
    if (mode.current === "orbiting") {
      const now = performance.now();
      // Keep orbiting while AI is speaking, otherwise stop after the window
      if (!isAssistantSpeaking && now > orbitUntil.current) {
        mode.current = "manual";
        return;
      }
      // extend the window while speaking
      if (isAssistantSpeaking) {
        orbitUntil.current = now + 4000;
      }
      orbitAngle.current += delta * 0.15;
      const target = orbitCenter.current;
      const desired = new THREE.Vector3(
        target.x + Math.cos(orbitAngle.current) * orbitRadius.current,
        target.y + orbitHeight.current,
        target.z + Math.sin(orbitAngle.current) * orbitRadius.current
      );
      camera.position.lerp(desired, 0.035);
      if (controlsRef.current) {
        controlsRef.current.target.lerp(
          target.clone().add(new THREE.Vector3(0, 1, 0)),
          0.04
        );
        controlsRef.current.update();
      }
      return;
    }
  });

  return (
    <OrbitControls
      ref={controlsRef as any}
      enableDamping
      dampingFactor={0.08}
      minDistance={2.5}
      maxDistance={60}
      maxPolarAngle={Math.PI / 2.05}
      target={[0, 1, 0]}
      makeDefault
    />
  );
}
