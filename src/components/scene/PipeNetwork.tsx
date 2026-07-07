"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { EquipmentInstance, PipeSegment } from "@/lib/plant/types";

interface PipeNetworkProps {
  equipment: EquipmentInstance[];
  pipes: PipeSegment[];
}

const STREAM_COLORS: Record<string, string> = {
  feed: "#38bdf8",
  product: "#fbbf24",
  intermediate: "#a78bfa",
  "utility-hot": "#f87171",
  "utility-cold": "#22d3ee",
};

/**
 * Renders every pipe as a TubeGeometry following a polyline that gently arcs
 * between two equipment positions. Animated bright dots flow along each pipe
 * to indicate direction.
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
        const color = STREAM_COLORS[p.stream ?? "intermediate"] ?? STREAM_COLORS.intermediate;
        return <Pipe key={p.id} from={fromEq} to={toEq} pipe={p} color={color} />;
      })}
    </group>
  );
}

function Pipe({
  from,
  to,
  pipe,
  color,
}: {
  from: EquipmentInstance;
  to: EquipmentInstance;
  pipe: PipeSegment;
  color: string;
}) {
  const dotsRef = useRef<THREE.InstancedMesh>(null);

  const curve = useMemo(() => {
    const start: THREE.Vector3 = new THREE.Vector3(...from.position);
    const end: THREE.Vector3 = new THREE.Vector3(...to.position);
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    const dist = start.distanceTo(end);
    mid.y += Math.min(1.0, dist * 0.16);
    return new THREE.CatmullRomCurve3([start, mid, end]);
  }, [from.position, to.position]);

  const geometry = useMemo(() => {
    return new THREE.TubeGeometry(curve, 48, 0.09, 12, false);
  }, [curve]);

  const dotCount = 6;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colorObj = useMemo(() => new THREE.Color(color), [color]);

  useFrame((state) => {
    if (!dotsRef.current) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < dotCount; i++) {
      const phase = ((t * 0.32 + i / dotCount) % 1);
      const p = curve.getPointAt(phase);
      dummy.position.copy(p);
      const scale = 0.85 + Math.sin(phase * Math.PI) * 0.35;
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      dotsRef.current.setMatrixAt(i, dummy.matrix);
    }
    dotsRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      {/* pipe wall — metallic steel */}
      <mesh geometry={geometry} castShadow>
        <meshStandardMaterial
          color="#475569"
          metalness={0.85}
          roughness={0.35}
        />
      </mesh>
      {/* colored inner glow following the stream color */}
      <mesh geometry={geometry}>
        <meshBasicMaterial color={color} transparent opacity={0.22} toneMapped={false} />
      </mesh>
      {/* animated flow particles */}
      <instancedMesh ref={dotsRef} args={[undefined, undefined, dotCount]}>
        <sphereGeometry args={[0.12, 14, 14]} />
        <meshBasicMaterial color={colorObj} toneMapped={false} />
      </instancedMesh>

      {/* midpoint marker dot */}
      <mesh position={curve.getPointAt(0.5)}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
    </group>
  );
}
