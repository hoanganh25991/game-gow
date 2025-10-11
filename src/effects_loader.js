import * as THREE from "../vendor/three/build/three.module.js";
import { THEME_COLORS } from "../config/index.js";
import { SKILL_FX } from "../config/skills_fx.js";
import { SKILLS_POOL } from "../config/skills_pool.js";

/**
 * Dynamic Effects Loader
 * 
 * Automatically loads effect implementations from the effects/ directory.
 * 
 * Each effect file should follow the SkillEffect interface pattern:
 * - Export a default factory function: (baseEffects, params) => EffectInstance
 * - Effect class must implement: update(dt, t), dispose(), and finished property
 * - See src/effects/effect_base_interface.js for details and examples
 * 
 * File naming convention: {skill_id}.js
 * 
 * Benefits:
 * - No need to modify registry when adding new effects
 * - Just drop a file into effects/ directory
 * - Automatic registration and lifecycle management
 * - Consistent interface for all effects
 * - Graceful fallback for missing effects
 */

export class EffectsLoader {
  constructor() {
    this.effectsRegistry = {};
    this.isLoaded = false;
  }

  /**
   * Get effect colors for a skill
   */
  getSkillColors(skillId) {
    const fx = SKILL_FX[skillId] || {};
    return {
      beam: fx.beam ?? THEME_COLORS.themeOrange,
      arc: fx.arc ?? THEME_COLORS.themeAccent,
      impact: fx.impact ?? THEME_COLORS.themeOrange,
      ring: fx.ring ?? THEME_COLORS.ember,
      hand: fx.hand ?? THEME_COLORS.ember,
      shake: fx.shake ?? 0.2
    };
  }

  /**
   * Default effect for skills without custom implementation
   */
  defaultSkillEffect(baseEffects, params) {
    const { from, to, center, radius } = params;
    const colors = this.getSkillColors(params.skillId);
    
    console.warn(`[EffectsLoader] No custom effect for skill "${params.skillId}", using default`);
    
    // Simple default: beam + impact
    if (from && to) {
      baseEffects.spawnBeam(from, to, colors.beam, 0.15);
      baseEffects.spawnImpact(to, 1.5, colors.impact);
    } else if (center) {
      baseEffects.spawnImpact(center, radius || 2, colors.impact);
      baseEffects.spawnRing(center, radius || 3, colors.ring, 0.4);
    }
  }

  /**
   * Load all effect implementations from the effects/ directory
   * This is called automatically on first use
   */
  async load() {
    if (this.isLoaded) return this.effectsRegistry;
    
    console.log('[EffectsLoader] Loading effect implementations...');
    
    // Get all skill IDs from the pool
    const skillIds = SKILLS_POOL.map(skill => skill.id);
    
    // Try to load each effect file
    for (const skillId of skillIds) {
      try {
        // Dynamic import of effect file
        const module = await import(`./effects/${skillId}.js`);
        
        if (module.default && typeof module.default === 'function') {
          this.effectsRegistry[skillId] = module.default;
          console.log(`[EffectsLoader] ✓ Loaded effect: ${skillId}`);
        } else {
          console.warn(`[EffectsLoader] ✗ Invalid effect export for: ${skillId}`);
        }
      } catch (error) {
        // Effect file doesn't exist - this is OK, will use default
        // Only log in development
        if (error.message.includes('Failed to fetch') || error.message.includes('Cannot find')) {
          // Silent - effect not implemented yet
        } else {
          console.error(`[EffectsLoader] Error loading effect "${skillId}":`, error);
        }
      }
    }
    
    const loadedCount = Object.keys(this.effectsRegistry).length;
    const totalCount = skillIds.length;
    console.log(`[EffectsLoader] Loaded ${loadedCount}/${totalCount} custom effects`);
    
    // Warn about missing effect files
    const missing = skillIds.filter(id => !this.effectsRegistry[id]);
    if (missing.length) {
      console.warn('[EffectsLoader] Missing effect implementations for:', missing.join(', '));
    }

    this.isLoaded = true;
    return this.effectsRegistry;
  }

