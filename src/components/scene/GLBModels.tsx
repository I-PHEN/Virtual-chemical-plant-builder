"use client";

import { useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { useAppStore } from "@/lib/store/useAppStore";

/**
 * GLB Model Loader — loads and displays real 3D GLB assets from the
 * Eclair Industrial City pack (CC0). These models provide much more
 * realistic geometry than procedural primitives.
 *
 * Models available:
 * - detail-tank.glb: industrial storage tank with pipes and base
 * - chimney-*.glb: industrial chimneys (basic, small, medium, large)
 * - building-*.glb: 20 industrial buildings (for backdrop/environment)
 *
 * The models use a shared colormap texture (Textures/colormap.png).
 * We override materials with our PBR material system for consistency
 * with the rest of the scene.
 */

const MODEL_DIR = "/models";

/** Maps equipment types to GLB model files */
const EQUIPMENT_GLB_MAP: Record<string, string> = {
  storageTank: `${MODEL_DIR}/detail-tank.glb`,
  tank: `${MODEL_DIR}/detail-tank.glb`,
  // For other types, we keep using procedural models (they're parametric)
};

/** Backdrop building models for the environment */
const BUILDING_GLB_FILES = [
  "building-a.glb", "building-b.glb", "building-c.glb", "building-d.glb",
  "building-e.glb", "building-f.glb", "building-g.glb", "building-h.glb",
];

/** Chimney models */
const CHIMNEY_GLB_FILES = [
  "chimney-basic.glb", "chimney-small.glb", "chimney-medium.glb", "chimney-large.glb",
];

/**
 * Loads a GLB model and optionally overrides its material.
 * Returns the scene object ready to render as a <primitive>.
 */
export function GLBModel({
  url,
  scale = 1,
  position = [0, 0, 0] as [number, number, number],
  rotation = [0, 0, 0] as [number, number, number],
  overrideMaterial,
  castShadow = true,
  receiveShadow = true,
}: {
  url: string;
  scale?: number | [number, number, number];
  position?: [number, number, number];
  rotation?: [number, number, number];
  overrideMaterial?: THREE.Material;
  castShadow?: boolean;
  receiveShadow?: boolean;
}) {
  const { scene } = useGLTF(url);

  const cloned = useMemo(() => {
    const clone = scene.clone(true);
    // Override materials if provided
    if (overrideMaterial) {
      clone.traverse((child: any) => {
        if (child.isMesh) {
          child.material = overrideMaterial;
          child.castShadow = castShadow;
          child.receiveShadow = receiveShadow;
        }
      });
    } else {
      clone.traverse((child: any) => {
        if (child.isMesh) {
          child.castShadow = castShadow;
          child.receiveShadow = receiveShadow;
        }
      });
    }
    return clone;
  }, [scene, overrideMaterial, castShadow, receiveShadow]);

  return (
    <primitive
      object={cloned}
      position={position}
      rotation={rotation}
      scale={scale}
    />
  );
}

/**
 * Renders a GLB storage tank model.
 * Used for storageTank and tank equipment types.
 */
export function GLBStorageTank({
  position,
  scale = 1,
  emphasized = false,
}: {
  position: [number, number, number];
  scale?: number;
  emphasized?: boolean;
}) {
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(emphasized ? "#7aa3c4" : "#5a7a8c"),
      metalness: 0.6,
      roughness: 0.5,
      emissive: new THREE.Color(emphasized ? "#3b82f6" : "#000000"),
      emissiveIntensity: emphasized ? 0.15 : 0,
    });
  }, [emphasized]);

  return (
    <GLBModel
      url={`${MODEL_DIR}/detail-tank.glb`}
      position={position}
      scale={scale}
      overrideMaterial={material}
    />
  );
}

/**
 * Renders GLB chimney models as part of the industrial backdrop.
 * Placed far away (120m+) so they're silhouettes on the horizon, not
 * competing with the plant equipment visually.
 */
export function GLBChimneys() {
  const positions: { file: string; pos: [number, number, number]; scale: number }[] = [
    { file: "chimney-large.glb", pos: [-90, 0, -70], scale: 10 },
    { file: "chimney-medium.glb", pos: [-85, 0, -75], scale: 7 },
    { file: "chimney-small.glb", pos: [85, 0, -70], scale: 6 },
    { file: "chimney-basic.glb", pos: [90, 0, -75], scale: 5 },
  ];

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color("#6b7280"),
      metalness: 0.4,
      roughness: 0.6,
    });
  }, []);

  return (
    <group>
      {positions.map((p, i) => (
        <GLBModel
          key={i}
          url={`${MODEL_DIR}/${p.file}`}
          position={p.pos}
          scale={p.scale}
          overrideMaterial={material}
        />
      ))}
    </group>
  );
}

/**
 * Renders GLB buildings as distant industrial backdrop.
 * Placed at 120m+ radius so they're clearly separated from the plant
 * (which occupies ~50m radius). Only 4 buildings to avoid clutter.
 */
export function GLBBuildings() {
  const positions = useMemo(() => {
    const arr: { file: string; pos: [number, number, number]; scale: number; rot: number }[] = [];
    const radius = 130;
    // Only use 4 buildings — less clutter, more distance
    const files = ["building-a.glb", "building-d.glb", "building-h.glb", "building-q.glb"];
    files.forEach((file, i) => {
      const angle = (i / files.length) * Math.PI * 2 + Math.PI / 4;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      arr.push({
        file,
        pos: [x, 0, z],
        scale: 12,
        rot: Math.random() * Math.PI * 2,
      });
    });
    return arr;
  }, []);

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color("#4a5568"),
      metalness: 0.3,
      roughness: 0.7,
    });
  }, []);

  return (
    <group>
      {positions.map((p, i) => (
        <GLBModel
          key={i}
          url={`${MODEL_DIR}/${p.file}`}
          position={p.pos}
          scale={p.scale}
          rotation={[0, p.rot, 0]}
          overrideMaterial={material}
        />
      ))}
    </group>
  );
}

// Preload models
useGLTF.preload(`${MODEL_DIR}/detail-tank.glb`);
useGLTF.preload(`${MODEL_DIR}/chimney-large.glb`);
