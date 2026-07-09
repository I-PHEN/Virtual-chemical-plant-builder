"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { EquipmentType } from "@/lib/plant/types";

/**
 * Parametric equipment component library.
 *
 * Every unit operation is its own component with real-world proportions
 * encoded as parameters (diameter, heightRatio). A CSTR is squat
 * (height ≈ 1–1.5× diameter), a distillation column is tall and slender
 * (height 10–20× diameter), a heat exchanger is horizontal and smaller.
 *
 * Remove the labels and an engineering student should tell them apart
 * by silhouette alone.
 *
 * Materials use distinct PBR families: carbon steel, stainless, insulation
 * cladding, painted structural steel. All use MeshStandardMaterial — never
 * MeshBasicMaterial.
 */

interface ModelProps {
  color: string;
  emphasized?: boolean;
  dimmed?: boolean;
  selected?: boolean;
}

// ─── Material families ────────────────────────────────────────────────

function useMaterials(color: string, emphasized?: boolean, dimmed?: boolean) {
  return useMemo(() => {
    const transparent = dimmed ?? false;
    const opacity = dimmed ? 0.16 : 1;

    // Carbon steel — vessels, tanks. Cool grey-blue, medium metalness.
    const carbonSteel = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      metalness: 0.7,
      roughness: 0.45,
      transparent,
      opacity,
      emissive: new THREE.Color(color),
      emissiveIntensity: emphasized ? 0.12 : 0,
    });

    // Stainless steel — pipes, nozzles, bright fittings. Lower roughness.
    const stainless = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#9ca3af"),
      metalness: 0.85,
      roughness: 0.28,
      transparent,
      opacity,
    });

    // Dark steel — flanges, motor housings, structural.
    const darkSteel = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#374151"),
      metalness: 0.75,
      roughness: 0.4,
      transparent,
      opacity,
    });

    // Painted structural steel — safety yellow, matte.
    const paintedSteel = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#facc15"),
      metalness: 0.3,
      roughness: 0.75,
      transparent,
      opacity,
    });

    // Insulation cladding — off-white, low metalness.
    const insulation = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#d1d5db"),
      metalness: 0.25,
      roughness: 0.65,
      transparent,
      opacity,
    });

    // Glass — level gauges, sight glasses.
    const glass = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      metalness: 0.1,
      roughness: 0.12,
      transparent: true,
      opacity: dimmed ? 0.05 : 0.4,
      emissive: new THREE.Color(color),
      emissiveIntensity: emphasized ? 0.25 : 0.08,
    });

    // Rubber / gasket — black, very rough.
    const rubber = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#1f2937"),
      metalness: 0.1,
      roughness: 0.9,
      transparent,
      opacity,
    });

    // Hazard — red valves, emergency equipment.
    const hazard = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#dc2626"),
      metalness: 0.4,
      roughness: 0.5,
      transparent,
      opacity,
    });

    return { carbonSteel, stainless, darkSteel, paintedSteel, insulation, glass, rubber, hazard };
  }, [color, emphasized, dimmed]);
}

// ─── Repeated parts (instanced) ────────────────────────────────────────

/** Bolted flange ring — instanced at pipe joints and nozzles */
function FlangeRing({ position, radius = 0.18, material }: { position: [number, number, number]; radius?: number; material: THREE.Material }) {
  return (
    <mesh position={position} castShadow material={material}>
      <cylinderGeometry args={[radius, radius, 0.05, 20]} />
    </mesh>
  );
}

/** Bolts around a flange — simple instanced spheres */
function FlangeBolts({ radius, y, count, material }: { radius: number; y: number; count: number; material: THREE.Material }) {
  const positions = useMemo(() => {
    const arr: [number, number, number][] = [];
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      arr.push([Math.cos(a) * radius, y, Math.sin(a) * radius]);
    }
    return arr;
  }, [radius, y, count]);
  return (
    <group>
      {positions.map((p, i) => (
        <mesh key={i} position={p} material={material}>
          <cylinderGeometry args={[0.022, 0.022, 0.04, 6]} />
        </mesh>
      ))}
    </group>
  );
}

