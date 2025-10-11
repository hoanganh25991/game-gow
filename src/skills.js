import * as THREE from "../vendor/three/build/three.module.js";
import { audio } from "./audio.js";
import { THEME_COLORS, FX, REST_RADIUS, SCALING, VILLAGE_POS, WORLD } from "../config/index.js";
import { handWorldPos } from "./entities.js";
import { getSkill } from "./skills_api.js";
import { SKILL_FX } from "../config/skills_fx.js";
import { getBasicUplift } from "./uplift.js";
import { distance2D, now } from "./utils.js";
import { executeSkillEffect } from "./effects_loader.js";

/**
 * SkillsSystem centralizes cooldowns, basic attack, Q/W/E/R skills,
 */
const __vA = new THREE.Vector3();
const __vB = new THREE.Vector3();
const __vC = new THREE.Vector3();

export class SkillsSystem {
  /**
   * @param {import("./entities.js").Player} player
   * @param {import("./entities.js").Enemy[]} enemies
   * @param {import("./effects_manager.js").EffectsManager} effects
   * @param {{Q: HTMLElement, W: HTMLElement, E: HTMLElement, R: HTMLElement}} cdUI
   * @param {any} villages optional villages system to enforce village safety rules
   */
  constructor(player, enemies, effects, cdUI, villages = null) {
    this.player = player;
    this.enemies = enemies;
    this.effects = effects;
    this.cdUI = cdUI;
    this.villages = villages;

    this.cooldowns = { Q: 0, W: 0, E: 0, R: 0, Basic: 0 };
    this.cdState = { Q: 0, W: 0, E: 0, R: 0, Basic: 0 }; // for ready flash timing
    // Temporary damage buff (applies to basic + skills)
    this.damageBuffUntil = 0;
    this.damageBuffMult = 1;
    this._pendingShake = 0;
  }

  // VFX helpers driven by SKILL_FX configuration (moved out of skills_pool)
  _fx(def) {
    const id = def && def.id;
    const e = (id && SKILL_FX[id]) || {};
    return {
      beam: e.beam ?? THEME_COLORS.themeOrange, // Orange-red fire beam
      impact: e.impact ?? THEME_COLORS.themeLightOrange, // Tomato red impact
      ring: e.ring ?? THEME_COLORS.ember, // Ember orange ring
      arc: e.arc ?? THEME_COLORS.arc, // Bright orange arc
      hand: e.hand ?? THEME_COLORS.ember, // Ember orange hand
      shake: e.shake ?? 0,
    };
  }

  _vfxCastFlash(def) {
    const fx = this._fx(def);
    try {
      const handPos = this.player.mesh.userData.handAnchor ? handWorldPos(this.player) : this.player.pos().clone().add(new THREE.Vector3(0, 1.6, 0));
      this.effects.spawnRing(handPos, 0.5, fx.hand, 0.2);
      this.effects.spawnImpact(handPos, 1, fx.hand);
    } catch (_) { }
  }

  _requestShake(v) {
    this._pendingShake = Math.max(this._pendingShake || 0, v || 0);
  }

  _spawnCastingHandEffect() {
    try {
      this.effects.spawnHandFlash(this.player);
      this.effects.spawnHandCrackle(this.player, false, 1.0);
      this.effects.spawnHandCrackle(this.player, true, 1.0);
      this.effects.spawnHandFlash(this.player, true);
      this.effects.spawnHandCrackle(this.player, false, 1.2);
      this.effects.spawnHandCrackle(this.player, true, 1.2);
    } catch (e) { }
  }

  _getCastAudioType(def) {
    if (!def || !def.type) return "cast";
    
    // Map skill types to audio effects
    const audioMap = {
      aoe: "cast_aoe",
      beam: "cast_beam",
      nova: "cast_nova",
      chain: "cast_chain",
      storm: "storm_start",
      aura: "cast",
      blink: "cast",
      dash: "cast"
    };
    
    return audioMap[def.type] || "cast";
  }

