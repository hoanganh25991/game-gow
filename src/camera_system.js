/**
 * Camera System
 * Encapsulates first-person camera and hand VFX/animation updates.
 *
 * Public API:
 *   import { CameraSystem } from './camera_system.js';
 *   const cameraSystem = new CameraSystem({ THREE, now, effects });
 *   cameraSystem.updateFirstPerson(camera, player, lastMoveDir, dt);
 *
 * Notes:
 * - Uses internal reusable temp vectors to avoid per-frame allocations.
 * - Mirrors behavior from the former inline main.js block to preserve feel.
 */
export class CameraSystem {
  // Private fields for dependencies
  #THREE;
  #now;
  #effects;
  
  // Private fields for reusable temp vectors
  #tempA;
  #tempB;
  #tempC;

  constructor({ THREE, now, effects }) {
    this.#THREE = THREE;
    this.#now = now;
    this.#effects = effects;
    
    // Initialize reusable temps to avoid per-frame allocations
    this.#tempA = new THREE.Vector3();
    this.#tempB = new THREE.Vector3();
    this.#tempC = new THREE.Vector3();
  }

  /**
   * Update first-person camera position and look target
   * @param {THREE.Camera} camera - The camera to update
   * @param {Object} player - Player object with mesh and state
   * @param {THREE.Vector3} lastMoveDir - Last movement direction vector
   * @param {number} dt - Delta time in seconds
   */
  updateFirstPerson(camera, player, lastMoveDir, dt) {
    if (!player) return;

    // Get hand world positions
    const ud = player.mesh?.userData || {};
    const left = this.#tempA.set(0, 0, 0);
    const right = this.#tempB.set(0, 0, 0);
    
    if (ud.leftHandAnchor && ud.handAnchor) {
      try { ud.leftHandAnchor.getWorldPosition(left); } catch (_) {}
      try { ud.handAnchor.getWorldPosition(right); } catch (_) {}
    } else {
      const p = player.pos();
      // Same offsets as before
      left.set(p.x - 0.4, p.y + 1.15, p.z + 0.25);
      right.set(p.x + 0.4, p.y + 1.15, p.z + 0.25);
    }

    // Midpoint between hands, and forward vector from player orientation
    const mid = this.#tempC.copy(left).add(right).multiplyScalar(0.5);
    const forward = this.#tempA.set(0, 0, 1).applyQuaternion(player.mesh.quaternion).normalize();

    // FP hand VFX and gestures (two hands, fire-in-hand, move/attack animations)
    this.#updateHandEffects(player, lastMoveDir);

    // Camera placement relative to hands and forward vector
    this.#updateCameraPosition(camera, mid, forward, dt);
  }

  /**
   * Update hand visual effects and animations
   * @private
   */
  #updateHandEffects(player, lastMoveDir) {
    try {
      const ud2 = player.mesh?.userData || {};
      const speed = lastMoveDir ? lastMoveDir.length() : 0;
      const tnow = this.#now();

      // Movement/idle crackle scheduling around hands
      if (!ud2.nextCrackleT || tnow >= ud2.nextCrackleT) {
        const strength = 0.6 + speed * 2.0;
        this.#effects?.spawnHandCrackle?.(player, false, strength);
        this.#effects?.spawnHandCrackle?.(player, true, strength * 0.8);
        ud2.nextCrackleT = tnow + (speed > 0.1 ? 0.18 + Math.random() * 0.2 : 0.55 + Math.random() * 0.35);
      }

      // Boost orb/light intensity based on movement and a small flicker
      const flick = Math.sin(tnow * 10) * 0.2;
      if (ud2.fireOrb?.material) {
        ud2.fireOrb.material.emissiveIntensity = 2.1 + speed * 0.6 + flick;
      }
      if (ud2.leftFireOrb?.material) {
        ud2.leftFireOrb.material.emissiveIntensity = 1.9 + speed * 0.5 + flick * 0.8;
      }
      if (ud2.handLight) ud2.handLight.intensity = 1.2 + speed * 0.8;
      if (ud2.leftHandLight) ud2.leftHandLight.intensity = 1.0 + speed * 0.7;

      // Randomized gesture wobble while moving or idle, plus brace lift when attacking
      this.#updateArmGestures(ud2, speed, tnow, player.braceUntil);
    } catch (_) {}
  }

  /**
   * Update arm gestures and animations
   * @private
   */
  #updateArmGestures(ud2, speed, tnow, braceUntil) {
    const rArm = ud2.rightArm;
    const lArm = ud2.leftArm;
    if (!rArm || !lArm) return;

    const moveAmp = 0.12 * Math.min(1, speed * 3);
    const idleAmp = 0.06;
    const phase = tnow * 6 + Math.random() * 0.05; // slight desync
    const amp = (speed > 0.02 ? moveAmp : idleAmp);
    const braceN = braceUntil && tnow < braceUntil ? Math.max(0, (braceUntil - tnow) / 0.18) : 0;

    // Base pose + sinusoidal bob + brace squash
    rArm.rotation.x = -Math.PI * 0.12 + Math.sin(phase) * amp - braceN * 0.15;
    lArm.rotation.x =  Math.PI * 0.12 + Math.cos(phase) * amp - braceN * 0.12;

    // Subtle sway and random micro-gestures
    rArm.rotation.y = 0.02 + Math.sin(phase * 0.5) * amp * 0.5 + (Math.random() - 0.5) * 0.01;
    lArm.rotation.y = -0.02 + Math.cos(phase * 0.5) * amp * 0.5 + (Math.random() - 0.5) * 0.01;

    // Occasional quick gesture twitch
    if (!ud2.nextGestureT || tnow >= ud2.nextGestureT) {
      rArm.rotation.z += (Math.random() - 0.5) * 0.08;
      lArm.rotation.z += (Math.random() - 0.5) * 0.08;
      ud2.nextGestureT = tnow + 0.35 + Math.random() * 0.5;
    }
  }

  /**
   * Update camera position and look target
   * @private
   */
  #updateCameraPosition(camera, mid, forward, dt) {
    const fpBack = 4.5;     // match pre-refactor feel (further behind the hands)
    const fpUp = 2.0;       // minimal vertical raise of camera to avoid occlusion
    const fpLookAhead = 3.0; // look further ahead so enemies occupy the center
    const fpLookUp = 1.1;    // tilt camera upward more so hands/model sit lower in the frame

    // Desired camera position and look target
    const desiredPos = this.#tempB.copy(mid).addScaledVector(forward, -fpBack);
    desiredPos.y += fpUp;
    camera.position.lerp(desiredPos, 1 - Math.pow(0.001, dt));

    const lookTarget = this.#tempB.copy(mid).addScaledVector(forward, fpLookAhead);
    lookTarget.y += fpLookUp;
    camera.lookAt(lookTarget);
  }
}

// Backward compatibility: export factory function
export function createCameraSystem(deps) {
  return new CameraSystem(deps);
}
