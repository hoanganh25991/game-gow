import { CSS_VAR } from "../../../config/index.js";
import { getSkill, setSkill } from "../../skills_api.js";
import { saveLoadout, loadOrDefault } from "../../loadout.js";
import { SKILLS_POOL, DEFAULT_LOADOUT } from "../../../config/skills_pool.js";
import { now } from "../../utils.js";
import { getSkillUpgradeManager } from "../../skills_upgrade.js";

/**
 * Enhanced Skillbook preview flow:
 * - Native DOM overlay to select assignment key (Q/W/E/R) instead of prompt
 * - Shows option keys with current bindings for clarity
 * - After Hero Screen fades out, show countdown 2, 1 only (no extra overlay/backdrop)
 * - Then cast the selected key, show "🔥 Casted!" for 1.5s, and fade the Hero Screen back in
 *
 * Usage: call initHeroPreview(skills, { heroScreen }) after SkillsSystem is created.
 */
export function initHeroPreview(skills, opts = {}) {
  if (!skills || typeof skills.previewSkill !== "function") return;
  const heroScreen = opts.heroScreen || document.getElementById("heroScreen");

  const originalPreview = skills.previewSkill.bind(skills);

  skills.previewSkill = function enhancedPreview(def) {
    try {
      // Find the key with the least cooldown
      const key = findKeyWithLeastCooldown(skills);
      
      if (!key) {
        // No available key -> fallback to old preview visuals (no cast)
        try { originalPreview(def); } catch (_) {}
        return;
      }
      
      // Fade out Hero Screen first
      fadeOut(heroScreen, 300).then(async () => {
        // Countdown and cast; confirmation handled inside
        await showCastingOverlayAndCast(skills, def, key, false); // false = don't persist assignment
      }).then(() => {
        // Fade back in after countdown + cast + display
        fadeIn(heroScreen, 300);
      }).catch(() => {
        try { originalPreview(def); } catch (_) {}
      });
    } catch (_) {
      try { originalPreview(def); } catch (_) {}
    }
  };
}

/* ============================
   Helper Functions
============================ */

/**
 * Find the key (Q/W/E/R) with the least cooldown remaining
 * @param {Object} skills - The skills system with cooldowns
 * @returns {string|null} - The key with least cooldown, or null if none available
 */
function findKeyWithLeastCooldown(skills) {
  const keys = ["Q", "W", "E", "R"];
  const currentTime = now();
  
  let bestKey = null;
  let minCooldown = Infinity;
  
  for (const key of keys) {
    const cooldownEnd = skills.cooldowns?.[key] || 0;
    const remaining = Math.max(0, cooldownEnd - currentTime);
    
    if (remaining < minCooldown) {
      minCooldown = remaining;
      bestKey = key;
    }
  }
  
  return bestKey;
}

/* ============================
   UI Overlays
============================ */

