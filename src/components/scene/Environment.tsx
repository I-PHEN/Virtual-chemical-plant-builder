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

      {/* Lighting — dramatic sun + fill, for real-world contrast */}
      <ambientLight intensity={0.25} color="#a0a8b0" />
      <hemisphereLight args={["#8a8a7a", "#3a3530", 0.35]} />
      {/* Strong sun — harsh shadows for realism */}
      <directionalLight
        position={[40, 30, -10]}
        intensity={2.5}
        color="#ffd9a0"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
        shadow-camera-near={0.5}
        shadow-camera-far={150}
        shadow-bias={-0.0003}
        shadow-normalBias={0.03}
      />
      {/* Cool sky fill */}
      <directionalLight position={[-25, 15, 20]} intensity={0.6} color="#a0b8d0" />
    </>
  );
}

export function Ground() {
  const concreteTexture = useMemo(() => {
    const size = 1024;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    // Base concrete — radial gradient for depth
    const baseGrad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 1.2);
    baseGrad.addColorStop(0, "#6b6960");
    baseGrad.addColorStop(0.6, "#5a5852");
    baseGrad.addColorStop(1, "#4a4842");
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, size, size);
    // Noise
    const imageData = ctx.getImageData(0, 0, size, size);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 35;
      data[i] = Math.max(0, Math.min(255, data[i] + noise));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
    }
    ctx.putImageData(imageData, 0, 0);
    // Expansion joints
    ctx.strokeStyle = "rgba(30, 28, 25, 0.7)";
    ctx.lineWidth = 3;
    for (let i = 0; i <= 4; i++) {
      const p = (i / 4) * size;
      ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, size); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(size, p); ctx.stroke();
    }
    // Cracks
    ctx.strokeStyle = "rgba(20, 18, 15, 0.5)";
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      let x = Math.random() * size;
      let y = Math.random() * size;
      ctx.moveTo(x, y);
      for (let j = 0; j < 8; j++) {
        x += (Math.random() - 0.5) * 60;
        y += (Math.random() - 0.5) * 60;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    // Oil stains
    for (let i = 0; i < 15; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = 10 + Math.random() * 40;
      const stainGrad = ctx.createRadialGradient(x, y, 0, x, y, r);
      stainGrad.addColorStop(0, "rgba(20, 18, 15, 0.35)");
      stainGrad.addColorStop(1, "rgba(20, 18, 15, 0)");
      ctx.fillStyle = stainGrad;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    // Rust runoff
    for (let i = 0; i < 8; i++) {
      const x = Math.random() * size;
      const startY = Math.random() * size * 0.5;
      const length = 80 + Math.random() * 200;
      const grad = ctx.createLinearGradient(x, startY, x, startY + length);
      grad.addColorStop(0, "rgba(139, 69, 19, 0.2)");
      grad.addColorStop(1, "rgba(139, 69, 19, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(x - 3, startY, 6, length);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(15, 15);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  return (
    <group>
      {/* Weathered concrete ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[300, 300]} />
        <meshStandardMaterial map={concreteTexture} roughness={0.92} metalness={0.03} />
      </mesh>
    </group>
  );
}

/**
 * Distant industrial backdrop — now empty since we use real GLB models
 * (GLBBuildings + GLBChimneys) for the backdrop. The old procedural
 * boxes/silos/stacks have been removed because they looked like plant
 * equipment and confused the viewer.
 */
export function IndustrialBackdrop() {
  return null;
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
