/**
 * Player System
 * Handles player movement, facing, regeneration, and stop helper.
 * Extracted from main.js to keep orchestration light.
 *
 * Public API:
 *   import { PlayerSystem } from './player_system.js';
 *   const playerSystem = new PlayerSystem({ THREE, now, dir2D, distance2D, WORLD, renderer });
 *   playerSystem.stopPlayer(player, aimPreview, attackPreview);
 *   playerSystem.updatePlayer(dt, { player, lastMoveDir });
 */
export class PlayerSystem {
  // Private fields for dependencies
  #THREE;
  #now;
  #dir2D;
  #distance2D;
  #WORLD;
  #renderer;

  constructor({ THREE, now, dir2D, distance2D, WORLD, renderer }) {
    this.#THREE = THREE;
    this.#now = now;
    this.#dir2D = dir2D;
    this.#distance2D = distance2D;
    this.#WORLD = WORLD;
    this.#renderer = renderer;
  }

  /**
   * Stop player: cancel orders and clear any aim previews/cursor state
   * @param {Object} player - Player object
   * @param {Object} aimPreview - Aim preview object (optional)
   * @param {Object} attackPreview - Attack preview object (optional)
   */
  stopPlayer(player, aimPreview, attackPreview) {
    if (!player) return;
    
    // cancel movement/attack orders
    player.moveTarget = null;
    player.attackMove = false;
    player.target = null;

    // ensure no aim-related UI or state (aiming removed)
    player.aimMode = false;
    player.aimModeSkill = null;
    
    try {
      if (aimPreview) aimPreview.visible = false;
      if (attackPreview) attackPreview.visible = false;
      this.#renderer?.domElement && (this.#renderer.domElement.style.cursor = "default");
    } catch (_) {}

    // brief hold to prevent instant re-acquire
    player.holdUntil = this.#now() + 0.4;
  }

  /**
   * Update player physics and facing each frame
   * @param {number} dt - Delta time in seconds
   * @param {Object} ctx - Context object with { player, lastMoveDir }
   */
  updatePlayer(dt, ctx) {
    const { player, lastMoveDir } = ctx;
    if (!player) return;

    // Regeneration
    this.#updateRegeneration(player, dt);

    // Handle dead state
    if (!player.alive) {
      player.mesh.position.y = 1.1;
      return;
    }

    // Handle frozen state
    if (player.frozen) {
      player.mesh.position.y = 1.1;
      return;
    }

    // Process movement
    const moveDir = this.#calculateMovementDirection(player);
    
    if (moveDir) {
      this.#processMovement(player, moveDir, lastMoveDir, dt);
    } else {
      this.#processStationaryBehavior(player, lastMoveDir, dt);
    }

    // Keep y at ground
    player.mesh.position.y = 1.1;

    // Update visual effects
    this.#updateVisualEffects(player);
  }

