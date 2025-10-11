// UI Indicators system: selection ring, enemy slow rings, and hand sparks
// Extracted from main.js to reduce orchestration responsibilities.

export function createIndicators({
  effects,
  THEME_COLORS,
  createGroundRing,
  isMobile,
  MOBILE_OPTIMIZATIONS,
  handWorldPos
}) {
  // Selection ring
  const selectionRing = createGroundRing(0.9, 1.05, THEME_COLORS.fire, 0.55);
  selectionRing.visible = true;
  try { effects.indicators.add(selectionRing); } catch (_) {}

  /**
   * Per-frame update
   * params:
   *  - dt: delta seconds
   *  - ctx: { now, player, enemies, selectedUnit }
   */
  function update(dt, ctx) {
    const { now, player, enemies, selectedUnit } = ctx;

    // Selection ring: follow currently selected unit
    try {
      if (selectedUnit && selectedUnit.alive) {
        selectionRing.visible = true;
        const p = selectedUnit.pos();
        selectionRing.position.set(p.x, 0.02, p.z);
        const col = selectedUnit.team === "enemy" ? THEME_COLORS.village : THEME_COLORS.fire;
        selectionRing.material.color.setHex(col);
      } else {
        selectionRing.visible = false;
      }
    } catch (_) {}

    // Slow debuff indicators (skip on mobile if configured)
    try {
      if (!isMobile || !MOBILE_OPTIMIZATIONS?.skipSlowUpdates) {
        const t = now();
        enemies.forEach((en) => {
          const slowed = en.slowUntil && t < en.slowUntil;
          if (slowed) {
            if (!en._slowRing) {
              const r = createGroundRing(0.6, 0.9, THEME_COLORS.ember, 0.7);
              effects.indicators.add(r);
              en._slowRing = r;
            }
            const p = en.pos();
            en._slowRing.position.set(p.x, 0.02, p.z);
            en._slowRing.visible = true;
          } else if (en._slowRing) {
            effects.indicators.remove(en._slowRing);
            en._slowRing.geometry.dispose?.();
            en._slowRing = null;
          }
        });
      }
    } catch (_) {}

    // Hand charged micro-sparks when any skill is ready
    try {
      const anyReady = !(player.skills?.isOnCooldown?.("Q") &&
                         player.skills?.isOnCooldown?.("W") &&
                         player.skills?.isOnCooldown?.("E") &&
                         player.skills?.isOnCooldown?.("R"));
      const t = now();
      if (anyReady && ((window.__nextHandSparkT ?? 0) <= t)) {
        const from = handWorldPos(player);
        const a = from.clone();
        const b = from.clone().add({
          x: (Math.random() - 0.5) * 0.6,
          y: 0.2 + Math.random() * 0.3,
          z: (Math.random() - 0.5) * 0.6
        });
        try {
          // Use spawnArc instead of deprecated spawnFireStream
          effects.spawnArc(a, b, THEME_COLORS.ember, 0.06, 5, 0.2);
          window.__nextHandSparkT = t + 0.5 + Math.random() * 0.5;
        } catch (_) {}
      }
    } catch (_) {}
  }

  return {
    update,
    getSelectionRing() { return selectionRing; }
  };
}
