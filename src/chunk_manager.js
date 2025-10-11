import * as THREE from "../vendor/three/build/three.module.js";
import { hashStringToInt, createSeededRNG, seededRange } from "./utils.js";
import { STORAGE_KEYS } from "../config/index.js";
import { createEnvironmentTree, createEnvironmentRock, createEnvironmentFlower } from "./environment.js";
import { createStructureWithLabel, getStructureProtectionRadius, getStructureProtectionColor } from "./structures.js";

/**
 * ChunkManager
 * - Streams chunks around the player.
 * - Drops far chunks to keep memory safe.
 * - Deterministic generation per chunk (seeded by worldSeed + chunk ix/iz).
 * - Optional minimal persistence marker in localStorage.
 *
 * Default generator places both environment props (trees/rocks/flowers) and structures.
 */
export class ChunkManager {
  constructor(scene, opts = {}) {
    this.scene = scene;
    this.size = Math.max(50, Math.floor(opts.chunkSize || 200));
    this.radius = Math.max(1, Math.floor(opts.radius || 2)); // radius in chunks (Manhattan/box)
    this.seed = Number.isFinite(opts.seed) ? (opts.seed >>> 0) : 0;
    this.storagePrefix = String(opts.storagePrefix || STORAGE_KEYS.chunkPrefix);
    this.active = new Map(); // key -> { group, ix, iz }
    this.generators = []; // list of (ctx) => void
    this.densities = Object.assign({ trees: 40, rocks: 16, flowers: 60 }, opts.densities || {});
    this.structures = []; // Track all structures for minimap
    // Register default generator that manages both environment and structures
    this.addGenerator(this._defaultEnvAndStructuresGenerator.bind(this));
  }

  setRadius(r) {
    this.radius = Math.max(1, Math.floor(r || 1));
  }

  addGenerator(genFn) {
    if (typeof genFn === "function") this.generators.push(genFn);
  }

  _key(ix, iz) {
    return `${ix},${iz}`;
  }

  _chunkSeed(ix, iz) {
    // Derive chunk seed from world seed + indices (stable across sessions)
    const base = `${this.seed}:${ix}:${iz}`;
    return hashStringToInt(base);
  }

  _origin(ix, iz) {
    return { x: ix * this.size, z: iz * this.size };
  }

  /**
   * Update which chunks should be loaded based on player world position.
   */
  update(playerPos) {
    if (!playerPos) return;
    const cx = Math.floor(playerPos.x / this.size);
    const cz = Math.floor(playerPos.z / this.size);

    // Desired set within a square radius
    const desired = new Set();
    for (let dz = -this.radius; dz <= this.radius; dz++) {
      for (let dx = -this.radius; dx <= this.radius; dx++) {
        const ix = cx + dx;
        const iz = cz + dz;
        const k = this._key(ix, iz);
        desired.add(k);
        if (!this.active.has(k)) {
          this._loadChunk(ix, iz);
        }
      }
    }

    // Unload any that are no longer desired
    for (const key of this.active.keys()) {
      if (!desired.has(key)) {
        this._unloadChunk(key);
      }
    }
  }

  _loadChunk(ix, iz) {
    const key = this._key(ix, iz);
    if (this.active.has(key)) return;
    const origin = this._origin(ix, iz);

    const group = new THREE.Group();
    group.name = `chunk_${ix}_${iz}`;
    group.position.set(origin.x, 0, origin.z);

    // Context for generators (local coords within [0..size))
    const ctx = {
      ix,
      iz,
      key,
      size: this.size,
      origin, // world origin of this chunk
      group, // parent to attach into; place children in local coords
      rng: createSeededRNG(this._chunkSeed(ix, iz)),
      densities: this.densities,
    };

    // Run all registered generators
    for (const gen of this.generators) {
      try {
        gen(ctx);
      } catch (e) {
        console.warn("[Chunking] generator failed:", e);
      }
    }

    this.scene.add(group);
    this.active.set(key, { group, ix, iz });

    // Minimal persistence marker (for future mutable state)
    this._markPersisted(ix, iz);
  }

  _unloadChunk(key) {
    const rec = this.active.get(key);
    if (!rec) return;
    try {
      this.scene.remove(rec.group);
    } catch (_) { }
    // Remove structures from tracking
    this.structures = this.structures.filter(s => s.chunkKey !== key);
    // Dispose geometries/materials to free memory
    this._disposeGroup(rec.group);
    this.active.delete(key);
  }

  disposeAll() {
    for (const key of Array.from(this.active.keys())) {
      this._unloadChunk(key);
    }
    this.structures = [];
  }

  /**
   * Get structures API for minimap (compatible with structures.js API)
   */
  getStructuresAPI() {
    return {
      listStructures: () => this.structures.map(s => ({
        type: s.type,
        position: s.position.clone(),
        name: s.name,
        protectionRadius: s.protectionRadius
      }))
    };
  }

  _disposeGroup(group) {
    try {
      group.traverse((obj) => {
        try {
          if (obj.geometry && typeof obj.geometry.dispose === "function") {
            obj.geometry.dispose();
          }
          const m = obj.material;
          if (Array.isArray(m)) {
            m.forEach((mm) => {
              try { mm.dispose?.(); } catch (_) { }
            });
          } else if (m && typeof m.dispose === "function") {
            m.dispose();
          }
        } catch (_) { }
      });
    } catch (_) { }
  }

  _persistKey(ix, iz) {
    return `${this.storagePrefix}.${this.seed}.${ix}.${iz}`;
  }

