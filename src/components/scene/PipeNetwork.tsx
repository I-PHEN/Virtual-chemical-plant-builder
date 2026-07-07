"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { EquipmentInstance, PipeSegment } from "@/lib/plant/types";
import { useAppStore } from "@/lib/store/useAppStore";

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
 * to indicate direction, like the "follow the feed" visual described in the
 * product vision.
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
  const flowMatRef = useRef<THREE.MeshBasicMaterial>(null);

  // Build a polyline that arcs upward between the two equipment positions.
  const curve = useMemo(() => {
    const start: THREE.Vector3 = new THREE.Vector3(...from.position);
    const end: THREE.Vector3 = new THREE.Vector3(...to.position);
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    const dist = start.distanceTo(end);
    mid.y += Math.min(1.2, dist * 0.18);
    return new THREE.CatmullRomCurve3([start, mid, end]);
  }, [from.position, to.position]);

  const geometry = useMemo(() => {
    return new THREE.TubeGeometry(curve, 40, 0.08, 10, false);
  }, [curve]);

  // Flow particles
  const dotCount = 6;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colorObj = useMemo(() => new THREE.Color(color), [color]);

  useFrame((state) => {
    if (!dotsRef.current) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < dotCount; i++) {
      const phase = ((t * 0.35 + i / dotCount) % 1);
      const p = curve.getPointAt(phase);
      dummy.position.copy(p);
      const scale = 0.9 + Math.sin(phase * Math.PI) * 0.3;
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      dotsRef.current.setMatrixAt(i, dummy.matrix);
    }
    dotsRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color="#475569"
          metalness={0.6}
          roughness={0.4}
        />
      </mesh>
      {/* colored inner glow tube */}
      <mesh geometry={geometry} scale={[1, 1, 1]}>
        <meshBasicMaterial color={color} transparent opacity={0.18} />
      </mesh>
      {/* animated flow dots */}
      <instancedMesh ref={dotsRef} args={[undefined, undefined, dotCount]}>
        <sphereGeometry args={[0.11, 12, 12]} />
        <meshBasicMaterial color={colorObj} toneMapped={false} />
      </instancedMesh>

      {pipe.label && (
        <FlowLabel curve={curve} label={pipe.label} color={color} />
      )}
    </group>
  );
}

function FlowLabel({
  curve,
  label,
  color,
}: {
  curve: THREE.CatmullRomCurve3;
  label: string;
  color: string;
}) {
  const position = useMemo(() => curve.getPointAt(0.5), [curve]);
  return (
    <group>
      {/* The Html import isn't used here to keep the pipe file independent.
          Instead we drop a tiny colored marker at the midpoint; the stream
          label is rendered in the UI overlay / chat panel where needed. */}
      <mesh position={position}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}
