import * as THREE from "../../vendor/three/build/three.module.js";
import { SKILL_FX } from "../../config/skills_fx.js";

/**
 * Ember Burst Effect
 * 
 * UNIQUE VISUAL: Massive burst of glowing embers with:
 * - Central explosion core with pulsing glow
 * - Hundreds of floating ember particles drifting upward
 * - Radial ember streams
 * - Glowing ember trails
 * - Heat distortion waves
 */
class EmberBurstEffect {
  constructor(baseEffects, params) {
    const { center, radius } = params || {};
    const fx = SKILL_FX.ember_burst || {};
    const colors = fx.colors || {};
    
    if (!center) return;
    
    const burstRadius = (radius || 15) * 1.2;
    const scene = baseEffects.scene;
  
  // ============================================================================
  // STAGE 1: CENTRAL EXPLOSION CORE
  // ============================================================================
  
  // Inner core (bright yellow)
  const coreGeo = new THREE.SphereGeometry(0.8, 24, 24);
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0xffff00,
    transparent: true,
    opacity: 1.0
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.position.copy(center);
  scene.add(core);
  
  // Middle glow layer (orange)
  const glowGeo = new THREE.SphereGeometry(1.4, 24, 24);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0xffa500,
    transparent: true,
    opacity: 0.7
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.position.copy(center);
  scene.add(glow);
  
  // Outer glow layer (red-orange)
  const outerGlowGeo = new THREE.SphereGeometry(2.0, 24, 24);
  const outerGlowMat = new THREE.MeshBasicMaterial({
    color: 0xff6347,
    transparent: true,
    opacity: 0.4
  });
  const outerGlow = new THREE.Mesh(outerGlowGeo, outerGlowMat);
  outerGlow.position.copy(center);
  scene.add(outerGlow);
  
  // ============================================================================
  // STAGE 2: RADIAL EMBER STREAMS
  // ============================================================================
  
  const emberStreams = [];
  const streamCount = 20;
  
  for (let i = 0; i < streamCount; i++) {
    const angle = (i / streamCount) * Math.PI * 2;
    const streamLength = burstRadius * (0.6 + Math.random() * 0.4);
    
    // Create ember stream as a cone
    const coneGeo = new THREE.ConeGeometry(0.3, streamLength, 8);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0xff8c00,
      transparent: true,
      opacity: 0.7
    });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    
    const endX = center.x + Math.cos(angle) * streamLength * 0.5;
    const endZ = center.z + Math.sin(angle) * streamLength * 0.5;
    
    cone.position.set(endX, center.y + 0.5, endZ);
    cone.rotation.z = Math.PI / 2;
    cone.rotation.y = angle;
    
