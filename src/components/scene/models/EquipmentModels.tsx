"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { EquipmentType } from "@/lib/plant/types";

/**
 * Procedural 3D equipment models built entirely from Three.js primitives.
 * This avoids needing external GLB assets while still giving each equipment
 * type a recognisable silhouette. Colours come from the equipment library.
 *
 * Each model is centred at the origin with its base roughly at y = 0.
 * The model file owns no state — colour & emphasis are passed in so the
 * same model can render in normal / highlighted / dimmed / selected states.
 */

interface ModelProps {
  color: string;
  emphasized?: boolean; // highlighted
  dimmed?: boolean; // hidden/ghosted
  selected?: boolean;
}

const dimFactor = 0.18;

function useMaterials(color: string, emphasized?: boolean, dimmed?: boolean) {
  return useMemo(() => {
    const base = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      metalness: 0.55,
      roughness: 0.4,
      transparent: dimmed,
      opacity: dimmed ? dimFactor : 1,
      emissive: new THREE.Color(color),
      emissiveIntensity: emphasized ? 0.45 : 0.05,
    });
    const dark = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#1f2937"),
      metalness: 0.7,
      roughness: 0.4,
      transparent: dimmed,
      opacity: dimmed ? dimFactor : 1,
    });
    const accent = new THREE.MeshStandardMaterial({
      color: new THREE.Color(emphasized ? "#fde68a" : "#e5e7eb"),
      metalness: 0.6,
      roughness: 0.3,
      transparent: dimmed,
      opacity: dimmed ? dimFactor : 1,
      emissive: new THREE.Color(emphasized ? "#fde68a" : "#000000"),
      emissiveIntensity: emphasized ? 0.35 : 0,
    });
    return { base, dark, accent };
  }, [color, emphasized, dimmed]);
}

// ─────────────── Pump ───────────────
function PumpModel({ color, emphasized, dimmed }: ModelProps) {
  const { base, dark, accent } = useMaterials(color, emphasized, dimmed);
  return (
    <group>
      {/* volute casing */}
      <mesh material={base} castShadow position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.55, 0.55, 0.6, 24]} />
      </mesh>
      {/* suction nozzle (front) */}
      <mesh material={dark} position={[0, 0.45, 0.7]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.4, 16]} />
      </mesh>
      {/* discharge nozzle (top) */}
      <mesh material={dark} position={[0, 1.1, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.4, 16]} />
      </mesh>
      {/* impeller hub */}
      <mesh material={accent} position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.3, 16]} />
      </mesh>
      {/* motor */}
      <mesh material={dark} position={[0, 1.45, 0]}>
        <cylinderGeometry args={[0.32, 0.32, 0.5, 24]} />
      </mesh>
      {/* motor fins */}
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh key={i} material={dark} position={[0, 1.45, 0]} rotation={[0, (i / 12) * Math.PI * 2, 0]}>
          <boxGeometry args={[0.66, 0.4, 0.04]} />
        </mesh>
      ))}
      {/* baseplate */}
      <mesh material={accent} position={[0, 0.05, 0]}>
        <boxGeometry args={[1.6, 0.1, 1.0]} />
      </mesh>
    </group>
  );
}