/** Tray ring — for distillation columns (instanced along height) */
function TrayRings({ count, radius, height, startY, material }: { count: number; radius: number; height: number; startY: number; material: THREE.Material }) {
  const positions = useMemo(() => {
    const arr: [number, number, number][] = [];
    for (let i = 0; i < count; i++) {
      arr.push([0, startY + (i * height) / count, 0]);
    }
    return arr;
  }, [count, height, startY]);
  return (
    <group>
      {positions.map((p, i) => (
        <mesh key={i} position={p} material={material}>
          <torusGeometry args={[radius + 0.005, 0.025, 6, 24]} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Equipment components ──────────────────────────────────────────────

/** CSTR / Stirred Tank Reactor — squat vessel (height ≈ 1.3× diameter) */
function StirredReactor({ color, emphasized, dimmed }: ModelProps) {
  const m = useMaterials(color, emphasized, dimmed);
  const diameter = 1.8;
  const height = diameter * 1.3; // squat
  const r = diameter / 2;

  return (
    <group>
      {/* Support skirt */}
      <mesh position={[0, 0.2, 0]} castShadow material={m.darkSteel}>
        <cylinderGeometry args={[r * 0.75, r * 0.85, 0.4, 24]} />
      </mesh>

      {/* Vessel shell */}
      <mesh position={[0, height / 2 + 0.4, 0]} castShadow receiveShadow material={m.carbonSteel}>
        <cylinderGeometry args={[r, r, height, 40]} />
      </mesh>

      {/* External jacket — slightly larger shell with gap */}
      <mesh position={[0, height / 2 + 0.4, 0]} material={m.insulation}>
        <cylinderGeometry args={[r + 0.06, r + 0.06, height * 0.85, 36]} />
      </mesh>

      {/* Dished top head */}
      <mesh position={[0, height + 0.4, 0]} material={m.carbonSteel}>
        <sphereGeometry args={[r, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2.8]} />
      </mesh>

      {/* Dished bottom head */}
      <mesh position={[0, 0.4, 0]} material={m.carbonSteel}>
        <sphereGeometry args={[r, 32, 16, 0, Math.PI * 2, Math.PI - Math.PI / 2.8, Math.PI / 2.8]} />
      </mesh>

      {/* Motor housing + gearbox on top */}
      <mesh position={[0, height + 0.7, 0]} castShadow material={m.darkSteel}>
        <cylinderGeometry args={[0.18, 0.22, 0.3, 16]} />
      </mesh>
      <mesh position={[0, height + 1.0, 0]} castShadow material={m.darkSteel}>
        <cylinderGeometry args={[0.28, 0.28, 0.35, 20]} />
      </mesh>

      {/* Agitator shaft (visible through glass or implied) */}
      <mesh position={[0, height / 2 + 0.4, 0]} material={m.stainless}>
        <cylinderGeometry args={[0.04, 0.04, height * 0.9, 8]} />
      </mesh>

      {/* Inlet/outlet nozzles */}
      <mesh position={[r + 0.08, height * 0.7 + 0.4, 0]} rotation={[0, 0, Math.PI / 2]} material={m.stainless}>
        <cylinderGeometry args={[0.1, 0.1, 0.25, 12]} />
      </mesh>
      <FlangeRing position={[r + 0.2, height * 0.7 + 0.4, 0]} material={m.stainless} />

      <mesh position={[-r - 0.08, height * 0.3 + 0.4, 0]} rotation={[0, 0, Math.PI / 2]} material={m.stainless}>
        <cylinderGeometry args={[0.1, 0.1, 0.25, 12]} />
      </mesh>
      <FlangeRing position={[-r - 0.2, height * 0.3 + 0.4, 0]} material={m.stainless} />

      {/* Temperature probe */}
      <mesh position={[r - 0.1, height * 0.5 + 0.4, r * 0.6]} rotation={[Math.PI / 2.5, 0, 0]} material={m.stainless}>
        <cylinderGeometry args={[0.025, 0.025, 0.3, 8]} />
      </mesh>
    </group>
  );
}

/** PFR / Fixed-bed Reactor — tall pressure vessel with catalyst bed */
function FixedBedReactor({ color, emphasized, dimmed }: ModelProps) {
  const m = useMaterials(color, emphasized, dimmed);
  const diameter = 1.4;
  const height = diameter * 3.5; // taller than CSTR, but not as slender as column
  const r = diameter / 2;

  return (
    <group>
      {/* Support skirt */}
      <mesh position={[0, 0.2, 0]} castShadow material={m.darkSteel}>
        <cylinderGeometry args={[r * 0.8, r * 0.9, 0.4, 24]} />
      </mesh>

      {/* Tall pressure vessel */}
      <mesh position={[0, height / 2 + 0.4, 0]} castShadow receiveShadow material={m.carbonSteel}>
        <cylinderGeometry args={[r, r, height, 32]} />
      </mesh>

      {/* Catalyst bed rings (internal, visible through slight emissive) */}
      <TrayRings count={5} radius={r - 0.05} height={height * 0.6} startY={height * 0.2 + 0.4} material={m.stainless} />

      {/* Domed top head */}
      <mesh position={[0, height + 0.4, 0]} material={m.carbonSteel}>
        <sphereGeometry args={[r, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2.5]} />
      </mesh>

      {/* Bottom head */}
      <mesh position={[0, 0.4, 0]} material={m.carbonSteel}>
        <sphereGeometry args={[r, 32, 16, 0, Math.PI * 2, Math.PI - Math.PI / 2.5, Math.PI / 2.5]} />
      </mesh>

      {/* Top flange (bolted) */}
      <mesh position={[0, height + 0.35, 0]} material={m.stainless}>
        <cylinderGeometry args={[r + 0.1, r + 0.1, 0.08, 32]} />
      </mesh>
      <FlangeBolts radius={r + 0.08} y={height + 0.35} count={16} material={m.stainless} />

      {/* Inlet nozzle (top) */}
      <mesh position={[0, height + 0.7, 0]} material={m.stainless}>
        <cylinderGeometry args={[0.12, 0.12, 0.3, 12]} />
      </mesh>
      <FlangeRing position={[0, height + 0.85, 0]} material={m.stainless} />

      {/* Outlet nozzle (bottom side) */}
      <mesh position={[r + 0.08, 0.5, 0]} rotation={[0, 0, Math.PI / 2]} material={m.stainless}>
        <cylinderGeometry args={[0.12, 0.12, 0.25, 12]} />
      </mesh>
      <FlangeRing position={[r + 0.2, 0.5, 0]} material={m.stainless} />

      {/* Temperature probes (3 at different heights) */}
      {[0.3, 0.5, 0.7].map((h, i) => (
        <mesh key={i} position={[r - 0.1, height * h + 0.4, r * 0.6]} rotation={[Math.PI / 2.5, 0, 0]} material={m.stainless}>
          <cylinderGeometry args={[0.022, 0.022, 0.35, 8]} />
        </mesh>
      ))}
    </group>
  );
}

/** Distillation Column — tall slender vessel (height 12× diameter) */
function DistillationColumn({ color, emphasized, dimmed }: ModelProps) {
  const m = useMaterials(color, emphasized, dimmed);
  const diameter = 1.0;
  const height = diameter * 12; // very tall and slender
  const r = diameter / 2;

  return (
    <group>
      {/* Support skirt */}
      <mesh position={[0, 0.25, 0]} castShadow material={m.darkSteel}>
        <cylinderGeometry args={[r * 0.85, r * 0.95, 0.5, 24]} />
      </mesh>

      {/* Tall slender shell */}
      <mesh position={[0, height / 2 + 0.5, 0]} castShadow receiveShadow material={m.carbonSteel}>
        <cylinderGeometry args={[r, r, height, 32]} />
      </mesh>

      {/* Tray rings — visible external bands showing tray spacing */}
      <TrayRings count={14} radius={r} height={height - 1} startY={1.0} material={m.stainless} />

      {/* Top head */}
      <mesh position={[0, height + 0.5, 0]} material={m.carbonSteel}>
        <sphereGeometry args={[r, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2.5]} />
      </mesh>
      {/* Bottom head */}
      <mesh position={[0, 0.5, 0]} material={m.carbonSteel}>
        <sphereGeometry args={[r, 32, 16, 0, Math.PI * 2, Math.PI - Math.PI / 2.5, Math.PI / 2.5]} />
      </mesh>

      {/* Overhead vapor outlet (top) */}
      <mesh position={[0, height + 0.75, 0]} material={m.stainless}>
        <cylinderGeometry args={[0.14, 0.14, 0.3, 12]} />
      </mesh>
      <FlangeRing position={[0, height + 0.9, 0]} radius={0.2} material={m.stainless} />

      {/* Reflux inlet (angled) */}
      <mesh position={[r * 0.7, height + 0.5, 0]} rotation={[0, 0, -Math.PI / 4]} material={m.stainless}>
        <cylinderGeometry args={[0.08, 0.08, 0.3, 12]} />
      </mesh>

      {/* Feed nozzle (mid-height) */}
      <mesh position={[-r - 0.08, height * 0.5 + 0.5, 0]} rotation={[0, 0, Math.PI / 2]} material={m.stainless}>
        <cylinderGeometry args={[0.1, 0.1, 0.25, 12]} />
      </mesh>
      <FlangeRing position={[-r - 0.2, height * 0.5 + 0.5, 0]} material={m.stainless} />

      {/* Bottoms outlet */}
      <mesh position={[0, 0.3, r + 0.08]} rotation={[Math.PI / 2, 0, 0]} material={m.stainless}>
        <cylinderGeometry args={[0.1, 0.1, 0.25, 12]} />
      </mesh>

      {/* External ladder */}
      <mesh position={[r + 0.15, height / 2 + 0.5, 0]} material={m.paintedSteel}>
        <boxGeometry args={[0.04, height * 0.95, 0.04]} />
      </mesh>
      {Array.from({ length: Math.floor(height / 0.4) }).map((_, i) => (
        <mesh key={i} position={[r + 0.15, 0.8 + i * 0.4, 0.08]} material={m.paintedSteel}>
          <boxGeometry args={[0.04, 0.04, 0.12]} />
        </mesh>
      ))}

      {/* Platform at mid-height */}
      <mesh position={[r + 0.5, height * 0.5 + 0.5, 0]} material={m.paintedSteel}>
        <boxGeometry args={[0.8, 0.04, 1.0]} />
      </mesh>
    </group>
  );
}

/** Shell-and-tube heat exchanger — horizontal, smaller than reactor */
function ShellTubeHeatExchanger({ color, emphasized, dimmed }: ModelProps) {
  const m = useMaterials(color, emphasized, dimmed);
  const shellDiameter = 0.7;
  const length = shellDiameter * 5; // length 5× diameter
  const r = shellDiameter / 2;

  return (
    <group rotation={[0, 0, Math.PI / 2]} position={[0, 1.0, 0]}>
      {/* Horizontal shell */}
      <mesh castShadow receiveShadow material={m.carbonSteel}>
        <cylinderGeometry args={[r, r, length, 28]} />
      </mesh>

      {/* Front head (bolted flange look) */}
      <mesh position={[length / 2 + 0.04, 0, 0]} material={m.stainless}>
        <cylinderGeometry args={[r * 1.15, r * 1.15, 0.08, 28]} />
      </mesh>
      <FlangeBolts radius={r * 1.05} y={length / 2 + 0.04} count={14} material={m.stainless} />

      {/* Rear head */}
      <mesh position={[-length / 2 - 0.04, 0, 0]} material={m.stainless}>
        <cylinderGeometry args={[r * 1.15, r * 1.15, 0.08, 28]} />
      </mesh>
      <FlangeBolts radius={r * 1.05} y={-length / 2 - 0.04} count={14} material={m.stainless} />

      {/* Shell-side nozzles (top and bottom, offset) */}
      <mesh position={[length * 0.25, r + 0.06, 0]} material={m.stainless}>
        <cylinderGeometry args={[0.09, 0.09, 0.25, 12]} />
      </mesh>
      <FlangeRing position={[length * 0.25, r + 0.18, 0]} radius={0.13} material={m.stainless} />

      <mesh position={[-length * 0.25, -r - 0.06, 0]} material={m.stainless}>
        <cylinderGeometry args={[0.09, 0.09, 0.25, 12]} />
      </mesh>
      <FlangeRing position={[-length * 0.25, -r - 0.18, 0]} radius={0.13} material={m.stainless} />

      {/* Tube-side nozzles (ends) */}
      <mesh position={[length / 2 + 0.2, 0, r * 0.5]} rotation={[Math.PI / 2, 0, 0]} material={m.stainless}>
        <cylinderGeometry args={[0.08, 0.08, 0.2, 12]} />
      </mesh>

      {/* Baffle rings on shell */}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={i} position={[-length / 2 + 0.4 + i * (length - 0.8) / 4, 0, 0]} material={m.stainless}>
          <torusGeometry args={[r + 0.005, 0.015, 6, 20]} />
        </mesh>
      ))}

      {/* Saddle supports (back to world orientation) */}
      <group rotation={[0, 0, -Math.PI / 2]}>
        <mesh position={[0.8, -0.7, 0]} castShadow material={m.paintedSteel}>
          <boxGeometry args={[0.12, 0.5, r * 1.6]} />
        </mesh>
        <mesh position={[-0.8, -0.7, 0]} castShadow material={m.paintedSteel}>
          <boxGeometry args={[0.12, 0.5, r * 1.6]} />
        </mesh>
      </group>
    </group>
  );
}

/** Centrifugal Pump — volute casing + motor, distinctly different from vessels */
function CentrifugalPump({ color, emphasized, dimmed }: ModelProps) {
  const m = useMaterials(color, emphasized, dimmed);
  return (
    <group>
      {/* Baseplate */}
      <mesh position={[0, 0.04, 0]} castShadow receiveShadow material={m.darkSteel}>
        <boxGeometry args={[2.0, 0.08, 1.0]} />
      </mesh>

      {/* Volute casing — snail-shell shape */}
      <mesh position={[0, 0.5, 0]} castShadow material={m.carbonSteel}>
        <torusGeometry args={[0.35, 0.22, 16, 32, Math.PI * 1.6]} />
      </mesh>
      {/* Casing cover */}
      <mesh position={[0, 0.5, 0.18]} rotation={[Math.PI / 2, 0, 0]} material={m.stainless}>
        <cylinderGeometry args={[0.38, 0.38, 0.05, 28]} />
      </mesh>

      {/* Suction nozzle (horizontal, front) */}
      <mesh position={[0, 0.45, 0.6]} rotation={[Math.PI / 2, 0, 0]} material={m.stainless}>
        <cylinderGeometry args={[0.14, 0.16, 0.4, 16]} />
      </mesh>
      <FlangeRing position={[0, 0.45, 0.82]} radius={0.22} material={m.stainless} />

      {/* Discharge nozzle (vertical, up) */}
      <mesh position={[0, 0.9, 0]} material={m.stainless}>
        <cylinderGeometry args={[0.12, 0.14, 0.3, 16]} />
      </mesh>
      <FlangeRing position={[0, 1.08, 0]} radius={0.18} material={m.stainless} />

      {/* Bearing housing */}
      <mesh position={[0, 0.8, -0.15]} material={m.stainless}>
        <cylinderGeometry args={[0.16, 0.18, 0.2, 16]} />
      </mesh>

      {/* Motor — distinct cylindrical shape with cooling fins */}
      <mesh position={[0, 1.3, -0.15]} castShadow material={m.darkSteel}>
        <cylinderGeometry args={[0.3, 0.3, 0.6, 28]} />
      </mesh>
      {Array.from({ length: 24 }).map((_, i) => (
        <mesh key={i} position={[0, 1.3, -0.15]} rotation={[0, (i / 24) * Math.PI * 2, 0]} material={m.stainless}>
          <boxGeometry args={[0.64, 0.5, 0.012]} />
        </mesh>
      ))}

      {/* Motor end bell + terminal box */}
      <mesh position={[0, 1.65, -0.15]} material={m.darkSteel}>
        <cylinderGeometry args={[0.32, 0.3, 0.08, 28]} />
      </mesh>
      <mesh position={[0, 1.5, -0.15]} material={m.paintedSteel}>
        <boxGeometry args={[0.28, 0.16, 0.2]} />
      </mesh>

      {/* Coupling guard (safety yellow) */}
      <mesh position={[0, 0.95, -0.05]} material={m.paintedSteel}>
        <boxGeometry args={[0.2, 0.1, 0.35]} />
      </mesh>
    </group>
  );
}

/** Compressor — multi-stage horizontal barrel with big motor */
function CentrifugalCompressor({ color, emphasized, dimmed }: ModelProps) {
  const m = useMaterials(color, emphasized, dimmed);
  return (
    <group>
      {/* Baseplate */}
      <mesh position={[0, 0.04, 0]} castShadow receiveShadow material={m.darkSteel}>
        <boxGeometry args={[3.2, 0.08, 1.3]} />
      </mesh>

      {/* 3-stage compressor body — horizontal barrel */}
      <mesh position={[0.4, 0.75, 0]} rotation={[0, 0, Math.PI / 2]} castShadow material={m.carbonSteel}>
        <cylinderGeometry args={[0.45, 0.45, 1.4, 32]} />
      </mesh>
      {/* Stage dividers */}
      {[-0.25, 0.25].map((x, i) => (
        <mesh key={i} position={[0.4 + x, 0.75, 0]} rotation={[0, 0, Math.PI / 2]} material={m.stainless}>
          <cylinderGeometry args={[0.5, 0.5, 0.06, 32]} />
        </mesh>
      ))}

      {/* Suction nozzle (left, large) */}
      <mesh position={[-0.5, 1.0, 0]} rotation={[0, 0, Math.PI / 2]} material={m.stainless}>
        <cylinderGeometry args={[0.18, 0.18, 0.3, 16]} />
      </mesh>
      <FlangeRing position={[-0.65, 1.0, 0]} radius={0.25} material={m.stainless} />

      {/* Discharge nozzle (right) */}
      <mesh position={[1.3, 1.0, 0]} rotation={[0, 0, Math.PI / 2]} material={m.stainless}>
        <cylinderGeometry args={[0.16, 0.16, 0.3, 16]} />
      </mesh>

      {/* Coupling */}
      <mesh position={[-0.5, 0.75, 0]} rotation={[0, 0, Math.PI / 2]} material={m.stainless}>
        <cylinderGeometry args={[0.15, 0.15, 0.15, 12]} />
      </mesh>
      {/* Coupling guard */}
      <mesh position={[-0.5, 0.6, 0]} material={m.paintedSteel}>
        <boxGeometry args={[0.22, 0.06, 0.4]} />
      </mesh>

      {/* Big motor */}
      <mesh position={[-1.1, 0.65, 0]} rotation={[0, 0, Math.PI / 2]} castShadow material={m.darkSteel}>
        <cylinderGeometry args={[0.38, 0.38, 0.9, 28]} />
      </mesh>
      {Array.from({ length: 28 }).map((_, i) => (
        <mesh key={i} position={[-1.1, 0.65, 0]} rotation={[0, 0, (i / 28) * Math.PI * 2]} material={m.stainless}>
          <boxGeometry args={[0.8, 0.85, 0.012]} />
        </mesh>
      ))}

      {/* Control panel */}
      <mesh position={[0.7, 1.35, 0.4]} material={m.paintedSteel}>
        <boxGeometry args={[0.4, 0.4, 0.1]} />
      </mesh>
    </group>
  );
}

/** Tank — large diameter, short vessel (diameter > height) */
function StorageTankModel({ color, emphasized, dimmed, large }: ModelProps & { large?: boolean }) {
  const m = useMaterials(color, emphasized, dimmed);
  const diameter = large ? 2.5 : 1.7;
  const height = diameter * 0.9; // diameter exceeds height
  const r = diameter / 2;

  return (
    <group>
      {/* Skirt */}
      <mesh position={[0, 0.15, 0]} material={m.darkSteel}>
        <cylinderGeometry args={[r * 0.7, r * 0.8, 0.3, 24]} />
      </mesh>

      {/* Body — wide and short */}
      <mesh position={[0, height / 2 + 0.3, 0]} castShadow receiveShadow material={m.carbonSteel}>
        <cylinderGeometry args={[r, r, height, 40]} />
      </mesh>

      {/* Domed top (slightly domed, not flat) */}
      <mesh position={[0, height + 0.3, 0]} material={m.carbonSteel}>
        <sphereGeometry args={[r, 40, 20, 0, Math.PI * 2, 0, Math.PI / 4]} />
      </mesh>
      {/* Bottom head */}
      <mesh position={[0, 0.3, 0]} material={m.carbonSteel}>
        <sphereGeometry args={[r, 40, 20, 0, Math.PI * 2, Math.PI - Math.PI / 4, Math.PI / 4]} />
      </mesh>

      {/* Reinforcing bands */}
      <mesh position={[0, height * 0.3 + 0.3, 0]} material={m.stainless}>
        <torusGeometry args={[r + 0.005, 0.03, 8, 40]} />
      </mesh>
      <mesh position={[0, height * 0.7 + 0.3, 0]} material={m.stainless}>
        <torusGeometry args={[r + 0.005, 0.03, 8, 40]} />
      </mesh>

      {/* Level gauge (glass) */}
      <mesh position={[r + 0.01, height * 0.5 + 0.3, 0.2]} material={m.glass}>
        <boxGeometry args={[0.05, height * 0.7, 0.04]} />
      </mesh>

      {/* Top vent */}
      <mesh position={[0, height + 0.55, 0]} material={m.stainless}>
        <cylinderGeometry args={[0.1, 0.12, 0.3, 12]} />
      </mesh>

      {/* Inlet nozzle (top, angled) */}
      <mesh position={[r * 0.6, height + 0.4, 0]} rotation={[0, 0, -Math.PI / 4]} material={m.stainless}>
        <cylinderGeometry args={[0.1, 0.1, 0.3, 12]} />
      </mesh>

      {/* Outlet nozzle (bottom side) */}
      <mesh position={[r + 0.1, 0.4, 0]} rotation={[0, 0, Math.PI / 2]} material={m.stainless}>
        <cylinderGeometry args={[0.1, 0.1, 0.3, 12]} />
      </mesh>
      <FlangeRing position={[r + 0.22, 0.4, 0]} material={m.stainless} />

      {/* External ladder */}
      <mesh position={[r + 0.12, height * 0.5 + 0.3, 0]} material={m.paintedSteel}>
        <boxGeometry args={[0.04, height * 0.9, 0.04]} />
      </mesh>
    </group>
  );
}

/** Separator — vertical 2-phase vessel, distinct from tank/reactor */
function VesselSeparator({ color, emphasized, dimmed }: ModelProps) {
  const m = useMaterials(color, emphasized, dimmed);
  const diameter = 1.0;
  const height = diameter * 3.5; // taller than tank, shorter than column
  const r = diameter / 2;

  return (
    <group>
      {/* 3 angled legs */}
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * r * 0.7, 0.3, Math.sin(a) * r * 0.7]}
            rotation={[Math.sin(a) * 0.2, 0, -Math.cos(a) * 0.2]}
            material={m.darkSteel}
          >
            <cylinderGeometry args={[0.04, 0.04, 0.7, 8]} />
          </mesh>
        );
      })}

      {/* Vessel */}
      <mesh position={[0, height / 2 + 0.5, 0]} castShadow receiveShadow material={m.carbonSteel}>
        <cylinderGeometry args={[r, r, height, 32]} />
      </mesh>

      {/* Demister pad (internal, glass-tinted) */}
      <mesh position={[0, height * 0.85 + 0.5, 0]} material={m.glass}>
        <cylinderGeometry args={[r - 0.03, r - 0.03, 0.1, 28]} />
      </mesh>

      {/* Top head */}
      <mesh position={[0, height + 0.5, 0]} material={m.carbonSteel}>
        <sphereGeometry args={[r, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2.5]} />
      </mesh>
      {/* Bottom head */}
      <mesh position={[0, 0.5, 0]} material={m.carbonSteel}>
        <sphereGeometry args={[r, 32, 16, 0, Math.PI * 2, Math.PI - Math.PI / 2.5, Math.PI / 2.5]} />
      </mesh>

      {/* Tangential inlet (swirl) */}
      <mesh position={[r + 0.05, height * 0.7 + 0.5, 0]} rotation={[0, 0, Math.PI / 2.2]} material={m.stainless}>
        <cylinderGeometry args={[0.12, 0.12, 0.35, 16]} />
      </mesh>
      <FlangeRing position={[r + 0.2, height * 0.7 + 0.5, 0]} material={m.stainless} />

      {/* Gas outlet (top) */}
      <mesh position={[0, height + 0.7, 0]} material={m.stainless}>
        <cylinderGeometry args={[0.14, 0.14, 0.3, 12]} />
      </mesh>

      {/* Liquid outlet (bottom) */}
      <mesh position={[0, 0.3, r + 0.08]} rotation={[Math.PI / 2, 0, 0]} material={m.stainless}>
        <cylinderGeometry args={[0.1, 0.1, 0.3, 12]} />
      </mesh>

      {/* Interface level gauge */}
      <mesh position={[r + 0.01, height * 0.4 + 0.5, 0.2]} material={m.glass}>
        <boxGeometry args={[0.05, height * 0.5, 0.04]} />
      </mesh>
    </group>
  );
}