  _markPersisted(ix, iz) {
    try {
      const key = this._persistKey(ix, iz);
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify({ v: 1, generated: true, t: Date.now() }));
      }
    } catch (_) { }
  }

  /**
   * Default generator:
   * - Places trees/rocks/flowers with deterministic positions inside the chunk.
   * - Places 1-3 structures per chunk on average for visibility under chunking.
   */
  _defaultEnvAndStructuresGenerator(ctx) {
    const { group, rng, size, densities } = ctx;

    // Helper: uniform random in [0, size)
    const randInChunk = () => ({
      x: seededRange(rng, 0, size),
      z: seededRange(rng, 0, size),
    });

    // Trees
    const treeCount = Math.max(0, Math.floor(densities.trees || 0));
    for (let i = 0; i < treeCount; i++) {
      const treeType = (rng() < 0.5) ? "cypress" : "olive";
      const t = createEnvironmentTree(treeType);
      const p = randInChunk();
      t.position.set(p.x, 0, p.z);
      t.rotation.y = seededRange(rng, 0, Math.PI * 2);
      const s = seededRange(rng, 0.85, 1.25);
      t.scale.setScalar(s);
      group.add(t);
    }

    // Rocks
    const rockCount = Math.max(0, Math.floor(densities.rocks || 0));
    for (let i = 0; i < rockCount; i++) {
      const r = createEnvironmentRock();
      const p = randInChunk();
      r.position.set(p.x, 0.02, p.z);
      r.rotation.set(seededRange(rng, 0, Math.PI), seededRange(rng, 0, Math.PI), seededRange(rng, 0, Math.PI));
      const s = seededRange(rng, 0.7, 1.3);
      r.scale.setScalar(s);
      group.add(r);
    }

    // Flowers
    const flowerCount = Math.max(0, Math.floor(densities.flowers || 0));
    for (let i = 0; i < flowerCount; i++) {
      const f = createEnvironmentFlower();
      const p = randInChunk();
      f.position.set(p.x, 0, p.z);
      f.scale.setScalar(seededRange(rng, 0.8, 1.2));
      group.add(f);
    }

    // Structures: 1 guaranteed, up to +2 with probability
    {
      let count = 1;
      if (rng() < 0.35) count += 1;
      if (rng() < 0.15) count += 1;

      for (let i = 0; i < count; i++) {
        const p = randInChunk();
        const r = seededRange(rng, 0, Math.PI * 2);

        const which = rng();
        let structureType, params;

        if (which < 0.2) {
          structureType = "temple";
          params = {
            cols: Math.max(5, Math.floor(seededRange(rng, 6, 9))),
            rows: Math.max(7, Math.floor(seededRange(rng, 9, 12))),
            columnHeight: seededRange(rng, 5.2, 6.2),
            colSpacingX: seededRange(rng, 2.2, 2.8),
            colSpacingZ: seededRange(rng, 2.3, 3.0),
          };
        } else if (which < 0.45) {
          structureType = "villa";
          params = {
            width: seededRange(rng, 10, 16),
            depth: seededRange(rng, 8, 12),
            height: seededRange(rng, 3.5, 5.2),
          };
        } else if (which < 0.7) {
          structureType = "column";
          params = {
            height: seededRange(rng, 4.2, 6.2),
            radius: seededRange(rng, 0.24, 0.34),
            order: ["doric", "ionic", "corinthian"][Math.floor(seededRange(rng, 0, 3)) | 0],
          };
        } else if (which < 0.85) {
          structureType = "statue";
          params = {};
        } else {
          structureType = "obelisk";
          params = { height: seededRange(rng, 5.5, 7.5) };
        }

        const result = createStructureWithLabel(structureType, params, { x: p.x, z: p.z }, i);
        if (result) {
          const { structure, label } = result;
          structure.position.set(p.x, 0, p.z);
          structure.rotation.y = r;
          if (structureType === "villa") {
            structure.scale.setScalar(seededRange(rng, 0.9, 1.2));
          }
          group.add(structure);
          if (label) {
            group.add(label);
          }

          // Track structure for minimap (use world position)
          const worldPos = new THREE.Vector3(
            ctx.origin.x + p.x,
            0,
            ctx.origin.z + p.z
          );

          // Get protection radius and color from centralized structure configuration
          const protectionRadius = getStructureProtectionRadius(structureType);
          const protectionColor = getStructureProtectionColor(structureType);

          // Create protective circle visualization
          const circleGeo = new THREE.RingGeometry(protectionRadius - 0.2, protectionRadius, 32);
          const circleMat = new THREE.MeshBasicMaterial({
            color: protectionColor,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
          });
          const circle = new THREE.Mesh(circleGeo, circleMat);
          circle.rotation.x = -Math.PI / 2;
          circle.position.set(p.x, 0.1, p.z);
          group.add(circle);

          this.structures.push({
            type: structureType,
            position: worldPos,
            name: structure.userData.name,
            mesh: structure,
            chunkKey: ctx.key,
            protectionRadius: protectionRadius
          });
        }
      }
    }
  }
}

/**
 * Persist or retrieve a stable world seed so generation is consistent across sessions.
 */
export function getOrInitWorldSeed(key = STORAGE_KEYS.worldSeed) {
  try {
    const existing = localStorage.getItem(key);
    if (existing) return parseInt(existing, 10);
    const seed = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
    localStorage.setItem(key, String(seed));
    return seed;
  } catch (_) {
    // Fallback: deterministic but time-based
    return (Date.now() & 0x7fffffff) >>> 0;
  }
}
