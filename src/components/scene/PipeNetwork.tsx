"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { EquipmentInstance, PipeSegment } from "@/lib/plant/types";

interface PipeNetworkProps {
  equipment: EquipmentInstance[];
  pipes: PipeSegment[];
}

/**
 * Realistic industrial pipe network.
 * Pipes are steel-grey with flanges at endpoints and subtle flow indicators
 * (small dark spheres moving inside the pipe) instead of glowing colored dots.
 */
export function PipeNetwork({ equipment, pipes }: PipeNetworkProps) {
  const byId = useMemo(() => {
    const m = new Map<string, EquipmentInstance>();
    for (const e of equipment) m.set(e.id, e);
    return m;
  }, [equipment]);

  return (
    <group>
      {pipes.map((p) => {
        const fromEq = byId.get(p.from);
        const toEq = byId.get(p.to);
        if (!fromEq || !toEq) return null;
        return <Pipe key={p.id} from={fromEq} to={toEq} pipe={p} />;
      })}
    </group>
  );
}

function Pipe({
  from,
  to,
}: {
  from: EquipmentInstance;
  to: EquipmentInstance;
  pipe: PipeSegment;
}) {
  const flowRef = useRef<THREE.InstancedMesh>(null);

  const curve = useMemo(() => {
    const start: THREE.Vector3 = new THREE.Vector3(from.position[0], 1.2, from.position[2]);
    const end: THREE.Vector3 = new THREE.Vector3(to.position[0], 1.2, to.position[2]);
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    const dist = start.distanceTo(end);
    // Slight arc — pipes in real plants run along pipe racks at a consistent height
    mid.y = 1.2 + Math.min(0.8, dist * 0.1);
    return new THREE.CatmullRomCurve3([start, mid, end]);
  }, [from.position, to.position]);

  const geometry = useMemo(() => {
    return new THREE.TubeGeometry(curve, 48, 0.1, 12, false);
  }, [curve]);

  const flowCount = 4;
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Subtle flow indicator — dark spheres moving inside the pipe
  useFrame((state) => {
    if (!flowRef.current) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < flowCount; i++) {
      const phase = ((t * 0.25 + i / flowCount) % 1);
      const p = curve.getPointAt(phase);
      dummy.position.copy(p);
      dummy.scale.setScalar(0.6);
      dummy.updateMatrix();
      flowRef.current.setMatrixAt(i, dummy.matrix);
    }
    flowRef.current.instanceMatrix.needsUpdate = true;
  });

  const flangePositions = useMemo(() => {
    return [curve.getPointAt(0.02), curve.getPointAt(0.98)];
  }, [curve]);

  return (
    <group>
      {/* Main pipe — industrial steel */}
      <mesh geometry={geometry} castShadow>
        <meshStandardMaterial
          color="#5a5e63"
          metalness={0.8}
          roughness={0.4}
        />
      </mesh>
      {/* Subtle highlight stripe along the top of the pipe */}
      <mesh geometry={geometry} scale={[1, 1.02, 1.02]}>
        <meshStandardMaterial
          color="#7a7e83"
          metalness={0.7}
          roughness={0.35}
          transparent
          opacity={0.5}
        />
      </mesh>
      {/* Flanges at both ends */}
      {flangePositions.map((pos, i) => (
        <mesh key={i} position={pos} castShadow>
          <cylinderGeometry args={[0.18, 0.18, 0.08, 16]} />
          <meshStandardMaterial color="#4a4e53" metalness={0.8} roughness={0.4} />
        </mesh>
      ))}
      {/* Pipe support at midpoint — steel post going to ground */}
      <mesh position={[curve.getPointAt(0.5).x, 0.6, curve.getPointAt(0.5).z]} castShadow>
        <boxGeometry args={[0.12, 1.2, 0.12]} />
        <meshStandardMaterial color="#3a3d42" metalness={0.6} roughness={0.5} />
      </mesh>
      {/* Flow indicator — subtle dark spheres inside the pipe */}
      <instancedMesh ref={flowRef} args={[undefined, undefined, flowCount]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshStandardMaterial color="#2a2d31" metalness={0.3} roughness={0.6} />
      </instancedMesh>
    </group>
  );
}
