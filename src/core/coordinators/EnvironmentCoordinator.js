/**
 * EnvironmentCoordinator - Manages environment and chunking setup
 */

import { ChunkManager, getOrInitWorldSeed } from "../../chunk_manager.js";
import { initEnvironment, updateEnvironmentFollow } from "../../environment.js";
import { WORLD } from "../../../config/index.js";
import { isMobile, MOBILE_OPTIMIZATIONS } from "../../mobile.js";

const ENV_PRESETS = [
  { treeCount: 20, rockCount: 10, flowerCount: 60, villageCount: 1 },
  { treeCount: 60, rockCount: 30, flowerCount: 120, villageCount: 1 },
  { treeCount: 140, rockCount: 80, flowerCount: 300, villageCount: 2 },
];

export class EnvironmentCoordinator {
  constructor({ scene, settingsManager }) {
    this.scene = scene;
    this.settingsManager = settingsManager;
    this.env = null;
    this.chunkMgr = null;
  }

  /**
   * Initialize environment with settings
   */
  async init() {
    const envSettings = this.settingsManager.getEnvironmentSettings();
    const renderQuality = this.settingsManager.getRenderQuality();
    
    let envRainState = envSettings.rain;
    const envDensityIndex = envSettings.density;
    const envRainLevel = envSettings.rainLevel;

    let envPreset = ENV_PRESETS[envDensityIndex];

    // Apply mobile optimizations
    if (isMobile) {
      const reduction = MOBILE_OPTIMIZATIONS.envDensityReduction;
      envPreset = {
        treeCount: Math.floor(envPreset.treeCount * reduction),
        rockCount: Math.floor(envPreset.rockCount * reduction),
        flowerCount: Math.floor(envPreset.flowerCount * reduction),
        villageCount: envPreset.villageCount,
      };
      if (MOBILE_OPTIMIZATIONS.disableRain) {
        envRainState = false;
      }
    }

    // Initialize chunking if enabled
    if (WORLD?.chunking?.enabled) {
      this._initChunking(envPreset);
      // Zero out preset counts if chunking is active
      envPreset = { ...envPreset, treeCount: 0, rockCount: 0, flowerCount: 0 };
    }

    // Initialize environment
    const WORLD_SEED = getOrInitWorldSeed();
    this.env = await initEnvironment(
      this.scene,
      {
        ...envPreset,
        enableRain: envRainState,
        quality: renderQuality,
        seed: WORLD_SEED,
      }
    );

    // Set rain level if enabled
    if (envRainState && this.env?.setRainLevel) {
      try {
        this.env.setRainLevel(envRainLevel);
      } catch (_) {}
    }
  }

  /**
   * Update environment to follow player
   */
  updateFollow(player) {
    if (this.env) {
      try {
        updateEnvironmentFollow(this.env, player);
      } catch (_) {}
    }
  }

  /**
   * Update chunk manager
   */
  updateChunks(playerPos) {
    if (this.chunkMgr) {
      try {
        this.chunkMgr.update(playerPos);
      } catch (_) {}
    }
  }

  /**
   * Update environment per frame
   */
  update(t, dt) {
    if (this.env?.update) {
      this.env.update(t, dt);
    }
  }

  /**
   * Get environment state for UI
   */
  getState() {
    return {
      env: this.env,
      envRainState: this.settingsManager.isRainEnabled(),
      envDensityIndex: this.settingsManager.getEnvironmentDensity(),
      envRainLevel: this.settingsManager.getRainLevel(),
    };
  }

  /**
   * Set environment state from UI
   */
  setState(state) {
    this.env = state.env ?? this.env;
    if (typeof state.envRainState === 'boolean') {
      this.settingsManager.setRainEnabled(state.envRainState);
    }
    if (typeof state.envDensityIndex === 'number') {
      this.settingsManager.setEnvironmentDensity(state.envDensityIndex);
    }
    if (typeof state.envRainLevel === 'number') {
      this.settingsManager.setRainLevel(state.envRainLevel);
    }
  }

  /**
   * Create environment context for settings UI
   */
  createEnvironmentContext(player) {
    return {
      scene: this.scene,
      ENV_PRESETS,
      initEnvironment,
      updateEnvironmentFollow,
      get player() {
        return player;
      },
      getState: () => this.getState(),
      setState: (state) => this.setState(state),
    };
  }

  getEnv() {
    return this.env;
  }

  getChunkManager() {
    return this.chunkMgr;
  }

  _initChunking(envPreset) {
    const chunkCfg = WORLD.chunking || {};
    const size = Math.max(50, chunkCfg.size || 200);
    const ground = WORLD.groundSize || 500;
    const groundArea = ground * ground;
    const chunkArea = size * size;
    const densityScale = Math.max(0.01, Math.min(1, chunkArea / groundArea));

    const densities = {
      trees: Math.max(0, Math.floor((envPreset.treeCount || 0) * densityScale)),
      rocks: Math.max(0, Math.floor((envPreset.rockCount || 0) * densityScale)),
      flowers: Math.max(0, Math.floor((envPreset.flowerCount || 0) * densityScale)),
    };

    try {
      const WORLD_SEED = getOrInitWorldSeed();
      this.chunkMgr = new ChunkManager(this.scene, {
        chunkSize: size,
        radius: Math.max(1, chunkCfg.radius || 2),
        seed: WORLD_SEED,
        storagePrefix: chunkCfg.storagePrefix || "gof.chunk",
        densities,
      });
    } catch (e) {
      console.warn("[Chunking] init failed:", e);
      this.chunkMgr = null;
    }
  }
}
