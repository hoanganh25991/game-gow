/**
 * SettingsManager
 * Manages all game settings including audio, render quality, environment preferences,
 * and language. Handles persistence to localStorage.
 *
 * Public API:
 *   const settings = new SettingsManager({ storageKey, isMobile, MOBILE_OPTIMIZATIONS });
 *   settings.getAudioSettings();
 *   settings.setMusicEnabled(true);
 *   settings.getRenderQuality();
 *   settings.setRenderQuality('high');
 *   settings.getEnvironmentSettings();
 *   settings.setEnvironmentDensity(1);
 */
export class SettingsManager {
  // Private fields
  #storageKey;
  #isMobile;
  #MOBILE_OPTIMIZATIONS;

  // Settings state
  #audioSettings = { music: true, sfx: true };
  #renderSettings = { quality: 'high' };
  #environmentSettings = { density: 1, rain: false, rainLevel: 1 };
  #language = 'vi'; // Default language

  // Storage keys
  #AUDIO_PREFS_KEY;
  #RENDER_PREFS_KEY;
  #ENV_PREFS_KEY;
  #LANG_KEY;

  constructor({ storageKey, isMobile = false, MOBILE_OPTIMIZATIONS = {} }) {
    this.#storageKey = storageKey;
    this.#isMobile = isMobile;
    this.#MOBILE_OPTIMIZATIONS = MOBILE_OPTIMIZATIONS;

    // Initialize storage keys
    this.#AUDIO_PREFS_KEY = storageKey('audioPrefs');
    this.#RENDER_PREFS_KEY = storageKey('renderPrefs');
    this.#ENV_PREFS_KEY = storageKey('envPrefs');
    this.#LANG_KEY = storageKey('language');

    // Load settings from localStorage
    this.#loadAllSettings();
  }

