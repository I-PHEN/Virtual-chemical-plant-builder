"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { EquipmentType } from "@/lib/plant/types";

/**
 * Procedural 3D equipment models — each type has a genuinely distinct,
 * professionally-recognisable silhouette built from Three.js primitives.
 * No two equipment types share the same shape language.
 *
 * Convention: model centred at origin, base near y = 0.
 * Props control material state (normal / highlighted / dimmed).
 */

interface ModelProps {
  color: string;
  emphasized?: boolean;
  dimmed?: boolean;
  selected?: boolean;
}

function useMaterials(color: string, emphasized?: boolean, dimmed?: boolean) {
  return useMemo(() => {
    const c = new THREE.Color(color);
    const base = new THREE.MeshStandardMaterial({
      color: c,
      metalness: 0.72,
      roughness: 0.32,
      transparent: dimmed ?? false,
      opacity: dimmed ? 0.16 : 1,
      emissive: c,
      emissiveIntensity: emphasized ? 0.5 : 0.04,
    });
    const steel = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#525659"),
      metalness: 0.92,
      roughness: 0.28,
      transparent: dimmed ?? false,
      opacity: dimmed ? 0.16 : 1,
    });
    const darkSteel = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#2a2d31"),
      metalness: 0.88,
      roughness: 0.35,
      transparent: dimmed ?? false,
      opacity: dimmed ? 0.16 : 1,
    });
    const accent = new THREE.MeshStandardMaterial({
      color: new THREE.Color(emphasized ? "#fbbf24" : "#cbd5e1"),
      metalness: 0.7,
      roughness: 0.25,
      transparent: dimmed ?? false,
      opacity: dimmed ? 0.16 : 1,
      emissive: new THREE.Color(emphasized ? "#fbbf24" : "#000000"),
      emissiveIntensity: emphasized ? 0.45 : 0,
    });
    const glass = new THREE.MeshStandardMaterial({
      color: c,
      metalness: 0.1,
      roughness: 0.08,
      transparent: true,
      opacity: dimmed ? 0.05 : 0.32,
      emissive: c,
      emissiveIntensity: emphasized ? 0.6 : 0.18,
    });
    const hazard = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#f59e0b"),
      metalness: 0.4,
      roughness: 0.5,
      transparent: dimmed ?? false,
      opacity: dimmed ? 0.16 : 1,
      emissive: new THREE.Color("#f59e0b"),
      emissiveIntensity: emphasized ? 0.3 : 0.05,
    });
    return { base, steel, darkSteel, accent, glass, hazard };
  }, [color, emphasized, dimmed]);
}

// small reusable bolt
function Bolts({ radius, y, count, material }: { radius: number; y: number; count: number; material: THREE.Material }) {
  const arr = Array.from({ length: count });
  return (
    <group>
      {arr.map((_, i) => {
        const a = (i / count) * Math.PI * 2;
        return (
          <mesh key={i} material={material} position={[Math.cos(a) * radius, y, Math.sin(a) * radius]}>
            <cylinderGeometry args={[0.025, 0.025, 0.05, 6]} />
          </mesh>
        );
      })}
    </group>
  );
}

// ───────────────────────── PUMP ─────────────────────────
// Distinctive snail-shell volute + top motor, very different from tanks
function PumpModel({ color, emphasized, dimmed }: ModelProps) {
  const { base, steel, darkSteel, accent, hazard } = useMaterials(color, emphasized, dimmed);
  return (
    <group>
      {/* baseplate */}
      <mesh material={darkSteel} position={[0, 0.04, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.0, 0.08, 1.2]} />
      </mesh>
      {/* bolt holes on baseplate */}
      <Bolts radius={0.85} y={0.085} count={8} material={accent} />

      {/* volute casing — the snail shell */}
      <mesh material={base} castShadow position={[0, 0.55, 0]}>
        <torusGeometry args={[0.42, 0.22, 16, 32, Math.PI * 1.6]} />
      </mesh>
      {/* casing front cover (flatter disk) */}
      <mesh material={steel} position={[0, 0.55, 0.22]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.45, 0.45, 0.06, 32]} />
      </mesh>
      {/* impeller hub (visible through cover) */}
      <mesh material={accent} position={[0, 0.55, 0.27]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.06, 12]} />
      </mesh>

      {/* suction nozzle — horizontal, front-facing */}
      <mesh material={steel} position={[0, 0.5, 0.7]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.16, 0.18, 0.5, 20]} />
      </mesh>
      <mesh material={darkSteel} position={[0, 0.5, 0.95]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.06, 20]} />
      </mesh>

      {/* discharge nozzle — vertical, up */}
      <mesh material={steel} position={[0, 1.05, 0]}>
        <cylinderGeometry args={[0.14, 0.16, 0.4, 20]} />
      </mesh>
      <mesh material={darkSteel} position={[0, 1.28, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.06, 20]} />
      </mesh>

      {/* bearing housing */}
      <mesh material={steel} position={[0, 0.9, -0.15]}>
        <cylinderGeometry args={[0.18, 0.2, 0.2, 20]} />
      </mesh>

      {/* motor — distinct cylindrical shape with cooling fins */}
      <mesh material={darkSteel} castShadow position={[0, 1.55, -0.15]}>
        <cylinderGeometry args={[0.34, 0.34, 0.7, 32]} />
      </mesh>
      {/* cooling fins — radial blades */}
      {Array.from({ length: 28 }).map((_, i) => (
        <mesh
          key={i}
          material={steel}
          position={[0, 1.55, -0.15]}
          rotation={[0, (i / 28) * Math.PI * 2, 0]}
        >
          <boxGeometry args={[0.72, 0.6, 0.015]} />
        </mesh>
      ))}
      {/* motor end bell */}
      <mesh material={darkSteel} position={[0, 1.95, -0.15]}>
        <cylinderGeometry args={[0.36, 0.34, 0.1, 32]} />
      </mesh>
      {/* terminal box */}
      <mesh material={accent} position={[0, 2.05, -0.15]}>
        <boxGeometry args={[0.3, 0.18, 0.22]} />
      </mesh>

      {/* nameplate */}
      <mesh material={hazard} position={[0, 0.55, 0.51]}>
        <boxGeometry args={[0.15, 0.1, 0.01]} />
      </mesh>
    </group>
  );
}

