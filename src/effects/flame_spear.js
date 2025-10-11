import * as THREE from "../../vendor/three/build/three.module.js";
import { SKILL_FX } from "../../config/skills_fx.js";
import { now } from "../utils.js";
import { FX } from "../../config/index.js";

/**
 * Flame Spear Effect
 * 
 * UNIQUE VISUAL: Actual 3D flaming spear with glowing tip, spiral flames,
 * and piercing impact with penetration effect
 */
class FlameSpearEffect {
  constructor(baseEffects, params) {
    const { from, to } = params || {};
    const fx = SKILL_FX.flame_spear || {};
    const colors = fx.colors || {};
    const size = fx.size || {};
    const particles = fx.particles || {};
    const custom = fx.custom || {};
  
  // Create 3D spear model
  const spearGroup = new THREE.Group();
  const spearLength = custom.spearLength || 3.0;
  
  // Spear shaft (elongated cylinder)
  const shaftGeo = new THREE.CylinderGeometry(0.08, 0.12, spearLength * 0.7, 8);
  const shaftMat = new THREE.MeshBasicMaterial({
    color: "#8b4513", // Brown wood
    transparent: true,
    opacity: 0.9
  });
  const shaft = new THREE.Mesh(shaftGeo, shaftMat);
  shaft.rotation.z = Math.PI / 2; // Horizontal
  spearGroup.add(shaft);
  
  // Spear blade (cone)
  const bladeGeo = new THREE.ConeGeometry(0.2, spearLength * 0.4, 8);
  const bladeMat = new THREE.MeshBasicMaterial({
    color: "#c0c0c0", // Silver
    transparent: true,
    opacity: 1.0
  });
  const blade = new THREE.Mesh(bladeGeo, bladeMat);
  blade.rotation.z = -Math.PI / 2; // Point forward
  blade.position.x = spearLength * 0.55;
  spearGroup.add(blade);
  
  // Glowing flame aura around spear
  const flameGeo = new THREE.CylinderGeometry(0.25, 0.3, spearLength, 12);
  const flameMat = new THREE.MeshBasicMaterial({
    color: colors.primary || "#ff4500",
    transparent: true,
    opacity: 0.6
  });
  const flame = new THREE.Mesh(flameGeo, flameMat);
  flame.rotation.z = Math.PI / 2;
  spearGroup.add(flame);
  
  // Bright tip glow
  const tipGeo = new THREE.SphereGeometry(size.tip || 0.4, 12, 12);
  const tipMat = new THREE.MeshBasicMaterial({
    color: colors.accent || "#ffd700",
    transparent: true,
    opacity: 1.0
  });
  const tip = new THREE.Mesh(tipGeo, tipMat);
  tip.position.x = spearLength * 0.7;
  spearGroup.add(tip);
  
  spearGroup.position.copy(from);
  
  // Orient spear toward target
  const dir = new THREE.Vector3().subVectors(to, from).normalize();
  const angle = Math.atan2(dir.z, dir.x);
  spearGroup.rotation.y = -angle;
  
  baseEffects.scene.add(spearGroup);
  
  // Calculate travel
  const distance = from.distanceTo(to);
  const travelTime = distance / 28; // speed 28
  const startTime = now();
  
  let trailCounter = 0;
  
  const animateSpear = () => {
    const elapsed = (now() - startTime) / 1000;
    const progress = Math.min(1, elapsed / travelTime);
    
    if (progress < 1) {
      // Update position
      spearGroup.position.lerpVectors(from, to, progress);
      
      // Spin spear for dramatic effect
      spearGroup.rotation.z += 0.3;
      
      // Pulse flame aura
      const pulse = 1 + Math.sin(elapsed * 12) * 0.2;
      flame.scale.set(pulse, pulse, pulse);
      
      // Spawn spiral trail
      trailCounter++;
      if (custom.spiralTrail && trailCounter % 2 === 0) {
        for (let i = 0; i < 4; i++) {
          const spiralAngle = (progress * 8 + i * Math.PI / 2);
          const radius = 0.5;
          
          // Create spiral offset
          const perpDir = new THREE.Vector3(-dir.z, 0, dir.x).normalize();
          const upDir = new THREE.Vector3(0, 1, 0);
          const offset = perpDir.clone().multiplyScalar(Math.cos(spiralAngle) * radius)
            .add(upDir.clone().multiplyScalar(Math.sin(spiralAngle) * radius));
          
          const spiralParticle = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 8, 8),
            new THREE.MeshBasicMaterial({
              color: colors.secondary || "#ffa500",
              transparent: true,
              opacity: 0.8
            })
          );
          spiralParticle.position.copy(spearGroup.position).add(offset);
          baseEffects.transient.add(spiralParticle);
          
          baseEffects.queue.push({
            obj: spiralParticle,
            until: now() + 0.25 * FX.timeScale,
            fade: true,
            mat: spiralParticle.material,
            scaleRate: -2.5
          });
        }
      }
      
      // Flame trail particles
      if (Math.random() > 0.4) {
        const trailFlame = new THREE.Mesh(
          new THREE.SphereGeometry(0.2 + Math.random() * 0.15, 8, 8),
          new THREE.MeshBasicMaterial({
            color: Math.random() > 0.5 ? (colors.secondary || "#ff6347") : (colors.primary || "#ff4500"),
            transparent: true,
            opacity: 0.8
          })
        );
        trailFlame.position.copy(spearGroup.position);
        trailFlame.position.y += (Math.random() - 0.5) * 0.5;
        baseEffects.transient.add(trailFlame);
        
        baseEffects.queue.push({
          obj: trailFlame,
          until: now() + 0.3 * FX.timeScale,
          fade: true,
          mat: trailFlame.material,
          scaleRate: -1.8
        });
      }
      
      // Tip glow trail
      if (custom.tipGlow && Math.random() > 0.6) {
        const glow = new THREE.Mesh(
          new THREE.SphereGeometry((size.tip || 0.4) * (custom.tipGlow || 2.0), 12, 12),
          new THREE.MeshBasicMaterial({
            color: colors.accent || "#ffd700",
            transparent: true,
            opacity: 0.6
          })
        );
        glow.position.copy(spearGroup.position);
        baseEffects.transient.add(glow);
        
        baseEffects.queue.push({
          obj: glow,
          until: now() + 0.2 * FX.timeScale,
          fade: true,
          mat: glow.material,
          scaleRate: -3.0
        });
      }
      
      requestAnimationFrame(animateSpear);
    } else {
      // Impact!
      baseEffects.scene.remove(spearGroup);
      shaftGeo.dispose();
      shaftMat.dispose();
      bladeGeo.dispose();
      bladeMat.dispose();
      flameGeo.dispose();
      flameMat.dispose();
      tipGeo.dispose();
      tipMat.dispose();
      
      createSpearImpact(to, dir, custom.pierceDepth || 0, colors, baseEffects);
    }
  };
  
  animateSpear();
  }
}

