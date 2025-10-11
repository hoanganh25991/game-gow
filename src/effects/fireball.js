import * as THREE from "../../vendor/three/build/three.module.js";
import { SKILL_FX } from "../../config/skills_fx.js";
import { now } from "../utils.js";
import { FX } from "../../config/index.js";

/**
 * Fireball Effect
 * 
 * UNIQUE VISUAL: Massive spinning fireball with layered flames,
 * spiral trail, and spectacular multi-stage explosion
 */
class FireballEffect {
  constructor(baseEffects, params) {
    const { from, to } = params || {};
    const fx = SKILL_FX.fireball || {};
    const colors = fx.colors || {};
    const size = fx.size || {};
    const particles = fx.particles || {};
    const custom = fx.custom || {};
    
    // Create actual 3D fireball
    const fireballGroup = new THREE.Group();
  const ballSize = size.ball || 0.6;
  
  // Core (bright yellow)
  const coreGeo = new THREE.SphereGeometry(ballSize * 0.5, 16, 16);
  const coreMat = new THREE.MeshBasicMaterial({ 
    color: colors.explosion || "#ffff00",
    transparent: true,
    opacity: 1.0
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  fireballGroup.add(core);
  
  // Middle layer (orange)
  const midGeo = new THREE.IcosahedronGeometry(ballSize * 0.8, 1);
  const midMat = new THREE.MeshBasicMaterial({ 
    color: colors.secondary || "#ffa500",
    transparent: true,
    opacity: 0.8
  });
  const mid = new THREE.Mesh(midGeo, midMat);
  fireballGroup.add(mid);
  
  // Outer flames (red-orange)
  const outerGeo = new THREE.IcosahedronGeometry(ballSize, 1);
  const outerMat = new THREE.MeshBasicMaterial({ 
    color: colors.primary || "#ff6347",
    transparent: true,
    opacity: 0.7
  });
  const outer = new THREE.Mesh(outerGeo, outerMat);
  fireballGroup.add(outer);
  
  fireballGroup.position.copy(from);
  baseEffects.scene.add(fireballGroup);
  
  // Calculate travel
  const dir = new THREE.Vector3().subVectors(to, from);
  const distance = dir.length();
  const travelTime = distance / 22; // speed 22
  const startTime = now();
  
  let trailCounter = 0;
  
  const animateFireball = () => {
    const elapsed = (now() - startTime) / 1000;
    const progress = Math.min(1, elapsed / travelTime);
    
    if (progress < 1) {
      // Update position
      fireballGroup.position.lerpVectors(from, to, progress);
      
      // Spin fireball
      fireballGroup.rotation.x += 0.15;
      fireballGroup.rotation.y += 0.2;
      fireballGroup.rotation.z += 0.1;
      
      // Pulse size
      const pulse = 1 + Math.sin(elapsed * 10) * 0.15;
      fireballGroup.scale.set(pulse, pulse, pulse);
      
      // Spawn spiral trail
      trailCounter++;
      if (trailCounter % 2 === 0) {
        for (let i = 0; i < 4; i++) {
          const angle = (progress * (custom.rotation || 5) + i * Math.PI / 2);
          const radius = ballSize * 0.8;
          const offset = new THREE.Vector3(
            Math.cos(angle) * radius,
            Math.sin(angle) * radius,
            0
          );
          
          // Rotate offset to face direction
          const perpDir = new THREE.Vector3(-dir.z, 0, dir.x).normalize();
          const upDir = new THREE.Vector3(0, 1, 0);
          const rotatedOffset = perpDir.clone().multiplyScalar(offset.x)
            .add(upDir.clone().multiplyScalar(offset.y));
          
          const trailParticle = new THREE.Mesh(
            new THREE.SphereGeometry(0.15, 8, 8),
            new THREE.MeshBasicMaterial({ 
              color: i % 2 === 0 ? (colors.secondary || "#ffa500") : (colors.primary || "#ff6347"),
              transparent: true,
              opacity: 0.9
            })
          );
          trailParticle.position.copy(fireballGroup.position).add(rotatedOffset);
          baseEffects.transient.add(trailParticle);
          
          baseEffects.queue.push({
            obj: trailParticle,
            until: now() + 0.3 * FX.timeScale,
            fade: true,
            mat: trailParticle.material,
            scaleRate: -2.0
          });
        }
      }
      
      // Spawn flame trail
      if (Math.random() > 0.4) {
        const flame = new THREE.Mesh(
          new THREE.SphereGeometry(ballSize * (0.3 + Math.random() * 0.3), 8, 8),
          new THREE.MeshBasicMaterial({ 
            color: Math.random() > 0.5 ? (colors.accent || "#ff4500") : (colors.primary || "#ff6347"),
            transparent: true,
            opacity: 0.7
          })
        );
        flame.position.copy(fireballGroup.position);
        flame.position.x += (Math.random() - 0.5) * 0.5;
        flame.position.y += (Math.random() - 0.5) * 0.5;
        flame.position.z += (Math.random() - 0.5) * 0.5;
        baseEffects.transient.add(flame);
        
        baseEffects.queue.push({
          obj: flame,
          until: now() + 0.4 * FX.timeScale,
          fade: true,
          mat: flame.material,
          scaleRate: -1.5
        });
      }
      
      requestAnimationFrame(animateFireball);
    } else {
      // Impact!
      baseEffects.scene.remove(fireballGroup);
      coreGeo.dispose();
      coreMat.dispose();
      midGeo.dispose();
      midMat.dispose();
      outerGeo.dispose();
      outerMat.dispose();
      
      createFireballExplosion(to, size.explosion || 2.0, colors, baseEffects);
    }
  };
  
  animateFireball();
  }
}

export default function fireballEffect(baseEffects, params) { return new FireballEffect(baseEffects, params); }

/**
 * Create spectacular fireball explosion
 */
function createFireballExplosion(position, explosionSize, colors, baseEffects) {
  // Initial flash (bright white-yellow)
  const flash = new THREE.Mesh(
    new THREE.SphereGeometry(explosionSize * 0.5, 16, 16),
    new THREE.MeshBasicMaterial({
      color: colors.explosion || "#ffffff",
      transparent: true,
      opacity: 1.0
    })
  );
  flash.position.copy(position);
  baseEffects.transient.add(flash);
  
  baseEffects.queue.push({
    obj: flash,
    until: now() + 0.15 * FX.timeScale,
    fade: true,
    mat: flash.material,
    scaleRate: 12.0
  });
  
  // Main explosion sphere (expanding fireball)
  const explosion = new THREE.Mesh(
    new THREE.IcosahedronGeometry(explosionSize * 0.8, 1),
    new THREE.MeshBasicMaterial({
      color: colors.primary || "#ff6347",
      transparent: true,
      opacity: 0.9
    })
  );
  explosion.position.copy(position);
  baseEffects.transient.add(explosion);
  
  baseEffects.queue.push({
    obj: explosion,
    until: now() + 0.5 * FX.timeScale,
    fade: true,
    mat: explosion.material,
    scaleRate: 6.0
  });
  
  // Multiple expanding shockwave rings
  for (let i = 0; i < 4; i++) {
    setTimeout(() => {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.3, 0.7, 48),
        new THREE.MeshBasicMaterial({
          color: i === 0 ? (colors.explosion || "#ffff00") : (i === 1 ? (colors.secondary || "#ffa500") : (colors.primary || "#ff6347")),
          transparent: true,
          opacity: 0.8,
          side: THREE.DoubleSide
        })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(position.x, 0.1, position.z);
      baseEffects.indicators.add(ring);
      
      const maxScale = explosionSize * (i + 1) * 1.5;
      const duration = 0.6;
      const startTime = now();
      
      baseEffects.queue.push({
        obj: ring,
        until: startTime + duration * FX.timeScale,
        fade: true,
        mat: ring.material,
        shockwave: true,
        shockwaveMaxRadius: maxScale,
        shockwaveThickness: 0.7,
        shockwaveStartTime: startTime,
        shockwaveDuration: duration
      });
    }, i * 100);
  }
  
  // Fire burst particles (flying embers)
  for (let i = 0; i < 40; i++) {
    const ember = new THREE.Mesh(
      new THREE.SphereGeometry(0.1 + Math.random() * 0.1, 8, 8),
      new THREE.MeshBasicMaterial({
        color: Math.random() > 0.5 ? (colors.secondary || "#ffa500") : (colors.accent || "#ff4500"),
        transparent: true,
        opacity: 0.9
      })
    );
    
    ember.position.copy(position);
    baseEffects.transient.add(ember);
    
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 4;
    const upSpeed = 1 + Math.random() * 3;
    
    baseEffects.queue.push({
      obj: ember,
      until: now() + (0.8 + Math.random() * 0.6) * FX.timeScale,
      fade: true,
      mat: ember.material,
      particle: true,
      velocity: new THREE.Vector3(
        Math.cos(angle) * speed,
        upSpeed,
        Math.sin(angle) * speed
      ),
      gravity: -8
    });
  }
  
  // Fire pillars
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const dist = explosionSize * 0.8;
    
    setTimeout(() => {
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.4, 3 + Math.random(), 12),
        new THREE.MeshBasicMaterial({
          color: i % 2 === 0 ? (colors.primary || "#ff6347") : (colors.secondary || "#ffa500"),
          transparent: true,
          opacity: 0.8
        })
      );
      pillar.position.set(
        position.x + Math.cos(angle) * dist,
        1.5,
        position.z + Math.sin(angle) * dist
      );
      baseEffects.transient.add(pillar);
      
      baseEffects.queue.push({
        obj: pillar,
        until: now() + 0.4 * FX.timeScale,
        fade: true,
        mat: pillar.material,
        scaleRate: -2.0
      });
    }, i * 50);
  }
  
  // Ground scorch mark
  const scorch = new THREE.Mesh(
    new THREE.RingGeometry(explosionSize * 0.5, explosionSize * 1.5, 48),
    new THREE.MeshBasicMaterial({
      color: "#2a1a0a",
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide
    })
  );
  scorch.rotation.x = -Math.PI / 2;
  scorch.position.set(position.x, 0.01, position.z);
  baseEffects.indicators.add(scorch);
  
  baseEffects.queue.push({
    obj: scorch,
    until: now() + 2.0 * FX.timeScale,
    fade: true,
    mat: scorch.material
  });
}
