/**
 * Base Interface for Skill Effects
 * 
 * All skill effects should follow this pattern for consistency and maintainability.
 * 
 * @interface SkillEffect
 * @property {boolean} finished - Flag indicating the effect has completed and should be removed
 * @method update - Called every frame by the EffectsManager to animate the effect
 * @method dispose - Called when the effect is removed to cleanup resources
 * 
 * @example
 * class MySkillEffect {
 *   constructor(baseEffects, params) {
 *     this.baseEffects = baseEffects;
 *     this.startTime = now();
 *     this.duration = 2.0;
 *     this.finished = false;
 *     
 *     // Create visuals here
 *     this._createVisuals();
 *   }
 * 
 *   update(dt, t) {
 *     // Animate visuals based on elapsed time
 *     const elapsed = t - this.startTime;
 *     const progress = Math.min(1, elapsed / this.duration);
 *     
 *     // Update animations...
 *     
 *     if (progress >= 1) {
 *       this.finished = true;
 *       this.dispose();
 *     }
 *   }
 * 
 *   dispose() {
 *     // Cleanup resources (geometries, materials, scene objects)
 *   }
 * }
 * 
 * export default function mySkillEffect(baseEffects, params) {
 *   const instance = new MySkillEffect(baseEffects, params);
 *   if (baseEffects?.addSkillEffect) {
 *     baseEffects.addSkillEffect(instance);
 *   }
 *   return instance;
 * }
 */

/**
 * Required properties and methods for skill effects
 */
export const SkillEffectInterface = {
  /**
   * @property {boolean} finished - Set to true when effect is complete
   */
  finished: false,

  /**
   * Update the effect animation
   * @param {number} dt - Delta time in seconds since last frame
   * @param {number} t - Current timestamp in seconds
   */
  update(dt, t) {
    throw new Error('SkillEffect must implement update(dt, t)');
  },

  /**
   * Cleanup all resources (geometries, materials, scene objects)
   */
  dispose() {
    throw new Error('SkillEffect must implement dispose()');
  }
};

/**
 * Helper to create a skill effect following the interface pattern
 * @param {class} EffectClass - The effect class constructor
 * @returns {Function} Effect factory function
 */
export function createSkillEffect(EffectClass) {
  return function(baseEffects, params) {
    const instance = new EffectClass(baseEffects, params);
    
    // Validate interface
    if (typeof instance.update !== 'function') {
      console.error(`Effect ${EffectClass.name} missing update() method`);
    }
    if (typeof instance.dispose !== 'function') {
      console.error(`Effect ${EffectClass.name} missing dispose() method`);
    }
    if (!('finished' in instance)) {
      console.warn(`Effect ${EffectClass.name} missing finished property`);
      instance.finished = false;
    }
    
    // Register with effects manager
    if (baseEffects && typeof baseEffects.addSkillEffect === 'function') {
      baseEffects.addSkillEffect(instance);
    }
    
    return instance;
  };
}
