import * as THREE from "../../vendor/three/build/three.module.js";
import { SKILL_FX } from "../../config/skills_fx.js";

/**
 * Scorching Field Effect
 * 
 * UNIQUE VISUAL: Persistent burning ground field with:
 * - Scorched earth base with glowing cracks
 * - Flame geysers erupting from fissures
 * - Continuous heat waves
 * - Floating embers across the field
 * - Pulsing ground fire
 */
class ScorchingFieldEffect {
  constructor(baseEffects, params) {
    const { center, radius, activation, duration = 8000 } = params || {};
    const fx = SKILL_FX.scorching_field || {};
    const colors = fx.colors || {};
    
    if (!center) return;
    
    const fieldRadius = (radius || 13) * 1.0;
    const scene = baseEffects.scene;
  
  // ============================================================================
  // STAGE 1: SCORCHED GROUND BASE
  // ============================================================================
  
  // Dark scorched earth
  const scorchedGeo = new THREE.CircleGeometry(fieldRadius, 64);
  const scorchedMat = new THREE.MeshBasicMaterial({
    color: 0x2a0a00,
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide
  });
  const scorched = new THREE.Mesh(scorchedGeo, scorchedMat);
  scorched.rotation.x = -Math.PI / 2;
  scorched.position.set(center.x, 0.01, center.z);
  scene.add(scorched);
  
  // Glowing ground fire layer
  const fireGeo = new THREE.CircleGeometry(fieldRadius * 0.9, 64);
  const fireMat = new THREE.MeshBasicMaterial({
    color: 0x8b0000,
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide
  });
  const fire = new THREE.Mesh(fireGeo, fireMat);
  fire.rotation.x = -Math.PI / 2;
  fire.position.set(center.x, 0.02, center.z);
  scene.add(fire);
  
  // ============================================================================
  // STAGE 2: RADIATING GROUND CRACKS
  // ============================================================================
  
  const cracks = [];
  const crackCount = 16;
  
  for (let i = 0; i < crackCount; i++) {
    const angle = (i / crackCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
    const crackLength = fieldRadius * (0.6 + Math.random() * 0.4);
    
    // Create crack as glowing line
    const crackGeo = new THREE.BoxGeometry(0.12, 0.08, crackLength);
    const crackMat = new THREE.MeshBasicMaterial({
      color: 0xff8c00,
      transparent: true,
      opacity: 0.8
    });
    const crack = new THREE.Mesh(crackGeo, crackMat);
    
    crack.position.set(
      center.x + Math.cos(angle) * crackLength * 0.5,
      0.04,
      center.z + Math.sin(angle) * crackLength * 0.5
    );
    crack.rotation.y = angle;
    
    scene.add(crack);
    cracks.push({ mesh: crack, mat: crackMat, angle });
    
    // Glowing segments along crack
    const segments = 5;
    for (let j = 1; j < segments; j++) {
      const t = j / segments;
      const segX = center.x + Math.cos(angle) * crackLength * t;
      const segZ = center.z + Math.sin(angle) * crackLength * t;
      
      const segGeo = new THREE.SphereGeometry(0.2, 8, 8);
      const segMat = new THREE.MeshBasicMaterial({
        color: 0xff4500,
        transparent: true,
        opacity: 0.7
      });
      const segment = new THREE.Mesh(segGeo, segMat);
      segment.position.set(segX, 0.1, segZ);
      
      scene.add(segment);
      cracks.push({ mesh: segment, mat: segMat, isSegment: true, delay: j * 50 });
    }
  }
  
  // ============================================================================
  // STAGE 3: FLAME GEYSERS (erupting from cracks)
  // ============================================================================
  
  const geysers = [];
  const geyserCount = 10;
  
  for (let i = 0; i < geyserCount; i++) {
    const angle = (i / geyserCount) * Math.PI * 2;
    const dist = fieldRadius * (0.3 + Math.random() * 0.5);
    const geyserHeight = 2.5 + Math.random() * 1.5;
    
    const geyserGeo = new THREE.CylinderGeometry(0.25, 0.35, geyserHeight, 12);
    const geyserMat = new THREE.MeshBasicMaterial({
      color: 0xff6347,
      transparent: true,
      opacity: 0
    });
    const geyser = new THREE.Mesh(geyserGeo, geyserMat);
    
    geyser.position.set(
      center.x + Math.cos(angle) * dist,
      geyserHeight * 0.5,
      center.z + Math.sin(angle) * dist
    );
    
    // Flame cone at top
    const coneGeo = new THREE.ConeGeometry(0.4, 1.0, 12);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0xff4500,
      transparent: true,
      opacity: 0
    });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.y = geyserHeight * 0.5 + 0.5;
    geyser.add(cone);
    
    scene.add(geyser);
    geysers.push({ 
      mesh: geyser, 
      mat: geyserMat, 
      coneMat,
      delay: i * 150,
      baseHeight: geyserHeight,
      index: i
    });
  }
  
  // ============================================================================
  // STAGE 4: FLOATING EMBERS
  // ============================================================================
  
  const embers = [];
  const emberCount = 50;
  
  for (let i = 0; i < emberCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * fieldRadius * 0.95;
    const emberSize = 0.06 + Math.random() * 0.06;
    
    const emberGeo = new THREE.SphereGeometry(emberSize, 8, 8);
    const emberMat = new THREE.MeshBasicMaterial({
      color: 0xff4500,
      transparent: true,
      opacity: 0.8
    });
    const ember = new THREE.Mesh(emberGeo, emberMat);
    
    const startX = center.x + Math.cos(angle) * dist;
    const startZ = center.z + Math.sin(angle) * dist;
    
    ember.position.set(startX, center.y + Math.random() * 0.3, startZ);
    
    scene.add(ember);
    
    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.3,
      1.0 + Math.random() * 1.0,
      (Math.random() - 0.5) * 0.3
    );
    
