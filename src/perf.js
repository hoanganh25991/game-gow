// Performance tracking and VFX gating helpers

/**
 * Create a lightweight performance tracker.
 * - Tracks frame ms, avg ms, FPS, 1% low FPS (p99 of ms)
 * - Optionally auto-adjusts VFX quality to maintain target FPS
 */
export function createPerformanceTracker(renderer, opts = {}) {
  const targetFPS = Number.isFinite(opts.targetFPS) ? opts.targetFPS : 90;
  let autoAdjust = opts.autoAdjust !== false;

  const state = {
    prevMs: performance.now(),
    hist: [],
    fps: 0,
    fpsLow1: 0,
    ms: 0,
    avgMs: 0
  };

  function update(nowMs) {
    const dtMs = Math.max(0.1, Math.min(1000, nowMs - (state.prevMs || nowMs)));
    state.prevMs = nowMs;
    state.ms = dtMs;
    state.hist.push(dtMs);
    if (state.hist.length > 600) state.hist.shift(); // ~10s at 60fps

    // Smooth FPS over recent 30 frames
    const recent = state.hist.slice(-30);
    const avgMs = recent.reduce((a, b) => a + b, 0) / Math.max(1, recent.length);
    state.avgMs = avgMs;
    state.fps = 1000 / avgMs;

    // Compute 1% low (p99) on throttle (caller can decide cadence)
    // We'll expose computeLow() so caller can control throttle; but by default compute each update is fine for simplicity.
    try {
      const sorted = state.hist.slice().sort((a, b) => a - b);
      const p99Idx = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.99));
      const ms99 = sorted[p99Idx] || avgMs;
      state.fpsLow1 = 1000 / ms99;
    } catch (_) {}
  }

  function getPerf() {
    const ri = renderer?.info;
    const r = ri ? {
      calls: ri.render.calls,
      triangles: ri.render.triangles,
      lines: ri.render.lines,
      points: ri.render.points,
      geometries: ri.memory.geometries,
      textures: ri.memory.textures
    } : undefined;
    return { fps: state.fps, fpsLow1: state.fpsLow1, ms: state.ms, avgMs: state.avgMs, renderer: r };
  }

  function maybeAutoAdjustVfxQuality() {
    if (!autoAdjust) return;

    try {
      const currentFPS = state.fps || 60;
      const tFPS = targetFPS;

      if (currentFPS < tFPS * 0.85 && window.__vfxQuality !== "low") {
        if (window.__vfxQuality === "high") {
          window.__vfxQuality = "medium";
          console.info(`[Performance] Auto-adjusted VFX quality to medium (FPS: ${currentFPS.toFixed(1)})`);
        } else if (window.__vfxQuality === "medium") {
          window.__vfxQuality = "low";
          console.info(`[Performance] Auto-adjusted VFX quality to low (FPS: ${currentFPS.toFixed(1)})`);
        }
      } else if (currentFPS > tFPS * 1.15 && window.__vfxQuality !== "high") {
        if (window.__vfxQuality === "low") {
          window.__vfxQuality = "medium";
          console.info(`[Performance] Auto-adjusted VFX quality to medium (FPS: ${currentFPS.toFixed(1)})`);
        } else if (window.__vfxQuality === "medium") {
          window.__vfxQuality = "high";
          console.info(`[Performance] Auto-adjusted VFX quality to high (FPS: ${currentFPS.toFixed(1)})`);
        }
      }
    } catch (e) {
      console.warn("Auto-adjust error:", e);
    }
  }

  return {
    update,
    getPerf,
    getFPS() { return state.fps; },
    getFPSLow1() { return state.fpsLow1; },
    getAvgMs() { return state.avgMs; },
    getMs() { return state.ms; },
    getTargetFPS() { return targetFPS; },
    getAutoAdjust() { return autoAdjust; },
    setAutoAdjust(v) { autoAdjust = !!v; },
    maybeAutoAdjustVfxQuality,
  };
}

/**
 * Initialize global VFX gating and return a shouldSpawnVfx(kind, pos) function.
 * - Manages window.__vfxQuality and window.__vfxDistanceCull defaults
 * - Uses tracker FPS to decide whether to allow spawning heavy effects
 */
export function initVfxGating({ camera, isMobile, mobileOpts, initialQuality, tracker }) {
  if (!window.__vfxQuality) {
    window.__vfxQuality = (initialQuality === "low") ? "low" : (isMobile ? "medium" : "high");
  }
  if (!window.__vfxDistanceCull) {
    window.__vfxDistanceCull = isMobile ? (mobileOpts?.vfxDistanceCull ?? 120) : 140;
  }

  function shouldSpawnVfx(kind, pos) {
    try {
      const q = window.__vfxQuality || "high";
      const fpsNow = tracker?.getFPS ? (tracker.getFPS() || 60) : 60;

      // Disallow heavy effects at low quality or very low FPS
      if (q === "low" || fpsNow < 18) return false;

      // Distance cull if position provided (use camera position)
      if (pos && camera && camera.position) {
        const dx = pos.x - camera.position.x;
        const dz = pos.z - camera.position.z;
        const d = Math.hypot(dx, dz);
        if (d > (window.__vfxDistanceCull || 140)) return false;
      }

      // Allow for 'medium' quality but still disallow some heavy kinds
      if (q === "medium") {
        if (kind === "handSpark" || kind === "largeBeam") return false;
      }
      return true;
    } catch (e) {
      return true;
    }
  }

  return shouldSpawnVfx;
}
