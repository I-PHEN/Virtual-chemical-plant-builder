"use client";

import { useMemo } from "react";
import * as THREE from "three";

/**
 * Procedural PBR textures generated via canvas — no external files needed.
 * Generates weathered metal, concrete with cracks/stains, and rust patterns
 * that make the plant look lived-in and industrial, not sterile.
 */

/** Generates a weathered metal texture with rust spots and stains */
export function useWeatheredMetalTexture(baseColor = "#5a6b73") {
  return useMemo(() => {
    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;

    // Base color
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, size, size);

    // Add noise for metal grain
    const imageData = ctx.getImageData(0, 0, size, size);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 20;
      data[i] = Math.max(0, Math.min(255, data[i] + noise));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
    }
    ctx.putImageData(imageData, 0, 0);

    // Add rust spots (random brown patches)
    for (let i = 0; i < 25; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = 5 + Math.random() * 30;
      const rustGrad = ctx.createRadialGradient(x, y, 0, x, y, r);
      const rustIntensity = 0.2 + Math.random() * 0.4;
      rustGrad.addColorStop(0, `rgba(139, 69, 19, ${rustIntensity})`);
      rustGrad.addColorStop(0.5, `rgba(101, 50, 15, ${rustIntensity * 0.5})`);
      rustGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = rustGrad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Add oil/chemical stains (dark patches)
    for (let i = 0; i < 12; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = 8 + Math.random() * 20;
      const stainGrad = ctx.createRadialGradient(x, y, 0, x, y, r);
      stainGrad.addColorStop(0, "rgba(20, 18, 15, 0.25)");
      stainGrad.addColorStop(1, "rgba(20, 18, 15, 0)");
      ctx.fillStyle = stainGrad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Add streaks (water run marks)
    for (let i = 0; i < 8; i++) {
      const x = Math.random() * size;
      const startY = Math.random() * size * 0.3;
      const length = 50 + Math.random() * 150;
      const grad = ctx.createLinearGradient(x, startY, x, startY + length);
      grad.addColorStop(0, "rgba(60, 55, 50, 0)");
      grad.addColorStop(0.5, "rgba(60, 55, 50, 0.1)");
      grad.addColorStop(1, "rgba(60, 55, 50, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(x - 2, startY, 4, length);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [baseColor]);
}

/** Generates a roughness map matching the weathered metal (rust = rougher) */
export function useWeatheredRoughnessTexture() {
  return useMemo(() => {
    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;

    // Base roughness (medium)
    ctx.fillStyle = "#7a7a7a"; // ~0.48 roughness
    ctx.fillRect(0, 0, size, size);

    // Rust spots = higher roughness (rougher)
    for (let i = 0; i < 25; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = 5 + Math.random() * 30;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, "#c0c0c0"); // rougher
      grad.addColorStop(1, "rgba(122, 122, 122, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Polished areas = lower roughness (smoother)
    for (let i = 0; i < 10; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = 10 + Math.random() * 25;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, "#5a5a5a"); // smoother
      grad.addColorStop(1, "rgba(122, 122, 122, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }, []);
}

/** Generates a weathered concrete texture with cracks, stains, and expansion joints */
export function useWeatheredConcreteTexture() {
  return useMemo(() => {
    const size = 1024;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;

    // Base concrete color (slightly warm grey)
    const baseGrad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 1.2);
    baseGrad.addColorStop(0, "#6b6960");
    baseGrad.addColorStop(0.6, "#5a5852");
    baseGrad.addColorStop(1, "#4a4842");
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, size, size);

    // Add noise for concrete texture
    const imageData = ctx.getImageData(0, 0, size, size);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 35;
      data[i] = Math.max(0, Math.min(255, data[i] + noise));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
    }
    ctx.putImageData(imageData, 0, 0);

    // Expansion joints (concrete grid)
    ctx.strokeStyle = "rgba(30, 28, 25, 0.7)";
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

    // Cracks (random jagged lines)
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
      stainGrad.addColorStop(0.6, "rgba(20, 18, 15, 0.15)");
      stainGrad.addColorStop(1, "rgba(20, 18, 15, 0)");
      ctx.fillStyle = stainGrad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Rust runoff stains (orange-brown streaks from equipment)
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

    // Paint marks (safety lines, faded markings)
    ctx.strokeStyle = "rgba(250, 204, 21, 0.15)";
    ctx.lineWidth = 4;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * size, Math.random() * size);
      ctx.lineTo(Math.random() * size, Math.random() * size);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(12, 12);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);
}
