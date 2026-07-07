"use client";

import { useRef, useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useAppStore } from "@/lib/store/useAppStore";
import type { EquipmentInstance } from "@/lib/plant/types";

// Minimal type for the OrbitControls instance methods we use
type OrbitControlsImpl = {
  target: THREE.Vector3;
  update: () => void;
};

interface CameraRigProps {
  equipment: EquipmentInstance[];
}

/**
 * Smoothly flies the camera to focus on a selected/focused piece of
 * equipment. Also handles guided tour step changes.
 */
export function CameraRig({ equipment }: CameraRigProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();

  const focusId = useAppStore((s) => s.focusEquipmentId);
  const tourStep = useAppStore((s) => s.tourStep);
  const currentPlant = useAppStore((s) => s.currentPlant);

  // target & desired camera position we lerp towards
  const targetPos = useRef(new THREE.Vector3(0, 6, 14));
  const targetLook = useRef(new THREE.Vector3(0, 1, 0));
  const animating = useRef(false);

  // When focus changes, compute target
  useEffect(() => {
    if (!focusId) return;
    const eq = equipment.find((e) => e.id === focusId);
    if (!eq) return;
    const target = new THREE.Vector3(...eq.position);
    // place camera offset to the front-right and above the equipment
    const offset = new THREE.Vector3(4.5, 3.5, 6.5);
    targetPos.current.copy(target).add(offset);
    targetLook.current.copy(target).add(new THREE.Vector3(0, 1, 0));
    animating.current = true;
  }, [focusId, equipment]);

  // Tour step changes
  useEffect(() => {
    if (tourStep === null || !currentPlant) return;
    const step = currentPlant.processSteps[tourStep];
    if (!step) return;
    const eq = equipment.find((e) => e.id === step.equipmentId);
    if (!eq) return;
    const target = new THREE.Vector3(...eq.position);
    const offset = new THREE.Vector3(4, 3, 6);
    targetPos.current.copy(target).add(offset);
    targetLook.current.copy(target).add(new THREE.Vector3(0, 1, 0));
    animating.current = true;
  }, [tourStep, currentPlant, equipment]);

  useFrame(() => {
    if (animating.current) {
      camera.position.lerp(targetPos.current, 0.06);
      if (controlsRef.current) {
        controlsRef.current.target.lerp(targetLook.current, 0.06);
        controlsRef.current.update();
      }
      if (camera.position.distanceTo(targetPos.current) < 0.15) {
        animating.current = false;
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef as any}
      enableDamping
      dampingFactor={0.08}
      minDistance={3}
      maxDistance={45}
      maxPolarAngle={Math.PI / 2.05}
      target={[0, 1, 0]}
    />
  );
}
