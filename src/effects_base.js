import * as THREE from "../vendor/three/build/three.module.js";
import { THEME_COLORS, FX } from "../config/index.js";
import { now, parseThreeColor } from "./utils.js";
import { handWorldPos, leftHandWorldPos } from "./entities.js";

/**
 * Base effect primitives - generic building blocks
 */
export class BaseEffects {
  constructor(scene, quality = "high") {
    this.scene = scene;
    this.quality = quality;

    this.transient = new THREE.Group();
    scene.add(this.transient);

    this.indicators = new THREE.Group();
    scene.add(this.indicators);

    // Reusable temp vectors to avoid allocations
    this._tmpVecA = new THREE.Vector3();
    this._tmpVecB = new THREE.Vector3();
    this._tmpVecC = new THREE.Vector3();
    this._tmpVecD = new THREE.Vector3();
    this._tmpVecE = new THREE.Vector3();

    // Internal timed queue for cleanup and animations
    this.queue = []; // items: { obj, until, fade?, mat?, scaleRate? }
  }

  /**
   * Spawn a simple beam/line between two points
   */
  spawnBeam(from, to, color = THEME_COLORS.themeOrange, life = 0.12) {
    const p0 = this._tmpVecA.copy(from);
    const p1 = this._tmpVecB.copy(to);
    const geometry = new THREE.BufferGeometry().setFromPoints([p0, p1]);
    const material = new THREE.LineBasicMaterial({ color: normalizeColor(color), linewidth: 2 });
    const line = new THREE.Line(geometry, material);
    this.transient.add(line);
    const lifeMul = this.quality === "low" ? 0.7 : (this.quality === "medium" ? 0.85 : 1);
    this.queue.push({ obj: line, until: now() + life * lifeMul * FX.timeScale, fade: true, mat: material });
  }

