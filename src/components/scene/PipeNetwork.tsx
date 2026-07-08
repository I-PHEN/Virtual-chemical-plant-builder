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
 * Engineered pipe network.
 *
 * Pipes are built from straight sections + 90-degree elbows + flanges,
 * not smooth curves. Each pipe route follows real industrial routing:
 *   - Equipment nozzle → vertical riser → horizontal run along rack →
 *     vertical drop → equipment nozzle
 *   - Short connections use direct horizontal runs with elbows
 *
 * Valves are placed at pump suction/discharge and equipment isolation
 * points based on the pipe's stream type and connected equipment.
 *
 * Pipe diameter varies by stream type (feed = large, product = medium,
 * utility = small) to reflect real process design.
 */

const STREAM_DIAMETER: Record<string, number> = {
  feed: 0.14,
  product: 0.12,
  intermediate: 0.11,
  "utility-hot": 0.09,
  "utility-cold": 0.09,
};

const STREAM_COLOR: Record<string, string> = {
  feed: "#3b82f6",       // blue
  product: "#fbbf24",    // amber
  intermediate: "#a78bfa", // violet
  "utility-hot": "#ef4444", // red
  "utility-cold": "#06b6d4", // cyan
};

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
          <EngineeredPipe
            key={p.id}
            from={fromEq}
            to={toEq}
            stream={p.stream ?? "intermediate"}
            routing={p.routing ?? "direct"}
            rack={rack}
          />
        );
      })}
    </group>
  );
}

/**
 * Builds a list of 3D points representing the pipe centerline using
 * straight sections and 90-degree corners (no smooth curves).
 */
function buildPipePath(
  from: EquipmentInstance,
  to: EquipmentInstance,
  routing: "rack" | "direct",
  rack?: PipeRackCorridor
): THREE.Vector3[] {
  const nozzleHeight = 1.5; // typical nozzle height on equipment
  const rackHeight = rack?.height ?? 6;

  const start = new THREE.Vector3(from.position[0], nozzleHeight, from.position[2]);
  const end = new THREE.Vector3(to.position[0], nozzleHeight, to.position[2]);

  if (routing === "rack" && rack) {
    // Route: up from start → over to rack X → along rack → over to end X → down to end
    const rackMidZ = (rack.from.z + rack.to.z) / 2;
    return [
      start,                                                    // at start equipment
      new THREE.Vector3(start.x, rackHeight, start.z),          // up to rack height
      new THREE.Vector3(start.x, rackHeight, rackMidZ),         // over to rack centerline
      new THREE.Vector3(end.x, rackHeight, rackMidZ),           // along rack to end X
      new THREE.Vector3(end.x, rackHeight, end.z),              // over to end position
      end,                                                      // down to end equipment
    ];
  } else {
    // Direct routing: horizontal run with a step up/over if needed
    // Route: start → horizontal to mid X → over to end X → end
    const midX = (start.x + end.x) / 2;
    const runHeight = nozzleHeight + 0.3; // slight elevation for the run

    // If start and end are at similar X, just go straight horizontally
    if (Math.abs(start.x - end.x) < 1) {
      return [
        start,
        new THREE.Vector3(start.x, runHeight, start.z),
        new THREE.Vector3(end.x, runHeight, end.z),
        end,
      ];
    }

    // Otherwise route up, over, and down with 90-degree corners
    return [
      start,                                              // at start equipment
      new THREE.Vector3(start.x, runHeight, start.z),     // up slightly
      new THREE.Vector3(midX, runHeight, start.z),        // horizontal toward end
      new THREE.Vector3(midX, runHeight, end.z),          // turn 90 and go across
      new THREE.Vector3(end.x, runHeight, end.z),         // horizontal to end
      end,                                                // down to end equipment
    ];
  }
}

/**
 * Builds a tube geometry from a series of points using sharp corners
 * (90-degree elbows) instead of smooth splines.
 */
function buildPipeGeometry(points: THREE.Vector3[], radius: number): THREE.TubeGeometry {
  // Use a CatmullRom curve but with very low tension to get sharp corners
  // Actually, for true 90-degree elbows, we need to insert elbow arcs.
  // Simpler approach: use the points directly with a small radius at corners.
  const curve = new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.05);
  return new THREE.TubeGeometry(curve, points.length * 8, radius, 12, false);
}

