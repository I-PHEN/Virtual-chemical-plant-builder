"use client";

import { useMemo } from "react";
import * as THREE from "three";

/**
 * Professional studio-grade environment: deep dark gradient background,
 * reflective floor with subtle grid, atmospheric fog, three-point lighting
 * with accent colors, and a soft environment map for metallic reflections.
 */
export function Environment() {
  // Build a soft gradient environment map so metal materials get reflections
  const envMap = useMemo(() => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const grad = ctx.createLinearGradient(0, 0, 0, size);
    grad.addColorStop(0, "#1e293b"); // top — slate
    grad.addColorStop(0.5, "#0f172a");
    grad.addColorStop(1, "#020617"); // bottom — near black
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    // a few light blobs to give metal something to reflect
    ctx.fillStyle = "rgba(56, 189, 248, 0.5)"; // sky
    ctx.beginPath();
    ctx.arc(size * 0.7, size * 0.25, size * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(167, 139, 250, 0.4)"; // violet
    ctx.beginPath();
    ctx.arc(size * 0.25, size * 0.35, size * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(251, 191, 36, 0.3)"; // warm
    ctx.beginPath();
    ctx.arc(size * 0.5, size * 0.6, size * 0.08, 0, Math.PI * 2);
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  // Floor texture — dark polished concrete with subtle grid
  const floorTexture = useMemo(() => {
    const size = 1024;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    // base
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 1.2);
    grad.addColorStop(0, "#1e293b");
    grad.addColorStop(0.6, "#0f172a");
    grad.addColorStop(1, "#020617");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    // grid lines
    ctx.strokeStyle = "rgba(56, 189, 248, 0.12)";
    ctx.lineWidth = 1.5;
    const step = size / 24;
    for (let i = 0; i <= 24; i++) {
      ctx.beginPath();
      ctx.moveTo(i * step, 0);
      ctx.lineTo(i * step, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * step);
      ctx.lineTo(size, i * step);
      ctx.stroke();
    }
    // accent major lines
    ctx.strokeStyle = "rgba(56, 189, 248, 0.22)";
    ctx.lineWidth = 2.5;
    for (let i = 0; i <= 24; i += 6) {
      ctx.beginPath();
      ctx.moveTo(i * step, 0);
      ctx.lineTo(i * step, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * step);
      ctx.lineTo(size, i * step);
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(6, 6);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  return (
    <>
      {/* environment map for reflections */}
      <primitive object={envMap} attach="environment" />

      {/* deep atmospheric background */}
      <color attach="background" args={["#050912"]} />
      <fog attach="fog" args={["#050912", 30, 90]} />

      {/* three-point lighting */}
      <ambientLight intensity={0.35} color="#94a3b8" />
      <hemisphereLight args={["#475569", "#020617", 0.4]} />

      {/* key light — warm-white, top-front-right */}
      <directionalLight
        position={[14, 22, 10]}
        intensity={1.8}
        color="#fef3c7"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-35}
        shadow-camera-right={35}
        shadow-camera-top={35}
        shadow-camera-bottom={-35}
        shadow-camera-near={0.5}
        shadow-camera-far={80}
        shadow-bias={-0.0005}
      />
      {/* fill light — cool sky-blue, opposite side */}
      <directionalLight position={[-12, 14, -8]} intensity={0.7} color="#7dd3fc" />
      {/* rim light — violet, behind */}
      <directionalLight position={[0, 8, -18]} intensity={0.6} color="#a78bfa" />
      {/* subtle ground bounce */}
      <pointLight position={[0, 0.5, 0]} intensity={0.3} color="#38bdf8" distance={20} />
    </>
  );
}

export function Ground() {
  return (
    <group>
      {/* polished dark floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[300, 300]} />
        <meshStandardMaterial
          color="#0b1220"
          metalness={0.6}
          roughness={0.45}
        />
      </mesh>
      {/* grid overlay */}
      <gridHelper
        args={[120, 60, "#38bdf8", "#1e293b"]}
        position={[0, 0.01, 0]}
      />
      {/* accent platform ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[18, 18.5, 96]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[19, 19.15, 96]} />
        <meshBasicMaterial color="#a78bfa" transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export function Lighting() {
  // kept for backwards compatibility — Environment is the new entry point
  return <Environment />;
}
