import * as THREE from "../../vendor/three/build/three.module.js";
import { FX } from "../../config/index.js";
import { SKILL_FX } from "../../config/skills_fx.js";
import { now } from "../utils.js";
import { createSkillEffect } from "./effect_base_interface.js";

/**
 * Meteor Storm Effect
 * 
 * UNIQUE VISUAL: Actual meteors falling from sky with realistic physics,
 * fire trails, crater impacts with shockwaves, and lingering flames
 * 
 * Self-contained storm that:
 * - Shows activation warning effects
 * - Spawns meteors over time at configurable rate
 * - Targets enemies in area or random ground points
 * - Applies damage and visual effects on impact
 * 
 * Follows SkillEffect interface:
 * - update(dt, t): Spawns meteors over time and animates them
 * - dispose(): Cleans up all resources
 * - finished: Set to true when storm expires and all meteors impact
 */
class MeteorStormEffect {
  constructor(baseEffects, params) {
    this.baseEffects = baseEffects;
    this.params = params || {};
    this.finished = false;

    const { center, radius = 12 } = this.params;

    // Get skill colors
    const fx = SKILL_FX.meteor_storm || {};
    this.colors = {
      core: fx.colors?.core || 0xffff66,
      ember: fx.colors?.ember || 0xffa050,
      impact: fx.colors?.impact || 0xff4500,
      ring: fx.colors?.ring || 0xff6347,
      smoke: fx.colors?.smoke || 0x2a2a2a
    };

    // Quality settings
    this.quality = baseEffects?.quality || "high";
    this.meteorTrailCount = this.quality === "low" ? 4 : this.quality === "medium" ? 8 : 14;
    this.debrisCount = this.quality === "low" ? 8 : this.quality === "medium" ? 24 : 50;

    // Damage per meteor strike
    this.damage = this.params?.dmg ?? this.params?.damage ?? 20;
    this.strikeRadius = this.params?.strikeRadius || 2.5;

    // Storm state for spawning meteors over time
    this.stormCenter = center;
    this.stormRadius = radius;
    this.stormDuration = this.params?.duration || 6; // Total storm duration in seconds
    
    // Calculate meteor rate based on strikes and duration
    const totalStrikes = this.params?.strikes || 12;
    this.meteorRate = totalStrikes / this.stormDuration; // Meteors per second
    
    this.stormStartTime = now();
    this.stormEndTime = this.stormStartTime + this.stormDuration;
    this.accumulator = 0; // Time accumulator for meteor spawning
    this.lastUpdateTime = now();

    // Track active meteors for update loop
    this.activeMeteors = [];

    // Show activation/warning effects
    if (center) {
      this._createActivationEffects(center, radius);
    }
  }

  /**
   * Create activation/warning effects
   */
  _createActivationEffects(center, radius) {
    try {
      // Warning ring
      const warning = new THREE.Mesh(
        new THREE.RingGeometry(radius - 1.6, radius + 1.6, 64),
        new THREE.MeshBasicMaterial({
          color: this.colors.ember,
          transparent: true,
          opacity: 0.45,
          side: THREE.DoubleSide
        })
      );
      warning.rotation.x = -Math.PI / 2;
      warning.position.set(center.x, 0.05, center.z);
      this.baseEffects.indicators.add(warning);
      this.baseEffects.queue.push({
        obj: warning,
        until: now() + 1.6 * FX.timeScale,
        fade: true,
        mat: warning.material,
        pulseAmp: 0.18,
        pulseRate: 3.6
      });

      // Inner pulsing ring
      setTimeout(() => {
        this.baseEffects.spawnRing(center, Math.max(2, radius * 0.5), this.colors.ember, 0.8, 1.0, 0.45);
      }, 140);

      // Storm cloud
      this._spawnStormCloud(
        center,
        radius * 0.9,
        this.colors.smoke,
        Math.max(3, this.params?.duration || 2.6),
        Math.max(3.2, radius * 0.08)
      );

      // Orbiting embers
      const orbCount = this.quality === "low" ? 3 : (this.quality === "medium" ? 6 : 10);
      for (let i = 0; i < orbCount; i++) {
        const angle = (i / orbCount) * Math.PI * 2;
        const pos = new THREE.Vector3(
          center.x + Math.cos(angle) * (radius * 0.6 + (Math.random() - 0.5) * 2),
          center.y + 1.6 + Math.random() * 1.0,
          center.z + Math.sin(angle) * (radius * 0.6 + (Math.random() - 0.5) * 2)
        );
        this.baseEffects.spawnSphere(pos, 0.18, this.colors.core, 0.9, 0.95);
      }
    } catch (err) {
      console.warn('[meteor_storm] activation effects failed', err);
    }
  }