// ───────────────────────── TANK ─────────────────────────
function TankModel({ color, emphasized, dimmed, large }: ModelProps & { large?: boolean }) {
  const { base, steel, darkSteel, accent, glass } = useMaterials(color, emphasized, dimmed);
  const r = large ? 1.25 : 0.85;
  const h = large ? 2.8 : 2.0;
  return (
    <group>
      {/* skirt / legs */}
      <mesh material={darkSteel} position={[0, 0.15, 0]}>
        <cylinderGeometry args={[r * 0.7, r * 0.8, 0.3, 24]} />
      </mesh>
      {/* body */}
      <mesh material={base} castShadow receiveShadow position={[0, h / 2 + 0.3, 0]}>
        <cylinderGeometry args={[r, r, h, 48]} />
      </mesh>
      {/* dished top */}
      <mesh material={base} position={[0, h + 0.3, 0]}>
        <sphereGeometry args={[r, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2.4]} />
      </mesh>
      {/* dished bottom */}
      <mesh material={steel} position={[0, 0.3, 0]}>
        <sphereGeometry args={[r, 48, 24, 0, Math.PI * 2, Math.PI - Math.PI / 2.4, Math.PI / 2.4]} />
      </mesh>
      {/* reinforcing bands */}
      <mesh material={steel} position={[0, h * 0.3 + 0.3, 0]}>
        <torusGeometry args={[r + 0.005, 0.03, 8, 48]} />
      </mesh>
      <mesh material={steel} position={[0, h * 0.7 + 0.3, 0]}>
        <torusGeometry args={[r + 0.005, 0.03, 8, 48]} />
      </mesh>
      {/* liquid level gauge — vertical glass strip */}
      <mesh material={glass} position={[r + 0.01, h * 0.5 + 0.3, 0.2]}>
        <boxGeometry args={[0.06, h * 0.7, 0.04]} />
      </mesh>
      {/* gauge protective rods */}
      <mesh material={accent} position={[r + 0.02, h * 0.5 + 0.3, 0.18]}>
        <boxGeometry args={[0.02, h * 0.75, 0.02]} />
      </mesh>
      <mesh material={accent} position={[r + 0.02, h * 0.5 + 0.3, 0.22]}>
        <boxGeometry args={[0.02, h * 0.75, 0.02]} />
      </mesh>
      {/* top vent */}
      <mesh material={darkSteel} position={[0, h + 0.55, 0]}>
        <cylinderGeometry args={[0.12, 0.14, 0.3, 16]} />
      </mesh>
      {/* inlet nozzle (top, angled) */}
      <mesh material={steel} position={[r * 0.6, h + 0.4, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <cylinderGeometry args={[0.1, 0.1, 0.4, 16]} />
      </mesh>
      {/* outlet nozzle (bottom side) */}
      <mesh material={steel} position={[r + 0.15, 0.45, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.12, 0.12, 0.3, 16]} />
      </mesh>
      <mesh material={darkSteel} position={[r + 0.22, 0.45, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.18, 0.18, 0.05, 16]} />
      </mesh>
      {/* external ladder */}
      <mesh material={accent} position={[r + 0.15, h * 0.5 + 0.3, 0]}>
        <boxGeometry args={[0.04, h * 0.9, 0.04]} />
      </mesh>
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={i} material={accent} position={[r + 0.15, h * 0.18 + i * h * 0.15 + 0.3, 0.1]}>
          <boxGeometry args={[0.04, 0.04, 0.18]} />
        </mesh>
      ))}
    </group>
  );
}