// ─────────────── Tank / StorageTank ───────────────
function TankModel({ color, emphasized, dimmed, large }: ModelProps & { large?: boolean }) {
  const { base, dark, accent } = useMaterials(color, emphasized, dimmed);
  const r = large ? 1.1 : 0.8;
  const h = large ? 2.6 : 2.0;
  return (
    <group>
      {/* body */}
      <mesh material={base} castShadow position={[0, h / 2 + 0.2, 0]}>
        <cylinderGeometry args={[r, r, h, 32]} />
      </mesh>
      {/* dished top */}
      <mesh material={base} position={[0, h + 0.2, 0]}>
        <sphereGeometry args={[r, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2.5]} />
      </mesh>
      {/* bottom */}
      <mesh material={dark} position={[0, 0.2, 0]}>
        <sphereGeometry args={[r, 32, 16, 0, Math.PI * 2, Math.PI - Math.PI / 2.5, Math.PI / 2.5]} />
      </mesh>
      {/* bands */}
      <mesh material={accent} position={[0, h * 0.35 + 0.2, 0]}>
        <torusGeometry args={[r + 0.01, 0.025, 8, 32]} />
      </mesh>
      <mesh material={accent} position={[0, h * 0.7 + 0.2, 0]}>
        <torusGeometry args={[r + 0.01, 0.025, 8, 32]} />
      </mesh>
      {/* inlet nozzle top */}
      <mesh material={dark} position={[0, h + 0.45, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.4, 12]} />
      </mesh>
      {/* outlet nozzle side */}
      <mesh material={dark} position={[r + 0.1, 0.45, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.12, 0.12, 0.3, 12]} />
      </mesh>
      {/* ladder */}
      <mesh material={dark} position={[r + 0.1, h / 2 + 0.2, 0]}>
        <boxGeometry args={[0.04, h * 0.85, 0.04]} />
      </mesh>
      <mesh material={dark} position={[r + 0.1, h * 0.3 + 0.2, 0.1]}>
        <boxGeometry args={[0.04, 0.04, 0.2]} />
      </mesh>
      <mesh material={dark} position={[r + 0.1, h * 0.55 + 0.2, 0.1]}>
        <boxGeometry args={[0.04, 0.04, 0.2]} />
      </mesh>
      <mesh material={dark} position={[r + 0.1, h * 0.8 + 0.2, 0.1]}>
        <boxGeometry args={[0.04, 0.04, 0.2]} />
      </mesh>
    </group>
  );
}

// ─────────────── Reactor ───────────────
function ReactorModel({ color, emphasized, dimmed }: ModelProps) {
  const { base, dark, accent } = useMaterials(color, emphasized, dimmed);
  const h = 2.4;
  const r = 0.7;
  return (
    <group>
      {/* vessel */}
      <mesh material={base} castShadow position={[0, h / 2 + 0.2, 0]}>
        <cylinderGeometry args={[r, r, h, 24]} />
      </mesh>
      {/* top head */}
      <mesh material={base} position={[0, h + 0.2, 0]}>
        <sphereGeometry args={[r, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2.5]} />
      </mesh>
      {/* bottom head */}
      <mesh material={dark} position={[0, 0.2, 0]}>
        <sphereGeometry args={[r, 24, 12, 0, Math.PI * 2, Math.PI - Math.PI / 2.5, Math.PI / 2.5]} />
      </mesh>
      {/* catalyst bed highlight (interior ring) */}
      <mesh material={accent} position={[0, h * 0.5 + 0.2, 0]}>
        <torusGeometry args={[r - 0.04, 0.04, 8, 32]} />
      </mesh>
      <mesh material={accent} position={[0, h * 0.3 + 0.2, 0]}>
        <torusGeometry args={[r - 0.04, 0.04, 8, 32]} />
      </mesh>
      {/* inlet (top) */}
      <mesh material={dark} position={[0, h + 0.55, 0]}>
        <cylinderGeometry args={[0.14, 0.14, 0.4, 12]} />
      </mesh>
      {/* outlet (bottom side) */}
      <mesh material={dark} position={[r + 0.1, 0.45, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.14, 0.14, 0.3, 12]} />
      </mesh>
      {/* temperature jacket ports */}
      <mesh material={accent} position={[r - 0.05, h * 0.7 + 0.2, 0.3]}>
        <boxGeometry args={[0.18, 0.06, 0.06]} />
      </mesh>
      <mesh material={accent} position={[r - 0.05, h * 0.4 + 0.2, 0.3]}>
        <boxGeometry args={[0.18, 0.06, 0.06]} />
      </mesh>
      {/* skirt support */}
      <mesh material={dark} position={[0, 0.05, 0]}>
        <cylinderGeometry args={[r * 0.85, r * 0.95, 0.1, 24]} />
      </mesh>
    </group>
  );
}