  // Prefer enemies in front of player within a small aim cone
  _pickTargetInAim(range = 36, halfAngleDeg = 12) {
    try {
      const fwd = __vA.set(0, 0, 1).applyQuaternion(this.player.mesh.quaternion).setY(0).normalize();
      const cosT = Math.cos((Math.max(1, halfAngleDeg) * Math.PI) / 180);
      const pos = this.player.pos();
      let best = null;
      let bestScore = -Infinity;
      for (const e of this.enemies) {
        if (!e.alive) continue;
        const d = distance2D(pos, e.pos());
        if (d > range) continue;
        const v = __vB.copy(e.pos()).sub(pos).setY(0);
        const len = v.length() || 1;
        const dir = __vC.copy(v).multiplyScalar(1 / len);
        const dot = dir.dot(fwd);
        if (dot <= cosT || dot <= 0) continue;
        // score: prefer higher alignment and closer distance along forward
        const proj = len * dot;
        const score = dot * 2 - proj * 0.01;
        if (score > bestScore) {
          bestScore = score;
          best = e;
        }
      }
      return best;
    } catch (_) {
      return null;
    }
  }

  // Helper: Mirror cooldown UI to duplicate displays
  _mirrorCooldownUI(el) {
    try {
      const masterId = el.id;
      if (!masterId) return;
      const dups = document.querySelectorAll(`#bottomMiddle .cooldown[data-cd="${masterId}"]`);
      dups.forEach((d) => {
        d.style.background = el.style.background;
        d.textContent = el.textContent;
        d.className = el.className;
        if (el.dataset.flashUntil) {
          d.dataset.flashUntil = el.dataset.flashUntil;
        } else {
          delete d.dataset.flashUntil;
        }
      });
    } catch (_) { }
  }

  // ----- Damage scaling helpers -----
  getBasicDamage(attacker) {
    let base = WORLD.basicAttackDamage;
    if (attacker && typeof attacker.baseDamage === "number") {
      base = Math.max(1, Math.floor(attacker.baseDamage));
    }
    const activeBuff = this.damageBuffUntil && now() < this.damageBuffUntil ? this.damageBuffMult || 1 : 1;
    return Math.max(1, Math.floor(base * activeBuff));
  }

  scaleSkillDamage(base) {
    const lvl = Math.max(1, (this.player && this.player.level) || 1);
    const levelMult = Math.pow(SCALING.hero.skillDamageGrowth, lvl - 1);
    const buffMult = this.damageBuffUntil && now() < this.damageBuffUntil ? this.damageBuffMult || 1 : 1;
    return Math.max(1, Math.floor((base || 0) * levelMult * buffMult));
  }

  // ----- Cooldowns -----
  startCooldown(key, seconds) {
    this.cooldowns[key] = now() + seconds;
  }
  isOnCooldown(key) {
    return now() < this.cooldowns[key];
  }

  // ----- UI (cooldowns) -----
  updateCooldownUI() {
    const t = now();
    for (const key of ["Q", "W", "E", "R", "Basic"]) {
      const end = this.cooldowns[key];
      const el = this.cdUI?.[key];
      if (!el) continue;

      let remain = 0;
      if (!end || end <= 0) {
        el.style.background = "none";
        el.textContent = "";
        el.className = "cooldown"; // Reset classes
      } else {
        remain = Math.max(0, end - t);
        // Hide when very close to ready
        if (remain <= 0.05) {
          el.style.background = "none";
          el.textContent = "";
          el.className = "cooldown";
        } else {
          const total = key === "Basic" ? WORLD.basicAttackCooldown : getSkill(key)?.cd || 0;
          const pct = clamp01(remain / total);
          const deg = Math.floor(pct * 360);

          // Apply CSS class based on percentage and use CSS variable for color
          const cdClass = pct > 0.5 ? "cd-high" : pct > 0.2 ? "cd-mid" : "cd-low";
          const colorVar = pct > 0.5 ? "--cooldown-high" : pct > 0.2 ? "--cooldown-mid" : "--cooldown-low";

          el.className = `cooldown ${cdClass}`;
          el.style.background = `conic-gradient(var(${colorVar}) ${deg}deg, rgba(0,0,0,0) 0deg)`;
          // el.textContent = remain < 3 ? remain.toFixed(1) : `${Math.ceil(remain)}`;
          el.textContent = remain.toFixed(1);
        }
      }

      // Mirror to duplicate cooldown displays
      this._mirrorCooldownUI(el);

      // Flash on ready transition
      const prev = this.cdState[key] || 0;
      if (prev > 0 && remain === 0) {
        el.classList.add("flash");
        el.dataset.flashUntil = String(t + 0.25);
        this._mirrorCooldownUI(el);
      }
      if (el.dataset.flashUntil && t > parseFloat(el.dataset.flashUntil)) {
        el.classList.remove("flash");
        delete el.dataset.flashUntil;
        this._mirrorCooldownUI(el);
      }
      this.cdState[key] = remain;
    }
  }

