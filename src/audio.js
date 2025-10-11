/* Minimal, dependency-free WebAudio system for SFX and ambient music
   - Autoplay-safe: resume AudioContext on first user interaction
   - Procedural SFX (free): fire bursts, booms, hits, strikes, aura blips, etc.
   - Gentle, relaxing generative background music (focus preset)
*/
import { SKILL_SOUNDS, DEFAULT_SOUNDS } from '../config/skills_sound.js';

/**
 * AudioSystem class - Manages all audio functionality including SFX and music
 */
class AudioSystem {
  // Private fields
  #ctx = null;
  #masterGain = null;
  #sfxGain = null;
  #musicGain = null;
  #started = false;
  #enabled = true;
  #audioBufferCache = new Map();
  #shared = {
    noise1s: null,
  };
  #scales = {
    // A minor pentatonic (focus-friendly)
    focus: [220.00, 261.63, 293.66, 329.63, 392.00, 440.00], // A3, C4, D4, E4, G4, A4
  };
  #state = {
    maxSfxVoices: 24,
    activeSfx: new Set(),
    musicTimer: null,
    musicNextTime: 0,
    musicVoices: new Set(),
    musicEnabled: true,
    // Streaming background music (external track)
    streamEl: null,
    streamNode: null,
    streamActive: false,
    streamUsingWebAudio: false,
    _focusHandlersAttached: false,
  };

  constructor() {
    // Constructor is intentionally minimal
    // Audio context is created lazily on first use
  }

  // ============================================================================
  // Core Audio Context Management
  // ============================================================================

  #ensureCtx() {
    if (this.#ctx) return this.#ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) {
      console.warn("[audio] WebAudio not supported.");
      this.#enabled = false;
      return null;
    }
    this.#ctx = new AC();
    this.#masterGain = this.#ctx.createGain();
    this.#sfxGain = this.#ctx.createGain();
    this.#musicGain = this.#ctx.createGain();
    // Tuned defaults (adjustable via setters)
    this.#masterGain.gain.value = 0.9;
    this.#sfxGain.gain.value = 0.5;
    this.#musicGain.gain.value = 0.22;

    this.#sfxGain.connect(this.#masterGain);
    this.#musicGain.connect(this.#masterGain);
    this.#masterGain.connect(this.#ctx.destination);
    return this.#ctx;
  }

  #resume() {
    if (!this.#ctx) this.#ensureCtx();
    if (!this.#ctx) return;
    if (this.#ctx.state === "suspended") {
      this.#ctx.resume().catch(() => { });
    }
  }

  init() {
    if (this.#started) return;
    this.#ensureCtx();
    this.#resume();
    this.#started = true;
  }

  startOnFirstUserGesture(el) {
    if (!el) el = document;
    try { this.attachPageVisibilityHandlers(); } catch (_) { }
    const h = () => {
      try { this.init(); } catch (_) { }
      try {
        el.removeEventListener("click", h, true);
        el.removeEventListener("touchstart", h, true);
        el.removeEventListener("keydown", h, true);
      } catch (_) { }
    };
    el.addEventListener("click", h, true);
    el.addEventListener("touchstart", h, true);
    el.addEventListener("keydown", h, true);
  }

  // ============================================================================
  // Utilities
  // ============================================================================

  #now() {
    this.#ensureCtx();
    return this.#ctx ? this.#ctx.currentTime : 0;
  }

  #createNoiseBuffer(seconds = 1.0) {
    this.#ensureCtx();
    const sampleRate = this.#ctx.sampleRate;
    const frameCount = Math.max(1, Math.floor(seconds * sampleRate));
    const buffer = this.#ctx.createBuffer(1, frameCount, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  #applyEnv(g, t0, a = 0.004, d = 0.08, s = 0.0, r = 0.08, peak = 1.0) {
    // Simple ADSR on linearGain
    g.gain.cancelScheduledValues(t0);
    g.gain.setValueAtTime(0.00001, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + a);
    const sustainTime = t0 + a + d;
    const sustainLevel = Math.max(0, s);
    g.gain.linearRampToValueAtTime(sustainLevel, sustainTime);
    // Caller should schedule stop and ramp to 0
    return sustainTime + r;
  }

  #withVoiceCleanup(node, stopAt, collection) {
    try {
      collection.add(node);
      node.onended = () => {
        try { collection.delete(node); } catch (_) { }
      };
      node.stop(stopAt);
    } catch (_) { }
  }

  #tooManySfx() {
    return this.#state.activeSfx.size >= this.#state.maxSfxVoices;
  }

  // ============================================================================
  // Procedural Sound Effects - Basic Building Blocks
  // ============================================================================

  #playZap({ freqStart = 1100, freqEnd = 420, dur = 0.12, color = "bandpass", q = 8, gain = 0.7 } = {}) {
    if (!this.#enabled) return;
    this.#ensureCtx(); this.#resume();
    if (!this.#ctx) return;
    if (this.#tooManySfx()) return;

    const t0 = this.#now() + 0.001;
    const osc = this.#ctx.createOscillator();
    osc.type = "square";
    osc.frequency.setValueAtTime(freqStart, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(50, freqEnd), t0 + dur);

    const filt = this.#ctx.createBiquadFilter();
    filt.type = color;
    filt.frequency.value = Math.max(200, Math.min(4000, freqStart));
    filt.Q.value = q;

    const g = this.#ctx.createGain();
    this.#applyEnv(g, t0, 0.002, dur * 0.7, 0.0, Math.max(0.04, dur * 0.3), gain);

    osc.connect(filt);
    filt.connect(g);
    g.connect(this.#sfxGain);

    const stopAt = t0 + dur + 0.1;
    try { osc.start(t0); } catch (_) { }
    this.#withVoiceCleanup(osc, stopAt, this.#state.activeSfx);
  }

  #playNoiseBurst({ dur = 0.18, type = "lowpass", cutoff = 500, q = 0.5, gain = 0.6 } = {}) {
    if (!this.#enabled) return;
    this.#ensureCtx(); this.#resume();
    if (!this.#ctx) return;
    if (!this.#shared.noise1s) this.#shared.noise1s = this.#createNoiseBuffer(1.0);
    if (this.#tooManySfx()) return;

    const t0 = this.#now() + 0.001;
    const src = this.#ctx.createBufferSource();
    src.buffer = this.#shared.noise1s;
    src.loop = true;

    const filt = this.#ctx.createBiquadFilter();
    filt.type = type;
    filt.frequency.value = cutoff;
    filt.Q.value = q;

    const g = this.#ctx.createGain();
    this.#applyEnv(g, t0, 0.004, dur * 0.6, 0.0, Math.max(0.05, dur * 0.4), gain);

    src.connect(filt);
    filt.connect(g);
    g.connect(this.#sfxGain);

    const stopAt = t0 + dur + 0.12;
    try { src.start(t0); } catch (_) { }
    this.#withVoiceCleanup(src, stopAt, this.#state.activeSfx);
  }

  #playBlip({ freq = 400, dur = 0.06, gain = 0.35 } = {}) {
    if (!this.#enabled) return;
    this.#ensureCtx(); this.#resume();
    if (!this.#ctx) return;
    if (this.#tooManySfx()) return;

    const t0 = this.#now() + 0.001;
    const osc = this.#ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, t0);

    const g = this.#ctx.createGain();
    this.#applyEnv(g, t0, 0.002, dur * 0.5, 0.0, Math.max(0.03, dur * 0.5), gain);

    osc.connect(g);
    g.connect(this.#sfxGain);

    const stopAt = t0 + dur + 0.1;
    try { osc.start(t0); } catch (_) { }
    this.#withVoiceCleanup(osc, stopAt, this.#state.activeSfx);
  }

  #playStrike() {
    this.#playNoiseBurst({ dur: 0.12, type: "highpass", cutoff: 1200, q: 0.6, gain: 0.35 });
    this.#playBlip({ freq: 1300, dur: 0.05, gain: 0.25 });
  }

  #playBoom() {
    this.#playNoiseBurst({ dur: 0.28, type: "lowpass", cutoff: 380, q: 0.7, gain: 0.65 });
  }

  // ============================================================================
  // High-Level SFX API
  // ============================================================================

  sfx(name, opts = {}) {
    if (!this.#enabled) return;

    // First, check if there's a configuration in SKILL_SOUNDS
    let soundConfig = SKILL_SOUNDS[name] || DEFAULT_SOUNDS[name];

    // If we have a configuration, play it
    if (soundConfig) {
      // Handle array of sounds (play all simultaneously)
      if (Array.isArray(soundConfig)) {
        for (const config of soundConfig) {
          this.#playProceduralSound(config, opts);
        }
      } else {
        this.#playProceduralSound(soundConfig, opts);
      }
      return;
    }

    return this.#playStrike();
  }

  // ============================================================================
  // Skills Sound System - Dynamic sound playback based on skill ID
  // ============================================================================

  /**
   * Load an audio file and decode it into an AudioBuffer
   * @param {string} url - URL to the audio file
   * @returns {Promise<AudioBuffer>}
   */
  async #loadAudioBuffer(url) {
    if (this.#audioBufferCache.has(url)) {
      return this.#audioBufferCache.get(url);
    }

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.#ctx.decodeAudioData(arrayBuffer);
      this.#audioBufferCache.set(url, audioBuffer);
      return audioBuffer;
    } catch (error) {
      console.warn(`[audio] Failed to load audio: ${url}`, error);
      return null;
    }
  }

  /**
   * Play an audio buffer (MP3 file)
   * @param {AudioBuffer} buffer
   * @param {number} gain - Volume (0-1)
   */
  #playAudioBuffer(buffer, gain = 0.7) {
    if (!buffer || !this.#ctx) return;

    const source = this.#ctx.createBufferSource();
    source.buffer = buffer;

    const g = this.#ctx.createGain();
    g.gain.value = gain;

    source.connect(g);
    g.connect(this.#sfxGain);

    try { source.start(0); } catch (_) { }
  }

  /**
   * Play a procedural sound based on configuration object
   * @param {object} config - Sound configuration from SKILL_SOUNDS
   * @param {object} opts - Optional overrides
   */
  #playProceduralSound(config, opts = {}) {
    const merged = { ...config, ...opts };

    switch (merged.type) {
      case "zap":
        this.#playZap({
          freqStart: merged.freqStart,
          freqEnd: merged.freqEnd,
          dur: merged.dur,
          color: merged.color || "bandpass",
          q: merged.q || 8,
          gain: merged.gain || 0.7
        });
        break;

      case "noiseBurst":
        this.#playNoiseBurst({
          dur: merged.dur,
          type: merged.filterType || "lowpass",
          cutoff: merged.cutoff,
          q: merged.q,
          gain: merged.gain
        });
        break;

      case "blip":
        this.#playBlip({
          freq: merged.freq,
          dur: merged.dur,
          gain: merged.gain
        });
        break;

      case "strike":
        this.#playStrike();
        break;

      case "boom":
        this.#playBoom();
        break;

      default:
        console.warn(`[audio] Unknown procedural sound type: ${merged.type}`);
    }
  }

  /**
   * Play a sound for a skill based on its ID and configuration
   * @param {string} skillId - The skill ID (e.g., "flame_chain", "inferno_blast")
   * @param {object} soundConfig - Sound configuration from SKILL_SOUNDS
   * @param {object} opts - Optional overrides for procedural sounds
   */
  async playSkillSound(skillId, soundConfig, opts = {}) {
    if (!this.#enabled) return;
    this.#ensureCtx(); this.#resume();
    if (!this.#ctx) return;

    if (!soundConfig) {
      // Fallback to generic cast sound
      this.sfx("cast", opts);
      return;
    }

    // Handle string (MP3 URL)
    if (typeof soundConfig === "string") {
      const buffer = await this.#loadAudioBuffer(soundConfig);
      if (buffer) {
        this.#playAudioBuffer(buffer, opts.gain || 0.7);
      }
      return;
    }

    // Handle array (multiple sounds)
    if (Array.isArray(soundConfig)) {
      for (const config of soundConfig) {
        if (typeof config === "string") {
          const buffer = await this.#loadAudioBuffer(config);
          if (buffer) {
            this.#playAudioBuffer(buffer, opts.gain || 0.7);
          }
        } else {
          this.#playProceduralSound(config, opts);
        }
      }
      return;
    }

    // Handle object (procedural sound)
    if (typeof soundConfig === "object") {
      this.#playProceduralSound(soundConfig, opts);
      return;
    }
  }

  /**
   * Preload audio files for skills that use MP3s
   * @param {Array} soundConfigs - Array of sound configurations
   */
  async preloadSkillSounds(soundConfigs) {
    const promises = [];

    for (const soundConfig of soundConfigs) {
      if (typeof soundConfig === "string") {
        promises.push(this.#loadAudioBuffer(soundConfig));
      } else if (Array.isArray(soundConfig)) {
        for (const config of soundConfig) {
          if (typeof config === "string") {
            promises.push(this.#loadAudioBuffer(config));
          }
        }
      }
    }

    await Promise.all(promises);
  }

  /**
   * Clear the audio buffer cache
   */
  clearAudioCache() {
    this.#audioBufferCache.clear();
  }

  // ============================================================================
  // Generative Background Music
  // ============================================================================

  startMusic(preset = "focus") {
    if (!this.#state.musicEnabled) return;
    this.#ensureCtx(); this.#resume();
    if (!this.#ctx) return;
    if (this.#state.musicTimer) return; // already running

    const scale = this.#scales[preset] || this.#scales.focus;
    const bpm = 48; // slow
    const beat = 60 / bpm; // seconds per beat
    const bar = beat * 4;
    const scheduleHorizon = 2.5; // seconds

    this.#state.musicNextTime = this.#now();

    const scheduleNote = (freq, start, dur, gain = 0.05) => {
      const osc = this.#ctx.createOscillator();
      // Soft triangle/sine hybrid using two layers for richness
      osc.type = "sine";
      const det = this.#ctx.createOscillator();
      det.type = "triangle";

      const mix = this.#ctx.createGain();
      const g = this.#ctx.createGain();
      const lp = this.#ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 1800;
      lp.Q.value = 0.2;

      osc.frequency.setValueAtTime(freq, start);
      det.frequency.setValueAtTime(freq * 0.5, start); // sub tone

      mix.gain.value = 0.5;
      det.connect(mix);
      osc.connect(mix);
      mix.connect(lp);
      lp.connect(g);
      g.connect(this.#musicGain);

      // Long fade envelope
      const a = Math.min(0.2, dur * 0.25);
      const r = Math.min(0.5, dur * 0.6);
      g.gain.setValueAtTime(0.0001, start);
      g.gain.linearRampToValueAtTime(gain, start + a);
      g.gain.linearRampToValueAtTime(gain * 0.7, start + dur - r);
      g.gain.linearRampToValueAtTime(0.0001, start + dur);

      try { osc.start(start); det.start(start); } catch (_) { }
      const stopAt = start + dur + 0.05;
      try {
        osc.stop(stopAt);
        det.stop(stopAt);
      } catch (_) { }

      // Clean-up tracking
      this.#state.musicVoices.add(osc);
      osc.onended = () => { this.#state.musicVoices.delete(osc); };
      this.#state.musicVoices.add(det);
      det.onended = () => { this.#state.musicVoices.delete(det); };
    };

    const scheduler = () => {
      const tNow = this.#now();
      while (this.#state.musicNextTime < tNow + scheduleHorizon) {
        // Every bar, pick a chord center from the scale
        const base = scale[Math.floor(Math.random() * scale.length)];
        // Schedule 2-3 overlapping slow notes per bar
        const voices = 2 + (Math.random() < 0.3 ? 1 : 0);
        for (let v = 0; v < voices; v++) {
          const pick = base * Math.pow(2, (Math.floor(Math.random() * 5) - 2) / 12); // slight spread
          const dur = bar * (1.2 + Math.random() * 0.8);
          const offset = beat * (v * 0.5 + Math.random() * 0.3);
          scheduleNote(pick, this.#state.musicNextTime + offset, dur, 0.035 + Math.random() * 0.02);
        }
        this.#state.musicNextTime += bar;
      }
    };

    scheduler();
    this.#state.musicTimer = setInterval(scheduler, 300);
  }

  stopMusic() {
    if (this.#state.musicTimer) {
      clearInterval(this.#state.musicTimer);
      this.#state.musicTimer = null;
    }
    // Stop all music voices
    for (const node of this.#state.musicVoices) {
      try { node.stop(); } catch (_) { }
    }
    this.#state.musicVoices.clear();
  }

  // ============================================================================
  // Streamed Background Music
  // ============================================================================

  startStreamMusic(url, opts = {}) {
    if (!this.#state.musicEnabled) return;
    this.#ensureCtx(); this.#resume();
    if (!this.#ctx) return;

    // stop generative music if running
    if (this.#state.musicTimer) {
      clearInterval(this.#state.musicTimer);
      this.#state.musicTimer = null;
    }
    // stop previous stream if any
    try { this.stopStreamMusic(); } catch (_) { }

    const loop = opts.loop !== undefined ? !!opts.loop : true;
    const vol = typeof opts.volume === "number" ? Math.max(0, Math.min(1, opts.volume)) : 0.3;

    const el = new Audio();
    el.src = url;
    el.preload = "auto";
    el.loop = loop;
    el.crossOrigin = "anonymous";

    let usingWebAudio = false;
    try {
      const node = this.#ctx.createMediaElementSource(el);
      node.connect(this.#musicGain);
      el.volume = 1.0; // use musicGain for volume when connected
      this.#state.streamNode = node;
      usingWebAudio = true;
    } catch (e) {
      // Fallback to element volume control (e.g., if no CORS)
      el.volume = vol;
      usingWebAudio = false;
      console.warn("[audio] MediaElementSource fallback (likely no CORS): using element volume");
    }

    this.#state.streamEl = el;
    this.#state.streamUsingWebAudio = usingWebAudio;
    this.#state.streamActive = true;

    // If using WebAudio path, set gain based on requested volume
    if (usingWebAudio) {
      this.setMusicVolume(vol);
    }

    el.play().catch(() => {
      // Will succeed after a user gesture
    });
  }

  stopStreamMusic() {
    try {
      if (this.#state.streamEl) {
        try { this.#state.streamEl.pause(); } catch (_) { }
        try { this.#state.streamEl.src = ""; } catch (_) { }
      }
      if (this.#state.streamNode) {
        try { this.#state.streamNode.disconnect(); } catch (_) { }
      }
    } finally {
      this.#state.streamEl = null;
      this.#state.streamNode = null;
      this.#state.streamActive = false;
      this.#state.streamUsingWebAudio = false;
    }
  }

  isMusicActive() {
    try {
      if (this.#state.musicTimer) return true;
      if (this.#state.streamEl) return !this.#state.streamEl.paused;
    } catch (_) { }
    return false;
  }

  ensureBackgroundMusic(url = null, opts = {}) {
    if (!this.#state.musicEnabled) return;
    this.#ensureCtx(); this.#resume();
    if (url) {
      if (this.#state.streamEl) {
        const same =
          typeof this.#state.streamEl.src === "string" &&
          (this.#state.streamEl.src.indexOf(url) !== -1 || this.#state.streamEl.src === url);
        if (same) {
          try {
            if (typeof opts.volume === "number") this.setMusicVolume(opts.volume);
          } catch (_) { }
          try {
            if (opts.loop !== undefined) this.#state.streamEl.loop = !!opts.loop;
          } catch (_) { }
          try {
            if (this.#state.streamEl.paused) this.#state.streamEl.play().catch(() => { });
          } catch (_) { }
        } else {
          this.startStreamMusic(url, opts);
        }
      } else {
        this.startStreamMusic(url, opts);
      }
    } else {
      if (this.#state.streamEl) {
        try {
          if (this.#state.streamEl.paused) this.#state.streamEl.play().catch(() => { });
        } catch (_) { }
      } else if (!this.#state.musicTimer) {
        this.startMusic();
      }
    }
  }

  // ============================================================================
  // Volume and Settings Controls
  // ============================================================================

  setEnabled(v) {
    this.#enabled = !!v;
  }

  setSfxVolume(v) {
    this.#ensureCtx();
    if (this.#sfxGain) this.#sfxGain.gain.value = Math.max(0, Math.min(1, Number(v)));
  }

  setMusicVolume(v) {
    this.#ensureCtx();
    const vol = Math.max(0, Math.min(1, Number(v)));
    if (this.#musicGain) this.#musicGain.gain.value = vol;
    // If streaming without WebAudio connection, set element volume directly
    if (this.#state.streamEl && !this.#state.streamUsingWebAudio) {
      try { this.#state.streamEl.volume = vol; } catch (_) { }
    }
  }

  // ============================================================================
  // Page Visibility Handlers
  // ============================================================================

  pauseForBackground() {
    try {
      this.#ensureCtx();
      if (this.#ctx && this.#ctx.state !== "suspended") this.#ctx.suspend();
    } catch (_) { }
    // Pause streaming element to stop network/decoding while in background
    try { if (this.#state.streamEl) this.#state.streamEl.pause(); } catch (_) { }
  }

  resumeFromForeground() {
    try { this.#ensureCtx(); this.#resume(); } catch (_) { }
    // Resume streamed element if active
    try {
      if (this.#state.streamEl) {
        const p = this.#state.streamEl.play();
        if (p && typeof p.catch === "function") p.catch(() => { });
      }
    } catch (_) { }
  }

  attachPageVisibilityHandlers() {
    if (this.#state._focusHandlersAttached) return;
    this.#state._focusHandlersAttached = true;

    const onHide = () => { this.pauseForBackground(); };
    const onShow = () => { this.resumeFromForeground(); };

    // Only react to actual page/tab visibility changes.
    // Do NOT pause on window blur/focus, which can occur during in-app UI interactions.
    try {
      document.addEventListener(
        "visibilitychange",
        () => {
          if (document.visibilityState === "hidden") onHide();
          else onShow();
        },
        true
      );
    } catch (_) { }

    // Optionally handle page lifecycle events (e.g., bfcache)
    try { window.addEventListener("pagehide", onHide, true); } catch (_) { }
    try { window.addEventListener("pageshow", onShow, true); } catch (_) { }
  }
}

// Export singleton instance for backward compatibility
export const audio = new AudioSystem();