// ─────────────── HeatExchanger ───────────────
function HeatExchangerModel({ color, emphasized, dimmed }: ModelProps) {
  const { base, dark, accent } = useMaterials(color, emphasized, dimmed);
  const len = 2.2;
  const r = 0.35;
  return (
    <group rotation={[0, 0, Math.PI / 2]} position={[0, 0.8, 0]}>
      {/* shell */}
      <mesh material={base} castShadow>
        <cylinderGeometry args={[r, r, len, 24]} />
      </mesh>
      {/* channel covers */}
      <mesh material={dark} position={[len / 2, 0, 0]}>
        <cylinderGeometry args={[r * 1.1, r * 1.1, 0.15, 24]} />
      </mesh>
      <mesh material={dark} position={[-len / 2, 0, 0]}>
        <cylinderGeometry args={[r * 1.1, r * 1.1, 0.15, 24]} />
      </mesh>
      {/* tubes hint (bands around the shell) */}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={i} material={accent} position={[-len / 2 + 0.4 + (i * len) / 6, 0, 0]}>
          <torusGeometry args={[r + 0.01, 0.018, 6, 24]} />
        </mesh>
      ))}
      {/* nozzles */}
      <mesh material={dark} position={[0, r + 0.1, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.3, 12]} />
      </mesh>
      <mesh material={dark} position={[0, -r - 0.1, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.3, 12]} />
      </mesh>
      <mesh material={dark} position={[len / 2 - 0.3, 0, r + 0.1]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.3, 12]} />
      </mesh>
      <mesh material={dark} position={[-len / 2 + 0.3, 0, -r - 0.1]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.3, 12]} />
      </mesh>
      {/* saddle supports */}
      <mesh material={accent} position={[len * 0.25, -r - 0.2, 0]}>
        <boxGeometry args={[0.1, 0.4, r * 1.6]} />
      </mesh>
      <mesh material={accent} position={[-len * 0.25, -r - 0.2, 0]}>
        <boxGeometry args={[0.1, 0.4, r * 1.6]} />
      </mesh>
    </group>
  );
}

// ─────────────── Cooler (like a smaller HX with cooling-water feel) ───────────────
function CoolerModel({ color, emphasized, dimmed }: ModelProps) {
  const { base, dark, accent } = useMaterials(color, emphasized, dimmed);
  const len = 1.8;
  const r = 0.3;
  return (
    <group rotation={[0, 0, Math.PI / 2]} position={[0, 0.7, 0]}>
      <mesh material={base} castShadow>
        <cylinderGeometry args={[r, r, len, 20]} />
      </mesh>
      <mesh material={dark} position={[len / 2, 0, 0]}>
        <cylinderGeometry args={[r * 1.1, r * 1.1, 0.12, 20]} />
      </mesh>
      <mesh material={dark} position={[-len / 2, 0, 0]}>
        <cylinderGeometry args={[r * 1.1, r * 1.1, 0.12, 20]} />
      </mesh>
      {/* cooling fins */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} material={accent} position={[-len / 2 + 0.25 + (i * len) / 9, 0, 0]}>
          <torusGeometry args={[r + 0.02, 0.015, 6, 20]} />
        </mesh>
      ))}
      <mesh material={dark} position={[0, r + 0.1, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.25, 12]} />
      </mesh>
      <mesh material={dark} position={[0, -r - 0.1, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.25, 12]} />
      </mesh>
      <mesh material={accent} position={[len * 0.3, -r - 0.25, 0]}>
        <boxGeometry args={[0.1, 0.35, r * 1.4]} />
      </mesh>
      <mesh material={accent} position={[-len * 0.3, -r - 0.25, 0]}>
        <boxGeometry args={[0.1, 0.35, r * 1.4]} />
      </mesh>
    </group>
  );
}

