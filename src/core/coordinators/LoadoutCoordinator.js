/**
 * LoadoutCoordinator - Manages skill loadout system
 */

import { setLoadoutAndApply, getSkill, setSkill } from "../../skills_api.js";
import { SKILLS_POOL, DEFAULT_LOADOUT } from "../../../config/skills_pool.js";
import { loadOrDefault, saveLoadout, resolveLoadout } from "../../loadout.js";
import { updateSkillBarLabels } from "../../ui/icons.js";
import { getSkillUpgradeManager } from "../../skills_upgrade.js";

export class LoadoutCoordinator {
  constructor() {
    this.currentLoadout = null;
  }

  /**
   * Initialize loadout system
   */
  init() {
    this.currentLoadout = loadOrDefault(SKILLS_POOL, DEFAULT_LOADOUT);
    this._applyLoadoutToSKILLS(this.currentLoadout);
    updateSkillBarLabels();

    // Expose global helper
    try {
      window.updateSkillBarLabels = updateSkillBarLabels;
    } catch (_) {}

    // Listen for loadout changes
    window.addEventListener("loadout-changed", () => {
      this._handleLoadoutChanged();
    });
  }

  /**
   * Get current loadout
   */
  getCurrentLoadout() {
    return this.currentLoadout;
  }

  /**
   * Set loadout and save
   */
  setLoadoutAndSave(ids, skillsSystem) {
    const resolved = resolveLoadout(SKILLS_POOL, ids, DEFAULT_LOADOUT);
    this.currentLoadout = resolved;
    this._applyLoadoutToSKILLS(this.currentLoadout);
    saveLoadout(this.currentLoadout);
    updateSkillBarLabels();

    // Refresh skills system if available
    if (skillsSystem?.refreshSkills) {
      try {
        skillsSystem.refreshSkills();
      } catch (_) {}
    }
  }

  /**
   * Get skill API for external use
   */
  getSkillAPI() {
    return { getSkill, setSkill };
  }

  _applyLoadoutToSKILLS(loadoutIds) {
    setLoadoutAndApply(loadoutIds, {
      upgradeMapper: (id, base) => {
        try {
          const mgr = getSkillUpgradeManager();
          return mgr ? mgr.applyUpgradeBonuses(id, base) : base;
        } catch (_) {
          return base;
        }
      },
    });
  }

  _handleLoadoutChanged() {
    try {
      this.currentLoadout = loadOrDefault(SKILLS_POOL, DEFAULT_LOADOUT);
      this._applyLoadoutToSKILLS(this.currentLoadout);
      updateSkillBarLabels();
    } catch (_) {}
  }
}
