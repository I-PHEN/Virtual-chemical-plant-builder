"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Industrial clutter kit — small site details that make the plant feel
 * lived-in and real. These are the "scale reference objects" the research
 * identified as critical for immersion.
 *
 * Each component is low-poly but correctly proportioned to real-world sizes.
 */

/** Control panel / junction box — ground-level electrical enclosure */
export function ControlPanel({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Cabinet */}
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.8, 1.2, 0.4]} />
        <meshStandardMaterial color="#4a5568" metalness={0.6} roughness={0.5} />
      </mesh>
      {/* Door handle */}
      <mesh position={[0.3, 0.6, 0.21]}>
        <boxGeometry args={[0.04, 0.15, 0.03]} />
        <meshStandardMaterial color="#374151" metalness={0.7} roughness={0.4} />
      </mesh>
      {/* Warning label */}
      <mesh position={[0, 1.0, 0.21]}>
        <boxGeometry args={[0.15, 0.1, 0.01]} />
        <meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={0.1} />
      </mesh>
      {/* Status LED (emissive — will bloom) */}
      <mesh position={[-0.25, 1.05, 0.21]}>
        <sphereGeometry args={[0.015, 8, 8]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={3} />
      </mesh>
      {/* Concrete pad */}
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <boxGeometry args={[1.0, 0.04, 0.6]} />
        <meshStandardMaterial color="#5a5852" roughness={0.95} />
      </mesh>
    </group>
  );
}

/** Cable tray — elevated tray carrying cables along a path */
export function CableTray({ position, length, rotation = 0, height = 2.5 }: { position: [number, number, number]; length: number; rotation?: number; height?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Support posts */}
      {[-length / 2 + 0.5, 0, length / 2 - 0.5].map((x, i) => (
        <mesh key={i} position={[x, height / 2, 0]} castShadow>
          <boxGeometry args={[0.06, height, 0.06]} />
          <meshStandardMaterial color="#374151" metalness={0.6} roughness={0.5} />
        </mesh>
      ))}
      {/* Tray bottom */}
      <mesh position={[0, height, 0]} castShadow>
        <boxGeometry args={[0.25, 0.02, length]} />
        <meshStandardMaterial color="#374151" metalness={0.5} roughness={0.6} />
      </mesh>
      {/* Side rails */}
      <mesh position={[0.12, height + 0.04, 0]}>
        <boxGeometry args={[0.02, 0.08, length]} />
        <meshStandardMaterial color="#374151" metalness={0.5} roughness={0.6} />
      </mesh>
      <mesh position={[-0.12, height + 0.04, 0]}>
        <boxGeometry args={[0.02, 0.08, length]} />
        <meshStandardMaterial color="#374151" metalness={0.5} roughness={0.6} />
      </mesh>
      {/* Cables inside (colored) */}
      <mesh position={[0, height + 0.02, 0]}>
        <boxGeometry args={[0.15, 0.04, length * 0.95]} />
        <meshStandardMaterial color="#1f2937" roughness={0.8} />
      </mesh>
    </group>
  );
}

/** Safety cone — a tiny but powerful scale reference */
export function SafetyCone({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.35, 0]} castShadow>
        <coneGeometry args={[0.15, 0.7, 16]} />
        <meshStandardMaterial color="#f97316" roughness={0.6} />
      </mesh>
      {/* Reflective stripe */}
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.08, 16]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.3} />
      </mesh>
      {/* Base */}
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[0.3, 0.04, 0.3]} />
        <meshStandardMaterial color="#1f2937" roughness={0.8} />
      </mesh>
    </group>
  );
}

/** Pipe label / tag — equipment identification tag (doubles as voice interaction target) */
export function PipeTag({ position, label, rotation = [0, 0, 0] as [number, number, number] }: { position: [number, number, number]; label: string; rotation?: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Tag plate */}
      <mesh>
        <boxGeometry args={[0.3, 0.15, 0.02]} />
        <meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={0.15} />
      </mesh>
      {/* Chain (two small cylinders) */}
      <mesh position={[0.12, 0.1, 0]}>
        <torusGeometry args={[0.02, 0.005, 4, 8]} />
        <meshStandardMaterial color="#6b7280" metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh position={[-0.12, 0.1, 0]}>
        <torusGeometry args={[0.02, 0.005, 4, 8]} />
        <meshStandardMaterial color="#6b7280" metalness={0.7} roughness={0.4} />
      </mesh>
    </group>
  );
}

