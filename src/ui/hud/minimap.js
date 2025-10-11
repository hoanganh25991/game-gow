import { VILLAGE_POS, REST_RADIUS, THEME_COLORS } from "../../../config/index.js";

/**
 * MinimapUI
 * - Fixed CSS width: 208px
 * - Dynamic CSS height: 208 * screenAspect (window.innerHeight / window.innerWidth)
 * - DPR-aware rendering for crisp lines
 * - Throttling based on render quality preference (low/medium/high)
 */
export class MinimapUI {
  constructor() {
    this.canvas = document.getElementById("minimap");
    this.ctx = this.canvas?.getContext("2d") || null;

    // Sizing
    this._cssW = 208;
    this._cssH = 0; // computed
    this._dpr = (typeof window !== "undefined" && window.devicePixelRatio) ? window.devicePixelRatio : 1;
    this._sizeDirty = true;

    // Throttling based on quality
    try {
      const prefs = JSON.parse(localStorage.getItem("gof.renderPrefs") || "{}");
      this._quality = prefs && typeof prefs.quality === "string" ? prefs.quality : "high";
    } catch (_) {
      this._quality = "high";
    }
    this._intervalMs = this._quality === "low" ? 150 : (this._quality === "medium" ? 90 : 0);
    this._lastT = 0;

    // Bind resize/orientation to recompute size lazily on next update
    try {
      window.addEventListener("resize", () => { this._sizeDirty = true; });
      window.addEventListener("orientationchange", () => { this._sizeDirty = true; });
    } catch (_) {}
  }

  _ensureSize() {
    if (!this.canvas || !this.ctx) return;

    const aspect = (typeof window !== "undefined" && window.innerWidth > 0)
      ? (window.innerHeight / window.innerWidth)
      : 1;

    const cssW = this._cssW;
    const cssH = Math.max(32, Math.round(cssW * aspect));
    this._cssH = cssH;

    const dpr = (typeof window !== "undefined" && window.devicePixelRatio) ? window.devicePixelRatio : 1;
    this._dpr = dpr;

    try {
      this.canvas.style.width = cssW + "px";
      this.canvas.style.height = cssH + "px";
      this.canvas.width = Math.max(1, Math.round(cssW * dpr));
      this.canvas.height = Math.max(1, Math.round(cssH * dpr));
      // Draw using CSS pixel units
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    } catch (_) {}

    this._sizeDirty = false;
  }

  update(player, enemies, portals, villages, structures) {
    const ctx = this.ctx;
    if (!ctx || !this.canvas || !player) return;

    // Ensure size
    try {
      if (this._sizeDirty) this._ensureSize();
    } catch (_) {}
    const cssW = this._cssW || 208;
    const cssH = this._cssH || (208 * ((typeof window !== "undefined" && window.innerWidth) ? (window.innerHeight / window.innerWidth) : 1));

    // Throttle
    const nowT = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
    if (this._intervalMs > 0) {
      if (nowT - (this._lastT || 0) < this._intervalMs) return;
      this._lastT = nowT;
    }

    // Clear and background
    ctx.clearRect(0, 0, cssW, cssH);
    ctx.fillStyle = THEME_COLORS.glass;
    ctx.fillRect(0, 0, cssW, cssH);
    ctx.strokeStyle = THEME_COLORS.borderOrange;
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, Math.max(0, cssW - 1), Math.max(0, cssH - 1));

    const center = player.pos();
    const scale = 0.8;
    const cx = cssW / 2;
    const cy = cssH / 2;
    const w2p = (wx, wz) => ({ x: cx + (wx - center.x) * scale, y: cy + (wz - center.z) * scale });

