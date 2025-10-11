import * as THREE from "../../vendor/three/build/three.module.js";
import { SKILL_FX } from "../../config/skills_fx.js";

/**
 * Pyroclasm Effect
 * 
 * UNIQUE VISUAL: Catastrophic multi-stage ground eruption with:
 * - Massive ground cracks radiating outward
 * - Towering fire columns erupting from cracks
 * - Devastating shockwaves
 * - Massive debris explosion
 * - Scorched earth crater
 */
class PyroclasmEffect {
  constructor(baseEffects, params) {
    const { center, radius } = params || {};
    const fx = SKILL_FX.pyroclasm || {};
    const colors = fx.colors || {};
    
    if (!center) return;
    
    const blastRadius = (radius || 20) * 1.5;
    const scene = baseEffects.scene;
  
  // ============================================================================
  // STAGE 1: GROUND CRATER (immediate)
  // ============================================================================
  
  // Main crater - dark scorched earth
  const craterGeo = new THREE.CircleGeometry(blastRadius * 0.4, 64);
  const craterMat = new THREE.MeshBasicMaterial({
    color: 0x1a0a00,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide
  });
  const crater = new THREE.Mesh(craterGeo, craterMat);
  crater.rotation.x = -Math.PI / 2;
  crater.position.set(center.x, 0.01, center.z);
  scene.add(crater);
  
  // Outer scorched ring
  const scorchedGeo = new THREE.RingGeometry(blastRadius * 0.4, blastRadius * 0.6, 64);
  const scorchedMat = new THREE.MeshBasicMaterial({
    color: 0x4a1a00,
    transparent: true,
    opacity: 0.7,
    side: THREE.DoubleSide
  });
  const scorched = new THREE.Mesh(scorchedGeo, scorchedMat);
  scorched.rotation.x = -Math.PI / 2;
  scorched.position.set(center.x, 0.01, center.z);
  scene.add(scorched);
  
  // ============================================================================
  // STAGE 2: GROUND CRACKS (radiating outward)
  // ============================================================================
  
  const cracks = [];
  const crackCount = 24;
  
  for (let i = 0; i < crackCount; i++) {
    const angle = (i / crackCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
    const crackLength = blastRadius * (0.7 + Math.random() * 0.3);
    
    // Create crack as a thin stretched box
    const crackGeo = new THREE.BoxGeometry(0.15, 0.1, crackLength);
    const crackMat = new THREE.MeshBasicMaterial({
      color: colors.secondary || "#8b0000",
      transparent: true,
      opacity: 0.8
    });
    const crack = new THREE.Mesh(crackGeo, crackMat);
    
    crack.position.set(
      center.x + Math.cos(angle) * crackLength * 0.5,
      0.05,
      center.z + Math.sin(angle) * crackLength * 0.5
    );
    crack.rotation.y = angle;
    
    scene.add(crack);
    cracks.push({ mesh: crack, mat: crackMat, delay: i * 20 });
  }
  
  // ============================================================================
  // STAGE 3: FIRE COLUMNS (erupting from cracks)
  // ============================================================================
  
  const columns = [];
  const columnCount = 16;
  
  for (let i = 0; i < columnCount; i++) {
    const angle = (i / columnCount) * Math.PI * 2;
    const dist = blastRadius * (0.3 + Math.random() * 0.4);
    const columnHeight = 8 + Math.random() * 6;
    const columnRadius = 0.4 + Math.random() * 0.3;
    
    // Fire column (cylinder)
    const columnGeo = new THREE.CylinderGeometry(columnRadius, columnRadius * 1.3, columnHeight, 16);
    const columnMat = new THREE.MeshBasicMaterial({
      color: colors.primary || "#ff4500",
      transparent: true,
      opacity: 0.85
    });
    const column = new THREE.Mesh(columnGeo, columnMat);
    
    column.position.set(
      center.x + Math.cos(angle) * dist,
      columnHeight * 0.5,
      center.z + Math.sin(angle) * dist
    );
    
    // Flame cone at top
    const coneGeo = new THREE.ConeGeometry(columnRadius * 2, columnRadius * 4, 12);
    const coneMat = new THREE.MeshBasicMaterial({
      color: colors.accent || "#ffd700",
      transparent: true,
      opacity: 0.7
    });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.y = columnHeight * 0.5 + columnRadius * 2;
    column.add(cone);
    
    scene.add(column);
    columns.push({ 
      mesh: column, 
      mat: columnMat, 
      coneMat,
      delay: i * 40,
      baseHeight: columnHeight,
      pos: column.position.clone()
    });
  }
  
  // ============================================================================
  // STAGE 4: SHOCKWAVE RINGS (expanding outward)
  // ============================================================================
  
  const shockwaves = [];
  const shockwaveCount = 6;
  
  for (let i = 0; i < shockwaveCount; i++) {
    const ringGeo = new THREE.RingGeometry(0.5, 1.5, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: i < 2 ? (colors.explosion || "#ffff00") : (colors.primary || "#ff4500"),
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(center.x, 0.1, center.z);
    
    scene.add(ring);
    shockwaves.push({ 
      mesh: ring, 
      mat: ringMat, 
      delay: i * 100,
      maxScale: blastRadius * (i + 1) / shockwaveCount
    });
  }
  
  // ============================================================================
  // STAGE 5: CENTRAL EXPLOSION PILLAR
  // ============================================================================
  
  const centralPillarGeo = new THREE.CylinderGeometry(1.2, 1.5, 15, 24);
  const centralPillarMat = new THREE.MeshBasicMaterial({
    color: colors.explosion || "#ffff00",
    transparent: true,
    opacity: 0
  });
  const centralPillar = new THREE.Mesh(centralPillarGeo, centralPillarMat);
  centralPillar.position.set(center.x, 7.5, center.z);
  scene.add(centralPillar);
  
  // Explosion core at base
  const coreGeo = new THREE.SphereGeometry(2, 24, 24);
  const coreMat = new THREE.MeshBasicMaterial({
    color: colors.explosion || "#ffff00",
    transparent: true,
    opacity: 0
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.position.set(center.x, 1, center.z);
  scene.add(core);
  
  // ============================================================================
  // STAGE 6: DEBRIS PARTICLES
  // ============================================================================
  
  const debrisParticles = [];
  const debrisCount = 120;
  
  setTimeout(() => {
    for (let i = 0; i < debrisCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 8 + Math.random() * 8;
      const upSpeed = 10 + Math.random() * 12;
      
      const velocity = new THREE.Vector3(
        Math.cos(angle) * speed,
        upSpeed,
        Math.sin(angle) * speed
      );
      
      const particleColors = [colors.primary || "#ff4500", colors.secondary || "#8b0000", colors.accent || "#ffd700", "#ff6b35"];
      const color = particleColors[Math.floor(Math.random() * particleColors.length)];
      
      baseEffects.queue.push({
        pos: center.clone(),
        vel: velocity,
        gravity: -25,
        color,
        size: 0.15 + Math.random() * 0.15,
        life: 2.0 + Math.random() * 0.8,
        startTime: performance.now()
      });
    }
  }, 150);
  
  // Secondary smoke particles
  setTimeout(() => {
    for (let i = 0; i < 60; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 4;
      
      const velocity = new THREE.Vector3(
        Math.cos(angle) * speed,
        8 + Math.random() * 6,
        Math.sin(angle) * speed
      );
      
      baseEffects.queue.push({
        pos: center.clone(),
        vel: velocity,
        gravity: -8,
        color: 0x2a2a2a,
        size: 0.25 + Math.random() * 0.2,
        life: 3.0 + Math.random() * 1.0,
        startTime: performance.now()
      });
    }
  }, 300);
  
  // ============================================================================
  // ANIMATION LOOP
  // ============================================================================
  
  const startTime = performance.now();
  const duration = 2500; // 2.5 seconds
  
  function animate() {
    const elapsed = performance.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    if (progress >= 1) {
      // Cleanup
      scene.remove(crater, scorched, centralPillar, core);
      craterGeo.dispose();
      craterMat.dispose();
      scorchedGeo.dispose();
      scorchedMat.dispose();
      centralPillarGeo.dispose();
      centralPillarMat.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      
      cracks.forEach(({ mesh, mat }) => {
        scene.remove(mesh);
        mesh.geometry.dispose();
        mat.dispose();
      });
      
      columns.forEach(({ mesh, mat, coneMat }) => {
        scene.remove(mesh);
        mesh.geometry.dispose();
        mat.dispose();
        mesh.children[0]?.geometry.dispose();
        coneMat.dispose();
      });
      
      shockwaves.forEach(({ mesh, mat }) => {
        scene.remove(mesh);
        mesh.geometry.dispose();
        mat.dispose();
      });
      
      return;
    }
    
    // Animate cracks appearing
    cracks.forEach(({ mesh, mat, delay }) => {
      const crackProgress = Math.max(0, Math.min((elapsed - delay) / 300, 1));
      mat.opacity = 0.8 * crackProgress * (1 - progress * 0.5);
      mesh.scale.z = crackProgress;
    });
    
    // Animate fire columns erupting
    columns.forEach(({ mesh, mat, coneMat, delay, baseHeight, pos }) => {
      const columnProgress = Math.max(0, Math.min((elapsed - delay) / 400, 1));
      const eruptProgress = Math.pow(columnProgress, 0.5);
      
      mesh.scale.y = eruptProgress;
      mesh.position.y = pos.y * eruptProgress;
      mat.opacity = 0.85 * eruptProgress * (1 - progress * 0.7);
      coneMat.opacity = 0.7 * eruptProgress * (1 - progress * 0.7);
      
      // Flickering effect
      const flicker = 0.9 + Math.sin(elapsed * 0.02 + delay) * 0.1;
      mat.opacity *= flicker;
    });
    
    // Animate shockwaves expanding
    shockwaves.forEach(({ mesh, mat, delay, maxScale }) => {
      const waveProgress = Math.max(0, Math.min((elapsed - delay) / 600, 1));
      const scale = 0.5 + waveProgress * maxScale;
      mesh.scale.set(scale, scale, scale);
      mat.opacity = 0.8 * (1 - waveProgress);
    });
    
    // Animate central pillar
    if (elapsed > 200) {
      const pillarProgress = Math.min((elapsed - 200) / 500, 1);
      centralPillarMat.opacity = 0.9 * pillarProgress * (1 - Math.pow(progress, 2));
      coreMat.opacity = 0.95 * pillarProgress * (1 - Math.pow(progress, 2));
      
      // Pulsing core
      const pulse = 1 + Math.sin(elapsed * 0.015) * 0.15;
      core.scale.set(pulse, pulse, pulse);
    }
    
    // Fade out crater at the end
    if (progress > 0.7) {
      const fadeProgress = (progress - 0.7) / 0.3;
      craterMat.opacity = 0.9 * (1 - fadeProgress);
      scorchedMat.opacity = 0.7 * (1 - fadeProgress);
    }
    
    requestAnimationFrame(animate);
  }
  
    animate();
    
    // Add impact flash at center
    baseEffects.spawnImpact(center, 4, colors.explosion || "#ffff00", 3.0);
  }
}

export default function pyroclasmEffect(baseEffects, params) { return new PyroclasmEffect(baseEffects, params); }