/** Fired Heater — large box firebox with tall stack */
function FiredHeater({ color, emphasized, dimmed }: ModelProps) {
  const m = useMaterials(color, emphasized, dimmed);
  return (
    <group>
      {/* Firebox (rectangular) */}
      <mesh position={[0, 1.2, 0]} castShadow receiveShadow material={m.carbonSteel}>
        <boxGeometry args={[1.6, 2.2, 1.4]} />
      </mesh>

      {/* Refractory inner glow */}
      <mesh position={[0, 1.0, 0.72]} material={m.glass}>
        <boxGeometry args={[1.2, 1.6, 0.02]} />
      </mesh>

      {/* Burners (3) */}
      {[-0.4, 0, 0.4].map((x, i) => (
        <group key={i}>
          <mesh position={[x, 0.35, 0.72]} material={m.darkSteel}>
            <cylinderGeometry args={[0.14, 0.18, 0.18, 16]} rotation={[Math.PI / 2, 0, 0]} />
          </mesh>
          <mesh position={[x, 0.35, 0.84]} material={m.hazard}>
            <cylinderGeometry args={[0.11, 0.11, 0.03, 16]} rotation={[Math.PI / 2, 0, 0]} />
          </mesh>
        </group>
      ))}

      {/* Tube coils on walls (radiant section) */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={`r${i}`} position={[0.8, 0.6 + i * 0.3, 0]} material={m.stainless}>
          <boxGeometry args={[0.04, 0.2, 1.0]} />
        </mesh>
      ))}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={`l${i}`} position={[-0.8, 0.6 + i * 0.3, 0]} material={m.stainless}>
          <boxGeometry args={[0.04, 0.2, 1.0]} />
        </mesh>
      ))}

      {/* Convection section (smaller box on top) */}
      <mesh position={[0, 2.6, 0]} material={m.darkSteel}>
        <boxGeometry args={[1.4, 0.5, 1.2]} />
      </mesh>
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={i} position={[-0.5 + i * 0.25, 2.6, 0]} material={m.stainless}>
          <boxGeometry args={[0.04, 0.4, 1.0]} />
        </mesh>
      ))}

      {/* Tall stack */}
      <mesh position={[0, 3.8, 0]} castShadow material={m.darkSteel}>
        <cylinderGeometry args={[0.32, 0.38, 1.8, 20]} />
      </mesh>
      <mesh position={[0, 3.0, 0]} material={m.stainless}>
        <cylinderGeometry args={[0.4, 0.4, 0.08, 20]} />
      </mesh>

      {/* Process inlet/outlet */}
      <mesh position={[-0.9, 0.5, 0]} rotation={[0, 0, Math.PI / 2]} material={m.stainless}>
        <cylinderGeometry args={[0.1, 0.1, 0.25, 12]} />
      </mesh>
      <mesh position={[0.9, 2.0, 0]} rotation={[0, 0, Math.PI / 2]} material={m.stainless}>
        <cylinderGeometry args={[0.1, 0.1, 0.25, 12]} />
      </mesh>
    </group>
  );
}

