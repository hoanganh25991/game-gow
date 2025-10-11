import * as THREE from "../../vendor/three/build/three.module.js";
import { SKILL_FX } from "../../config/skills_fx.js";

/**
 * Inferno Overload Effect
 * 
 * UNIQUE VISUAL: Massive explosive overload with:
 * - Spiraling fire tornadoes
 * - Multiple explosion waves
 * - Intense particle bursts
 * - Radiating fire beams
 * - Pulsing overload core
 * - Ground devastation
 */
class InfernoOverloadEffect {
  constructor(baseEffects, params) {
    const { center, radius, activation, duration = 3000 } = params || {};
    const fx = SKILL_FX.inferno_overload || {};
    const colors = fx.colors || {};
    
    if (!center) return;
    
    const overloadRadius = (radius || 15) * 1.5;
    const scene = baseEffects.scene;
  
  // ============================================================================
  // STAGE 1: MASSIVE EXPLOSION CORE
  // ============================================================================
  
  // Inner explosion core (yellow-white)
  const coreGeo = new THREE.SphereGeometry(2.5, 32, 32);
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0xffff00,
    transparent: true,
    opacity: 1.0
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.position.set(center.x, 1.5, center.z);
  scene.add(core);
  
  // Middle explosion layer (orange)
  const midGeo = new THREE.SphereGeometry(3.5, 32, 32);
  const midMat = new THREE.MeshBasicMaterial({
    color: 0xff4500,
    transparent: true,
    opacity: 0.7
  });
  const mid = new THREE.Mesh(midGeo, midMat);
  mid.position.set(center.x, 1.5, center.z);
  scene.add(mid);
  
  // Outer explosion layer (red)
  const outerGeo = new THREE.SphereGeometry(5.0, 32, 32);
  const outerMat = new THREE.MeshBasicMaterial({
    color: 0xff6347,
    transparent: true,
    opacity: 0.4
  });
  const outer = new THREE.Mesh(outerGeo, outerMat);
  outer.position.set(center.x, 1.5, center.z);
  scene.add(outer);
  
  // ============================================================================
  // STAGE 2: SPIRALING FIRE TORNADOES
  // ============================================================================
  
  const spirals = [];
  const spiralCount = 6;
  
  for (let i = 0; i < spiralCount; i++) {
    const angle = (i / spiralCount) * Math.PI * 2;
    const spiralDist = overloadRadius * 0.5;
    
    const spiralPoints = [];
    const segments = 50;
    const turns = 4;
    const height = 5;
    const spiralRadius = 1.5;
    
    const spiralCenterX = center.x + Math.cos(angle) * spiralDist;
    const spiralCenterZ = center.z + Math.sin(angle) * spiralDist;
    
    for (let j = 0; j <= segments; j++) {
      const t = j / segments;
      const spiralAngle = t * Math.PI * 2 * turns;
      const r = spiralRadius * (1 - t * 0.3);
      const x = spiralCenterX + Math.cos(spiralAngle) * r;
      const y = center.y + t * height;
      const z = spiralCenterZ + Math.sin(spiralAngle) * r;
      spiralPoints.push(new THREE.Vector3(x, y, z));
    }
    
    const spiralGeo = new THREE.BufferGeometry().setFromPoints(spiralPoints);
    const spiralColor = i % 2 === 0 ? 0xff4500 : 0xffd700;
    const spiralMat = new THREE.LineBasicMaterial({
      color: spiralColor,
      transparent: true,
      opacity: 0,
      linewidth: 3
    });
    const spiral = new THREE.Line(spiralGeo, spiralMat);
    
    scene.add(spiral);
    spirals.push({ 
      mesh: spiral, 
      mat: spiralMat, 
      delay: i * 100,
      centerX: spiralCenterX,
      centerZ: spiralCenterZ
    });
  }
  
  // ============================================================================
  // STAGE 3: EXPLOSION SHOCKWAVES
  // ============================================================================
  
  const shockwaves = [];
  const waveCount = 5;
  
  for (let i = 0; i < waveCount; i++) {
    const waveGeo = new THREE.RingGeometry(1.0, 2.0, 64);
    const waveColor = i === 0 ? 0xffff00 : 0xff4500;
    const waveMat = new THREE.MeshBasicMaterial({
      color: waveColor,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    const wave = new THREE.Mesh(waveGeo, waveMat);
    wave.rotation.x = -Math.PI / 2;
    wave.position.set(center.x, 0.1, center.z);
    
    scene.add(wave);
    shockwaves.push({ 
      mesh: wave, 
      mat: waveMat, 
      delay: i * 120,
      maxScale: overloadRadius * (i + 1) / waveCount
    });
  }
  
  // ============================================================================
  // STAGE 4: RADIATING FIRE BEAMS
  // ============================================================================
  
  const beams = [];
  const beamCount = 20;
  
  for (let i = 0; i < beamCount; i++) {
    const angle = (i / beamCount) * Math.PI * 2;
    const beamLength = overloadRadius;
    
    const beamGeo = new THREE.BoxGeometry(0.2, 0.2, beamLength);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    
    beam.position.set(
      center.x + Math.cos(angle) * beamLength * 0.5,
      0.5,
      center.z + Math.sin(angle) * beamLength * 0.5
    );
    beam.rotation.y = angle;
    
    scene.add(beam);
    beams.push({ mesh: beam, mat: beamMat, delay: i * 30, angle });
  }
  
  // ============================================================================
  // STAGE 5: CENTRAL OVERLOAD PILLAR
  // ============================================================================
  
  const pillarGeo = new THREE.CylinderGeometry(1.0, 1.2, 12, 24);
  const pillarMat = new THREE.MeshBasicMaterial({
    color: 0xffff00,
    transparent: true,
    opacity: 0
  });
  const pillar = new THREE.Mesh(pillarGeo, pillarMat);
  pillar.position.set(center.x, 6, center.z);
  scene.add(pillar);
  
  // ============================================================================
  // STAGE 6: GROUND DEVASTATION
  // ============================================================================
  
  const craterGeo = new THREE.CircleGeometry(overloadRadius * 0.6, 64);
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
  
  // ============================================================================
  // STAGE 7: PARTICLE EXPLOSIONS
  // ============================================================================
  
  // Main explosion burst
  setTimeout(() => {
    for (let i = 0; i < 120; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 8 + Math.random() * 12;
      const upSpeed = 10 + Math.random() * 15;
      
      const velocity = new THREE.Vector3(
        Math.cos(angle) * speed,
        upSpeed,
        Math.sin(angle) * speed
      );
      
      const colors = [0xffff00, 0xff4500, 0xffd700];
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      baseEffects.queue.push({
        pos: center.clone().add(new THREE.Vector3(0, 1, 0)),
        vel: velocity,
        gravity: -25,
        color,
        size: 0.15 + Math.random() * 0.15,
        life: 2.0 + Math.random() * 1.0,
        startTime: performance.now()
      });
    }
  }, 100);
  
  // Secondary wave
  setTimeout(() => {
    for (let i = 0; i < 80; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 6 + Math.random() * 8;
      
      const velocity = new THREE.Vector3(
        Math.cos(angle) * speed,
        12 + Math.random() * 8,
        Math.sin(angle) * speed
      );
      
      baseEffects.queue.push({
        pos: center.clone(),
        vel: velocity,
        gravity: -20,
        color: 0xffd700,
        size: 0.12 + Math.random() * 0.1,
        life: 2.5 + Math.random() * 0.8,
        startTime: performance.now()
      });
    }
  }, 250);
  
  // ============================================================================
  // ANIMATION LOOP
  // ============================================================================
  
  const startTime = performance.now();
  
  function animate() {
    const elapsed = performance.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    if (progress >= 1) {
      // Cleanup
      scene.remove(core, mid, outer, pillar, crater);
      coreGeo.dispose();
      coreMat.dispose();
      midGeo.dispose();
      midMat.dispose();
      outerGeo.dispose();
      outerMat.dispose();
      pillarGeo.dispose();
      pillarMat.dispose();
      craterGeo.dispose();
      craterMat.dispose();
      
      spirals.forEach(({ mesh, mat }) => {
        scene.remove(mesh);
        mesh.geometry.dispose();
        mat.dispose();
      });
      
      shockwaves.forEach(({ mesh, mat }) => {
        scene.remove(mesh);
        mesh.geometry.dispose();
        mat.dispose();
      });
      
      beams.forEach(({ mesh, mat }) => {
        scene.remove(mesh);
        mesh.geometry.dispose();
        mat.dispose();
      });
      
      return;
    }
    
    // Animate explosion core (massive pulsing)
    const corePulse = 1 + Math.sin(elapsed * 0.015) * 0.3;
    core.scale.set(corePulse, corePulse, corePulse);
    mid.scale.set(corePulse * 1.1, corePulse * 1.1, corePulse * 1.1);
    outer.scale.set(corePulse * 1.2, corePulse * 1.2, corePulse * 1.2);
    
    // Fade explosion
    const explosionFade = Math.max(0, 1 - progress * 1.5);
    coreMat.opacity = 1.0 * explosionFade;
    midMat.opacity = 0.7 * explosionFade;
    outerMat.opacity = 0.4 * explosionFade;
    
    // Animate spirals
    spirals.forEach(({ mesh, mat, delay }) => {
      const spiralProgress = Math.max(0, Math.min((elapsed - delay) / 800, 1));
      mat.opacity = 0.9 * spiralProgress * (1 - progress * 0.7);
      mesh.rotation.y = elapsed * 0.003;
    });
    
    // Animate shockwaves
    shockwaves.forEach(({ mesh, mat, delay, maxScale }) => {
      const waveProgress = Math.max(0, Math.min((elapsed - delay) / 700, 1));
      const scale = 1.0 + waveProgress * maxScale;
      mesh.scale.set(scale, scale, scale);
      mat.opacity = 0.8 * (1 - waveProgress);
    });
    
    // Animate beams
    beams.forEach(({ mesh, mat, delay, angle }) => {
      const beamProgress = Math.max(0, Math.min((elapsed - delay) / 400, 1));
      mat.opacity = 0.8 * beamProgress * (1 - progress);
      mesh.scale.z = beamProgress;
    });
    
    // Animate central pillar
    if (elapsed > 200) {
      const pillarProgress = Math.min((elapsed - 200) / 600, 1);
      pillarMat.opacity = 0.9 * pillarProgress * (1 - Math.pow(progress, 2));
      
      const pillarPulse = 1 + Math.sin(elapsed * 0.012) * 0.15;
      pillar.scale.set(pillarPulse, 1, pillarPulse);
    }
    
    // Fade crater at the end
    if (progress > 0.7) {
      const fadeProgress = (progress - 0.7) / 0.3;
      craterMat.opacity = 0.9 * (1 - fadeProgress);
    }
    
    requestAnimationFrame(animate);
  }
  
    animate();
    
    // Add massive impact
    if (activation) {
      baseEffects.spawnImpact(center, 4, colors.explosion || "#ffff00", 3.0);
    }
  }
}

export default function infernoOverloadEffect(baseEffects, params) { return new InfernoOverloadEffect(baseEffects, params); }