// ───────────────────────── REACTOR ─────────────────────────
// Tall vessel with visible catalyst bed (glass cutaway), external jacket
function ReactorModel({ color, emphasized, dimmed }: ModelProps) {
  const { base, steel, darkSteel, accent, glass, hazard } = useMaterials(color, emphasized, dimmed);
  const h = 2.6;
  const r = 0.72;
  return (
    <group>
      {/* support skirt */}
      <mesh material={darkSteel} position={[0, 0.2, 0]}>
        <cylinderGeometry args={[r * 0.85, r * 0.95, 0.4, 24]} />
      </mesh>
      {/* skirt access hole */}
      <mesh material={darkSteel} position={[0, 0.2, r * 0.7]}>
        <boxGeometry args={[0.3, 0.25, 0.05]} />
      </mesh>
      {/* external cooling jacket (slightly larger, glass-tinted) */}
      <mesh material={glass} position={[0, h / 2 + 0.4, 0]}>
        <cylinderGeometry args={[r + 0.06, r + 0.06, h, 36]} />
      </mesh>
      {/* inner vessel */}
      <mesh material={base} castShadow position={[0, h / 2 + 0.4, 0]}>
        <cylinderGeometry args={[r, r, h, 36]} />
      </mesh>
      {/* catalyst bed — visible internal grid pattern via stacked torus rings */}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh
          key={i}
          material={accent}
          position={[0, h * 0.25 + i * h * 0.12 + 0.4, 0]}
        >
          <torusGeometry args={[r - 0.05, 0.025, 6, 32]} />
        </mesh>
      ))}
      {/* top head */}
      <mesh material={base} position={[0, h + 0.4, 0]}>
        <sphereGeometry args={[r, 36, 18, 0, Math.PI * 2, 0, Math.PI / 2.5]} />
      </mesh>
      {/* bottom head */}
      <mesh material={steel} position={[0, 0.4, 0]}>
        <sphereGeometry args={[r, 36, 18, 0, Math.PI * 2, Math.PI - Math.PI / 2.5, Math.PI / 2.5]} />
      </mesh>
      {/* top flange */}
      <mesh material={steel} position={[0, h + 0.55, 0]}>
        <cylinderGeometry args={[r + 0.12, r + 0.12, 0.12, 36]} />
      </mesh>
      <Bolts radius={r + 0.1} y={h + 0.55} count={20} material={accent} />
      {/* inlet nozzle */}
      <mesh material={darkSteel} position={[0, h + 0.75, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.3, 16]} />
      </mesh>
      {/* outlet nozzle (bottom) */}
      <mesh material={darkSteel} position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.13, 0.13, 0.4, 16]} />
      </mesh>
      {/* temperature probes (side, angled) */}
      {[-0.3, 0.3].map((x, i) => (
        <group key={i}>
          <mesh material={accent} position={[x, h * 0.5 + 0.4, r + 0.1]} rotation={[Math.PI / 2.5, 0, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 0.4, 8]} />
          </mesh>
          <mesh material={hazard} position={[x, h * 0.5 + 0.55, r + 0.25]}>
            <boxGeometry args={[0.08, 0.12, 0.06]} />
          </mesh>
        </group>
      ))}
      {/* pressure gauge on top */}
      <mesh material={accent} position={[r * 0.6, h + 0.5, r * 0.4]}>
        <cylinderGeometry args={[0.1, 0.1, 0.08, 16]} rotation={[Math.PI / 2, 0, 0]} />
      </mesh>
    </group>
  );
}

// ───────────────────────── HEAT EXCHANGER ─────────────────────────
// Long horizontal shell with tube bundle ends visible, saddle supports
function HeatExchangerModel({ color, emphasized, dimmed }: ModelProps) {
  const { base, steel, darkSteel, accent } = useMaterials(color, emphasized, dimmed);
  const len = 2.4;
  const r = 0.38;
  return (
    <group rotation={[0, 0, Math.PI / 2]} position={[0, 1.0, 0]}>
      {/* shell */}
      <mesh material={base} castShadow>
        <cylinderGeometry args={[r, r, len, 32]} />
      </mesh>
      {/* channel end covers (flanged) */}
      <mesh material={darkSteel} position={[len / 2 + 0.05, 0, 0]}>
        <cylinderGeometry args={[r * 1.15, r * 1.15, 0.18, 32]} />
      </mesh>
      <mesh material={darkSteel} position={[-len / 2 - 0.05, 0, 0]}>
        <cylinderGeometry args={[r * 1.15, r * 1.15, 0.18, 32]} />
      </mesh>
      {/* tube bundle faceplates (perforated look) */}
      <mesh material={steel} position={[len / 2 - 0.05, 0, 0]}>
        <cylinderGeometry args={[r * 0.95, r * 0.95, 0.04, 32]} />
      </mesh>
      <mesh material={steel} position={[-len / 2 + 0.05, 0, 0]}>
        <cylinderGeometry args={[r * 0.95, r * 0.95, 0.04, 32]} />
      </mesh>
      {/* tube ends (grid of small circles) */}
      {Array.from({ length: 4 }).map((_, ring) =>
        Array.from({ length: 6 }).map((_, i) => {
          const a = (i / 6) * Math.PI * 2;
          const rr = 0.08 + ring * 0.07;
          return (
            <group key={`${ring}-${i}`}>
              <mesh
                material={accent}
                position={[len / 2 - 0.02, Math.cos(a) * rr, Math.sin(a) * rr]}
              >
                <cylinderGeometry args={[0.018, 0.018, 0.06, 8]} />
              </mesh>
              <mesh
                material={accent}
                position={[-len / 2 + 0.02, Math.cos(a) * rr, Math.sin(a) * rr]}
              >
                <cylinderGeometry args={[0.018, 0.018, 0.06, 8]} />
              </mesh>
            </group>
          );
        })
      )}
      {/* baffles visible as rings on shell */}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh
          key={i}
          material={steel}
          position={[-len / 2 + 0.3 + (i * (len - 0.6)) / 4, 0, 0]}
        >
          <torusGeometry args={[r - 0.02, 0.015, 6, 24]} />
        </mesh>
      ))}
      {/* shell-side nozzles (top & bottom) */}
      <mesh material={darkSteel} position={[len * 0.25, r + 0.12, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.3, 16]} />
      </mesh>
      <mesh material={darkSteel} position={[-len * 0.25, -r - 0.12, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.3, 16]} />
      </mesh>
      {/* tube-side nozzles (ends) */}
      <mesh material={darkSteel} position={[len / 2 + 0.2, 0, r + 0.05]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.25, 16]} />
      </mesh>
      <mesh material={darkSteel} position={[-len / 2 - 0.2, 0, -r - 0.05]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.25, 16]} />
      </mesh>
      {/* saddle supports (cradles) */}
      <mesh material={accent} position={[len * 0.3, -r - 0.25, 0]}>
        <boxGeometry args={[0.12, 0.5, r * 1.8]} />
      </mesh>
      <mesh material={accent} position={[-len * 0.3, -r - 0.25, 0]}>
        <boxGeometry args={[0.12, 0.5, r * 1.8]} />
      </mesh>
    </group>
  );
}