  /**
   * Spawn a wavy arc/stream between two points with turbulence
   */
  spawnArc(from, to, color = THEME_COLORS.themeOrange, life = 0.12, segments = 10, amplitude = 0.6) {
    const dir = this._tmpVecA.copy(to).sub(this._tmpVecB.copy(from));
    const normal = this._tmpVecC.set(-dir.z, 0, dir.x).normalize();
    const up = this._tmpVecD.set(0, 1, 0);

    const points = [];
    const seg = Math.max(4, Math.round(segments * (this.quality === "low" ? 0.5 : (this.quality === "medium" ? 0.75 : 1))));

    for (let i = 0; i <= seg; i++) {
      const t = i / segments;
      const pTmp = this._tmpVecE.copy(from).lerp(this._tmpVecB.copy(to), t);
      const amp = Math.sin(Math.PI * t) * amplitude;
      const waveOffset = Math.sin(t * Math.PI * 3 + Date.now() * 0.01) * amplitude * 0.3;
      const turbulence = (Math.random() - 0.5) * amplitude * 0.4;
      const j1 = this._tmpVecA.copy(normal).multiplyScalar(waveOffset + turbulence);
      const j2 = this._tmpVecC.copy(up).multiplyScalar((Math.random() * 2 - 1) * amp * 0.6);
      pTmp.add(j1).add(j2);
      points.push(pTmp.clone());
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: normalizeColor(color),
      transparent: true,
      opacity: 0.8,
      linewidth: 2
    });
    const line = new THREE.Line(geometry, material);
    this.transient.add(line);
    const lifeMul = this.quality === "low" ? 0.7 : (this.quality === "medium" ? 0.85 : 1);
    this.queue.push({ obj: line, until: now() + life * lifeMul * FX.timeScale, fade: true, mat: material });
  }

  /**
   * Spawn an impact effect at a point (vertical beams + radial bursts)
   */
  spawnImpact(point, radius = 2, color = THEME_COLORS.themeOrange, intensity = 1.0) {
    const colors = [
      THEME_COLORS.themeYellow,
      THEME_COLORS.themeAccent,
      THEME_COLORS.themeOrange,
    ];

    const pillarPasses = Math.max(1, Math.round((this.quality === "low" ? 2 : (this.quality === "medium" ? 3 : 4)) * intensity));

    // Vertical pillars
    for (let i = 0; i < pillarPasses; i++) {
      const from = point.clone().add(new THREE.Vector3(
        (Math.random() - 0.5) * 0.3 * i,
        0.1,
        (Math.random() - 0.5) * 0.3 * i
      ));
      const to = point.clone().add(new THREE.Vector3(
        (Math.random() - 0.5) * 0.5 * i,
        4 + Math.random() * 2 * intensity,
        (Math.random() - 0.5) * 0.5 * i
      ));
      const pillarColor = colors[Math.min(i, colors.length - 1)];
      this.spawnBeam(from, to, pillarColor, 0.15);
    }

    // Radial bursts
    const burstCount = Math.max(1, Math.round((this.quality === "low" ? 3 : (this.quality === "medium" ? 6 : 8)) * intensity));
    for (let i = 0; i < burstCount; i++) {
      const ang = (i / burstCount) * Math.PI * 2 + Math.random() * 0.5;
      const r = radius * (0.5 + Math.random() * 0.5);
      const p2 = point.clone().add(new THREE.Vector3(
        Math.cos(ang) * r,
        0.8 + Math.random() * 1.5,
        Math.sin(ang) * r
      ));
      const burstColor = Math.random() > 0.5 ? THEME_COLORS.themeAccent : color;
      this.spawnBeam(point.clone().add(new THREE.Vector3(0, 0.2, 0)), p2, burstColor, 0.12);
    }
  }

  /**
   * Spawn a ground ring that expands and fades
   */
  spawnRing(center, radius = 6, color = THEME_COLORS.themeOrange, duration = 0.35, width = 0.6, opacity = 0.55) {
    try {
      const ring = createGroundRing(Math.max(0.05, radius - width * 0.5), radius + width * 0.5, color, opacity);
      ring.position.set(center.x, 0.02, center.z);
      this.indicators.add(ring);
      this.queue.push({ obj: ring, until: now() + duration * FX.timeScale, fade: true, mat: ring.material, scaleRate: 1.0 });
    } catch (_) { }
  }

  /**
   * Spawn a sphere at a position (for explosions, flashes, etc.)
   */
  spawnSphere(position, radius = 0.3, color = THEME_COLORS.themeOrange, life = 0.12, opacity = 0.9) {
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 12, 12),
      new THREE.MeshBasicMaterial({ color: normalizeColor(color), transparent: true, opacity })
    );
    sphere.position.copy(position);
    this.transient.add(sphere);
    this.queue.push({ obj: sphere, until: now() + life * FX.timeScale, fade: true, mat: sphere.material, scaleRate: 1.8 });
  }

  /**
   * Spawn a projectile that travels from source to target
   */
  spawnProjectile(from, to, opts = {}) {
    const color = opts.color || THEME_COLORS.themeOrange;
    const size = opts.size || 0.4;
    const speed = opts.speed || 20;
    const trail = opts.trail !== false;

    const dir = this._tmpVecA.copy(to).sub(this._tmpVecB.copy(from));
    const distance = dir.length();
    const travelTime = distance / speed;

    // Create projectile sphere
    const projectileGeo = new THREE.SphereGeometry(size, 12, 12);
    const projectileMat = new THREE.MeshBasicMaterial({
      color: normalizeColor(color),
      transparent: true,
      opacity: 0.95
    });
    const projectile = new THREE.Mesh(projectileGeo, projectileMat);
    projectile.position.copy(from);

    // Add outer glow layer
    const glowGeo = new THREE.SphereGeometry(size * 1.4, 12, 12);
    const glowMat = new THREE.MeshBasicMaterial({
      color: THEME_COLORS.themeAccent,
      transparent: true,
      opacity: 0.4
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    projectile.add(glow);

    this.transient.add(projectile);

    const startTime = now();
    this.queue.push({
      obj: projectile,
      until: startTime + travelTime * FX.timeScale,
      projectile: true,
      from: from.clone(),
      to: to.clone(),
      startTime,
      travelTime,
      mat: projectileMat,
      glowMat,
      trail,
      trailColor: color,
      onComplete: opts.onComplete
    });
  }

  /**
   * Spawn a cage of vertical bars around a point
   */
  spawnCage(center, radius = 12, color = THEME_COLORS.themeOrange, duration = 0.6, bars = 12, height = 2.2) {
    try {
      const g = new THREE.Group();
      const mats = [];
      const h = Math.max(1.4, height);
      const yMid = h * 0.5;
      const r = Math.max(1, radius);
      const col = normalizeColor(color);
      for (let i = 0; i < Math.max(6, bars); i++) {
        const ang = (i / Math.max(6, bars)) * Math.PI * 2;
        const x = center.x + Math.cos(ang) * r;
        const z = center.z + Math.sin(ang) * r;
        const geo = new THREE.CylinderGeometry(0.06, 0.06, h, 6);
        const mat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.85 });
        const m = new THREE.Mesh(geo, mat);
        m.position.set(x, yMid, z);
        g.add(m);
        mats.push(mat);
      }
      const baseRing = createGroundRing(Math.max(0.2, r - 0.25), r + 0.25, col, 0.4);
      baseRing.position.set(center.x, 0.02, center.z);
      g.add(baseRing);
      mats.push(baseRing.material);

      this.transient.add(g);
      this.queue.push({ obj: g, until: now() + duration * FX.timeScale, fade: true, mats });
    } catch (_) { }
  }

  /**
   * Spawn a shield bubble around an entity
   */
  spawnShield(entity, color = THEME_COLORS.themeOrange, duration = 6, radius = 1.7) {
    try {
      const mat = new THREE.MeshBasicMaterial({
        color: normalizeColor(color),
        transparent: true,
        opacity: 0.22,
        wireframe: true
      });
      const bubble = new THREE.Mesh(new THREE.SphereGeometry(radius, 24, 16), mat);
      const p = entity.pos();
      bubble.position.set(p.x, 1.1, p.z);
      this.transient.add(bubble);
      this.queue.push({
        obj: bubble,
        until: now() + duration * FX.timeScale,
        fade: true,
        mat,
        follow: entity,
        followYOffset: 1.1,
        pulseAmp: 0.06,
        pulseRate: 3.5,
        baseScale: 1
      });
    } catch (_) { }
  }

  /**
   * Spawn orbiting orbs around an entity
   */
  spawnOrbitingOrbs(entity, color = THEME_COLORS.themeOrange, opts = {}) {
    try {
      const count = Math.max(1, opts.count ?? 4);
      const r = Math.max(0.4, opts.radius ?? 1.2);
      const duration = Math.max(0.2, opts.duration ?? 1.0);
      const size = Math.max(0.06, opts.size ?? 0.16);
      const rate = Math.max(0.5, opts.rate ?? 4.0);

      const group = new THREE.Group();
      const children = [];
      for (let i = 0; i < count; i++) {
        const orb = new THREE.Mesh(
          new THREE.SphereGeometry(size, 10, 10),
          new THREE.MeshBasicMaterial({ color: normalizeColor(color), transparent: true, opacity: 0.9 })
        );
        group.add(orb);
        children.push(orb);
      }
      const p = entity.pos();
      group.position.set(p.x, 0, p.z);
      this.transient.add(group);
      this.queue.push({
        obj: group,
        until: now() + duration * FX.timeScale,
        fade: true,
        follow: entity,
        followYOffset: 0,
        orbitChildren: children,
        orbitR: r,
        orbitRate: rate,
        orbitYOffset: 1.2
      });
    } catch (_) { }
  }

  // ===== INDICATOR HELPERS (UI/Feedback) =====
  spawnMovePing(point, color = THEME_COLORS.themeOrange) {
    const ring = createGroundRing(0.6, 0.85, color, 0.8);
    ring.position.set(point.x, 0.02, point.z);
    this.indicators.add(ring);
    this.queue.push({ obj: ring, until: now() + 0.8 * FX.timeScale, fade: true, mat: ring.material, scaleRate: 1.6 });
  }

  spawnTargetPing(entity, color = THEME_COLORS.ember) {
    if (!entity || !entity.alive) return;
    const p = entity.pos();
    const ring = createGroundRing(0.65, 0.9, color, 0.85);
    ring.position.set(p.x, 0.02, p.z);
    this.indicators.add(ring);
    this.queue.push({ obj: ring, until: now() + 0.7 * FX.timeScale, fade: true, mat: ring.material, scaleRate: 1.4 });
  }

  showNoTargetHint(player, radius) {
    const ring = createGroundRing(Math.max(0.1, radius - 0.2), radius + 0.2, THEME_COLORS.ember, 0.35);
    const p = player.pos();
    ring.position.set(p.x, 0.02, p.z);
    this.indicators.add(ring);
    this.queue.push({ obj: ring, until: now() + 0.8 * FX.timeScale, fade: true, mat: ring.material });
    this.spawnStrike(player.pos(), 1.2, THEME_COLORS.ember);
  }

  /**
  * Hit decal on ground
  */
  spawnHitDecal(center, color = THEME_COLORS.ember) {
    const ring = createGroundRing(0.2, 0.55, color, 0.5);
    ring.position.set(center.x, 0.02, center.z);
    this.indicators.add(ring);
    this.queue.push({ obj: ring, until: now() + 0.22 * FX.timeScale, fade: true, mat: ring.material, scaleRate: 1.3 });
  }

  /**
   * Strike/explosion effect
   */
  spawnStrike(point, radius = 2, color = THEME_COLORS.themeOrange) {
    this.spawnImpact(point, radius, color, 1.5);

    const emberCount = this.quality === "low" ? 4 : (this.quality === "medium" ? 8 : 12);
    for (let i = 0; i < emberCount; i++) {
      const ang = Math.random() * Math.PI * 2;
      const r = Math.random() * radius * 0.5;
      const emberStart = point.clone().add(new THREE.Vector3(
        Math.cos(ang) * r,
        0.1,
        Math.sin(ang) * r
      ));
      const emberEnd = emberStart.clone().add(new THREE.Vector3(
        (Math.random() - 0.5) * 1.5,
        2 + Math.random() * 3,
        (Math.random() - 0.5) * 1.5
      ));
      const emberColor = Math.random() > 0.6 ? THEME_COLORS.themeYellow : (Math.random() > 0.5 ? THEME_COLORS.themeAccent : THEME_COLORS.ember);
      this.spawnBeam(emberStart, emberEnd, emberColor, 0.1 + Math.random() * 0.1);
    }
  }

  // ===== HAND/PLAYER EFFECTS =====
  spawnHandFlash(player, left = false) {
    const p = left ? leftHandWorldPos(player) : handWorldPos(player);
    this.spawnSphere(p, 0.28, THEME_COLORS.themeOrange, 0.12, 0.9);
  }

  spawnHandFlashColored(player, color = THEME_COLORS.themeOrange, left = false) {
    const p = left ? leftHandWorldPos(player) : handWorldPos(player);
    this.spawnSphere(p, 0.28, color, 0.14, 0.95);
  }

  spawnHandCrackle(player, left = false, strength = 1) {
    if (!player) return;
    const origin = left ? leftHandWorldPos(player) : handWorldPos(player);
    const qMul = this.quality === "low" ? 0.4 : (this.quality === "medium" ? 0.6 : 1);
    const count = Math.max(1, Math.round((2 + Math.random() * 2 * strength) * qMul));
    for (let i = 0; i < count; i++) {
      const dir = new THREE.Vector3((Math.random() - 0.5), (Math.random() - 0.2), (Math.random() - 0.5)).normalize();
      const len = 0.35 + Math.random() * 0.5 * strength;
      const to = origin.clone().add(dir.multiplyScalar(len));
      this.spawnBeam(origin.clone(), to, THEME_COLORS.themeOrange, 0.06);
    }
  }

  spawnHandLink(player, life = 0.08) {
    if (!player) return;
    const a = handWorldPos(player);
    const b = leftHandWorldPos(player);

    // Auto-scale arc parameters based on distance
    const dir = b.clone().sub(a);
    const length = dir.length() || 1;
    const segments = Math.max(8, Math.min(18, Math.round(8 + length * 0.5)));
    const amplitude = Math.min(1.0, 0.25 + length * 0.02);

    // Create multiple passes for fire effect
    const passes = this.quality === "low" ? 2 : (this.quality === "medium" ? 3 : 4);
    for (let i = 0; i < passes; i++) {
      this.spawnArc(a, b, THEME_COLORS.themeOrange, life, segments, amplitude);
    }
  }

  // ===== DAMAGE POPUP =====

  spawnDamagePopup(worldPos, amount, color = "#ffe1e1") {
    const q = this.quality || "high";
    if (q === "low" && Math.random() > 0.3) return;
    if (q === "medium" && Math.random() > 0.6) return;
    if (!worldPos) return;

    const text = String(Math.floor(Number(amount) || amount));
    const w = 160;
    const h = 64;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");

    ctx.clearRect(0, 0, w, h);
    ctx.font = "bold 36px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 8;
    ctx.strokeStyle = "rgba(0,0,0,0.6)";
    ctx.strokeText(text, w / 2, h / 2);
    ctx.fillStyle = `${color}`;
    ctx.fillText(text, w / 2, h / 2);

    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: true });
    const spr = new THREE.Sprite(mat);

    const scaleBase = 0.8;
    const scale = scaleBase + Math.min(2.0, text.length * 0.08);
    spr.scale.set(scale * (w / 128), scale * (h / 64), 1);
    spr.position.set(worldPos.x, worldPos.y + 2.4, worldPos.z);

    this.transient.add(spr);
    this.queue.push({
      obj: spr,
      until: now() + 1.0 * FX.popupDurationScale,
      fade: true,
      mat: mat,
      velY: 0.9,
      map: tex,
    });
  }
  /**
   * Update all active effects
   */
  update(t, dt) {
    // Adaptive VFX throttling based on FPS
    let fps = 60;
    try {
      fps = (window.__perfMetrics && window.__perfMetrics.fps)
        ? window.__perfMetrics.fps
        : (1000 / Math.max(0.001, (window.__perfMetrics && window.__perfMetrics.avgMs) || 16.7));
    } catch (_) { }

    const __fadeBoost = fps < 20 ? 2.4 : (fps < 28 ? 1.8 : (fps < 40 ? 1.25 : 1));

    try {
      const maxAllowed = fps < 20 ? 28 : (fps < 28 ? 42 : (fps < 40 ? 80 : 120));
      if (this.queue.length > maxAllowed) {
        const toCull = Math.min(this.queue.length - maxAllowed, Math.floor(this.queue.length * 0.2));
        for (let k = 0; k < toCull; k++) {
          const idx = (k % this.queue.length);
          const e = this.queue[idx];
          if (e) e.until = Math.min(e.until || (t + 0.3), t + 0.12);
        }
      }
    } catch (_) { }

    for (let i = this.queue.length - 1; i >= 0; i--) {
      const e = this.queue[i];

      // Projectile motion
      if (e.projectile && e.obj && e.obj.position) {
        const elapsed = t - e.startTime;
        const progress = Math.min(1, elapsed / e.travelTime);

        const newPos = this._tmpVecA.copy(e.from).lerp(this._tmpVecB.copy(e.to), progress);
        e.obj.position.copy(newPos);

        const wobble = Math.sin(t * 15) * 0.1;
        e.obj.position.y += wobble;

        if (e.trail && this.quality !== "low" && Math.random() > 0.6) {
          const trailPos = e.obj.position.clone();
          const trailEnd = trailPos.clone().add(new THREE.Vector3(
            (Math.random() - 0.5) * 0.3,
            -0.2 - Math.random() * 0.3,
            (Math.random() - 0.5) * 0.3
          ));
          this.spawnBeam(trailPos, trailEnd, e.trailColor || THEME_COLORS.themeOrange, 0.08);
        }

        if (progress >= 1 && e.onComplete) {
          try { e.onComplete(e.to); } catch (_) { }
        }
      }

      // Vertical motion for popups
      if (e.velY && e.obj && e.obj.position) {
        e.obj.position.y += e.velY * dt;
      }

      // Particle physics (velocity + gravity)
      if (e.particle && e.velocity && e.obj && e.obj.position) {
        e.obj.position.x += e.velocity.x * dt;
        e.obj.position.y += e.velocity.y * dt;
        e.obj.position.z += e.velocity.z * dt;

        if (e.gravity) {
          e.velocity.y += e.gravity * dt;
        }
      }

      // Shockwave expansion
      if (e.shockwave && e.obj && e.obj.scale) {
        const elapsed = t - e.shockwaveStartTime;
        const progress = Math.min(1, elapsed / e.shockwaveDuration);
        const currentRadius = progress * e.shockwaveMaxRadius;
        const scale = currentRadius / e.shockwaveThickness;
        e.obj.scale.set(scale, 1, scale);
      }

      // Animated scaling
      if (e.scaleRate && e.obj && e.obj.scale) {
        const s = 1 + (e.scaleRate || 0) * dt * FX.scaleRateScale;
        e.obj.scale.multiplyScalar(s);
      }

      // Follow an entity
      if (e.follow && e.obj && typeof e.follow.pos === "function") {
        const p = e.follow.pos();
        try { e.obj.position.set(p.x, (e.followYOffset ?? e.obj.position.y), p.z); } catch (_) { }
      }

      // Pulsing scale
      if (e.pulseAmp && e.obj && e.obj.scale) {
        const base = e.baseScale || 1;
        const rate = (e.pulseRate || 3) * FX.pulseRateScale;
        const amp = e.pulseAmp || 0.05;
        const s2 = base * (1 + Math.sin(t * rate) * amp);
        try { e.obj.scale.set(s2, s2, s2); } catch (_) { }
      }

      // Spin rotation
      if (e.spinRate && e.obj && e.obj.rotation) {
        try { e.obj.rotation.y += (e.spinRate || 0) * dt * FX.spinRateScale; } catch (_) { }
      }

      // Orbiting orbs
      if (e.orbitChildren && e.obj) {
        const cnt = e.orbitChildren.length || 0;
        e.orbitBase = (e.orbitBase || 0) + (e.orbitRate || 4) * dt * FX.orbitRateScale;
        const base = e.orbitBase || 0;
        const r = e.orbitR || 1.2;
        const y = e.orbitYOffset ?? 1.2;
        for (let i = 0; i < cnt; i++) {
          const child = e.orbitChildren[i];
          if (!child) continue;
          const ang = base + (i * Math.PI * 2) / Math.max(1, cnt);
          try { child.position.set(Math.cos(ang) * r, y, Math.sin(ang) * r); } catch (_) { }
        }
      }

      // Fade out
      if (e.fade) {
        const fadeOne = (m) => {
          if (!m) return;
          m.opacity = m.opacity ?? 1;
          m.transparent = true;
          m.opacity = Math.max(0, m.opacity - dt * 1.8 * FX.fadeSpeedScale * __fadeBoost);
        };
        if (e.mat) fadeOne(e.mat);
        if (e.mats && Array.isArray(e.mats)) e.mats.forEach(fadeOne);
      }

      // Cleanup expired effects
      if (t >= e.until) {
        this.transient.remove(e.obj);
        this.indicators.remove(e.obj);

        const disposeMat = (m) => {
          try { if (m && m.map) m.map.dispose?.(); } catch (_) { }
          try { m && m.dispose?.(); } catch (_) { }
        };
        const disposeObj = (o) => {
          try { o.geometry && o.geometry.dispose?.(); } catch (_) { }
          try {
            if (Array.isArray(o.material)) o.material.forEach(disposeMat);
            else disposeMat(o.material);
          } catch (_) { }
        };
        try {
          if (e.obj && typeof e.obj.traverse === "function") {
            e.obj.traverse(disposeObj);
          } else {
            disposeObj(e.obj);
          }
        } catch (_) { }
        this.queue.splice(i, 1);
      }
    }
  }
}

/**
 * Base Effects Module
 * 
 * Provides generic, reusable visual effect primitives that are not tied to any specific skill.
 * These are the building blocks for all visual effects in the game.
 */

// Normalize color inputs from various formats ("#000000", 0x000000, 000000)
export function normalizeColor(c, fallback = THEME_COLORS.themeOrange) {
  try {
    if (typeof c === "number" && Number.isFinite(c)) return c >>> 0;
    if (typeof c === "string") {
      return parseThreeColor(c).hex >>> 0;
    }
  } catch (_) { }
  try {
    if (typeof fallback === "string") return parseThreeColor(fallback).hex >>> 0;
    if (typeof fallback === "number") return fallback >>> 0;
  } catch (_) { }
  return 0x000000;
}

// Standalone ring factory (used by UI modules and effects)
export function createGroundRing(innerR, outerR, color, opacity = 0.6) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(innerR, outerR, 48),
    new THREE.MeshBasicMaterial({
      color: normalizeColor(color),
      transparent: true,
      opacity,
      side: THREE.FrontSide,
      depthWrite: false,
    })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.02;
  return ring;
}
