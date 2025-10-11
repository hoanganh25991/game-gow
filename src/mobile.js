// Platform and performance configuration for mobile devices

// Detect mobile/touch devices conservatively
export const isMobile = (() => {
  try {
    const hasTouchScreen = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    const mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isSmallScreen = window.innerWidth <= 1024;
    return hasTouchScreen && (mobileUA || isSmallScreen);
  } catch (_) {
    return false;
  }
})();

// Mobile-specific performance settings - Aggressive CPU-to-GPU optimizations
export const MOBILE_OPTIMIZATIONS = {
  maxPixelRatio: 1.5,           // Cap pixel ratio to reduce GPU load
  enemyCountMultiplier: 0.3,    // Reduce enemy count by 70%
  vfxDistanceCull: 60,          // Aggressive VFX culling
  hudUpdateMs: 300,             // Slower HUD updates
  minimapUpdateMs: 400,         // Slower minimap updates
  aiStrideMultiplier: 3,        // Much more AI throttling
  frameBudgetMs: 6.0,           // Tight frame budget for 60fps
  envDensityReduction: 0.4,     // Reduce environment density
  disableShadows: true,         // Disable shadows (CPU/GPU intensive)
  reduceDrawCalls: true,        // Merge geometries where possible
  cullDistance: 100,            // Freeze enemies beyond this distance
  skipSlowUpdates: true,        // Skip slow debuff indicators
  simplifyMaterials: true,      // Use simpler materials
  disableRain: true,            // Rain is very expensive
};

/**
 * Apply mobile GPU/CPU optimizations on renderer where applicable.
 * Safe to call on desktop; it will be a no-op except logging.
 */
export function applyMobileRendererHints(renderer, { quality }) {
  if (!isMobile || !renderer || quality == "high") return;
  try {
    console.log("[Mobile] Apply renderer hints", { quality })
    const currentRatio = renderer.getPixelRatio();
    const maxRatio = MOBILE_OPTIMIZATIONS.maxPixelRatio;
    if (currentRatio > maxRatio) {
      renderer.setPixelRatio(Math.min(currentRatio, maxRatio));
      console.info(`[Mobile] Capped pixel ratio: ${currentRatio.toFixed(2)} -> ${maxRatio}`);
    }
    if (MOBILE_OPTIMIZATIONS.disableShadows) {
      renderer.shadowMap.enabled = false;
      console.info('[Mobile] Disabled shadows for performance');
    }
    try {
      const gl = renderer.getContext();
      if (gl) {
        // Context already created, log preference if needed
        console.info('[Mobile] GPU power preference: high-performance');
      }
    } catch (_) { }
  } catch (_) { }
}

/**
 * Utility to expose commonly tuned values for UI/debug.
 * This keeps a single source-of-truth for mobile tuning knobs.
 */
export function getMobileTuning() {
  return { ...MOBILE_OPTIMIZATIONS };
}
