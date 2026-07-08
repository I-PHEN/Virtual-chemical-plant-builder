"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { useAppStore } from "@/lib/store/useAppStore";
import { Equipment } from "./Equipment";
import { PipeNetwork } from "./PipeNetwork";
import { CameraRig } from "./CameraRig";
import { Environment, Ground } from "./Environment";

export function PlantCanvas() {
  const currentPlant = useAppStore((s) => s.currentPlant);
  const selectEquipment = useAppStore((s) => s.selectEquipment);

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      className="absolute inset-0"
      onPointerMissed={() => selectEquipment(null)}
      gl={{
        antialias: true,
        powerPreference: "high-performance",
        toneMapping: 2, // ACESFilmicToneMapping
        toneMappingExposure: 1.05,
      }}
    >
      <Suspense fallback={null}>
        <Environment />
        <Ground />
        {currentPlant && (
          <>
            <PipeNetwork equipment={currentPlant.equipment} pipes={currentPlant.pipes} />
            {currentPlant.equipment.map((eq) => (
              <Equipment key={eq.id} equipment={eq} />
            ))}
            <CameraRig equipment={currentPlant.equipment} />
          </>
        )}
      </Suspense>

      <PerspectiveCamera makeDefault position={[8, 12, 18]} fov={50} near={0.1} far={400} />
    </Canvas>
  );
}
