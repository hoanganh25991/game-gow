import * as THREE from "../vendor/three/build/three.module.js";
import { THEME_COLORS, FX } from "../config/index.js";
import { now, parseThreeColor } from "./utils.js";
import { handWorldPos, leftHandWorldPos } from "./entities.js";
import { BaseEffects, normalizeColor, createGroundRing } from "./effects_base.js";
import { executeSkillEffect, hasSkillEffect, preloadEffects } from "./effects_loader.js";

// Re-export for backward compatibility
export { createGroundRing, normalizeColor };

/**
 * Unified Effects Manager
 * 
 * Combines base effects primitives with skill-specific effects registry.
 * Maintains backward compatibility with existing code while providing
 * a cleaner, more modular architecture.
 * 
 * Architecture:
 * - Base effects: Generic primitives (beam, arc, impact, ring, etc.)
 * - Skill effects: Registered effects per skill ID
 */
export class EffectsManager extends BaseEffects {
  constructor(scene, opts = {}) {
    const quality = (opts && opts.quality) ||
      (typeof localStorage !== "undefined"
        ? (JSON.parse(localStorage.getItem("gof.renderPrefs") || "{}").quality || "high")
        : "high");
    
    super(scene, quality);

    // Active, long-lived skill effect instances (class-based effects)
    this.activeSkillEffects = [];
  }

  // ===== SKILL EFFECT EXECUTION =====
  
  /**
   * Execute a skill effect by ID using the registry
   * This is the primary method for triggering skill visuals
   */
  executeSkillEffect(skillId, params) {
    executeSkillEffect(skillId, this, params);
  }

  /**
   * Register an active skill effect instance so the manager can update/cleanup it
   */
  addSkillEffect(effectInstance) {
    if (!effectInstance) return null;
    try {
      this.activeSkillEffects.push(effectInstance);
      effectInstance.__registeredByEffectsManager = true;
    } catch (_) {}
    return effectInstance;
  }

  removeSkillEffect(effectInstance) {
    if (!effectInstance) return false;
    const idx = this.activeSkillEffects.indexOf(effectInstance);
    if (idx >= 0) this.activeSkillEffects.splice(idx, 1);
    try { if (typeof effectInstance.dispose === 'function') effectInstance.dispose(); } catch (_) {}
    return true;
  }

  // ===== END: skill effect lifecycle helpers =====

  /**
   * Update override to update active skill effect instances in addition to base queue
   */
  update(t, dt) {
    // First, perform the normal base effects update
    try { super.update(t, dt); } catch (e) { console.warn('[EffectsManager] base update failed', e); }

    // Update active skill effect instances
    for (let i = this.activeSkillEffects.length - 1; i >= 0; i--) {
      const ef = this.activeSkillEffects[i];
      try {
        if (ef && typeof ef.update === 'function') {
          // allow both signatures: update(dt, t) or update(t, dt)
          try { ef.update(dt, t); } catch (_) { try { ef.update(t, dt); } catch (_) {} }
        }
        // Remove finished effects if they set a finished flag
        if (ef && (ef.finished === true || ef._shouldRemove === true)) {
          try { if (typeof ef.dispose === 'function') ef.dispose(); } catch (_) {}
          this.activeSkillEffects.splice(i, 1);
        }
      } catch (err) {
        console.warn('[EffectsManager] error updating skill effect', err);
      }
    }
  }

  /**
   * Check if a skill has a registered effect
   */
  hasSkillEffect(skillId) {
    return hasSkillEffect(skillId);
  }
}

// Re-export preload helper
export { preloadEffects };