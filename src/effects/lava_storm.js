import * as THREE from "../../vendor/three/build/three.module.js";
import { SKILL_FX } from "../../config/skills_fx.js";

/**
 * Lava Storm Effect
 * 
 * UNIQUE VISUAL: Realistic bubbling lava pools with erupting geysers,
 * molten ground with cracks, and splashing lava particles
 */
class LavaStormEffect {
  constructor(baseEffects, params) {
    const { center, radius, strike, strikePos } = params || {};
    const fx = SKILL_FX.lava_storm || {};
    const colors = fx.colors || {};
    
    if (strike && strikePos) {
      // ===== LAVA GEYSER ERUPTION =====
      createLavaGeyser(baseEffects, strikePos, colors);
    
    } else if (center) {
      // ===== LAVA STORM AREA EFFECT =====
      const stormRadius = radius || 28;
      createLavaStormArea(baseEffects, center, stormRadius, colors);
    }
  }
}

export default function lavaStormEffect(baseEffects, params) { return new LavaStormEffect(baseEffects, params); }

/**
 * Create a single lava geyser eruption at a point
 */
function createLavaGeyser(baseEffects, pos, colors) {
  const scene = baseEffects.scene;
  const group = new THREE.Group();
  group.position.copy(pos);
  scene.add(group);
  
  // 1. Molten pool base (glowing lava pool)
  const poolGeo = new THREE.CircleGeometry(2, 32);
  const poolMat = new THREE.MeshBasicMaterial({
    color: colors.secondary || "#8b0000",
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide
  });
  const pool = new THREE.Mesh(poolGeo, poolMat);
  pool.rotation.x = -Math.PI / 2;
  pool.position.y = 0.05;
  group.add(pool);
  
  // 2. Glowing lava cracks radiating from center
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const crackLength = 2.5 + Math.random() * 1;
    const crackGeo = new THREE.PlaneGeometry(0.15, crackLength);
    const crackMat = new THREE.MeshBasicMaterial({
      color: colors.primary || "#ff4500",
      transparent: true,
      opacity: 0.8,
      emissive: colors.primary || "#ff4500",
      emissiveIntensity: 0.5
    });
    const crack = new THREE.Mesh(crackGeo, crackMat);
    crack.rotation.x = -Math.PI / 2;
    crack.rotation.z = angle;
    crack.position.y = 0.06;
    group.add(crack);
  }
  
  // 3. Lava fountain particles (60 particles shooting up)
  const particleCount = 60;
  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 8 + Math.random() * 6;
    const spreadX = Math.cos(angle) * (Math.random() * 2);
    const spreadZ = Math.sin(angle) * (Math.random() * 2);
    
    baseEffects.queue.push({
      obj: null,
      until: Date.now() + 1500,
      particle: true,
      pos: new THREE.Vector3(pos.x, pos.y + 0.5, pos.z),
      vel: new THREE.Vector3(spreadX, speed, spreadZ),
      gravity: -15,
      size: 0.15 + Math.random() * 0.15,
      color: i % 3 === 0 ? (colors.accent || "#ffa500") : (i % 3 === 1 ? (colors.primary || "#ff4500") : "#ff6347"),
      opacity: 0.9,
      fade: true
    });
  }
  
  // 4. Geyser column (cylinder of lava shooting up)
  const columnGeo = new THREE.CylinderGeometry(0.6, 0.8, 6, 16);
  const columnMat = new THREE.MeshBasicMaterial({
    color: colors.primary || "#ff4500",
    transparent: true,
    opacity: 0.7,
    emissive: colors.primary || "#ff4500",
    emissiveIntensity: 0.6
  });
  const column = new THREE.Mesh(columnGeo, columnMat);
  column.position.y = 3;
  group.add(column);
  
  // 5. Explosion flash at top
  const flashGeo = new THREE.SphereGeometry(1.5, 16, 16);
  const flashMat = new THREE.MeshBasicMaterial({
    color: 0xffff00,
    transparent: true,
    opacity: 1.0
  });
  const flash = new THREE.Mesh(flashGeo, flashMat);
  flash.position.y = 6;
  group.add(flash);
  
  // 6. Expanding shockwave rings
  for (let i = 0; i < 3; i++) {
    setTimeout(() => {
      const ringGeo = new THREE.RingGeometry(0.5, 0.8, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: colors.primary || "#ff6347",
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(pos.x, 0.1, pos.z);
      scene.add(ring);
      
      baseEffects.queue.push({
        obj: ring,
        until: Date.now() + 800,
        fade: true,
        mat: ringMat,
        shockwave: true,
        shockwaveSpeed: 8
      });
    }, i * 100);
  }
  
  // Animate and cleanup
  const startTime = Date.now();
  const duration = 1200;
  
  function animate() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    if (progress >= 1) {
      // Cleanup
      scene.remove(group);
      poolMat.dispose();
      poolGeo.dispose();
      columnMat.dispose();
      columnGeo.dispose();
      flashMat.dispose();
      flashGeo.dispose();
      group.children.forEach(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
      return;
    }
    
    // Animate column rising
    if (progress < 0.3) {
      const riseProgress = progress / 0.3;
      column.scale.y = riseProgress;
      column.position.y = 3 * riseProgress;
    } else if (progress > 0.7) {
      // Fade out
      const fadeProgress = (progress - 0.7) / 0.3;
      column.material.opacity = 0.7 * (1 - fadeProgress);
    }
    
    // Flash fade
    flash.material.opacity = Math.max(0, 1 - progress * 2);
    flash.scale.setScalar(1 + progress * 2);
    
    // Pool pulse
    pool.material.opacity = 0.9 - progress * 0.4;
    
    requestAnimationFrame(animate);
  }
  
  animate();
}

