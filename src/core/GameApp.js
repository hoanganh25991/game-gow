/**
 * GameApp - Main application orchestrator
 * Delegates responsibilities to focused coordinators for better maintainability
 */

import * as THREE from "../../vendor/three/build/three.module.js";
import { storageKey, VILLAGE_POS } from "../../config/index.js";
import { initializeTheme } from "../../config/theme.js";
import { dir2D, now, clamp01 } from "../utils.js";
import { UIManager } from "../ui/hud/index.js";
import { EffectsManager, createGroundRing } from "../effects_manager.js";
import { SkillsSystem } from "../skills.js";
import { THEME_COLORS } from "../../config/index.js";
import { handWorldPos } from "../entities.js";
import { isMobile, MOBILE_OPTIMIZATIONS, applyMobileRendererHints } from "../mobile.js";
import { createPerformanceTracker, initVfxGating } from "../perf.js";
import { createIndicators } from "../ui/indicators.js";
import { preloadEffects } from "../effects_loader.js";
import { initSplash } from "../splash.js";
import { initI18n } from "../i18n.js";
import { setupDesktopControls } from "../ui/deskop-controls.js";
import * as payments from "../payments.js";
import { initPaymentsBootstrap } from "../payments_boot.js";
import { createMapManager, applyMapEnemyCss } from "../maps.js";
import { createRespawnSystem } from "../respawn_system.js";
import { audio } from "../audio.js";
import { getStructureProtectionRadius } from "../structures.js";
import { startInstructionGuide as startInstructionGuideOverlay } from "../ui/guide.js";

// Core systems
import { CameraSystem } from "../camera_system.js";
import { PlayerSystem } from "../player_system.js";
import { EnemiesSystem } from "../enemies_system.js";
import { BuffManager } from "../managers/BuffManager.js";
import { ProximityManager } from "../managers/ProximityManager.js";
import { UIController } from "../managers/UIController.js";
import { SettingsManager } from "../managers/SettingsManager.js";
import { WorldManager } from "./WorldManager.js";
import { GameLoop } from "./GameLoop.js";

// Coordinators
import { AudioCoordinator } from "./coordinators/AudioCoordinator.js";
import { EnvironmentCoordinator } from "./coordinators/EnvironmentCoordinator.js";
import { EntityCoordinator } from "./coordinators/EntityCoordinator.js";
import { LoadoutCoordinator } from "./coordinators/LoadoutCoordinator.js";
import { InputCoordinator } from "./coordinators/InputCoordinator.js";
import { UISetupCoordinator } from "./coordinators/UISetupCoordinator.js";
import { UpdateLoopCoordinator } from "./coordinators/UpdateLoopCoordinator.js";

export class GameApp {
  constructor(config = {}) {
    this.config = config;
    
    // Core managers
    this.settingsManager = null;
    this.worldManager = null;
    this.uiController = null;
    this.buffManager = null;
    this.proximityManager = null;
    this.gameLoop = null;

    // Coordinators
    this.audioCoordinator = null;
    this.environmentCoordinator = null;
    this.entityCoordinator = null;
    this.loadoutCoordinator = null;
    this.inputCoordinator = null;
    this.uiSetupCoordinator = null;
    this.updateLoopCoordinator = null;

    // Game systems
    this.cameraSystem = null;
    this.playerSystem = null;
    this.enemiesSystem = null;
    this.skillsSystem = null;
    this.respawnSystem = null;

    // World components
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.ground = null;
    this.cameraOffset = null;
    this.cameraShake = null;

    // Effects and utilities
    this.effects = null;
    this.indicators = null;
    this.mapManager = null;
    this.perfTracker = null;
    this.shouldSpawnVfx = null;

    // UI
    this.ui = null;
  }

  /**
   * Initialize the entire application
   */
  async init() {
    // Initialize theme colors from JavaScript into CSS variables
    initializeTheme();

    // Phase 1: Core infrastructure
    await this._initCoreInfrastructure();

    // Phase 2: Coordinators
    await this._initCoordinators();

    // Phase 3: Game systems
    await this._initGameSystems();

    // Phase 4: Setup and wire
    await this._setupAndWire();

    // Phase 5: Game loop
    this._setupGameLoop();
  }

  /**
   * Start the game
   */
  start() {
    this.gameLoop.start();

    // Align player start facing village center
    const player = this.entityCoordinator.getPlayer();
    const v = dir2D(player.pos(), VILLAGE_POS);
    const yaw = Math.atan2(v.x, v.z);
    player.mesh.quaternion.setFromEuler(new THREE.Euler(0, yaw, 0));

    // Expose guide for external access
    try {
      window.startInstructionGuide = startInstructionGuideOverlay;
    } catch (_) {}
  }

  // ============================================================
  // INITIALIZATION PHASES
  // ============================================================

