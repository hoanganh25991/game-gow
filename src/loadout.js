/**
 * src/loadout.js
 *
 * Helpers for persisting and resolving the player's chosen 4-skill loadout.
 *
 * Responsibilities:
 * - Save / load a simple array of 4 skill id strings to localStorage ("fire_loadout")
 * - Validate saved data and gracefully fallback to defaults
 * - Resolve a final runtime loadout (array of 4 valid skill ids) given the SKILL_POOL
 *
 * This module is intentionally dependency-free (does not import SKILL_POOL)
 * so it can be used from anywhere (eg. src/main.js) by passing the skill pool array.
 */

import { STORAGE_KEYS } from "../config/index.js";

const STORAGE_KEY = STORAGE_KEYS.fireLoadout;

export class LoadoutManager {
  constructor(skillPool = null, defaultIds = null) {
    this.skillPool = skillPool;
    this.defaultIds = defaultIds;
    this.storageKey = STORAGE_KEY;
  }

  /**
   * Set or update the skill pool
   * @param {Array<{id:string}>} skillPool
   */
  setSkillPool(skillPool) {
    this.skillPool = skillPool;
  }

  /**
   * Set or update the default IDs
   * @param {string[]} defaultIds
   */
  setDefaultIds(defaultIds) {
    this.defaultIds = defaultIds;
  }

  /**
   * Save a loadout (array of skill id strings) to localStorage.
   * Returns true on success, false on failure.
   * @param {string[]} ids - expected to be an array (length 4 ideally) of skill id strings
   * @returns {boolean}
   */
  save(ids) {
    try {
      if (!Array.isArray(ids)) {
        console.warn("saveLoadout: expected array:", ids);
        return false;
      }
      localStorage.setItem(this.storageKey, JSON.stringify(ids));
      return true;
    } catch (err) {
      console.warn("saveLoadout error", err);
      return false;
    }
  }

  /**
   * Load a raw saved loadout from localStorage.
   * Returns parsed value or null if nothing valid was found.
   * @returns {any|null}
   */
  load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed;
    } catch (err) {
      console.warn("loadLoadout parse error", err);
      return null;
    }
  }

  /**
   * Validate that an array of ids is a proper loadout (length 4 and ids exist in pool).
   * @param {Array<{id:string}>} skillPool - optional, uses instance skillPool if not provided
   * @param {string[]} ids
   * @returns {boolean}
   */
  validate(skillPool, ids) {
    // Allow overriding skillPool or use instance pool
    const pool = skillPool || this.skillPool;
    if (!pool) {
      console.warn("validateLoadoutIds: no skill pool provided");
      return false;
    }
    if (!Array.isArray(ids) || ids.length !== 4) return false;
    const poolSet = new Set(pool.map((s) => s.id));
    return ids.every((id) => typeof id === "string" && poolSet.has(id));
  }

  /**
   * Resolve a final loadout of 4 valid skill ids.
   *
   * - skillPool: array of skill objects with at least an `id` field (eg. SKILL_POOL)
   *              (optional if instance skillPool was set)
   * - ids: optional saved ids from localStorage (may be null/invalid)
   * - defaultIds: optional fallback array of 4 ids (eg. DEFAULT_LOADOUT)
   *               (optional if instance defaultIds was set)
   *
   * Resolution rules:
   * 1. If ids is an array and each id exists in skillPool, use it (preserving order).
   * 2. For any missing/invalid slot, fall back to defaultIds if provided and valid.
   * 3. For still-missing slots, pick the first skill(s) from skillPool that aren't already used.
   *
   * Always returns an array of 4 strings (may include null if pool is too small).
   *
   * @param {Array<{id:string}>|null} skillPool
   * @param {string[]|null} ids
   * @param {string[]|null} defaultIds
   * @returns {string[]}
   */
  resolve(skillPool = null, ids = null, defaultIds = null) {
    const pool = skillPool || this.skillPool;
    const defaults = defaultIds || this.defaultIds;

    if (!pool) {
      console.warn("resolveLoadout: no skill pool provided");
      return [null, null, null, null];
    }

    const poolMap = new Map(pool.map((s) => [s.id, s]));
    const poolIds = pool.map((s) => s.id);

    const result = [];

    const src = Array.isArray(ids) ? ids.slice(0, 4) : [];
    const fallback = Array.isArray(defaults) ? defaults.slice(0, 4) : [];

    for (let i = 0; i < 4; i++) {
      const candidateFromSave = src[i];
      if (candidateFromSave && poolMap.has(candidateFromSave)) {
        result.push(candidateFromSave);
        continue;
      }

      const candidateFromDefault = fallback[i];
      if (candidateFromDefault && poolMap.has(candidateFromDefault) && !result.includes(candidateFromDefault)) {
        result.push(candidateFromDefault);
        continue;
      }

      // pick first unused from pool
      const pick = poolIds.find((pid) => !result.includes(pid));
      result.push(pick || null);
    }

    return result;
  }

  /**
   * Convenience: load saved loadout and resolve against pool+defaults in one call.
   * Returns array of 4 ids.
   * @param {Array<{id:string}>|null} skillPool - optional if instance skillPool was set
   * @param {string[]|null} defaultIds - optional if instance defaultIds was set
   * @returns {string[]}
   */
  loadOrDefault(skillPool = null, defaultIds = null) {
    const saved = this.load();
    return this.resolve(skillPool, saved, defaultIds);
  }

  /**
   * Remove saved loadout from storage.
   */
  clear() {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (err) {
      console.warn("clearLoadout error", err);
    }
  }
}

