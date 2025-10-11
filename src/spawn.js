import * as THREE from "../vendor/three/build/three.module.js";

/**
 * Dynamic enemy spawning system module.
 *
 * Responsibilities:
 * - Maintain enemy density around the hero based on level, quality, map modifiers, and performance scaling
 * - Provide burst spawns on movement and continuous maintenance spawns
 * - Avoid spawning inside villages (origin and dynamic)
 * - Expose hooks for map changes and performance scaling
 *
 * Usage:
 *   const spawner = createDynamicSpawner({
 *     scene, player, enemies, mapManager, villages,
 *     WORLD, EnemyClass: Enemy, now, distance2D,
 *     VILLAGE_POS, REST_RADIUS, renderQuality,
 *     applyMapModifiersToEnemy
 *   });
 *   spawner.initialSpawn();
 *   // in game loop:
 *   spawner.update(dt);
 *   // on map change:
 *   spawner.adjustForMapChange();
 *   // adaptive perf:
 *   spawner.setPerformanceScale(1.05);
 */
export function createDynamicSpawner(deps) {
  const {
    scene,
    player,
    enemies,
    mapManager,
    villages, // may be undefined early; module handles gracefully
    WORLD,
    EnemyClass,
    now,
    distance2D,
    VILLAGE_POS,
    REST_RADIUS,
    renderQuality,
    applyMapModifiersToEnemy,
    chunkMgr // chunk manager for structure protection zones
  } = deps;

  const dynamicSpawnConfig = (WORLD && WORLD.dynamicSpawn) || {};
  let lastSpawnCheckTime = 0;
  const lastPlayerPosition = new THREE.Vector3(0, 0, 0);
  let totalDistanceMoved = 0;
  let enemyPerfScale = 1.0; // public via getters/setters

  function calculateDynamicEnemyCount(playerLevel) {
    const cfg = dynamicSpawnConfig;
    const minCount = cfg.minEnemies || 40;
    const maxCount = cfg.maxEnemies || 80;
    const perLevel = cfg.enemiesPerLevel || 2;

    // Level scaling
    const levelBonus = Math.floor((playerLevel - 1) * perLevel);
    const baseCount = Math.min(maxCount, minCount + levelBonus);

    // Quality multiplier
    const qualityMultiplier = {
      high: 1.0,
      medium: 0.7,
      low: 0.5,
    };
    const mult = qualityMultiplier[renderQuality] || 1.0;
    const qualityAdjusted = Math.floor(baseCount * mult);

    // Map modifiers
    const mods = (mapManager && mapManager.getModifiers && mapManager.getModifiers()) || {};
    const withMapMods = Math.floor(qualityAdjusted * (mods.enemyCountMul || 1));

    // Performance scaling
    const perfAdjusted = Math.floor(withMapMods * (enemyPerfScale || 1));

    return Math.max(minCount, perfAdjusted);
  }

  function countNearbyEnemies(radius) {
    const heroPos = player.pos();
    let count = 0;
    for (const en of enemies) {
      if (en.alive) {
        const dist = distance2D(en.pos(), heroPos);
        if (dist <= radius) count++;
      }
    }
    return count;
  }

  function randomEnemySpawnPos() {
    const angle = Math.random() * Math.PI * 2;
    const minR = (WORLD && WORLD.enemySpawnMinRadius) || 30;
    const maxR = (WORLD && WORLD.enemySpawnRadius) || 220;
    const r = minR + Math.random() * (maxR - minR);

    // Base candidate around player's current position
    const center = player.pos();
    const cand = new THREE.Vector3(
      center.x + Math.cos(angle) * r,
      0,
      center.z + Math.sin(angle) * r
    );

    // Keep out of origin village rest radius
    try {
      const dvx = cand.x - VILLAGE_POS.x;
      const dvz = cand.z - VILLAGE_POS.z;
      const dVillage = Math.hypot(dvx, dvz);
      if (dVillage < REST_RADIUS + 2) {
        const push = (REST_RADIUS + 2) - dVillage + 0.5;
        const nx = dvx / (dVillage || 1);
        const nz = dvz / (dVillage || 1);
        cand.x += nx * push;
        cand.z += nz * push;
      }
    } catch (_) {}

    // Keep out of any discovered dynamic village rest radius
    try {
      const list = (villages && villages.listVillages && villages.listVillages()) || [];
      for (const v of list) {
        const dvx2 = cand.x - v.center.x;
        const dvz2 = cand.z - v.center.z;
        const d2 = Math.hypot(dvx2, dvz2);
        const r2 = (v.radius || 0) + 2;
        if (d2 < r2) {
          const nx2 = dvx2 / (d2 || 1);
          const nz2 = dvz2 / (d2 || 1);
          const push2 = r2 - d2 + 0.5;
          cand.x += nx2 * push2;
          cand.z += nz2 * push2;
        }
      }
    } catch (_) {}

    // Keep out of structure protection zones
    try {
      if (chunkMgr) {
        const structuresAPI = chunkMgr.getStructuresAPI();
        if (structuresAPI) {
          const structures = structuresAPI.listStructures();
          for (const s of structures) {
            // Each structure has protectionRadius (temple: 15, villa: 12, obelisk: 10, etc.)
            const protectionRadius = s.protectionRadius || 8;
            const dsx = cand.x - s.position.x;
            const dsz = cand.z - s.position.z;
            const ds = Math.hypot(dsx, dsz);
            const safeRadius = protectionRadius + 2; // Add extra buffer
            
            if (ds < safeRadius) {
              const nsx = dsx / (ds || 1);
              const nsz = dsz / (ds || 1);
              const pushS = safeRadius - ds + 0.5;
              cand.x += nsx * pushS;
              cand.z += nsz * pushS;
            }
          }
        }
      }
    } catch (_) {}

    return cand;
  }

  function spawnEnemyBatch(count, reason = "spawn") {
    if (count <= 0) return 0;
    let spawned = 0;
    for (let i = 0; i < count; i++) {
      const pos = randomEnemySpawnPos();
      const e = new EnemyClass(pos, player.level);
      if (typeof applyMapModifiersToEnemy === "function") {
        try { applyMapModifiersToEnemy(e); } catch (_) {}
      }
      e.mesh.userData.enemyRef = e;
      scene.add(e.mesh);
      enemies.push(e);
      spawned++;
    }
    if (spawned > 0) {
      try {
        console.info(`[Dynamic Spawn] ${reason}: +${spawned} enemies (Level ${player.level}, Total: ${enemies.length})`);
      } catch (_) {}
    }
    return spawned;
  }

  function update(dt) {
    if (!dynamicSpawnConfig.enabled) return;

    const currentTime = now();
    const heroPos = player.pos();
    const cfg = dynamicSpawnConfig;

    // Track hero movement for burst spawning
    try {
      const moveDist = distance2D(heroPos, lastPlayerPosition);
      totalDistanceMoved += moveDist;
      lastPlayerPosition.copy(heroPos);
    } catch (_) {}

    // Burst spawn when hero moves significantly
    const moveThreshold = cfg.movementThreshold || 50;
    if (totalDistanceMoved >= moveThreshold) {
      totalDistanceMoved = 0;
      const burstSize = cfg.burstSpawnSize || 8;
      spawnEnemyBatch(burstSize, "movement burst");
    }

    // Continuous spawn check (slower, maintains density)
    const spawnInterval = cfg.spawnInterval || 3;
    if (currentTime - lastSpawnCheckTime >= spawnInterval) {
      lastSpawnCheckTime = currentTime;

      // Count nearby alive enemies
      const checkRadius = cfg.checkRadius || 250;
      const nearbyCount = countNearbyEnemies(checkRadius);
      const targetCount = calculateDynamicEnemyCount(player.level);

      // Spawn if below target
      if (nearbyCount < targetCount) {
        const deficit = targetCount - nearbyCount;
        const batchSize = Math.min(deficit, cfg.spawnBatchSize || 3);
        spawnEnemyBatch(batchSize, "continuous");
      }
    }
  }

  function initialSpawn() {
    const initialEnemyCount = calculateDynamicEnemyCount(player.level);
    try { console.info(`[Dynamic Spawn] Initial spawn: ${initialEnemyCount} enemies around hero (Level ${player.level})`); } catch (_) {}
    for (let i = 0; i < initialEnemyCount; i++) {
      const pos = randomEnemySpawnPos();
      const e = new EnemyClass(pos, player.level);
      if (typeof applyMapModifiersToEnemy === "function") {
        try { applyMapModifiersToEnemy(e); } catch (_) {}
      }
      e.mesh.userData.enemyRef = e;
      scene.add(e.mesh);
      enemies.push(e);
    }
    lastPlayerPosition.copy(player.pos());
    lastSpawnCheckTime = now();
  }

  function adjustForMapChange() {
    try {
      // Force an immediate spawn check when map changes
      lastSpawnCheckTime = 0;
      totalDistanceMoved = 0;
      console.info(`[Dynamic Spawn] Map changed - resetting spawn timers`);
    } catch (_) {}
  }

  return {
    update,
    initialSpawn,
    adjustForMapChange,
    calculateDynamicEnemyCount,
    getPerformanceScale() { return enemyPerfScale; },
    setPerformanceScale(v) { enemyPerfScale = Number.isFinite(v) ? v : enemyPerfScale; }
  };
}
