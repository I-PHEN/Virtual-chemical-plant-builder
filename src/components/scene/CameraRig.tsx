"use client";

import { useRef, useEffect, useMemo } from "react";
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
 * Camera rig with strict ownership rules.
 *
 * The user ALWAYS has priority. The rig only moves the camera when:
 *  1. The AI explicitly focuses equipment or jumps to a tour step.
 *  2. The user has NOT interacted with the camera since that action.
 *
 * The moment the user touches the camera (pointer down, wheel, touch,
 * or even a right-click), ALL cinematic motion stops immediately and
 * permanently until the next AI focus/tour action.
 *
 * Zoom is fully delegated to OrbitControls — the rig never touches
 * camera.position.z in a way that would fight zoom. The rig only
 * lerps position when in "flying" or "orbiting" mode, and both of
 * those modes exit the instant the user interacts.
 */
export function CameraRig({ equipment }: CameraRigProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera, gl } = useThree();

  const focusId = useAppStore((s) => s.focusEquipmentId);
  const tourStep = useAppStore((s) => s.tourStep);
  const currentPlant = useAppStore((s) => s.currentPlant);
  const isAssistantSpeaking = useAppStore((s) => s.isAssistantSpeaking);

  // ─── Compute plant bounding box for camera framing ───
  // The layout engine centers the plant on origin, but the actual extent
  // varies (ammonia is 65×105m, a small distillation plant might be 40×40m).
  // We compute the bounding box once per plant so the camera can frame it.
  const plantBounds = useMemo(() => {
    if (equipment.length === 0) {
      return { centerX: 0, centerZ: 0, diagonal: 80, maxHeight: 10 };
    }
    const xs = equipment.map((e) => e.position[0]);
    const zs = equipment.map((e) => e.position[2]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minZ = Math.min(...zs);
    const maxZ = Math.max(...zs);
    const centerX = (minX + maxX) / 2;
    const centerZ = (minZ + maxZ) / 2;
    const width = maxX - minX;
    const depth = maxZ - minZ;
    const diagonal = Math.hypot(width, depth);
    // Estimate max height from equipment types (columns/reformers are tall)
    const maxHeight = equipment.some((e) => e.type === "column" || e.type === "reformer" || e.type === "flareStack") ? 50 : 20;
    return { centerX, centerZ, diagonal: Math.max(diagonal, 40), maxHeight };
  }, [equipment]);

  // Initial camera position: framed to see the whole plant from a 35° angle
  const initialCamPos = useMemo(() => {
    const d = plantBounds.diagonal;
    return new THREE.Vector3(
      plantBounds.centerX,
      d * 0.45, // height = 45% of diagonal (good aerial angle)
      plantBounds.centerZ + d * 0.6 // distance = 60% of diagonal
    );
  }, [plantBounds]);

  const maxDist = Math.max(plantBounds.diagonal * 1.5, 80);

  const mode = useRef<"manual" | "flying" | "orbiting">("manual");
  const targetPos = useRef(initialCamPos.clone());
  const targetLook = useRef(new THREE.Vector3(plantBounds.centerX, 1, plantBounds.centerZ));
  const orbitCenter = useRef(new THREE.Vector3(plantBounds.centerX, 1, plantBounds.centerZ));
  const orbitAngle = useRef(0);
  const orbitRadius = useRef(8);
  const orbitHeight = useRef(4);
  const orbitUntil = useRef(0);
  const idleTime = useRef(0);
  const userInteracted = useRef(false);
  const lastFocusId = useRef<string | null>(null);
  const lastTourStep = useRef<number | null>(null);

  // When a new plant loads, snap the camera to the initial framing position
  // so the user immediately sees the whole plant (not the inside of one piece).
  useEffect(() => {
    if (equipment.length === 0) return;
    camera.position.copy(initialCamPos);
    if (controlsRef.current) {
      controlsRef.current.target.set(plantBounds.centerX, 1, plantBounds.centerZ);
      controlsRef.current.update();
    }
    targetPos.current.copy(initialCamPos);
    targetLook.current.set(plantBounds.centerX, 1, plantBounds.centerZ);
    userInteracted.current = false;
    mode.current = "manual";
  }, [equipment, initialCamPos, plantBounds, camera]);

  // Track manual interaction on the canvas — IMMEDIATELY ends cinematic mode.
  // Listen on both the canvas and the window to catch wheel events reliably
  // (wheel events don't always fire on the canvas if a div is on top).
  useEffect(() => {
    const dom = gl.domElement;
    const onInteract = () => {
      userInteracted.current = true;
      mode.current = "manual";
    };
    dom.addEventListener("pointerdown", onInteract);
    dom.addEventListener("wheel", onInteract, { passive: true });
    dom.addEventListener("touchstart", onInteract, { passive: true });
    dom.addEventListener("contextmenu", onInteract);
    // Also listen on window for wheel — sometimes the event target is a child
    window.addEventListener("wheel", onInteract, { passive: true });
    return () => {
      dom.removeEventListener("pointerdown", onInteract);
      dom.removeEventListener("wheel", onInteract);
      dom.removeEventListener("touchstart", onInteract);
      dom.removeEventListener("contextmenu", onInteract);
      window.removeEventListener("wheel", onInteract);
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

  // When focus/tour cleared, return to manual
  useEffect(() => {
    if (focusId === null && tourStep === null) {
      mode.current = "manual";
      lastFocusId.current = null;
      lastTourStep.current = null;
    }
  }, [focusId, tourStep]);

  useFrame((_, delta) => {
    // MANUAL mode — do absolutely nothing to the camera. The user has
    // full control via OrbitControls (orbit, pan, zoom). This is critical:
    // never lerp position or target here, or zoom will feel broken.
    if (mode.current === "manual") {
      // Gentle idle drift ONLY if the user has never interacted AND nothing
      // is focused. Once they touch anything, this stops forever (until reload).
      if (!userInteracted.current && !focusId && tourStep === null) {
        idleTime.current += delta;
        const t = idleTime.current;
        const baseX = initialCamPos.x;
        const baseY = initialCamPos.y;
        const baseZ = initialCamPos.z;
        camera.position.lerp(
          new THREE.Vector3(
            baseX + Math.sin(t * 0.1) * 2,
            baseY + Math.sin(t * 0.15) * 0.5,
            baseZ + Math.cos(t * 0.1) * 2
          ),
          0.012
        );
        if (controlsRef.current) {
          controlsRef.current.target.lerp(
            new THREE.Vector3(plantBounds.centerX, 1, plantBounds.centerZ),
            0.02
          );
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
        orbitUntil.current = performance.now() + 12000;
      }
      return;
    }

    // ORBITING mode — slow cinematic orbit, only while AI is speaking
    if (mode.current === "orbiting") {
      const now = performance.now();
      if (!isAssistantSpeaking && now > orbitUntil.current) {
        mode.current = "manual";
        return;
      }
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
      enableZoom
      enablePan
      enableRotate
      minDistance={3}
      maxDistance={maxDist}
      maxPolarAngle={Math.PI / 2.05}
      zoomSpeed={1.0}
      rotateSpeed={0.8}
      panSpeed={0.8}
      target={[plantBounds.centerX, 1, plantBounds.centerZ]}
      makeDefault
    />
  );
}