    scene.add(cone);
    emberStreams.push({ mesh: cone, mat: coneMat, angle });
  }
  
  // ============================================================================
  // STAGE 3: FLOATING EMBER PARTICLES (3D spheres)
  // ============================================================================
  
  const embers = [];
  const emberCount = 150;
  
  for (let i = 0; i < emberCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * burstRadius * 0.8;
    const emberSize = 0.08 + Math.random() * 0.12;
    
    const emberGeo = new THREE.SphereGeometry(emberSize, 8, 8);
    const emberColors = [0xff4500, 0xffa500, 0xff6347, 0xff8c00];
    const emberColor = emberColors[Math.floor(Math.random() * emberColors.length)];
    
    const emberMat = new THREE.MeshBasicMaterial({
      color: emberColor,
      transparent: true,
      opacity: 0.9
    });
    const ember = new THREE.Mesh(emberGeo, emberMat);
    
    const startX = center.x + Math.cos(angle) * dist;
    const startZ = center.z + Math.sin(angle) * dist;
    
    ember.position.set(startX, center.y + Math.random() * 0.5, startZ);
    
    scene.add(ember);
    
    // Velocity for upward drift
    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      3 + Math.random() * 4,
      (Math.random() - 0.5) * 2
    );
    
    embers.push({ 
      mesh: ember, 
      mat: emberMat, 
      velocity,
      startPos: ember.position.clone(),
      delay: i * 8
    });
  }
  
  // ============================================================================
  // STAGE 4: HEAT DISTORTION WAVES
  // ============================================================================
  
  const heatWaves = [];
  const waveCount = 5;
  
  for (let i = 0; i < waveCount; i++) {
    const waveGeo = new THREE.RingGeometry(0.5, 1.5, 64);
    const waveMat = new THREE.MeshBasicMaterial({
      color: 0xffa500,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    });
    const wave = new THREE.Mesh(waveGeo, waveMat);
    wave.rotation.x = -Math.PI / 2;
    wave.position.set(center.x, 0.1, center.z);
    
    scene.add(wave);
    heatWaves.push({ 
      mesh: wave, 
      mat: waveMat, 
      delay: i * 120,
      maxScale: burstRadius * (i + 1) / waveCount
    });
  }
  
  // ============================================================================
  // STAGE 5: GROUND SCORCH MARKS
  // ============================================================================
  
  const scorch = new THREE.Mesh(
    new THREE.CircleGeometry(burstRadius * 0.5, 64),
    new THREE.MeshBasicMaterial({
      color: 0x2a1a0a,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide
    })
  );
  scorch.rotation.x = -Math.PI / 2;
  scorch.position.set(center.x, 0.01, center.z);
  scene.add(scorch);
  
  // ============================================================================
  // STAGE 6: PARTICLE BURST (using baseEffects queue)
  // ============================================================================
  
  // Main burst
  for (let i = 0; i < 100; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 5 + Math.random() * 8;
    const upSpeed = 4 + Math.random() * 6;
    
    const velocity = new THREE.Vector3(
      Math.cos(angle) * speed,
      upSpeed,
      Math.sin(angle) * speed
    );
    
    const colors = [0xff4500, 0xffa500, 0xff6347];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    baseEffects.queue.push({
      pos: center.clone(),
      vel: velocity,
      gravity: -12,
      color,
      size: 0.12 + Math.random() * 0.1,
      life: 2.0 + Math.random() * 1.0,
      startTime: performance.now()
    });
  }
  
  // Secondary upward burst
  setTimeout(() => {
    for (let i = 0; i < 60; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 3;
      
      const velocity = new THREE.Vector3(
        Math.cos(angle) * speed,
        8 + Math.random() * 5,
        Math.sin(angle) * speed
      );
      
      baseEffects.queue.push({
        pos: center.clone(),
        vel: velocity,
        gravity: -8,
        color: 0xffa500,
        size: 0.1 + Math.random() * 0.08,
        life: 2.5 + Math.random() * 1.0,
        startTime: performance.now()
      });
    }
  }, 200);
  
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
      scene.remove(core, glow, outerGlow, scorch);
      coreGeo.dispose();
      coreMat.dispose();
      glowGeo.dispose();
      glowMat.dispose();
      outerGlowGeo.dispose();
      outerGlowMat.dispose();
      scorch.geometry.dispose();
      scorch.material.dispose();
      
      emberStreams.forEach(({ mesh, mat }) => {
        scene.remove(mesh);
        mesh.geometry.dispose();
        mat.dispose();
      });
      
      embers.forEach(({ mesh, mat }) => {
        scene.remove(mesh);
        mesh.geometry.dispose();
        mat.dispose();
      });
      
      heatWaves.forEach(({ mesh, mat }) => {
        scene.remove(mesh);
        mesh.geometry.dispose();
        mat.dispose();
      });
      
      return;
    }
    
    // Animate core pulsing
    const pulse = 1 + Math.sin(elapsed * 0.015) * 0.2;
    core.scale.set(pulse, pulse, pulse);
    glow.scale.set(pulse * 1.1, pulse * 1.1, pulse * 1.1);
    outerGlow.scale.set(pulse * 1.2, pulse * 1.2, pulse * 1.2);
    
    // Fade out core
    coreMat.opacity = 1.0 * (1 - progress);
    glowMat.opacity = 0.7 * (1 - progress);
    outerGlowMat.opacity = 0.4 * (1 - progress);
    
    // Animate ember streams
    emberStreams.forEach(({ mesh, mat, angle }) => {
      const streamProgress = Math.min(progress * 1.5, 1);
      mesh.scale.z = streamProgress;
      mat.opacity = 0.7 * (1 - progress);
      
      // Rotate slightly
      mesh.rotation.y = angle + elapsed * 0.001;
    });
    
    // Animate floating embers
    embers.forEach(({ mesh, mat, velocity, startPos, delay }) => {
      const emberProgress = Math.max(0, Math.min((elapsed - delay) / 2000, 1));
      
      if (emberProgress > 0) {
        const dt = 0.016; // ~60fps
        mesh.position.x += velocity.x * dt;
        mesh.position.y += velocity.y * dt;
        mesh.position.z += velocity.z * dt;
        
        // Apply gravity
        velocity.y -= 12 * dt;
        
        // Wobble effect
        const wobble = Math.sin(elapsed * 0.01 + delay) * 0.02;
        mesh.position.x += wobble;
        mesh.position.z += wobble;
        
        // Fade out
        mat.opacity = 0.9 * (1 - emberProgress);
        
        // Flicker
        const flicker = 0.8 + Math.sin(elapsed * 0.03 + delay) * 0.2;
        mat.opacity *= flicker;
      }
    });
    
    // Animate heat waves
    heatWaves.forEach(({ mesh, mat, delay, maxScale }) => {
      const waveProgress = Math.max(0, Math.min((elapsed - delay) / 800, 1));
      const scale = 0.5 + waveProgress * maxScale;
      mesh.scale.set(scale, scale, scale);
      mat.opacity = 0.6 * (1 - waveProgress);
    });
    
    // Fade scorch mark
    if (progress > 0.6) {
      const fadeProgress = (progress - 0.6) / 0.4;
      scorch.material.opacity = 0.7 * (1 - fadeProgress);
    }
    
    requestAnimationFrame(animate);
  }
  
    animate();
    
    // Add impact flash
    baseEffects.spawnImpact(center, 3, colors.primary || "#ffa500", 2.0);
  }
}

export default function emberBurstEffect(baseEffects, params) { return new EmberBurstEffect(baseEffects, params); }