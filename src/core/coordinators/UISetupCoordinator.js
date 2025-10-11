/**
 * UISetupCoordinator - Manages UI setup and wiring
 */

import { setupSettingsScreen } from "../../ui/settings/index.js";
import { wireUIBindings } from "../../ui/bindings.js";
import { wireMarkCooldownUI } from "../../ui/mark_cooldown.js";
import { wireTopBar } from "../../ui/topbar.js";
import { renderHeroScreen as renderHeroScreenUI } from "../../ui/hero/index.js";
import { initHeroPreview } from "../../ui/hero/preview.js";
import { startInstructionGuide as startInstructionGuideOverlay } from "../../ui/guide.js";
import { t } from "../../i18n.js";
import { getTargetPixelRatio } from "../../world.js";
import { initEnvironment, updateEnvironmentFollow } from "../../environment.js";
import { storageKey } from "../../../config/index.js";
import { SKILLS_POOL, DEFAULT_LOADOUT } from "../../../config/skills_pool.js";
import { WORLD } from "../../../config/index.js";
import { audio } from "../../audio.js";
import { updateSkillBarLabels } from "../../ui/icons.js";

const ENV_PRESETS = [
  { treeCount: 20, rockCount: 10, flowerCount: 60, villageCount: 1 },
  { treeCount: 60, rockCount: 30, flowerCount: 120, villageCount: 1 },
  { treeCount: 140, rockCount: 80, flowerCount: 300, villageCount: 2 },
];

export class UISetupCoordinator {
  constructor({
    ui,
    settingsManager,
    worldManager,
    audioCoordinator,
    environmentCoordinator,
    entityCoordinator,
    loadoutCoordinator,
    mapManager,
    perfTracker,
    renderer,
    cameraOffset,
    effects,
  }) {
    this.ui = ui;
    this.settingsManager = settingsManager;
    this.worldManager = worldManager;
    this.audioCoordinator = audioCoordinator;
    this.environmentCoordinator = environmentCoordinator;
    this.entityCoordinator = entityCoordinator;
    this.loadoutCoordinator = loadoutCoordinator;
    this.mapManager = mapManager;
    this.perfTracker = perfTracker;
    this.renderer = renderer;
    this.cameraOffset = cameraOffset;
    this.effects = effects;

    this._disposeMarkCooldownUI = null;
    this._disposeTopBar = null;
  }

  /**
   * Setup all UI components
   */
  setup() {
    this._setupSettingsScreen();
    this._wireRestorePurchasesButton();
    this._wireUIElements();
    this._setupHeroPreview();
  }

  /**
   * Show hero screen
   */
  showHeroScreen(initialTab = "skills") {
    const player = this.entityCoordinator.getPlayer();
    const enemies = this.entityCoordinator.getEnemies();
    const portals = this.entityCoordinator.getPortals();

    const ctx = {
      t,
      player,
      SKILL_POOL: SKILLS_POOL,
      DEFAULT_LOADOUT,
      currentLoadout: this.loadoutCoordinator.getCurrentLoadout(),
      setLoadoutAndSave: (ids) => {
        // Get skills system reference
        const skillsSystem = player.skills;
        this.loadoutCoordinator.setLoadoutAndSave(ids, skillsSystem);
      },
      updateSkillBarLabels,
      mapManager: this.mapManager,
      portals,
      enemies,
      effects: this.effects,
      WORLD,
      setCenterMsg: (msg) => this.ui.setCenterMsg(msg),
      clearCenterMsg: () => this.ui.clearCenterMsg(),
      applyMapModifiersToEnemy: (en) => {
        if (this.mapManager.applyMapModifiersToEnemy) {
          this.mapManager.applyMapModifiersToEnemy(en);
        }
      },
      adjustEnemyCountForMap: () => {
        this.entityCoordinator.adjustEnemyCountForCurrentMap();
      },
    };

    try {
      this.audioCoordinator.ensureBackgroundMusic();
    } catch (_) {}

    try {
      renderHeroScreenUI(initialTab, ctx);
    } catch (_) {}
  }

  /**
   * Cleanup UI bindings
   */
  dispose() {
    if (this._disposeMarkCooldownUI) {
      try {
        this._disposeMarkCooldownUI();
      } catch (_) {}
    }
    if (this._disposeTopBar) {
      try {
        this._disposeTopBar();
      } catch (_) {}
    }
  }