  /**
   * Update player HP and MP regeneration
   * @private
   */
  #updateRegeneration(player, dt) {
    player.hp = Math.min(player.maxHP, player.hp + player.hpRegen * dt);
    player.mp = Math.min(player.maxMP, player.mp + player.mpRegen * dt);
    player.idlePhase += dt;
  }

  /**
   * Calculate movement direction based on player target and moveTarget
   * @private
   * @returns {Object|null} Movement direction vector or null
   */
  #calculateMovementDirection(player) {
    const WORLD = this.#WORLD;
    
    if (player.target && player.target.alive) {
      const d = this.#distance2D(player.pos(), player.target.pos());
      
      // Do NOT auto-move or auto-basic-attack when a target is set.
      // If the player explicitly used attack-move then allow moving toward the target.
      if (player.attackMove && d > (WORLD.attackRange * (WORLD.attackRangeMult || 1)) * 0.95) {
        return this.#dir2D(player.pos(), player.target.pos());
      } else {
        // Only auto-face the target when nearby (no auto-attack).
        if (d <= (WORLD.attackRange * (WORLD.attackRangeMult || 1)) * 1.5) {
          this.#faceTarget(player, player.target);
        }
        return null;
      }
    } else if (player.moveTarget) {
      const d = this.#distance2D(player.pos(), player.moveTarget);
      if (d > 0.6) {
        return this.#dir2D(player.pos(), player.moveTarget);
      } else {
        player.moveTarget = null;
        return null;
      }
    }
    
    return null;
  }

  /**
   * Face player towards target
   * @private
   */
  #faceTarget(player, target) {
    const v = this.#dir2D(player.pos(), target.pos());
    const targetYaw = Math.atan2(v.x, v.z);
    const q = new this.#THREE.Quaternion().setFromEuler(new this.#THREE.Euler(0, targetYaw, 0));
    player.mesh.quaternion.slerp(q, Math.min(1, player.turnSpeed * 1.5 * 0.016)); // Approximate dt
    player.lastFacingYaw = targetYaw;
    player.lastFacingUntil = this.#now() + 0.6;
  }

  /**
   * Process player movement
   * @private
   */
  #processMovement(player, moveDir, lastMoveDir, dt) {
    const spMul = (player.speedBoostUntil && this.#now() < player.speedBoostUntil && player.speedBoostMul) 
      ? player.speedBoostMul 
      : 1;
    const effSpeed = player.speed * spMul;
    
    player.mesh.position.x += moveDir.x * effSpeed * dt;
    player.mesh.position.z += moveDir.z * effSpeed * dt;

    // Rotate towards movement direction smoothly
    const targetYaw = Math.atan2(moveDir.x, moveDir.z);
    const euler = new this.#THREE.Euler(0, targetYaw, 0);
    const q = new this.#THREE.Quaternion().setFromEuler(euler);
    player.mesh.quaternion.slerp(q, Math.min(1, player.turnSpeed * dt));

    // record move direction for camera look-ahead
    lastMoveDir.set(moveDir.x, 0, moveDir.z);
  }

  /**
   * Process player behavior when stationary
   * @private
   */
  #processStationaryBehavior(player, lastMoveDir, dt) {
    // stationary: face current target if any, or keep last facing for a short while
    if (player.target && player.target.alive) {
      const v = this.#dir2D(player.pos(), player.target.pos());
      const targetYaw = Math.atan2(v.x, v.z);
      const q = new this.#THREE.Quaternion().setFromEuler(new this.#THREE.Euler(0, targetYaw, 0));
      player.mesh.quaternion.slerp(q, Math.min(1, player.turnSpeed * 1.5 * dt));
      player.lastFacingYaw = targetYaw;
      player.lastFacingUntil = this.#now() + 0.6;
    } else if (player.lastFacingUntil && this.#now() < player.lastFacingUntil) {
      const q = new this.#THREE.Quaternion().setFromEuler(new this.#THREE.Euler(0, player.lastFacingYaw || 0, 0));
      player.mesh.quaternion.slerp(q, Math.min(1, player.turnSpeed * 0.8 * dt));
    }
    
    // decay look-ahead
    lastMoveDir.multiplyScalar(Math.max(0, 1 - dt * 3));
  }

  /**
   * Update visual effects for idle glow and brace animation
   * @private
   */
  #updateVisualEffects(player) {
    const ud = player.mesh.userData || {};
    const tnow = this.#now();
    
    // Idle glow pulse
    if (ud.handLight) {
      ud.handLight.intensity = 1.2 + Math.sin((player.idlePhase || 0) * 2.2) * 0.22;
    }
    
    if (ud.fireOrb && ud.fireOrb.material) {
      ud.fireOrb.material.emissiveIntensity = 2.2 + Math.sin((player.idlePhase || 0) * 2.2) * 0.35;
    }
    
    // Brief brace squash animation
    if (player.braceUntil && tnow < player.braceUntil) {
      const n = Math.max(0, (player.braceUntil - tnow) / 0.18);
      player.mesh.scale.set(1, 0.94 + 0.06 * n, 1);
    } else {
      player.mesh.scale.set(1, 1, 1);
    }
  }
}

// Backward compatibility: export factory function
export function createPlayerSystem(deps) {
  return new PlayerSystem(deps);
}
