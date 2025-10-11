/**
 * Skill runtime API
 *
 * Provides an explicit runtime API to get/set the currently-assigned skills for keys Q/W/E/R
 * without exporting a global SKILLS symbol. This replaces the previous pattern where modules
 * imported a mutable SKILLS object.
 *
 * Responsibilities:
 *  - Maintain current loadout (array of 4 skill ids)
 *  - Maintain runtime mapping keys -> skill objects (shallow copies)
 *
 * Public API:
 *  - getSkill(key) -> runtime skill object or null
 *  - setSkill(key, skillObj) -> assign runtime skill object directly
 *  - getCurrentLoadout() -> [id,id,id,id]
 *  - setLoadoutAndApply(ids, options) -> set loadout, build runtime skill objects from SKILL_POOL and apply optional upgrade mapper
 *  - resolveLoadout(SKILL_POOL, ids, DEFAULT_LOADOUT) is intentionally not duplicated here; callers can resolve before calling setLoadoutAndApply
 *
 * Notes:
 *  - The module intentionally keeps a small internal map rather than exporting a global variable.
 *  - Upgrades should be applied by passing an upgradeMapper function in options:
 *      (id, baseSkill) => upgradedSkill
 *    This keeps upgrade logic outside the API and avoids coupling to skill_upgrades.js.
 */
import { SKILLS_POOL, DEFAULT_LOADOUT } from "../config/skills_pool.js";

const KEYS = ["Q", "W", "E", "R"];

// Internal runtime state
let _currentLoadout = (DEFAULT_LOADOUT && Array.isArray(DEFAULT_LOADOUT) && DEFAULT_LOADOUT.slice(0,4)) || SKILLS_POOL.slice(0,4).map(s => s.id);
const _map = new Map(); // key -> skill object (shallow copies)

// Build id -> definition map for fast lookup
const _idMap = new Map(SKILLS_POOL.map((s) => [s.id, s]));

/**
 * Create a shallow copy of a pool entry (to avoid mutating the canonical pool)
 */
function _shallowCopyDef(def) {
  if (!def) return null;
  return Object.assign({}, def);
}

/**
 * Apply the current _currentLoadout to the internal runtime map.
 * options.upgradeMapper (optional): function(id, baseSkill) => upgradedSkill
 */
export function setLoadoutAndApply(ids = _currentLoadout, options = {}) {
  try {
    const loadout = (Array.isArray(ids) ? ids.slice(0,4) : _currentLoadout.slice()).map((v, i) => ids && ids[i] ? ids[i] : DEFAULT_LOADOUT[i]);
    _currentLoadout = loadout.slice(0,4);
    const upgradeMapper = typeof options.upgradeMapper === "function" ? options.upgradeMapper : null;

    for (let i = 0; i < 4; i++) {
      const key = KEYS[i];
      const id = _currentLoadout[i];
      const def = _idMap.get(id);
      if (def) {
        const base = _shallowCopyDef(def);
        const finalSkill = upgradeMapper ? upgradeMapper(id, base) : base;
        _map.set(key, finalSkill);
      } else {
        _map.set(key, null);
      }
    }
  } catch (e) {
    // Failsafe: ensure map has keys
    for (let i = 0; i < 4; i++) {
      _map.set(KEYS[i], _map.get(KEYS[i]) || null);
    }
  }
}

/**
 * Get the runtime skill for a Q/W/E/R key.
 * Returns null if unset.
 */
export function getSkill(key) {
  if (!key) return null;
  return _map.get(key) || null;
}

/**
 * Assign a runtime skill object directly to a key (used by preview/cast flows).
 * Accepts skill object (should be a shallow copy) or null to unset.
 */
export function setSkill(key, skillObj) {
  if (!key) return;
  if (!KEYS.includes(key)) return;
  _map.set(key, skillObj || null);
}

/**
 * Expose current loadout (ids array)
 */
export function getCurrentLoadout() {
  return _currentLoadout.slice();
}

/**
 * Convenience: resolve an id to canonical pool def (read-only)
 */
export function getPoolDefById(id) {
  return _idMap.get(id) || null;
}

// Initialize defaults immediately so consumers can call getSkill() during module init
setLoadoutAndApply(_currentLoadout, { upgradeMapper: null });