  async _initCoreInfrastructure() {
    // Settings
    this.settingsManager = new SettingsManager({ storageKey, isMobile, MOBILE_OPTIMIZATIONS });

    // World
    this.worldManager = new WorldManager({
      initWorld: (await import("../world.js")).initWorld,
      updateCamera: (await import("../world.js")).updateCamera,
      updateGridFollow: (await import("../world.js")).updateGridFollow,
      addResizeHandler: (await import("../world.js")).addResizeHandler,
    });

    const world = this.worldManager.getWorld();
    this.scene = world.scene;
    this.camera = world.camera;
    this.renderer = world.renderer;
    this.ground = world.ground;
    this.cameraOffset = world.cameraOffset;
    this.cameraShake = world.cameraShake;

    // Effects
    const renderQuality = this.settingsManager.getRenderQuality();
    this.effects = new EffectsManager(this.scene, { quality: renderQuality });

    // Mobile optimizations
    applyMobileRendererHints(this.renderer, { quality: renderQuality });

    // Performance tracking
    this.perfTracker = createPerformanceTracker(this.renderer, { targetFPS: 90, autoAdjust: true });
    this.shouldSpawnVfx = initVfxGating({
      camera: this.camera,
      isMobile,
      mobileOpts: MOBILE_OPTIMIZATIONS,
      initialQuality: renderQuality,
      tracker: this.perfTracker,
    });

    // Preload effects
    try {
      await preloadEffects();
    } catch (e) {
      console.warn("[GameApp] preloadEffects failed:", e);
    }

    // UI Manager
    this.ui = new UIManager();

    // Indicators
    this.indicators = createIndicators({
      effects: this.effects,
      THEME_COLORS,
      createGroundRing,
      isMobile,
      MOBILE_OPTIMIZATIONS,
      handWorldPos,
    });

    // Map Manager
    this.mapManager = createMapManager();
    try {
      applyMapEnemyCss(this.mapManager.getModifiers());
    } catch (_) {}

    // Splash and I18n
    initSplash();
    initI18n();
    setupDesktopControls();
    initPaymentsBootstrap({ payments, storageKey });
  }

  async _initCoordinators() {
    // Audio Coordinator
    this.audioCoordinator = new AudioCoordinator({
      audio,
      settingsManager: this.settingsManager,
    });
    this.audioCoordinator.init();

    // Environment Coordinator
    this.environmentCoordinator = new EnvironmentCoordinator({
      scene: this.scene,
      settingsManager: this.settingsManager,
    });
    await this.environmentCoordinator.init();

    // UI Controller (needed by EntityCoordinator)
    this.uiController = new UIController({
      ui: this.ui,
      player: null, // Will be set after entity creation
      heroBars: null, // Will be set after entity creation
      camera: this.camera,
      clamp01,
      isMobile,
      MOBILE_OPTIMIZATIONS,
    });

    // Entity Coordinator
    this.entityCoordinator = new EntityCoordinator({
      scene: this.scene,
      settingsManager: this.settingsManager,
      uiController: this.uiController,
      mapManager: this.mapManager,
      environmentCoordinator: this.environmentCoordinator,
    });
    await this.entityCoordinator.init();

    // Update UI Controller with player and heroBars
    this.uiController.setPlayer(this.entityCoordinator.getPlayer());
    this.uiController.setHeroBars(this.entityCoordinator.getHeroBars());

    // Loadout Coordinator
    this.loadoutCoordinator = new LoadoutCoordinator();
    this.loadoutCoordinator.init();
  }

