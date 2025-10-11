/**
 * UpdateLoopCoordinator - Manages game update loop logic
 */

import * as THREE from "../../../vendor/three/build/three.module.js";
import { now } from "../../utils.js";
import { updateEnvironmentFollow } from "../../environment.js";

const MOVE_PING_INTERVAL = 0.3;

export class UpdateLoopCoordinator {
  constructor({
    worldManager,
    cameraSystem,
    playerSystem,
    enemiesSystem,
    uiController,
    proximityManager,
    respawnSystem,
    environmentCoordinator,
    entityCoordinator,
    inputCoordinator,
    renderer,
    camera,
    scene,
    cameraShake,
    effects,
    perfTracker,
    indicators,
    skillsSystem,
  }) {
    this.worldManager = worldManager;
    this.cameraSystem = cameraSystem;
    this.playerSystem = playerSystem;
    this.enemiesSystem = enemiesSystem;
    this.uiController = uiController;
    this.proximityManager = proximityManager;
    this.respawnSystem = respawnSystem;
    this.environmentCoordinator = environmentCoordinator;
    this.entityCoordinator = entityCoordinator;
    this.inputCoordinator = inputCoordinator;
    this.renderer = renderer;
    this.camera = camera;
    this.scene = scene;
    this.cameraShake = cameraShake;
    this.effects = effects;
    this.perfTracker = perfTracker;
    this.indicators = indicators;
    this.skillsSystem = skillsSystem;

    // State
    this.lastMoveDir = new THREE.Vector3(0, 0, 0);
    this.joyContPingT = 0;
    this.arrowContPingT = 0;
    this.arrowWasActive = false;
    this.bbOffset = 0;
    this.adaptNextT = 0;
    this.aiStride = 1;
    this.bbStride = 2;
  }

  /**
   * Set AI and billboard strides
   */
  setStrides(aiStride, bbStride) {
    this.aiStride = aiStride;
    this.bbStride = bbStride;
  }

  /**
   * Main update function called by GameLoop
   */
  update(dt, t, { isOverBudget }) {
    const player = this.entityCoordinator.getPlayer();
    const enemies = this.entityCoordinator.getEnemies();
    const selectedUnit = this.entityCoordinator.getSelectedUnit();
    const portals = this.entityCoordinator.getPortals();
    const villages = this.entityCoordinator.getVillages();
    const spawner = this.entityCoordinator.getSpawner();
    const chunkMgr = this.environmentCoordinator.getChunkManager();
    const env = this.environmentCoordinator.getEnv();
    const inputService = this.inputCoordinator.getInputService();
    const touch = this.inputCoordinator.getTouchControls();

    // Performance tracking
    this._updatePerformance();

    // Input
    inputService.update(t, dt);

    // Mobile joystick movement
    this._handleJoystickMovement(player, touch, t);

    // Arrow key movement
    this._handleArrowKeyMovement(player, inputService, t);

    // Player update
    this.playerSystem.updatePlayer(dt, { player, lastMoveDir: this.lastMoveDir });

    // Enemies update
    this.enemiesSystem.update(dt, {
      aiStride: this.aiStride,
      bbStride: this.bbStride,
      bbOffset: this.bbOffset,
    });

    // Dynamic spawner
    try {
      spawner?.update(dt);
    } catch (e) {}

    // Camera update
    if (this.worldManager.isFirstPersonMode()) {
      this.cameraSystem.updateFirstPerson(this.camera, player, this.lastMoveDir, dt);
    } else {
      this.worldManager.updateCameraForPlayer(player, this.lastMoveDir, dt);
    }

    // Grid and environment follow
    this.worldManager.updateGridForPlayer(player);
    this.environmentCoordinator.updateFollow(player);
    this.environmentCoordinator.updateChunks(player.pos());

    // UI updates (throttled via UIController)
    this.uiController.updateHUD();
    this.uiController.updateMinimap(enemies, portals, villages, chunkMgr);
    this.uiController.updateHeroBars();

    // Skills, effects, environment
    this.skillsSystem.update(t, dt, this.cameraShake);
    this.effects.update(t, dt);
    this.environmentCoordinator.update(t, dt);

    // Village streaming (throttled)
    this._updateVillageStreaming(player, villages);

    if (!isOverBudget()) {
      this.indicators.update(dt, { now, player, enemies, selectedUnit });
      portals.update(dt);
      villages.updateRest(player, dt);

      // Proximity checks
      this.proximityManager.update();

      this.respawnSystem.update();
    }

    if (!isOverBudget()) {
      this.bbOffset = (this.bbOffset + 1) % this.bbStride;
    }

    // Render
    this.renderer.render(this.scene, this.camera);

    // Game ready event
    this._dispatchGameReadyEvent();

    // Adaptive performance
    this._adaptivePerformance(t, spawner);
  }