  // ----- Combat -----
  /**
   * Attempt a basic fire attack if in range and off cooldown.
   * Returns true on success, false otherwise.
   * @param {import("./entities.js").Entity} attacker
   * @param {import("./entities.js").Entity} target
   * @returns {boolean}
   */
  tryBasicAttack(attacker, target) {
    const time = now();
    if (time < (attacker.nextBasicReady || 0)) return false;

    // Allow casting without a target
    const hasValidTarget = target && target.alive;

    // Prevent player from attacking targets outside while inside any village (origin or dynamic).
    // Falls back to origin-only rule if villages API is not provided.
    if (hasValidTarget) {
      try {
        if (attacker === this.player) {
          // More permissive safe-zone rule:
          // - Allow attacking inside same village
          // - Allow attacking just outside boundary (small tolerance)
          // - Prevent cross-village aggression only when both are inside different villages
          if (this.villages && typeof this.villages.isInsideAnyVillage === "function") {
            const pin = this.villages.isInsideAnyVillage(attacker.pos());
            const tin = this.villages.isInsideAnyVillage(target.pos());
            if (pin && pin.inside && tin && tin.inside && pin.key !== tin.key) {
              return false; // inside different villages
            }
          } else {
            // Fallback: origin-only safe ring with tolerance to avoid misses near boundary
            const pd = distance2D(attacker.pos(), VILLAGE_POS);
            const td = distance2D(target.pos(), VILLAGE_POS);
            const tol = 1.5;
            if (pd <= REST_RADIUS - tol && td > REST_RADIUS + tol) return false;
          }
        }
      } catch (e) {
        // ignore errors in defensive check
      }

      const dist = distance2D(attacker.pos(), target.pos());
      if (dist > WORLD.attackRange * (WORLD.attackRangeMult || 1)) return false;
    }

    const buffMul = attacker.atkSpeedUntil && now() < attacker.atkSpeedUntil ? attacker.atkSpeedMul || 1 : 1;
    const permaMul = attacker.atkSpeedPerma || 1;
    const effMul = Math.max(0.5, buffMul * permaMul);
    const basicCd = WORLD.basicAttackCooldown / effMul;
    attacker.nextBasicReady = time + basicCd;
    if (attacker === this.player) {
      // Mirror basic attack cooldown into UI like other skills
      this.startCooldown("Basic", basicCd);
    }
    const from = attacker === this.player && this.player.mesh.userData.handAnchor ? handWorldPos(this.player) : __vA.copy(attacker.pos()).add(__vB.set(0, 1.6, 0)).clone();

    // Calculate target position: use actual target if available, otherwise fire in facing direction
    let to;
    if (hasValidTarget) {
      to = __vC.copy(target.pos()).add(__vB.set(0, 1.2, 0)).clone();
    } else {
      // Fire in the direction the player is facing
      const range = WORLD.attackRange * (WORLD.attackRangeMult || 1);
      const yaw = attacker.lastFacingYaw || attacker.mesh.rotation.y || 0;
      to = __vC
        .copy(attacker.pos())
        .add(__vB.set(Math.sin(yaw) * range, 1.2, Math.cos(yaw) * range))
        .clone();
    }

    // FIRE PROJECTILE: Spawn fireball that travels to target
    const baseDmg = this.getBasicDamage(attacker);
    const up = getBasicUplift ? getBasicUplift() : { aoeRadius: 0, chainJumps: 0, dmgMul: 1 };
    const dmg = Math.max(1, Math.floor(baseDmg * (up.dmgMul || 1)));

    this.effects.spawnProjectile(from, to, {
      color: THEME_COLORS.themeOrange,
      size: 0.35,
      speed: 25,
      onComplete: (hitPos) => {
        // Impact explosion at target
        this.effects.spawnStrike(hitPos, 1.2, THEME_COLORS.themeOrange);
        if (hasValidTarget) {
          this.effects.spawnHitDecal(target.pos(), THEME_COLORS.ember);
        }
      },
    });

    audio.sfx("basic_attack");

    // FP hand VFX for basic attack - fire casting effects
    this._spawnCastingHandEffect();
    if (attacker === this.player) this.player.braceUntil = now() + 0.18;

    // Only deal damage if there's a valid target
    if (hasValidTarget) {
      target.takeDamage(dmg);
      try {
        this.effects.spawnDamagePopup(target.pos(), dmg);
      } catch (e) { }

      // Uplift: AOE explosion around the hit target
      try {
        if (up.aoeRadius && up.aoeRadius > 0) {
          this.effects.spawnStrike(target.pos(), up.aoeRadius, THEME_COLORS.ember);
          const r = up.aoeRadius + 2.5;
          this.enemies.forEach((en) => {
            if (!en.alive || en === target) return;
            if (distance2D(en.pos(), target.pos()) <= r) en.takeDamage(Math.max(1, Math.floor(dmg * 0.8)));
          });
        }
      } catch (_) { }

      // Uplift: Chain to nearby enemies
      try {
        let jumps = Math.max(0, up.chainJumps || 0);
        let current = target;
        const hitSet = new Set([current]);
        while (jumps-- > 0) {
          const candidates = this.enemies.filter((e) => e.alive && !hitSet.has(e) && distance2D(current.pos(), e.pos()) <= 22).sort((a, b) => distance2D(current.pos(), a.pos()) - distance2D(current.pos(), b.pos()));
          const nxt = candidates[0];
          if (!nxt) break;
          hitSet.add(nxt);
          const from = __vA.copy(current.pos()).add(__vB.set(0, 1.2, 0)).clone();
          const to = __vC.copy(nxt.pos()).add(__vB.set(0, 1.2, 0)).clone();
          try {
            // Auto-scale arc parameters based on distance
            const dir = to.clone().sub(from);
            const length = dir.length() || 1;
            const segments = Math.max(8, Math.min(18, Math.round(8 + length * 0.5)));
            const amplitude = Math.min(1.0, 0.25 + length * 0.02);
            const passes = 2; // Use fewer passes for chain lightning
            for (let i = 0; i < passes; i++) {
              this.effects.spawnArc(from, to, THEME_COLORS.ember, 0.08, segments, amplitude);
            }
          } catch (_) { }
          nxt.takeDamage(Math.max(1, Math.floor(dmg * 0.85)));
          current = nxt;
        }
      } catch (_) { }
    }

    return true;
  }

