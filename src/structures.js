import * as THREE from "../vendor/three/build/three.module.js";
import { seededRand01 } from "./utils.js";
import { THEME_COLORS } from "../config/index.js";
import {
  createGreekTemple,
  createVilla,
  createGreekColumn,
  createGreekStatue,
  createObelisk,
} from "./meshes.js";

/**
 * Get protection radius for a structure type
 */
export function getStructureProtectionRadius(structureType) {
  switch (structureType) {
    case "temple": return 30;
    case "villa": return 20;
    case "obelisk": return 10;
    case "column": return 6;
    case "statue": return 6;
    default: return 8;
  }
}

/**
 * Get protection circle color for a structure type
 */
export function getStructureProtectionColor(structureType) {
  switch (structureType) {
    case "temple": return 0xffd700; // Gold
    case "villa": return 0xffa500;  // Orange
    default: return 0xffdd88;       // Light yellow
  }
}

/**
 * Export structure creation function with text label for chunk_manager
 */
export function createStructureWithLabel(structureType, params = {}, position = { x: 0, z: 0 }, index = 0) {
  // Generate deterministic name
  const key = `${structureType}_${Math.round(position.x)}_${Math.round(position.z)}_${index}`;
  
  const templeNames = ["Sun Temple", "Moon Temple", "Temple of Wisdom", "Temple of Valor", "Sacred Temple", "Ancient Temple", "Divine Temple", "Eternal Temple"];
  const villaNames = ["Villa Aurora", "Villa Nova", "Villa Bella", "Villa Serena", "Villa Imperial", "Villa Royale", "Villa Magnifica", "Villa Celestia"];
  const columnNames = ["Pillar of Strength", "Column of Honor", "Pillar of Wisdom", "Column of Victory", "Pillar of Light", "Column of Eternity", "Pillar of Glory", "Column of Legacy"];
  const statueNames = ["Statue of Heroes", "Monument of Wisdom", "Statue of Victory", "Monument of Courage", "Statue of Legacy", "Monument of Glory", "Statue of Honor", "Monument of Valor"];
  const obeliskNames = ["Obelisk of Power", "Spire of Wisdom", "Obelisk of Light", "Spire of Eternity", "Obelisk of Glory", "Spire of Victory", "Obelisk of Honor", "Spire of Legacy"];

  let names, color, labelHeight;
  switch (structureType) {
    case "temple":
      names = templeNames;
      color = "#ffd700";
      labelHeight = 12; // Raised higher to avoid overlap with tall temple
      break;
    case "villa":
      names = villaNames;
      color = "#ffa500";
      labelHeight = 10; // Raised higher to avoid overlap with villa roof
      break;
    case "column":
      names = columnNames;
      color = "#f0e68c";
      labelHeight = 7;
      break;
    case "statue":
      names = statueNames;
      color = "#daa520";
      labelHeight = 4;
      break;
    case "obelisk":
      names = obeliskNames;
      color = "#cd853f";
      labelHeight = 8;
      break;
    default:
      names = ["Ancient Structure"];
      color = "#e6f4ff";
      labelHeight = 5;
  }

  const r1 = Math.floor(seededRand01(key + ":1") * names.length);
  const name = names[r1];

  // Create structure
  let structure;
  switch (structureType) {
    case "temple":
      structure = createGreekTemple(params);
      break;
    case "villa":
      structure = createVilla(params);
      break;
    case "column":
      structure = createGreekColumn(params);
      break;
    case "statue":
      structure = createGreekStatue(params);
      break;
    case "obelisk":
      structure = createObelisk(params);
      break;
    default:
      return null;
  }

  structure.userData.name = name;

  // Create text sprite
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const pad = 16;
  ctx.font = "bold 28px sans-serif";
  const metrics = ctx.measureText(name);
  const w = Math.ceil(metrics.width + pad * 2);
  const h = 28 + pad * 2;
  canvas.width = w;
  canvas.height = h;
  const ctx2 = canvas.getContext("2d");
  ctx2.font = "bold 28px sans-serif";
  ctx2.fillStyle = "rgba(0,0,0,0.4)";
  ctx2.fillRect(0, 0, w, h);
  ctx2.fillStyle = color;
  ctx2.textBaseline = "top";
  ctx2.fillText(name, pad, pad);
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
  const label = new THREE.Sprite(mat);
  const scale = 0.03;
  label.scale.set(w * scale, h * scale, 1);
  label.position.set(position.x, labelHeight, position.z);
  
  if (structureType === "temple") {
    label.scale.multiplyScalar(1.3);
  }

  return { structure, label };
}

