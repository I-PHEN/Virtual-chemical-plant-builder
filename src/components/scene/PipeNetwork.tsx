"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { EquipmentInstance, PipeSegment, PipeRackCorridor } from "@/lib/plant/types";

interface PipeNetworkProps {
  equipment: EquipmentInstance[];
  pipes: PipeSegment[];
  racks?: PipeRackCorridor[];
}

/**
 * Realistic industrial pipe network.
 * Pipes route along elevated pipe racks (up → along → down) when
 * routing is "rack", or take short direct arcs when routing is "direct".
 */
export function PipeNetwork({ equipment, pipes, racks = [] }: PipeNetworkProps) {
  const byId = useMemo(() => {
    const m = new Map<string, EquipmentInstance>();
    for (const e of equipment) m.set(e.id, e);
    return m;
  }, [equipment]);

  const rackById = useMemo(() => {
    const m = new Map<string, PipeRackCorridor>();
    for (const r of racks) m.set(r.id, r);
    return m;
  }, [racks]);

  return (
    <group>
      {pipes.map((p) => {
        const fromEq = byId.get(p.from);
        const toEq = byId.get(p.to);
        if (!fromEq || !toEq) return null;
        const rack = p.rackId ? rackById.get(p.rackId) : undefined;
        return (
          <Pipe
            key={p.id}
            from={fromEq}
            to={toEq}
            routing={p.routing ?? "direct"}
            rack={rack}
          />
        );
      })}
    </group>
  );
}

function Pipe({
  from,
  to,
  routing = "direct",
  rack,
}: {
  from: EquipmentInstance;
  to: EquipmentInstance;
  routing: "rack" | "direct";
  rack?: PipeRackCorridor;
}) {
  const flowRef = useRef<THREE.InstancedMesh>(null);

  // Build the pipe path based on routing
  const curve = useMemo(() => {
    const start: THREE.Vector3 = new THREE.Vector3(from.position[0], 1.5, from.position[2]);
    const end: THREE.Vector3 = new THREE.Vector3(to.position[0], 1.5, to.position[2]);

    if (routing === "rack" && rack) {
      // Rack routing: up to rack height, along the rack corridor, down to destination
      const rackHeight = rack.height;
      const rackStart = new THREE.Vector3(rack.from.x, rackHeight, rack.from.z);
      const rackEnd = new THREE.Vector3(rack.to.x, rackHeight, rack.to.z);

      // Find the nearest point on the rack to start and end
      const startToRackStart = start.distanceTo(rackStart);
      const startToRackEnd = start.distanceTo(rackEnd);
      const entryPoint = startToRackStart < startToRackEnd ? rackStart : rackEnd;

      const endToRackStart = end.distanceTo(rackStart);
      const endToRackEnd = end.distanceTo(rackEnd);
      const exitPoint = endToRackStart < endToRackEnd ? rackStart : rackEnd;

      // Build path: start → up → along rack → down → end
      const points: THREE.Vector3[] = [
        start,
        new THREE.Vector3(start.x, rackHeight, start.z),
        entryPoint,
        exitPoint,
        new THREE.Vector3(end.x, rackHeight, end.z),
        end,
      ];
      return new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.3);
    } else {
      // Direct routing: simple arc at consistent height
      const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
      const dist = start.distanceTo(end);
      mid.y = 1.5 + Math.min(0.5, dist * 0.08);
      return new THREE.CatmullRomCurve3([start, mid, end]);
    }
  }, [from.position, to.position, routing, rack]);

  const geometry = useMemo(() => {
    return new THREE.TubeGeometry(curve, routing === "rack" ? 64 : 32, 0.1, 12, false);
  }, [curve, routing]);

  const flowCount = 3;
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Subtle flow indicator
  useFrame((state) => {
    if (!flowRef.current) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < flowCount; i++) {
      const phase = ((t * 0.2 + i / flowCount) % 1);
      const p = curve.getPointAt(phase);
      dummy.position.copy(p);
      dummy.scale.setScalar(0.5);
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
        <meshStandardMaterial color="#5a5e63" metalness={0.8} roughness={0.4} />
      </mesh>
      {/* Flanges at both ends */}
      {flangePositions.map((pos, i) => (
        <mesh key={i} position={pos} castShadow>
          <cylinderGeometry args={[0.18, 0.18, 0.08, 16]} />
          <meshStandardMaterial color="#4a4e53" metalness={0.8} roughness={0.4} />
        </mesh>
      ))}
      {/* Pipe support at midpoint for direct routing */}
      {routing === "direct" && (
        <mesh position={[curve.getPointAt(0.5).x, 0.6, curve.getPointAt(0.5).z]} castShadow>
          <boxGeometry args={[0.12, 1.2, 0.12]} />
          <meshStandardMaterial color="#3a3d42" metalness={0.6} roughness={0.5} />
        </mesh>
      )}
      {/* Flow indicator */}
      <instancedMesh ref={flowRef} args={[undefined, undefined, flowCount]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshStandardMaterial color="#2a2d31" metalness={0.3} roughness={0.6} />
      </instancedMesh>
    </group>
  );
}