// ───────────────────────── COOLER ─────────────────────────
// Finned-tube cooler — looks like a big radiator, very different from shell-and-tube HX
function CoolerModel({ color, emphasized, dimmed }: ModelProps) {
  const { base, steel, darkSteel, accent } = useMaterials(color, emphasized, dimmed);
  const len = 1.9;
  const r = 0.32;
  return (
    <group rotation={[0, 0, Math.PI / 2]} position={[0, 0.9, 0]}>
      {/* core tube */}
      <mesh material={base} castShadow>
        <cylinderGeometry args={[r, r, len, 24]} />
      </mesh>
      {/* end caps */}
      <mesh material={darkSteel} position={[len / 2 + 0.05, 0, 0]}>
        <cylinderGeometry args={[r * 1.1, r * 1.1, 0.14, 24]} />
      </mesh>
      <mesh material={darkSteel} position={[-len / 2 - 0.05, 0, 0]}>
        <cylinderGeometry args={[r * 1.1, r * 1.1, 0.14, 24]} />
      </mesh>
      {/* cooling fins — dense radial disks along the tube */}
      {Array.from({ length: 18 }).map((_, i) => (
        <mesh
          key={i}
          material={accent}
          position={[-len / 2 + 0.15 + (i * (len - 0.3)) / 17, 0, 0]}
        >
          <cylinderGeometry args={[r + 0.12, r + 0.12, 0.015, 24]} />
        </mesh>
      ))}
      {/* inlet/outlet nozzles */}
      <mesh material={darkSteel} position={[len / 2 + 0.2, 0, 0]}>
        <cylinderGeometry args={[0.11, 0.11, 0.25, 16]} />
      </mesh>
      <mesh material={darkSteel} position={[-len / 2 - 0.2, 0, 0]}>
        <cylinderGeometry args={[0.11, 0.11, 0.25, 16]} />
      </mesh>
      {/* cooling water connections (top/bottom) */}
      <mesh material={steel} position={[0, r + 0.1, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.2, 12]} />
      </mesh>
      <mesh material={steel} position={[0, -r - 0.1, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.2, 12]} />
      </mesh>
      {/* cradle supports */}
      <mesh material={accent} position={[len * 0.3, -r - 0.3, 0]}>
        <boxGeometry args={[0.1, 0.5, r * 1.8]} />
      </mesh>
      <mesh material={accent} position={[-len * 0.3, -r - 0.3, 0]}>
        <boxGeometry args={[0.1, 0.5, r * 1.8]} />
      </mesh>
    </group>
  );
}