  _updatePerformance() {
    try {
      this.perfTracker.update(performance.now());
      this.perfTracker.maybeAutoAdjustVfxQuality();
    } catch (_) {}
  }

  _handleJoystickMovement(player, touch, t) {
    try {
      if (typeof touch !== "undefined" && touch) {
        const joy = touch.getMoveDir?.();
        if (joy?.active && !player.frozen && !player.aimMode) {
          const speed = 10;
          const base = player.pos();
          const px = base.x + joy.x * speed;
          const pz = base.z + joy.y * speed;
          player.moveTarget = new THREE.Vector3(px, 0, pz);
          player.attackMove = false;
          player.target = null;

          try {
            const tnow = now();
            if (!this.joyContPingT || tnow >= this.joyContPingT) {
              this.effects.spawnMovePing(new THREE.Vector3(px, 0, pz));
              this.joyContPingT = tnow + MOVE_PING_INTERVAL;
            }
          } catch (e) {}
        } else {
          try {
            this.joyContPingT = 0;
          } catch (_) {}
        }
      }
    } catch (_) {}
  }

  _handleArrowKeyMovement(player, inputService, t) {
    try {
      const ks = inputService?._state?.moveKeys;
      let active = false,
        dx = 0,
        dy = 0;

      if (ks) {
        dx = (ks.right ? 1 : 0) + (ks.left ? -1 : 0);
        dy = (ks.down ? 1 : 0) + (ks.up ? -1 : 0);
        const len = Math.hypot(dx, dy);
        if (len > 0) {
          dx /= len;
          dy /= len;
          active = true;
        }
      }

      if (active && !player.frozen && !player.aimMode) {
        const speed = 10;
        const base = player.pos();
        const px = base.x + dx * speed;
        const pz = base.z + dy * speed;

        if (!this.arrowWasActive) {
          this.effects.spawnMovePing(new THREE.Vector3(px, 0, pz));
          this.arrowContPingT = t + MOVE_PING_INTERVAL;
        } else if (!this.arrowContPingT || t >= this.arrowContPingT) {
          this.effects.spawnMovePing(new THREE.Vector3(px, 0, pz));
          this.arrowContPingT = t + MOVE_PING_INTERVAL;
        }
        this.arrowWasActive = true;
      } else {
        this.arrowWasActive = false;
        this.arrowContPingT = 0;
      }
    } catch (_) {}
  }

  _updateVillageStreaming(player, villages) {
    if (!window.__lastVillageStreamT) window.__lastVillageStreamT = 0;
    const nowMs = performance.now();
    if (nowMs - window.__lastVillageStreamT >= 150) {
      try {
        villages.ensureFarVillage(player.pos());
      } catch (_) {}
      try {
        villages.updateVisitedVillage(player.pos());
      } catch (_) {}
      window.__lastVillageStreamT = nowMs;
    }
  }

  _dispatchGameReadyEvent() {
    try {
      if (!window.__gameRenderReadyDispatched) {
        window.__gameRenderReadyDispatched = true;
        try {
          const canvas = this.renderer?.domElement;
          if (canvas) {
            try {
              canvas.style.opacity = "1";
            } catch (_) {}
          }
        } catch (_) {}
        try {
          window.dispatchEvent(new Event("game-render-ready"));
        } catch (_) {}
      }
    } catch (_) {}
  }

  _adaptivePerformance(t, spawner) {
    try {
      if (!this.adaptNextT || t >= this.adaptNextT) {
        const fps = this.perfTracker.getFPS?.() || 60;
        let scale = spawner ? spawner.getPerformanceScale() : 1.0;

        if (fps < 25) {
          this.aiStride = Math.min(8, (this.aiStride || 1) + 1);
          scale = Math.max(1.0, scale - 0.05);
        } else if (fps > 50) {
          this.aiStride = Math.max(1, (this.aiStride || 1) - 1);
          scale = Math.min(1.2, scale + 0.05);
        }

        spawner?.setPerformanceScale(scale);
        this.adaptNextT = t + 1.5;
      }
    } catch (_) {}
  }
}
