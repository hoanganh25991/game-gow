import { getSkillUpgradeManager } from "../../../skills_upgrade.js";

/**
 * Render the Skills tab (loadout slots + skill pool + assign bar).
 * Expects static DOM containers to exist in HTML:
 *  - #heroSkillsList, #heroSkillsLeft, #heroSkillsRight
 */
export function renderSkillsTab(panelEl, ctx = {}, rerender) {
  const {
    t,
    SKILL_POOL = [],
    DEFAULT_LOADOUT = [],
    currentLoadout = [],
    setLoadoutAndSave,
    updateSkillBarLabels,
  } = ctx;

  const tt = typeof t === "function" ? t : (x) => x;

  // Maintain a live copy of loadout to avoid full screen re-rendering
  let activeLoadout = currentLoadout.slice();

  // Static containers defined in index.html
  const container = document.getElementById("heroSkillsList");
  const leftCol = document.getElementById("heroSkillsLeft");
  const rightCol = document.getElementById("heroSkillsRight");
  if (!container || !leftCol || !rightCol) return;

  // Clear any previous content
  try {
    leftCol.innerHTML = "";
    rightCol.innerHTML = "";
  } catch (_) {}

  // Loadout slots (Q W E R)
  const keys = ["Q", "W", "E", "R"];
  const slotsWrap = document.createElement("div");
  slotsWrap.className = "loadout-slots loadout-slots--compact";
  for (let i = 0; i < 4; i++) {
    const slot = document.createElement("div");
    slot.className = "loadout-slot loadout-slot--compact";
    slot.dataset.slotIndex = String(i);
    const skillId = activeLoadout[i];
    const skillDef = SKILL_POOL.find((s) => s.id === skillId);
    slot.innerHTML = `
      <div class="slot-key">${keys[i]}</div>
      <div class="skill-icon">${skillDef ? (skillDef.icon || "—") : "—"}</div>
      <div class="slot-short">${skillDef ? (tt(`skills.shorts.${skillDef.id}`) || skillDef.short || "—") : "—"}</div>
      <div class="slot-name">${skillDef ? (tt(`skills.names.${skillDef.id}`) || skillDef.name || "—") : (t ? (t("hero.slot.empty") || "Empty") : "Empty")}</div>
    `;
    slotsWrap.appendChild(slot);
  }
  rightCol.appendChild(slotsWrap);

  // Skill Points Display
  const upgradeManager = getSkillUpgradeManager();
  const skillPointsDisplay = document.createElement("div");
  skillPointsDisplay.className = "skill-points-display";
  skillPointsDisplay.style.cssText = "padding: 12px; background: color-mix(in srgb, var(--theme-orange) 15%, transparent); border-radius: 8px; margin-bottom: 12px; text-align: center; font-size: 16px; font-weight: bold; color: var(--theme-yellow);";
  skillPointsDisplay.innerHTML = `⭐ ${tt("hero.info.skillPoints") || "Skill Points"}: <span id="skillPointsCount">${upgradeManager.getSkillPoints()}</span>`;
  rightCol.appendChild(skillPointsDisplay);

  // Skill Pool (items-style list)
  const poolPanel = document.createElement("div");
  poolPanel.className = "items-panel";
  try {
    poolPanel.style.display = "flex";
    poolPanel.style.flexDirection = "column";
    poolPanel.style.flex = "1 1 auto";
    poolPanel.style.minHeight = "0";
  } catch (_) {}
  const list = document.createElement("div");
  list.className = "items-list";
  try {
    list.style.flex = "1 1 auto";
    list.style.minHeight = "0";
    list.style.overflow = "auto";
    list.style.maxHeight = "none";
  } catch (_) {}

  SKILL_POOL.forEach((s) => {
    const row = document.createElement("div");
    row.className = "items-row";
    row.dataset.skillId = s.id;

    // Check if skill is unlocked
    const isUnlocked = upgradeManager.isSkillUnlocked(s.id);
    const unlockLevel = upgradeManager.getSkillUnlockLevel(s.id);
    const skillLevel = upgradeManager.getSkillLevel(s.id);
    
    if (!isUnlocked) {
      row.style.opacity = "0.5";
      row.style.filter = "grayscale(0.7)";
    }

    const thumb = document.createElement("div");
    thumb.className = "items-thumb";
    const em = document.createElement("div");
    em.className = "items-thumb-ph";
    em.textContent = (s.icon || "—");
    try {
      em.style.fontSize = "42px";
      em.style.lineHeight = "1";
    } catch (_) {}
    thumb.appendChild(em);
    
    // Add skill level badge
    if (isUnlocked && skillLevel > 1) {
      const levelBadge = document.createElement("div");
      levelBadge.style.cssText = "position: absolute; top: 4px; right: 4px; background: var(--theme-light-orange); color: var(--theme-white); border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;";
      levelBadge.textContent = skillLevel;
      thumb.style.position = "relative";
      thumb.appendChild(levelBadge);
    }

    const info = document.createElement("div");
    const title = document.createElement("div");
    title.className = "items-title";
    title.textContent = tt(`skills.names.${s.id}`) || s.name;
    
    if (!isUnlocked) {
      title.textContent += ` 🔒 (Lv ${unlockLevel})`;
    }
    
    const desc = document.createElement("div");
    desc.className = "items-desc";
    desc.textContent = s.type ? s.type : "";
    const req = document.createElement("div");
    req.className = "items-req";
    const parts = [];
    if (s.cd != null) parts.push(`CD ${s.cd}s`);
    if (s.mana != null) parts.push(`MP ${s.mana}`);
    if (isUnlocked) parts.push(`Level ${skillLevel}`);
    if (parts.length) req.textContent = parts.join(" • ");

    info.appendChild(title);
    if (desc.textContent) info.appendChild(desc);
    if (req.textContent) info.appendChild(req);

    const actions = document.createElement("div");
    actions.className = "items-actions";
    actions.style.cssText = "display: flex; gap: 8px;";
    
    // Upgrade button
    if (isUnlocked) {
      const upgradeBtn = document.createElement("button");
      upgradeBtn.className = "pill-btn pill-btn--yellow";
      upgradeBtn.textContent = "⬆️";
      upgradeBtn.title = tt("hero.upgrade") || "Upgrade Skill";
      upgradeBtn.disabled = !upgradeManager.canUpgradeSkill(s.id);
      if (upgradeBtn.disabled) {
        upgradeBtn.style.opacity = "0.5";
        upgradeBtn.style.cursor = "not-allowed";
      }
      upgradeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (upgradeManager.upgradeSkill(s.id)) {
          // Update skill points display
          const pointsEl = document.getElementById("skillPointsCount");
          if (pointsEl) pointsEl.textContent = upgradeManager.getSkillPoints();
          // Refresh the loadout to apply new upgrade bonuses to SKILLS
          if (setLoadoutAndSave) {
            setLoadoutAndSave(activeLoadout);
          }
          // Re-render to show new level
          if (rerender) rerender();
        }
      });
      actions.appendChild(upgradeBtn);
    }
    
    // Assign button
    const btn = document.createElement("button");
    btn.className = "pill-btn pill-btn--yellow";
    btn.textContent = "➕";
    btn.title = tt("hero.assign");
    btn.disabled = !isUnlocked;
    if (!isUnlocked) {
      btn.style.opacity = "0.5";
      btn.style.cursor = "not-allowed";
    }
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (isUnlocked) showAssignBar(s.id);
    });
    actions.appendChild(btn);

    row.appendChild(thumb);
    row.appendChild(info);
    row.appendChild(actions);

    if (isUnlocked) {
      row.addEventListener("click", () => showAssignBar(s.id));
    }

    list.appendChild(row);
  });

  poolPanel.appendChild(list);
  leftCol.appendChild(poolPanel);

  // Function to highlight skills that are currently assigned to slots
  function updateAssignedSkillsHighlight(loadout) {
    try {
      list.querySelectorAll(".items-row").forEach((row) => {
        const skillId = row.dataset.skillId;
        // Check if this skill is in the current loadout
        const slotIndex = loadout.indexOf(skillId);
        if (slotIndex !== -1) {
          row.classList.add("assigned");
          row.dataset.assignedSlot = keys[slotIndex];
        } else {
          row.classList.remove("assigned");
          delete row.dataset.assignedSlot;
        }
      });
    } catch (_) {}
  }

  // Initial highlight of assigned skills
  updateAssignedSkillsHighlight(activeLoadout);

  // Actions row (Reset)
  const actions = document.createElement("div");
  actions.className = "hero-actions";
  const resetBtn = document.createElement("button");
  resetBtn.className = "pill-btn pill-btn--yellow";
  resetBtn.textContent = "🔄";
  resetBtn.addEventListener("click", () => {
    const next = DEFAULT_LOADOUT.slice();
    applyLoadoutChange(next);
  });
  actions.appendChild(resetBtn);
  rightCol.appendChild(actions);

  // Interaction handling
  let selectedSlotIndex = null;
  let selectedSkillId = null;

  function safeDispatchLoadoutChanged() {
    try {
      window.dispatchEvent(new Event("loadout-changed"));
    } catch (_) {}
  }
  // Update only the slot tiles to avoid full Hero screen re-render and keep scroll positions stable
  function updateSlotsFromLoadout(loadout) {
    try {
      slotsWrap.querySelectorAll(".loadout-slot").forEach((slotEl) => {
        const i = parseInt(slotEl.dataset.slotIndex, 10);
        const skillId = loadout[i];
        const skillDef = SKILL_POOL.find((s) => s.id === skillId);
        slotEl.innerHTML = `
      <div class="slot-key">${keys[i]}</div>
      <div class="skill-icon">${skillDef ? (skillDef.icon || "—") : "—"}</div>
      <div class="slot-short">${skillDef ? (tt(`skills.shorts.${skillDef.id}`) || skillDef.short || "—") : "—"}</div>
      <div class="slot-name">${skillDef ? (tt(`skills.names.${skillDef.id}`) || skillDef.name || "—") : (t ? (t("hero.slot.empty") || "Empty") : "Empty")}</div>
    `;
      });
    } catch (_) {}
  }
  function applyLoadoutChange(next) {
    try {
      setLoadoutAndSave && setLoadoutAndSave(next);
      activeLoadout = next.slice();
      safeDispatchLoadoutChanged();
      updateSkillBarLabels && updateSkillBarLabels();
      // Update slots UI in place to preserve scroll and avoid remounting other tabs
      updateSlotsFromLoadout(activeLoadout);
      // Update assigned skills highlight in the list
      updateAssignedSkillsHighlight(activeLoadout);
    } catch (_) {}
  }
  function assignSkillTo(slotIndex, skillId) {
    const next = activeLoadout.slice();
    next[slotIndex] = skillId;
    applyLoadoutChange(next);
  }

  // Modal for key assignment (uses static HTML modal)
  function showKeyAssignModal(skillId) {
    return new Promise((resolve) => {
      const sd = SKILL_POOL.find((s) => s.id === skillId);
      if (!sd) return resolve(null);

      // Get static modal elements
      const modal = document.getElementById("skillAssignModal");
      const titleEl = document.getElementById("skillAssignTitle");
      const gridEl = document.getElementById("skillAssignGrid");
      const closeBtn = modal.querySelector(".modal-close-btn");
      
      if (!modal || !titleEl || !gridEl || !closeBtn) return resolve(null);

      // Set title
      const nameLocal = tt(`skills.names.${sd.id}`) || sd.name;
      const shortLocal = tt(`skills.shorts.${sd.id}`) || sd.short || "";
      titleEl.textContent = `${tt("assign.assign")} ${nameLocal} (${shortLocal}) ${sd.icon || ""} ${tt("assign.toSlot")}`;

      // Clear and populate grid
      gridEl.innerHTML = "";
      const keys = ["Q", "W", "E", "R"];
      keys.forEach((k, i) => {
        const wrap = document.createElement("div");
        wrap.className = "skill-assign-slot";

        const btn = document.createElement("button");
        btn.setAttribute("type", "button");
        btn.textContent = k;
        const currentSkill = SKILL_POOL.find((s) => s.id === activeLoadout[i]);
        btn.title = currentSkill ? (tt(`skills.names.${currentSkill.id}`) || currentSkill.name || k) : k;
        btn.addEventListener("click", () => {
          cleanup();
          resolve(i);
        });

        const info = document.createElement("div");
        info.className = "skill-assign-slot-info";
        info.textContent = currentSkill ? `(${tt(`skills.names.${currentSkill.id}`) || currentSkill.name})` : "(empty)";

        wrap.appendChild(btn);
        wrap.appendChild(info);
        gridEl.appendChild(wrap);
      });

      // Close button handler
      const onClose = () => {
        cleanup();
        resolve(null);
      };
      closeBtn.addEventListener("click", onClose);

      // Keyboard access
      const onKey = (ev) => {
        const k = String(ev.key || "").toUpperCase();
        const idx = ["Q", "W", "E", "R"].indexOf(k);
        if (idx !== -1) {
          ev.preventDefault?.();
          cleanup();
          resolve(idx);
        } else if (k === "ESCAPE") {
          ev.preventDefault?.();
          cleanup();
          resolve(null);
        }
      };
      document.addEventListener("keydown", onKey, true);

      // Show modal
      modal.classList.remove("hidden");

      function cleanup() {
        document.removeEventListener("keydown", onKey, true);
        closeBtn.removeEventListener("click", onClose);
        modal.classList.add("hidden");
        gridEl.innerHTML = "";
      }
    });
  }

  // Slots selection (kept for potential future use)
  slotsWrap.querySelectorAll(".loadout-slot").forEach((slotEl) => {
    slotEl.addEventListener("click", () => {
      slotsWrap.querySelectorAll(".loadout-slot").forEach((s) => s.classList.remove("selected"));
      slotEl.classList.add("selected");
      selectedSlotIndex = parseInt(slotEl.dataset.slotIndex, 10);
    });
  });

  async function showAssignBar(skillId) {
    selectedSkillId = skillId;
    // highlight the selected item
    try {
      list.querySelectorAll(".items-row").forEach((it) => {
        if (it.dataset.skillId === skillId) {
          it.classList.add("selected");
        } else {
          it.classList.remove("selected");
        }
      });
    } catch (_) {}
    
    // Show modal and wait for user selection
    const slotIndex = await showKeyAssignModal(skillId);
    
    // Clear selection
    try {
      list.querySelectorAll(".items-row").forEach((it) => {
        it.classList.remove("selected");
      });
    } catch (_) {}
    
    // If user selected a slot, assign the skill
    if (slotIndex !== null && slotIndex !== undefined) {
      assignSkillTo(slotIndex, skillId);
    }
  }

  // Pool item interactions
  list.querySelectorAll(".items-row").forEach((itemEl) => {
    const skillId = itemEl.dataset.skillId;
    // Click on row = select and show assign modal (no instant assign)
    itemEl.addEventListener("click", () => {
      showAssignBar(skillId);
    });
  });
}
