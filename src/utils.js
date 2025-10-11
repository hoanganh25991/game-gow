import * as THREE from "../vendor/three/build/three.module.js";

// Maps world XZ to minimap pixels centered on (centerX, centerZ)
export function worldToMinimap(x, z, centerX, centerZ, scale = 0.8) {
  const px = 100 + (x - centerX) * scale;
  const pz = 100 + (z - centerZ) * scale;
  return { x: px, y: pz };
}

export function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function randRange(min, max) {
  return Math.random() * (max - min) + min;
}

export function distance2D(a, b) {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.hypot(dx, dz);
}

export function dir2D(from, to) {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const len = Math.hypot(dx, dz) || 1;
  return { x: dx / len, z: dz / len };
}

export function now() {
  return performance.now() / 1000;
}

// Subtle dark noise texture for ground
export function makeNoiseTexture(size = 256) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 20 + Math.floor(Math.random() * 30);
    img.data[i] = v;
    img.data[i + 1] = v + 10;
    img.data[i + 2] = v + 25;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  return tex;
}

// Seeded RNG utilities
export function hashStringToInt(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function createSeededRNG(seed = 0) {
  let t = (typeof seed === "number" ? seed >>> 0 : hashStringToInt(String(seed))) >>> 0;
  return function () {
    t += 0x6D2B79F5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), 1 | x);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededRange(rng, min, max) {
  return min + (max - min) * rng();
}

// Helper: seeded random [0,1) based on string (FNV-1a hash)
export function seededRand01(str) {
  let h = 0x811c9dc5; // FNV-1a 32-bit
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return ((h >>> 0) / 4294967296);
}

// Color utilities: parse various color formats to 0xRRGGBB + alpha [0,1]
// Supports: #RRGGBB, #RRGGBBAA, 0xRRGGBB, "RRGGBB", number, rgb()/rgba()
export function parseThreeColor(input) {
  let hex = 0xff6b35;
  let alpha = 1;
  try {
    if (typeof input === "number" && Number.isFinite(input)) {
      hex = input >>> 0;
      alpha = 1;
    } else if (typeof input === "string") {
      const s = input.trim();
      if (/^#[0-9a-fA-F]{8}$/.test(s)) {
        hex = parseInt(s.slice(1, 7), 16) >>> 0;
        alpha = Math.max(0, Math.min(1, parseInt(s.slice(7, 9), 16) / 255));
      } else if (/^#[0-9a-fA-F]{6}$/.test(s)) {
        hex = parseInt(s.slice(1), 16) >>> 0;
        alpha = 1;
      } else if (/^0x[0-9a-fA-F]{6}$/.test(s)) {
        hex = parseInt(s.slice(2), 16) >>> 0;
        alpha = 1;
      } else if (/^[0-9a-fA-F]{6}$/.test(s)) {
        hex = parseInt(s, 16) >>> 0;
        alpha = 1;
      } else {
        const m = s.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(\d*\.?\d+))?\s*\)$/i);
        if (m) {
          const r = Math.max(0, Math.min(255, parseInt(m[1], 10)));
          const g = Math.max(0, Math.min(255, parseInt(m[2], 10)));
          const b = Math.max(0, Math.min(255, parseInt(m[3], 10)));
          hex = ((r << 16) | (g << 8) | b) >>> 0;
          alpha = Math.max(0, Math.min(1, m[4] ? parseFloat(m[4]) : 1));
        }
      }
    }
  } catch (_) {}
  return { hex, alpha };
}
