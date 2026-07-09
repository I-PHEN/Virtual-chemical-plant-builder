"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Atmospheric effects — steam plumes, particle systems that make the
 * plant feel alive and operational.
 */

/** Steam plume rising from a point (heater stack, reactor vent, etc.) */
export function SteamPlume({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const particlesRef = useRef<THREE.Points>(null);
  const count = 60;

  const { positions, velocities, lifetimes } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const lifetimes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 0.3 * scale;
      positions[i * 3 + 1] = Math.random() * 2 * scale;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.3 * scale;
      velocities[i * 3] = (Math.random() - 0.5) * 0.15;
      velocities[i * 3 + 1] = 0.3 + Math.random() * 0.3;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.15;
      lifetimes[i] = Math.random();
    }
    return { positions, velocities, lifetimes };
  }, [scale]);

  // Mutable copy for per-frame updates
  const lifetimesRef = useRef<Float32Array>(lifetimes);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [positions]);

  // Steam texture (soft circular gradient)
  const steamTexture = useMemo(() => {
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, "rgba(255, 255, 255, 0.4)");
    grad.addColorStop(0.5, "rgba(255, 255, 255, 0.15)");
    grad.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(canvas);
  }, []);

  useFrame((state, delta) => {
    if (!particlesRef.current) return;
    const pos = particlesRef.current.geometry.attributes.position.array as Float32Array;
    const t = state.clock.elapsedTime;
    const lt = lifetimesRef.current;

    for (let i = 0; i < count; i++) {
      lt[i] += delta * 0.15;
      if (lt[i] > 1) {
        // Reset particle
        lt[i] = 0;
        pos[i * 3] = (Math.random() - 0.5) * 0.2 * scale;
        pos[i * 3 + 1] = 0;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 0.2 * scale;
      } else {
        pos[i * 3] += velocities[i * 3] * delta + Math.sin(t + i) * 0.005;
        pos[i * 3 + 1] += velocities[i * 3 + 1] * delta * scale;
        pos[i * 3 + 2] += velocities[i * 3 + 2] * delta + Math.cos(t + i) * 0.005;
        // Spread out as it rises
        pos[i * 3] *= 1 + delta * 0.3;
        pos[i * 3 + 2] *= 1 + delta * 0.3;
      }
    }
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={particlesRef} position={position}>
      <primitive object={geometry} attach="geometry" />
      <pointsMaterial
        map={steamTexture}
        size={1.2 * scale}
        transparent
        opacity={0.3}
        depthWrite={false}
        blending={THREE.NormalBlending}
        sizeAttenuation
      />
    </points>
  );
}

/** Flare stack flame — flickering emissive cone */
export function FlareFlame({ position }: { position: [number, number, number] }) {
  const flameRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!flameRef.current) return;
    const t = state.clock.elapsedTime;
    // Flicker
    const flicker = 0.9 + Math.sin(t * 12) * 0.05 + Math.sin(t * 7) * 0.05;
    flameRef.current.scale.y = flicker;
    flameRef.current.scale.x = 1 + Math.sin(t * 9) * 0.03;
  });

  return (
    <group ref={flameRef} position={position}>
      {/* Outer flame */}
      <mesh>
        <coneGeometry args={[0.5, 2.5, 8]} />
        <meshBasicMaterial color="#fb923c" transparent opacity={0.6} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* Inner flame */}
      <mesh position={[0, 0.3, 0]}>
        <coneGeometry args={[0.3, 1.5, 8]} />
        <meshBasicMaterial color="#fde047" transparent opacity={0.8} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

/** Dust particles floating in the air for atmosphere */
export function DustParticles() {
  const ref = useRef<THREE.Points>(null);
  const count = 200;

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 80;
      arr[i * 3 + 1] = Math.random() * 15;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 80;
    }
    return arr;
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [positions]);

  useFrame((state) => {
    if (!ref.current) return;
    const pos = ref.current.geometry.attributes.position.array as Float32Array;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      pos[i * 3] += Math.sin(t * 0.3 + i) * 0.002;
      pos[i * 3 + 1] += Math.cos(t * 0.2 + i * 0.5) * 0.001;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <primitive object={geometry} attach="geometry" />
      <pointsMaterial size={0.08} color="#a0a0a0" transparent opacity={0.15} sizeAttenuation depthWrite={false} />
    </points>
  );
}