// ─────────────── Compressor ───────────────
function CompressorModel({ color, emphasized, dimmed }: ModelProps) {
  const { base, dark, accent } = useMaterials(color, emphasized, dimmed);
  return (
    <group>
      {/* baseplate */}
      <mesh material={accent} position={[0, 0.05, 0]}>
        <boxGeometry args={[2.4, 0.1, 1.0]} />
      </mesh>
      {/* compressor body (horizontally laid barrel) */}
      <mesh material={base} castShadow position={[0.2, 0.75, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.45, 0.45, 1.4, 24]} />
      </mesh>
      {/* stage dividers */}
      <mesh material={dark} position={[0.2 - 0.4, 0.75, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.46, 0.46, 0.04, 24]} />
      </mesh>
      <mesh material={dark} position={[0.2 + 0.4, 0.75, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.46, 0.46, 0.04, 24]} />
      </mesh>
      {/* suction (left) */}
      <mesh material={dark} position={[-0.7, 0.75, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.16, 0.16, 0.4, 16]} />
      </mesh>
      {/* discharge (right) */}
      <mesh material={dark} position={[1.1, 0.75, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.16, 0.16, 0.4, 16]} />
      </mesh>
      {/* motor */}
      <mesh material={dark} position={[-0.9, 0.6, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.7, 24]} rotation={[0, 0, Math.PI / 2]} />
      </mesh>
      <mesh material={dark} position={[-0.9, 0.6, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.3, 0.3, 0.7, 24]} />
      </mesh>
      {/* coupling */}
      <mesh material={accent} position={[-0.45, 0.7, 0]}>
        <boxGeometry args={[0.18, 0.18, 0.18]} />
      </mesh>
      {/* control panel */}
      <mesh material={accent} position={[0.5, 1.2, 0.55]}>
        <boxGeometry args={[0.4, 0.4, 0.1]} />
      </mesh>
    </group>
  );
}

// ─────────────── Column ───────────────
function ColumnModel({ color, emphasized, dimmed }: ModelProps) {
  const { base, dark, accent } = useMaterials(color, emphasized, dimmed);
  const h = 3.2;
  const r = 0.55;
  return (
    <group>
      {/* vessel */}
      <mesh material={base} castShadow position={[0, h / 2 + 0.2, 0]}>
        <cylinderGeometry args={[r, r, h, 24]} />
      </mesh>
      {/* top head */}
      <mesh material={base} position={[0, h + 0.2, 0]}>
        <sphereGeometry args={[r, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2.5]} />
      </mesh>
      {/* bottom head */}
      <mesh material={dark} position={[0, 0.2, 0]}>
        <sphereGeometry args={[r, 24, 12, 0, Math.PI * 2, Math.PI - Math.PI / 2.5, Math.PI / 2.5]} />
      </mesh>
      {/* tray lines */}
      {Array.from({ length: 7 }).map((_, i) => (
        <mesh key={i} material={accent} position={[0, 0.6 + (i * (h - 0.6)) / 6, 0]}>
          <torusGeometry args={[r + 0.005, 0.022, 6, 24]} />
        </mesh>
      ))}
      {/* overhead vapour outlet */}
      <mesh material={dark} position={[0, h + 0.5, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.4, 12]} />
      </mesh>
      {/* reflux inlet */}
      <mesh material={dark} position={[0.35, h + 0.1, 0]} rotation={[0, 0, Math.PI / 2.4]}>
        <cylinderGeometry args={[0.1, 0.1, 0.5, 12]} />
      </mesh>
      {/* feed nozzle */}
      <mesh material={dark} position={[-r - 0.12, h * 0.5 + 0.2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.13, 0.13, 0.4, 12]} />
      </mesh>
      {/* bottoms outlet */}
      <mesh material={dark} position={[0, 0.05, r + 0.1]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.13, 0.13, 0.4, 12]} />
      </mesh>
      {/* access ladder */}
      <mesh material={dark} position={[r + 0.12, h / 2 + 0.2, 0]}>
        <boxGeometry args={[0.04, h * 0.85, 0.04]} />
      </mesh>
      {/* platform */}
      <mesh material={accent} position={[r + 0.4, h * 0.7 + 0.2, 0]}>
        <boxGeometry args={[0.7, 0.04, 0.8]} />
      </mesh>
    </group>
  );
}