export default function flameSpearEffect(baseEffects, params) { return new FlameSpearEffect(baseEffects, params); }

/**
 * Create piercing spear impact with penetration effect
 */
function createSpearImpact(position, direction, pierceDepth, colors, baseEffects) {
  // Initial impact flash
  const flash = new THREE.Mesh(
    new THREE.SphereGeometry(1.5, 16, 16),
    new THREE.MeshBasicMaterial({
      color: colors.accent || "#ffd700",
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
    scaleRate: 10.0
  });
  
  // Piercing beam (spear continues through)
  if (pierceDepth > 0) {
    const pierceEnd = position.clone().add(direction.clone().multiplyScalar(pierceDepth));
    
    // Create piercing beam
    const beamGeo = new THREE.CylinderGeometry(0.15, 0.15, pierceDepth, 8);
    const beamMat = new THREE.MeshBasicMaterial({
      color: colors.accent || "#ffd700",
      transparent: true,
      opacity: 0.9
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    
    // Position and orient beam
    beam.position.lerpVectors(position, pierceEnd, 0.5);
    const angle = Math.atan2(direction.z, direction.x);
    beam.rotation.z = Math.PI / 2 - angle;
    beam.rotation.y = -angle;
    
    baseEffects.transient.add(beam);
    
    baseEffects.queue.push({
      obj: beam,
      until: now() + 0.4 * FX.timeScale,
      fade: true,
      mat: beamMat
    });
    
    // Secondary impact at pierce end
    setTimeout(() => {
      const secondFlash = new THREE.Mesh(
        new THREE.SphereGeometry(1.0, 12, 12),
        new THREE.MeshBasicMaterial({
          color: colors.secondary || "#ff6347",
          transparent: true,
          opacity: 0.9
        })
      );
      secondFlash.position.copy(pierceEnd);
      baseEffects.transient.add(secondFlash);
      
      baseEffects.queue.push({
        obj: secondFlash,
        until: now() + 0.3 * FX.timeScale,
        fade: true,
        mat: secondFlash.material,
        scaleRate: 6.0
      });
    }, 150);
  }
  
  // Expanding shockwave rings
  for (let i = 0; i < 3; i++) {
    setTimeout(() => {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.3, 0.6, 48),
        new THREE.MeshBasicMaterial({
          color: i === 0 ? (colors.accent || "#ffd700") : (i === 1 ? (colors.secondary || "#ff6347") : (colors.primary || "#ff4500")),
          transparent: true,
          opacity: 0.8,
          side: THREE.DoubleSide
        })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(position.x, 0.1, position.z);
      baseEffects.indicators.add(ring);
      
      const maxScale = (i + 1) * 2.5;
      const duration = 0.5;
      const startTime = now();
      
      baseEffects.queue.push({
        obj: ring,
        until: startTime + duration * FX.timeScale,
        fade: true,
        mat: ring.material,
        shockwave: true,
        shockwaveMaxRadius: maxScale,
        shockwaveThickness: 0.6,
        shockwaveStartTime: startTime,
        shockwaveDuration: duration
      });
    }, i * 100);
  }
  
  // Fire burst particles
  for (let i = 0; i < 30; i++) {
    const particle = new THREE.Mesh(
      new THREE.SphereGeometry(0.1 + Math.random() * 0.1, 8, 8),
      new THREE.MeshBasicMaterial({
        color: Math.random() > 0.5 ? (colors.secondary || "#ff6347") : (colors.trail || "#ffa500"),
        transparent: true,
        opacity: 0.9
      })
    );
    
    particle.position.copy(position);
    baseEffects.transient.add(particle);
    
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 4;
    
    baseEffects.queue.push({
      obj: particle,
      until: now() + (0.6 + Math.random() * 0.5) * FX.timeScale,
      fade: true,
      mat: particle.material,
      particle: true,
      velocity: new THREE.Vector3(
        Math.cos(angle) * speed,
        1 + Math.random() * 2,
        Math.sin(angle) * speed
      ),
      gravity: -9
    });
  }
  
  // Fire pillars at impact
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    const dist = 1.5;
    
    setTimeout(() => {
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.35, 3, 12),
        new THREE.MeshBasicMaterial({
          color: i % 2 === 0 ? (colors.secondary || "#ff6347") : (colors.trail || "#ffa500"),
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
    }, i * 60);
  }
  
  // Ground scorch mark
  const scorch = new THREE.Mesh(
    new THREE.RingGeometry(1.0, 2.5, 48),
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
    until: now() + 1.5 * FX.timeScale,
    fade: true,
    mat: scorch.material
  });
}
