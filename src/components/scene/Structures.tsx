"use client";

import * as THREE from "three";

/**
 * Static plant structures — pipe racks, bunds, platforms, stairways.
 * These make the plant look like a real industrial facility instead of
 * equipment floating on a plane.
 */

const STEEL_COLOR = "#6b7280"; // industrial grey steel (not yellow)
const CONCRETE_COLOR = "#5a5852";
const DARK_STEEL_COLOR = "#3a3d42";

/** A steel pipe rack — vertical columns + horizontal beams at multiple levels */
export function PipeRackStructure({
  from,
  to,
  height = 6,
  levels = 2,
}: {
  from: { x: number; z: number };
  to: { x: number; z: number };
  height?: number;
  levels?: number;
}) {
  const length = Math.sqrt((to.x - from.x) ** 2 + (to.z - from.z) ** 2);
  const angle = Math.atan2(to.z - from.z, to.x - from.x);
  const midX = (from.x + to.x) / 2;
  const midZ = (from.z + to.z) / 2;
  const bayLength = 5;
  const bays = Math.max(1, Math.floor(length / bayLength));
  const steelMat = new THREE.MeshStandardMaterial({ color: STEEL_COLOR, roughness: 0.5, metalness: 0.6 });
  const darkSteelMat = new THREE.MeshStandardMaterial({ color: DARK_STEEL_COLOR, roughness: 0.5, metalness: 0.6 });

  return (
    <group position={[midX, 0, midZ]} rotation={[0, -angle, 0]}>
      {/* Slender vertical columns (I-beam profile) at each bay */}
      {Array.from({ length: bays + 1 }).map((_, i) => {
        const x = -length / 2 + i * (length / bays);
        return (
          <group key={i}>
            {/* Left column — slender cylinder */}
            <mesh position={[x, height / 2, -1.5]} castShadow material={steelMat}>
              <cylinderGeometry args={[0.08, 0.08, height, 8]} />
            </mesh>
            {/* Right column */}
            <mesh position={[x, height / 2, 1.5]} castShadow material={steelMat}>
              <cylinderGeometry args={[0.08, 0.08, height, 8]} />
            </mesh>
            {/* Base plates */}
            <mesh position={[x, 0.05, -1.5]} material={darkSteelMat}>
              <boxGeometry args={[0.3, 0.1, 0.3]} />
            </mesh>
            <mesh position={[x, 0.05, 1.5]} material={darkSteelMat}>
              <boxGeometry args={[0.3, 0.1, 0.3]} />
            </mesh>
          </group>
        );
      })}
      {/* Slim horizontal beams at each level — pipes rest on these */}
      {Array.from({ length: levels }).map((_, level) => {
        const y = height * ((level + 1) / levels);
        return (
          <group key={level}>
            <mesh position={[0, y, -1.5]} castShadow material={steelMat}>
              <boxGeometry args={[length + 0.2, 0.12, 0.12]} />
            </mesh>
            <mesh position={[0, y, 1.5]} castShadow material={steelMat}>
              <boxGeometry args={[length + 0.2, 0.12, 0.12]} />
            </mesh>
            {/* Cross-ties between beams (slender, not chunky) */}
            {Array.from({ length: bays }).map((_, j) => {
              const tx = -length / 2 + j * (length / bays) + length / bays / 2;
              return (
                <mesh key={j} position={[tx, y, 0]} material={steelMat}>
                  <boxGeometry args={[0.08, 0.08, 3]} />
                </mesh>
              );
            })}
          </group>
        );
      })}
      {/* Diagonal bracing on the sides for structural rigidity */}
      {Array.from({ length: bays }).map((_, i) => {
        const x1 = -length / 2 + i * (length / bays);
        const x2 = x1 + length / bays;
        return (
          <group key={`brace-${i}`}>
            <mesh position={[(x1 + x2) / 2, height * 0.5, -1.5]} rotation={[0, 0, Math.PI / 4]} material={steelMat}>
              <boxGeometry args={[0.06, length / bays * 1.4, 0.06]} />
            </mesh>
            <mesh position={[(x1 + x2) / 2, height * 0.5, 1.5]} rotation={[0, 0, Math.PI / 4]} material={steelMat}>
              <boxGeometry args={[0.06, length / bays * 1.4, 0.06]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/** A bund — low concrete wall around tank farms for spill containment */
export function Bund({
  position,
  size,
}: {
  position: [number, number, number];
  size: [number, number, number]; // width, height, depth
}) {
  const [w, h, d] = size;
  const wallHeight = 0.6;
  const wallThickness = 0.2;
  const concreteMat = new THREE.MeshStandardMaterial({ color: CONCRETE_COLOR, roughness: 0.95, metalness: 0.02 });

  return (
    <group position={position}>
      {/* Floor of the bund (slightly different color to show containment area) */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={concreteMat}>
        <planeGeometry args={[w, d]} />
      </mesh>
      {/* Four walls */}
      <mesh position={[0, wallHeight / 2, d / 2]} castShadow material={concreteMat}>
        <boxGeometry args={[w, wallHeight, wallThickness]} />
      </mesh>
      <mesh position={[0, wallHeight / 2, -d / 2]} castShadow material={concreteMat}>
        <boxGeometry args={[w, wallHeight, wallThickness]} />
      </mesh>
      <mesh position={[w / 2, wallHeight / 2, 0]} castShadow material={concreteMat}>
        <boxGeometry args={[wallThickness, wallHeight, d]} />
      </mesh>
      <mesh position={[-w / 2, wallHeight / 2, 0]} castShadow material={concreteMat}>
        <boxGeometry args={[wallThickness, wallHeight, d]} />
      </mesh>
    </group>
  );
}

/** A steel platform — grated deck on I-beam supports for elevated equipment */
export function Platform({
  position,
  size,
  height = 4,
}: {
  position: [number, number, number];
  size: [number, number]; // width, depth
  height?: number;
}) {
  const [w, d] = size;
  const steelMat = new THREE.MeshStandardMaterial({ color: STEEL_COLOR, roughness: 0.6, metalness: 0.3 });
  const deckMat = new THREE.MeshStandardMaterial({ color: DARK_STEEL_COLOR, roughness: 0.7, metalness: 0.4 });

  return (
    <group position={position}>
      {/* Deck — slightly transparent to look like grating */}
      <mesh position={[0, height, 0]} castShadow receiveShadow material={deckMat}>
        <boxGeometry args={[w, 0.1, d]} />
      </mesh>
      {/* Support beams underneath */}
      <mesh position={[0, height - 0.15, 0]} material={steelMat}>
        <boxGeometry args={[w - 0.2, 0.2, 0.2]} />
      </mesh>
      <mesh position={[0, height - 0.15, 0]} material={steelMat}>
        <boxGeometry args={[0.2, 0.2, d - 0.2]} />
      </mesh>
      {/* Vertical legs at corners */}
      {[
        [w / 2 - 0.15, d / 2 - 0.15],
        [-(w / 2 - 0.15), d / 2 - 0.15],
        [w / 2 - 0.15, -(d / 2 - 0.15)],
        [-(w / 2 - 0.15), -(d / 2 - 0.15)],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, height / 2, z]} castShadow material={steelMat}>
          <boxGeometry args={[0.2, height, 0.2]} />
        </mesh>
      ))}
      {/* Handrail around the edge */}
      {[
        [0, d / 2, w, 0.05],
        [0, -d / 2, w, 0.05],
        [w / 2, 0, 0.05, d],
        [-w / 2, 0, 0.05, d],
      ].map(([x, z, rw, rd], i) => (
        <group key={i}>
          <mesh position={[x, height + 1, z]} material={steelMat}>
            <boxGeometry args={[rw, 0.05, rd]} />
          </mesh>
          {/* Handrail posts */}
          {Array.from({ length: Math.max(2, Math.floor((rw > 0.1 ? w : d) / 1.5)) }).map((_, j) => {
            const offset = (j / Math.max(1, Math.floor((rw > 0.1 ? w : d) / 1.5) - 1) - 0.5) * (rw > 0.1 ? w : d);
            return (
              <mesh
                key={j}
                position={[rw > 0.1 ? x + offset : x, height + 0.5, rd > 0.1 ? z + offset : z]}
                material={steelMat}
              >
                <boxGeometry args={[0.04, 1, 0.04]} />
              </mesh>
            );
          })}
        </group>
      ))}
    </group>
  );
}

/** A stairway connecting grade to a platform */
export function Stairway({
  position,
  rotation = 0,
  height = 4,
}: {
  position: [number, number, number];
  rotation?: number;
  height?: number;
}) {
  const steelMat = new THREE.MeshStandardMaterial({ color: STEEL_COLOR, roughness: 0.6, metalness: 0.3 });
  const stepCount = Math.floor(height / 0.2);
  const stairLength = height * 1.5; // 45-degree angle approx

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Stringers (side supports) */}
      <mesh position={[0, height / 2, -stairLength / 2]} rotation={[Math.PI / 4, 0, 0]} material={steelMat}>
        <boxGeometry args={[1.2, 0.1, stairLength * 1.4]} />
      </mesh>
      <mesh position={[0, height / 2, stairLength / 2]} rotation={[-Math.PI / 4, 0, 0]} material={steelMat}>
        <boxGeometry args={[1.2, 0.1, stairLength * 1.4]} />
      </mesh>
      {/* Steps */}
      {Array.from({ length: stepCount }).map((_, i) => {
        const t = i / stepCount;
        const y = t * height;
        const z = -stairLength / 2 + t * stairLength;
        return (
          <mesh key={i} position={[0, y, z]} material={steelMat}>
            <boxGeometry args={[1, 0.04, 0.25]} />
          </mesh>
        );
      })}
    </group>
  );
}

/** A control room building — small structure on the periphery */
export function ControlRoom({ position }: { position: [number, number, number] }) {
  const wallMat = new THREE.MeshStandardMaterial({ color: "#9ca3af", roughness: 0.8, metalness: 0.1 });
  const roofMat = new THREE.MeshStandardMaterial({ color: "#4b5563", roughness: 0.7, metalness: 0.2 });

  return (
    <group position={position}>
      {/* Walls */}
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow material={wallMat}>
        <boxGeometry args={[6, 3, 4]} />
      </mesh>
      {/* Roof */}
      <mesh position={[0, 3.2, 0]} material={roofMat}>
        <boxGeometry args={[6.2, 0.2, 4.2]} />
      </mesh>
      {/* Door */}
      <mesh position={[0, 1, 2.01]} material={new THREE.MeshStandardMaterial({ color: "#374151", roughness: 0.6 })}>
        <boxGeometry args={[1, 2, 0.05]} />
      </mesh>
      {/* Windows */}
      <mesh position={[-2, 1.5, 2.01]} material={new THREE.MeshStandardMaterial({ color: "#1e293b", roughness: 0.1, metalness: 0.8 })}>
        <boxGeometry args={[1.5, 1, 0.05]} />
      </mesh>
      <mesh position={[2, 1.5, 2.01]} material={new THREE.MeshStandardMaterial({ color: "#1e293b", roughness: 0.1, metalness: 0.8 })}>
        <boxGeometry args={[1.5, 1, 0.05]} />
      </mesh>
    </group>
  );
}

/** A flare stack — tall thin structure with a flickering flame on top */
export function FlareStack({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 12, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.6, 24, 16]} />
        <meshStandardMaterial color="#4b5563" roughness={0.6} metalness={0.4} />
      </mesh>
      {/* Flame tip */}
      <mesh position={[0, 25, 0]}>
        <coneGeometry args={[0.5, 2, 8]} />
        <meshBasicMaterial color="#fb923c" transparent opacity={0.7} />
      </mesh>
      <mesh position={[0, 25.5, 0]}>
        <coneGeometry args={[0.3, 1.2, 8]} />
        <meshBasicMaterial color="#fde047" transparent opacity={0.8} />
      </mesh>
    </group>
  );
}
