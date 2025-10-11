import * as THREE from "../../vendor/three/build/three.module.js";
import { SKILL_FX } from "../../config/skills_fx.js";

/**
 * Blazing Aura Effect
 * 
 * UNIQUE VISUAL: Intense white-hot aura with:
 * - Brilliant white-hot core with golden glow
 * - Multiple pulsing flame rings (white → gold → orange)
 * - Intense heat distortion waves
 * - Floating golden particles
 * - Tall flame pillars
 * - Spiral heat effect
 */
class BlazingAuraEffect {
  constructor(baseEffects, params) {
    const { center, radius, activation, duration = 6000 } = params || {};
  const fx = SKILL_FX.blazing_aura || {};
  const colors = fx.colors || {};
  
  if (!center) return;
  
  const auraRadius = (radius || 12) * 1.2;
  const scene = baseEffects.scene;
  
  // ============================================================================
  // STAGE 1: WHITE-HOT CORE (brilliant center)
  // ============================================================================
  
  // Inner white core
  const coreGeo = new THREE.SphereGeometry(0.5, 24, 24);
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 1.0
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.position.set(center.x, 0.8, center.z);
  scene.add(core);
  
  // Golden glow layer
  const glowGeo = new THREE.SphereGeometry(0.8, 24, 24);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0xffd700,
    transparent: true,
    opacity: 0.7
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.position.set(center.x, 0.8, center.z);
  scene.add(glow);
  
  // Outer orange glow
  const outerGlowGeo = new THREE.SphereGeometry(1.2, 24, 24);
  const outerGlowMat = new THREE.MeshBasicMaterial({
    color: 0xffa500,
    transparent: true,
    opacity: 0.4
  });
  const outerGlow = new THREE.Mesh(outerGlowGeo, outerGlowMat);
  outerGlow.position.set(center.x, 0.8, center.z);
  scene.add(outerGlow);
  
  // ============================================================================
  // STAGE 2: CONCENTRIC FLAME RINGS (white → gold → orange)
  // ============================================================================
  
  const rings = [];
  const ringCount = 4;
  
  for (let i = 0; i < ringCount; i++) {
    const ringRadius = auraRadius * (0.25 + i * 0.25);
    const ringGeo = new THREE.RingGeometry(ringRadius - 0.4, ringRadius + 0.4, 64);
    
    let ringColor;
    if (i === 0) ringColor = 0xffffff;
    else if (i === 1) ringColor = 0xffd700;
    else if (i === 2) ringColor = 0xffa500;
    else ringColor = 0xff8c00;
    
    const ringMat = new THREE.MeshBasicMaterial({
      color: ringColor,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(center.x, 0.05, center.z);
    
    scene.add(ring);
    rings.push({ mesh: ring, mat: ringMat, baseRadius: ringRadius, index: i });
  }
  
  // ============================================================================
  // STAGE 3: TALL FLAME PILLARS
  // ============================================================================
  
  const pillars = [];
  const pillarCount = 16;
  
  for (let i = 0; i < pillarCount; i++) {
    const angle = (i / pillarCount) * Math.PI * 2;
    const pillarRadius = auraRadius * 0.7;
    const pillarHeight = 3.5 + Math.random() * 1.0;
    
    const pillarGeo = new THREE.CylinderGeometry(0.2, 0.25, pillarHeight, 8);
    const pillarColor = i % 2 === 0 ? 0xffd700 : 0xffff00;
    const pillarMat = new THREE.MeshBasicMaterial({
      color: pillarColor,
      transparent: true,
      opacity: 0.8
    });
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    
    pillar.position.set(
      center.x + Math.cos(angle) * pillarRadius,
      pillarHeight * 0.5,
      center.z + Math.sin(angle) * pillarRadius
    );
    
    // Flame cone at top
    const coneGeo = new THREE.ConeGeometry(0.35, 0.8, 8);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.7
    });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.y = pillarHeight * 0.5 + 0.4;
    pillar.add(cone);
    
    scene.add(pillar);
    pillars.push({ mesh: pillar, mat: pillarMat, coneMat, index: i, baseHeight: pillarHeight });
  }
  
  // ============================================================================
  // STAGE 4: FLOATING GOLDEN PARTICLES
  // ============================================================================
  
  const particles = [];
  const particleCount = 50;
  
  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * auraRadius * 0.9;
    const particleSize = 0.1 + Math.random() * 0.08;
    
    const particleGeo = new THREE.SphereGeometry(particleSize, 8, 8);
    const particleColors = [0xffffff, 0xffd700, 0xffff00];
    const particleColor = particleColors[Math.floor(Math.random() * particleColors.length)];
    
    const particleMat = new THREE.MeshBasicMaterial({
      color: particleColor,
      transparent: true,
      opacity: 0.9
    });
    const particle = new THREE.Mesh(particleGeo, particleMat);
    
    const startX = center.x + Math.cos(angle) * dist;
    const startZ = center.z + Math.sin(angle) * dist;
    
    particle.position.set(startX, center.y + Math.random() * 0.5, startZ);
    
    scene.add(particle);
    
    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.8,
      2 + Math.random() * 2,
      (Math.random() - 0.5) * 0.8
    );
    
