import * as THREE from "../../vendor/three/build/three.module.js";
import { SKILL_FX } from "../../config/skills_fx.js";

/**
 * Flame Nova Effect
 * 
 * UNIQUE VISUAL: Explosive radial nova with expanding fire wave,
 * flame rays shooting outward, and a bright core explosion
 */
class FlameNovaEffect {
  constructor(baseEffects, params) {
    const { center, radius } = params || {};
    const fx = SKILL_FX.flame_nova || {};
    const colors = fx.colors || {};
    
    if (!center) return;
    
    const novaRadius = radius || 14;
    createFlameNova(baseEffects, center, novaRadius, colors);
  }
}

export default function flameNovaEffect(baseEffects, params) { return new FlameNovaEffect(baseEffects, params); }

/**
 * Create the flame nova explosion
 */
function createFlameNova(baseEffects, center, novaRadius, colors) {
  const scene = baseEffects.scene;
  const group = new THREE.Group();
  group.position.copy(center);
  scene.add(group);
  
  // 1. Central explosion core (bright sphere)
  const coreGeo = new THREE.SphereGeometry(1.5, 16, 16);
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0xffff00, // Bright yellow
    transparent: true,
    opacity: 1.0,
    emissive: 0xffff00,
    emissiveIntensity: 1.0
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.position.y = 0.5;
  group.add(core);
  
  // 2. Outer glow layer
  const glowGeo = new THREE.SphereGeometry(2.5, 16, 16);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0xff6347,
    transparent: true,
    opacity: 0.6
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.position.y = 0.5;
  group.add(glow);
  
  // 3. Expanding fire wave (torus that expands outward)
  const waveGeo = new THREE.TorusGeometry(2, 0.5, 8, 32);
  const waveMat = new THREE.MeshBasicMaterial({
    color: 0xff4500,
    transparent: true,
    opacity: 0.8,
    emissive: 0xff4500,
    emissiveIntensity: 0.6
  });
  const wave = new THREE.Mesh(waveGeo, waveMat);
  wave.rotation.x = Math.PI / 2;
  wave.position.y = 0.3;
  group.add(wave);
  
  // 4. Flame rays shooting outward (16 rays)
  const rayCount = 16;
  const rays = [];
  
  for (let i = 0; i < rayCount; i++) {
    const angle = (i / rayCount) * Math.PI * 2;
    const rayLength = novaRadius * 0.8;
    
    // Create ray as a stretched cone
    const rayGeo = new THREE.ConeGeometry(0.3, rayLength, 8);
    const rayMat = new THREE.MeshBasicMaterial({
      color: 0xff6347,
      transparent: true,
      opacity: 0.8,
      emissive: 0xff6347,
      emissiveIntensity: 0.5
    });
    const ray = new THREE.Mesh(rayGeo, rayMat);
    
    // Position and orient ray
    ray.position.set(
      Math.cos(angle) * rayLength * 0.5,
      0.5,
      Math.sin(angle) * rayLength * 0.5
    );
    ray.rotation.z = -angle - Math.PI / 2;
    ray.rotation.x = Math.PI / 2;
    
    group.add(ray);
    rays.push(ray);
    
    // Flame at end of ray
    const flameGeo = new THREE.ConeGeometry(0.5, 1.5, 8);
    const flameMat = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0.9,
      emissive: 0xffd700,
      emissiveIntensity: 0.7
    });
    const flame = new THREE.Mesh(flameGeo, flameMat);
    flame.position.set(
      Math.cos(angle) * rayLength,
      1.2,
      Math.sin(angle) * rayLength
    );
    group.add(flame);
  }
  
  // 5. Ground shockwave rings (3 expanding rings)
  for (let i = 0; i < 3; i++) {
    setTimeout(() => {
      const ringGeo = new THREE.RingGeometry(0.5, 1.5, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: i === 0 ? 0xffff00 : 0xff6347,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(center.x, 0.05, center.z);
      scene.add(ring);
      
      baseEffects.queue.push({
        obj: ring,
        until: Date.now() + 1000,
        fade: true,
        mat: ringMat,
        shockwave: true,
        shockwaveSpeed: novaRadius * 1.2
      });
    }, i * 150);
  }
  
  // 6. Massive particle burst (100 particles)
  for (let i = 0; i < 100; i++) {
    const angle = (i / 100) * Math.PI * 2;
    const speed = 6 + Math.random() * 4;
    const spreadAngle = angle + (Math.random() - 0.5) * 0.5;
    
    baseEffects.queue.push({
      obj: null,
      until: Date.now() + 1500,
      particle: true,
      pos: new THREE.Vector3(center.x, center.y + 0.5, center.z),
      vel: new THREE.Vector3(
        Math.cos(spreadAngle) * speed,
        1 + Math.random() * 2,
        Math.sin(spreadAngle) * speed
      ),
      gravity: -5,
      size: 0.15 + Math.random() * 0.1,
      color: i % 3 === 0 ? 0xffd700 : (i % 3 === 1 ? 0xff6347 : 0xff4500),
      opacity: 0.9,
      fade: true
    });
  }
  
  // 7. Secondary upward particle burst
  setTimeout(() => {
    for (let i = 0; i < 50; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 3;
      
      baseEffects.queue.push({
        obj: null,
        until: Date.now() + 1200,
        particle: true,
        pos: new THREE.Vector3(center.x, center.y + 0.5, center.z),
        vel: new THREE.Vector3(
          Math.cos(angle) * speed * 0.5,
          speed,
          Math.sin(angle) * speed * 0.5
        ),
        gravity: -8,
        size: 0.12,
        color: 0xffd700,
        opacity: 0.8,
        fade: true
      });
    }
  }, 200);
  
  // Animate and cleanup
  const startTime = Date.now();
  const duration = 1200;
  
  function animate() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    if (progress >= 1) {
      // Cleanup
      scene.remove(group);
      coreGeo.dispose();
      coreMat.dispose();
      glowGeo.dispose();
      glowMat.dispose();
      waveGeo.dispose();
      waveMat.dispose();
      group.children.forEach(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
      return;
    }
    
    // Core explosion (expand then fade)
    if (progress < 0.3) {
      const expandProgress = progress / 0.3;
      core.scale.setScalar(1 + expandProgress * 3);
      glow.scale.setScalar(1 + expandProgress * 4);
    } else {
      const fadeProgress = (progress - 0.3) / 0.7;
      core.material.opacity = 1 - fadeProgress;
      glow.material.opacity = 0.6 * (1 - fadeProgress);
    }
    
    // Wave expansion
    const waveScale = 1 + progress * (novaRadius / 2);
    wave.scale.set(waveScale, waveScale, 1);
    wave.material.opacity = 0.8 * (1 - progress);
    
    // Rays extend outward
    rays.forEach((ray, index) => {
      const rayProgress = Math.min(progress * 1.5, 1);
      ray.scale.y = rayProgress;
      ray.material.opacity = 0.8 * (1 - progress);
    });
    
    requestAnimationFrame(animate);
  }
  
  animate();
}