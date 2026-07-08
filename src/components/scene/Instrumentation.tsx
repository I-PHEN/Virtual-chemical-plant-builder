"use client";

import * as THREE from "three";

/**
 * Instrumentation and small-scale plant details.
 * These attach to equipment to make them look functional and educational.
 */

/** A pressure gauge — circular dial on a small stem */
export function PressureGauge({ position, rotation = [0, 0, 0] as [number, number, number] }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Stem */}
      <mesh position={[0, 0, 0.08]}>
        <cylinderGeometry args={[0.025, 0.025, 0.16, 8]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#4a4e53" metalness={0.7} roughness={0.4} />
      </mesh>
      {/* Dial face */}
      <mesh position={[0, 0, 0.18]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.03, 16]} />
        <meshStandardMaterial color="#f3f4f6" metalness={0.1} roughness={0.3} />
      </mesh>
      {/* Dial rim */}
      <mesh position={[0, 0, 0.18]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.1, 0.015, 8, 16]} />
        <meshStandardMaterial color="#1f2937" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Needle */}
      <mesh position={[0, 0.04, 0.2]} rotation={[0, 0, -0.6]}>
        <boxGeometry args={[0.008, 0.07, 0.008]} />
        <meshStandardMaterial color="#dc2626" />
      </mesh>
    </group>
  );
}

/** A temperature indicator — similar to pressure gauge but with a thermowell */
export function TemperatureIndicator({ position, rotation = [0, 0, 0] as [number, number, number] }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Thermowell */}
      <mesh position={[0, 0, 0.05]}>
        <cylinderGeometry args={[0.02, 0.025, 0.2, 8]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#6b7280" metalness={0.7} roughness={0.4} />
      </mesh>
      {/* Dial */}
      <mesh position={[0, 0, 0.18]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.03, 16]} />
        <meshStandardMaterial color="#fef3c7" metalness={0.1} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0, 0.18]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.09, 0.012, 8, 16]} />
        <meshStandardMaterial color="#1f2937" metalness={0.6} />
      </mesh>
    </group>
  );
}

/** A level gauge — vertical glass tube on the side of a tank */
export function LevelGauge({ position, height = 1.5 }: { position: [number, number, number]; height?: number }) {
  return (
    <group position={position}>
      {/* Glass tube */}
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[0.04, height, 0.04]} />
        <meshStandardMaterial color="#60a5fa" transparent opacity={0.4} metalness={0.1} roughness={0.1} />
      </mesh>
      {/* Top and bottom connectors */}
      <mesh position={[0, height, 0]}>
        <boxGeometry args={[0.08, 0.06, 0.08]} />
        <meshStandardMaterial color="#4a4e53" metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.08, 0.06, 0.08]} />
        <meshStandardMaterial color="#4a4e53" metalness={0.7} roughness={0.4} />
      </mesh>
      {/* Protective rods */}
      <mesh position={[0.04, height / 2, 0]}>
        <boxGeometry args={[0.01, height, 0.01]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.6} />
      </mesh>
      <mesh position={[-0.04, height / 2, 0]}>
        <boxGeometry args={[0.01, height, 0.01]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.6} />
      </mesh>
    </group>
  );
}

/** A flow meter — inline device with a display */
export function FlowMeter({ position, rotation = [0, 0, 0] as [number, number, number] }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Body — inline cylinder */}
      <mesh>
        <cylinderGeometry args={[0.12, 0.12, 0.3, 16]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#4a4e53" metalness={0.7} roughness={0.4} />
      </mesh>
      {/* Display on top */}
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[0.1, 0.08, 0.05]} />
        <meshStandardMaterial color="#1e293b" metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.15, 0.026]}>
        <boxGeometry args={[0.07, 0.04, 0.01]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

/** A nozzle — short pipe stub sticking out of a vessel */
export function Nozzle({ position, rotation = [0, 0, 0] as [number, number, number], radius = 0.1 }: { position: [number, number, number]; rotation?: [number, number, number]; radius?: number }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <cylinderGeometry args={[radius, radius, 0.3, 12]} />
        <meshStandardMaterial color="#5a5e63" metalness={0.7} roughness={0.4} />
      </mesh>
      {/* Flange at the end */}
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[radius * 1.6, radius * 1.6, 0.04, 12]} />
        <meshStandardMaterial color="#4a4e53" metalness={0.7} />
      </mesh>
    </group>
  );
}

/** A manway — oval access hatch on the side of a vessel */
export function Manway({ position, rotation = [0, 0, 0] as [number, number, number] }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Cover plate */}
      <mesh>
        <cylinderGeometry args={[0.25, 0.25, 0.05, 16]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#6b7280" metalness={0.6} />
      </mesh>
      {/* Bolts around the edge */}
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.22, Math.sin(a) * 0.22, 0.04]}>
            <cylinderGeometry args={[0.015, 0.015, 0.03, 6]} />
            <meshStandardMaterial color="#9ca3af" metalness={0.8} />
          </mesh>
        );
      })}
    </group>
  );
}

/** A vent line — small pipe going up from the top of a vessel */
export function VentLine({ position, height = 1 }: { position: [number, number, number]; height?: number }) {
  return (
    <group position={position}>
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[0.05, 0.05, height, 8]} />
        <meshStandardMaterial color="#4a4e53" metalness={0.6} />
      </mesh>
      {/* Vent cap */}
      <mesh position={[0, height, 0]}>
        <coneGeometry args={[0.07, 0.1, 8]} />
        <meshStandardMaterial color="#374151" metalness={0.6} />
      </mesh>
    </group>
  );
}