/** Cooler — finned-tube radiator, very different from shell-and-tube HX */
function AirCooler({ color, emphasized, dimmed }: ModelProps) {
  const m = useMaterials(color, emphasized, dimmed);
  const len = 1.8;
  const r = 0.3;

  return (
    <group rotation={[0, 0, Math.PI / 2]} position={[0, 0.9, 0]}>
      {/* Core tube */}
      <mesh castShadow material={m.carbonSteel}>
        <cylinderGeometry args={[r, r, len, 24]} />
      </mesh>

      {/* End caps */}
      <mesh position={[len / 2 + 0.04, 0, 0]} material={m.darkSteel}>
        <cylinderGeometry args={[r * 1.1, r * 1.1, 0.12, 24]} />
      </mesh>
      <mesh position={[-len / 2 - 0.04, 0, 0]} material={m.darkSteel}>
        <cylinderGeometry args={[r * 1.1, r * 1.1, 0.12, 24]} />
      </mesh>

      {/* Cooling fins — dense disks */}
      {Array.from({ length: 18 }).map((_, i) => (
        <mesh key={i} position={[-len / 2 + 0.15 + i * (len - 0.3) / 17, 0, 0]} material={m.stainless}>
          <cylinderGeometry args={[r + 0.1, r + 0.1, 0.012, 24]} />
        </mesh>
      ))}

      {/* Inlet/outlet */}
      <mesh position={[len / 2 + 0.18, 0, 0]} material={m.stainless}>
        <cylinderGeometry args={[0.09, 0.09, 0.2, 12]} />
      </mesh>
      <mesh position={[-len / 2 - 0.18, 0, 0]} material={m.stainless}>
        <cylinderGeometry args={[0.09, 0.09, 0.2, 12]} />
      </mesh>

      {/* Saddle supports */}
      <group rotation={[0, 0, -Math.PI / 2]}>
        <mesh position={[0.4, -0.3, 0]} castShadow material={m.paintedSteel}>
          <boxGeometry args={[0.1, 0.4, r * 1.6]} />
        </mesh>
        <mesh position={[-0.4, -0.3, 0]} castShadow material={m.paintedSteel}>
          <boxGeometry args={[0.1, 0.4, r * 1.6]} />
        </mesh>
      </group>
    </group>
  );
}

