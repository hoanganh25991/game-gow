import { getSkill } from "../skills_api.js";
import { BASIC_ATTACK } from "../../config/skills_pool.js";
import { t } from "../i18n.js";

/**
 * Update the skillbar labels to reflect the active SKILLS mapping.
 * Icons are sourced from the skill definitions (icon field) which originate from skills_pool.js.
 * Reads DOM elements by ids: #btnSkillQ, #btnSkillW, #btnSkillE, #btnSkillR, #btnBasic
 */
export function updateSkillBarLabels() {
  try {
    const tt = typeof t === "function" ? t : (x) => x;
    const map = { Q: "#btnSkillQ", W: "#btnSkillW", E: "#btnSkillE", R: "#btnSkillR" };
    for (const k of Object.keys(map)) {
      const el = document.querySelector(map[k]);
      if (!el) continue;
      const def = getSkill(k) || {};
      // icon from skill definition (skills_pool.js)
      const iconEl = el.querySelector(".icon");
      if (iconEl) iconEl.textContent = def.icon || "—";
      // name / short label
      const nameEl = el.querySelector(".name");
      if (nameEl) {
        const nameKey = def && def.id ? `skills.names.${def.id}` : "";
        const shortKey = def && def.id ? `skills.shorts.${def.id}` : "";
        const tName = nameKey ? tt(nameKey) : "";
        const tShort = shortKey ? tt(shortKey) : "";
        const isNameTranslated = tName && tName !== nameKey;
        const isShortTranslated = tShort && tShort !== shortKey;
        const display = isShortTranslated ? tShort : (def.short || (isNameTranslated ? tName : def.name));
        nameEl.textContent = display || nameEl.textContent;
      }
      const keyEl = el.querySelector(".key");
      if (keyEl) keyEl.textContent = k;
      // accessibility: set button title to skill name if available (prefer localized)
      if (def && def.id) {
        const nmKey = `skills.names.${def.id}`;
        const nmTr = tt(nmKey);
        const isNmTr = nmTr && nmTr !== nmKey;
        if (isNmTr) el.title = nmTr;
        else if (def.name) el.title = def.name;
      } else {
        if (def.name) el.title = def.name;
      }
    }

    // Update central basic button icon (larger visual) - from BASIC_ATTACK definition
    try {
      const basicBtn = document.getElementById("btnBasic");
      if (basicBtn) {
        const icon = basicBtn.querySelector(".icon");
        if (icon) icon.textContent = BASIC_ATTACK.icon;
        
        // Set title with i18n support
        const nameKey = `skills.names.${BASIC_ATTACK.id}`;
        const tName = tt(nameKey);
        const isTranslated = tName && tName !== nameKey;
        basicBtn.title = isTranslated ? tName : BASIC_ATTACK.name;
      }
    } catch (_) {
      // ignore
    }

    // Dispatch event to notify desktop controls that labels have been updated
    try {
      window.dispatchEvent(new CustomEvent("skillbar-labels-updated"));
    } catch (_) {}
  } catch (err) {
    console.warn("updateSkillBarLabels error", err);
  }
}