// ───────────────────────── COMPRESSOR ─────────────────────────
// Multi-stage horizontal barrel with big motor + coupling, very industrial
function CompressorModel({ color, emphasized, dimmed }: ModelProps) {
  const { base, steel, darkSteel, accent, hazard } = useMaterials(color, emphasized, dimmed);
  return (
    <group>
      {/* baseplate */}
      <mesh material={darkSteel} position={[0, 0.04, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 0.08, 1.3]} />
      </mesh>
      <Bolts radius={1.4} y={0.085} count={10} material={accent} />

      {/* compressor body — 3-stage barrel */}
      <mesh material={base} castShadow position={[0.4, 0.85, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.5, 0.5, 1.6, 32]} />
      </mesh>
      {/* stage dividers (flanges between stages) */}
      {[-0.3, 0.3].map((x, i) => (
        <mesh key={i} material={darkSteel} position={[0.4 + x, 0.85, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.55, 0.55, 0.08, 32]} />
        </mesh>
      ))}
      {/* end covers */}
      <mesh material={darkSteel} position={[0.4 + 0.85, 0.85, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.56, 0.56, 0.1, 32]} />
      </mesh>
      <mesh material={darkSteel} position={[0.4 - 0.85, 0.85, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.56, 0.56, 0.1, 32]} />
      </mesh>

      {/* suction nozzle (left, large) */}
      <mesh material={steel} position={[-0.6, 1.05, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.22, 0.22, 0.4, 20]} />
      </mesh>
      {/* discharge nozzle (right, large) */}
      <mesh material={steel} position={[1.4, 1.05, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.2, 0.2, 0.4, 20]} />
      </mesh>

      {/* coupling between motor & compressor */}
      <mesh material={accent} position={[-0.55, 0.85, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.18, 0.18, 0.18, 16]} />
      </mesh>
      {/* coupling guard */}
      <mesh material={hazard} position={[-0.55, 0.7, 0]}>
        <boxGeometry args={[0.25, 0.05, 0.45]} />
      </mesh>

      {/* big electric motor */}
      <mesh material={darkSteel} castShadow position={[-1.2, 0.7, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.42, 0.42, 1.0, 32]} />
      </mesh>
      {/* motor cooling fins */}
      {Array.from({ length: 32 }).map((_, i) => (
        <mesh
          key={i}
          material={steel}
          position={[-1.2, 0.7, 0]}
          rotation={[0, 0, (i / 32) * Math.PI * 2]}
        >
          <boxGeometry args={[0.88, 0.9, 0.012]} />
        </mesh>
      ))}
      {/* motor terminal box */}
      <mesh material={accent} position={[-1.2, 1.2, 0]}>
        <boxGeometry args={[0.4, 0.22, 0.3]} />
      </mesh>

      {/* control panel (labeled box) */}
      <mesh material={accent} position={[0.8, 1.55, 0.55]}>
        <boxGeometry args={[0.5, 0.5, 0.12]} />
      </mesh>
      <mesh material={hazard} position={[0.8, 1.55, 0.62]}>
        <boxGeometry args={[0.35, 0.18, 0.01]} />
      </mesh>
      {/* pressure gauges */}
      <mesh material={hazard} position={[0.0, 1.3, 0.5]}>
        <cylinderGeometry args={[0.08, 0.08, 0.06, 16]} rotation={[Math.PI / 2, 0, 0]} />
      </mesh>
      <mesh material={hazard} position={[0.8, 1.3, 0.5]}>
        <cylinderGeometry args={[0.08, 0.08, 0.06, 16]} rotation={[Math.PI / 2, 0, 0]} />
      </mesh>

      {/* piping on top — interstage pipe */}
      <mesh material={steel} position={[0.4, 1.5, 0]}>
        <boxGeometry args={[1.2, 0.08, 0.08]} />
      </mesh>
      <mesh material={steel} position={[0.4, 1.5, 0]}>
        <boxGeometry args={[0.08, 0.4, 0.08]} />
      </mesh>
    </group>
  );
}