  /**
   * Execute a skill effect by ID
   * Automatically loads effects on first call
   * 
   * @param {string} skillId - The skill identifier
   * @param {BaseEffects} baseEffects - The base effects manager
   * @param {object} params - Effect parameters
   */
  async execute(skillId, baseEffects, params) {
    // Load effects on first use
    if (!this.isLoaded) {
      await this.load();
    }
    
    if (!skillId) {
      console.warn('[EffectsLoader] No skillId provided');
      return;
    }
    
    const effectFn = this.effectsRegistry[skillId];
    
    if (effectFn) {
      try {
        effectFn(baseEffects, { ...params, skillId });
      } catch (error) {
        console.error(`[EffectsLoader] Error executing effect for "${skillId}":`, error);
        this.defaultSkillEffect(baseEffects, { ...params, skillId });
      }
    } else {
      this.defaultSkillEffect(baseEffects, { ...params, skillId });
    }
  }

  /**
   * Check if a skill has a custom effect registered
   */
  has(skillId) {
    return !!this.effectsRegistry[skillId];
  }

  /**
   * Manually register a skill effect at runtime
   * Useful for plugins or dynamic effects
   */
  register(skillId, effectFn) {
    if (typeof effectFn !== 'function') {
      console.error(`[EffectsLoader] Effect for "${skillId}" must be a function`);
      return false;
    }
    this.effectsRegistry[skillId] = effectFn;
    console.log(`[EffectsLoader] Registered custom effect: ${skillId}`);
    return true;
  }

  /**
   * Get all registered skill effect IDs
   */
  getRegistered() {
    return Object.keys(this.effectsRegistry);
  }

  /**
   * Force reload all effects (useful for development)
   */
  async reload() {
    this.isLoaded = false;
    Object.keys(this.effectsRegistry).forEach(key => delete this.effectsRegistry[key]);
    await this.load();
  }

  /**
   * Preload all effects (call during game initialization)
   */
  async preload() {
    return await this.load();
  }

  /**
   * Clear all registered effects
   */
  clear() {
    this.isLoaded = false;
    this.effectsRegistry = {};
  }
}

// ---- Singleton instance and legacy API ----

// Default singleton instance for backward compatibility
let defaultInstance = null;

/**
 * Get or create the default singleton instance
 */
function getDefaultInstance() {
  if (!defaultInstance) {
    defaultInstance = new EffectsLoader();
  }
  return defaultInstance;
}

/**
 * Execute a skill effect by ID
 * Automatically loads effects on first call
 * 
 * @param {string} skillId - The skill identifier
 * @param {BaseEffects} baseEffects - The base effects manager
 * @param {object} params - Effect parameters
 */
export async function executeSkillEffect(skillId, baseEffects, params) {
  return await getDefaultInstance().execute(skillId, baseEffects, params);
}

/**
 * Check if a skill has a custom effect registered
 */
export function hasSkillEffect(skillId) {
  return getDefaultInstance().has(skillId);
}

/**
 * Manually register a skill effect at runtime
 * Useful for plugins or dynamic effects
 */
export function registerSkillEffect(skillId, effectFn) {
  return getDefaultInstance().register(skillId, effectFn);
}

/**
 * Get all registered skill effect IDs
 */
export function getRegisteredSkillEffects() {
  return getDefaultInstance().getRegistered();
}

/**
 * Force reload all effects (useful for development)
 */
export async function reloadEffects() {
  return await getDefaultInstance().reload();
}

/**
 * Preload all effects (call during game initialization)
 */
export async function preloadEffects() {
  return await getDefaultInstance().preload();
}

/**
 * Get the default singleton instance
 * Useful for direct access to the loader
 */
export function getEffectsLoader() {
  return getDefaultInstance();
}

/**
 * Create a new independent effects loader instance
 * Useful for testing or isolated effect systems
 */
export function createEffectsLoader() {
  return new EffectsLoader();
}
