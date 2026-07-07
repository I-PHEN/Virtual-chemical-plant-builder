"use client";

import { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, Billboard } from "@react-three/drei";
import * as THREE from "three";
import type { EquipmentInstance } from "@/lib/plant/types";
import { getEquipmentMeta } from "@/lib/plant/equipmentLibrary";
import { EquipmentModel } from "./models/EquipmentModels";
import { useAppStore } from "@/lib/store/useAppStore";

interface EquipmentProps {
  equipment: EquipmentInstance;
}

export function Equipment({ equipment }: EquipmentProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const selectedId = useAppStore((s) => s.selectedEquipmentId);
  const focusId = useAppStore((s) => s.focusEquipmentId);
  const displayState = useAppStore((s) => s.displayStates[equipment.id] ?? "visible");
  const selectEquipment = useAppStore((s) => s.selectEquipment);
  const focusEquipment = useAppStore((s) => s.focusEquipment);

  const meta = getEquipmentMeta(equipment.type);
  const isSelected = selectedId === equipment.id;
  const isFocused = focusId === equipment.id;
  const isHidden = displayState === "hidden";
  const isHighlighted = displayState === "highlighted";

  const accentColor = useMemo(() => new THREE.Color(meta.color), [meta.color]);

  // gentle hover float
  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.position.y = equipment.position[1] + (hovered ? Math.sin(t * 2.5) * 0.04 : 0);
  });

  if (isHidden) {
    // still render faintly so the layout is legible
    return (
      <group ref={groupRef} position={equipment.position}>
        <EquipmentModel
          type={equipment.type}
          color={meta.color}
          dimmed
        />
      </group>
    );
  }

  return (
    <group
      ref={groupRef}
      position={equipment.position}
      rotation={equipment.rotation}
      scale={equipment.scale ?? 1}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
        document.body.style.cursor = "auto";
      }}
      onClick={(e) => {
        e.stopPropagation();
        selectEquipment(equipment.id);
        focusEquipment(equipment.id);
      }}
    >
      <EquipmentModel
        type={equipment.type}
        color={meta.color}
        emphasized={isHighlighted || isSelected || isFocused || hovered}
        selected={isSelected}
      />

      {/* selection ring on ground */}
      {(isSelected || isFocused) && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.0, 1.25, 48]} />
          <meshBasicMaterial color={accentColor} transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* floating label */}
      {(hovered || isSelected || isFocused) && (
        <Billboard position={[0, getLabelHeight(equipment.type), 0]}>
          <Html center distanceFactor={9} occlude={false}>
            <div
              style={{
                background: "rgba(15, 23, 42, 0.92)",
                color: "white",
                padding: "6px 10px",
                borderRadius: "8px",
                border: `1px solid ${meta.color}`,
                fontSize: "13px",
                fontFamily: "var(--font-geist-sans, sans-serif)",
                whiteSpace: "nowrap",
                pointerEvents: "none",
                boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
              }}
            >
              <div style={{ fontWeight: 600, fontSize: "13px" }}>{equipment.name}</div>
              <div style={{ opacity: 0.7, fontSize: "11px" }}>{meta.singularName}</div>
            </div>
          </Html>
        </Billboard>
      )}
    </group>
  );
}

function getLabelHeight(type: EquipmentInstance["type"]): number {
  switch (type) {
    case "column":
      return 4.0;
    case "reactor":
      return 3.2;
    case "separator":
      return 2.8;
    case "tank":
    case "storageTank":
      return 3.0;
    case "compressor":
      return 1.7;
    case "heatExchanger":
    case "cooler":
    case "heater":
      return 2.4;
    case "filter":
      return 2.0;
    case "motor":
      return 1.3;
    case "valve":
      return 1.6;
    default:
      return 2.0;
  }
}
