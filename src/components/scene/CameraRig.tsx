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
 * Cinematic camera rig.
 *
 * Behaviour:
 *  - When the user focuses on equipment (or a tour step changes), the
 *    camera lerps to a vantage point near that equipment.
 *  - Once close, the camera slowly ORBITS around the equipment so the
 *    scene is never static while the AI explains. This is the "AI
 *    controls the camera during walkthrough" behaviour.
 *  - Idle drift when nothing is focused — a gentle floating motion.
 *  - User can still grab the scene and orbit manually; we suspend the
 *    cinematic orbit for a few seconds after any manual interaction.
 */
export function CameraRig({ equipment }: CameraRigProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera, gl } = useThree();

  const focusId = useAppStore((s) => s.focusEquipmentId);
  const tourStep = useAppStore((s) => s.tourStep);
  const currentPlant = useAppStore((s) => s.currentPlant);
  const isAssistantSpeaking = useAppStore((s) => s.isAssistantSpeaking);

  const targetPos = useRef(new THREE.Vector3(0, 7, 20));
  const targetLook = useRef(new THREE.Vector3(0, 1, 0));
  const animating = useRef(false);
  const arrived = useRef(false); // have we finished approaching the target?
  const orbitAngle = useRef(0);
  const orbitCenter = useRef(new THREE.Vector3(0, 1, 0));
  const orbitRadius = useRef(8);
  const orbitHeight = useRef(4);
  const lastUserInteraction = useRef(0); // timestamp
  const idleTime = useRef(0);

  // Track manual interaction so we pause auto-orbit briefly
  useEffect(() => {
    const dom = gl.domElement;
    const mark = () => {
      lastUserInteraction.current = performance.now();
      animating.current = false; // let user drive
    };
    dom.addEventListener("pointerdown", mark);
    dom.addEventListener("wheel", mark, { passive: true });
    return () => {
      dom.removeEventListener("pointerdown", mark);
      dom.removeEventListener("wheel", mark);
    };
  }, [gl]);

  // When focus changes, compute target
  useEffect(() => {
    if (!focusId) return;
    const eq = equipment.find((e) => e.id === focusId);
    if (!eq) return;
    const target = new THREE.Vector3(...eq.position);
    orbitCenter.current.copy(target);
    orbitRadius.current = 7.5;
    orbitHeight.current = 3.5;
    orbitAngle.current = 0.6; // start offset so we approach from a 3/4 view
    // place camera at the orbit position
    const startPos = new THREE.Vector3(
      target.x + Math.cos(orbitAngle.current) * orbitRadius.current,
      target.y + orbitHeight.current,
      target.z + Math.sin(orbitAngle.current) * orbitRadius.current
    );
    targetPos.current.copy(startPos);
    targetLook.current.copy(target).add(new THREE.Vector3(0, 1, 0));
    animating.current = true;
    arrived.current = false;
  }, [focusId, equipment]);

  // Tour step changes
  useEffect(() => {
    if (tourStep === null || !currentPlant) return;
    const step = currentPlant.processSteps[tourStep];
    if (!step) return;
    const eq = equipment.find((e) => e.id === step.equipmentId);
    if (!eq) return;
    const target = new THREE.Vector3(...eq.position);
    orbitCenter.current.copy(target);
    orbitRadius.current = 7.0;
    orbitHeight.current = 3.2;
    // each new tour step shifts the orbit start angle for variety
    orbitAngle.current = 0.6 + tourStep * 0.4;
    const startPos = new THREE.Vector3(
      target.x + Math.cos(orbitAngle.current) * orbitRadius.current,
      target.y + orbitHeight.current,
      target.z + Math.sin(orbitAngle.current) * orbitRadius.current
    );
    targetPos.current.copy(startPos);
    targetLook.current.copy(target).add(new THREE.Vector3(0, 1, 0));
    animating.current = true;
    arrived.current = false;
  }, [tourStep, currentPlant, equipment]);

  // Reset to overview when nothing is focused
  useEffect(() => {
    if (focusId === null && tourStep === null) {
      targetPos.current.set(0, 7, 20);
      targetLook.current.set(0, 1, 0);
      animating.current = true;
      arrived.current = false;
    }
  }, [focusId, tourStep]);

  useFrame((_, delta) => {
    const now = performance.now();
    const sinceInteraction = now - lastUserInteraction.current;

    if (animating.current) {
      // approach the target orbit position
      camera.position.lerp(targetPos.current, 0.045);
      if (controlsRef.current) {
        controlsRef.current.target.lerp(targetLook.current, 0.06);
        controlsRef.current.update();
      }
      if (camera.position.distanceTo(targetPos.current) < 0.25) {
        animating.current = false;
        arrived.current = true;
      }
      return;
    }

    if (arrived.current && (focusId || tourStep !== null)) {
      // Once we've arrived, slowly orbit around the equipment while the AI
      // explains — but pause for ~2.5s after any manual interaction so the
      // user can drag freely.
      if (sinceInteraction > 2500) {
        orbitAngle.current += delta * 0.18; // slow cinematic orbit
        const target = orbitCenter.current;
        const desired = new THREE.Vector3(
          target.x + Math.cos(orbitAngle.current) * orbitRadius.current,
          target.y + orbitHeight.current,
          target.z + Math.sin(orbitAngle.current) * orbitRadius.current
        );
        camera.position.lerp(desired, 0.04);
        if (controlsRef.current) {
          controlsRef.current.target.lerp(
            target.clone().add(new THREE.Vector3(0, 1, 0)),
            0.05
          );
          controlsRef.current.update();
        }
      }
      return;
    }

    // Idle drift when nothing focused — gentle floating overview
    if (!focusId && tourStep === null) {
      idleTime.current += delta;
      const t = idleTime.current;
      const driftX = Math.sin(t * 0.12) * 1.5;
      const driftY = 7 + Math.sin(t * 0.18) * 0.4;
      const driftZ = 20 + Math.cos(t * 0.12) * 1.5;
      camera.position.lerp(new THREE.Vector3(driftX, driftY, driftZ), 0.02);
      if (controlsRef.current) {
        controlsRef.current.target.lerp(new THREE.Vector3(0, 1, 0), 0.03);
        controlsRef.current.update();
      }
    }
  });

  // suppress unused-var lint for isAssistantSpeaking (reserved for future lip-sync cues)
  void isAssistantSpeaking;

  return (
    <OrbitControls
      ref={controlsRef as any}
      enableDamping
      dampingFactor={0.1}
      minDistance={3}
      maxDistance={50}
      maxPolarAngle={Math.PI / 2.05}
      target={[0, 1, 0]}
    />
  );
}
