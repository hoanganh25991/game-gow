import { t, loadLocale, getLanguage } from "../i18n.js";
/* Guided Instruction Overlay (focus ring + hand + tooltip)
   Extracted from main.js into a reusable module.
*/
export function startInstructionGuide() {
  if (typeof document === "undefined") return;

  if (window.__guideState && window.__guideState.active) return;

  const steps = [
    {
      key: "settings",
      get el() {
        return document.getElementById("btnSettingsScreen");
      },
      title: "Settings",
      desc: "Open and adjust game options, environment, and audio.",
    },
    {
      key: "hero",
      get el() {
        return document.getElementById("btnHeroScreen");
      },
      title: "Hero Screen",
      desc: "View hero info and configure skills and loadout.",
    },
    {
      key: "camera",
      get el() {
        return document.getElementById(isTouchDevice() ? "btnCamera" : "bmCamera");
      },
      title: "Camera Toggle",
      desc: "Tap to toggle first-person camera.",
    },
    {
      key: "portal",
      get el() {
        return document.getElementById(isTouchDevice() ? "btnPortal" : "bmPortal");
      },
      title: "Portal",
      desc: "Tap to open a teleport portal.",
    },
    {
      key: "mark",
      get el() {
        return document.getElementById(isTouchDevice() ? "btnMark" : "bmMark");
      },
      title: "Mark Location",
      desc: "Tap to drop a flag to mark this place on the map.",
    },
    {
      key: "skills",
      get el() {
        return isTouchDevice() //
          ? document.getElementById("skillWheel") || document.getElementById("btnBasic")
          : document.getElementById("bmSkills");
      },
      title: "Skills",
      desc: "Tap Basic or Q/W/E/R to use skills. Cooldown shows in the ring.",
    },
    {
      key: "hud",
      get el() {
        return document.getElementById("stats") || document.getElementById("hud");
      },
      title: "HUD",
      desc: "HP/MP/XP bars show your status. Level is at the right.",
    },
    isTouchDevice() //
      ? {
        key: "joystick",
        get el() {
          return document.getElementById("joystick") || document.getElementById("joyKnob");
        },
        title: "Joystick",
        desc: "Drag to move your hero. On desktop, right-click to move.",
      }
      : {
        el: null
      },
  ].filter((s) => !!s.el);

  if (!steps.length) return;

  const overlay = document.getElementById("guideOverlayRoot");
  if (!overlay) return;
  try { overlay.classList.remove("hidden"); } catch (_) { }

  const blocker = overlay.querySelector(".guide-blocker");
  const focus = overlay.querySelector(".guide-focus");
  const hand = overlay.querySelector(".guide-hand");
  const tip = overlay.querySelector(".guide-tooltip");
  const tipTitle = overlay.querySelector(".guide-tooltip-title");
  const tipBody = overlay.querySelector(".guide-tooltip-body");
  const tipClose = overlay.querySelector(".guide-close");
  const btnPrev = document.getElementById("guidePrev") || overlay.querySelector(".guide-nav .secondary");
  const btnNext = document.getElementById("guideNext") || overlay.querySelector(".guide-nav .primary");

  // Localize controls if possible
  try {
    tipClose?.setAttribute("aria-label", t("guide.nav.close") || "Close guide");
    if (btnPrev) btnPrev.textContent = t("guide.nav.previous") || "Previous";
    if (btnNext) btnNext.textContent = t("guide.nav.next") || "Next";
  } catch (_) { }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function positionFor(el, pad = 10) {
    const r = el.getBoundingClientRect();
    const rect = {
      left: r.left - pad,
      top: r.top - pad,
      width: r.width + pad * 2,
      height: r.height + pad * 2,
    };
    rect.right = rect.left + rect.width;
    rect.bottom = rect.top + rect.height;
    return rect;
  }

  function placeFocus(rect) {
    focus.style.left = rect.left + "px";
    focus.style.top = rect.top + "px";
    focus.style.width = rect.width + "px";
    focus.style.height = rect.height + "px";
  }

  function placeHand(rect) {
    const hx = rect.right - 8;
    const hy = rect.bottom + 6;
    hand.style.left = hx + "px";
    hand.style.top = hy + "px";
  }

  function placeTip(rect) {
    const margin = 8;
    let tx = rect.left;
    let ty = rect.bottom + margin;
    const vw = window.innerWidth,
      vh = window.innerHeight;
    tip.style.maxWidth = "320px";
    tip.style.visibility = "hidden";
    tip.style.left = "0px";
    tip.style.top = "-9999px";
    tip.style.display = "block";
    const tb = tip.getBoundingClientRect();
    let tw = tb.width || 280;
    let th = tb.height || 120;

    if (ty + th > vh - 12) {
      ty = rect.top - th - margin;
    }
    tx = clamp(tx, 12, vw - tw - 12);
    ty = clamp(ty, 12, vh - th - 12);

    tip.style.left = tx + "px";
    tip.style.top = ty + "px";
    tip.style.visibility = "visible";
  }

  function setStep(idx) {
    window.__guideState.index = idx;
    const s = steps[idx];
    if (!s || !s.el) return;
    try {
      s.el.scrollIntoView?.({ block: "nearest", inline: "nearest" });
    } catch (_) { }
    const rect = positionFor(s.el, 10);
    placeFocus(rect);
    placeHand(rect);

    const titleKey = `guide.${s.key}.title`;
    const descKey = `guide.${s.key}.desc`;
    let titleText = t(titleKey);
    let descText = t(descKey);
    if (titleText === titleKey) titleText = s.title || "";
    if (descText === descKey) descText = s.desc || "";
    tipTitle.textContent = titleText;
    tipBody.textContent = descText;

    placeTip(rect);

    btnPrev.disabled = idx === 0;
    btnPrev.textContent = t("guide.nav.previous") || "Previous";
    btnNext.textContent =
      idx === steps.length - 1
        ? (t("guide.nav.done") || "Done")
        : (t("guide.nav.next") || "Next");
  }

  function onNext() {
    if (window.__guideState.index >= steps.length - 1) {
      close();
      return;
    }
    setStep(window.__guideState.index + 1);
  }
  function onPrev() {
    if (window.__guideState.index <= 0) return;
    setStep(window.__guideState.index - 1);
  }
  function onResize() {
    const s = steps[window.__guideState.index];
    if (!s || !s.el) return;
    const rect = positionFor(s.el, 10);
    placeFocus(rect);
    placeHand(rect);
    placeTip(rect);
  }

  function close() {
    if (!window.__guideState || !window.__guideState.active) return;
    window.__guideState.active = false;
    btnPrev.removeEventListener("click", onPrev);
    btnNext.removeEventListener("click", onNext);
    tipClose.removeEventListener("click", close);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("orientationchange", onResize);
    try {
      overlay.classList.add("hidden");
    } catch (_) { }
    window.__guideState = null;
    // If we started from Settings, restore it
    try {
      const fn = window.__guideAfterCloseAction;
      window.__guideAfterCloseAction = null;
      typeof fn === "function" && fn();
    } catch (_) { }
  }

  function isTouchDevice() {
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0
    );
  }

  btnPrev.addEventListener("click", onPrev);
  btnNext.addEventListener("click", onNext);
  tipClose.addEventListener("click", close);
  blocker.addEventListener("click", () => { });
  window.addEventListener("resize", onResize);
  window.addEventListener("orientationchange", onResize);

  window.__guideState = { active: true, index: 0, steps, overlay, focus, hand, tip };
  setStep(0);

  try {
    loadLocale(getLanguage()).then(() => {
      if (window.__guideState && window.__guideState.active) {
        setStep(window.__guideState.index);
        try {
          tipClose.setAttribute("aria-label", t("guide.nav.close") || "Close guide");
        } catch (_) { }
      }
    });
  } catch (_) { }

  try {
    window.__guideClose = close;
  } catch (_) { }
}

// Convenience: enable delegated click on Guide button if present
document.addEventListener("click", (ev) => {
  const t = ev.target;
  if (t && t.id === "btnInstructionGuide") {
    try {
      // If settings panel is open, close it for unobstructed guide view
      const settingsPanel = document.getElementById("settingsPanel");
      let shouldReopen = false;
      if (settingsPanel && !settingsPanel.classList.contains("hidden")) {
        shouldReopen = true;
        settingsPanel.classList.add("hidden");
      }
      if (shouldReopen) {
        window.__guideAfterCloseAction = () => {
          try {
            settingsPanel.classList.remove("hidden");
          } catch (_) { }
        };
      } else {
        try {
          window.__guideAfterCloseAction = null;
        } catch (_) { }
      }
      startInstructionGuide();
    } catch (_) { }
  }
});