  /**
   * Spawn a single falling meteor
   */
  _spawnMeteor(impactPos, radius) {
    const skyHeight = Math.max(12, (radius || 12) * 0.6 + 6);
    const jitterX = (Math.random() - 0.5) * 4;
    const jitterZ = (Math.random() - 0.5) * 4;
    const startPos = new THREE.Vector3(impactPos.x + jitterX, skyHeight, impactPos.z + jitterZ);

    // Create meteor group
    const meteorGroup = new THREE.Group();

    // Rocky core
    const meteorSize = 0.9 + Math.random() * 1.6;
    const coreGeo = new THREE.DodecahedronGeometry(meteorSize, 0);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0x2a1a0a, transparent: true, opacity: 1.0 });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    meteorGroup.add(coreMesh);

    // Fiery shell
    const shellGeo = new THREE.IcosahedronGeometry(meteorSize * 1.25, 1);
    const shellMat = new THREE.MeshBasicMaterial({ color: this.colors.ember, transparent: true, opacity: 0.9 });
    const shellMesh = new THREE.Mesh(shellGeo, shellMat);
    shellMesh.scale.set(1.05, 1.05, 1.05);
    meteorGroup.add(shellMesh);

    // Glowing core
    const glowGeo = new THREE.SphereGeometry(meteorSize * 0.55, 12, 12);
    const glowMat = new THREE.MeshBasicMaterial({ color: this.colors.core, transparent: true, opacity: 0.95 });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    meteorGroup.add(glowMesh);

    meteorGroup.position.copy(startPos);
    this.baseEffects.transient.add(meteorGroup);

    // Trail particles
    const trailParticles = [];
    for (let i = 0; i < this.meteorTrailCount; i++) {
      const tp = new THREE.Mesh(
        new THREE.SphereGeometry(0.08 + Math.random() * 0.14, 6, 6),
        new THREE.MeshBasicMaterial({
          color: Math.random() > 0.6 ? this.colors.core : this.colors.ember,
          transparent: true,
          opacity: 0.9
        })
      );
      tp.position.copy(meteorGroup.position);
      this.baseEffects.transient.add(tp);
      trailParticles.push(tp);
      this.baseEffects.queue.push({
        obj: tp,
        until: now() + 0.6 * FX.timeScale,
        fade: true,
        mat: tp.material,
        scaleRate: -2.0
      });
    }

    // Store meteor data for update loop
    const meteorData = {
      group: meteorGroup,
      trailParticles,
      startPos: startPos.clone(),
      impactPos: impactPos.clone(),
      startTime: now(),
      fallDuration: 0.4 + Math.random() * 0.6, // seconds
      impacted: false,
      // Store geometries/materials for cleanup
      geometries: [coreGeo, shellGeo, glowGeo],
      materials: [coreMat, shellMat, glowMat]
    };

    this.activeMeteors.push(meteorData);
  }

  /**
   * Create impact crater with effects
   */
  _createImpactCrater(position, craterSize = 2.0) {
    try {
      // Central scorched ring
      const craterRing = new THREE.Mesh(
        new THREE.RingGeometry(craterSize * 0.6, craterSize * 1.8, 48),
        new THREE.MeshBasicMaterial({
          color: this.colors.impact,
          transparent: true,
          opacity: 0.85,
          side: THREE.DoubleSide
        })
      );
      craterRing.rotation.x = -Math.PI / 2;
      craterRing.position.set(position.x, 0.02, position.z);
      this.baseEffects.indicators.add(craterRing);
      this.baseEffects.queue.push({
        obj: craterRing,
        until: now() + 2.8 * FX.timeScale,
        fade: true,
        mat: craterRing.material
      });

      // Flash
      this.baseEffects.spawnSphere(position, craterSize * 1.3, this.colors.core, 0.18, 1.0);

      // Shockwaves
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          const shock = new THREE.Mesh(
            new THREE.RingGeometry(0.2, 0.6, 48),
            new THREE.MeshBasicMaterial({
              color: i === 0 ? this.colors.core : this.colors.ember,
              transparent: true,
              opacity: 0.9,
              side: THREE.DoubleSide
            })
          );
          shock.rotation.x = -Math.PI / 2;
          shock.position.set(position.x, 0.1, position.z);
          this.baseEffects.indicators.add(shock);
          const start = now();
          this.baseEffects.queue.push({
            obj: shock,
            until: start + (0.6 + i * 0.15) * FX.timeScale,
            fade: true,
            mat: shock.material,
            shockwave: true,
            shockwaveStartTime: start,
            shockwaveDuration: 0.6 + i * 0.15,
            shockwaveMaxRadius: craterSize * (i + 1) * 2,
            shockwaveThickness: 0.6
          });
        }, i * 70);
      }

      // Debris
      for (let i = 0; i < this.debrisCount; i++) {
        const isRock = Math.random() > 0.5;
        const geom = isRock ?
          new THREE.DodecahedronGeometry(0.06 + Math.random() * 0.15, 0) :
          new THREE.SphereGeometry(0.06 + Math.random() * 0.12, 6, 6);
        const mat = new THREE.MeshBasicMaterial({
          color: isRock ? this.colors.smoke : this.colors.ember,
          transparent: true,
          opacity: 0.9
        });
        const debris = new THREE.Mesh(geom, mat);
        debris.position.set(position.x, position.y + 0.2, position.z);
        this.baseEffects.transient.add(debris);
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 4;
        this.baseEffects.queue.push({
          obj: debris,
          until: now() + (0.8 + Math.random() * 1.0) * FX.timeScale,
          fade: true,
          mat,
          particle: true,
          velocity: new THREE.Vector3(
            Math.cos(angle) * speed,
            2 + Math.random() * 3,
            Math.sin(angle) * speed
          ),
          gravity: -10,
          spinRate: Math.random() * 6 - 3
        });
      }

      // Lingering fire ring
      const fireRing = new THREE.Mesh(
        new THREE.RingGeometry(craterSize * 0.5, craterSize * 1.2, 48),
        new THREE.MeshBasicMaterial({
          color: this.colors.ring,
          transparent: true,
          opacity: 0.7,
          side: THREE.DoubleSide
        })
      );
      fireRing.rotation.x = -Math.PI / 2;
      fireRing.position.set(position.x, 0.02, position.z);
      this.baseEffects.indicators.add(fireRing);
      this.baseEffects.queue.push({
        obj: fireRing,
        until: now() + 2.2 * FX.timeScale,
        fade: true,
        mat: fireRing.material,
        pulseAmp: 0.12,
        pulseRate: 3.0
      });
    } catch (err) {
      console.warn('[meteor_storm] createImpactCrater failed', err);
    }
  }

  /**
   * Apply damage to targets and show popups
   */
  _applyDamage(impactPos) {
    const targets = this.params.targets || [];
    if (!Array.isArray(targets) || !targets.length) return;

    for (const t of targets) {
      try {
        if (t && typeof t.takeDamage === "function") {
          t.takeDamage(this.damage);
          if (typeof t.pos === "function") {
            const p = t.pos();
            this.baseEffects.spawnDamagePopup(p, this.damage, "#ffb3b3");
          }
        } else if (t && t.position) {
          this.baseEffects.spawnDamagePopup(t.position, this.damage, "#ffb3b3");
        }
      } catch (err) {
        try {
          this.baseEffects.spawnDamagePopup(impactPos, this.damage, "#ffb3b3");
        } catch (_) { }
      }
    }
  }

  _spawnStormCloud(center, radius = 12, color = THEME_COLORS.fire, duration = 6, height = 3.6) {
    try {
      const thick = Math.max(0.6, radius * 0.08);
      const torus = new THREE.Mesh(
        new THREE.TorusGeometry(Math.max(2, radius * 0.8), thick * 0.5, 12, 32),
        new THREE.MeshBasicMaterial({ color: normalizeColor(color), transparent: true, opacity: 0.18 })
      );
      torus.position.set(center.x, height, center.z);
      torus.rotation.x = Math.PI / 2;
      this.transient.add(torus);
      this.queue.push({ obj: torus, until: now() + duration * FX.timeScale, fade: true, mat: torus.material, spinRate: 0.6 });
    } catch (_) {}
  }

  /**
   * Update meteor animations
   */
  update(dt, t) {
    const currentTime = now();

    // Spawn new meteors over time if storm is still active
    if (currentTime < this.stormEndTime) {
      const deltaTime = currentTime - this.lastUpdateTime;
      this.lastUpdateTime = currentTime;
      this.accumulator += deltaTime;

      // Spawn meteors based on rate
      const spawnInterval = 1 / this.meteorRate;
      while (this.accumulator >= spawnInterval) {
        this.accumulator -= spawnInterval;
        
        // Pick a random impact position within storm radius
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * this.stormRadius;
        const impactPos = new THREE.Vector3(
          this.stormCenter.x + Math.cos(angle) * distance,
          this.stormCenter.y,
          this.stormCenter.z + Math.sin(angle) * distance
        );
        
        this._spawnMeteor(impactPos, this.stormRadius);
      }
    }

    // Update each active meteor
    for (let i = this.activeMeteors.length - 1; i >= 0; i--) {
      const meteor = this.activeMeteors[i];

      if (meteor.impacted) {
        // Remove impacted meteors
        this.activeMeteors.splice(i, 1);
        continue;
      }

      const elapsed = currentTime - meteor.startTime;
      const progress = Math.min(1, elapsed / meteor.fallDuration);

      // Ease-in fall animation
      const ease = Math.pow(progress, 0.6);

      // Update position
      meteor.group.position.y = meteor.startPos.y - (meteor.startPos.y - meteor.impactPos.y) * ease;
      meteor.group.position.x = meteor.startPos.x + (meteor.impactPos.x - meteor.startPos.x) * progress +
        Math.sin(progress * Math.PI * 4) * 0.15;
      meteor.group.position.z = meteor.startPos.z + (meteor.impactPos.z - meteor.startPos.z) * progress +
        Math.cos(progress * Math.PI * 3) * 0.12;

      // Rotate meteor
      meteor.group.rotation.x += 0.15 + Math.random() * 0.05;
      meteor.group.rotation.y += 0.12 + Math.random() * 0.06;

      // Update trail particles
      meteor.trailParticles.forEach((p, idx) => {
        p.position.lerp(meteor.group.position, 0.2 + idx * 0.01);
      });

      // Check for impact
      if (progress >= 1 && !meteor.impacted) {
        meteor.impacted = true;

        try {
          // Impact effects
          const strikeRadius = this.params?.strikeRadius || 2.6;
          this.baseEffects.spawnImpact(meteor.impactPos, strikeRadius, this.colors.impact, 1.8);
          this.baseEffects.spawnRing(
            meteor.impactPos,
            Math.max(2.0, strikeRadius * 1.2),
            this.colors.ring,
            0.5,
            1.1,
            0.65
          );
          this._createImpactCrater(meteor.impactPos, strikeRadius);
          this._applyDamage(meteor.impactPos);
        } catch (err) {
          console.warn('[meteor_storm] impact effects failed', err);
        }

        // Cleanup meteor
        try {
          this.baseEffects.transient.remove(meteor.group);
          meteor.geometries.forEach(g => g.dispose());
          meteor.materials.forEach(m => m.dispose());
        } catch (_) { }
      }
    }

    // Mark as finished when storm has ended and all meteors have impacted
    if (currentTime >= this.stormEndTime && this.activeMeteors.length === 0 && !this.finished) {
      this.finished = true;
    }
  }

  /**
   * Cleanup all resources
   */
  dispose() {
    try {
      // Clean up any remaining meteors
      for (const meteor of this.activeMeteors) {
        try {
          this.baseEffects.transient.remove(meteor.group);
          meteor.geometries.forEach(g => g.dispose());
          meteor.materials.forEach(m => m.dispose());
        } catch (_) { }
      }
      this.activeMeteors = [];
    } catch (err) {
      console.warn('[meteor_storm] dispose failed', err);
    }
  }
}

// Export using the createSkillEffect helper
export default createSkillEffect(MeteorStormEffect);
