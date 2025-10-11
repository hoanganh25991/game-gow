/**
 * Mark Cooldown UI Wiring
 * Wires the top-bar "Mark/Flag" button to display a tooltip and disabled state
 * based on the portals.getMarkCooldownMs() value. Uses a polling interval.
 *
 * Public API:
 *   import { wireMarkCooldownUI } from './ui/mark_cooldown.js';
 *   const dispose = wireMarkCooldownUI({ btnMark, portals, intervalMs: 500 });
 *   // Later: dispose() to clear the interval
 */
export function wireMarkCooldownUI({ btnMark, portals, intervalMs = 500 }) {
  if (!btnMark || !portals || typeof portals.getMarkCooldownMs !== 'function') {
    return () => {};
  }

  function fmt(ms) {
    const s = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return m > 0 ? `${m}m ${r}s` : `${r}s`;
  }

  function tick() {
    try {
      const remain = portals.getMarkCooldownMs();
      if (remain > 0) {
        btnMark.disabled = true;
        btnMark.title = `Mark cooldown: ${fmt(remain)}`;
        btnMark.style.opacity = '0.5';
      } else {
        btnMark.disabled = false;
        btnMark.title = 'Mark (3m cd)';
        btnMark.style.opacity = '';
      }
    } catch (_) {
      // fail-safe: keep button usable
      btnMark.disabled = false;
      btnMark.title = 'Mark (3m cd)';
      btnMark.style.opacity = '';
    }
  }

  const id = setInterval(tick, Math.max(100, intervalMs));
  tick();

  return () => {
    try { clearInterval(id); } catch (_) {}
  };
}
