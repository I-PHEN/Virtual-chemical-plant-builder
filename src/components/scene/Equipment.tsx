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
    if (hovered) {
      groupRef.current.position.y = equipment.position[1] + Math.sin(t * 2.5) * 0.04;
    } else {
      groupRef.current.position.y = THREE.MathUtils.lerp(
        groupRef.current.position.y,
        equipment.position[1],
        0.1
      );
    }
  });

  if (isHidden) {
    return (
      <group ref={groupRef} position={equipment.position}>
        <EquipmentModel type={equipment.type} color={meta.color} dimmed />
      </group>
    );
  }

  const isActive = isHighlighted || isSelected || isFocused || hovered;

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
        emphasized={isActive}
        selected={isSelected}
      />

      {/* selection ring on ground with glow */}
      {(isSelected || isFocused) && (
        <>
          <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.1, 1.4, 64]} />
            <meshBasicMaterial color={accentColor} transparent opacity={0.55} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.4, 1.6, 64]} />
            <meshBasicMaterial color={accentColor} transparent opacity={0.2} side={THREE.DoubleSide} />
          </mesh>
        </>
      )}

      {/* hover indicator — subtle dot */}
      {hovered && !isSelected && !isFocused && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.95, 1.05, 32]} />
          <meshBasicMaterial color={accentColor} transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Always-visible persistent label — small, doesn't shrink with distance */}
      {!isHidden && !isActive && (
        <Billboard position={[0, getLabelHeight(equipment.type), 0]}>
          <Html center occlude={false} zIndexRange={[20, 0]} prepend>
            <div
              style={{
                background: "rgba(8, 9, 12, 0.85)",
                color: "white",
                padding: "4px 10px",
                borderRadius: "6px",
                border: `1px solid ${meta.color}44`,
                borderLeft: `2px solid ${meta.color}`,
                fontSize: "12px",
                fontFamily: "var(--font-geist-sans, sans-serif)",
                fontWeight: 500,
                whiteSpace: "nowrap",
                pointerEvents: "none",
                boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                backdropFilter: "blur(6px)",
                userSelect: "none",
              }}
            >
              {equipment.name}
            </div>
          </Html>
        </Billboard>
      )}

      {/* Larger detailed label when active (hovered/selected/focused) */}
      {isActive && (
        <Billboard position={[0, getLabelHeight(equipment.type), 0]}>
          <Html center occlude={false} zIndexRange={[20, 0]}>
            <div
              style={{
                background: "rgba(2, 6, 23, 0.95)",
                color: "white",
                padding: "8px 14px",
                borderRadius: "10px",
                border: `1px solid ${meta.color}88`,
                borderLeft: `3px solid ${meta.color}`,
                fontSize: "15px",
                fontFamily: "var(--font-geist-sans, sans-serif)",
                whiteSpace: "nowrap",
                pointerEvents: "none",
                boxShadow: `0 8px 24px rgba(0,0,0,0.6), 0 0 20px ${meta.color}44`,
                backdropFilter: "blur(8px)",
              }}
            >
              <div style={{ fontWeight: 600, fontSize: "15px", lineHeight: 1.2 }}>
                {equipment.name}
              </div>
              <div style={{ opacity: 0.7, fontSize: "11px", marginTop: 3, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                {meta.singularName}
              </div>
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
      return 4.6;
    case "reactor":
      return 3.4;
    case "separator":
      return 3.0;
    case "tank":
      return 3.2;
    case "storageTank":
      return 3.8;
    case "heater":
      return 5.2;
    case "compressor":
      return 2.2;
    case "heatExchanger":
    case "cooler":
      return 2.0;
    case "filter":
      return 2.8;
    case "motor":
      return 1.5;
    case "valve":
      return 1.8;
    case "pump":
      return 2.4;
    default:
      return 2.5;
  }
}
