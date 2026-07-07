"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { useAppStore } from "@/lib/store/useAppStore";
import { Equipment } from "./Equipment";
import { PipeNetwork } from "./PipeNetwork";
import { CameraRig } from "./CameraRig";
import { Ground, Lighting } from "./Environment";

export function PlantCanvas() {
  const currentPlant = useAppStore((s) => s.currentPlant);
  const selectEquipment = useAppStore((s) => s.selectEquipment);

  return (
    <Canvas
      shadows
      dpr={[1, 1.8]}
      className="absolute inset-0"
      onPointerMissed={() => selectEquipment(null)}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <color attach="background" args={["#0b1220"]} />
      <fog attach="fog" args={["#0b1220", 28, 75]} />

      <PerspectiveCamera makeDefault position={[0, 7, 18]} fov={50} near={0.1} far={300} />

      <Lighting />

      <Suspense fallback={null}>
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
    </Canvas>
  );
}