/** Valve — globe valve with actuator, small but distinctive */
function ControlValve({ color, emphasized, dimmed }: ModelProps) {
  const m = useMaterials(color, emphasized, dimmed);
  return (
    <group>
      {/* Globular body */}
      <mesh position={[0, 0.35, 0]} castShadow material={m.hazard}>
        <sphereGeometry args={[0.22, 20, 14]} />
      </mesh>

      {/* Bonnet */}
      <mesh position={[0, 0.58, 0]} material={m.darkSteel}>
        <cylinderGeometry args={[0.12, 0.16, 0.18, 14]} />
      </mesh>

      {/* Yoke arms */}
      <mesh position={[0.1, 0.7, 0]} material={m.stainless}>
        <boxGeometry args={[0.05, 0.3, 0.08]} />
      </mesh>
      <mesh position={[-0.1, 0.7, 0]} material={m.stainless}>
        <boxGeometry args={[0.05, 0.3, 0.08]} />
      </mesh>

      {/* Actuator */}
      <mesh position={[0, 0.95, 0]} material={m.darkSteel}>
        <cylinderGeometry args={[0.18, 0.18, 0.2, 16]} />
      </mesh>

      {/* Position indicator */}
      <mesh position={[0, 1.08, 0]} material={m.paintedSteel}>
        <cylinderGeometry args={[0.04, 0.04, 0.08, 8]} />
      </mesh>

      {/* Flanges */}
      <mesh position={[0.4, 0.35, 0]} rotation={[0, 0, Math.PI / 2]} material={m.darkSteel}>
        <cylinderGeometry args={[0.2, 0.2, 0.06, 16]} />
      </mesh>
      <mesh position={[-0.4, 0.35, 0]} rotation={[0, 0, Math.PI / 2]} material={m.darkSteel}>
        <cylinderGeometry args={[0.2, 0.2, 0.06, 16]} />
      </mesh>
      <FlangeBolts radius={0.17} y={0.35} count={8} material={m.stainless} />

      {/* Stem */}
      <mesh position={[0, 0.78, 0]} material={m.stainless}>
        <cylinderGeometry args={[0.025, 0.025, 0.3, 8]} />
      </mesh>
    </group>
  );
}