/**
 * placeStructures(params)
 * - Extracted placement logic for Greek-inspired structures and nature extras from src/environment.js
 *
 * Expected params:
 * {
 *   rng,
 *   seededRange,
 *   root,
 *   villageCenters,   // array of Vector3
 *   water,            // water mesh or null
 *   cfg,              // config object from initEnvironment
 *   __q,              // quality string ("low"|"medium"|"high")
 *   acquireLight,     // function to allocate light budget
 *   createGreekTemple,
 *   createVilla,
 *   createGreekColumn,
 *   createGreekStatue,
 *   createObelisk,
 *   createCypressTree,
 *   createOliveTree,
 *   pickPos           // function to choose a placement Vector3
 * }
 *
 * This module performs placement and side-effects on the provided root group.
 */
export function placeStructures(params = {}) {
  // Wait for CSS variables to be available

  const {
    rng,
    seededRange,
    root,
    villageCenters = [],
    water = null,
    cfg = {},
    __q = "high",
    acquireLight = () => false,
    createGreekTemple,
    createVilla,
    createGreekColumn,
    createGreekStatue,
    createObelisk,
    createCypressTree,
    createOliveTree,
    pickPos,
  } = params;

  if (!root || !rng || !seededRange || !pickPos) return;

  const archGroup = new THREE.Group();
  archGroup.name = "greek-architecture";
  const natureExtraGroup = new THREE.Group();
  natureExtraGroup.name = "nature-extras";

  const placed = [];
  const waterCenter = (cfg.enableWater && water) ? water.position.clone().setY(0) : null;

  // Track structures for minimap
  const structures = [];

  function farFromVillages(p, minD) {
    if (!villageCenters || villageCenters.length === 0) return true;
    for (const c of villageCenters) {
      if (p.distanceTo(c) < (minD + (cfg.villageRadius || 0))) return false;
    }
    return true;
  }
  function farFromWater(p, minD) {
    if (!waterCenter) return true;
    return p.distanceTo(waterCenter) >= ((cfg.waterRadius || 0) + minD);
  }
  function farFromPlaced(p, minD) {
    for (const q of placed) {
      if (p.distanceTo(q) < minD) return false;
    }
    return true;
  }

  function pickPosWrapped(minVillage = 12, minWater = 10, minBetween = 10, maxTries = 60) {
    let tries = maxTries;
    while (tries-- > 0) {
      const p = pickPos(minVillage, minWater, minBetween, maxTries) || (typeof rng === "function" ? (function(){ return null; })() : null);
      // pickPos provided by caller should already do seeded/random selection; if it returns a Vector3 we accept it.
      if (!p) break;
      if (farFromVillages(p, minVillage) && farFromWater(p, minWater) && farFromPlaced(p, minBetween)) {
        placed.push(p.clone());
        return p;
      }
    }
    // fallback: ask caller pickPos again and accept it
    const p = pickPos(minVillage, minWater, minBetween, maxTries);
    if (p) placed.push(p.clone());
    return p;
  }

  // Helper: seeded random [0,1) based on string
  function _seededRand01(str) {
    let h = 0x811c9dc5; // FNV-1a 32-bit
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return ((h >>> 0) / 4294967296);
  }

  // Generate deterministic names for structures based on type and position
  function generateStructureName(structureType, position, index) {
    const key = `${structureType}_${Math.round(position.x)}_${Math.round(position.z)}_${index}`;
    
    const templeNames = ["Sun Temple", "Moon Temple", "Temple of Wisdom", "Temple of Valor", "Sacred Temple", "Ancient Temple", "Divine Temple", "Eternal Temple"];
    const villaNames = ["Villa Aurora", "Villa Nova", "Villa Bella", "Villa Serena", "Villa Imperial", "Villa Royale", "Villa Magnifica", "Villa Celestia"];
    const columnNames = ["Pillar of Strength", "Column of Honor", "Pillar of Wisdom", "Column of Victory", "Pillar of Light", "Column of Eternity", "Pillar of Glory", "Column of Legacy"];
    const statueNames = ["Statue of Heroes", "Monument of Wisdom", "Statue of Victory", "Monument of Courage", "Statue of Legacy", "Monument of Glory", "Statue of Honor", "Monument of Valor"];
    const obeliskNames = ["Obelisk of Power", "Spire of Wisdom", "Obelisk of Light", "Spire of Eternity", "Obelisk of Glory", "Spire of Victory", "Obelisk of Honor", "Spire of Legacy"];

    let names;
    switch (structureType) {
      case "temple": names = templeNames; break;
      case "villa": names = villaNames; break;
      case "column": names = columnNames; break;
      case "statue": names = statueNames; break;
      case "obelisk": names = obeliskNames; break;
      default: names = ["Ancient Structure"];
    }

    const r1 = Math.floor(_seededRand01(key + ":1") * names.length);
    return names[r1];
  }

  // Create text sprite for structure names (similar to villages.js)
  function createTextSprite(text, color = "#e6f4ff", bg = "rgba(0,0,0,0.35)") {
    try { console.log("[Structures] Creating text sprite for:", text, "color:", color); } catch (_) {}
    
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const pad = 16;
    ctx.font = "bold 28px sans-serif";
    const metrics = ctx.measureText(text);
    const w = Math.ceil(metrics.width + pad * 2);
    const h = 28 + pad * 2;
    canvas.width = w;
    canvas.height = h;
    const ctx2 = canvas.getContext("2d");
    ctx2.font = "bold 28px sans-serif";
    ctx2.fillStyle = bg;
    ctx2.fillRect(0, 0, w, h);
    ctx2.fillStyle = color;
    ctx2.textBaseline = "top";
    ctx2.fillText(text, pad, pad);
    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 4;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
    const sprite = new THREE.Sprite(mat);
    const scale = 0.03;
    sprite.scale.set(w * scale, h * scale, 1);
    
    try { console.log("[Structures] Text sprite created, dimensions:", w, "x", h, "scale:", scale); } catch (_) {}
    return sprite;
  }

  // Density counts (copied logic from original)
  const __templeCountForDensity = (__q === "low") ? 1 : 2;
  const __villaCountForDensity = (__q === "low") ? 2 : (__q === "medium" ? 4 : 7);
  const __columnCountForDensity = (__q === "low") ? 4 : (__q === "medium" ? 8 : 14);
  const __statueCountForDensity = (__q === "low") ? 3 : (__q === "medium" ? 5 : 8);
  const __obeliskCountForDensity = (__q === "low") ? 2 : (__q === "medium" ? 4 : 6);

  const orders = ["doric", "ionic", "corinthian"];
  // Track structure indices for unique naming
  let structureIndex = 0;

  let structureTypes = [
    {
      key: "temple",
      place() {
        const pos = pickPosWrapped(16, 14, 24);
        if (!pos) return;
        const t = createGreekTemple({
          cols: Math.max(5, Math.floor(seededRange(rng, 6, 9))),
          rows: Math.max(7, Math.floor(seededRange(rng, 9, 12))),
          columnHeight: seededRange(rng, 5.2, 6.2),
          colSpacingX: seededRange(rng, 2.2, 2.8),
          colSpacingZ: seededRange(rng, 2.3, 3.0),
        });
        t.position.set(pos.x, 0, pos.z);
        t.rotation.y = seededRange(rng, 0, Math.PI * 2);
        archGroup.add(t);

        // Add name label
        const name = generateStructureName("temple", pos, structureIndex++);
        const nameLabel = createTextSprite(name, "#ffd700", "rgba(0,0,0,0.4)");
        nameLabel.position.set(pos.x, 6, pos.z); // Lowered height for better visibility
        nameLabel.scale.multiplyScalar(1.3); // Increase scale for better visibility
        archGroup.add(nameLabel);
        
        // Debug: log structure creation
        try { console.log("[Structures] Created temple:", name, "at position:", pos, "sprite added to:", archGroup.children.length); } catch (_) {}

        // Track structure for minimap
        structures.push({
          type: "temple",
          position: pos.clone(),
          name: name,
          mesh: t
        });

        if (__q !== "low" && acquireLight(2)) {
          const torchL = new THREE.PointLight(THEME_COLORS.themeYellow, __q === "medium" ? 0.5 : 0.8, 14, 2);
          torchL.position.set(pos.x + 2.5, 1.2, pos.z - 4.5);
          const torchR = torchL.clone();
          torchR.position.set(pos.x - 2.5, 1.2, pos.z - 4.5);
          root.add(torchL, torchR);
        }
      }
    },
    {
      key: "villa",
      place() {
        const pos = pickPosWrapped(10, 10, 12);
        if (!pos) return;
        const v = createVilla({
          width: seededRange(rng, 10, 16),
          depth: seededRange(rng, 8, 12),
          height: seededRange(rng, 3.5, 5.2),
        });
        v.position.set(pos.x, 0, pos.z);
        v.rotation.y = seededRange(rng, 0, Math.PI * 2);
        v.scale.setScalar(seededRange(rng, 0.9, 1.2));
        archGroup.add(v);

        // Add name label
        const name = generateStructureName("villa", pos, structureIndex++);
        const nameLabel = createTextSprite(name, "#ffa500", "rgba(0,0,0,0.4)");
        nameLabel.position.set(pos.x, 6, pos.z);
        archGroup.add(nameLabel);

        // Track structure for minimap
        structures.push({
          type: "villa",
          position: pos.clone(),
          name: name,
          mesh: v
        });

        // Tag villa for runtime lookup (center + radius). Compute bounding box to derive conservative radius.
        try {
          const box = new THREE.Box3().setFromObject(v);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const approxRadius = Math.max(size.x, size.z) * 0.6 || Math.max(6, Math.max(size.x, size.z) * 0.5);
          v.userData = v.userData || {};
          v.userData.structure = "villa";
          v.userData.center = center;
          v.userData.radius = approxRadius;
        } catch (_) {}
      }
    },
    {
      key: "column",
      place() {
        const pos = pickPosWrapped(8, 8, 8);
        if (!pos) return;
        const c = createGreekColumn({
          height: seededRange(rng, 4.2, 6.2),
          radius: seededRange(rng, 0.24, 0.34),
          order: orders[Math.floor(seededRange(rng, 0, orders.length)) | 0],
        });
        c.position.set(pos.x, 0, pos.z);
        c.rotation.y = seededRange(rng, 0, Math.PI * 2);
        archGroup.add(c);

        // Add name label
        const name = generateStructureName("column", pos, structureIndex++);
        const nameLabel = createTextSprite(name, "#f0e68c", "rgba(0,0,0,0.4)");
        nameLabel.position.set(pos.x, 7, pos.z);
        archGroup.add(nameLabel);

        // Track structure for minimap
        structures.push({
          type: "column",
          position: pos.clone(),
          name: name,
          mesh: c
        });
      }
    },
    {
      key: "statue",
      place() {
        const pos = pickPosWrapped(8, 8, 10);
        if (!pos) return;
        const s = createGreekStatue();
        s.position.set(pos.x, 0, pos.z);
        s.rotation.y = seededRange(rng, -Math.PI, Math.PI);
        archGroup.add(s);

        // Add name label
        const name = generateStructureName("statue", pos, structureIndex++);
        const nameLabel = createTextSprite(name, "#daa520", "rgba(0,0,0,0.4)");
        nameLabel.position.set(pos.x, 4, pos.z);
        archGroup.add(nameLabel);

        // Track structure for minimap
        structures.push({
          type: "statue",
          position: pos.clone(),
          name: name,
          mesh: s
        });

        if (__q !== "low" && acquireLight(1)) {
          const l = new THREE.PointLight(THEME_COLORS.themeYellow, __q === "medium" ? 0.35 : 0.55, 10, 2);
          l.position.set(pos.x, 1.0, pos.z);
          root.add(l);
        }
      }
    },
    {
      key: "obelisk",
      place() {
        const pos = pickPosWrapped(10, 10, 12);
        if (!pos) return;
        const o = createObelisk({ height: seededRange(rng, 5.5, 7.5) });
        o.position.set(pos.x, 0, pos.z);
        o.rotation.y = seededRange(rng, 0, Math.PI * 2);
        archGroup.add(o);

        // Add name label
        const name = generateStructureName("obelisk", pos, structureIndex++);
        const nameLabel = createTextSprite(name, "#cd853f", "rgba(0,0,0,0.4)");
        nameLabel.position.set(pos.x, 8, pos.z);
        archGroup.add(nameLabel);

        // Track structure for minimap
        structures.push({
          type: "obelisk",
          position: pos.clone(),
          name: name,
          mesh: o
        });
      }
    }
  ];

  if (__q === "low") {
    structureTypes = structureTypes.filter(t => t.key !== "temple");
  }

  const typeByKey = Object.fromEntries(structureTypes.map(t => [t.key, t]));
  const typePool = [];
  const pushNTimes = (key, count) => { for (let i = 0; i < count; i++) typePool.push(key); };
  pushNTimes("temple", __templeCountForDensity);
  pushNTimes("villa", __villaCountForDensity);
  pushNTimes("column", __columnCountForDensity);
  pushNTimes("statue", __statueCountForDensity);
  pushNTimes("obelisk", __obeliskCountForDensity);

  if (__q === "low") {
    for (let i = typePool.length - 1; i >= 0; i--) {
      if (typePool[i] === "temple") typePool.splice(i, 1);
    }
  }

  // Seeded Fisher–Yates shuffle
  for (let i = typePool.length - 1; i > 0; i--) {
    const j = Math.floor(seededRange(rng, 0, i + 1));
    const tmp = typePool[i]; typePool[i] = typePool[j]; typePool[j] = tmp;
  }

  typePool.forEach((key) => {
    const t = typeByKey[key];
    if (t) t.place();
  });

  // Nature extras unified density
  const __cypressCountForDensity = (__q === "low") ? 24 : (__q === "medium" ? 40 : 60);
  const __oliveCountForDensity = (__q === "low") ? 16 : (__q === "medium" ? 26 : 40);
  const natureTreeSpotCount = __cypressCountForDensity + __oliveCountForDensity;

  const cypressGroup = new THREE.Group();
  cypressGroup.name = "cypress";
  const oliveGroup = new THREE.Group();
  oliveGroup.name = "olive";

  const naturePool = [];
  for (let i = 0; i < __cypressCountForDensity; i++) naturePool.push("cypress");
  for (let i = 0; i < __oliveCountForDensity; i++) naturePool.push("olive");
  // Seeded shuffle
  for (let i = naturePool.length - 1; i > 0; i--) {
    const j = Math.floor(seededRange(rng, 0, i + 1));
    const tmp = naturePool[i]; naturePool[i] = naturePool[j]; naturePool[j] = tmp;
  }
  naturePool.forEach((kind) => {
    const p = pickPosWrapped(4, 6, 2);
    if (!p) return;
    if (kind === "cypress") {
      const t = createCypressTree();
      t.position.set(p.x, 0, p.z);
      t.rotation.y = seededRange(rng, 0, Math.PI * 2);
      t.scale.setScalar(seededRange(rng, 0.85, 1.25));
      cypressGroup.add(t);
    } else {
      const t = createOliveTree();
      t.position.set(p.x, 0, p.z);
      t.rotation.y = seededRange(rng, 0, Math.PI * 2);
      t.scale.setScalar(seededRange(rng, 0.85, 1.2));
      oliveGroup.add(t);
    }
  });
  natureExtraGroup.add(cypressGroup, oliveGroup);

  root.add(archGroup, natureExtraGroup);

  // Debug: log total structures created
  try { console.log("[Structures] Total structures created:", structures.length); } catch (_) {}

  // Return structures list for minimap
  return {
    listStructures: () => structures.map(s => ({
      type: s.type,
      position: s.position.clone(),
      name: s.name
    }))
  };
}
