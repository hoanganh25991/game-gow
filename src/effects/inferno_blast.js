import * as THREE from "../../vendor/three/build/three.module.js";
import { SKILL_FX } from "../../config/skills_fx.js";
import { createSkillEffect } from "./effect_base_interface.js";

/**
 * Inferno Blast Effect
 * 
 * BEHAVIOR: Instant AoE explosion centered on caster
 * - Play hand effects on caster
 * - Expanding ring from caster position
 * - Impact flash on each enemy hit
 * - Apply damage and slow to all enemies in radius
 * - Camera shake effect
 * - Ignores line of sight
 * 
 * Follows SkillEffect interface:
 * - update(dt, t): No ongoing animation (instant effect)
 * - dispose(): Cleans up any resources
 * - finished: Set to true immediately after cast
 */
class InfernoBlastEffect {
  constructor(baseEffects, params) {
    this.baseEffects = baseEffects;
    this.params = params || {};
    this.finished = true; // Instant effect, mark as finished immediately

    const { player, center, radius = 8, targets = [], slowFactor = 0.5, slowDuration = 2 } = this.params;
    
    // Get skill colors
    const fx = SKILL_FX.inferno_blast || {};
    this.colors = {
      core: fx.colors?.core || 0xffaa00,
      ring: fx.colors?.ring || 0xff4500,
      impact: fx.colors?.impact || 0xff6347,
      hand: fx.colors?.hand || 0xffa500
    };

    // Damage
    this.damage = this.params?.dmg ?? this.params?.damage ?? 25;

    // Execute the blast effects
    if (center) {
      this._executeBlast(player, center, radius, targets, slowFactor, slowDuration);
    }
  }

  /**
   * Execute the instant blast effects
   */
  _executeBlast(player, center, radius, targets, slowFactor, slowDuration) {
    try {
      // 1. Play hand effect on caster
      if (player && this.baseEffects.spawnHandFlash) {
        this.baseEffects.spawnHandFlash(player);
      }

      // 2. Expanding ring from caster
      if (this.baseEffects.spawnRing) {
        this.baseEffects.spawnRing(
          center,
          radius,
          this.colors.ring,
          0.6, // duration
          1.2, // scale factor
          0.8  // opacity
        );
      }

      // 3. Central flash explosion
      if (this.baseEffects.spawnSphere) {
        this.baseEffects.spawnSphere(
          center,
          radius * 0.5,
          this.colors.core,
          0.3, // duration
          1.0  // opacity
        );
      }

      // 4. Impact flash and damage on each enemy hit
      if (Array.isArray(targets) && targets.length > 0) {
        for (const target of targets) {
          this._hitTarget(target, slowFactor, slowDuration);
        }
      }

      // 5. Camera shake
      if (this.baseEffects.requestShake) {
        const shakeIntensity = this.params?.shake ?? 0.4;
        this.baseEffects.requestShake(shakeIntensity);
      }

      // Additional visual flourishes
      this._addVisualFlourishes(center, radius);

    } catch (err) {
      console.warn('[inferno_blast] execution failed', err);
    }
  }

  /**
   * Hit a single target with damage, slow, and impact effect
   */
  _hitTarget(target, slowFactor, slowDuration) {
    try {
      // Get target position
      let targetPos;
      if (typeof target.pos === 'function') {
        targetPos = target.pos();
      } else if (target.position) {
        targetPos = target.position;
      }

      // Play impact effect at target location
      if (targetPos && this.baseEffects.spawnImpact) {
        this.baseEffects.spawnImpact(
          targetPos,
          1.5,
          this.colors.impact,
          0.4
        );
      }

      // Apply damage
      if (typeof target.takeDamage === 'function') {
        target.takeDamage(this.damage);
      }

      // Show damage popup
      if (targetPos && this.baseEffects.spawnDamagePopup) {
        this.baseEffects.spawnDamagePopup(targetPos, this.damage, "#ffb3b3");
      }

      // Apply slow effect (if target supports it)
      if (typeof target.applySlow === 'function') {
        target.applySlow(slowFactor, slowDuration);
      }

    } catch (err) {
      console.warn('[inferno_blast] hit target failed', err);
    }
  }

  /**
   * Add additional visual flourishes to the blast
   */
  _addVisualFlourishes(center, radius) {
    try {
      const quality = this.baseEffects?.quality || "high";
      const emberCount = quality === "low" ? 8 : quality === "medium" ? 16 : 24;

      // Ember particles radiating outward
      for (let i = 0; i < emberCount; i++) {
        const angle = (i / emberCount) * Math.PI * 2;
        const distance = radius * (0.3 + Math.random() * 0.4);
        
        const emberPos = new THREE.Vector3(
          center.x + Math.cos(angle) * distance,
          center.y + 0.5 + Math.random() * 1.0,
          center.z + Math.sin(angle) * distance
        );

        if (this.baseEffects.spawnSphere) {
          this.baseEffects.spawnSphere(
            emberPos,
            0.15 + Math.random() * 0.15,
            Math.random() > 0.5 ? this.colors.core : this.colors.impact,
            0.5 + Math.random() * 0.3,
            0.9
          );
        }
      }

      // Secondary pulse ring
      setTimeout(() => {
        if (this.baseEffects.spawnRing) {
          this.baseEffects.spawnRing(
            center,
            radius * 0.7,
            this.colors.ring,
            0.4,
            1.1,
            0.6
          );
        }
      }, 100);

    } catch (err) {
      console.warn('[inferno_blast] visual flourishes failed', err);
    }
  }

  /**
   * Update method (required by SkillEffect interface)
   * No ongoing animation needed for this instant effect
   */
  update(dt, t) {
    // Instant effect - nothing to update
  }

  /**
   * Cleanup resources (required by SkillEffect interface)
   */
  dispose() {
    // No persistent resources to clean up for this instant effect
  }
}

// Export using the createSkillEffect helper
export default createSkillEffect(InfernoBlastEffect);
