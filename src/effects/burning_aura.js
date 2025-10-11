import * as THREE from "../../vendor/three/build/three.module.js";
import { SKILL_FX } from "../../config/skills_fx.js";

/**
 * Burning Aura Effect
 * 
 * UNIQUE VISUAL: Continuous burning aura around player with:
 * - Pulsing concentric flame rings
 * - Floating ember particles drifting upward
 * - Vertical flame spouts around perimeter
 * - Heat distortion waves
 * - Central glowing core
 */
class BurningAuraEffect {
  constructor(baseEffects, params) {
    const { center, radius, activation, duration = 6000 } = params || {};
    const fx = SKILL_FX.burning_aura || {};
    const colors = fx.colors || {};
    
    if (!center) return;
  
  const auraRadius = (radius || 14) * 1.0;
  const scene = baseEffects.scene;
  
  // ============================================================================
  // STAGE 1: CONCENTRIC FLAME RINGS (pulsing)
  // ============================================================================
  
  const rings = [];
  const ringCount = 3;
  
  for (let i = 0; i < ringCount; i++) {
    const ringRadius = auraRadius * (0.3 + i * 0.25);
    const ringGeo = new THREE.RingGeometry(ringRadius - 0.3, ringRadius + 0.3, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: i === 0 ? (colors.primary || "#ff8c00") : (i === 1 ? (colors.secondary || "#ffa500") : (colors.accent || "#ff6347")),
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(center.x, 0.05, center.z);
    
    scene.add(ring);
    rings.push({ mesh: ring, mat: ringMat, baseRadius: ringRadius, index: i });
  }
  
  // ============================================================================
  // STAGE 2: FLOATING EMBER PARTICLES
  // ============================================================================
  
  const embers = [];
  const emberCount = 40;
  
  for (let i = 0; i < emberCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * auraRadius * 0.9;
    const emberSize = 0.08 + Math.random() * 0.08;
    
    const emberGeo = new THREE.SphereGeometry(emberSize, 8, 8);
    const emberColors = [colors.ember || "#ff4500", colors.secondary || "#ffa500", colors.accent || "#ff6347"];
    const emberColor = emberColors[Math.floor(Math.random() * emberColors.length)];
    
    const emberMat = new THREE.MeshBasicMaterial({
      color: emberColor,
      transparent: true,
      opacity: 0.8
    });
    const ember = new THREE.Mesh(emberGeo, emberMat);
    
    const startX = center.x + Math.cos(angle) * dist;
    const startZ = center.z + Math.sin(angle) * dist;
    
    ember.position.set(startX, center.y + Math.random() * 0.5, startZ);
    
    scene.add(ember);
    
    // Velocity for upward drift
    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.5,
      1.5 + Math.random() * 1.5,
      (Math.random() - 0.5) * 0.5
    );
    
    embers.push({ 
      mesh: ember, 
      mat: emberMat, 
      velocity,
      startPos: ember.position.clone(),
      resetHeight: 4,
      angle,
      dist
    });
  }
  
  // ============================================================================
  // STAGE 3: FLAME SPOUTS (vertical pillars)
  // ============================================================================
  
  const spouts = [];
  const spoutCount = 12;
  
  for (let i = 0; i < spoutCount; i++) {
    const angle = (i / spoutCount) * Math.PI * 2;
    const spoutRadius = auraRadius * 0.75;
    const spoutHeight = 2.5;
    
    const spoutGeo = new THREE.CylinderGeometry(0.15, 0.2, spoutHeight, 8);
    const spoutMat = new THREE.MeshBasicMaterial({
      color: colors.secondary || "#ffa500",
      transparent: true,
      opacity: 0.7
    });
    const spout = new THREE.Mesh(spoutGeo, spoutMat);
    
    spout.position.set(
      center.x + Math.cos(angle) * spoutRadius,
      spoutHeight * 0.5,
      center.z + Math.sin(angle) * spoutRadius
    );
    
    // Flame cone at top
    const coneGeo = new THREE.ConeGeometry(0.3, 0.6, 8);
    const coneMat = new THREE.MeshBasicMaterial({
      color: colors.accent || "#ff6347",
      transparent: true,
      opacity: 0.6
    });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.y = spoutHeight * 0.5 + 0.3;
    spout.add(cone);
    
    scene.add(spout);
    spouts.push({ mesh: spout, mat: spoutMat, coneMat, index: i });
  }
  
  // ============================================================================
  // STAGE 4: CENTRAL GLOWING CORE
  // ============================================================================
  
  const coreGeo = new THREE.SphereGeometry(0.6, 16, 16);
  const coreMat = new THREE.MeshBasicMaterial({
    color: colors.primary || "#ff8c00",
    transparent: true,
    opacity: 0.5
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.position.set(center.x, 0.8, center.z);
  scene.add(core);
  
  // Outer glow layer
  const glowGeo = new THREE.SphereGeometry(0.9, 16, 16);
  const glowMat = new THREE.MeshBasicMaterial({
    color: colors.secondary || "#ffa500",
    transparent: true,
    opacity: 0.3
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.position.set(center.x, 0.8, center.z);
  scene.add(glow);
  
  // ============================================================================
  // STAGE 5: HEAT DISTORTION WAVES
  // ============================================================================
  
  const heatWaves = [];
  const waveCount = 2;
  
  for (let i = 0; i < waveCount; i++) {
    const waveGeo = new THREE.RingGeometry(0.5, 1.0, 64);
    const waveMat = new THREE.MeshBasicMaterial({
      color: colors.accent || "#ff6347",
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    const wave = new THREE.Mesh(waveGeo, waveMat);
    wave.rotation.x = -Math.PI / 2;
    wave.position.set(center.x, 0.1, center.z);
    
    scene.add(wave);
    heatWaves.push({ mesh: wave, mat: waveMat, index: i });
  }
  
  // ============================================================================
  // ACTIVATION BURST (if initial activation)
  // ============================================================================
  
  if (activation) {
    baseEffects.spawnRing(center, auraRadius, colors.primary || "#ff8c00", 1.0, 1.0, 0.6);
    baseEffects.spawnImpact(center, 2, colors.accent || "#ff6347", 1.5);
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
      rings.forEach(({ mesh, mat }) => {
        scene.remove(mesh);
        mesh.geometry.dispose();
        mat.dispose();
      });
      
      embers.forEach(({ mesh, mat }) => {
        scene.remove(mesh);
        mesh.geometry.dispose();
        mat.dispose();
      });
      
      spouts.forEach(({ mesh, mat, coneMat }) => {
        scene.remove(mesh);
        mesh.geometry.dispose();
        mat.dispose();
        mesh.children[0]?.geometry.dispose();
        coneMat.dispose();
      });
      
      scene.remove(core, glow);
      coreGeo.dispose();
      coreMat.dispose();
      glowGeo.dispose();
      glowMat.dispose();
      
      heatWaves.forEach(({ mesh, mat }) => {
        scene.remove(mesh);
        mesh.geometry.dispose();
        mat.dispose();
      });
      
      return;
    }
    
    // Animate pulsing rings
    rings.forEach(({ mesh, mat, baseRadius, index }) => {
      const pulse = 1 + Math.sin(elapsed * 0.003 + index * 0.5) * 0.1;
      mesh.scale.set(pulse, pulse, pulse);
      
      // Opacity pulsing
      const opacityPulse = 0.5 + Math.sin(elapsed * 0.004 + index * 0.3) * 0.2;
      mat.opacity = opacityPulse;
    });
    
    // Animate floating embers
    embers.forEach(({ mesh, mat, velocity, startPos, resetHeight, angle, dist }) => {
      const dt = 0.016; // ~60fps
      mesh.position.y += velocity.y * dt;
      mesh.position.x += velocity.x * dt;
      mesh.position.z += velocity.z * dt;
      
      // Wobble effect
      const wobble = Math.sin(elapsed * 0.005 + angle) * 0.02;
      mesh.position.x += wobble;
      mesh.position.z += wobble;
      
      // Reset when too high
      if (mesh.position.y > startPos.y + resetHeight) {
        mesh.position.copy(startPos);
      }
      
      // Flickering
      const flicker = 0.7 + Math.sin(elapsed * 0.01 + angle) * 0.3;
      mat.opacity = 0.8 * flicker;
    });
    
    // Animate flame spouts
    spouts.forEach(({ mesh, mat, coneMat, index }) => {
      const flicker = 0.7 + Math.sin(elapsed * 0.015 + index * 0.5) * 0.3;
      mat.opacity = 0.7 * flicker;
      coneMat.opacity = 0.6 * flicker;
      
      // Slight height variation
      const heightVar = Math.sin(elapsed * 0.008 + index) * 0.1;
      mesh.scale.y = 1 + heightVar;
    });
    
    // Animate central core
    const corePulse = 1 + Math.sin(elapsed * 0.006) * 0.15;
    core.scale.set(corePulse, corePulse, corePulse);
    glow.scale.set(corePulse * 1.1, corePulse * 1.1, corePulse * 1.1);
    
    coreMat.opacity = 0.5 + Math.sin(elapsed * 0.005) * 0.2;
    glowMat.opacity = 0.3 + Math.sin(elapsed * 0.004) * 0.1;
    
    // Animate heat waves
    heatWaves.forEach(({ mesh, mat, index }) => {
      const waveProgress = (elapsed * 0.001 + index * 0.5) % 1;
      const scale = 0.5 + waveProgress * auraRadius;
      mesh.scale.set(scale, scale, scale);
      mat.opacity = 0.3 * (1 - waveProgress);
    });
    
    // Fade out at the end
    if (progress > 0.8) {
      const fadeProgress = (progress - 0.8) / 0.2;
      const fadeMultiplier = 1 - fadeProgress;
      
      rings.forEach(({ mat }) => mat.opacity *= fadeMultiplier);
      embers.forEach(({ mat }) => mat.opacity *= fadeMultiplier);
      spouts.forEach(({ mat, coneMat }) => {
        mat.opacity *= fadeMultiplier;
        coneMat.opacity *= fadeMultiplier;
      });
      coreMat.opacity *= fadeMultiplier;
      glowMat.opacity *= fadeMultiplier;
    }
    
    requestAnimationFrame(animate);
  }
  
    animate();
  }
}

export default function burningAuraEffect(baseEffects, params) { return new BurningAuraEffect(baseEffects, params); }