    // Roads (draw behind markers)
    try {
      const polys = villages?.listRoadPolylines?.() || [];
      const usePolys = Array.isArray(polys) && polys.length > 0;
      const segs = usePolys ? [] : (villages?.listRoadSegments?.() || []);
      if (usePolys || segs.length) {
        ctx.save();
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        // Underlay (lighter edge)
        ctx.strokeStyle = THEME_COLORS.roadUnderlay;
        ctx.lineWidth = 4;
        if (usePolys) {
          for (const poly of polys) {
            if (!Array.isArray(poly) || poly.length < 2) continue;
            ctx.beginPath();
            const p0 = w2p(poly[0].x, poly[0].z);
            ctx.moveTo(p0.x, p0.y);
            for (let i = 1; i < poly.length; i++) {
              const pt = w2p(poly[i].x, poly[i].z);
              ctx.lineTo(pt.x, pt.y);
            }
            ctx.stroke();
          }
        } else {
          for (const s of segs) {
            const a = w2p(s.a.x, s.a.z);
            const b = w2p(s.b.x, s.b.z);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
        // Main road line (dark)
        ctx.strokeStyle = THEME_COLORS.roadDark;
        ctx.lineWidth = 2;
        if (usePolys) {
          for (const poly of polys) {
            if (!Array.isArray(poly) || poly.length < 2) continue;
            ctx.beginPath();
            const p0 = w2p(poly[0].x, poly[0].z);
            ctx.moveTo(p0.x, p0.y);
            for (let i = 1; i < poly.length; i++) {
              const pt = w2p(poly[i].x, poly[i].z);
              ctx.lineTo(pt.x, pt.y);
            }
            ctx.stroke();
          }
        } else {
          for (const s of segs) {
            const a = w2p(s.a.x, s.a.z);
            const b = w2p(s.b.x, s.b.z);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
        ctx.restore();
      }
    } catch (_) {}

    // Origin village ring
    ctx.strokeStyle = THEME_COLORS.villageRing;
    ctx.beginPath();
    ctx.arc(
      cx + (VILLAGE_POS.x - center.x) * scale,
      cy + (VILLAGE_POS.z - center.z) * scale,
      REST_RADIUS * scale,
      0,
      Math.PI * 2
    );
    ctx.stroke();

    // Dynamic villages (discovered)
    try {
      const list = villages?.listVillages?.() || [];
      ctx.strokeStyle = THEME_COLORS.villageRingFaint;
      for (const v of list) {
        const p = w2p(v.center.x, v.center.z);
        ctx.beginPath();
        ctx.arc(p.x, p.y, (v.radius || 0) * scale, 0, Math.PI * 2);
        ctx.stroke();
      }
    } catch (_) {}

    // Portals
    const villagePortal = portals?.getVillagePortal?.();
    const returnPortal = portals?.getReturnPortal?.();
    if (villagePortal) {
      const pos = villagePortal.group.position;
      const p = w2p(pos.x, pos.z);
      ctx.fillStyle = THEME_COLORS.portal;
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    }
    if (returnPortal) {
      const pos = returnPortal.group.position;
      const p = w2p(pos.x, pos.z);
      ctx.fillStyle = THEME_COLORS.portalAlt;
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    }

    // Enemies
    if (enemies) {
      enemies.forEach((en) => {
        if (!en.alive) return;
        const ep = en.pos();
        const p = w2p(ep.x, ep.z);
        ctx.fillStyle = THEME_COLORS.enemyDot;
        ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
      });
    }

    // Structures
    try {
      const structureList = structures?.listStructures?.() || [];
      
      for (const structure of structureList) {
        const p = w2p(structure.position.x, structure.position.z);
        
        // Set color based on structure type
        let structureColor;
        switch (structure.type) {
          case "temple":
            structureColor = THEME_COLORS.templeDot;
            break;
          case "villa":
            structureColor = THEME_COLORS.villaDot;
            break;
          case "column":
            structureColor = THEME_COLORS.columnDot;
            break;
          case "statue":
            structureColor = THEME_COLORS.statueDot;
            break;
          case "obelisk":
            structureColor = THEME_COLORS.obeliskDot;
            break;
          default:
            structureColor = THEME_COLORS.templeDot; // fallback
        }
        
        ctx.fillStyle = structureColor;
        
        // Draw structure marker (larger than enemies, different shape)
        ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
      }
    } catch (e) {
      try { console.error("[Minimap] Error drawing structures:", e); } catch (_) {}
    }

    // Player
    const pp = w2p(center.x, center.z);
    ctx.fillStyle = THEME_COLORS.playerDot;
    ctx.beginPath();
    ctx.arc(pp.x, pp.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}
