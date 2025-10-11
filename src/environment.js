import * as THREE from "../vendor/three/build/three.module.js";
import { makeNoiseTexture, createSeededRNG, seededRange } from "./utils.js";
import { WORLD, storageKey } from "../config/index.js";
import { THEME_COLORS } from "../config/theme.js";
import { createCypressTree, createOliveTree } from "./meshes.js";
import { createHouseCluster } from "./villages_utils.js";

/**
 * EnvironmentManager - Class-based environment system
 * Manages scene environment including trees, rocks, flowers, villages, water, and rain
 */
export class EnvironmentManager {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.options = this._buildConfig(options);
    
    // Core components
    this.root = null;
    this.rng = null;
    this.water = null;
    
    // Rain system
    this.rain = {
      enabled: false,
      points: null,
      velocities: null,
    };
    
    // Instanced meshes
    this.trunkInst = null;
    this.foliageInst = null;
    this.rockInst = null;
    this.stemInst = null;
    this.petalInst = null;
    
    // Tree animation data
    this.treeBases = [];
    
    // Quality and performance tracking
    this._quality = null;
    this._lightBudgetLeft = 0;
    this._swayTick = 0;
    this._lastSwayT = 0;
    this._rainFrame = 0;
    this._rainDownscaled = false;
    this._lastRainAdaptT = 0;
    this._baseRainCount = 0;
    this._rainStride = 1;
    this._instSwayStride = 2;
    