  /**
   * Load all settings from localStorage
   * @private
   */
  #loadAllSettings() {
    this.#loadAudioSettings();
    this.#loadRenderSettings();
    this.#loadEnvironmentSettings();
    this.#loadLanguage();
  }

  /**
   * Load audio settings from localStorage
   * @private
   */
  #loadAudioSettings() {
    try {
      const stored = localStorage.getItem(this.#AUDIO_PREFS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.#audioSettings = {
          music: parsed.music !== false,
          sfx: parsed.sfx !== false
        };
      }
    } catch (err) {
      console.warn('[SettingsManager] Failed to load audio settings:', err);
    }
  }

  /**
   * Load render settings from localStorage
   * @private
   */
  #loadRenderSettings() {
    try {
      const stored = localStorage.getItem(this.#RENDER_PREFS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (['low', 'medium', 'high'].includes(parsed.quality)) {
          this.#renderSettings.quality = parsed.quality;
        }
      } else if (this.#isMobile) {
        // Default to medium on mobile for first run
        this.#renderSettings.quality = 'medium';
        this.#saveRenderSettings();
      }
    } catch (err) {
      console.warn('[SettingsManager] Failed to load render settings:', err);
    }
  }

  /**
   * Load environment settings from localStorage
   * @private
   */
  #loadEnvironmentSettings() {
    try {
      const stored = localStorage.getItem(this.#ENV_PREFS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.#environmentSettings = {
          density: Number.isFinite(parseInt(parsed.density, 10)) ? parseInt(parsed.density, 10) : 1,
          rain: !!parsed.rain,
          rainLevel: Number.isFinite(parseInt(parsed.rainLevel, 10)) ? parseInt(parsed.rainLevel, 10) : 1
        };
      } else {
        // Mobile: Disable rain by default if configured (only when no saved preference exists)
        if (this.#isMobile && this.#MOBILE_OPTIMIZATIONS.disableRain) {
          this.#environmentSettings.rain = false;
        }
      }
    } catch (err) {
      console.warn('[SettingsManager] Failed to load environment settings:', err);
    }
  }

  /**
   * Load language from localStorage
   * @private
   */
  #loadLanguage() {
    try {
      const stored = localStorage.getItem(this.#LANG_KEY);
      if (stored && ['vi', 'en'].includes(stored)) {
        this.#language = stored;
      }
    } catch (err) {
      console.warn('[SettingsManager] Failed to load language:', err);
    }
  }

  /**
   * Save audio settings to localStorage
   * @private
   */
  #saveAudioSettings() {
    try {
      localStorage.setItem(this.#AUDIO_PREFS_KEY, JSON.stringify(this.#audioSettings));
    } catch (err) {
      console.warn('[SettingsManager] Failed to save audio settings:', err);
    }
  }

  /**
   * Save render settings to localStorage
   * @private
   */
  #saveRenderSettings() {
    try {
      localStorage.setItem(this.#RENDER_PREFS_KEY, JSON.stringify(this.#renderSettings));
    } catch (err) {
      console.warn('[SettingsManager] Failed to save render settings:', err);
    }
  }

  /**
   * Save environment settings to localStorage
   * @private
   */
  #saveEnvironmentSettings() {
    try {
      localStorage.setItem(this.#ENV_PREFS_KEY, JSON.stringify(this.#environmentSettings));
    } catch (err) {
      console.warn('[SettingsManager] Failed to save environment settings:', err);
    }
  }

  /**
   * Save language to localStorage
   * @private
   */
  #saveLanguage() {
    try {
      localStorage.setItem(this.#LANG_KEY, this.#language);
    } catch (err) {
      console.warn('[SettingsManager] Failed to save language:', err);
    }
  }

  // ============ Audio Settings ============

  /**
   * Get audio settings
   */
  getAudioSettings() {
    return { ...this.#audioSettings };
  }

  /**
   * Check if music is enabled
   */
  isMusicEnabled() {
    return this.#audioSettings.music;
  }

  /**
   * Set music enabled state
   */
  setMusicEnabled(enabled) {
    this.#audioSettings.music = !!enabled;
    this.#saveAudioSettings();
  }

  /**
   * Check if SFX is enabled
   */
  isSfxEnabled() {
    return this.#audioSettings.sfx;
  }

  /**
   * Set SFX enabled state
   */
  setSfxEnabled(enabled) {
    this.#audioSettings.sfx = !!enabled;
    this.#saveAudioSettings();
  }

  // ============ Render Settings ============

  /**
   * Get render quality
   */
  getRenderQuality() {
    return this.#renderSettings.quality;
  }

  /**
   * Set render quality
   */
  setRenderQuality(quality) {
    if (!['low', 'medium', 'high'].includes(quality)) {
      console.warn('[SettingsManager] Invalid quality:', quality);
      return;
    }
    this.#renderSettings.quality = quality;
    this.#saveRenderSettings();
  }

  /**
   * Get all render settings
   */
  getRenderSettings() {
    return { ...this.#renderSettings };
  }

  // ============ Environment Settings ============

  /**
   * Get environment settings
   */
  getEnvironmentSettings() {
    return { ...this.#environmentSettings };
  }

  /**
   * Get environment density index
   */
  getEnvironmentDensity() {
    return this.#environmentSettings.density;
  }

  /**
   * Set environment density
   */
  setEnvironmentDensity(density) {
    this.#environmentSettings.density = Math.max(0, Math.min(2, parseInt(density, 10)));
    this.#saveEnvironmentSettings();
  }

  /**
   * Check if rain is enabled
   */
  isRainEnabled() {
    return this.#environmentSettings.rain;
  }

  /**
   * Set rain enabled state
   */
  setRainEnabled(enabled) {
    // Allow users to override mobile optimization if they explicitly enable rain
    this.#environmentSettings.rain = !!enabled;
    this.#saveEnvironmentSettings();
  }

  /**
   * Get rain level
   */
  getRainLevel() {
    return this.#environmentSettings.rainLevel;
  }

  /**
   * Set rain level (0-2)
   */
  setRainLevel(level) {
    this.#environmentSettings.rainLevel = Math.max(0, Math.min(2, parseInt(level, 10)));
    this.#saveEnvironmentSettings();
  }

  // ============ Language Settings ============

  /**
   * Get current language
   */
  getLanguage() {
    return this.#language;
  }

  /**
   * Set language
   */
  setLanguage(lang) {
    if (!['vi', 'en'].includes(lang)) {
      console.warn('[SettingsManager] Invalid language:', lang);
      return;
    }
    this.#language = lang;
    this.#saveLanguage();
  }

  // ============ Utility Methods ============

  /**
   * Reset all settings to defaults
   */
  resetToDefaults() {
    this.#audioSettings = { music: true, sfx: true };
    this.#renderSettings = { quality: this.#isMobile ? 'medium' : 'high' };
    this.#environmentSettings = { density: 1, rain: false, rainLevel: 1 };
    this.#language = 'vi';

    this.#saveAudioSettings();
    this.#saveRenderSettings();
    this.#saveEnvironmentSettings();
    this.#saveLanguage();
  }

  /**
   * Get all settings (for debugging)
   */
  getAllSettings() {
    return {
      audio: this.getAudioSettings(),
      render: this.getRenderSettings(),
      environment: this.getEnvironmentSettings(),
      language: this.getLanguage()
    };
  }
}
