import * as THREE from "../../vendor/three/build/three.module.js";
import { SKILL_FX } from "../../config/skills_fx.js";
import { now } from "../utils.js";
import { FX } from "../../config/index.js";

/**
 * Volcanic Wrath Effect
 * 
 * UNIQUE VISUAL: Massive erupting volcano with 3D cone, lava fountains,
 * smoke columns, flying lava bombs with arcing trajectories
 */
class VolcanicWrathEffect {
  constructor(baseEffects, params) {
    const { center, radius, strike, strikePos } = params || {};
    const fx = SKILL_FX.volcanic_wrath || {};
    const colors = fx.colors || {};
    const size = fx.size || {};
    const particles = fx.particles || {};
    const custom = fx.custom || {};
    
    if (strike && strikePos) {
      // Lava bomb impact - create molten splash
      createLavaBombImpact(strikePos, size.lava || 1.5, colors, baseEffects);
    
    } else if (center) {
      // Create massive volcanic eruption
      createVolcanoEruption(center, radius || 24, size, colors, custom, baseEffects);
    }
  }
}

export default function volcanicWrathEffect(baseEffects, params) { return new VolcanicWrathEffect(baseEffects, params); }

/**
 * Create lava bomb impact with molten splash
 */
function createLavaBombImpact(position, lavaSize, colors, baseEffects) {
  // Lava blob impact
  const lavaSplash = new THREE.Mesh(
    new THREE.DodecahedronGeometry(lavaSize * 0.8, 0),
    new THREE.MeshBasicMaterial({
      color: colors.primary || "#ff4500",
      transparent: true,
      opacity: 1.0
    })
  );
  lavaSplash.position.copy(position);
  baseEffects.transient.add(lavaSplash);
  
  baseEffects.queue.push({
    obj: lavaSplash,
    until: now() + 0.4 * FX.timeScale,
    fade: true,
    mat: lavaSplash.material,
    scaleRate: 3.0
  });
  
  // Molten splash particles
  const splashColors = [colors.primary || "#ff4500", colors.secondary || "#8b0000"];
  for (let i = 0; i < 25; i++) {
    const splash = new THREE.Mesh(
      new THREE.SphereGeometry(0.1 + Math.random() * 0.15, 8, 8),
      new THREE.MeshBasicMaterial({
        color: splashColors[Math.floor(Math.random() * splashColors.length)],
        transparent: true,
        opacity: 0.9
      })
    );
    
    splash.position.copy(position);
    baseEffects.transient.add(splash);
    
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 3;
    
    baseEffects.queue.push({
      obj: splash,
      until: now() + (0.6 + Math.random() * 0.6) * FX.timeScale,
      fade: true,
      mat: splash.material,
      particle: true,
      velocity: new THREE.Vector3(
        Math.cos(angle) * speed,
        1 + Math.random() * 2,
        Math.sin(angle) * speed
      ),
      gravity: -10
    });
  }
  
  // Molten ground pool
  const pool = new THREE.Mesh(
    new THREE.CircleGeometry(lavaSize * 1.5, 32),
    new THREE.MeshBasicMaterial({
      color: colors.secondary || "#8b0000",
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    })
  );
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(position.x, 0.01, position.z);
  baseEffects.indicators.add(pool);
  
  baseEffects.queue.push({
    obj: pool,
    until: now() + 2.0 * FX.timeScale,
    fade: true,
    mat: pool.material,
    pulseAmp: 0.08,
    pulseRate: 4.0,
    baseScale: 1
  });
}

/**
 * Create massive volcano eruption with 3D cone
 */