  _setupSettingsScreen() {
    const btnSettingsScreen = document.getElementById("btnSettingsScreen");
    const btnCloseSettings = document.getElementById("btnCloseSettings");
    const settingsPanel = document.getElementById("settingsPanel");

    const audioCtl = this.audioCoordinator.createAudioController();
    const player = this.entityCoordinator.getPlayer();
    const environmentCtx = this.environmentCoordinator.createEnvironmentContext(player);

    const renderCtx = {
      renderer: this.renderer,
      cameraOffset: this.cameraOffset,
      baseCameraOffset: this.worldManager.getBaseCameraOffset(),
      getQuality: () => this.settingsManager.getRenderQuality(),
      setQuality: (q) => this.settingsManager.setRenderQuality(q),
      getTargetPixelRatio: () => getTargetPixelRatio(),
      getPerf: () => {
        try {
          return this.perfTracker.getPerf();
        } catch (_) {
          return { fps: 0, fpsLow1: 0, ms: 0, avgMs: 0 };
        }
      },
    };

    setupSettingsScreen({
      t,
      startInstructionGuide: () => startInstructionGuideOverlay(),
      elements: { btnSettingsScreen, btnCloseSettings, settingsPanel },
      environment: environmentCtx,
      render: renderCtx,
      audioCtl,
    });
  }

  _wireRestorePurchasesButton() {
    const btn = document.getElementById("btnRestorePurchases");
    if (!btn) return;

    btn.addEventListener("click", async () => {
      try {
        btn.disabled = true;
        this.ui.setCenterMsg("Checking purchases...");
        const res = await window.restorePurchases();

        if (Array.isArray(res)) {
          if (res.length > 0 || window.__appPurchased) {
            this.ui.setCenterMsg("Purchase restored.");
          } else {
            this.ui.setCenterMsg("No purchases found.");
          }
        } else if (res?.ok && res.note) {
          this.ui.setCenterMsg("Requested license status; awaiting response...");
        } else {
          if (window.__appPurchased) {
            this.ui.setCenterMsg("Purchase restored.");
          } else {
            this.ui.setCenterMsg("No purchase found.");
          }
        }

        setTimeout(() => {
          try {
            this.ui.clearCenterMsg();
          } catch (_) {}
        }, 1400);
      } catch (err) {
        console.warn("[UI] restorePurchases click failed", err);
        try {
          this.ui.setCenterMsg("Restore failed");
        } catch (_) {}
        setTimeout(() => {
          try {
            this.ui.clearCenterMsg();
          } catch (_) {}
        }, 1400);
      } finally {
        try {
          btn.disabled = false;
        } catch (_) {}
      }
    });
  }

  _wireUIElements() {
    const btnMark = document.getElementById("btnMark");
    const portals = this.entityCoordinator.getPortals();

    // Wire mark cooldown UI
    this._disposeMarkCooldownUI = wireMarkCooldownUI({
      btnMark,
      portals,
      intervalMs: 500,
    });

    try {
      window.__disposeMarkCooldownUI = this._disposeMarkCooldownUI;
    } catch (_) {}

    // Wire top bar
    const player = this.entityCoordinator.getPlayer();
    const heroBars = this.entityCoordinator.getHeroBars();

    this._disposeTopBar = wireTopBar({
      elements: {
        btnHeroScreen: document.getElementById("btnHeroScreen"),
        heroScreen: document.getElementById("heroScreen"),
        btnStart: document.getElementById("btnStart"),
        introScreen: document.getElementById("introScreen"),
        btnCamera: document.getElementById("btnCamera"),
        btnPortal: document.getElementById("btnPortal"),
        btnMark,
      },
      actions: {
        showHeroScreen: () => this.showHeroScreen("skills"),
        setFirstPerson: (enabled) =>
          this.worldManager.setFirstPersonMode(enabled, player, heroBars),
        getFirstPerson: () => this.worldManager.isFirstPersonMode(),
        portals,
        getPlayer: () => player,
        setCenterMsg: (msg) => this.ui.setCenterMsg(msg),
        clearCenterMsg: () => this.ui.clearCenterMsg(),
        startInstructionGuide: startInstructionGuideOverlay,
      },
    });

    try {
      window.__disposeTopBar = this._disposeTopBar;
    } catch (_) {}

    // Wire general UI bindings
    const audioCtl = this.audioCoordinator.createAudioController();
    const scene = this.worldManager.getWorld().scene;

    wireUIBindings({
      storageKey,
      scene,
      getPlayer: () => player,
      ENV_PRESETS,
      initEnvironment,
      updateEnvironmentFollow,
      envAccess: {
        get: () => this.environmentCoordinator.getState(),
        set: (state) => this.environmentCoordinator.setState(state),
      },
      renderQualityRef: {
        get: () => this.settingsManager.getRenderQuality(),
        set: (q) => this.settingsManager.setRenderQuality(q),
      },
      cameraOffset: this.cameraOffset,
      baseCameraOffset: this.worldManager.getBaseCameraOffset(),
      audioCtl,
      audio,
    });
  }

  _setupHeroPreview() {
    const player = this.entityCoordinator.getPlayer();
    const skillsSystem = player.skills;

    try {
      initHeroPreview(skillsSystem, {
        heroScreen: document.getElementById("heroScreen"),
      });
    } catch (_) {}
  }
}
