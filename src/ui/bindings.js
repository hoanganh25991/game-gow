/**
 * UI Bindings Module
 * Encapsulates DOM event wiring for:
 * - Environment controls (rain toggle, density, rain level)
 * - Render quality select and zoom slider
 * - Audio toggles (music, SFX)
 *
 * Public API:
 *   wireUIBindings({
 *     storageKey,
 *     scene,
 *     player,
 *     ENV_PRESETS,
 *     initEnvironment,
 *     updateEnvironmentFollow,
 *     envAccess: { get: () => ({ env, envRainState, envDensityIndex, envRainLevel }),
 *                  set: (st) => { env = st.env; envRainState = st.envRainState; ... } },
 *     renderQualityRef: { get: () => renderQuality, set: (q) => { renderQuality = q; } },
 *     cameraOffset,
 *     baseCameraOffset,
 *     audioCtl, // { getMusicEnabled, setMusicEnabled, getSfxEnabled, setSfxEnabled }
 *     audio    // audio instance for immediate reactions
 *   })
 */
export function wireUIBindings(params) {
  const {
    storageKey,
    scene,
    getPlayer,
    ENV_PRESETS,
    initEnvironment,
    updateEnvironmentFollow,
    envAccess,
    renderQualityRef,
    cameraOffset,
    baseCameraOffset,
    audioCtl,
    audio,
  } = params || {};

  // Defensive guards
  if (!envAccess || typeof envAccess.get !== 'function' || typeof envAccess.set !== 'function') {
    console.warn('[ui/bindings] Missing envAccess get/set; aborting wiring');
    return;
  }
  if (!renderQualityRef || typeof renderQualityRef.get !== 'function' || typeof renderQualityRef.set !== 'function') {
    console.warn('[ui/bindings] Missing renderQualityRef get/set; aborting wiring');
    return;
  }

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // 1) Environment controls: #envRainToggle, #envDensity
  try {
    const envRainToggle = document.getElementById('envRainToggle');
    const envDensity = document.getElementById('envDensity');

    if (envRainToggle && !envRainToggle.dataset.bound) {
      const { envRainState } = envAccess.get();
      envRainToggle.checked = !!envRainState;
      envRainToggle.addEventListener('change', (ev) => {
        const state = envAccess.get();
        state.envRainState = !!ev.target.checked;
        try {
          if (state.env && typeof state.env.toggleRain === 'function') {
            state.env.toggleRain(state.envRainState);
          }
          if (state.envRainState && state.env && typeof state.env.setRainLevel === 'function') {
            state.env.setRainLevel(clamp(state.envRainLevel, 0, 2));
          }
        } catch (_) {}
        envAccess.set(state);
        try {
          localStorage.setItem(
            storageKey('envPrefs'),
            JSON.stringify({
              rain: state.envRainState,
              density: state.envDensityIndex,
              rainLevel: state.envRainLevel,
            })
          );
        } catch (_) {}
      });
      envRainToggle.dataset.bound = '1';
    }

    if (envDensity && !envDensity.dataset.bound) {
      const state = envAccess.get();
      // initial UI value 1..10 mapped from index
      const len = ENV_PRESETS.length;
      const idx = clamp(state.envDensityIndex, 0, len - 1);
      const uiVal = 1 + Math.round((idx / Math.max(1, len - 1)) * 9);
      envDensity.value = String(uiVal);

      const onEnvDensityChange = (ev) => {
        const s = envAccess.get();
        const vv = parseInt(ev.target.value, 10);
        const len = ENV_PRESETS.length;
        const ui = clamp(Number.isFinite(vv) ? vv : 5, 1, 10);
        s.envDensityIndex = clamp(Math.round(((ui - 1) / 9) * (len - 1)), 0, len - 1);
        const preset = ENV_PRESETS[s.envDensityIndex];

        // Recreate environment with new density while preserving rain state/level
        try {
          if (s.env && s.env.root && s.env.root.parent) s.env.root.parent.remove(s.env.root);
        } catch (_) {}
        s.env = initEnvironment(scene, Object.assign({}, preset, { enableRain: s.envRainState, quality: renderQualityRef.get() }));
          try {
            if (s.envRainState && s.env && typeof s.env.setRainLevel === 'function') {
              s.env.setRainLevel(clamp(s.envRainLevel, 0, 2));
            }
            // getPlayer is provided by caller to avoid TDZ; call it at runtime
            try { updateEnvironmentFollow(s.env, (typeof getPlayer === 'function' ? getPlayer() : player)); } catch (_) {}
          } catch (_) {}
        envAccess.set(s);
        try {
          localStorage.setItem(
            storageKey('envPrefs'),
            JSON.stringify({
              rain: s.envRainState,
              density: s.envDensityIndex,
              rainLevel: s.envRainLevel,
            })
          );
        } catch (_) {}
      };
      envDensity.addEventListener('change', onEnvDensityChange);
      envDensity.dataset.bound = '1';
    }
  } catch (_) {}

  // 2) Rain density slider (0=low,1=med,2=high) -> #rainDensity
  try {
    const rainDensity = document.getElementById('rainDensity');
    if (rainDensity && !rainDensity.dataset.bound) {
      const state = envAccess.get();
      const lvl = clamp(Number.isFinite(parseInt(state.envRainLevel, 10)) ? parseInt(state.envRainLevel, 10) : 1, 0, 2);
      const uiVal = 1 + Math.round((lvl / 2) * 9);
      try { rainDensity.value = String(uiVal); } catch (_) {}

      const onRainDensityChange = (ev) => {
        const s = envAccess.get();
        const vv = parseInt(ev.target.value, 10);
        const ui = clamp(Number.isFinite(vv) ? vv : 5, 1, 10);
        s.envRainLevel = clamp(Math.round(((ui - 1) / 9) * 2), 0, 2);
        try { s.env && typeof s.env.setRainLevel === 'function' && s.env.setRainLevel(s.envRainLevel); } catch (_) {}
        envAccess.set(s);
        try {
          localStorage.setItem(
            storageKey('envPrefs'),
            JSON.stringify({
              rain: s.envRainState,
              density: s.envDensityIndex,
              rainLevel: s.envRainLevel,
            })
          );
        } catch (_) {}
      };
      rainDensity.addEventListener('change', onRainDensityChange);
      rainDensity.dataset.bound = '1';
    }
  } catch (_) {}

  // 3) Render quality select (#qualitySelect) with reload
  try {
    const sel = document.getElementById('qualitySelect');
    if (sel && !sel.dataset.bound) {
      // Initialize from persisted prefs or current
      let q = renderQualityRef.get();
      try {
        const prefs = JSON.parse(localStorage.getItem(storageKey('renderPrefs')) || '{}');
        if (prefs && typeof prefs.quality === 'string') q = prefs.quality;
      } catch (_) {}
      if (q !== 'low' && q !== 'medium' && q !== 'high') q = 'high';
      try { sel.value = q; } catch (_) {}

      sel.addEventListener('change', () => {
        const v = String(sel.value || 'high').toLowerCase();
        const valid = v === 'low' || v === 'medium' || v === 'high';
        const nextQ = valid ? v : 'high';
        // Persist and reload
        try {
          const prev = JSON.parse(localStorage.getItem(storageKey('renderPrefs')) || '{}');
          prev.quality = nextQ;
          localStorage.setItem(storageKey('renderPrefs'), JSON.stringify(prev));
        } catch (_) {}
        try { localStorage.setItem(storageKey('pendingReloadReason'), 'quality-change'); } catch (_) {}
        window.location.reload();
      });
      sel.dataset.bound = '1';
    }
  } catch (_) {}

  // 4) Zoom slider (#zoomSlider) 0.6..1.6
  try {
    const sel = document.getElementById('zoomSlider');
    if (sel && !sel.dataset.bound) {
      // Initialize from persisted prefs or default 0.6 + (1/9)*1.0
      let z = 0.6 + (1 / 9) * 1.0;
      try {
        const prefs = JSON.parse(localStorage.getItem(storageKey('renderPrefs')) || '{}');
        if (typeof prefs.zoom === 'number') z = prefs.zoom;
      } catch (_) {}
      z = clamp(Number.isFinite(parseFloat(z)) ? parseFloat(z) : (0.6 + (1 / 9) * 1.0), 0.6, 1.6);
      try {
        const uiVal = 1 + Math.round(((z - 0.6) / 1.0) * 9);
        sel.value = String(clamp(uiVal, 1, 10));
      } catch (_) {}
      // Apply immediately
      try { cameraOffset.copy(baseCameraOffset.clone().multiplyScalar(z)); } catch (_) {}

      const onChange = () => {
        const ui = clamp(parseInt(sel.value, 10) || 5, 1, 10);
        const zoom = 0.6 + ((ui - 1) / 9) * 1.0;
        try { cameraOffset.copy(baseCameraOffset.clone().multiplyScalar(zoom)); } catch (_) {}
        try {
          const prev = JSON.parse(localStorage.getItem(storageKey('renderPrefs')) || '{}');
          prev.zoom = zoom;
          localStorage.setItem(storageKey('renderPrefs'), JSON.stringify(prev));
        } catch (_) {}
      };
      sel.addEventListener('change', onChange);
      sel.dataset.bound = '1';
    }
  } catch (_) {}

  // 5) Audio toggles (#musicToggle, #sfxToggle)
  try {
    const musicToggle = document.getElementById('musicToggle');
    if (musicToggle && !musicToggle.dataset.bound) {
      musicToggle.checked = !!audioCtl.getMusicEnabled();
      musicToggle.addEventListener('change', () => {
        const enabled = !!musicToggle.checked;
        try { audioCtl.setMusicEnabled(enabled); } catch (_) {}
        if (enabled) {
          try { audio.ensureBackgroundMusic('audio/earth-space-music-313081.mp3', { volume: 0.35, loop: true }); }
          catch (e) { try { audio.setMusicVolume(0.35); audio.startMusic(); } catch (_) {} }
        } else {
          try { audio.stopStreamMusic(); } catch (_) {}
          try { audio.stopMusic(); } catch (_) {}
          try { audio.setMusicVolume(0); } catch (_) {}
        }
      });
      musicToggle.dataset.bound = '1';
    }

    const sfxToggle = document.getElementById('sfxToggle');
    if (sfxToggle && !sfxToggle.dataset.bound) {
      sfxToggle.checked = !!audioCtl.getSfxEnabled();
      sfxToggle.addEventListener('change', () => {
        const enabled = !!sfxToggle.checked;
        try { audioCtl.setSfxEnabled(enabled); } catch (_) {}
        try { audio.setSfxVolume(enabled ? 0.5 : 0.0); } catch (_) {}
      });
      sfxToggle.dataset.bound = '1';
    }
  } catch (_) {}
}
