"use client";

import * as THREE from "three";

/**
 * Safety systems and site infrastructure.
 * These make the plant feel like a real facility with safety culture.
 */

const SAFETY_YELLOW = "#facc15";
const SAFETY_RED = "#dc2626";
const SAFETY_GREEN = "#16a34a";
const CONCRETE = "#5a5852";
const STEEL = "#4a4e53";

/** A safety shower + eyewash station */
export function SafetyShower({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Vertical pipe */}
      <mesh position={[0, 1.1, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 2.2, 8]} />
        <meshStandardMaterial color={SAFETY_GREEN} metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Shower head */}
      <mesh position={[0, 2.2, 0]}>
        <coneGeometry args={[0.2, 0.15, 12]} />
        <meshStandardMaterial color={SAFETY_GREEN} metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Pull chain */}
      <mesh position={[0.15, 1.8, 0]}>
        <boxGeometry args={[0.01, 0.4, 0.01]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.7} />
      </mesh>
      {/* Eyewash bowl */}
      <mesh position={[0.3, 0.9, 0]}>
        <cylinderGeometry args={[0.12, 0.1, 0.08, 12]} />
        <meshStandardMaterial color={SAFETY_GREEN} metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Sign */}
      <mesh position={[0, 1.5, 0.05]}>
        <boxGeometry args={[0.2, 0.2, 0.02]} />
        <meshStandardMaterial color={SAFETY_GREEN} />
      </mesh>
    </group>
  );
}

/** A fire extinguisher on a stand */
export function FireExtinguisher({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Cylinder body */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.6, 12]} />
        <meshStandardMaterial color={SAFETY_RED} metalness={0.4} roughness={0.4} />
      </mesh>
      {/* Top cap */}
      <mesh position={[0, 0.68, 0]}>
        <cylinderGeometry args={[0.05, 0.06, 0.06, 8]} />
        <meshStandardMaterial color="#1f2937" metalness={0.6} />
      </mesh>
      {/* Handle */}
      <mesh position={[0, 0.72, 0]}>
        <boxGeometry args={[0.12, 0.02, 0.04]} />
        <meshStandardMaterial color="#1f2937" metalness={0.6} />
      </mesh>
      {/* Mounting bracket */}
      <mesh position={[0.12, 0.4, 0]}>
        <boxGeometry args={[0.08, 0.15, 0.04]} />
        <meshStandardMaterial color={STEEL} metalness={0.6} />
      </mesh>
    </group>
  );
}

/** A warning sign on a post */
export function WarningSign({ position, rotation = 0, color = SAFETY_YELLOW }: { position: [number, number, number]; rotation?: number; color?: string }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Post */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[0.04, 1.2, 0.04]} />
        <meshStandardMaterial color={STEEL} metalness={0.6} />
      </mesh>
      {/* Sign board */}
      <mesh position={[0, 1.3, 0]}>
        <boxGeometry args={[0.3, 0.2, 0.02]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

/** A drainage channel in the ground */
export function DrainageChannel({ position, length, rotation = 0 }: { position: [number, number, number]; length: number; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Channel trough */}
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[0.3, 0.04, length]} />
        <meshStandardMaterial color="#2a2d31" roughness={0.9} />
      </mesh>
      {/* Grating on top */}
      {Array.from({ length: Math.floor(length / 0.15) }).map((_, i) => (
        <mesh key={i} position={[0, 0.05, -length / 2 + i * 0.15 + 0.075]}>
          <boxGeometry args={[0.28, 0.02, 0.04]} />
          <meshStandardMaterial color={STEEL} metalness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

/** A cable tray — elevated tray carrying cables along a path */
export function CableTray({ position, length, rotation = 0 }: { position: [number, number, number]; length: number; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Tray bottom */}
      <mesh>
        <boxGeometry args={[0.2, 0.02, length]} />
        <meshStandardMaterial color="#374151" metalness={0.5} />
      </mesh>
      {/* Side rails */}
      <mesh position={[0.1, 0.05, 0]}>
        <boxGeometry args={[0.02, 0.1, length]} />
        <meshStandardMaterial color="#374151" metalness={0.5} />
      </mesh>
      <mesh position={[-0.1, 0.05, 0]}>
        <boxGeometry args={[0.02, 0.1, length]} />
        <meshStandardMaterial color="#374151" metalness={0.5} />
      </mesh>
      {/* Cables inside */}
      <mesh position={[0, 0.04, 0]}>
        <boxGeometry args={[0.15, 0.04, length]} />
        <meshStandardMaterial color="#1f2937" roughness={0.8} />
      </mesh>
    </group>
  );
}

/** A service road — asphalt strip with painted lines */
export function ServiceRoad({ position, length, width = 4, rotation = 0 }: { position: [number, number, number]; length: number; width?: number; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Asphalt */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width, length]} />
        <meshStandardMaterial color="#1f1f23" roughness={0.95} />
      </mesh>
      {/* Center line */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.15, length]} />
        <meshStandardMaterial color={SAFETY_YELLOW} />
      </mesh>
    </group>
  );
}

/** A chain-link fence section */
export function FenceSection({ position, length, rotation = 0 }: { position: [number, number, number]; length: number; rotation?: number }) {
  const fenceMat = new THREE.MeshStandardMaterial({ color: "#6b7280", metalness: 0.6, roughness: 0.5, wireframe: true });
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Posts at each end */}
      <mesh position={[length / 2, 0.75, 0]} castShadow>
        <boxGeometry args={[0.06, 1.5, 0.06]} />
        <meshStandardMaterial color={STEEL} metalness={0.6} />
      </mesh>
      <mesh position={[-length / 2, 0.75, 0]} castShadow>
        <boxGeometry args={[0.06, 1.5, 0.06]} />
        <meshStandardMaterial color={STEEL} metalness={0.6} />
      </mesh>
      {/* Chain link mesh */}
      <mesh position={[0, 0.75, 0]}>
        <boxGeometry args={[length, 1.4, 0.01]} />
        <primitive object={fenceMat} attach="material" />
      </mesh>
      {/* Top rail */}
      <mesh position={[0, 1.5, 0]}>
        <boxGeometry args={[length, 0.04, 0.04]} />
        <meshStandardMaterial color={STEEL} metalness={0.6} />
      </mesh>
    </group>
  );
}