  async _initGameSystems() {
    const player = this.entityCoordinator.getPlayer();
    const enemies = this.entityCoordinator.getEnemies();
    const villages = this.entityCoordinator.getVillages();

    // Core game systems
    this.cameraSystem = new CameraSystem({ THREE, now, effects: this.effects });
    this.playerSystem = new PlayerSystem({
      THREE,
      now,
      dir2D,
      distance2D: (await import("../utils.js")).distance2D,
      WORLD: (await import("../../config/index.js")).WORLD,
      renderer: this.renderer,
    });
    this.enemiesSystem = new EnemiesSystem({
      THREE,
      WORLD: (await import("../../config/index.js")).WORLD,
      VILLAGE_POS,
      REST_RADIUS: (await import("../../config/index.js")).REST_RADIUS,
      dir2D,
      distance2D: (await import("../utils.js")).distance2D,
      now,
      audio,
      effects: this.effects,
      scene: this.scene,
      player,
      enemies,
      villages,
      mapManager: this.mapManager,
      isMobile,
      MOBILE_OPTIMIZATIONS,
      camera: this.camera,
      shouldSpawnVfx: this.shouldSpawnVfx,
      applyMapModifiersToEnemy: this.mapManager.applyMapModifiersToEnemy?.bind(this.mapManager),
      chunkMgr: this.environmentCoordinator.getChunkManager(),
    });

    // Skills System
    this.skillsSystem = new SkillsSystem(
      player,
      enemies,
      this.effects,
      this.ui.getCooldownElements(),
      villages
    );

    // Attach skills to player
    try {
      window.__skillsRef = this.skillsSystem;
      player.skills = this.skillsSystem;
    } catch (_) {}

    // Buff Manager
    this.buffManager = new BuffManager({
      THREE,
      player,
      setCenterMsg: (msg) => this.uiController.setCenterMsg(msg),
      clearCenterMsg: () => this.uiController.clearCenterMsg(),
    });

    // Proximity Manager
    this.proximityManager = new ProximityManager({
      player,
      chunkMgr: this.environmentCoordinator.getChunkManager(),
      villaStructures: this.entityCoordinator.getVillaStructures(),
      buffManager: this.buffManager,
      setCenterMsg: (msg) => this.uiController.setCenterMsg(msg),
      clearCenterMsg: () => this.uiController.clearCenterMsg(),
      getStructureProtectionRadius,
    });

    // Wire village buff events
    window.addEventListener("village-enter", () => this.buffManager.applyVillageBuff());
    window.addEventListener("village-leave", () => this.buffManager.removeVillageBuff());

    // Respawn system
    this.respawnSystem = createRespawnSystem({
      THREE,
      now,
      VILLAGE_POS,
      setCenterMsg: (msg) => this.ui.setCenterMsg(msg),
      clearCenterMsg: () => this.ui.clearCenterMsg(),
      player,
    });

    // Initialize AI and billboard strides
    const renderQuality = this.settingsManager.getRenderQuality();
    let aiStride = renderQuality === "low" ? 3 : renderQuality === "medium" ? 2 : 1;
    if (isMobile) {
      aiStride = Math.ceil(aiStride * MOBILE_OPTIMIZATIONS.aiStrideMultiplier);
    }

    let bbStride = renderQuality === "high" ? 2 : 3;
    if (isMobile) {
      bbStride = Math.max(5, bbStride + 2);
    }

    if (isMobile) {
      console.info(`[Mobile] AI stride: ${aiStride}, Billboard stride: ${bbStride}`);
    }

    this._aiStride = aiStride;
    this._bbStride = bbStride;
  }

  async _setupAndWire() {
    // Input Coordinator
    this.inputCoordinator = new InputCoordinator({
      renderer: this.renderer,
      camera: this.camera,
      ground: this.ground,
      player: this.entityCoordinator.getPlayer(),
      enemies: this.entityCoordinator.getEnemies(),
      portals: this.entityCoordinator.getPortals(),
      effects: this.effects,
      skillsSystem: this.skillsSystem,
      uiController: this.uiController,
      loadoutCoordinator: this.loadoutCoordinator,
    });
    this.inputCoordinator.init();

    // UI Setup Coordinator
    this.uiSetupCoordinator = new UISetupCoordinator({
      ui: this.ui,
      settingsManager: this.settingsManager,
      worldManager: this.worldManager,
      audioCoordinator: this.audioCoordinator,
      environmentCoordinator: this.environmentCoordinator,
      entityCoordinator: this.entityCoordinator,
      loadoutCoordinator: this.loadoutCoordinator,
      mapManager: this.mapManager,
      perfTracker: this.perfTracker,
      renderer: this.renderer,
      cameraOffset: this.cameraOffset,
      effects: this.effects,
    });
    this.uiSetupCoordinator.setup();
  }

  _setupGameLoop() {
    // Update Loop Coordinator
    this.updateLoopCoordinator = new UpdateLoopCoordinator({
      worldManager: this.worldManager,
      cameraSystem: this.cameraSystem,
      playerSystem: this.playerSystem,
      enemiesSystem: this.enemiesSystem,
      uiController: this.uiController,
      proximityManager: this.proximityManager,
      respawnSystem: this.respawnSystem,
      environmentCoordinator: this.environmentCoordinator,
      entityCoordinator: this.entityCoordinator,
      inputCoordinator: this.inputCoordinator,
      renderer: this.renderer,
      camera: this.camera,
      scene: this.scene,
      cameraShake: this.cameraShake,
      effects: this.effects,
      perfTracker: this.perfTracker,
      indicators: this.indicators,
      skillsSystem: this.skillsSystem,
    });

    // Set strides
    this.updateLoopCoordinator.setStrides(this._aiStride, this._bbStride);

    // Game Loop
    this.gameLoop = new GameLoop({
      now,
      isMobile,
      MOBILE_OPTIMIZATIONS,
      onUpdate: (dt, t, budgetInfo) => {
        this.updateLoopCoordinator.update(dt, t, budgetInfo);
      },
    });
  }
}
