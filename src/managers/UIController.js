/**
 * UIController
 * Manages all UI updates including HUD, minimap, center messages, and hero bars.
 * Implements throttling for performance on mobile devices.
 *
 * Public API:
 *   const uiController = new UIController({ 
 *     ui, player, heroBars, camera, clamp01,
 *     isMobile, MOBILE_OPTIMIZATIONS 
 *   });
 *   uiController.updateHUD();
 *   uiController.updateMinimap(enemies, portals, villages, structures);
 *   uiController.updateHeroBars();
 *   uiController.setCenterMsg(msg);
 *   uiController.clearCenterMsg();
 */
export class UIController {
  // Private fields
  #ui;
  #player;
  #heroBars;
  #camera;
  #clamp01;
  
  // Throttling configuration
  #HUD_UPDATE_MS;
  #MINIMAP_UPDATE_MS;
  #lastHudT = 0;
  #lastMinimapT = 0;

  constructor({ 
    ui, 
    player, 
    heroBars, 
    camera, 
    clamp01,
    isMobile = false,
    MOBILE_OPTIMIZATIONS = {}
  }) {
    this.#ui = ui;
    this.#player = player;
    this.#heroBars = heroBars;
    this.#camera = camera;
    this.#clamp01 = clamp01;
    
    // Configure throttle intervals based on platform
    this.#HUD_UPDATE_MS = isMobile ? (MOBILE_OPTIMIZATIONS.hudUpdateMs || 150) : 150;
    this.#MINIMAP_UPDATE_MS = isMobile ? (MOBILE_OPTIMIZATIONS.minimapUpdateMs || 150) : 150;
    
    // Expose for runtime tuning
    try {
      if (typeof window !== 'undefined') {
        window.__HUD_UPDATE_MS = this.#HUD_UPDATE_MS;
        window.__MINIMAP_UPDATE_MS = this.#MINIMAP_UPDATE_MS;
      }
    } catch (_) {}
  }

  /**
   * Set player reference (for late initialization)
   */
  setPlayer(player) {
    this.#player = player;
  }

  /**
   * Set hero bars reference (for late initialization)
   */
  setHeroBars(heroBars) {
    this.#heroBars = heroBars;
  }

  /**
   * Update HUD (health/mana bars, level, etc.)
   * Throttled for performance
   */
  updateHUD() {
    const nowMs = performance.now();
    if ((nowMs - this.#lastHudT) < this.#HUD_UPDATE_MS) return;
    
    this.#lastHudT = nowMs;
    try {
      this.#ui?.updateHUD?.(this.#player);
    } catch (err) {
      console.error('[UIController] HUD update failed:', err);
    }
  }

  /**
   * Update minimap with player, enemies, portals, villages, and structures
   * Throttled for performance
   */
  updateMinimap(enemies = [], portals = null, villages = null, structures = null) {
    const nowMs = performance.now();
    if ((nowMs - this.#lastMinimapT) < this.#MINIMAP_UPDATE_MS) return;
    
    this.#lastMinimapT = nowMs;
    try {
      this.#ui?.updateMinimap?.(this.#player, enemies, portals, villages, structures);
    } catch (err) {
      console.error('[UIController] Minimap update failed:', err);
    }
  }

  /**
   * Update hero overhead bars (HP/MP) and billboard to camera
   */
  updateHeroBars() {
    if (!this.#heroBars || !this.#player) return;
    
    try {
      const hpRatio = this.#clamp01(this.#player.hp / this.#player.maxHP);
      const mpRatio = this.#clamp01(this.#player.mp / this.#player.maxMP);
      
      this.#heroBars.hpFill.scale.x = Math.max(0.001, hpRatio);
      this.#heroBars.mpFill.scale.x = Math.max(0.001, mpRatio);
      this.#heroBars.container.lookAt(this.#camera.position);
    } catch (err) {
      console.error('[UIController] Hero bars update failed:', err);
    }
  }

  /**
   * Display a center message
   */
  setCenterMsg(msg) {
    try {
      this.#ui?.setCenterMsg?.(msg);
    } catch (err) {
      console.error('[UIController] Set center msg failed:', err);
    }
  }

  /**
   * Clear the center message
   */
  clearCenterMsg() {
    try {
      this.#ui?.clearCenterMsg?.();
    } catch (err) {
      console.error('[UIController] Clear center msg failed:', err);
    }
  }

  /**
   * Force immediate HUD update (bypass throttle)
   */
  forceHUDUpdate() {
    this.#lastHudT = 0;
    this.updateHUD();
  }

  /**
   * Force immediate minimap update (bypass throttle)
   */
  forceMinimapUpdate(enemies, portals, villages, structures) {
    this.#lastMinimapT = 0;
    this.updateMinimap(enemies, portals, villages, structures);
  }

  /**
   * Update all UI components (convenience method)
   */
  updateAll(enemies = [], portals = null, villages = null, structures = null) {
    this.updateHUD();
    this.updateMinimap(enemies, portals, villages, structures);
    this.updateHeroBars();
  }

  /**
   * Configure throttle intervals (for runtime tuning)
   */
  setThrottleIntervals({ hud, minimap }) {
    if (typeof hud === 'number') this.#HUD_UPDATE_MS = Math.max(0, hud);
    if (typeof minimap === 'number') this.#MINIMAP_UPDATE_MS = Math.max(0, minimap);
    
    try {
      if (typeof window !== 'undefined') {
        window.__HUD_UPDATE_MS = this.#HUD_UPDATE_MS;
        window.__MINIMAP_UPDATE_MS = this.#MINIMAP_UPDATE_MS;
      }
    } catch (_) {}
  }

  /**
   * Get current throttle configuration
   */
  getThrottleIntervals() {
    return {
      hud: this.#HUD_UPDATE_MS,
      minimap: this.#MINIMAP_UPDATE_MS
    };
  }
}