    embers.push({ 
      mesh: ember, 
      mat: emberMat, 
      velocity,
      startPos: ember.position.clone(),
      resetHeight: 3,
      angle,
      dist
    });
  }
  
  // ============================================================================
  // STAGE 5: HEAT WAVES
  // ============================================================================
  
  const heatWaves = [];
  const waveCount = 3;
  
  for (let i = 0; i < waveCount; i++) {
    const waveGeo = new THREE.RingGeometry(0.5, 1.5, 64);
    const waveMat = new THREE.MeshBasicMaterial({
      color: 0xff6347,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    const wave = new THREE.Mesh(waveGeo, waveMat);
    wave.rotation.x = -Math.PI / 2;
    wave.position.set(center.x, 0.15, center.z);
    
    scene.add(wave);
    heatWaves.push({ mesh: wave, mat: waveMat, index: i });
  }
  
  // ============================================================================
  // ACTIVATION BURST (if initial activation)
  // ============================================================================
  
  if (activation) {
    baseEffects.spawnRing(center, fieldRadius, colors.primary || "#ff6347", 1.0, 1.0, 0.6);
    baseEffects.spawnImpact(center, 3, colors.accent || "#ff4500", 2.0);
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
      scene.remove(scorched, fire);
      scorchedGeo.dispose();
      scorchedMat.dispose();
      fireGeo.dispose();
      fireMat.dispose();
      
      cracks.forEach(({ mesh, mat }) => {
        scene.remove(mesh);
        mesh.geometry.dispose();
        mat.dispose();
      });
      
      geysers.forEach(({ mesh, mat, coneMat }) => {
        scene.remove(mesh);
        mesh.geometry.dispose();
        mat.dispose();
        mesh.children[0]?.geometry.dispose();
        coneMat.dispose();
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
    
    // Animate pulsing ground fire
    const firePulse = 0.6 + Math.sin(elapsed * 0.004) * 0.2;
    fireMat.opacity = firePulse;
    
    // Animate glowing cracks
    cracks.forEach(({ mesh, mat, angle, isSegment, delay }) => {
      if (isSegment) {
        const segProgress = Math.max(0, Math.min((elapsed - (delay || 0)) / 500, 1));
        const glow = 0.7 + Math.sin(elapsed * 0.008 + (delay || 0)) * 0.3;
        mat.opacity = 0.7 * glow * segProgress;
        
        const pulse = 1 + Math.sin(elapsed * 0.01 + (delay || 0)) * 0.15;
        mesh.scale.set(pulse, pulse, pulse);
      } else {
        const glow = 0.8 + Math.sin(elapsed * 0.006 + (angle || 0)) * 0.2;
        mat.opacity = glow;
      }
    });
    
    // Animate geysers (erupting)
    geysers.forEach(({ mesh, mat, coneMat, delay, baseHeight, index }) => {
      const geyserProgress = Math.max(0, Math.min((elapsed - delay) / 600, 1));
      
      if (geyserProgress > 0) {
        mat.opacity = 0.8 * geyserProgress;
        coneMat.opacity = 0.7 * geyserProgress;
        
        // Flickering
        const flicker = 0.8 + Math.sin(elapsed * 0.015 + index) * 0.2;
        mat.opacity *= flicker;
        coneMat.opacity *= flicker;
        
        // Height variation
        const heightVar = Math.sin(elapsed * 0.01 + index) * 0.15;
        mesh.scale.y = geyserProgress * (1 + heightVar);
      }
    });
    
    // Animate floating embers
    embers.forEach(({ mesh, mat, velocity, startPos, resetHeight, angle, dist }) => {
      const dt = 0.016;
      mesh.position.y += velocity.y * dt;
      mesh.position.x += velocity.x * dt;
      mesh.position.z += velocity.z * dt;
      
      const wobble = Math.sin(elapsed * 0.006 + angle) * 0.02;
      mesh.position.x += wobble;
      mesh.position.z += wobble;
      
      if (mesh.position.y > startPos.y + resetHeight) {
        mesh.position.copy(startPos);
      }
      
      const flicker = 0.7 + Math.sin(elapsed * 0.012 + angle) * 0.3;
      mat.opacity = 0.8 * flicker;
    });
    
    // Animate heat waves
    heatWaves.forEach(({ mesh, mat, index }) => {
      const waveProgress = (elapsed * 0.0012 + index * 0.33) % 1;
      const scale = 0.5 + waveProgress * fieldRadius;
      mesh.scale.set(scale, scale, scale);
      mat.opacity = 0.5 * (1 - waveProgress);
    });
    
    // Fade out at the end
    if (progress > 0.75) {
      const fadeProgress = (progress - 0.75) / 0.25;
      const fadeMultiplier = 1 - fadeProgress;
      
      scorchedMat.opacity *= fadeMultiplier;
      fireMat.opacity *= fadeMultiplier;
      cracks.forEach(({ mat }) => mat.opacity *= fadeMultiplier);
      geysers.forEach(({ mat, coneMat }) => {
        mat.opacity *= fadeMultiplier;
        coneMat.opacity *= fadeMultiplier;
      });
      embers.forEach(({ mat }) => mat.opacity *= fadeMultiplier);
    }
    
    requestAnimationFrame(animate);
  }
  
    animate();
  }
}

export default function scorchingFieldEffect(baseEffects, params) { return new ScorchingFieldEffect(baseEffects, params); }