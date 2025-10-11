import * as THREE from "../../vendor/three/build/three.module.js";
import { SKILL_FX } from "../../config/skills_fx.js";

/**
 * Fire Dome Effect
 * 
 * UNIQUE VISUAL: Actual 3D dome structure with fire pillars,
 * semi-transparent shield dome, and rotating energy rings
 */
class FireDomeEffect {
  constructor(baseEffects, params) {
    const { center, radius, strike, strikePos } = params || {};
    const fx = SKILL_FX.fire_dome || {};
    const colors = fx.colors || {};
    
    if (strike && strikePos) {
      // ===== DOME IMPACT (when something hits the dome) =====
      createDomeImpact(baseEffects, strikePos, colors);
    
    } else if (center) {
      // ===== CREATE FIRE DOME =====
      const domeRadius = radius || 12;
      createFireDome(baseEffects, center, domeRadius, colors);
    }
  }
}

export default function fireDomeEffect(baseEffects, params) { return new FireDomeEffect(baseEffects, params); }

/**
 * Create impact effect when dome is hit
 */
function createDomeImpact(baseEffects, pos, colors) {
  const scene = baseEffects.scene;
  
  // Impact flash
  const flashGeo = new THREE.SphereGeometry(1, 16, 16);
  const flashMat = new THREE.MeshBasicMaterial({
    color: colors.accent || "#ffd700",
    transparent: true,
    opacity: 1.0
  });
  const flash = new THREE.Mesh(flashGeo, flashMat);
  flash.position.copy(pos);
  scene.add(flash);
  
  // Expanding ripple
  const rippleGeo = new THREE.RingGeometry(0.5, 1, 32);
  const rippleMat = new THREE.MeshBasicMaterial({
    color: colors.primary || "#ff6347",
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide
  });
  const ripple = new THREE.Mesh(rippleGeo, rippleMat);
  ripple.position.copy(pos);
  ripple.lookAt(new THREE.Vector3(0, 0, 0)); // Face outward
  scene.add(ripple);
  
  // Sparks
  for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * Math.PI * 2;
    baseEffects.queue.push({
      obj: null,
      until: Date.now() + 800,
      particle: true,
      pos: pos.clone(),
      vel: new THREE.Vector3(Math.cos(angle) * 4, Math.random() * 2, Math.sin(angle) * 4),
      gravity: -8,
      size: 0.1,
      color: colors.accent || "#ffd700",
      opacity: 0.9,
      fade: true
    });
  }
  
  // Animate
  const startTime = Date.now();
  const duration = 600;
  
  function animate() {
    const elapsed = Date.now() - startTime;
    const progress = elapsed / duration;
    
    if (progress >= 1) {
      scene.remove(flash);
      scene.remove(ripple);
      flashGeo.dispose();
      flashMat.dispose();
      rippleGeo.dispose();
      rippleMat.dispose();
      return;
    }
    
    flash.material.opacity = 1 - progress;
    flash.scale.setScalar(1 + progress * 2);
    
    ripple.scale.setScalar(1 + progress * 3);
    ripple.material.opacity = 0.8 * (1 - progress);
    
    requestAnimationFrame(animate);
  }
  
  animate();
}

/**
 * Create the full fire dome structure
 */