function showKeySelectOverlay(def) {
  return new Promise((resolve) => {
    const root = document.createElement("div");
    root.id = "__previewKeySelect";
    Object.assign(root.style, {
      position: "fixed",
      inset: "0",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--glass)",
      zIndex: "9999",
      backdropFilter: "blur(2px)",
    });

    const box = document.createElement("div");
    Object.assign(box.style, {
      minWidth: "300px",
      maxWidth: "90vw",
      background: "var(--system-bg)",
      border: "1px solid var(--system-border)",
      borderRadius: "10px",
      padding: "14px",
      color: "var(--system-text)",
      boxShadow: CSS_VAR.shadowMedium,
      textAlign: "center",
      fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif",
    });

    const title = document.createElement("div");
    title.textContent = `Assign "${def?.name || "Skill"}" to key:`;
    Object.assign(title.style, { fontWeight: "600", marginBottom: "10px", fontSize: "16px" });

    const grid = document.createElement("div");
    Object.assign(grid.style, {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: "10px",
      marginTop: "6px",
      marginBottom: "10px",
    });

    const keys = ["Q", "W", "E", "R"];
    const btns = [];
    keys.forEach((k) => {
      const btn = document.createElement("button");
      btn.setAttribute("type", "button");
      btn.textContent = k;
      btn.title = (getSkill(k)?.name || k);
      Object.assign(btn.style, {
        padding: "12px 6px",
        borderRadius: "8px",
        border: "1px solid var(--system-border)",
        background: "var(--system-bg)",
        color: "var(--system-text)",
        fontSize: "18px",
        fontWeight: "700",
        cursor: "pointer",
      });
      btn.addEventListener("mouseenter", () => (btn.style.background = "var(--system-bg)"));
      btn.addEventListener("mouseleave", () => (btn.style.background = "var(--system-bg)"));
      btn.addEventListener("click", () => {
        cleanup();
        resolve(k);
      });

      // Key info below the button
      const wrap = document.createElement("div");
      Object.assign(wrap.style, { display: "flex", flexDirection: "column", gap: "6px" });

      wrap.appendChild(btn);
      const info = document.createElement("div");
      info.textContent = getSkill(k)?.name ? `(${getSkill(k).name})` : "(empty)";
      Object.assign(info.style, { fontSize: "11px", opacity: "0.8" });
      wrap.appendChild(info);

      const cell = document.createElement("div");
      cell.appendChild(wrap);
      grid.appendChild(cell);
      btns.push(btn);
    });

    const tip = document.createElement("div");
    tip.textContent = "Tip: press Q, W, E or R to choose quickly";
    Object.assign(tip.style, { fontSize: "12px", opacity: "0.8", marginTop: "6px" });

    const actions = document.createElement("div");
    Object.assign(actions.style, { marginTop: "10px", display: "flex", gap: "8px", justifyContent: "center" });

    const cancel = document.createElement("button");
    cancel.textContent = "Cancel";
    Object.assign(cancel.style, {
      padding: "8px 12px",
      borderRadius: "6px",
      border: "1px solid var(--system-border)",
      background: CSS_VAR.glassStrong,
      color: "var(--theme-white)",
      cursor: "pointer",
      fontWeight: "600",
    });
    cancel.addEventListener("mouseenter", () => (cancel.style.background = CSS_VAR.glass));
    cancel.addEventListener("mouseleave", () => (cancel.style.background = CSS_VAR.glassStrong));
    cancel.addEventListener("click", () => {
      cleanup();
      resolve(null);
    });

    actions.appendChild(cancel);

    box.appendChild(title);
    box.appendChild(grid);
    box.appendChild(tip);
    box.appendChild(actions);
    root.appendChild(box);

    // Keyboard access
    const onKey = (ev) => {
      const k = String(ev.key || "").toUpperCase();
      if (["Q", "W", "E", "R"].includes(k)) {
        ev.preventDefault?.();
        cleanup();
        resolve(k);
      } else if (k === "ESCAPE") {
        ev.preventDefault?.();
        cleanup();
        resolve(null);
      }
    };
    document.addEventListener("keydown", onKey, true);

    document.body.appendChild(root);

    function cleanup() {
      document.removeEventListener("keydown", onKey, true);
      try {
        root.remove();
      } catch (_) {
        if (root && root.parentNode) root.parentNode.removeChild(root);
      }
    }
  });
}

