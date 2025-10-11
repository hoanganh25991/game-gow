import * as THREE from "../../vendor/three/build/three.module.js";
import { SKILL_FX } from "../../config/skills_fx.js";
import { now } from "../utils.js";
import { createSkillEffect } from "./effect_base_interface.js";

/**
 * Flame Chain Effect
 *
 * Self-contained chain lightning-style fire spell that:
 * - Chains between enemies intelligently (prefers aimed targets)
 * - Creates visual chain links with fire effects
 * - Applies damage and slow to each hit
 * - Handles miss case (fires forward if no targets)
 * - Manages complete lifecycle independently
 *
 * Follows SkillEffect interface:
 * - update(dt, t): Manages chain animation timing
 * - dispose(): Cleans up resources
 * - finished: Set to true after chain completes
 */
class FlameChainEffect {
  constructor(baseEffects, params) {
    this.baseEffects = baseEffects;
    this.params = params || {};
    this.finished = false;

    // Get skill colors
    const fx = SKILL_FX.flame_chain || {};
    this.colors = {
      core: fx.colors?.core || 0xffd700,
      chain: fx.colors?.chain || 0xff4500,
      impact: fx.colors?.impact || 0xff6347,
      beam: fx.colors?.beam || 0xff8c00,
      arc: fx.colors?.arc || 0xffa500,
    };

    // Chain parameters
    this.damage = this.params?.dmg || 15;
    this.jumps = (this.params?.jumps || 0) + 1; // +1 for initial hit
    this.jumpRange = this.params?.jumpRange || 18;
    this.slowFactor = this.params?.slowFactor;
    this.slowDuration = this.params?.slowDuration || 1.2;

    // Track chain segments for cleanup
    this.chainSegments = [];
    this.startTime = now();
    this.duration = 1.2; // Keep effect alive for visuals

    // Execute the chain
    this._executeChain();
  }