// ───────────────────────── COLUMN ─────────────────────────
// Very tall slender vessel with visible trays, overhead pipework, reboiler connect
function ColumnModel({ color, emphasized, dimmed }: ModelProps) {
  const { base, steel, darkSteel, accent, glass } = useMaterials(color, emphasized, dimmed);
  const h = 3.6;
  const r = 0.58;
  return (
    <group>
      {/* support skirt */}
      <mesh material={darkSteel} position={[0, 0.25, 0]}>
        <cylinderGeometry args={[r * 0.82, r * 0.95, 0.5, 24]} />
      </mesh>
      {/* vessel body */}
      <mesh material={base} castShadow receiveShadow position={[0, h / 2 + 0.5, 0]}>
        <cylinderGeometry args={[r, r, h, 36]} />
      </mesh>
      {/* tray rings (visible external bands marking each tray) */}
      {Array.from({ length: 9 }).map((_, i) => (
        <mesh key={i} material={accent} position={[0, 0.8 + i * (h - 0.6) / 8, 0]}>
          <torusGeometry args={[r + 0.008, 0.025, 6, 36]} />
        </mesh>
      ))}
      {/* internal downcomer hints (glass strips inside) */}
      {Array.from({ length: 4 }).map((_, i) => (
        <mesh key={i} material={glass} position={[r * 0.5, 1.2 + i * 0.7, 0]}>
          <boxGeometry args={[0.04, 0.4, r * 1.2]} />
        </mesh>
      ))}
      {/* top head */}
      <mesh material={base} position={[0, h + 0.5, 0]}>
        <sphereGeometry args={[r, 36, 18, 0, Math.PI * 2, 0, Math.PI / 2.5]} />
      </mesh>
      {/* bottom head */}
      <mesh material={steel} position={[0, 0.5, 0]}>
        <sphereGeometry args={[r, 36, 18, 0, Math.PI * 2, Math.PI - Math.PI / 2.5, Math.PI / 2.5]} />
      </mesh>
      {/* top flange */}
      <mesh material={steel} position={[0, h + 0.65, 0]}>
        <cylinderGeometry args={[r + 0.1, r + 0.1, 0.1, 36]} />
      </mesh>
      <Bolts radius={r + 0.08} y={h + 0.65} count={20} material={accent} />
      {/* overhead vapour outlet */}
      <mesh material={darkSteel} position={[0, h + 0.85, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.3, 20]} />
      </mesh>
      {/* reflux inlet (angled) */}
      <mesh material={darkSteel} position={[r * 0.6, h + 0.55, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <cylinderGeometry args={[0.1, 0.1, 0.4, 16]} />
      </mesh>
      {/* feed nozzle (mid) */}
      <mesh material={darkSteel} position={[-r - 0.15, h * 0.5 + 0.5, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.13, 0.13, 0.3, 16]} />
      </mesh>
      <mesh material={darkSteel} position={[-r - 0.22, h * 0.5 + 0.5, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.18, 0.18, 0.05, 16]} />
      </mesh>
      {/* bottoms outlet */}
      <mesh material={darkSteel} position={[0, 0.3, r + 0.1]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.13, 0.13, 0.3, 16]} />
      </mesh>
      {/* external platform (mid) */}
      <mesh material={accent} position={[r + 0.4, h * 0.5 + 0.5, 0]}>
        <boxGeometry args={[0.8, 0.04, 1.0]} />
      </mesh>
      <mesh material={accent} position={[r + 0.4, h * 0.5 + 0.3, 0.45]}>
        <boxGeometry args={[0.04, 0.4, 0.04]} />
      </mesh>
      <mesh material={accent} position={[r + 0.4, h * 0.5 + 0.3, -0.45]}>
        <boxGeometry args={[0.04, 0.4, 0.04]} />
      </mesh>
      {/* access ladder */}
      <mesh material={accent} position={[r + 0.18, h * 0.5 + 0.5, 0]}>
        <boxGeometry args={[0.04, h * 0.9, 0.04]} />
      </mesh>
      {Array.from({ length: 9 }).map((_, i) => (
        <mesh key={i} material={accent} position={[r + 0.18, 0.8 + i * 0.35, 0.1]}>
          <boxGeometry args={[0.04, 0.04, 0.18]} />
        </mesh>
      ))}
    </group>
  );
}

// ───────────────────────── SEPARATOR ─────────────────────────
// Vertical vessel with tangential inlet (swirl), demister pad, level gauge
function SeparatorModel({ color, emphasized, dimmed }: ModelProps) {
  const { base, steel, darkSteel, accent, glass } = useMaterials(color, emphasized, dimmed);
  const h = 2.2;
  const r = 0.58;
  return (
    <group>
      {/* support legs (3 angled legs) */}
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2;
        return (
          <mesh
            key={i}
            material={darkSteel}
            position={[Math.cos(a) * r * 0.7, 0.3, Math.sin(a) * r * 0.7]}
            rotation={[Math.sin(a) * 0.25, 0, -Math.cos(a) * 0.25]}
          >
            <cylinderGeometry args={[0.05, 0.05, 0.7, 8]} />
          </mesh>
        );
      })}
      {/* vessel */}
      <mesh material={base} castShadow position={[0, h / 2 + 0.5, 0]}>
        <cylinderGeometry args={[r, r, h, 32]} />
      </mesh>
      {/* demister pad (internal, glass-tinted) */}
      <mesh material={glass} position={[0, h * 0.85 + 0.5, 0]}>
        <cylinderGeometry args={[r - 0.03, r - 0.03, 0.12, 32]} />
      </mesh>
      {/* demister support ring */}
      <mesh material={accent} position={[0, h * 0.85 + 0.4, 0]}>
        <torusGeometry args={[r - 0.02, 0.02, 6, 32]} />
      </mesh>
      {/* top head */}
      <mesh material={base} position={[0, h + 0.5, 0]}>
        <sphereGeometry args={[r, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2.5]} />
      </mesh>
      {/* bottom head */}
      <mesh material={steel} position={[0, 0.5, 0]}>
        <sphereGeometry args={[r, 32, 16, 0, Math.PI * 2, Math.PI - Math.PI / 2.5, Math.PI / 2.5]} />
      </mesh>
      {/* tangential inlet (swirl inducer) — angled nozzle */}
      <mesh material={darkSteel} position={[r + 0.05, h * 0.7 + 0.5, 0]} rotation={[0, 0, Math.PI / 2.2]}>
        <cylinderGeometry args={[0.14, 0.14, 0.4, 20]} />
      </mesh>
      <mesh material={darkSteel} position={[r + 0.2, h * 0.7 + 0.5, 0]} rotation={[0, 0, Math.PI / 2.2]}>
        <cylinderGeometry args={[0.19, 0.19, 0.06, 20]} />
      </mesh>
      {/* gas outlet top */}
      <mesh material={darkSteel} position={[0, h + 0.75, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.3, 20]} />
      </mesh>
      {/* liquid outlet bottom */}
      <mesh material={darkSteel} position={[0, 0.25, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.3, 16]} />
      </mesh>
      {/* interface level gauge (vertical glass) */}
      <mesh material={glass} position={[r + 0.02, h * 0.45 + 0.5, 0.25]}>
        <boxGeometry args={[0.06, h * 0.6, 0.04]} />
      </mesh>
      <mesh material={accent} position={[r + 0.04, h * 0.45 + 0.5, 0.21]}>
        <boxGeometry args={[0.02, h * 0.62, 0.02]} />
      </mesh>
      <mesh material={accent} position={[r + 0.04, h * 0.45 + 0.5, 0.29]}>
        <boxGeometry args={[0.02, h * 0.62, 0.02]} />
      </mesh>
    </group>
  );
}

