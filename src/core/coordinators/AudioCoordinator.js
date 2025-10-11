/**
 * AudioCoordinator - Manages audio initialization and controls
 */

export class AudioCoordinator {
  constructor({ audio, settingsManager }) {
    this.audio = audio;
    this.settingsManager = settingsManager;
    this._musicStarted = false;
  }

  /**
   * Initialize audio system with user gesture handling
   */
  init() {
    this.audio.startOnFirstUserGesture(document);
    
    const sfxEnabled = this.settingsManager.isSfxEnabled();
    const musicEnabled = this.settingsManager.isMusicEnabled();
    
    try {
      this.audio.setSfxVolume(sfxEnabled ? 0.5 : 0.0);
    } catch (_) {}

    if (musicEnabled) {
      this._setupMusicTriggers();
    }
  }

  /**
   * Create audio controller for settings UI
   */
  createAudioController() {
    return {
      audio: this.audio,
      getMusicEnabled: () => this.settingsManager.isMusicEnabled(),
      setMusicEnabled: (enabled) => {
        this.settingsManager.setMusicEnabled(enabled);
        if (enabled && !this.audio.isPlaying()) {
          this._startBackgroundMusic();
        } else if (!enabled) {
          this.audio.stopMusic();
        }
      },
      getSfxEnabled: () => this.settingsManager.isSfxEnabled(),
      setSfxEnabled: (enabled) => {
        this.settingsManager.setSfxEnabled(enabled);
        this.audio.setSfxVolume(enabled ? 0.5 : 0.0);
      },
    };
  }

  /**
   * Ensure background music is playing
   */
  ensureBackgroundMusic() {
    if (this.settingsManager.isMusicEnabled()) {
      try {
        this._startBackgroundMusic();
      } catch (_) {}
    }
  }

  _startBackgroundMusic() {
    try {
      this.audio.ensureBackgroundMusic("audio/earth-space-music-313081.mp3", { 
        volume: 0.35, 
        loop: true 
      });
    } catch (e) {
      try {
        this.audio.setMusicVolume(0.35);
        this.audio.startMusic();
      } catch (_) {}
    }
  }

  _setupMusicTriggers() {
    const startMusicOnce = () => {
      if (!this.settingsManager.isMusicEnabled() || this._musicStarted) return;
      
      this._startBackgroundMusic();
      this._musicStarted = true;
      
      try {
        document.removeEventListener("click", startMusicOnce, true);
        document.removeEventListener("touchstart", startMusicOnce, true);
        document.removeEventListener("keydown", startMusicOnce, true);
      } catch (_) {}
    };

    document.addEventListener("click", startMusicOnce, true);
    document.addEventListener("touchstart", startMusicOnce, true);
    document.addEventListener("keydown", startMusicOnce, true);
  }
}
