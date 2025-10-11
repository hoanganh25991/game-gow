import { STORAGE_KEYS } from "../config/storage.js";

/**
 * i18n utility (logic only) for GoW RPG.
 *
 * Behavior:
 * - Loads locale JSON files dynamically from ./locales/{lang}.json (relative to this module).
 * - Caches loaded locales and persists selected language in localStorage ("lang").
 * - t(key) is non-blocking: if the locale file is not yet loaded (or key missing), it immediately
 *   returns the key string so the UI can render quickly. After the JSON is loaded, translations
 *   are re-applied.
 */

const DEFAULT_LANG = "vi";

export class I18n {
  constructor(defaultLang = DEFAULT_LANG) {
    this.defaultLang = defaultLang;
    this.currentLang = this._loadSavedLanguage();
    
    /**
     * LOCALES cache structure:
     * {
     *   en: { status: "loaded" | "loading" | "error", data: Object|null, promise: Promise|null },
     *   vi: { ... }
     * }
     */
    this.locales = {};
  }

  /**
   * Load saved language from localStorage
   */
  _loadSavedLanguage() {
    try {
      const saved = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEYS.lang) : null;
      return saved || this.defaultLang;
    } catch (e) {
      return this.defaultLang;
    }
  }

  /**
   * Load a locale JSON file (./locales/{lang}.json) relative to this module.
   * Returns a Promise that resolves to the locale object or null on error.
   * Caches in locales to avoid duplicate network requests.
   */
  async loadLocale(lang) {
    if (!lang) return null;

    const existing = this.locales[lang];
    if (existing) {
      if (existing.status === "loaded") return existing.data;
      if (existing.promise) return existing.promise;
    }

    const url = new URL(`./locales/${lang}.json`, import.meta.url).href;
    const promise = fetch(url, { cache: "no-cache" })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load locale ${lang}: ${res.status}`);
        return res.json();
      })
      .then((json) => {
        this.locales[lang] = { status: "loaded", data: json, promise: null };
        return json;
      })
      .catch((err) => {
        // Keep a record so we don't continuously retry on failure
        console.error("i18n: loadLocale error", err);
        this.locales[lang] = { status: "error", data: null, promise: null };
        return null;
      });

    this.locales[lang] = { status: "loading", data: null, promise };
    return promise;
  }

  /**
   * Translate by key from current language.
   * Non-blocking: if translation is not available, returns the key string.
   */
  t(key) {
    const locale = this.locales[this.currentLang] && this.locales[this.currentLang].data;
    if (!locale || !key) return key;

    // Support nested keys using dot notation, e.g. "hero.info.level"
    const parts = String(key).split(".");
    let val = locale;
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      if (val && Object.prototype.hasOwnProperty.call(val, p)) {
        val = val[p];
      } else {
        val = undefined;
        break;
      }
    }

    return Array.isArray(val) || typeof val === "string" ? val : key;
  }

  /**
   * Apply translations to all elements with [data-i18n] within root.
   * If translations are not yet loaded, the elements will receive the raw key text.
   */
  applyTranslations(root = document) {
    if (!root || !root.querySelectorAll) return;
    root.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const val = this.t(key);
      if (Array.isArray(val)) {
        el.textContent = val.join("\n");
      } else {
        el.textContent = val;
      }
    });
    if (root.documentElement) root.documentElement.lang = this.currentLang;
  }

  /**
   * Render the instructions list into a container element.
   */
  renderInstructions(container) {
    if (!container) return;
    container.innerHTML = "";
    const ul = document.createElement("div");
    const items = this.t("instructions.items");
    if (Array.isArray(items)) {
      items.forEach((line) => {
        const li = document.createElement("div");
        li.textContent = line;
        ul.appendChild(li);
      });
    } else {
      // Render a single item containing the returned value (likely the key) so UI isn't empty.
      const li = document.createElement("div");
      li.textContent = items;
      ul.appendChild(li);
    }
    container.appendChild(ul);
  }

  /**
   * Set active language and persist to localStorage.
   * Non-blocking: immediately applies keys so the UI updates without waiting for fetch.
   * When the JSON finishes loading, translations are re-applied.
   */
  async setLanguage(lang) {
    if (!lang) return;
    this.currentLang = lang;
    try {
      localStorage.setItem(STORAGE_KEYS.lang, lang);
    } catch (e) {
      // ignore
    }

    // Apply immediate (will show keys if not loaded)
    this.applyTranslations(document);
    const instr = document.getElementById("settingsInstructions");
    if (instr) this.renderInstructions(instr);

    // Load and re-apply when ready
    await this.loadLocale(lang);
    this.applyTranslations(document);
    if (instr) this.renderInstructions(instr);
  }

  /**
   * Initialize i18n. Default language is Vietnamese.
   * Ensures localStorage has a value and starts loading the selected locale.
   */
  async init() {
    try {
      const saved = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEYS.lang) : null;
      if (saved) this.currentLang = saved;
      else localStorage.setItem(STORAGE_KEYS.lang, this.currentLang);
    } catch (e) {
      // ignore
    }

    // Expose helpers on window for convenience (used by splash/start flow)
    try {
      if (typeof window !== "undefined") {
        window.applyTranslations = this.applyTranslations.bind(this);
        window.loadLocale = this.loadLocale.bind(this);
      }
    } catch (e) {}

    // Apply keys immediately so the UI is populated
    this.applyTranslations(document);
    const instr = document.getElementById("settingsInstructions");
    if (instr) this.renderInstructions(instr);

    // Load selected locale and re-apply once it's available
    await this.loadLocale(this.currentLang);
    this.applyTranslations(document);
    if (instr) this.renderInstructions(instr);
  }

  /**
   * Get current language
   */
  getLanguage() {
    return this.currentLang;
  }

  /**
   * Get all loaded locales
   */
  getLoadedLocales() {
    return Object.keys(this.locales).filter(lang => this.locales[lang].status === "loaded");
  }

  /**
   * Check if a locale is loaded
   */
  isLocaleLoaded(lang) {
    return this.locales[lang]?.status === "loaded";
  }

  /**
   * Clear all cached locales
   */
  clearCache() {
    this.locales = {};
  }
}

// ---- Singleton instance and legacy API ----

// Default singleton instance for backward compatibility
let defaultInstance = null;

/**
 * Get or create the default singleton instance
 */
function getDefaultInstance() {
  if (!defaultInstance) {
    defaultInstance = new I18n();
  }
  return defaultInstance;
}

/**
 * Load a locale JSON file
 */
export function loadLocale(lang) {
  return getDefaultInstance().loadLocale(lang);
}

/**
 * Translate by key from current language
 */
export function t(key) {
  return getDefaultInstance().t(key);
}

/**
 * Apply translations to all elements with [data-i18n] within root
 */
export function applyTranslations(root = document) {
  return getDefaultInstance().applyTranslations(root);
}

/**
 * Render the instructions list into a container element
 */
export function renderInstructions(container) {
  return getDefaultInstance().renderInstructions(container);
}

/**
 * Set active language and persist to localStorage
 */
export function setLanguage(lang) {
  return getDefaultInstance().setLanguage(lang);
}

/**
 * Initialize i18n
 */
export function initI18n() {
  return getDefaultInstance().init();
}

/**
 * Get current language
 */
export function getLanguage() {
  return getDefaultInstance().getLanguage();
}

/**
 * Get the default singleton instance
 * Useful for direct access to the i18n manager
 */
export function getI18n() {
  return getDefaultInstance();
}

/**
 * Create a new independent i18n instance
 * Useful for testing or isolated translation systems
 */
export function createI18n(defaultLang = DEFAULT_LANG) {
  return new I18n(defaultLang);
}