// ───────────────────────── VALVE ─────────────────────────
// Globe valve with actuator on top — small but very distinctive
function ValveModel({ color, emphasized, dimmed }: ModelProps) {
  const { base, steel, darkSteel, accent } = useMaterials(color, emphasized, dimmed);
  return (
    <group>
      {/* globular body */}
      <mesh material={base} castShadow position={[0, 0.45, 0]}>
        <sphereGeometry args={[0.28, 24, 16]} />
      </mesh>
      {/* bonnet */}
      <mesh material={darkSteel} position={[0, 0.78, 0]}>
        <cylinderGeometry args={[0.14, 0.18, 0.22, 16]} />
      </mesh>
      {/* yoke arms */}
      <mesh material={steel} position={[0.12, 1.0, 0]}>
        <boxGeometry args={[0.06, 0.4, 0.1]} />
      </mesh>
      <mesh material={steel} position={[-0.12, 1.0, 0]}>
        <boxGeometry args={[0.06, 0.4, 0.1]} />
      </mesh>
      {/* actuator body */}
      <mesh material={darkSteel} position={[0, 1.3, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.25, 20]} />
      </mesh>
      {/* position indicator */}
      <mesh material={accent} position={[0, 1.45, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.12, 8]} />
      </mesh>
      {/* flanges left/right */}
      <mesh material={darkSteel} position={[0.5, 0.45, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.24, 0.24, 0.08, 20]} />
      </mesh>
      <mesh material={darkSteel} position={[-0.5, 0.45, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.24, 0.24, 0.08, 20]} />
      </mesh>
      <Bolts radius={0.21} y={0.45} count={8} material={accent} />
      {/* stem */}
      <mesh material={accent} position={[0, 0.95, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.4, 8]} />
      </mesh>
    </group>
  );
}

// ───────────────────────── HEATER (fired) ─────────────────────────
// Big box firebox with tall stack — unmistakably different from vessels
function HeaterModel({ color, emphasized, dimmed }: ModelProps) {
  const { base, steel, darkSteel, accent, hazard, glass } = useMaterials(color, emphasized, dimmed);
  return (
    <group>
      {/* firebox (large rectangular) */}
      <mesh material={base} castShadow receiveShadow position={[0, 1.3, 0]}>
        <boxGeometry args={[1.8, 2.4, 1.6]} />
      </mesh>
      {/* refractory inner glow */}
      <mesh material={glass} position={[0, 1.1, 0.82]}>
        <boxGeometry args={[1.4, 1.8, 0.02]} />
      </mesh>
      {/* burner fronts (multiple) */}
      {[-0.5, 0, 0.5].map((x, i) => (
        <group key={i}>
          <mesh material={darkSteel} position={[x, 0.4, 0.85]}>
            <cylinderGeometry args={[0.16, 0.2, 0.2, 16]} rotation={[Math.PI / 2, 0, 0]} />
          </mesh>
          <mesh material={hazard} position={[x, 0.4, 0.97]}>
            <cylinderGeometry args={[0.12, 0.12, 0.04, 16]} rotation={[Math.PI / 2, 0, 0]} />
          </mesh>
        </group>
      ))}
      {/* tube coils on walls (radiant section) */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={i} material={accent} position={[0.88, 0.6 + i * 0.3, 0]}>
          <boxGeometry args={[0.04, 0.2, 1.2]} />
        </mesh>
      ))}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={`l${i}`} material={accent} position={[-0.88, 0.6 + i * 0.3, 0]}>
          <boxGeometry args={[0.04, 0.2, 1.2]} />
        </mesh>
      ))}
      {/* convection section (smaller box on top) */}
      <mesh material={steel} position={[0, 2.85, 0]}>
        <boxGeometry args={[1.6, 0.6, 1.4]} />
      </mesh>
      {/* convection tube bundle */}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={i} material={accent} position={[-0.6 + i * 0.3, 2.85, 0]}>
          <boxGeometry args={[0.05, 0.5, 1.2]} />
        </mesh>
      ))}
      {/* stack (tall chimney) */}
      <mesh material={darkSteel} position={[0, 4.0, 0]}>
        <cylinderGeometry args={[0.35, 0.4, 1.8, 24]} />
      </mesh>
      {/* stack flange */}
      <mesh material={darkSteel} position={[0, 3.2, 0]}>
        <cylinderGeometry args={[0.42, 0.42, 0.1, 24]} />
      </mesh>
      {/* stack bracing */}
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2;
        return (
          <mesh key={i} material={steel} position={[Math.cos(a) * 0.5, 3.6, Math.sin(a) * 0.5]} rotation={[0, -a, 0.5]}>
            <boxGeometry args={[0.04, 1.2, 0.04]} />
          </mesh>
        );
      })}
      {/* process inlet/outlet */}
      <mesh material={darkSteel} position={[-1.0, 0.6, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.12, 0.12, 0.3, 16]} />
      </mesh>
      <mesh material={darkSteel} position={[1.0, 2.3, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.12, 0.12, 0.3, 16]} />
      </mesh>
    </group>
  );
}