// ─────────────── Separator ───────────────
function SeparatorModel({ color, emphasized, dimmed }: ModelProps) {
  const { base, dark, accent } = useMaterials(color, emphasized, dimmed);
  const h = 2.0;
  const r = 0.55;
  return (
    <group>
      <mesh material={base} castShadow position={[0, h / 2 + 0.2, 0]}>
        <cylinderGeometry args={[r, r, h, 24]} />
      </mesh>
      <mesh material={base} position={[0, h + 0.2, 0]}>
        <sphereGeometry args={[r, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2.5]} />
      </mesh>
      <mesh material={dark} position={[0, 0.2, 0]}>
        <sphereGeometry args={[r, 24, 12, 0, Math.PI * 2, Math.PI - Math.PI / 2.5, Math.PI / 2.5]} />
      </mesh>
      {/* demister line */}
      <mesh material={accent} position={[0, h * 0.8 + 0.2, 0]}>
        <torusGeometry args={[r - 0.02, 0.03, 6, 24]} />
      </mesh>
      {/* gas outlet top */}
      <mesh material={dark} position={[0, h + 0.5, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.4, 12]} />
      </mesh>
      {/* two-phase inlet (tangential) */}
      <mesh material={dark} position={[r + 0.05, h * 0.7 + 0.2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.13, 0.13, 0.4, 12]} />
      </mesh>
      {/* liquid outlet bottom */}
      <mesh material={dark} position={[0, 0.1, r + 0.05]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.4, 12]} />
      </mesh>
      {/* level gauge */}
      <mesh material={accent} position={[r + 0.1, h * 0.4 + 0.2, 0.25]}>
        <boxGeometry args={[0.05, h * 0.5, 0.05]} />
      </mesh>
    </group>
  );
}

// ─────────────── Valve ───────────────
function ValveModel({ color, emphasized, dimmed }: ModelProps) {
  const { base, dark, accent } = useMaterials(color, emphasized, dimmed);
  return (
    <group>
      {/* body */}
      <mesh material={base} castShadow position={[0, 0.45, 0]}>
        <boxGeometry args={[0.55, 0.35, 0.55]} />
      </mesh>
      {/* flanges */}
      <mesh material={dark} position={[0.45, 0.45, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.08, 16]} rotation={[0, 0, Math.PI / 2]} />
      </mesh>
      <mesh material={dark} position={[-0.45, 0.45, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.08, 16]} rotation={[0, 0, Math.PI / 2]} />
      </mesh>
      {/* bonnet */}
      <mesh material={dark} position={[0, 0.75, 0]}>
        <cylinderGeometry args={[0.12, 0.16, 0.25, 16]} />
      </mesh>
      {/* stem */}
      <mesh material={accent} position={[0, 0.95, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.3, 12]} />
      </mesh>
      {/* handwheel */}
      <mesh material={accent} position={[0, 1.12, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.22, 0.025, 8, 24]} />
      </mesh>
      <mesh material={accent} position={[0, 1.12, 0]}>
        <boxGeometry args={[0.44, 0.03, 0.04]} />
      </mesh>
      <mesh material={accent} position={[0, 1.12, 0]}>
        <boxGeometry args={[0.04, 0.03, 0.44]} />
      </mesh>
    </group>
  );
}

// ─────────────── Heater (fired) ───────────────
function HeaterModel({ color, emphasized, dimmed }: ModelProps) {
  const { base, dark, accent } = useMaterials(color, emphasized, dimmed);
  return (
    <group>
      {/* firebox */}
      <mesh material={base} castShadow position={[0, 1.0, 0]}>
        <boxGeometry args={[1.4, 2.0, 1.4]} />
      </mesh>
      {/* refractory inner glow */}
      <mesh material={accent} position={[0, 0.8, 0]}>
        <boxGeometry args={[1.1, 1.6, 1.1]} />
      </mesh>
      {/* burner front */}
      <mesh material={dark} position={[0, 0.25, 0.72]}>
        <cylinderGeometry args={[0.2, 0.25, 0.2, 16]} rotation={[Math.PI / 2, 0, 0]} />
      </mesh>
      {/* stack */}
      <mesh material={dark} position={[0, 2.8, 0]}>
        <cylinderGeometry args={[0.3, 0.35, 1.6, 16]} />
      </mesh>
      {/* tube coil hint */}
      <mesh material={accent} position={[0.55, 1.0, 0]}>
        <torusGeometry args={[0.18, 0.04, 8, 16, Math.PI]} rotation={[0, Math.PI / 2, 0]} />
      </mesh>
      <mesh material={accent} position={[-0.55, 1.0, 0]}>
        <torusGeometry args={[0.18, 0.04, 8, 16, Math.PI]} rotation={[0, -Math.PI / 2, 0]} />
      </mesh>
    </group>
  );
}