/**
 * Create the full lava storm area with multiple pools and geysers
 */
function createLavaStormArea(baseEffects, center, stormRadius, colors) {
  const scene = baseEffects.scene;
  const group = new THREE.Group();
  group.position.copy(center);
  scene.add(group);
  
  // 1. Main lava ground (large molten area)
  const groundGeo = new THREE.CircleGeometry(stormRadius, 64);
  const groundMat = new THREE.MeshBasicMaterial({
    color: colors.secondary || "#8b0000",
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0.02;
  group.add(ground);
  
  // 2. Glowing lava veins (cracks across the ground)
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    const veinLength = stormRadius * 0.9;
    const veinGeo = new THREE.PlaneGeometry(0.2, veinLength);
    const veinMat = new THREE.MeshBasicMaterial({
      color: colors.primary || "#ff4500",
      transparent: true,
      opacity: 0.8,
      emissive: colors.primary || "#ff4500",
      emissiveIntensity: 0.5
    });
    const vein = new THREE.Mesh(veinGeo, veinMat);
    vein.rotation.x = -Math.PI / 2;
    vein.rotation.z = angle;
    vein.position.y = 0.03;
    group.add(vein);
  }
  
  // 3. Bubbling lava pools (20 small pools)
  const poolCount = 20;
  for (let i = 0; i < poolCount; i++) {
    setTimeout(() => {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * stormRadius * 0.8;
      const poolPos = new THREE.Vector3(
        center.x + Math.cos(angle) * dist,
        center.y + 0.1,
        center.z + Math.sin(angle) * dist
      );
      
      // Bubble sphere
      const bubbleGeo = new THREE.SphereGeometry(0.3 + Math.random() * 0.3, 12, 12);
      const bubbleMat = new THREE.MeshBasicMaterial({
        color: colors.accent || "#ffa500",
        transparent: true,
        opacity: 0.8
      });
      const bubble = new THREE.Mesh(bubbleGeo, bubbleMat);
      bubble.position.copy(poolPos);
      scene.add(bubble);
      
      // Bubble pop animation
      const bubbleStart = Date.now();
      const bubbleDuration = 600;
      
      function animateBubble() {
        const elapsed = Date.now() - bubbleStart;
        const progress = elapsed / bubbleDuration;
        
        if (progress >= 1) {
          scene.remove(bubble);
          bubbleGeo.dispose();
          bubbleMat.dispose();
          
          // Pop particles
          for (let j = 0; j < 8; j++) {
            const pAngle = (j / 8) * Math.PI * 2;
            baseEffects.queue.push({
              obj: null,
              until: Date.now() + 800,
              particle: true,
              pos: poolPos.clone(),
              vel: new THREE.Vector3(Math.cos(pAngle) * 2, 3, Math.sin(pAngle) * 2),
              gravity: -8,
              size: 0.1,
              color: colors.primary || "#ff4500",
              opacity: 0.9,
              fade: true
            });
          }
          return;
        }
        
        // Rise and expand
        bubble.position.y = poolPos.y + progress * 0.5;
        bubble.scale.setScalar(1 + progress * 0.5);
        bubble.material.opacity = 0.8 * (1 - progress);
        
        requestAnimationFrame(animateBubble);
      }
      
      animateBubble();
    }, i * 80);
  }
  
  // 4. Lava geysers erupting (10 geysers)
  const geyserCount = 10;
  for (let i = 0; i < geyserCount; i++) {
    setTimeout(() => {
      const angle = (i / geyserCount) * Math.PI * 2 + Math.random() * 0.5;
      const dist = stormRadius * (0.4 + Math.random() * 0.4);
      const geyserPos = new THREE.Vector3(
        center.x + Math.cos(angle) * dist,
        center.y,
        center.z + Math.sin(angle) * dist
      );
      
      // Small geyser eruption
      const geyserGeo = new THREE.CylinderGeometry(0.3, 0.4, 4, 12);
      const geyserMat = new THREE.MeshBasicMaterial({
        color: colors.primary || "#ff4500",
        transparent: true,
        opacity: 0.7
      });
      const geyser = new THREE.Mesh(geyserGeo, geyserMat);
      geyser.position.set(geyserPos.x, geyserPos.y + 2, geyserPos.z);
      scene.add(geyser);
      
      // Geyser particles
      for (let j = 0; j < 20; j++) {
        const pAngle = Math.random() * Math.PI * 2;
        const pSpeed = 4 + Math.random() * 3;
        baseEffects.queue.push({
          obj: null,
          until: Date.now() + 1200,
          particle: true,
          pos: geyserPos.clone(),
          vel: new THREE.Vector3(
            Math.cos(pAngle) * (Math.random() * 1.5),
            pSpeed,
            Math.sin(pAngle) * (Math.random() * 1.5)
          ),
          gravity: -12,
          size: 0.12,
          color: colors.primary || "#ff6347",
          opacity: 0.9,
          fade: true
        });
      }
      
      // Cleanup geyser
      setTimeout(() => {
        scene.remove(geyser);
        geyserGeo.dispose();
        geyserMat.dispose();
      }, 800);
    }, i * 150);
  }
  
  // 5. Outer ring indicator
  const outerRingGeo = new THREE.RingGeometry(stormRadius - 0.5, stormRadius + 0.5, 64);
  const outerRingMat = new THREE.MeshBasicMaterial({
    color: colors.primary || "#ff4500",
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide
  });
  const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
  outerRing.rotation.x = -Math.PI / 2;
  outerRing.position.y = 0.04;
  group.add(outerRing);
  
  // Animate and cleanup
  const startTime = Date.now();
  const duration = 3000;
  
  function animate() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    if (progress >= 1) {
      // Cleanup
      scene.remove(group);
      groundGeo.dispose();
      groundMat.dispose();
      outerRingGeo.dispose();
      outerRingMat.dispose();
      group.children.forEach(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
      return;
    }
    
    // Pulse ground opacity
    const pulse = Math.sin(progress * Math.PI * 6) * 0.2;
    ground.material.opacity = 0.6 + pulse;
    
    // Fade out at end
    if (progress > 0.8) {
      const fadeProgress = (progress - 0.8) / 0.2;
      ground.material.opacity *= (1 - fadeProgress);
      outerRing.material.opacity = 0.5 * (1 - fadeProgress);
    }
    
    requestAnimationFrame(animate);
  }
  
  animate();
}