  // ----- Skills -----
  /**
   * Internal helper: Execute skill effects without resource checks
   * Shared by castSkill and previewSkill for consistency
   */
  _executeSkillLogic(def, point = null) {
    // Auto-select point if none provided for ground-targeted skills
    if (!point && (def.type === "aoe" || def.type === "blink" || def.type === "dash")) {
      const effRange = Math.max(WORLD.attackRange * (WORLD.attackRangeMult || 1), (def.radius || 0) + 10);
      let candidates = this.enemies.filter((e) => e.alive && distance2D(this.player.pos(), e.pos()) <= effRange + (def.radius || 0));
      if (candidates.length === 0 && def.type === "aoe") {
        try {
          this.effects.showNoTargetHint?.(this.player, effRange);
        } catch (_) { }
        return;
      }
      if (candidates.length > 0) {
        candidates.sort((a, b) => distance2D(this.player.pos(), a.pos()) - distance2D(this.player.pos(), b.pos()));
        point = __vA.copy(candidates[0].pos()).clone();
      } else {
        point = this.player.pos().clone();
      }
    }

    // Cast flash VFX
    this._vfxCastFlash(def);
    
    // Play cast audio based on skill type
    try {
      const audioType = this._getCastAudioType(def);
      audio.sfx(audioType);
    } catch (_) { }

    // Gather targets in range
    const centerPos = point || this.player.pos();
    const targetRange = def.range || def.jumpRange || def.radius || WORLD.attackRange || 36;
    const targets = this.enemies.filter((en) => en.alive && distance2D(en.pos(), centerPos) <= targetRange);

    // Simple preferred target: player's current target or aimed enemy
    let preferredTarget = null;
    if (this.player?.target?.alive && distance2D(this.player.target.pos(), centerPos) <= targetRange) {
      preferredTarget = this.player.target;
    } else {
      preferredTarget = this._pickTargetInAim(targetRange, 14);
    }

    // Calculate from/to positions for beam-style skills
    const fx = this._fx(def);
    const fromPos = this.player?.mesh?.userData?.handAnchor
      ? handWorldPos(this.player)
      : this.player.pos().clone().add(__vB.set(0, 1.6, 0));

    let toPos;
    if (point) {
      toPos = point.clone().add(new THREE.Vector3(0, 1.2, 0));
    } else if (preferredTarget) {
      toPos = preferredTarget.pos().clone().add(new THREE.Vector3(0, 1.2, 0));
    } else if (targets.length > 0) {
      toPos = targets[0].pos().clone().add(new THREE.Vector3(0, 1.2, 0));
    } else {
      // Fire forward based on player's facing
      const yaw = this.player?.lastFacingYaw || this.player?.mesh?.rotation?.y || 0;
      const range = def.range || WORLD.attackRange * (WORLD.attackRangeMult || 1) || 36;
      toPos = this.player.pos().clone().add(__vB.set(Math.sin(yaw) * range, 1.2, Math.cos(yaw) * range));
    }

    // Build params for effect file
    const skillEffectParams = {
      skillId: def.id,
      player: this.player,
      center: centerPos,
      radius: def.radius || 8,
      range: def.range,
      jumps: def.jumps,
      jumpRange: def.jumpRange,
      targets: targets,
      preferredTarget: preferredTarget,
      dmg: this.scaleSkillDamage(def.dmg || 0),
      slowFactor: def.slowFactor,
      slowDuration: def.slowDuration,
      shake: fx.shake,
      point: point,
      from: fromPos,
      to: toPos,
    };

    // Execute skill effect (effects are preloaded during game init, so this is synchronous)
    try {
      executeSkillEffect(def.id, this.effects, skillEffectParams);
    } catch (err) {
      console.warn("[Skills] Custom effect failed, using fallback:", err);
      // Fallback to basic effects
      if (fromPos && toPos) {
        this.effects.spawnBeam(fromPos, toPos, fx.beam, 0.15);
        this.effects.spawnImpact(toPos, 1.5, fx.impact);
      } else if (centerPos) {
        this.effects.spawnImpact(centerPos, def.radius || 2, fx.impact);
        this.effects.spawnRing(centerPos, def.radius || 3, fx.ring, 0.4);
      }

      // Fallback damage application
      targets.forEach((en) => {
        en.takeDamage(skillEffectParams.dmg);
        if (def.slowFactor) {
          en.slowUntil = now() + (def.slowDuration || 1.5);
          en.slowFactor = def.slowFactor;
        }
      });
    }

    this._requestShake(fx.shake);
  }

