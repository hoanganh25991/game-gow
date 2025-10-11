/**
 * Top Bar UI Wiring
 * Encapsulates click handlers for:
 * - Hero screen open button
 * - Generic ".screen-close" elements
 * - Intro start button hide
 * - Camera first-person toggle
 * - Portal recall button
 * - Mark placement button
 * - Instruction guide open button
 *
 * Public API:
 *   import { wireTopBar } from './ui/topbar.js';
 *   const dispose = wireTopBar({
 *     elements: { btnHeroScreen, heroScreen, btnStart, introScreen, btnCamera, btnPortal, btnMark },
 *     actions: {
 *       showHeroScreen,        // () => void
 *       setFirstPerson,        // (enabled: boolean) => void
 *       getFirstPerson,        // () => boolean
 *       portals,               // portals system instance (recallToVillage, addPersistentMarkAt, getMarkCooldownMs)
 *       player,                // player entity
 *       setCenterMsg,          // (text: string) => void
 *       clearCenterMsg,        // () => void
 *       startInstructionGuide, // () => void
 *     }
 *   });
 */
export function wireTopBar({ elements = {}, actions = {} } = {}) {
  const {
    btnHeroScreen,
    heroScreen,
    btnStart,
    introScreen,
    btnCamera,
    btnPortal,
    btnMark,
  } = elements;

  const {
    showHeroScreen,
    setFirstPerson,
    getFirstPerson,
    portals,
    getPlayer,
    setCenterMsg,
    clearCenterMsg,
    startInstructionGuide,
  } = actions;

  const disposers = [];

  // Helper to add event listeners with automatic disposal
  function on(target, type, handler, options) {
    if (!target) return;
    target.addEventListener(type, handler, options);
    disposers.push(() => {
      try { target.removeEventListener(type, handler, options); } catch (_) {}
    });
  }

  // Hero Screen open
  if (btnHeroScreen && heroScreen && typeof showHeroScreen === 'function') {
    on(btnHeroScreen, 'click', () => {
      try { showHeroScreen(); } catch (_) {}
      try { heroScreen.classList.remove('hidden'); } catch (_) {}
    });
  }

  // Generic screen close buttons
  try {
    const closers = document.querySelectorAll('.screen-close');
    closers.forEach((b) => {
      const handler = (e) => {
        try {
          const sc = e.currentTarget.closest('.screen');
          if (sc) sc.classList.add('hidden');
        } catch (_) {}
      };
      on(b, 'click', handler);
    });
  } catch (_) {}

  // Intro start button hide
  if (btnStart && introScreen) {
    on(btnStart, 'click', () => {
      try { introScreen.classList.add('hidden'); } catch (_) {}
    });
  }

  // Camera first-person toggle
  if (btnCamera && typeof setFirstPerson === 'function' && typeof getFirstPerson === 'function') {
    on(btnCamera, 'click', () => {
      try {
        const cur = !!getFirstPerson();
        setFirstPerson(!cur);
      } catch (_) {}
    });
  }

  // Portal recall
    if (btnPortal && portals && typeof portals.recallToVillage === 'function') {
      on(btnPortal, 'click', () => {
        try {
          portals.recallToVillage(getPlayer(), setCenterMsg, clearCenterMsg);
        } catch (_) {}
      });
    }

  // Mark placement
  if (btnMark && portals && typeof portals.addPersistentMarkAt === 'function') {
    on(btnMark, 'click', () => {
      try {
        const remain = portals.getMarkCooldownMs?.() ?? 0;
        if (remain > 0) {
          const s = Math.ceil(remain / 1000);
          setCenterMsg && setCenterMsg(`Mark ready in ${s}s`);
          setTimeout(() => { try { clearCenterMsg && clearCenterMsg(); } catch (_) {} }, 1200);
          return;
        }
        const m = portals.addPersistentMarkAt?.(getPlayer().pos());
        if (m) {
          setCenterMsg && setCenterMsg('Flag placed');
          setTimeout(() => { try { clearCenterMsg && clearCenterMsg(); } catch (_) {} }, 1100);
        }
      } catch (_) {}
    });
  }

  // Instruction guide open via delegated click on #btnInstructionGuide
  const docHandler = (ev) => {
    try {
      const tEl = ev.target;
      if (tEl && tEl.id === 'btnInstructionGuide' && typeof startInstructionGuide === 'function') {
        startInstructionGuide();
      }
    } catch (_) {}
  };
  on(document, 'click', docHandler);

  // dispose
  return () => {
    disposers.forEach((fn) => { try { fn(); } catch (_) {} });
  };
}
