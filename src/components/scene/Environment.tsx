"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { PlantTheme } from "@/lib/plant/types";

/**
 * Realistic industrial environment with per-plant mood.
 * The theme's mood affects sky color, fog, and lighting.
 */

const MOOD_COLORS: Record<string, { sky: string[]; fog: string; sunColor: string; sunIntensity: number }> = {
  "industrial-grey": {
    sky: ["#3a4555", "#5a6573", "#8a8a7a", "#b0a890", "#c8bca0"],
    fog: "#8a8a7a",
    sunColor: "#ffd9a0",
    sunIntensity: 2.0,
  },
  "warm-rust": {
    sky: ["#4a2f2a", "#6b4540", "#8a6a55", "#b08570", "#c8a890"],
    fog: "#9a7a6a",
    sunColor: "#ffb070",
    sunIntensity: 1.8,
  },
  "clean-refinery": {
    sky: ["#2a3548", "#4a5568", "#6a7588", "#9aa5b0", "#c0c8d0"],
    fog: "#8a9098",
    sunColor: "#fff0d0",
    sunIntensity: 2.2,
  },
  "fermentation-green": {
    sky: ["#2a3a2a", "#4a5a4a", "#6a7a5a", "#9aaa8a", "#c0c8a0"],
    fog: "#8a9080",
    sunColor: "#f0f0c0",
    sunIntensity: 1.9,
  },
};