  /**
   * Generic skill dispatcher. Use castSkill('Q'|'W'|'E'|'R', point?)
   * All skills now use their own effect files - no type checking needed
   */
  castSkill(key, point = null) {
    if (!key) return;
    if (this.isOnCooldown(key)) return;
    const SK = getSkill(key);
    if (!SK) {
      console.warn("castSkill: unknown SKILLS key", key);
      return;
    }

    // Check mana
    if (!this.player.canSpend(SK.mana)) return;

    // Spend mana and start cooldown
    this.player.spend(SK.mana);
    this.startCooldown(key, SK.cd);

    // Execute using shared logic
    audio.sfx(key);
    this._executeSkillLogic(SK, point);
  }

  previewSkill(def) {
    if (!def) return;
    try {
      // Execute using shared logic (no mana/cooldown checks)
      this._executeSkillLogic(def);
    } catch (e) {
      console.warn("[Skills] previewSkill failed:", e);
    }
  }

  // ----- Per-frame update -----
  update(t, dt, cameraShake) {
    // Update cooldown UI every frame
    this.updateCooldownUI();

    // Apply pending camera shake
    if (cameraShake && (this._pendingShake || 0) > 0) {
      cameraShake.mag = Math.max(cameraShake.mag || 0, this._pendingShake);
      cameraShake.until = now() + 0.22;
      this._pendingShake = 0;
    }
  }
}

// Local small helper
function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}