/** Filter — vertical housing with visible cartridges */
function CartridgeFilter({ color, emphasized, dimmed }: ModelProps) {
  const m = useMaterials(color, emphasized, dimmed);
  return (
    <group>
      {/* Base */}
      <mesh position={[0, 0.1, 0]} material={m.darkSteel}>
        <cylinderGeometry args={[0.65, 0.7, 0.2, 24]} />
      </mesh>

      {/* Glass housing (cartridges visible) */}
      <mesh position={[0, 1.0, 0]} material={m.glass}>
        <cylinderGeometry args={[0.55, 0.55, 1.8, 24]} />
      </mesh>

      {/* Internal cartridges */}
      {Array.from({ length: 7 }).map((_, i) => {
        const a = (i / 7) * Math.PI * 2;
        const rr = i === 0 ? 0 : 0.25;
        return (
          <mesh key={i} position={[Math.cos(a) * rr, 1.0, Math.sin(a) * rr]} material={m.stainless}>
            <cylinderGeometry args={[0.07, 0.07, 1.5, 10]} />
          </mesh>
        );
      })}

      {/* Top flange */}
      <mesh position={[0, 1.95, 0]} material={m.darkSteel}>
        <cylinderGeometry args={[0.65, 0.65, 0.12, 24]} />
      </mesh>
      <FlangeBolts radius={0.58} y={1.95} count={12} material={m.stainless} />
      <mesh position={[0, 2.08, 0]} material={m.stainless}>
        <cylinderGeometry args={[0.55, 0.55, 0.12, 24]} />
      </mesh>

      {/* Inlet/outlet */}
      <mesh position={[0.65, 0.5, 0]} rotation={[0, 0, Math.PI / 2]} material={m.stainless}>
        <cylinderGeometry args={[0.11, 0.11, 0.3, 12]} />
      </mesh>
      <mesh position={[0, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]} material={m.stainless}>
        <cylinderGeometry args={[0.11, 0.11, 0.3, 12]} />
      </mesh>
    </group>
  );
}

