/**
 * InputCoordinator - Manages input systems (raycasting, input service, touch controls)
 */

import { createRaycast } from "../../raycast.js";
import { createInputService } from "../../input_service.js";
import { initTouchControls } from "../../touch.js";
import { getNearestEnemy } from "../../entities.js";
import { WORLD } from "../../../config/index.js";

export class InputCoordinator {
  constructor({
    renderer,
    camera,
    ground,
    player,
    enemies,
    portals,
    effects,
    skillsSystem,
    uiController,
    loadoutCoordinator,
  }) {
    this.renderer = renderer;
    this.camera = camera;
    this.ground = ground;
    this.player = player;
    this.enemies = enemies;
    this.portals = portals;
    this.effects = effects;
    this.skillsSystem = skillsSystem;
    this.uiController = uiController;
    this.loadoutCoordinator = loadoutCoordinator;

    this.inputService = null;
    this.touch = null;
    this.raycast = null;
    this._enemyMeshRefreshInterval = null;
  }

  /**
   * Initialize input systems
   */
  init() {
    const enemyMeshes = [];
    
    // Setup enemy mesh tracking for raycasting
    const refreshEnemyMeshes = () => {
      try {
        enemyMeshes.length = 0;
        for (const en of this.enemies) {
          if (en.alive) enemyMeshes.push(en.mesh);
        }
      } catch (_) {}
    };

    refreshEnemyMeshes();

    // Clear any existing interval
    try {
      clearInterval(window.__enemyMeshRefreshInt);
    } catch (_) {}

    // Setup periodic refresh
    this._enemyMeshRefreshInterval = setInterval(refreshEnemyMeshes, 200);
    window.__enemyMeshRefreshInt = this._enemyMeshRefreshInterval;

    // Create raycast system
    this.raycast = createRaycast({
      renderer: this.renderer,
      camera: this.camera,
      ground: this.ground,
      enemiesMeshesProvider: () => enemyMeshes,
      playerMesh: this.player.mesh,
    });

    // Create input service
    this.inputService = createInputService({
      renderer: this.renderer,
      raycast: this.raycast,
      camera: this.camera,
      portals: this.portals,
      player: this.player,
      enemies: this.enemies,
      effects: this.effects,
      skills: this.skillsSystem,
      WORLD,
      aimPreview: null,
      attackPreview: null,
      setCenterMsg: (msg) => this.uiController.setCenterMsg(msg),
      clearCenterMsg: () => this.uiController.clearCenterMsg(),
    });

    this.inputService.attachCaptureListeners();

    // Initialize touch controls
    const skillAPI = this.loadoutCoordinator.getSkillAPI();
    this.touch = initTouchControls({
      player: this.player,
      skills: this.skillsSystem,
      effects: this.effects,
      aimPreview: null,
      attackPreview: null,
      enemies: this.enemies,
      getNearestEnemy,
      WORLD,
      skillApi: skillAPI,
    });

    // Connect touch to input service
    if (this.touch) {
      this.inputService.setTouchAdapter(this.touch);
    }
  }

  /**
   * Get input service
   */
  getInputService() {
    return this.inputService;
  }

  /**
   * Get touch controls
   */
  getTouchControls() {
    return this.touch;
  }

  /**
   * Cleanup
   */
  dispose() {
    if (this._enemyMeshRefreshInterval) {
      clearInterval(this._enemyMeshRefreshInterval);
      this._enemyMeshRefreshInterval = null;
    }
  }
}