async function showCastingOverlayAndCast(skills, def, key, persist = true) {
  // Root overlay
  const root = document.createElement("div");
  root.id = "__previewCasting";
  Object.assign(root.style, {
    position: "fixed",
    left: "50%",
    top: "18%",
    transform: "translate(-50%, -50%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: "9999",
    pointerEvents: "none"
  });

  // Card
  const card = document.createElement("div");
  Object.assign(card.style, {
    minWidth: "0",
    background: "transparent",
    border: "none",
    borderRadius: "0",
    padding: "0",
    color: "var(--system-text)",
    textAlign: "center",
    boxShadow: "none",
  });

  const number = document.createElement("div");
  Object.assign(number.style, {
    fontSize: "42px",
    fontWeight: "800",
    color: "var(--system-text)",
    textShadow: "0 0 12px var(--glow-orange)",
    minHeight: "1.2em",
  });

  card.appendChild(number);
  root.appendChild(card);
  document.body.appendChild(root);

  try {
    // Countdown over total wait = remaining cooldown + 2s; show ceiling seconds down to 1
    const rem = Math.max(0, (skills.cooldowns?.[key] || 0) - now());
    const total = rem + 2;
    const steps = Math.max(1, Math.ceil(total));
    const frac = total - Math.floor(total);
    number.style.fontSize = "126px";
    if (steps > 0) {
      const firstMs = Math.round((frac > 0 ? frac : 1) * 1000);
      await setNumber(number, String(steps), firstMs);
      for (let n = steps - 1; n >= 1; n--) {
        await setNumber(number, String(n), 1000);
      }
    }

    // Temporarily assign skill for preview, then cast
    if (def) {
      const upgradeManager = getSkillUpgradeManager();
      const baseSkill = Object.assign({}, def);
      // Apply upgrade bonuses based on skill level
      const upgradedSkill = upgradeManager.applyUpgradeBonuses(def.id, baseSkill);
      
      // Store the original skill if we're not persisting
      const originalSkill = persist ? null : getSkill(key);
      
      setSkill(key, upgradedSkill);
      
      // Persist selection to storage and refresh labels if requested
      if (persist) {
        persistAssignment(key, def);
      }
      
      try {
        skills.castSkill(key);
      } catch (_) {}
      
      // Restore original skill if we're not persisting
      if (!persist && originalSkill) {
        setSkill(key, originalSkill);
      }
    }

    // Show brief confirmation (keep small); mapping remains assigned and persisted
    number.style.fontSize = "42px";
    await setNumber(number, "🔥 Casted!", 1500);
  } finally {
    // Cleanup overlay
    try {
      root.remove();
    } catch (_) {
      if (root && root.parentNode) root.parentNode.removeChild(root);
    }
  }
}

function persistAssignment(key, def) {
  try {
    const idx = { Q: 0, W: 1, E: 2, R: 3 }[key] ?? 0;
    const ids = loadOrDefault(SKILLS_POOL, DEFAULT_LOADOUT).slice();
    if (def && def.id) {
      ids[idx] = def.id;
      saveLoadout(ids);
    }
    // Update runtime labels if main.js exposed it
    try { window.updateSkillBarLabels && window.updateSkillBarLabels(); } catch (_) {}
    // Notify app to re-apply loadout and refresh screens
    try { window.dispatchEvent(new CustomEvent("loadout-changed")); } catch (_) {}
  } catch (_) {}
}

function waitMs(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function setNumber(el, txt, ms) {
  return new Promise((resolve) => {
    try {
      el.style.opacity = "0";
      el.style.transform = "scale(0.9)";
      el.style.transition = "opacity 140ms ease, transform 140ms ease";
      setTimeout(() => {
        el.textContent = txt;
        el.style.opacity = "1";
        el.style.transform = "scale(1)";
        setTimeout(resolve, ms);
      }, 140);
    } catch (_) {
      el.textContent = txt;
      setTimeout(resolve, ms);
    }
  });
}

/* ============================
   Fade helpers
============================ */

function fadeOut(el, dur = 300) {
  return new Promise((resolve) => {
    if (!el) return resolve();
    try {
      el.classList.remove("hidden");
      el.style.transition = `opacity ${dur}ms ease`;
      el.style.opacity = "1";
      requestAnimationFrame(() => {
        el.style.opacity = "0";
        setTimeout(() => {
          el.classList.add("hidden");
          resolve();
        }, dur + 20);
      });
    } catch (_) {
      try { el.classList.add("hidden"); } catch (_) {}
      resolve();
    }
  });
}

function fadeIn(el, dur = 300) {
  return new Promise((resolve) => {
    if (!el) return resolve();
    try {
      el.classList.remove("hidden");
      el.style.transition = `opacity ${dur}ms ease`;
      el.style.opacity = "0";
      requestAnimationFrame(() => {
        el.style.opacity = "1";
        setTimeout(() => {
          resolve();
        }, dur + 20);
      });
    } catch (_) {
      try {
        el.classList.remove("hidden");
        el.style.opacity = "1";
      } catch (_) {}
      resolve();
    }
  });
}