// ---- Legacy function exports for backward compatibility ----

/**
 * Save a loadout (array of skill id strings) to localStorage.
 * Returns true on success, false on failure.
 * @param {string[]} ids - expected to be an array (length 4 ideally) of skill id strings
 * @returns {boolean}
 */
export function saveLoadout(ids) {
  try {
    if (!Array.isArray(ids)) {
      console.warn("saveLoadout: expected array:", ids);
      return false;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    return true;
  } catch (err) {
    console.warn("saveLoadout error", err);
    return false;
  }
}

/**
 * Load a raw saved loadout from localStorage.
 * Returns parsed value or null if nothing valid was found.
 * @returns {any|null}
 */
export function loadLoadout() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (err) {
    console.warn("loadLoadout parse error", err);
    return null;
  }
}

/**
 * Validate that an array of ids is a proper loadout (length 4 and ids exist in pool).
 * @param {Array<{id:string}>} skillPool
 * @param {string[]} ids
 * @returns {boolean}
 */
export function validateLoadoutIds(skillPool, ids) {
  if (!Array.isArray(ids) || ids.length !== 4) return false;
  const poolSet = new Set(skillPool.map((s) => s.id));
  return ids.every((id) => typeof id === "string" && poolSet.has(id));
}

/**
 * Resolve a final loadout of 4 valid skill ids.
 *
 * - skillPool: array of skill objects with at least an `id` field (eg. SKILL_POOL)
 * - ids: optional saved ids from localStorage (may be null/invalid)
 * - defaultIds: optional fallback array of 4 ids (eg. DEFAULT_LOADOUT)
 *
 * Resolution rules:
 * 1. If ids is an array and each id exists in skillPool, use it (preserving order).
 * 2. For any missing/invalid slot, fall back to defaultIds if provided and valid.
 * 3. For still-missing slots, pick the first skill(s) from skillPool that aren't already used.
 *
 * Always returns an array of 4 strings (may include null if pool is too small).
 *
 * @param {Array<{id:string}>} skillPool
 * @param {string[]|null} ids
 * @param {string[]|null} defaultIds
 * @returns {string[]}
 */
export function resolveLoadout(skillPool, ids, defaultIds = null) {
  const poolMap = new Map(skillPool.map((s) => [s.id, s]));
  const poolIds = skillPool.map((s) => s.id);

  const result = [];

  const src = Array.isArray(ids) ? ids.slice(0, 4) : [];
  const fallback = Array.isArray(defaultIds) ? defaultIds.slice(0, 4) : [];

  for (let i = 0; i < 4; i++) {
    const candidateFromSave = src[i];
    if (candidateFromSave && poolMap.has(candidateFromSave)) {
      result.push(candidateFromSave);
      continue;
    }

    const candidateFromDefault = fallback[i];
    if (candidateFromDefault && poolMap.has(candidateFromDefault) && !result.includes(candidateFromDefault)) {
      result.push(candidateFromDefault);
      continue;
    }

    // pick first unused from pool
    const pick = poolIds.find((pid) => !result.includes(pid));
    result.push(pick || null);
  }

  return result;
}

/**
 * Convenience: load saved loadout and resolve against pool+defaults in one call.
 * Returns array of 4 ids.
 * @param {Array<{id:string}>} skillPool
 * @param {string[]|null} defaultIds
 * @returns {string[]}
 */
export function loadOrDefault(skillPool, defaultIds = null) {
  const saved = loadLoadout();
  return resolveLoadout(skillPool, saved, defaultIds);
}

/**
 * Remove saved loadout from storage.
 */
export function clearLoadout() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn("clearLoadout error", err);
  }
}