    // Villages
    this.villages = [];
    this.villageCenters = [];
  }

  /**
   * Build configuration with defaults and quality scaling
   */
  _buildConfig(options) {
    const cfg = Object.assign(
      {
        treeCount: 160,
        rockCount: 80,
        flowerCount: 300,
        villageCount: 2,
        villageRadius: 12,
        enableWater: true,
        waterRadius: 22,
        enableRain: true,
        rainCount: 800,
        seed: Date.now(),
      },
      options
    );

    // Quality preset scaling
    try {
      cfg.quality = cfg.quality || (JSON.parse(localStorage.getItem(storageKey("renderPrefs")) || "{}").quality || "high");
    } catch (_) {
      cfg.quality = cfg.quality || "high";
    }

    this._quality = cfg.quality;
    const q = cfg.quality;

    // Scale prop counts based on quality
    if (q === "medium") {
      cfg.treeCount = Math.floor(cfg.treeCount * 0.6);
      cfg.rockCount = Math.floor(cfg.rockCount * 0.6);
      cfg.flowerCount = Math.floor(cfg.flowerCount * 0.5);
      cfg.villageCount = Math.max(1, Math.floor(cfg.villageCount * 0.8));
      cfg.rainCount = Math.floor(cfg.rainCount * 0.6);
    } else if (q === "low") {
      cfg.treeCount = Math.floor(cfg.treeCount * 0.35);
      cfg.rockCount = Math.floor(cfg.rockCount * 0.45);
      cfg.flowerCount = Math.floor(cfg.flowerCount * 0.35);
      cfg.villageCount = 1;
      cfg.enableWater = false;
      cfg.rainCount = Math.floor(cfg.rainCount * 0.33);
    }

    // If chunking is enabled, delegate world props to chunk manager
    try {
      if (WORLD?.chunking?.enabled) {
        cfg.treeCount = 0;
        cfg.rockCount = 0;
        cfg.flowerCount = 0;
        cfg.villageCount = 0;
      }
    } catch (_) {}

    // Set performance parameters
    const lightBudget = (q === "low") ? 0 : (q === "medium" ? 6 : 10);
    this._lightBudgetLeft = lightBudget;
    this._houseLights = q === "high" ? "full" : (q === "medium" ? "dim" : "none");
    this._instSwayStride = (q === "high" ? 2 : (q === "medium" ? 4 : 0));
    this._rainStride = (q === "high" ? 1 : (q === "medium" ? 2 : 3));
    this._baseRainCount = cfg.rainCount;

    return cfg;
  }

  /**
   * Acquire light from budget
   */
  _acquireLight(n = 1) {
    if (this._lightBudgetLeft >= n) {
      this._lightBudgetLeft -= n;
      return true;
    }
    return false;
  }

  /**
   * Initialize the environment asynchronously
   */
  async init() {
    const { scene, options: cfg } = this;
    
    this.root = new THREE.Group();
    this.root.name = "environment";
    scene.add(this.root);
    
    this.rng = createSeededRNG(cfg.seed);

    // Setup scene fog
    scene.fog = scene.fog || new THREE.FogExp2(THEME_COLORS.themeDark, 0.0009);

    // Add lighting
    this._setupLighting();
    
    // Add ground overlay
    this._createGroundOverlay();
    
    // Create instanced meshes for props
    await this._createInstancedProps();
    
    // Generate villages
    this._generateVillages();
    
    // Place additional structures if not using chunking
    if (!WORLD?.chunking?.enabled) {
      await this._placeStructures();
    }
    
    // Create water
    if (cfg.enableWater) {
      this._createWater();
    }
    
    // Create rain
    if (cfg.enableRain) {
      this._createRain(cfg.rainCount);
      this.rain.enabled = true;
    }

    return this;
  }

  /**
   * Setup scene lighting
   */
  _setupLighting() {
    const ambient = new THREE.AmbientLight(THEME_COLORS.ambientDark, 0.68);
    this.root.add(ambient);

    const sun = new THREE.DirectionalLight(THEME_COLORS.themeOrange, 0.36);
    sun.position.set(60, 80, -40);
    sun.castShadow = false;
    this.root.add(sun);
  }

  /**
   * Create ground overlay texture
   */
  _createGroundOverlay() {
    const detailTex = makeNoiseTexture(256);
    detailTex.wrapS = detailTex.wrapT = THREE.RepeatWrapping;
    detailTex.repeat.set(12, 12);

    const groundOverlay = new THREE.Mesh(
      new THREE.CircleGeometry(Math.max(40, Math.min(300, WORLD.groundSize * 0.2)), 64),
      new THREE.MeshStandardMaterial({
        map: detailTex,
        transparent: true,
        opacity: 0.12,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    );
    groundOverlay.rotation.x = -Math.PI / 2;
    groundOverlay.position.y = 0.01;
    this.root.add(groundOverlay);
  }

  /**
   * Get random position within bounds
   */
  _randomPosInBounds() {
    const half = WORLD.groundSize * 0.5 - 6;
    return new THREE.Vector3(
      (Math.random() * 2 - 1) * half,
      0,
      (Math.random() * 2 - 1) * half
    );
  }

  /**
   * Get seeded random position within bounds
   */
  _seededRandomPosInBounds() {
    const half = WORLD.groundSize * 0.5 - 6;
    return new THREE.Vector3(
      (this.rng() * 2 - 1) * half,
      0,
      (this.rng() * 2 - 1) * half
    );
  }

  /**
   * Create instanced prop meshes
   */
  async _createInstancedProps() {
    const cfg = this.options;
    
    // Trees
    const trunkGeo = new THREE.CylinderGeometry(0.12, 0.12, 1, 6);
    const trunkMat = new THREE.MeshStandardMaterial({ color: THEME_COLORS.trunk });
    const foliageGeo = new THREE.ConeGeometry(1, 1, 8);
    const foliageMat = new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(0.05, 0.7, 0.27) });

    this.trunkInst = new THREE.InstancedMesh(trunkGeo, trunkMat, cfg.treeCount);
    this.foliageInst = new THREE.InstancedMesh(foliageGeo, foliageMat, cfg.treeCount);
    this.trunkInst.castShadow = true;
    this.trunkInst.receiveShadow = true;
    this.foliageInst.castShadow = true;
    this.foliageInst.receiveShadow = true;

    // Rocks
    const rockGeo = new THREE.DodecahedronGeometry(1, 0);
    const rockMat = new THREE.MeshStandardMaterial({ color: THEME_COLORS.rock });
    this.rockInst = new THREE.InstancedMesh(rockGeo, rockMat, cfg.rockCount);
    this.rockInst.castShadow = true;
    this.rockInst.receiveShadow = true;

    // Flowers
    const stemGeo = new THREE.CylinderGeometry(0.02, 0.02, 1);
    const stemMat = new THREE.MeshStandardMaterial({ color: THEME_COLORS.stem });
    const petalGeo = new THREE.SphereGeometry(1, 6, 6);
    const petalMat = new THREE.MeshStandardMaterial({ color: THEME_COLORS.themeLightOrange, emissive: THEME_COLORS.lava });
    this.stemInst = new THREE.InstancedMesh(stemGeo, stemMat, cfg.flowerCount);
    this.petalInst = new THREE.InstancedMesh(petalGeo, petalMat, cfg.flowerCount);

    const _m4 = new THREE.Matrix4();
    const _q = new THREE.Quaternion();
    const _s = new THREE.Vector3();
    const _p = new THREE.Vector3();

    // Place trees
    this.treeBases = new Array(cfg.treeCount);
    for (let i = 0; i < cfg.treeCount; i++) {
      const p = this._randomPosInBounds();
      const rotY = Math.random() * Math.PI * 2;
      const baseH = 1.6 + Math.random() * 1.2;
      const trunkH = baseH * 0.45;
      const foliageH = baseH * 0.9;
      const trunkXZ = 0.85 + Math.random() * 0.4;
      const foliageXZ = baseH * 0.6;

      // Trunk
      _p.set(p.x, trunkH * 0.5, p.z);
      _q.setFromEuler(new THREE.Euler(0, rotY, 0));
      _s.set(trunkXZ, trunkH, trunkXZ);
      _m4.compose(_p, _q, _s);
      this.trunkInst.setMatrixAt(i, _m4);

      // Foliage
      _p.set(p.x, trunkH + foliageH * 0.5, p.z);
      _q.setFromEuler(new THREE.Euler(0, rotY, 0));
      _s.set(foliageXZ, foliageH, foliageXZ);
      _m4.compose(_p, _q, _s);
      this.foliageInst.setMatrixAt(i, _m4);

      this.treeBases[i] = {
        pos: new THREE.Vector3(p.x, 0, p.z),
        rotY,
        trunkH,
        foliageH,
        trunkXZ,
        foliageXZ,
        swayPhase: Math.random() * Math.PI * 2,
        swayAmp: 0.004 + Math.random() * 0.01
      };
    }
    this.trunkInst.instanceMatrix.needsUpdate = true;
    this.foliageInst.instanceMatrix.needsUpdate = true;

    // Place rocks
    for (let i = 0; i < cfg.rockCount; i++) {
      const p = this._randomPosInBounds();
      const s = 0.7 + Math.random() * 1.2;
      const rx = Math.random() * Math.PI;
      const ry = Math.random() * Math.PI;
      const rz = Math.random() * Math.PI;
      _p.set(p.x, 0.02, p.z);
      _q.setFromEuler(new THREE.Euler(rx, ry, rz));
      _s.set(s, s, s);
      _m4.compose(_p, _q, _s);
      this.rockInst.setMatrixAt(i, _m4);
    }
    this.rockInst.instanceMatrix.needsUpdate = true;

    // Place flowers
    for (let i = 0; i < cfg.flowerCount; i++) {
      const p = this._randomPosInBounds();
      // Stem
      _p.set(p.x, 0.12, p.z);
      _q.set(0, 0, 0, 1);
      _s.set(1, 0.24, 1);
      _m4.compose(_p, _q, _s);
      this.stemInst.setMatrixAt(i, _m4);
      // Petal
      _p.set(p.x, 0.28, p.z);
      _q.set(0, 0, 0, 1);
      _s.set(0.08, 0.08, 0.08);
      _m4.compose(_p, _q, _s);
      this.petalInst.setMatrixAt(i, _m4);
    }
    this.stemInst.instanceMatrix.needsUpdate = true;
    this.petalInst.instanceMatrix.needsUpdate = true;

    this.root.add(this.trunkInst, this.foliageInst, this.rockInst, this.stemInst, this.petalInst);
  }

  /**
   * Generate villages
   */
  _generateVillages() {
    const cfg = this.options;
    const acquireLight = this._acquireLight.bind(this);

    for (let i = 0; i < cfg.villageCount; i++) {
      const c = this._seededRandomPosInBounds();
      const vgroup = createHouseCluster(c, 4 + Math.floor(Math.random() * 6), cfg.villageRadius, {
        lights: this._houseLights,
        decorations: true,
        scaleMin: 0.9,
        scaleMax: 0.5,
        THEME_COLORS,
        acquireLight
      });
      vgroup.name = "village";
      this.root.add(vgroup);
      this.villages.push(vgroup);
      this.villageCenters.push(c);
    }
  }

  /**
   * Place additional structures
   */
  async _placeStructures() {
    try {
      const structuresAPI = await placeStructures({
        rng: this.rng,
        seededRange,
        root: this.root,
        villageCenters: this.villageCenters,
        water: this.water,
        cfg: this.options,
        __q: this._quality,
        acquireLight: this._acquireLight.bind(this),
        createGreekTemple,
        createVilla,
        createGreekColumn,
        createCypressTree,
        createOliveTree,
        createGreekStatue,
        createObelisk,
        pickPos: (minVillage = 12, minWater = 10, minBetween = 10, maxTries = 60) => {
          let tries = maxTries;
          while (tries-- > 0) {
            const p = this._seededRandomPosInBounds();
            if (p) return p;
          }
          return this._seededRandomPosInBounds();
        }
      });

      if (structuresAPI && typeof window !== 'undefined') {
        window.__structuresAPI = structuresAPI;
      }
    } catch (e) {
      console.warn("Extra structures generation failed", e);
    }
  }

  /**
   * Create water feature
   */
  _createWater() {
    const cfg = this.options;
    const geo = new THREE.CircleGeometry(cfg.waterRadius, 64);
    const mat = new THREE.MeshStandardMaterial({
      color: THEME_COLORS.lava,
      metalness: 0.35,
      roughness: 0.35,
      transparent: true,
      opacity: 0.9,
    });
    this.water = new THREE.Mesh(geo, mat);
    this.water.rotation.x = -Math.PI / 2;
    this.water.position.set(0, 0.02, -Math.max(20, WORLD.groundSize * 0.15));
    this.water.receiveShadow = false;
    this.root.add(this.water);
  }

  /**
   * Create rain particle system
   */
  _createRain(count) {
    const half = WORLD.groundSize * 0.5 - 6;
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      const x = (Math.random() * 2 - 1) * half;
      const y = 10 + Math.random() * 20;
      const z = (Math.random() * 2 - 1) * half;
      positions[i * 3 + 0] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      velocities[i] = 10 + Math.random() * 10;
    }
    
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ 
      color: THEME_COLORS.themeLightOrange, 
      size: 0.08, 
      transparent: true, 
      opacity: 0.8 
    });
    const pts = new THREE.Points(geom, mat);
    pts.name = "rain";
    this.root.add(pts);
    this.rain.points = pts;
    this.rain.velocities = velocities;
  }

  /**
   * Update environment (call each frame)
   */
  update(t, dt) {
    // Water shimmer
    if (this.water && this.water.material) {
      const m = this.water.material;
      m.emissive = m.emissive || new THREE.Color(THEME_COLORS.darkOrange);
      m.emissiveIntensity = 0.02 + Math.sin(t * 0.8) * 0.02;
      if (m.map) {
        m.map.offset.x = Math.sin(t * 0.12) * 0.0015;
        m.map.offset.y = Math.cos(t * 0.09) * 0.0015;
      }
    }

    // Tree sway animation
    this._updateTreeSway(t);

    // Rain animation
    this._updateRain(t, dt);
  }

  /**
   * Update tree sway animation
   */
  _updateTreeSway(t) {
    const q = this._quality;
    const doSway = (this._instSwayStride > 0) && ((q === "high") || (q === "medium" && (t - this._lastSwayT) > 0.12));
    
    if (doSway && this.foliageInst && Array.isArray(this.treeBases)) {
      this._lastSwayT = t;
      const startIdx = this._swayTick % this._instSwayStride;
      const _m4 = new THREE.Matrix4();
      const _q = new THREE.Quaternion();
      const _s = new THREE.Vector3();
      const _p = new THREE.Vector3();

      for (let i = startIdx; i < this.treeBases.length; i += this._instSwayStride) {
        const b = this.treeBases[i];
        if (!b) continue;
        const zRot = Math.sin(t + b.swayPhase) * b.swayAmp;
        _p.set(b.pos.x, b.trunkH + b.foliageH * 0.5, b.pos.z);
        _q.setFromEuler(new THREE.Euler(zRot, b.rotY, 0));
        _s.set(b.foliageXZ, b.foliageH, b.foliageXZ);
        _m4.compose(_p, _q, _s);
        this.foliageInst.setMatrixAt(i, _m4);
      }
      this.foliageInst.instanceMatrix.needsUpdate = true;
      this._swayTick++;
    }
  }

  /**
   * Update rain animation
   */
  _updateRain(t, dt) {
    if (!this.rain.enabled || !this.rain.points) return;

    const half = WORLD.groundSize * 0.5 - 6;
    this._rainFrame++;
    
    if ((this._rainFrame % this._rainStride) === 0) {
      const pos = this.rain.points.geometry.attributes.position.array;
      for (let i = 0; i < this.rain.velocities.length; i++) {
        pos[i * 3 + 1] -= this.rain.velocities[i] * dt;
        if (pos[i * 3 + 1] < 0.2) {
          pos[i * 3 + 0] = (Math.random() * 2 - 1) * half;
          pos[i * 3 + 1] = 12 + Math.random() * 20;
          pos[i * 3 + 2] = (Math.random() * 2 - 1) * half;
        }
      }
      this.rain.points.geometry.attributes.position.needsUpdate = true;
    }

    // Adaptive rain density
    const nowMs = performance.now();
    if (nowMs - this._lastRainAdaptT > 1200) {
      this._lastRainAdaptT = nowMs;
      try {
        const fps = (window.__perfMetrics && window.__perfMetrics.fps) || 60;
        if (!this._rainDownscaled && fps < 35) {
          this.setRainCount(Math.floor(this._baseRainCount * 0.6));
          this._rainDownscaled = true;
          this._rainStride = Math.min(3, this._rainStride + 1);
        } else if (this._rainDownscaled && fps > 70) {
          this.setRainCount(this._baseRainCount);
          this._rainDownscaled = false;
          this._rainStride = (this._quality === "high" ? 1 : (this._quality === "medium" ? 2 : 3));
        }
      } catch (_) {}
    }
  }

  /**
   * Toggle rain visibility
   */
  toggleRain(enabled) {
    this.rain.enabled = !!enabled;
    if (this.rain.enabled && !this.rain.points) {
      this._createRain(this.options.rainCount);
    }
    if (this.rain.points) {
      this.rain.points.visible = this.rain.enabled;
    }
  }

  /**
   * Set rain particle count
   */
  setRainCount(count) {
    const n = Math.max(0, Math.floor(count || 0));
    this.options.rainCount = n;
    
    // Remove old points
    if (this.rain.points) {
      try { this.root.remove(this.rain.points); } catch (_) {}
      try { this.rain.points.geometry.dispose?.(); } catch (_) {}
      this.rain.points = null;
      this.rain.velocities = null;
    }
    
    if (this.rain.enabled && n > 0) {
      this._createRain(n);
      if (this.rain.points) {
        this.rain.points.visible = true;
      }
    }
  }

  /**
   * Set rain level (0=low, 1=medium, 2=high)
   */
  setRainLevel(level) {
    const lvl = Math.max(0, Math.min(2, parseInt(level, 10) || 0));
    const map = [300, 900, 1800];
    this.setRainCount(map[lvl]);
  }

  // ---- Static factory methods ----
  
  static createTree(type = "cypress") {
    if (type === "olive") {
      return createOliveTree();
    }
    return createCypressTree();
  }

  static createRock() {
    const geo = new THREE.DodecahedronGeometry(1, 0);
    const mat = new THREE.MeshStandardMaterial({ color: THEME_COLORS.rock, roughness: 0.9 });
    const rock = new THREE.Mesh(geo, mat);
    rock.castShadow = true;
    return rock;
  }

  static createFlower() {
    const g = new THREE.Group();
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.24),
      new THREE.MeshStandardMaterial({ color: THEME_COLORS.stem })
    );
    stem.position.y = 0.12;
    g.add(stem);
    const petal = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 6, 6),
      new THREE.MeshStandardMaterial({ color: THEME_COLORS.tomato, emissive: THEME_COLORS.lava })
    );
    petal.position.y = 0.28;
    g.add(petal);
    return g;
  }
}

