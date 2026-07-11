"use client";

import { useEffect, useState, Suspense } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { EquipmentInstance, EquipmentType } from "@/lib/plant/types";
import { assetRegistry } from "@/lib/plant/registry";
import type { AssetManifest } from "@/lib/plant/registry/manifest";
import { EquipmentModel } from "./EquipmentModels";

/**
 * EquipmentRenderer — the smart dispatcher that picks GLB or procedural.
 *
 * Decision flow:
 *   1. On mount, ensure the asset registry is loaded from /assets/registry/.
 *   2. Look up a manifest for this equipment's type + plant context.
 *   3. If a GLB manifest exists AND its glbPath resolves (we just check that
 *      the manifest is non-null), use the GLB.
 *   4. Otherwise fall back to the procedural EquipmentModel.
 *
 * The GLB is wrapped in <Suspense> so the procedural model can show as a
 * fallback while the GLB streams in. This gives the user instant feedback
 * (the plant appears immediately) and then upgrades to GLB when ready.
 *
 * When you drop a real GLB at the manifest's glbPath, this component picks
 * it up automatically — no code changes needed.
 */

// Track whether the registry has been loaded on the client side
let registryLoadStarted = false;

function useRegistryReady(): boolean {
  const [ready, setReady] = useState(assetRegistry.all().length > 0);
  useEffect(() => {
    if (ready) return;
    if (!registryLoadStarted) {
      registryLoadStarted = true;
      assetRegistry.loadFromPublic().then(() => {
        setReady(assetRegistry.all().length > 0);
      });
    }
  }, [ready]);
  return ready;
}

interface EquipmentRendererProps {
  equipment: EquipmentInstance;
  color: string;
  emphasized?: boolean;
  dimmed?: boolean;
  selected?: boolean;
  plantId?: string;
}

export function EquipmentRenderer({
  equipment,
  color,
  emphasized,
  dimmed,
  selected,
  plantId,
}: EquipmentRendererProps) {
  useRegistryReady();

  // Look up a manifest for this equipment
  const manifest = assetRegistry.pickForEquipment(equipment.type, {
    plantId,
    tags: [], // could pass equipment.context as a tag if useful
    preferredTier: "hero",
  });

  // If we have a manifest, render the GLB (with procedural fallback while loading)
  if (manifest && !dimmed) {
    return (
      <Suspense
        fallback={
          <EquipmentModel
            type={equipment.type}
            color={color}
            emphasized={emphasized}
            dimmed={dimmed}
            selected={selected}
          />
        }
      >
        <GLBEquipment
          manifest={manifest}
          color={color}
          emphasized={emphasized}
          selected={selected}
        />
      </Suspense>
    );
  }

  // Procedural fallback
  return (
    <EquipmentModel
      type={equipment.type}
      color={color}
      emphasized={emphasized}
      dimmed={dimmed}
      selected={selected}
    />
  );
}

/**
 * Renders a single GLB model with optional material override.
 * The model is scaled to match the manifest's `scale` and rotated by
 * `rotationY` if specified.
 */
function GLBEquipment({
  manifest,
  color,
  emphasized,
  selected,
}: {
  manifest: AssetManifest;
  color: string;
  emphasized?: boolean;
  selected?: boolean;
}) {
  const { scene } = useGLTF(manifest.glbPath);

  // Clone the scene so we don't mutate the cached original
  const cloned = scene.clone(true);

  // Optionally override the material's color to match the equipment's color
  // (so a single reactor GLB can be painted red for ammonia, blue for water treatment, etc.)
  cloned.traverse((child: THREE.Object3D) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      const origMat = mesh.material as THREE.MeshStandardMaterial | undefined;
      if (origMat && origMat.color) {
        // Don't override — keep the model's authored PBR look
        // (color override looks bad on textured models)
      }
    }
  });

  // Selection highlight via emissive boost
  if (emphasized || selected) {
    cloned.traverse((child: THREE.Object3D) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (mat) {
          mat.emissive = new THREE.Color(color);
          mat.emissiveIntensity = selected ? 0.4 : 0.2;
        }
      }
    });
  }

  return (
    <primitive
      object={cloned}
      scale={manifest.scale}
      rotation={[0, manifest.rotationY ?? 0, 0]}
    />
  );
}

/**
 * Preload all GLB paths from the registry. Call this on the welcome screen
 * so models stream in while the user is typing their command.
 */
export function preloadRegistryModels() {
  void assetRegistry.loadFromPublic().then(() => {
    for (const manifest of assetRegistry.all()) {
      try {
        useGLTF.preload(manifest.glbPath);
      } catch {
        // path not yet present — ignore, will retry on next render
      }
    }
  });
}