export function Environment() {
  const moodColors = MOOD_COLORS["industrial-grey"];
  // Sky gradient texture — uses mood colors
  const skyTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 16;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    const [c0, c1, c2, c3, c4] = moodColors.sky;
    grad.addColorStop(0, c0);
    grad.addColorStop(0.4, c1);
    grad.addColorStop(0.75, c2);
    grad.addColorStop(0.9, c3);
    grad.addColorStop(1, c4);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 16, 512);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [moodColors]);

  // Concrete ground texture
  const concreteTexture = useMemo(() => {
    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;

    // Base concrete color
    ctx.fillStyle = "#6b6960";
    ctx.fillRect(0, 0, size, size);

    // Add noise for concrete texture
    const imageData = ctx.getImageData(0, 0, size, size);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 30;
      data[i] = Math.max(0, Math.min(255, data[i] + noise));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
    }
    ctx.putImageData(imageData, 0, 0);

    // Subtle expansion joints (concrete grid)
    ctx.strokeStyle = "rgba(40, 38, 33, 0.6)";
    ctx.lineWidth = 3;
    for (let i = 0; i <= 4; i++) {
      const p = (i / 4) * size;
      ctx.beginPath();
      ctx.moveTo(p, 0);
      ctx.lineTo(p, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, p);
      ctx.lineTo(size, p);
      ctx.stroke();
    }

    // A few oil stains / wear marks
    for (let i = 0; i < 8; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = 10 + Math.random() * 30;
      const stainGrad = ctx.createRadialGradient(x, y, 0, x, y, r);
      stainGrad.addColorStop(0, "rgba(30, 28, 25, 0.3)");
      stainGrad.addColorStop(1, "rgba(30, 28, 25, 0)");
      ctx.fillStyle = stainGrad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(20, 20);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  // Soft env map for reflections
  const envMap = useMemo(() => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const grad = ctx.createLinearGradient(0, 0, 0, size);
    grad.addColorStop(0, "#5a6573");
    grad.addColorStop(0.5, "#3a4555");
    grad.addColorStop(1, "#1a1f28");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "rgba(200, 188, 160, 0.4)";
    ctx.beginPath();
    ctx.arc(size * 0.5, size * 0.7, size * 0.15, 0, Math.PI * 2);
    ctx.fill();
    const tex = new THREE.CanvasTexture(canvas);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  return (
    <>
      <primitive object={envMap} attach="environment" />

      {/* Sky dome */}
      <mesh>
        <sphereGeometry args={[200, 32, 16]} />
        <meshBasicMaterial map={skyTexture} side={THREE.BackSide} fog={false} />
      </mesh>

      {/* Soft fog for depth — pushed further out for larger plants */}
      <fog attach="fog" args={[moodColors.fog, 60, 180]} />

      {/* Lighting — mood-based sun + fill */}
      <ambientLight intensity={0.4} color="#a0a8b0" />
      <hemisphereLight args={[moodColors.sky[2], "#4a4540", 0.5]} />
      {/* Strong directional sun — mood-colored */}
      <directionalLight
        position={[35, 25, -15]}
        intensity={moodColors.sunIntensity}
        color={moodColors.sunColor}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
        shadow-camera-near={0.5}
        shadow-camera-far={150}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />
      {/* Cool fill from opposite side */}
      <directionalLight position={[-20, 12, 15]} intensity={0.5} color="#a0b0c0" />
    </>
  );
}

export function Ground() {
  const concreteTexture = useMemo(() => {
    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#6b6960";
    ctx.fillRect(0, 0, size, size);
    const imageData = ctx.getImageData(0, 0, size, size);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 30;
      data[i] = Math.max(0, Math.min(255, data[i] + noise));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
    }
    ctx.putImageData(imageData, 0, 0);
    ctx.strokeStyle = "rgba(40, 38, 33, 0.6)";
    ctx.lineWidth = 3;
    for (let i = 0; i <= 4; i++) {
      const p = (i / 4) * size;
      ctx.beginPath();
      ctx.moveTo(p, 0);
      ctx.lineTo(p, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, p);
      ctx.lineTo(size, p);
      ctx.stroke();
    }
    for (let i = 0; i < 8; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = 10 + Math.random() * 30;
      const stainGrad = ctx.createRadialGradient(x, y, 0, x, y, r);
      stainGrad.addColorStop(0, "rgba(30, 28, 25, 0.3)");
      stainGrad.addColorStop(1, "rgba(30, 28, 25, 0)");
      ctx.fillStyle = stainGrad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(20, 20);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  return (
    <group>
      {/* Concrete ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[300, 300]} />
        <meshStandardMaterial map={concreteTexture} roughness={0.9} metalness={0.05} />
      </mesh>
    </group>
  );
}

/** Distant industrial backdrop — consistent across all plants */
export function IndustrialBackdrop() {
  const structureColor = "#3a3d42";

  return (
    <group>
      {/* Common distant buildings */}
      {[
        { x: -60, z: -50, w: 20, h: 12, d: 15 },
        { x: -35, z: -65, w: 15, h: 18, d: 12 },
        { x: 40, z: -60, w: 25, h: 10, d: 18 },
        { x: 65, z: -45, w: 18, h: 15, d: 14 },
        { x: -70, z: 30, w: 16, h: 14, d: 20 },
        { x: 70, z: 40, w: 22, h: 12, d: 16 },
      ].map((b, i) => (
        <mesh key={i} position={[b.x, b.h / 2, b.z]} castShadow>
          <boxGeometry args={[b.w, b.h, b.d]} />
          <meshStandardMaterial color={structureColor} roughness={0.85} metalness={0.1} />
        </mesh>
      ))}

      {/* Consistent distant backdrop — silos, buildings, stacks */}
      {/* Distant silos */}
      {[
        { x: -50, z: -55, r: 4, h: 20 },
        { x: -44, z: -52, r: 3.5, h: 18 },
        { x: 50, z: -55, r: 4, h: 22 },
        { x: 56, z: -50, r: 3, h: 16 },
      ].map((s, i) => (
        <group key={i}>
          <mesh position={[s.x, s.h / 2, s.z]} castShadow>
            <cylinderGeometry args={[s.r, s.r, s.h, 20]} />
            <meshStandardMaterial color="#9ca3af" roughness={0.6} metalness={0.4} />
          </mesh>
          <mesh position={[s.x, s.h + s.r * 0.3, s.z]}>
            <sphereGeometry args={[s.r, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2.5]} />
            <meshStandardMaterial color="#b0b6bd" roughness={0.5} metalness={0.4} />
          </mesh>
        </group>
      ))}
      {/* Distant stacks */}
      {[
        { x: -25, z: -70, h: 25 },
        { x: -20, z: -72, h: 22 },
        { x: 25, z: -68, h: 28 },
      ].map((s, i) => (
        <group key={i}>
          <mesh position={[s.x, s.h / 2, s.z]} castShadow>
            <cylinderGeometry args={[1.2, 1.5, s.h, 16]} />
            <meshStandardMaterial color="#6b7280" roughness={0.7} metalness={0.3} />
          </mesh>
          <mesh position={[s.x, s.h, s.z]}>
            <cylinderGeometry args={[1.5, 1.5, 0.5, 16]} />
            <meshStandardMaterial color="#4b5563" roughness={0.7} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/**
 * Structural steel elements — pipe racks, equipment platforms, foundations.
 * These make the plant look like a real facility, not floating equipment.
 */
export function SteelStructure() {
  return (
    <group>
      {/* Equipment concrete foundations/pads under each major piece */}
      {/* These are rendered by the Equipment component via the Foundation sub-component */}

      {/* Main pipe rack running through the plant center */}
      <PipeRack startX={-14} endX={14} z={0} />

      {/* Perimeter safety bollards (yellow) around equipment zones */}
      {/* Simple visual markers */}
    </group>
  );
}

function PipeRack({ startX, endX, z }: { startX: number; endX: number; z: number }) {
  const length = endX - startX;
  const bayLength = 5;
  const bays = Math.floor(length / bayLength);
  const steelMat = (
    <meshStandardMaterial color="#f59e0b" roughness={0.6} metalness={0.3} />
  );

  return (
    <group>
      {/* Vertical support columns at each bay */}
      {Array.from({ length: bays + 1 }).map((_, i) => {
        const x = startX + i * bayLength;
        return (
          <group key={i}>
            {/* Left column */}
            <mesh position={[x, 3, z - 2]} castShadow>
              <boxGeometry args={[0.3, 6, 0.3]} />
              {steelMat}
            </mesh>
            {/* Right column */}
            <mesh position={[x, 3, z + 2]} castShadow>
              <boxGeometry args={[0.3, 6, 0.3]} />
              {steelMat}
            </mesh>
            {/* Cross bracing (vertical plane) */}
            <mesh position={[x, 5, z]}>
              <boxGeometry args={[0.15, 0.5, 4]} />
              {steelMat}
            </mesh>
          </group>
        );
      })}
      {/* Horizontal beams at top — two levels */}
      <mesh position={[(startX + endX) / 2, 6, z - 2]} castShadow>
        <boxGeometry args={[length + 0.5, 0.4, 0.4]} />
        {steelMat}
      </mesh>
      <mesh position={[(startX + endX) / 2, 6, z + 2]} castShadow>
        <boxGeometry args={[length + 0.5, 0.4, 0.4]} />
        {steelMat}
      </mesh>
      {/* Lower level beams */}
      <mesh position={[(startX + endX) / 2, 3.5, z - 2]} castShadow>
        <boxGeometry args={[length + 0.5, 0.3, 0.3]} />
        {steelMat}
      </mesh>
      <mesh position={[(startX + endX) / 2, 3.5, z + 2]} castShadow>
        <boxGeometry args={[length + 0.5, 0.3, 0.3]} />
        {steelMat}
      </mesh>
    </group>
  );
}

/** A concrete equipment foundation pad — placed under each equipment */
export function Foundation({ position, size = 2.5 }: { position: [number, number, number]; size?: number }) {
  return (
    <mesh position={[position[0], 0.08, position[2]]} receiveShadow>
      <boxGeometry args={[size, 0.16, size]} />
      <meshStandardMaterial color="#5a5852" roughness={0.95} metalness={0.02} />
    </mesh>
  );
}

export function Lighting() {
  return <Environment />;
}