function createFireDome(baseEffects, center, domeRadius, colors) {
  const scene = baseEffects.scene;
  const group = new THREE.Group();
  group.position.copy(center);
  scene.add(group);
  
  // 1. Base ground ring
  const baseRingGeo = new THREE.RingGeometry(domeRadius - 0.5, domeRadius + 0.5, 64);
  const baseRingMat = new THREE.MeshBasicMaterial({
    color: colors.primary || "#ff6347",
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide
  });
  const baseRing = new THREE.Mesh(baseRingGeo, baseRingMat);
  baseRing.rotation.x = -Math.PI / 2;
  baseRing.position.y = 0.02;
  group.add(baseRing);
  
  // 2. Fire pillars around perimeter (16 pillars)
  const pillarCount = 16;
  const pillarHeight = 8;
  const pillars = [];
  
  for (let i = 0; i < pillarCount; i++) {
    const angle = (i / pillarCount) * Math.PI * 2;
    const x = Math.cos(angle) * domeRadius;
    const z = Math.sin(angle) * domeRadius;
    
    // Pillar (cylinder)
    const pillarGeo = new THREE.CylinderGeometry(0.3, 0.4, pillarHeight, 12);
    const pillarMat = new THREE.MeshBasicMaterial({
      color: colors.secondary || "#ff4500",
      transparent: true,
      opacity: 0.8,
      emissive: colors.secondary || "#ff4500",
      emissiveIntensity: 0.5
    });
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.position.set(x, pillarHeight / 2, z);
    group.add(pillar);
    pillars.push(pillar);
    
    // Flame at top of pillar
    const flameGeo = new THREE.ConeGeometry(0.4, 1.2, 8);
    const flameMat = new THREE.MeshBasicMaterial({
      color: colors.accent || "#ffd700",
      transparent: true,
      opacity: 0.9,
      emissive: colors.accent || "#ffd700",
      emissiveIntensity: 0.7
    });
    const flame = new THREE.Mesh(flameGeo, flameMat);
    flame.position.set(x, pillarHeight + 0.6, z);
    group.add(flame);
    
    // Particle stream from pillar
    setInterval(() => {
      for (let j = 0; j < 2; j++) {
        baseEffects.queue.push({
          obj: null,
          until: Date.now() + 1500,
          particle: true,
          pos: new THREE.Vector3(center.x + x, center.y + pillarHeight, center.z + z),
          vel: new THREE.Vector3(
            (Math.random() - 0.5) * 0.5,
            2 + Math.random() * 1,
            (Math.random() - 0.5) * 0.5
          ),
          gravity: -2,
          size: 0.12,
          color: colors.primary || "#ff6347",
          opacity: 0.8,
          fade: true
        });
      }
    }, 200);
  }
  
  // 3. Semi-transparent dome shell (hemisphere)
  const domeGeo = new THREE.SphereGeometry(domeRadius, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const domeMat = new THREE.MeshBasicMaterial({
    color: colors.primary || "#ff6347",
    transparent: true,
    opacity: 0.15,
    side: THREE.DoubleSide,
    wireframe: false
  });
  const dome = new THREE.Mesh(domeGeo, domeMat);
  dome.position.y = 0;
  group.add(dome);
  
  // 4. Wireframe dome overlay for structure
  const wireframeGeo = new THREE.SphereGeometry(domeRadius + 0.1, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  const wireframeMat = new THREE.MeshBasicMaterial({
    color: colors.shield || "#ff8c00",
    transparent: true,
    opacity: 0.4,
    wireframe: true
  });
  const wireframe = new THREE.Mesh(wireframeGeo, wireframeMat);
  wireframe.position.y = 0;
  group.add(wireframe);
  
  // 5. Rotating energy rings inside dome
  const ringCount = 3;
  const energyRings = [];
  
  for (let i = 0; i < ringCount; i++) {
    const ringRadius = domeRadius * (0.4 + i * 0.2);
    const ringGeo = new THREE.TorusGeometry(ringRadius, 0.08, 8, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: colors.accent || "#ffd700",
      transparent: true,
      opacity: 0.6,
      emissive: colors.accent || "#ffd700",
      emissiveIntensity: 0.5
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 2 + i * 1.5;
    ring.rotation.x = Math.PI / 2;
    group.add(ring);
    energyRings.push({ mesh: ring, speed: 0.5 + i * 0.3 });
  }
  
  // 6. Central energy pillar
  const centralGeo = new THREE.CylinderGeometry(0.5, 0.6, pillarHeight * 1.2, 16);
  const centralMat = new THREE.MeshBasicMaterial({
    color: colors.accent || "#ffd700",
    transparent: true,
    opacity: 0.5,
    emissive: colors.accent || "#ffd700",
    emissiveIntensity: 0.6
  });
  const centralPillar = new THREE.Mesh(centralGeo, centralMat);
  centralPillar.position.y = pillarHeight * 0.6;
  group.add(centralPillar);
  
  // 7. Pulsing ground circles
  for (let i = 0; i < 3; i++) {
    setTimeout(() => {
      const pulseGeo = new THREE.RingGeometry(0.5, 1, 32);
      const pulseMat = new THREE.MeshBasicMaterial({
        color: colors.shield || "#ff8c00",
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
      });
      const pulse = new THREE.Mesh(pulseGeo, pulseMat);
      pulse.rotation.x = -Math.PI / 2;
      pulse.position.set(center.x, 0.05, center.z);
      scene.add(pulse);
      
      baseEffects.queue.push({
        obj: pulse,
        until: Date.now() + 1200,
        fade: true,
        mat: pulseMat,
        shockwave: true,
        shockwaveSpeed: domeRadius * 0.8
      });
    }, i * 400);
  }
  
  // Animate and cleanup
  const startTime = Date.now();
  const duration = 6000; // Dome lasts 6 seconds
  
  function animate() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    if (progress >= 1) {
      // Cleanup
      scene.remove(group);
      baseRingGeo.dispose();
      baseRingMat.dispose();
      domeGeo.dispose();
      domeMat.dispose();
      wireframeGeo.dispose();
      wireframeMat.dispose();
      centralGeo.dispose();
      centralMat.dispose();
      group.children.forEach(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
      return;
    }
    
    // Rotate energy rings
    energyRings.forEach(ring => {
      ring.mesh.rotation.z += ring.speed * 0.02;
    });
    
    // Pulse dome opacity
    const pulse = Math.sin(elapsed * 0.003) * 0.05;
    dome.material.opacity = 0.15 + pulse;
    
    // Pulse central pillar
    const centralPulse = Math.sin(elapsed * 0.005) * 0.1;
    centralPillar.scale.y = 1 + centralPulse;
    centralPillar.material.opacity = 0.5 + centralPulse;
    
    // Fade out at end
    if (progress > 0.85) {
      const fadeProgress = (progress - 0.85) / 0.15;
      dome.material.opacity *= (1 - fadeProgress);
      wireframe.material.opacity *= (1 - fadeProgress);
      baseRing.material.opacity *= (1 - fadeProgress);
      centralPillar.material.opacity *= (1 - fadeProgress);
      pillars.forEach(p => {
        if (p.material) p.material.opacity = 0.8 * (1 - fadeProgress);
      });
    }
    
    requestAnimationFrame(animate);
  }
  
  animate();
}