/** Motor — horizontal cylinder with fins, distinct from vessels */
function ElectricMotor({ color, emphasized, dimmed }: ModelProps) {
  const m = useMaterials(color, emphasized, dimmed);
  return (
    <group>
      <mesh position={[0, 0.04, 0]} castShadow receiveShadow material={m.darkSteel}>
        <boxGeometry args={[1.6, 0.08, 0.9]} />
      </mesh>
      <mesh position={[-0.1, 0.55, 0]} rotation={[0, 0, Math.PI / 2]} castShadow material={m.carbonSteel}>
        <cylinderGeometry args={[0.36, 0.36, 1.0, 28]} />
      </mesh>
      {/* Cooling fins */}
      {Array.from({ length: 26 }).map((_, i) => (
        <mesh key={i} position={[-0.1, 0.55, 0]} rotation={[0, 0, (i / 26) * Math.PI * 2]} material={m.stainless}>
          <boxGeometry args={[0.8, 0.9, 0.01]} />
        </mesh>
      ))}
      {/* End bells */}
      <mesh position={[0.4, 0.55, 0]} rotation={[0, 0, Math.PI / 2]} material={m.darkSteel}>
        <cylinderGeometry args={[0.38, 0.38, 0.08, 28]} />
      </mesh>
      <mesh position={[-0.6, 0.55, 0]} rotation={[0, 0, Math.PI / 2]} material={m.darkSteel}>
        <cylinderGeometry args={[0.38, 0.38, 0.08, 28]} />
      </mesh>
      {/* Terminal box */}
      <mesh position={[-0.1, 0.9, 0]} material={m.paintedSteel}>
        <boxGeometry args={[0.4, 0.2, 0.28]} />
      </mesh>
      {/* Shaft + coupling */}
      <mesh position={[0.6, 0.55, 0]} rotation={[0, 0, Math.PI / 2]} material={m.stainless}>
        <cylinderGeometry args={[0.05, 0.05, 0.4, 10]} />
      </mesh>
      {/* Feet */}
      {[-0.3, 0.1].map((x, i) => (
        <group key={i}>
          <mesh position={[x, 0.2, 0.3]} material={m.paintedSteel}>
            <boxGeometry args={[0.25, 0.25, 0.12]} />
          </mesh>
          <mesh position={[x, 0.2, -0.3]} material={m.paintedSteel}>
            <boxGeometry args={[0.25, 0.25, 0.12]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ─── Dispatcher ────────────────────────────────────────────────────────

export interface EquipmentModelProps extends ModelProps {
  type: EquipmentType;
}

export function EquipmentModel({ type, color, emphasized, dimmed, selected }: EquipmentModelProps) {
  const props: ModelProps = { color, emphasized, dimmed, selected };
  switch (type) {
    case "pump":
      return <CentrifugalPump {...props} />;
    case "tank":
      return <StorageTankModel {...props} />;
    case "storageTank":
      return <StorageTankModel {...props} large />;
    case "reactor":
      // Fixed-bed reactor for ammonia/sulfuric (tall pressure vessel)
      return <FixedBedReactor {...props} />;
    case "heatExchanger":
      return <ShellTubeHeatExchanger {...props} />;
    case "heater":
      return <FiredHeater {...props} />;
    case "cooler":
      return <AirCooler {...props} />;
    case "compressor":
      return <CentrifugalCompressor {...props} />;
    case "column":
      return <DistillationColumn {...props} />;
    case "separator":
      return <VesselSeparator {...props} />;
    case "valve":
      return <ControlValve {...props} />;
    case "filter":
      return <CartridgeFilter {...props} />;
    case "motor":
      return <ElectricMotor {...props} />;
    default:
      return (
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#888" />
        </mesh>
      );
  }
}