// ───────────────────────── FILTER ─────────────────────────
// Vertical housing with visible cartridge bundle inside
function FilterModel({ color, emphasized, dimmed }: ModelProps) {
  const { base, steel, darkSteel, accent, glass } = useMaterials(color, emphasized, dimmed);
  return (
    <group>
      {/* base */}
      <mesh material={darkSteel} position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.7, 0.75, 0.2, 24]} />
      </mesh>
      {/* housing (glass so cartridges are visible) */}
      <mesh material={glass} position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.6, 0.6, 2.0, 24]} />
      </mesh>
      {/* internal cartridges (vertical tubes) */}
      {Array.from({ length: 7 }).map((_, i) => {
        const a = (i / 7) * Math.PI * 2;
        const rr = i === 0 ? 0 : 0.3;
        return (
          <mesh
            key={i}
            material={accent}
            position={[Math.cos(a) * rr, 1.2, Math.sin(a) * rr]}
          >
            <cylinderGeometry args={[0.08, 0.08, 1.7, 12]} />
          </mesh>
        );
      })}
      {/* top flange & cover */}
      <mesh material={darkSteel} position={[0, 2.25, 0]}>
        <cylinderGeometry args={[0.72, 0.72, 0.15, 24]} />
      </mesh>
      <Bolts radius={0.65} y={2.25} count={12} material={accent} />
      <mesh material={steel} position={[0, 2.4, 0]}>
        <cylinderGeometry args={[0.6, 0.6, 0.15, 24]} />
      </mesh>
      {/* inlet (side) */}
      <mesh material={darkSteel} position={[0.75, 0.7, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.13, 0.13, 0.4, 16]} />
      </mesh>
      {/* outlet (bottom) */}
      <mesh material={darkSteel} position={[0, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.13, 0.13, 0.4, 16]} />
      </mesh>
      {/* drain valve at bottom */}
      <mesh material={base} position={[0, 0.1, 0.6]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.2, 12]} />
      </mesh>
    </group>
  );
}

// ───────────────────────── MOTOR ─────────────────────────
// Horizontal cylindrical motor with prominent cooling fins & terminal box
function MotorModel({ color, emphasized, dimmed }: ModelProps) {
  const { base, steel, darkSteel, accent } = useMaterials(color, emphasized, dimmed);
  return (
    <group>
      {/* baseplate */}
      <mesh material={darkSteel} position={[0, 0.04, 0]}>
        <boxGeometry args={[1.8, 0.08, 1.0]} />
      </mesh>
      <Bolts radius={0.75} y={0.085} count={8} material={accent} />
      {/* motor body */}
      <mesh material={base} castShadow position={[-0.1, 0.6, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.42, 0.42, 1.1, 32]} />
      </mesh>
      {/* end bells */}
      <mesh material={darkSteel} position={[0.45, 0.6, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.45, 0.45, 0.1, 32]} />
      </mesh>
      <mesh material={darkSteel} position={[-0.65, 0.6, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.45, 0.45, 0.1, 32]} />
      </mesh>
      {/* cooling fins — radial */}
      {Array.from({ length: 30 }).map((_, i) => (
        <mesh
          key={i}
          material={steel}
          position={[-0.1, 0.6, 0]}
          rotation={[0, 0, (i / 30) * Math.PI * 2]}
        >
          <boxGeometry args={[0.9, 0.9, 0.012]} />
        </mesh>
      ))}
      {/* terminal box */}
      <mesh material={accent} position={[-0.1, 1.0, 0]}>
        <boxGeometry args={[0.5, 0.25, 0.32]} />
      </mesh>
      {/* shaft */}
      <mesh material={accent} position={[0.75, 0.6, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.06, 0.06, 0.5, 12]} />
      </mesh>
      {/* coupling */}
      <mesh material={darkSteel} position={[1.0, 0.6, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.12, 0.12, 0.12, 16]} />
      </mesh>
      {/* feet */}
      <mesh material={accent} position={[-0.4, 0.25, 0.35]}>
        <boxGeometry args={[0.3, 0.3, 0.15]} />
      </mesh>
      <mesh material={accent} position={[-0.4, 0.25, -0.35]}>
        <boxGeometry args={[0.3, 0.3, 0.15]} />
      </mesh>
      <mesh material={accent} position={[0.2, 0.25, 0.35]}>
        <boxGeometry args={[0.3, 0.3, 0.15]} />
      </mesh>
      <mesh material={accent} position={[0.2, 0.25, -0.35]}>
        <boxGeometry args={[0.3, 0.3, 0.15]} />
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
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
        </mesh>
      );
  }
}
