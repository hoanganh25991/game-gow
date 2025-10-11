/**
 * EntityCoordinator - Manages entities initialization (player, enemies, villages, portals)
 */

import * as THREE from "../../../vendor/three/build/three.module.js";
import { Player, Enemy } from "../../entities.js";
import { createHouse, createHeroOverheadBars } from "../../meshes.js";
import { initPortals } from "../../portals.js";
import { createVillagesSystem } from "../../villages.js";
import { createVillageFence } from "../../villages_fence.js";
import { createDynamicSpawner } from "../../spawn.js";
import { VILLAGE_POS, REST_RADIUS, THEME_COLORS, WORLD } from "../../../config/index.js";
import { now, distance2D } from "../../utils.js";
import { t } from "../../i18n.js";
import { promptBasicUpliftIfNeeded } from "../../uplift.js";
import { updateEnvironmentFollow } from "../../environment.js";

export class EntityCoordinator {
  constructor({ 
    scene, 
    settingsManager, 
    uiController, 
    mapManager, 
    environmentCoordinator 
  }) {
    this.scene = scene;
    this.settingsManager = settingsManager;
    this.uiController = uiController;
    this.mapManager = mapManager;
    this.environmentCoordinator = environmentCoordinator;
    
    this.player = null;
    this.enemies = [];
    this.selectedUnit = null;
    this.heroBars = null;
    this.portals = null;
    this.villages = null;
    this.spawner = null;
    this.villaStructures = [];
  }

  /**
   * Initialize all entities
   */
  async init() {
    this._createPlayer();
    this._initPortals();
    this._createVillageVisuals();
    this._initVillages();
    this._gatherVillaStructures();
    this._initSpawner();
    this._setupPlayerEventHandlers();
    
    this.selectedUnit = this.player;
  }

  /**
   * Get player instance
   */
  getPlayer() {
    return this.player;
  }

  /**
   * Get enemies array
   */
  getEnemies() {
    return this.enemies;
  }

  /**
   * Get selected unit
   */
  getSelectedUnit() {
    return this.selectedUnit;
  }

  /**
   * Get hero bars
   */
  getHeroBars() {
    return this.heroBars;
  }

  /**
   * Get portals system
   */
  getPortals() {
    return this.portals;
  }

  /**
   * Get villages system
   */
  getVillages() {
    return this.villages;
  }

  /**
   * Get spawner
   */
  getSpawner() {
    return this.spawner;
  }

  /**
   * Get villa structures
   */
  getVillaStructures() {
    return this.villaStructures;
  }

  /**
   * Adjust enemy count for current map
   */
  adjustEnemyCountForCurrentMap() {
    try {
      this.spawner?.adjustForMapChange();
    } catch (_) {}
  }

  _createPlayer() {
    this.player = new Player();
    this.scene.add(this.player.mesh);
    
    // Update environment to follow player
    const env = this.environmentCoordinator.getEnv();
    if (env) {
      try {
        updateEnvironmentFollow(env, this.player);
      } catch (_) {}
    }

    // Setup hero bars
    this.heroBars = createHeroOverheadBars();
    this.player.mesh.add(this.heroBars.container);

    // Player death handler
    this.player.onDeath = () => {
      this.player.deadUntil = now() + 3;
      this.uiController.setCenterMsg(t("death.msg"));
      this.player.aimMode = false;
      this.player.aimModeSkill = null;
      this.player.moveTarget = null;
      this.player.target = null;
    };
  }

  _initPortals() {
    try {
      this.portals = initPortals(this.scene);
    } catch (e) {
      console.warn("[PORTALS] init failed:", e);
      this.portals = null;
    }
  }

  _createVillageVisuals() {
    // Create houses
    const houses = [
      (() => {
        const h = createHouse();
        h.position.set(8, 0, -8);
        this.scene.add(h);
        return h;
      })(),
      (() => {
        const h = createHouse();
        h.position.set(-10, 0, 10);
        this.scene.add(h);
        return h;
      })(),
      (() => {
        const h = createHouse();
        h.position.set(-16, 0, -12);
        this.scene.add(h);
        return h;
      })(),
    ];

    // Create fence
    const fenceGroup = createVillageFence(VILLAGE_POS, REST_RADIUS, THEME_COLORS);
    this.scene.add(fenceGroup);
  }

  _initVillages() {
    this.villages = createVillagesSystem(this.scene, this.portals);
  }

  _gatherVillaStructures() {
    try {
      this.scene.traverse((obj) => {
        try {
          if (obj?.userData?.structure === "villa") {
            const center = obj.userData.center
              ? obj.userData.center.clone()
              : obj.position?.clone();
            const radius = obj.userData.radius || 6;
            if (center) {
              this.villaStructures.push({ obj, center, radius });
            }
          }
        } catch (_) {}
      });
    } catch (_) {}
  }

  _initSpawner() {
    const renderQuality = this.settingsManager.getRenderQuality();
    const chunkMgr = this.environmentCoordinator.getChunkManager();

    this.spawner = createDynamicSpawner({
      scene: this.scene,
      player: this.player,
      enemies: this.enemies,
      mapManager: this.mapManager,
      villages: this.villages,
      WORLD,
      EnemyClass: Enemy,
      now,
      distance2D,
      VILLAGE_POS,
      REST_RADIUS,
      renderQuality,
      applyMapModifiersToEnemy: this.mapManager.applyMapModifiersToEnemy?.bind(this.mapManager),
      chunkMgr,
    });

    this.spawner.initialSpawn();
  }

  _setupPlayerEventHandlers() {
    // Map unlock system
    try {
      this.mapManager.unlockByLevel(this.player.level);
      
      window.addEventListener("player-levelup", (ev) => {
        this._handlePlayerLevelUp(ev);
      });
    } catch (_) {}

    // Uplift prompts
    try {
      promptBasicUpliftIfNeeded(this.player);
      
      window.addEventListener("player-levelup", () => {
        try {
          promptBasicUpliftIfNeeded(this.player);
        } catch (_) {}
        try {
          this.adjustEnemyCountForCurrentMap();
        } catch (_) {}
      });
    } catch (_) {}

    // Expose global helper
    try {
      window.adjustEnemyCountForMap = this.adjustEnemyCountForCurrentMap.bind(this);
    } catch (_) {}
  }

  _handlePlayerLevelUp(ev) {
    try {
      const lvl = ev?.detail?.level || this.player.level;
      const unlockedChanged = this.mapManager.unlockByLevel(lvl);
      
      if (unlockedChanged) {
        const prevIdx = this.mapManager.getCurrentIndex?.() || 1;
        const maxIdx = this.mapManager.getUnlockedMax?.() || prevIdx;
        
        if (maxIdx > prevIdx) {
          if (this.mapManager.setCurrent?.(maxIdx)) {
            this.enemies.forEach((en) => {
              if (this.mapManager.applyMapModifiersToEnemy) {
                this.mapManager.applyMapModifiersToEnemy(en);
              }
            });
            
            try {
              this.adjustEnemyCountForCurrentMap();
            } catch (_) {}
            
            this.uiController.setCenterMsg(`Unlocked and switched to MAP ${maxIdx}`);
            setTimeout(() => this.uiController.clearCenterMsg(), 1400);
          }
        }
      }
    } catch (_) {}
  }
}