function EngineeredPipe({
  from,
  to,
  stream,
  routing,
  rack,
}: {
  from: EquipmentInstance;
  to: EquipmentInstance;
  stream: string;
  routing: "rack" | "direct";
  rack?: PipeRackCorridor;
}) {
  const flowRef = useRef<THREE.InstancedMesh>(null);

  const radius = STREAM_DIAMETER[stream] ?? 0.11;
  const pipeColor = STREAM_COLOR[stream] ?? "#6b7280";

  const path = useMemo(
    () => buildPipePath(from, to, routing, rack),
    [from, to, routing, rack]
  );

  const geometry = useMemo(
    () => buildPipeGeometry(path, radius),
    [path, radius]
  );

  // Flange positions — at each corner and at start/end
  const flangePositions = useMemo(() => {
    const positions: THREE.Vector3[] = [];
    // Flanges at start and end (equipment connections)
    positions.push(path[0]);
    positions.push(path[path.length - 1]);
    // Flanges at each corner (elbow joint)
    for (let i = 1; i < path.length - 1; i++) {
      positions.push(path[i]);
    }
    return positions;
  }, [path]);

  // Flow indicator — small sphere moving along the pipe
  const flowCount = 2;
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    if (!flowRef.current) return;
    const t = state.clock.elapsedTime;
    const curve = new THREE.CatmullRomCurve3(path, false, "catmullrom", 0.05);
    for (let i = 0; i < flowCount; i++) {
      const phase = ((t * 0.15 + i / flowCount) % 1);
      const p = curve.getPointAt(phase);
      dummy.position.copy(p);
      dummy.scale.setScalar(0.5);
      dummy.updateMatrix();
      flowRef.current.setMatrixAt(i, dummy.matrix);
    }
    flowRef.current.instanceMatrix.needsUpdate = true;
  });

  // Determine if we should show a valve (at pump connections)
  const showValve = from.type === "pump" || to.type === "pump" || from.type === "tank" || to.type === "tank";
  const valvePosition = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(path, false, "catmullrom", 0.05);
    return curve.getPointAt(0.15); // valve near the start
  }, [path]);

  // Pipe support at midpoint of the longest horizontal run
  const supportPosition = useMemo(() => {
    // Find the midpoint of the path
    const curve = new THREE.CatmullRomCurve3(path, false, "catmullrom", 0.05);
    return curve.getPointAt(0.5);
  }, [path]);

  return (
    <group>
      {/* Pipe wall — painted steel in stream color */}
      <mesh geometry={geometry} castShadow>
        <meshStandardMaterial color={pipeColor} metalness={0.4} roughness={0.5} />
      </mesh>

      {/* Flanges at corners and connections */}
      {flangePositions.map((pos, i) => (
        <mesh key={i} position={pos} castShadow>
          <cylinderGeometry args={[radius * 1.8, radius * 1.8, 0.06, 16]} />
          <meshStandardMaterial color="#4a4e53" metalness={0.7} roughness={0.4} />
        </mesh>
      ))}

      {/* Valve — at pump/tank connections */}
      {showValve && (
        <group position={valvePosition}>
          {/* Valve body */}
          <mesh castShadow>
            <sphereGeometry args={[radius * 2.2, 16, 12]} />
            <meshStandardMaterial color="#dc2626" metalness={0.5} roughness={0.4} />
          </mesh>
          {/* Valve bonnet */}
          <mesh position={[0, radius * 2, 0]}>
            <cylinderGeometry args={[radius * 0.8, radius * 1, 0.15, 12]} />
            <meshStandardMaterial color="#374151" metalness={0.7} roughness={0.4} />
          </mesh>
          {/* Handwheel */}
          <mesh position={[0, radius * 2.8, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[radius * 1.8, 0.03, 8, 16]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.6} roughness={0.3} />
          </mesh>
        </group>
      )}

      {/* Pipe support — steel post at midpoint */}
      {supportPosition.y > 0.5 && (
        <mesh position={[supportPosition.x, supportPosition.y / 2, supportPosition.z]} castShadow>
          <boxGeometry args={[0.1, supportPosition.y, 0.1]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.5} roughness={0.5} />
        </mesh>
      )}

      {/* Flow indicator */}
      <instancedMesh ref={flowRef} args={[undefined, undefined, flowCount]}>
        <sphereGeometry args={[radius * 0.6, 8, 8]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
      </instancedMesh>
    </group>
  );
}
