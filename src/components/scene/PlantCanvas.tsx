"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { useAppStore } from "@/lib/store/useAppStore";
import { Equipment } from "./Equipment";
import { PipeNetwork } from "./PipeNetwork";
import { CameraRig } from "./CameraRig";
import { Environment, Ground, IndustrialBackdrop, Foundation } from "./Environment";
import { CameraController } from "./CameraController";
import { PipeRackStructure, Bund, Platform, Stairway } from "./Structures";
import { SafetyShower, FireExtinguisher, WarningSign, DrainageChannel, ServiceRoad } from "./SafetySystems";

export function PlantCanvas() {
  const currentPlant = useAppStore((s) => s.currentPlant);
  const selectEquipment = useAppStore((s) => s.selectEquipment);

  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      className="absolute inset-0"
      onPointerMissed={() => selectEquipment(null)}
      gl={{
        antialias: true,
        powerPreference: "high-performance",
        toneMapping: 2,
        toneMappingExposure: 1.1,
      }}
    >
      <Suspense fallback={null}>
        <Environment theme={currentPlant?.theme} />
        <Ground />
        <IndustrialBackdrop theme={currentPlant?.theme} />
        <CameraController />
        {currentPlant && (
          <>
            {/* Concrete foundations under each equipment */}
            {currentPlant.equipment.map((eq) => (
              <Foundation key={`f-${eq.id}`} position={eq.position} size={getFoundationSize(eq.type)} />
            ))}

            {/* Process area bunds */}
            {currentPlant.areas?.filter(a => a.bunded).map((area) => (
              <Bund
                key={`b-${area.id}`}
                position={[area.footprint.x, 0, area.footprint.z]}
                size={[area.footprint.width, 0.6, area.footprint.depth]}
              />
            ))}

            {/* Pipe rack structures */}
            {currentPlant.racks?.map((rack) => (
              <PipeRackStructure
                key={`r-${rack.id}`}
                from={rack.from}
                to={rack.to}
                height={rack.height}
                levels={rack.levels}
              />
            ))}

            {/* Custom structures */}
            {currentPlant.structures?.map((s) => {
              if (s.kind === "platform") {
                return (
                  <Platform
                    key={`s-${s.id}`}
                    position={s.position}
                    size={s.size ? [s.size[0], s.size[2]] : [4, 4]}
                    height={s.size?.[1] ?? 4}
                  />
                );
              }
              if (s.kind === "stairway") {
                return (
                  <Stairway
                    key={`s-${s.id}`}
                    position={s.position}
                    rotation={s.rotation ?? 0}
                    height={s.size?.[1] ?? 4}
                  />
                );
              }
              if (s.kind === "bund") {
                return (
                  <Bund
                    key={`s-${s.id}`}
                    position={s.position}
                    size={s.size ? [s.size[0], s.size[1], s.size[2]] : [4, 0.6, 4]}
                  />
                );
              }
              return null;
            })}

            {/* Safety systems — distributed around the plant */}
            <SafetyShower position={[-6, 0, 6]} />
            <FireExtinguisher position={[4, 0, 4]} />
            <FireExtinguisher position={[-2, 0, -4]} />
            <WarningSign position={[0, 0, 8]} />
            <WarningSign position={[10, 0, -2]} color="#dc2626" />

            {/* Drainage channels along main aisles */}
            <DrainageChannel position={[0, 0, -1]} length={20} rotation={0} />

            {/* Service road on the perimeter */}
            <ServiceRoad position={[0, 0, 14]} length={30} width={4} rotation={0} />

            <PipeNetwork
              equipment={currentPlant.equipment}
              pipes={currentPlant.pipes}
              racks={currentPlant.racks}
            />
            {currentPlant.equipment.map((eq) => (
              <Equipment key={eq.id} equipment={eq} />
            ))}
            <CameraRig equipment={currentPlant.equipment} />
          </>
        )}
      </Suspense>

      <PerspectiveCamera makeDefault position={[8, 12, 18]} fov={50} near={0.1} far={200} />
    </Canvas>
  );
}

function getFoundationSize(type: string): number {
  switch (type) {
    case "storageTank": return 3.5;
    case "tank": return 2.5;
    case "reactor":
    case "column": return 2.2;
    case "compressor": return 4.0;
    case "heatExchanger":
    case "cooler":
    case "heater": return 3.0;
    case "separator": return 2.0;
    case "filter": return 2.0;
    case "pump":
    case "motor": return 2.2;
    case "valve": return 1.2;
    default: return 2.0;
  }
}
