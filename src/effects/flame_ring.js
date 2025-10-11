import * as THREE from "../../vendor/three/build/three.module.js";
import { SKILL_FX } from "../../config/skills_fx.js";

/**
 * Flame Ring Effect
 * 
 * UNIQUE VISUAL: Rotating 3D torus ring of fire with flame spouts,
 * spinning particles, and pulsing energy core
 */
class FlameRingEffect {
  constructor(baseEffects, params) {
    const { center, radius } = params || {};
    const fx = SKILL_FX.flame_ring || {};
    const colors = fx.colors || {};
    
    if (!center) return;
    
    const ringRadius = radius || 8;
    createFlameRing(baseEffects, center, ringRadius, colors);
  }
}

export default function flameRingEffect(baseEffects, params) { return new FlameRingEffect(baseEffects, params); }

/**
 * Create the rotating flame ring
 */
function createFlameRing(baseEffects, center, ringRadius, colors) {
  const scene = baseEffects.scene;
  const group = new THREE.Group();
  group.position.copy(center);
  scene.add(group);
  
  // 1. Main fire ring (torus)
  const ringGeo = new THREE.TorusGeometry(ringRadius, 0.5, 16, 64);
  const ringMat = new THREE.MeshBasicMaterial({
    color: colors.primary || "#ff6347",
    transparent: true,
    opacity: 0.8,
    emissive: colors.primary || "#ff6347",
    emissiveIntensity: 0.6
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2; // Lay flat
  ring.position.y = 1;
  group.add(ring);
  
  // 2. Inner glow ring (smaller torus)
  const innerRingGeo = new THREE.TorusGeometry(ringRadius * 0.7, 0.3, 12, 48);
  const innerRingMat = new THREE.MeshBasicMaterial({
    color: colors.inner || "#ffd700",
    transparent: true,
    opacity: 0.9,
    emissive: colors.inner || "#ffd700",
    emissiveIntensity: 0.8
  });
  const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
  innerRing.rotation.x = Math.PI / 2;
  innerRing.position.y = 1;
  group.add(innerRing);
  
  // 3. Outer flame layer (larger torus)
  const outerRingGeo = new THREE.TorusGeometry(ringRadius * 1.2, 0.4, 12, 48);
  const outerRingMat = new THREE.MeshBasicMaterial({
    color: colors.secondary || "#ff4500",
    transparent: true,
    opacity: 0.6,
    emissive: colors.secondary || "#ff4500",
    emissiveIntensity: 0.5
  });
  const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
  outerRing.rotation.x = Math.PI / 2;
  outerRing.position.y = 1;
  group.add(outerRing);
  
  // 4. Flame spouts around the ring (12 spouts)
  const spoutCount = 12;
  const spouts = [];
  
  for (let i = 0; i < spoutCount; i++) {
    const angle = (i / spoutCount) * Math.PI * 2;
    const x = Math.cos(angle) * ringRadius;
    const z = Math.sin(angle) * ringRadius;
    
    // Flame cone
    const spoutGeo = new THREE.ConeGeometry(0.4, 2, 8);
    const spoutMat = new THREE.MeshBasicMaterial({
      color: colors.inner || "#ffd700",
      transparent: true,
      opacity: 0.9,
      emissive: colors.inner || "#ffd700",
      emissiveIntensity: 0.7
    });
    const spout = new THREE.Mesh(spoutGeo, spoutMat);
    spout.position.set(x, 2, z);
    group.add(spout);
    spouts.push(spout);
  }
  
  // 5. Central energy core (pulsing sphere)
  const coreGeo = new THREE.SphereGeometry(1, 16, 16);
  const coreMat = new THREE.MeshBasicMaterial({
    color: colors.inner || "#ffd700",
    transparent: true,
    opacity: 0.8,
    emissive: colors.inner || "#ffd700",
    emissiveIntensity: 0.9
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.position.y = 1;
  group.add(core);
  
  // 6. Ground ring indicator
  const groundRingGeo = new THREE.RingGeometry(ringRadius - 0.5, ringRadius + 0.5, 64);
  const groundRingMat = new THREE.MeshBasicMaterial({
    color: colors.primary || "#ff6347",
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide
  });
  const groundRing = new THREE.Mesh(groundRingGeo, groundRingMat);
  groundRing.rotation.x = -Math.PI / 2;
  groundRing.position.y = 0.02;
  group.add(groundRing);
  
  // 7. Rotating particle ring (orbiting particles)
  const particleCount = 24;
  for (let i = 0; i < particleCount; i++) {
    const angle = (i / particleCount) * Math.PI * 2;
    const particleRadius = ringRadius + (Math.random() - 0.5) * 2;
    
    setTimeout(() => {
      baseEffects.queue.push({
        obj: null,
        until: Date.now() + 2000,
        particle: true,
        pos: new THREE.Vector3(
          center.x + Math.cos(angle) * particleRadius,
          center.y + 1,
          center.z + Math.sin(angle) * particleRadius
        ),
        vel: new THREE.Vector3(
          -Math.sin(angle) * 3, // Tangential velocity for orbit
          (Math.random() - 0.5) * 0.5,
          Math.cos(angle) * 3
        ),
        gravity: 0,
        size: 0.15,
        color: i % 2 === 0 ? (colors.inner || "#ffd700") : (colors.primary || "#ff6347"),
        opacity: 0.9,
        fade: true
      });
    }, i * 30);
  }
  
  // 8. Expanding shockwave rings (3 rings)
  for (let i = 0; i < 3; i++) {
    setTimeout(() => {
      const shockGeo = new THREE.RingGeometry(0.5, 1.5, 32);
      const shockMat = new THREE.MeshBasicMaterial({
        color: i === 0 ? (colors.inner || "#ffd700") : (colors.primary || "#ff6347"),
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
      });
      const shock = new THREE.Mesh(shockGeo, shockMat);
      shock.rotation.x = -Math.PI / 2;
      shock.position.set(center.x, 0.05, center.z);
      scene.add(shock);
      
      baseEffects.queue.push({
        obj: shock,
        until: Date.now() + 1000,
        fade: true,
        mat: shockMat,
        shockwave: true,
        shockwaveSpeed: ringRadius * 1.5
      });
    }, i * 200);
  }
  
  // 9. Upward particle burst from center
  for (let i = 0; i < 40; i++) {
    const angle = (i / 40) * Math.PI * 2;
    const speed = 2 + Math.random() * 2;
    
    baseEffects.queue.push({
      obj: null,
      until: Date.now() + 1500,
      particle: true,
      pos: new THREE.Vector3(center.x, center.y + 1, center.z),
      vel: new THREE.Vector3(
        Math.cos(angle) * speed * 0.5,
        3 + Math.random() * 2,
        Math.sin(angle) * speed * 0.5
      ),
      gravity: -6,
        size: 0.12,
        color: colors.accent || "#ffa500",
        opacity: 0.9,
      fade: true
    });
  }
  
  // Animate and cleanup
  const startTime = Date.now();
  const duration = 2000;
  
  function animate() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    if (progress >= 1) {
      // Cleanup
      scene.remove(group);
      ringGeo.dispose();
      ringMat.dispose();
      innerRingGeo.dispose();
      innerRingMat.dispose();
      outerRingGeo.dispose();
      outerRingMat.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      groundRingGeo.dispose();
      groundRingMat.dispose();
      spouts.forEach(spout => {
        spout.geometry.dispose();
        spout.material.dispose();
      });
      return;
    }
    
    // Rotate rings in opposite directions
    ring.rotation.z += 0.02;
    innerRing.rotation.z -= 0.03;
    outerRing.rotation.z += 0.015;
    
    // Pulse core
    const corePulse = Math.sin(elapsed * 0.005) * 0.3;
    core.scale.setScalar(1 + corePulse);
    core.material.opacity = 0.8 + corePulse * 0.2;
    
    // Animate flame spouts (flicker)
    spouts.forEach((spout, index) => {
      const flicker = Math.sin(elapsed * 0.008 + index * 0.5) * 0.3;
      spout.scale.y = 1 + flicker;
      spout.material.opacity = 0.9 + flicker * 0.1;
    });
    
    // Pulse ground ring
    const groundPulse = Math.sin(elapsed * 0.004) * 0.2;
    groundRing.material.opacity = 0.6 + groundPulse;
    
    // Fade out at end
    if (progress > 0.8) {
      const fadeProgress = (progress - 0.8) / 0.2;
      ring.material.opacity = 0.8 * (1 - fadeProgress);
      innerRing.material.opacity = 0.9 * (1 - fadeProgress);
      outerRing.material.opacity = 0.6 * (1 - fadeProgress);
      core.material.opacity *= (1 - fadeProgress);
      groundRing.material.opacity *= (1 - fadeProgress);
      spouts.forEach(spout => {
        spout.material.opacity = 0.9 * (1 - fadeProgress);
      });
    }
    
    requestAnimationFrame(animate);
  }
  
  animate();
}
