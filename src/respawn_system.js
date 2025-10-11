/**
 * Respawn System
 * Handles player death timer and respawn at village with invulnerability window.
 *
 * Public API:
 *   import { createRespawnSystem } from './respawn_system.js';
 *   const respawnSystem = createRespawnSystem({ THREE, now, VILLAGE_POS, setCenterMsg, clearCenterMsg, player });
 *   respawnSystem.update(); // call per frame (cheap)
 */
export function createRespawnSystem({ THREE, now, VILLAGE_POS, setCenterMsg, clearCenterMsg, player }) {
  function update() {
    const t = now();
    if (!player) return;
    if (!player.alive && player.deadUntil && t >= player.deadUntil) {
      // Respawn at village
      player.alive = true;
      if (player.mesh) player.mesh.visible = true;
      try { player.mesh.position.copy(VILLAGE_POS).add(new THREE.Vector3(1.5, 0, 0)); } catch (_) {}
      player.hp = player.maxHP;
      player.mp = player.maxMP;
      player.moveTarget = null;
      player.target = null;
      player.invulnUntil = now() + 2;
      try { clearCenterMsg && clearCenterMsg(); } catch (_) {}
    }
  }

  return { update };
}
