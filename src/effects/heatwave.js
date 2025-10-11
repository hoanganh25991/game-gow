import * as THREE from "../../vendor/three/build/three.module.js";
import { SKILL_FX } from "../../config/skills_fx.js";

/**
 * Heatwave Effect
 * 
 * UNIQUE VISUAL: Expanding wave of shimmering heat with visible distortion,
 * rippling air particles, and scorched ground trail
 */
class HeatwaveEffect {
  constructor(baseEffects, params) {
    const { from, to } = params || {};
    const fx = SKILL_FX.heatwave || {};
    const colors = fx.colors || {};
    
    if (!from || !to) return;
    
    createHeatwave(baseEffects, from, to, colors);
  }
}

export default function heatwaveEffect(baseEffects, params) { return new HeatwaveEffect(baseEffects, params); }

/**
 * Create the heatwave traveling from source to target
 */
function createHeatwave(baseEffects, from, to, colors) {
  const scene = baseEffects.scene;
  const dir = new THREE.Vector3().subVectors(to, from);
  const distance = dir.length();
  const travelTime = 1200; // 1.2 seconds to travel
  
  // 1. Main heatwave (expanding semi-transparent cone)
  const waveGroup = new THREE.Group();
  waveGroup.position.copy(from);
  scene.add(waveGroup);
  
  // Orient toward target
  const angle = Math.atan2(dir.x, dir.z);
  waveGroup.rotation.y = -angle;
  
  // Create wave cone (wide, flat cone)
  const waveGeo = new THREE.ConeGeometry(4, distance, 16, 1, true);
  const waveMat = new THREE.MeshBasicMaterial({
    color: 0xff8c00, // Orange
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide
  });
  const wave = new THREE.Mesh(waveGeo, waveMat);
  wave.rotation.x = Math.PI / 2; // Point forward
  wave.position.z = -distance / 2;
  waveGroup.add(wave);
  
  // 2. Heat shimmer particles (floating upward along path)
  const shimmerCount = 80;
  const shimmerParticles = [];
  
  for (let i = 0; i < shimmerCount; i++) {
    const t = i / shimmerCount;
    const pos = new THREE.Vector3().lerpVectors(from, to, t);
    
    // Random offset
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 3;
    pos.x += Math.cos(angle) * radius;
    pos.z += Math.sin(angle) * radius;
    
    const shimmerGeo = new THREE.SphereGeometry(0.15, 8, 8);
    const shimmerMat = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.6
    });
    const shimmer = new THREE.Mesh(shimmerGeo, shimmerMat);
    shimmer.position.copy(pos);
    scene.add(shimmer);
    
    shimmerParticles.push({
      mesh: shimmer,
      startY: pos.y,
      riseSpeed: 1 + Math.random() * 1.5,
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleSpeed: 2 + Math.random() * 2
    });
  }
  
  // 3. Expanding ripple rings along path (5 rings)
  const rippleCount = 5;
  for (let i = 0; i < rippleCount; i++) {
    setTimeout(() => {
      const t = i / rippleCount;
      const ripplePos = new THREE.Vector3().lerpVectors(from, to, t);
      
      const ringGeo = new THREE.RingGeometry(0.5, 1.5, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0xff8c00 : 0xffa500,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(ripplePos.x, 0.05, ripplePos.z);
      scene.add(ring);
      
      baseEffects.queue.push({
        obj: ring,
        until: Date.now() + 800,
        fade: true,
        mat: ringMat,
        shockwave: true,
        shockwaveSpeed: 6
      });
    }, (i / rippleCount) * travelTime);
  }
  
  // 4. Ground scorch trail (15 marks)
  const scorchCount = 15;
  for (let i = 0; i < scorchCount; i++) {
    setTimeout(() => {
      const t = i / scorchCount;
      const scorchPos = new THREE.Vector3().lerpVectors(from, to, t);
      
      const scorchGeo = new THREE.CircleGeometry(2, 16);
      const scorchMat = new THREE.MeshBasicMaterial({
        color: 0x8b4513, // Brown scorch
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide
      });
      const scorch = new THREE.Mesh(scorchGeo, scorchMat);
      scorch.rotation.x = -Math.PI / 2;
      scorch.position.set(scorchPos.x, 0.01, scorchPos.z);
      scene.add(scorch);
      
      // Scorch lingers
      setTimeout(() => {
        scene.remove(scorch);
        scorchGeo.dispose();
        scorchMat.dispose();
      }, 2000);
    }, (i / scorchCount) * travelTime);
  }
  
  // 5. Heat distortion particles (rising along path)
  for (let i = 0; i < 60; i++) {
    setTimeout(() => {
      const t = Math.random();
      const pos = new THREE.Vector3().lerpVectors(from, to, t);
      
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 3;
      pos.x += Math.cos(angle) * radius;
      pos.z += Math.sin(angle) * radius;
      
      baseEffects.queue.push({
        obj: null,
        until: Date.now() + 1500,
        particle: true,
        pos: pos.clone(),
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 0.5,
          2 + Math.random() * 1.5,
          (Math.random() - 0.5) * 0.5
        ),
        gravity: -1, // Slow rise
        size: 0.12,
        color: 0xffaa00,
        opacity: 0.5,
        fade: true
      });
    }, Math.random() * travelTime);
  }
  
  // 6. Impact at target
  setTimeout(() => {
    // Impact flash
    const impactGeo = new THREE.SphereGeometry(2, 16, 16);
    const impactMat = new THREE.MeshBasicMaterial({
      color: 0xff6347,
      transparent: true,
      opacity: 1.0
    });
    const impact = new THREE.Mesh(impactGeo, impactMat);
    impact.position.copy(to);
    scene.add(impact);
    
    // Impact shockwave
    const shockGeo = new THREE.RingGeometry(0.5, 1.5, 32);
    const shockMat = new THREE.MeshBasicMaterial({
      color: 0xff8c00,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    const shock = new THREE.Mesh(shockGeo, shockMat);
    shock.rotation.x = -Math.PI / 2;
    shock.position.set(to.x, 0.1, to.z);
    scene.add(shock);
    
    baseEffects.queue.push({
      obj: shock,
      until: Date.now() + 800,
      fade: true,
      mat: shockMat,
      shockwave: true,
      shockwaveSpeed: 8
    });
    
    // Impact particles
    for (let i = 0; i < 30; i++) {
      const angle = (i / 30) * Math.PI * 2;
      baseEffects.queue.push({
        obj: null,
        until: Date.now() + 1000,
        particle: true,
        pos: to.clone(),
        vel: new THREE.Vector3(
          Math.cos(angle) * 4,
          2 + Math.random() * 2,
          Math.sin(angle) * 4
        ),
        gravity: -8,
        size: 0.15,
        color: 0xff6347,
        opacity: 0.9,
        fade: true
      });
    }
    
    // Cleanup impact
    const impactStart = Date.now();
    function animateImpact() {
      const elapsed = Date.now() - impactStart;
      const progress = elapsed / 600;
      
      if (progress >= 1) {
        scene.remove(impact);
        impactGeo.dispose();
        impactMat.dispose();
        return;
      }
      
      impact.scale.setScalar(1 + progress * 2);
      impact.material.opacity = 1 - progress;
      
      requestAnimationFrame(animateImpact);
    }
    animateImpact();
  }, travelTime);
  
  // Animate wave and shimmer particles
  const startTime = Date.now();
  
  function animate() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / travelTime, 1);
    
    if (progress >= 1) {
      // Cleanup wave
      scene.remove(waveGroup);
      waveGeo.dispose();
      waveMat.dispose();
      
      // Cleanup shimmer particles
      shimmerParticles.forEach(p => {
        scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
      });
      return;
    }
    
    // Wave expands as it travels
    wave.scale.set(1 + progress * 0.5, 1, 1 + progress * 0.5);
    wave.material.opacity = 0.3 * (1 - progress * 0.5);
    
    // Shimmer particles rise and wobble
    shimmerParticles.forEach(p => {
      p.mesh.position.y = p.startY + elapsed * 0.001 * p.riseSpeed;
      
      // Wobble side to side
      const wobble = Math.sin(elapsed * 0.001 * p.wobbleSpeed + p.wobblePhase) * 0.3;
      p.mesh.position.x += wobble * 0.01;
      
      // Fade out as they rise
      const riseProgress = Math.min((p.mesh.position.y - p.startY) / 3, 1);
      p.mesh.material.opacity = 0.6 * (1 - riseProgress);
    });
    
    requestAnimationFrame(animate);
  }
  
  animate();
}