function createVolcanoEruption(center, radius, size, colors, custom, baseEffects) {
  // Build 3D volcano cone
  const volcanoGroup = new THREE.Group();
  
  // Main cone (dark rock)
  const coneHeight = (size.volcano || 2.0) * 8;
  const coneRadius = 3.0;
  const coneGeo = new THREE.ConeGeometry(coneRadius, coneHeight, 16);
  const coneMat = new THREE.MeshBasicMaterial({
    color: 0x2a1a0a,
    transparent: true,
    opacity: 0.9
  });
  const cone = new THREE.Mesh(coneGeo, coneMat);
  cone.position.set(center.x, coneHeight / 2, center.z);
  volcanoGroup.add(cone);
  
  // Glowing lava cracks on cone
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const crackHeight = coneHeight * 0.7;
    const crack = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.15, crackHeight, 8),
      new THREE.MeshBasicMaterial({
        color: colors.primary || "#ff4500",
        transparent: true,
        opacity: 0.8
      })
    );
    const crackDist = coneRadius * 0.6;
    crack.position.set(
      center.x + Math.cos(angle) * crackDist,
      crackHeight / 2,
      center.z + Math.sin(angle) * crackDist
    );
    volcanoGroup.add(crack);
  }
  
  baseEffects.scene.add(volcanoGroup);
  
  // Volcano persists for duration then fades
  baseEffects.queue.push({
    obj: volcanoGroup,
    until: now() + 3.0 * FX.timeScale,
    fade: true,
    mats: [coneMat]
  });
  
  // Warning area ring
  const warningRing = new THREE.Mesh(
    new THREE.RingGeometry(radius - 1.5, radius + 1.5, 64),
    new THREE.MeshBasicMaterial({
      color: colors.primary || "#ff4500",
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    })
  );
  warningRing.rotation.x = -Math.PI / 2;
  warningRing.position.set(center.x, 0.05, center.z);
  baseEffects.indicators.add(warningRing);
  
  baseEffects.queue.push({
    obj: warningRing,
    until: now() + 1.5 * FX.timeScale,
    fade: true,
    mat: warningRing.material,
    pulseAmp: 0.12,
    pulseRate: 3.5,
    baseScale: 1
  });
  
  // Massive lava eruption from crater
  const lavaParticleColors = [colors.primary || "#ff4500", colors.accent || "#ffd700"];
  setTimeout(() => {
    // Central lava fountain
    for (let i = 0; i < 60; i++) {
      const lavaParticle = new THREE.Mesh(
        new THREE.SphereGeometry(0.2 + Math.random() * 0.3, 8, 8),
        new THREE.MeshBasicMaterial({
          color: lavaParticleColors[Math.floor(Math.random() * lavaParticleColors.length)],
          transparent: true,
          opacity: 1.0
        })
      );
      
      lavaParticle.position.set(center.x, center.y + coneHeight, center.z);
      baseEffects.transient.add(lavaParticle);
      
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 6;
      const upSpeed = 8 + Math.random() * 8;
      
      baseEffects.queue.push({
        obj: lavaParticle,
        until: now() + (1.5 + Math.random() * 1.0) * FX.timeScale,
        fade: true,
        mat: lavaParticle.material,
        particle: true,
        velocity: new THREE.Vector3(
          Math.cos(angle) * speed,
          upSpeed,
          Math.sin(angle) * speed
        ),
        gravity: -12,
        spinRate: Math.random() * 8 - 4
      });
    }
  }, 200);
  
  // Lava fountains around the area
  const fountainCount = custom.lavaFountains || 5;
  for (let i = 0; i < fountainCount; i++) {
    const angle = (i / fountainCount) * Math.PI * 2;
    const dist = radius * (0.3 + Math.random() * 0.3);
    const fountainPos = new THREE.Vector3(
      center.x + Math.cos(angle) * dist,
      center.y,
      center.z + Math.sin(angle) * dist
    );
    
    setTimeout(() => {
      // Lava geyser pillar
      const geyser = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.8, 10, 12),
        new THREE.MeshBasicMaterial({
          color: colors.primary || "#ff4500",
          transparent: true,
          opacity: 0.8
        })
      );
      geyser.position.set(fountainPos.x, 5, fountainPos.z);
      baseEffects.transient.add(geyser);
      
      baseEffects.queue.push({
        obj: geyser,
        until: now() + 0.8 * FX.timeScale,
        fade: true,
        mat: geyser.material,
        scaleRate: -1.5
      });
      
      // Lava particles from geyser
      for (let j = 0; j < 30; j++) {
        setTimeout(() => {
          const particle = new THREE.Mesh(
            new THREE.SphereGeometry(0.15, 8, 8),
            new THREE.MeshBasicMaterial({
              color: colors.accent || "#ffd700",
              transparent: true,
              opacity: 0.9
            })
          );
          
          particle.position.set(fountainPos.x, fountainPos.y + 8, fountainPos.z);
          baseEffects.transient.add(particle);
          
          const pAngle = Math.random() * Math.PI * 2;
          const pSpeed = 2 + Math.random() * 3;
          
          baseEffects.queue.push({
            obj: particle,
            until: now() + (1.0 + Math.random() * 0.8) * FX.timeScale,
            fade: true,
            mat: particle.material,
            particle: true,
            velocity: new THREE.Vector3(
              Math.cos(pAngle) * pSpeed,
              2 + Math.random() * 3,
              Math.sin(pAngle) * pSpeed
            ),
            gravity: -10
          });
        }, j * 20);
      }
    }, i * 200);
  }
  
  // Black smoke columns
  const smokeCount = custom.smokeColumns || 8;
  for (let i = 0; i < smokeCount; i++) {
    const angle = (i / smokeCount) * Math.PI * 2;
    const dist = radius * 0.5;
    const smokePos = new THREE.Vector3(
      center.x + Math.cos(angle) * dist,
      center.y,
      center.z + Math.sin(angle) * dist
    );
    
    setTimeout(() => {
      // Smoke pillar
      const smoke = new THREE.Mesh(
        new THREE.CylinderGeometry(1.0, 0.5, 12, 12),
        new THREE.MeshBasicMaterial({
          color: colors.smoke || "#1a1a1a",
          transparent: true,
          opacity: 0.6
        })
      );
      smoke.position.set(smokePos.x, 6, smokePos.z);
      baseEffects.transient.add(smoke);
      
      baseEffects.queue.push({
        obj: smoke,
        until: now() + 2.5 * FX.timeScale,
        fade: true,
        mat: smoke.material,
        scaleRate: 0.8,
        velY: 1.5
      });
      
      // Smoke particles
      for (let j = 0; j < 15; j++) {
        setTimeout(() => {
          const smokeParticle = new THREE.Mesh(
            new THREE.SphereGeometry(0.3 + Math.random() * 0.4, 8, 8),
            new THREE.MeshBasicMaterial({
              color: colors.smoke || "#1a1a1a",
              transparent: true,
              opacity: 0.5
            })
          );
          
          smokeParticle.position.set(smokePos.x, smokePos.y + 8, smokePos.z);
          smokeParticle.position.x += (Math.random() - 0.5) * 2;
          smokeParticle.position.z += (Math.random() - 0.5) * 2;
          baseEffects.transient.add(smokeParticle);
          
          baseEffects.queue.push({
            obj: smokeParticle,
            until: now() + (2.0 + Math.random() * 1.5) * FX.timeScale,
            fade: true,
            mat: smokeParticle.material,
            scaleRate: 1.2,
            velY: 0.8 + Math.random() * 0.6
          });
        }, j * 80);
      }
    }, i * 150 + 400);
  }
  
  // Flying lava bombs with arcing trajectories
  const bombCount = custom.lavaBombs || 12;
  for (let i = 0; i < bombCount; i++) {
    setTimeout(() => {
      const angle = Math.random() * Math.PI * 2;
      const dist = radius * (0.4 + Math.random() * 0.6);
      const targetPos = new THREE.Vector3(
        center.x + Math.cos(angle) * dist,
        center.y,
        center.z + Math.sin(angle) * dist
      );
      
      // Create lava bomb
      const bomb = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.4, 0),
        new THREE.MeshBasicMaterial({
          color: colors.primary || "#ff4500",
          transparent: true,
          opacity: 1.0
        })
      );
      
      const launchHeight = coneHeight + 2;
      bomb.position.set(center.x, launchHeight, center.z);
      baseEffects.scene.add(bomb);
      
      // Animate arcing trajectory
      const arcDuration = 0.8;
      const arcStart = now();
      
      const animateBomb = () => {
        const elapsed = (now() - arcStart) / 1000;
        const progress = Math.min(1, elapsed / arcDuration);
        
        if (progress < 1) {
          // Parabolic arc
          bomb.position.x = center.x + (targetPos.x - center.x) * progress;
          bomb.position.z = center.z + (targetPos.z - center.z) * progress;
          bomb.position.y = launchHeight + Math.sin(progress * Math.PI) * 8;
          
          // Rotate bomb
          bomb.rotation.x += 0.2;
          bomb.rotation.y += 0.15;
          
          // Trail particles
          if (Math.random() > 0.5) {
            const trail = new THREE.Mesh(
              new THREE.SphereGeometry(0.15, 6, 6),
              new THREE.MeshBasicMaterial({
                color: colors.accent || "#ffd700",
                transparent: true,
                opacity: 0.8
              })
            );
            trail.position.copy(bomb.position);
            baseEffects.transient.add(trail);
            
            baseEffects.queue.push({
              obj: trail,
              until: now() + 0.3 * FX.timeScale,
              fade: true,
              mat: trail.material,
              scaleRate: -2.0
            });
          }
          
          requestAnimationFrame(animateBomb);
        } else {
          // Impact!
          baseEffects.scene.remove(bomb);
          bomb.geometry.dispose();
          bomb.material.dispose();
          
          createLavaBombImpact(targetPos, 1.5, colors, baseEffects);
        }
      };
      
      animateBomb();
    }, i * 120 + 300);
  }
}