  /**
   * Calculate distance between two positions (2D)
   */
  _distance2D(a, b) {
    const dx = a.x - b.x;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  /**
   * Execute the complete chain sequence
   */
  _executeChain() {
    const center = this.params?.center || this.params?.point;
    const targets = this.params?.targets || [];
    const effRange = this.params?.range || 30;

    // Filter alive enemies in range
    let candidates = targets.filter((en) => {
      if (!en || !en.alive) return false;
      if (typeof en.pos !== "function") return false;
      try {
        const dist = this._distance2D(center, en.pos());
        return dist <= effRange;
      } catch (_) {
        return false;
      }
    });

    // Handle miss case: no targets in range
    if (candidates.length === 0) {
      this._handleMiss(center, effRange);
      return;
    }

    // Select initial target (prefer aimed target, or closest)
    let current = this._selectInitialTarget(candidates, center);
    if (!current) {
      this._handleMiss(center, effRange);
      return;
    }

    // Execute chain jumps
    let lastPoint = center.clone().add(new THREE.Vector3(0, 1.6, 0));
    let jumpsRemaining = this.jumps;
    let first = true;
    const hitTargets = new Set();

    while (current && jumpsRemaining > 0) {
      jumpsRemaining--;
      hitTargets.add(current);

      // Get hit point on target
      const hitPoint = current.pos().clone().add(new THREE.Vector3(0, 1.2, 0));

      // Visual chain link
      this._createChainLink(lastPoint, hitPoint, first);

      // Apply damage
      try {
        if (typeof current.takeDamage === "function") {
          current.takeDamage(this.damage);
        }

        // Apply slow effect
        if (this.slowFactor && typeof current.slowUntil !== "undefined") {
          current.slowUntil = now() + this.slowDuration;
          current.slowFactor = this.slowFactor;
        }

        // Damage popup
        if (typeof current.pos === "function") {
          this.baseEffects.spawnDamagePopup(
            current.pos(),
            this.damage,
            this.colors.impact
          );
        }
      } catch (err) {
        console.warn("[flame_chain] damage application failed", err);
      }

      // Hit effects at impact point
      this._createImpactEffects(current.pos());

      // Camera shake on first hit
      if (first && this.baseEffects.requestShake) {
        const shake = this.params?.shake || 0.2;
        this.baseEffects.requestShake(shake);
        first = false;
      }

      // Find next target in chain
      lastPoint = hitPoint;
      current = this._findNextTarget(current, candidates, hitTargets);
    }
  }

  /**
   * Select initial target (prefer aimed or closest)
   */
  _selectInitialTarget(candidates, center) {
    if (candidates.length === 0) return null;

    // If a preferred target was provided (e.g. aimed or explicit player.target), prefer it
    const pref = this.params?.preferredTarget;
    if (pref && pref.alive) {
      for (const c of candidates) {
        try {
          if (c === pref) return pref;
        } catch (_) {}
      }
    }

    // Otherwise sort by distance and return closest
    candidates.sort((a, b) => {
      try {
        const distA = this._distance2D(center, a.pos());
        const distB = this._distance2D(center, b.pos());
        return distA - distB;
      } catch (_) {
        return 0;
      }
    });

    return candidates[0];
  }

  /**
   * Find next target in chain
   */
  _findNextTarget(currentTarget, allCandidates, hitTargets) {
    if (!currentTarget || typeof currentTarget.pos !== "function") return null;

    const currentPos = currentTarget.pos();
    const jumpRange = this.jumpRange + 2.5;

    // Find candidates in jump range that haven't been hit
    const nextCandidates = allCandidates.filter((en) => {
      if (!en || !en.alive) return false;
      if (hitTargets.has(en)) return false;

      try {
        const dist = this._distance2D(currentPos, en.pos());
        return dist <= jumpRange;
      } catch (_) {
        return false;
      }
    });

    if (nextCandidates.length === 0) return null;

    // Sort by distance and return closest
    nextCandidates.sort((a, b) => {
      try {
        const distA = this._distance2D(currentPos, a.pos());
        const distB = this._distance2D(currentPos, b.pos());
        return distA - distB;
      } catch (_) {
        return 0;
      }
    });

    return nextCandidates[0];
  }

  /**
   * Handle miss case: fire forward beam
   */
  _handleMiss(center, range) {
    try {
      // Calculate forward direction (assume player is at center looking in default direction)
      const from = center.clone().add(new THREE.Vector3(0, 1.6, 0));
      const to = center.clone().add(new THREE.Vector3(0, 1.6, range));

      // Fire beam - auto-scale arc parameters
      const dir = to.clone().sub(from);
      const length = dir.length() || 1;
      const segments = Math.max(8, Math.min(18, Math.round(8 + length * 0.5)));
      const amplitude = Math.min(1.0, 0.25 + length * 0.02);
      const passes = 3; // Multiple passes for fire effect
      for (let i = 0; i < passes; i++) {
        this.baseEffects.spawnArc(from, to, this.colors.beam, 0.1, segments, amplitude);
      }

      // Impact at end
      const impactPoint = to.clone().setY(0);
      this.baseEffects.spawnStrike(impactPoint, 1.0, this.colors.impact);

      // Shake
      if (this.baseEffects.requestShake) {
        const shake = this.params?.shake || 0.15;
        this.baseEffects.requestShake(shake);
      }
    } catch (err) {
      console.warn("[flame_chain] miss handling failed", err);
    }
  }

  /**
   * Create visual chain link between two points
   */
  _createChainLink(start, end, isFirst) {
    try {
      // Draw multiple overlapping passes to make the chain visually stronger
      const passes = 3; // core + 2 outer passes
      const dir = new THREE.Vector3().subVectors(end, start);
      const dist = Math.max(0.001, dir.length());
      const normal = new THREE.Vector3(-dir.z, 0, dir.x).normalize();

      for (let p = 0; p < passes; p++) {
        // offset magnitude scales with pass index (outer passes offset more)
        const offMag = p === 0 ? 0 : 0.08 * p + Math.min(0.25, dist * 0.01);
        const jitter = normal
          .clone()
          .multiplyScalar((Math.random() - 0.5) * offMag);

        const s = start.clone().add(jitter);
        const e = end.clone().add(jitter);

        // Core pass is brighter and thicker
        if (p === 0) {
          try {
            // Auto-scale arc parameters for core pass
            const dir = e.clone().sub(s);
            const length = dir.length() || 1;
            const segments = Math.max(8, Math.min(18, Math.round(8 + length * 0.5)));
            const amplitude = Math.min(1.0, 0.25 + length * 0.02);
            const passes = 3;
            for (let i = 0; i < passes; i++) {
              this.baseEffects.spawnArc(s, e, this.colors.core || this.colors.beam, 0.16, segments, amplitude);
            }
          } catch (_) {}
          try {
            // Add noise arcs for visual complexity
            for (let i = 0; i < 3; i++) {
              this.baseEffects.spawnArc(s, e, this.colors.arc, 0.12, 6, 0.2);
            }
          } catch (_) {}
        } else {
          // Outer passes add glow and a secondary color
          const col =
            p === 1
              ? this.colors.chain || this.colors.beam
              : this.colors.beam || this.colors.arc;
          try {
            // Auto-scale arc parameters for outer passes
            const dir = e.clone().sub(s);
            const length = dir.length() || 1;
            const segments = Math.max(8, Math.min(18, Math.round(8 + length * 0.5)));
            const amplitude = Math.min(1.0, 0.25 + length * 0.02);
            const passes = 2;
            for (let i = 0; i < passes; i++) {
              this.baseEffects.spawnArc(s, e, col, 0.12, segments, amplitude);
            }
          } catch (_) {}
          try {
            // Add noise arcs for visual complexity
            for (let i = 0; i < 2; i++) {
              this.baseEffects.spawnArc(s, e, this.colors.arc, 0.08, 6, 0.2);
            }
          } catch (_) {}
        }
      }

      // Add an extra thin beam for clarity
      try {
        this.baseEffects.spawnBeam(
          start.clone().add(new THREE.Vector3(0, 0.6, 0)),
          end.clone().add(new THREE.Vector3(0, 0.6, 0)),
          this.colors.impact,
          0.18
        );
      } catch (_) {}

      // Small spark particles along the connection for pop
      const sparkCount = Math.min(24, Math.max(8, Math.floor(dist * 1.2)));
      for (let i = 0; i < sparkCount; i++) {
        setTimeout(() => {
          const t = Math.random();
          const sparkPos = new THREE.Vector3().lerpVectors(start, end, t);
          this.baseEffects.queue.push({
            obj: null,
            until: Date.now() + 450,
            particle: true,
            pos: sparkPos
              .clone()
              .add(
                new THREE.Vector3(
                  (Math.random() - 0.5) * 0.25,
                  (Math.random() - 0.2) * 0.6,
                  (Math.random() - 0.5) * 0.25
                )
              ),
            vel: new THREE.Vector3(
              (Math.random() - 0.5) * 1.2,
              Math.random() * 1.6,
              (Math.random() - 0.5) * 1.2
            ),
            gravity: -0.6,
            size: 0.08 + Math.random() * 0.12,
            color: this.colors.core || 0xffd700,
            opacity: 0.95,
            fade: true,
          });
        }, i * 12);
      }

      // Store segment for tracking
      this.chainSegments.push({ start, end, time: now() });
    } catch (err) {
      console.warn("[flame_chain] chain link creation failed", err);
    }
  }

  /**
   * Create impact effects at target
   */
  _createImpactEffects(position) {
    try {
      // Strike flash
      this.baseEffects.spawnStrike(position, 1.2, this.colors.impact);

      // Hit decal
      this.baseEffects.spawnHitDecal(position, this.colors.chain);

      // Ring pulse
      this.baseEffects.spawnRing(
        position,
        1.2,
        this.colors.chain,
        0.3,
        0.5,
        0.45
      );
    } catch (err) {
      console.warn("[flame_chain] impact effects failed", err);
    }
  }

  /**
   * Update method (required by SkillEffect interface)
   */
  update(dt, t) {
    const currentTime = now();
    const elapsed = currentTime - this.startTime;

    // Mark as finished after duration
    if (elapsed >= this.duration && !this.finished) {
      this.finished = true;
    }
  }

  /**
   * Cleanup resources (required by SkillEffect interface)
   */
  dispose() {
    // Chain segments are handled by base effects queue
    this.chainSegments = [];
  }
}

// Export using the createSkillEffect helper
export default createSkillEffect(FlameChainEffect);

/**
 * Create a single flame chain link between two points
 */
function createFlameChainLink(baseEffects, start, end, colors) {
  const scene = baseEffects.scene;
  const group = new THREE.Group();
  scene.add(group);

  const dir = new THREE.Vector3().subVectors(end, start);
  const distance = dir.length();
  const midPoint = new THREE.Vector3()
    .addVectors(start, end)
    .multiplyScalar(0.5);

  // 1. Create chain links (cylinders connected in series)
  const linkCount = Math.max(5, Math.floor(distance / 1.5));
  const links = [];

  for (let i = 0; i < linkCount; i++) {
    const t = i / linkCount;
    const nextT = (i + 1) / linkCount;

    const linkStart = new THREE.Vector3().lerpVectors(start, end, t);
    const linkEnd = new THREE.Vector3().lerpVectors(start, end, nextT);
    const linkMid = new THREE.Vector3()
      .addVectors(linkStart, linkEnd)
      .multiplyScalar(0.5);
    const linkLength = linkStart.distanceTo(linkEnd);

    // Chain link (torus rotated to form link)
    const linkGeo = new THREE.TorusGeometry(0.15, 0.05, 8, 16);
    const linkMat = new THREE.MeshBasicMaterial({
      color: 0xff4500,
      transparent: true,
      opacity: 0.9,
      emissive: 0xff4500,
      emissiveIntensity: 0.6,
    });
    const link = new THREE.Mesh(linkGeo, linkMat);

    // Position and orient link
    link.position.copy(linkMid);
    const linkDir = new THREE.Vector3().subVectors(linkEnd, linkStart);
    const angle = Math.atan2(linkDir.x, linkDir.z);
    link.rotation.y = -angle;
    link.rotation.x = Math.PI / 2;

    // Alternate rotation for chain effect
    if (i % 2 === 0) {
      link.rotation.z = Math.PI / 2;
    }

    group.add(link);
    links.push(link);
  }

  // 2. Glowing core beam connecting the chain
  const beamGeo = new THREE.CylinderGeometry(0.08, 0.08, distance, 8);
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0xffd700,
    transparent: true,
    opacity: 0.7,
    emissive: 0xffd700,
    emissiveIntensity: 0.8,
  });
  const beam = new THREE.Mesh(beamGeo, beamMat);

  // Position and orient beam
  beam.position.copy(midPoint);
  const beamAngle = Math.atan2(dir.x, dir.z);
  beam.rotation.y = -beamAngle;
  beam.rotation.x = Math.PI / 2;

  group.add(beam);

  // 3. Connection spheres at start and end
  const startSphereGeo = new THREE.SphereGeometry(0.3, 12, 12);
  const startSphereMat = new THREE.MeshBasicMaterial({
    color: 0xff6347,
    transparent: true,
    opacity: 0.9,
    emissive: 0xff6347,
    emissiveIntensity: 0.7,
  });
  const startSphere = new THREE.Mesh(startSphereGeo, startSphereMat);
  startSphere.position.copy(start);
  group.add(startSphere);

  const endSphereGeo = new THREE.SphereGeometry(0.3, 12, 12);
  const endSphereMat = new THREE.MeshBasicMaterial({
    color: 0xff6347,
    transparent: true,
    opacity: 0.9,
    emissive: 0xff6347,
    emissiveIntensity: 0.7,
  });
  const endSphere = new THREE.Mesh(endSphereGeo, endSphereMat);
  endSphere.position.copy(end);
  group.add(endSphere);

  // 4. Sparking particles along the chain
  for (let i = 0; i < 30; i++) {
    setTimeout(() => {
      const t = Math.random();
      const sparkPos = new THREE.Vector3().lerpVectors(start, end, t);

      baseEffects.queue.push({
        obj: null,
        until: Date.now() + 600,
        particle: true,
        pos: sparkPos.clone(),
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2
        ),
        gravity: 0,
        size: 0.1,
        color: 0xffd700,
        opacity: 0.9,
        fade: true,
      });
    }, i * 20);
  }

  // 5. Impact effect at end point
  const impactGeo = new THREE.SphereGeometry(1, 16, 16);
  const impactMat = new THREE.MeshBasicMaterial({
    color: 0xffd700,
    transparent: true,
    opacity: 1.0,
  });
  const impact = new THREE.Mesh(impactGeo, impactMat);
  impact.position.copy(end);
  scene.add(impact);

  // Impact shockwave
  const shockGeo = new THREE.RingGeometry(0.5, 1, 32);
  const shockMat = new THREE.MeshBasicMaterial({
    color: 0xff6347,
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide,
  });
  const shock = new THREE.Mesh(shockGeo, shockMat);
  shock.rotation.x = -Math.PI / 2;
  shock.position.set(end.x, end.y, end.z);
  scene.add(shock);

  baseEffects.queue.push({
    obj: shock,
    until: Date.now() + 600,
    fade: true,
    mat: shockMat,
    shockwave: true,
    shockwaveSpeed: 5,
  });

  // Animate and cleanup
  const startTime = Date.now();
  const duration = 800;

  function animate() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);

    if (progress >= 1) {
      // Cleanup
      scene.remove(group);
      scene.remove(impact);

      links.forEach((link) => {
        link.geometry.dispose();
        link.material.dispose();
      });
      beamGeo.dispose();
      beamMat.dispose();
      startSphereGeo.dispose();
      startSphereMat.dispose();
      endSphereGeo.dispose();
      endSphereMat.dispose();
      impactGeo.dispose();
      impactMat.dispose();

      return;
    }

    // Pulse chain links
    const pulse = Math.sin(elapsed * 0.01) * 0.2;
    links.forEach((link, index) => {
      const linkPulse = Math.sin(elapsed * 0.01 + index * 0.3) * 0.2;
      link.scale.setScalar(1 + linkPulse);
      link.material.opacity = 0.9 - progress * 0.3;
    });

    // Pulse beam
    beam.material.opacity = 0.7 * (1 - progress * 0.5);

    // Pulse connection spheres
    const spherePulse = Math.sin(elapsed * 0.008) * 0.3;
    startSphere.scale.setScalar(1 + spherePulse);
    endSphere.scale.setScalar(1 + spherePulse);
    startSphere.material.opacity = 0.9 - progress * 0.3;
    endSphere.material.opacity = 0.9 - progress * 0.3;

    // Impact flash
    impact.scale.setScalar(1 + progress * 2);
    impact.material.opacity = 1 - progress;

    requestAnimationFrame(animate);
  }

  animate();
}