/** Spinning fan — animated equipment detail that adds "life" to the scene */
export function SpinningFan({ position, rotation = 0, speed = 2 }: { position: [number, number, number]; rotation?: number; speed?: number }) {
  const fanRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (fanRef.current) {
      fanRef.current.rotation.z += delta * speed;
    }
  });

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Fan housing */}
      <mesh castShadow>
        <boxGeometry args={[0.6, 0.6, 0.15]} />
        <meshStandardMaterial color="#374151" metalness={0.6} roughness={0.5} />
      </mesh>
      {/* Fan blades (spinning) */}
      <group ref={fanRef} position={[0, 0, 0.08]}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} rotation={[0, 0, (i / 4) * Math.PI * 2]}>
            <boxGeometry args={[0.25, 0.08, 0.01]} />
            <meshStandardMaterial color="#9ca3af" metalness={0.7} roughness={0.3} />
          </mesh>
        ))}
        {/* Hub */}
        <mesh>
          <cylinderGeometry args={[0.04, 0.04, 0.04, 8]} rotation={[Math.PI / 2, 0, 0]} />
          <meshStandardMaterial color="#4b5563" metalness={0.8} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

/** Worker figure — a simple low-poly human silhouette for scale reference */
export function WorkerFigure({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Hard hat (yellow) */}
      <mesh position={[0, 1.7, 0]} castShadow>
        <sphereGeometry args={[0.12, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#facc15" roughness={0.6} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.6, 0]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#d4a574" roughness={0.7} />
      </mesh>
      {/* Body (torso) */}
      <mesh position={[0, 1.25, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.12, 0.6, 12]} />
        <meshStandardMaterial color="#3b82f6" roughness={0.7} />
      </mesh>
      {/* Legs */}
      <mesh position={[0.04, 0.75, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.05, 0.55, 8]} />
        <meshStandardMaterial color="#1f2937" roughness={0.7} />
      </mesh>
      <mesh position={[-0.04, 0.75, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.05, 0.55, 8]} />
        <meshStandardMaterial color="#1f2937" roughness={0.7} />
      </mesh>
      {/* Arms */}
      <mesh position={[0.14, 1.3, 0]} rotation={[0, 0, 0.3]} castShadow>
        <cylinderGeometry args={[0.04, 0.035, 0.5, 8]} />
        <meshStandardMaterial color="#3b82f6" roughness={0.7} />
      </mesh>
      <mesh position={[-0.14, 1.3, 0]} rotation={[0, 0, -0.3]} castShadow>
        <cylinderGeometry args={[0.04, 0.035, 0.5, 8]} />
        <meshStandardMaterial color="#3b82f6" roughness={0.7} />
      </mesh>
    </group>
  );
}

/** Handrail section — safety yellow, for platforms and walkways */
export function HandrailSection({ position, length, rotation = 0, height = 1.1 }: { position: [number, number, number]; length: number; rotation?: number; height?: number }) {
  const posts = Math.max(2, Math.floor(length / 1.5) + 1);
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Top rail */}
      <mesh position={[0, height, 0]} castShadow>
        <boxGeometry args={[length, 0.04, 0.04]} />
        <meshStandardMaterial color="#facc15" metalness={0.3} roughness={0.6} />
      </mesh>
      {/* Mid rail */}
      <mesh position={[0, height * 0.55, 0]}>
        <boxGeometry args={[length, 0.03, 0.03]} />
        <meshStandardMaterial color="#facc15" metalness={0.3} roughness={0.6} />
      </mesh>
      {/* Posts */}
      {Array.from({ length: posts }).map((_, i) => (
        <mesh key={i} position={[-length / 2 + (i * length) / (posts - 1), height / 2, 0]} castShadow>
          <boxGeometry args={[0.04, height, 0.04]} />
          <meshStandardMaterial color="#facc15" metalness={0.3} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

/** Grating floor section — industrial walkway surface */
export function GratingFloor({ position, size, rotation = 0 }: { position: [number, number, number]; size: [number, number]; rotation?: number }) {
  const [w, d] = size;
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Main deck */}
      <mesh receiveShadow>
        <boxGeometry args={[w, 0.05, d]} />
        <meshStandardMaterial color="#4b5563" metalness={0.5} roughness={0.7} />
      </mesh>
      {/* Grating lines (simplified) */}
      {Array.from({ length: Math.floor(d / 0.15) }).map((_, i) => (
        <mesh key={i} position={[0, 0.03, -d / 2 + 0.075 + i * 0.15]}>
          <boxGeometry args={[w * 0.95, 0.01, 0.02]} />
          <meshStandardMaterial color="#374151" metalness={0.5} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}