    particles.push({ 
      mesh: particle, 
      mat: particleMat, 
      velocity,
      startPos: particle.position.clone(),
      resetHeight: 5,
      angle,
      dist
    });
  }
  
  // ============================================================================
  // STAGE 5: HEAT DISTORTION WAVES
  // ============================================================================
  
  const heatWaves = [];
  const waveCount = 4;
  
  for (let i = 0; i < waveCount; i++) {
    const waveGeo = new THREE.RingGeometry(0.5, 1.2, 64);
    const waveMat = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide
    });
    const wave = new THREE.Mesh(waveGeo, waveMat);
    wave.rotation.x = -Math.PI / 2;
    wave.position.set(center.x, 0.15, center.z);
    
    scene.add(wave);
    heatWaves.push({ mesh: wave, mat: waveMat, index: i });
  }
  
  // ============================================================================
  // STAGE 6: SPIRAL HEAT EFFECT
  // ============================================================================
  
  const spiralPoints = [];
  const spiralSegments = 60;
  const spiralTurns = 3;
  const spiralHeight = 4;
  const spiralRadius = auraRadius * 0.4;
  
  for (let i = 0; i <= spiralSegments; i++) {
    const t = i / spiralSegments;
    const angle = t * Math.PI * 2 * spiralTurns;
    const r = spiralRadius * (1 - t * 0.3);
    const x = center.x + Math.cos(angle) * r;
    const y = center.y + t * spiralHeight;
    const z = center.z + Math.sin(angle) * r;
    spiralPoints.push(new THREE.Vector3(x, y, z));
  }
  
  const spiralGeo = new THREE.BufferGeometry().setFromPoints(spiralPoints);
  const spiralMat = new THREE.LineBasicMaterial({
    color: 0xffd700,
    transparent: true,
    opacity: 0.7,
    linewidth: 2
  });
  const spiral = new THREE.Line(spiralGeo, spiralMat);
  scene.add(spiral);
  
  // ============================================================================
  // ACTIVATION BURST (if initial activation)
  // ============================================================================
  
  if (activation) {
    baseEffects.spawnSphere(center, 0.5, colors.core || "#ffffff", 0.4, 1.0);
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        baseEffects.spawnRing(
          center,
          auraRadius * (i + 1) / 3,
          i === 0 ? "#ffffff" : "#ffd700",
          0.6,
          0.7,
          0.6
        );
      }, i * 100);
    }
  }
  
  // ============================================================================
  // ANIMATION LOOP
  // ============================================================================
  
  const startTime = performance.now();
  
  function animate() {
    const elapsed = performance.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    if (progress >= 1) {
      // Cleanup
      scene.remove(core, glow, outerGlow, spiral);
      coreGeo.dispose();
      coreMat.dispose();
      glowGeo.dispose();
      glowMat.dispose();
      outerGlowGeo.dispose();
      outerGlowMat.dispose();
      spiralGeo.dispose();
      spiralMat.dispose();
      
      rings.forEach(({ mesh, mat }) => {
        scene.remove(mesh);
        mesh.geometry.dispose();
        mat.dispose();
      });
      
      pillars.forEach(({ mesh, mat, coneMat }) => {
        scene.remove(mesh);
        mesh.geometry.dispose();
        mat.dispose();
        mesh.children[0]?.geometry.dispose();
        coneMat.dispose();
      });
      
      particles.forEach(({ mesh, mat }) => {
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
    
    // Animate white-hot core (intense pulsing)
    const corePulse = 1 + Math.sin(elapsed * 0.01) * 0.25;
    core.scale.set(corePulse, corePulse, corePulse);
    glow.scale.set(corePulse * 1.15, corePulse * 1.15, corePulse * 1.15);
    outerGlow.scale.set(corePulse * 1.3, corePulse * 1.3, corePulse * 1.3);
    
    coreMat.opacity = 1.0;
    glowMat.opacity = 0.7 + Math.sin(elapsed * 0.008) * 0.2;
    outerGlowMat.opacity = 0.4 + Math.sin(elapsed * 0.006) * 0.15;
    
    // Animate rings (intense pulsing)
    rings.forEach(({ mesh, mat, baseRadius, index }) => {
      const pulse = 1 + Math.sin(elapsed * 0.004 + index * 0.4) * 0.15;
      mesh.scale.set(pulse, pulse, pulse);
      
      const opacityPulse = 0.6 + Math.sin(elapsed * 0.005 + index * 0.3) * 0.3;
      mat.opacity = opacityPulse;
    });
    
    // Animate pillars (flickering)
    pillars.forEach(({ mesh, mat, coneMat, index, baseHeight }) => {
      const flicker = 0.8 + Math.sin(elapsed * 0.02 + index * 0.5) * 0.2;
      mat.opacity = 0.8 * flicker;
      coneMat.opacity = 0.7 * flicker;
      
      const heightVar = Math.sin(elapsed * 0.01 + index) * 0.12;
      mesh.scale.y = 1 + heightVar;
    });
    
    // Animate floating particles
    particles.forEach(({ mesh, mat, velocity, startPos, resetHeight, angle, dist }) => {
      const dt = 0.016;
      mesh.position.y += velocity.y * dt;
      mesh.position.x += velocity.x * dt;
      mesh.position.z += velocity.z * dt;
      
      const wobble = Math.sin(elapsed * 0.008 + angle) * 0.03;
      mesh.position.x += wobble;
      mesh.position.z += wobble;
      
      if (mesh.position.y > startPos.y + resetHeight) {
        mesh.position.copy(startPos);
      }
      
      const flicker = 0.8 + Math.sin(elapsed * 0.015 + angle) * 0.2;
      mat.opacity = 0.9 * flicker;
    });
    
    // Animate heat waves
    heatWaves.forEach(({ mesh, mat, index }) => {
      const waveProgress = (elapsed * 0.0015 + index * 0.25) % 1;
      const scale = 0.5 + waveProgress * auraRadius;
      mesh.scale.set(scale, scale, scale);
      mat.opacity = 0.4 * (1 - waveProgress);
    });
    
    // Rotate spiral
    spiral.rotation.y = elapsed * 0.002;
    spiralMat.opacity = 0.7 + Math.sin(elapsed * 0.005) * 0.2;
    
    // Fade out at the end
    if (progress > 0.8) {
      const fadeProgress = (progress - 0.8) / 0.2;
      const fadeMultiplier = 1 - fadeProgress;
      
      coreMat.opacity *= fadeMultiplier;
      glowMat.opacity *= fadeMultiplier;
      outerGlowMat.opacity *= fadeMultiplier;
      rings.forEach(({ mat }) => mat.opacity *= fadeMultiplier);
      pillars.forEach(({ mat, coneMat }) => {
        mat.opacity *= fadeMultiplier;
        coneMat.opacity *= fadeMultiplier;
      });
      particles.forEach(({ mat }) => mat.opacity *= fadeMultiplier);
      spiralMat.opacity *= fadeMultiplier;
    }
    
    requestAnimationFrame(animate);
  }
  
    animate();
  }
}

export default function blazingAuraEffect(baseEffects, params) { return new BlazingAuraEffect(baseEffects, params); }