// ─────────────── Filter ───────────────
function FilterModel({ color, emphasized, dimmed }: ModelProps) {
  const { base, dark, accent } = useMaterials(color, emphasized, dimmed);
  return (
    <group>
      <mesh material={base} castShadow position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.55, 0.55, 1.5, 24]} />
      </mesh>
      <mesh material={dark} position={[0, 1.65, 0]}>
        <cylinderGeometry args={[0.6, 0.6, 0.15, 24]} />
      </mesh>
      <mesh material={dark} position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.6, 0.6, 0.15, 24]} />
      </mesh>
      <mesh material={dark} position={[0.6, 0.8, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.12, 0.12, 0.3, 12]} />
      </mesh>
      <mesh material={dark} position={[-0.6, 0.8, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.12, 0.12, 0.3, 12]} />
      </mesh>
      {/* cartridge lines */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={i} material={accent} position={[0, 0.8, 0]} rotation={[0, (i / 6) * Math.PI * 2, 0]}>
          <boxGeometry args={[0.04, 1.2, 0.04]} />
        </mesh>
      ))}
    </group>
  );
}

// ─────────────── Motor ───────────────
function MotorModel({ color, emphasized, dimmed }: ModelProps) {
  const { base, dark, accent } = useMaterials(color, emphasized, dimmed);
  return (
    <group>
      <mesh material={accent} position={[0, 0.05, 0]}>
        <boxGeometry args={[1.4, 0.1, 0.9]} />
      </mesh>
      <mesh material={base} castShadow position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 0.9, 24]} rotation={[0, 0, Math.PI / 2]} />
      </mesh>
      <mesh material={base} position={[0, 0.55, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.4, 0.4, 0.9, 24]} />
      </mesh>
      {/* cooling fins */}
      {Array.from({ length: 14 }).map((_, i) => (
        <mesh key={i} material={dark} position={[0, 0.55, 0]} rotation={[0, (i / 14) * Math.PI * 2, 0]}>
          <boxGeometry args={[0.85, 0.36, 0.02]} />
        </mesh>
      ))}
      {/* terminal box */}
      <mesh material={dark} position={[0, 0.95, 0]}>
        <boxGeometry args={[0.4, 0.25, 0.3]} />
      </mesh>
      {/* shaft */}
      <mesh material={accent} position={[0.6, 0.55, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.06, 0.06, 0.4, 12]} />
      </mesh>
    </group>
  );
}

// ─────────────── Dispatcher ───────────────
export interface EquipmentModelProps extends ModelProps {
  type: EquipmentType;
}

export function EquipmentModel({ type, color, emphasized, dimmed, selected }: EquipmentModelProps) {
  const props: ModelProps = { color, emphasized, dimmed, selected };
  switch (type) {
    case "pump":
      return <PumpModel {...props} />;
    case "tank":
      return <TankModel {...props} />;
    case "storageTank":
      return <TankModel {...props} large />;
    case "reactor":
      return <ReactorModel {...props} />;
    case "heatExchanger":
      return <HeatExchangerModel {...props} />;
    case "heater":
      return <HeaterModel {...props} />;
    case "cooler":
      return <CoolerModel {...props} />;
    case "compressor":
      return <CompressorModel {...props} />;
    case "column":
      return <ColumnModel {...props} />;
    case "separator":
      return <SeparatorModel {...props} />;
    case "valve":
      return <ValveModel {...props} />;
    case "filter":
      return <FilterModel {...props} />;
    case "motor":
      return <MotorModel {...props} />;
    default:
      return (
        <mesh material={undefined}>
          <boxGeometry args={[1, 1, 1]} />
        </mesh>
      );
  }
}