// ---- Legacy function exports for backward compatibility ----

/**
 * Create environment tree
 */
export function createEnvironmentTree(type = "cypress") {
  return EnvironmentManager.createTree(type);
}

/**
 * Create environment rock
 */
export function createEnvironmentRock() {
  return EnvironmentManager.createRock();
}

/**
 * Create environment flower
 */
export function createEnvironmentFlower() {
  return EnvironmentManager.createFlower();
}

/**
 * Legacy async initialization function
 */
export async function initEnvironment(scene, options = {}) {
  const manager = new EnvironmentManager(scene, options);
  await manager.init();
  
  return {
    root: manager.root,
    update: manager.update.bind(manager),
    toggleRain: manager.toggleRain.bind(manager),
    setRainCount: manager.setRainCount.bind(manager),
    setRainLevel: manager.setRainLevel.bind(manager),
  };
}

/**
 * Update environment to follow player position (e.g., for rain effects)
 */
export function updateEnvironmentFollow(env, player) {
  if (!env || !env.root || !player) return;
  
  // Update rain position to follow player if rain exists
  try {
    const rainObj = env.root.children.find(child => child.name === "rain");
    if (rainObj && player.position) {
      rainObj.position.x = player.position.x;
      rainObj.position.z = player.position.z;
    }
  } catch (_) {}
}
