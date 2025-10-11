import * as THREE from "../../vendor/three/build/three.module.js";
import { SKILL_FX } from "../../config/skills_fx.js";
import { now } from "../utils.js";
import { FX } from "../../config/index.js";

/**
 * Fire Bolt Effect
 * 
 * UNIQUE VISUAL: Lightning-fast bolt with electric-like segments,
 * crackling sparks, and concentrated piercing impact
 */
class FireBoltEffect {
  constructor(baseEffects, params) {
    const { from, to } = params || {};
    const fx = SKILL_FX.fire_bolt || {};
    const colors = fx.colors || {};
    const size = fx.size || {};
    const particles = fx.particles || {};
    const custom = fx.custom || {};
  
  // Create segmented bolt (like lightning)
  const boltGroup = new THREE.Group();
  const segments = custom.boltSegments || 8;
  const dir = new THREE.Vector3().subVectors(to, from);
  const distance = dir.length();
  const segmentLength = distance / segments;
  
  const points = [from.clone()];
  
  // Create jagged path
  for (let i = 1; i < segments; i++) {
    const t = i / segments;
    const point = from.clone().lerp(to, t);
    
    // Add random offset for jagged look
    const offset = segmentLength * 0.2;
    point.x += (Math.random() - 0.5) * offset;
    point.y += (Math.random() - 0.5) * offset * 0.5;
    point.z += (Math.random() - 0.5) * offset;
    
    points.push(point);
  }
  points.push(to.clone());
  
  // Create bolt segments with varying thickness
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const segDir = new THREE.Vector3().subVectors(p2, p1);
    const segDist = segDir.length();
    
    // Main bolt segment (cylinder)
    const thickness = (size.bolt || 0.3) * (0.8 + Math.random() * 0.4);
    const segGeo = new THREE.CylinderGeometry(thickness * 0.5, thickness * 0.5, segDist, 6);
    const segMat = new THREE.MeshBasicMaterial({
      color: i % 2 === 0 ? 0xff6347 : 0xffa500,
      transparent: true,
      opacity: 0.9
    });
    const segment = new THREE.Mesh(segGeo, segMat);
    
    // Position and orient segment
    segment.position.lerpVectors(p1, p2, 0.5);
    const angle = Math.atan2(segDir.z, segDir.x);
    const angleY = Math.atan2(Math.sqrt(segDir.x * segDir.x + segDir.z * segDir.z), segDir.y);
    segment.rotation.z = Math.PI / 2 - angleY;
    segment.rotation.y = -angle;
    
    boltGroup.add(segment);
    
    // Glow sphere at joint
    const jointGeo = new THREE.SphereGeometry(thickness * 1.2, 8, 8);
    const jointMat = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0.8
    });
    const joint = new THREE.Mesh(jointGeo, jointMat);
    joint.position.copy(p1);
    boltGroup.add(joint);
  }
  
  boltGroup.position.set(0, 0, 0);
  baseEffects.scene.add(boltGroup);
  
  // Animate bolt (very fast)
  const travelTime = distance / 32; // speed 32
  const startTime = now();
  
  let sparkCounter = 0;
  
  const animateBolt = () => {
    const elapsed = (now() - startTime) / 1000;
    const progress = Math.min(1, elapsed / travelTime);
    
    if (progress < 1) {
      // Pulse bolt
      const pulse = 1 + Math.sin(elapsed * 40) * 0.3;
      boltGroup.scale.set(pulse, pulse, pulse);
      
      // Spawn crackling sparks
      sparkCounter++;
      if (sparkCounter % 1 === 0) { // Every frame
        const sparkPoint = points[Math.floor(Math.random() * points.length)];
        const spark = new THREE.Mesh(
          new THREE.SphereGeometry(0.08, 6, 6),
          new THREE.MeshBasicMaterial({
            color: 0xffd700,
            transparent: true,
            opacity: 1.0
          })
        );
        spark.position.copy(sparkPoint);
        spark.position.x += (Math.random() - 0.5) * 0.5;
        spark.position.y += (Math.random() - 0.5) * 0.5;
        spark.position.z += (Math.random() - 0.5) * 0.5;
        baseEffects.transient.add(spark);
        
        baseEffects.queue.push({
          obj: spark,
          until: now() + 0.15 * FX.timeScale,
          fade: true,
          mat: spark.material,
          scaleRate: -5.0
        });
      }
      
      requestAnimationFrame(animateBolt);
    } else {
      // Impact!
      baseEffects.scene.remove(boltGroup);
      boltGroup.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
      
      createBoltImpact(to, dir.normalize(), colors, size, particles, custom, baseEffects);
    }
  };
  
  animateBolt();
  
  // Instant flash along path (bolt is so fast it appears instant)
  for (let i = 0; i < points.length; i++) {
    setTimeout(() => {
      const flash = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 8, 8),
        new THREE.MeshBasicMaterial({
          color: 0xffff00,
          transparent: true,
          opacity: 1.0
        })
      );
      flash.position.copy(points[i]);
      baseEffects.transient.add(flash);
      
      baseEffects.queue.push({
        obj: flash,
        until: now() + 0.1 * FX.timeScale,
        fade: true,
        mat: flash.material,
        scaleRate: 8.0
      });
    }, i * 10);
  }
  }
}

export default function fireBoltEffect(baseEffects, params) { return new FireBoltEffect(baseEffects, params); }

/**
 * Create concentrated piercing bolt impact
 */
function createBoltImpact(position, direction, colors, size, particles, custom, baseEffects) {
  // Bright impact flash
  const flash = new THREE.Mesh(
    new THREE.SphereGeometry(size.impact || 1.2, 16, 16),
    new THREE.MeshBasicMaterial({
      color: 0xffd700,
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
  
  // Piercing effect (bolt continues through)
  if (custom.pierceEffect) {
    const pierceLength = 2.0;
    const pierceEnd = position.clone().add(direction.clone().multiplyScalar(pierceLength));
    
    // Create piercing beam
    const beamGeo = new THREE.CylinderGeometry(0.15, 0.1, pierceLength, 8);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0.9
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    
    beam.position.lerpVectors(position, pierceEnd, 0.5);
    const angle = Math.atan2(direction.z, direction.x);
    beam.rotation.z = Math.PI / 2;
    beam.rotation.y = -angle;
    
    baseEffects.transient.add(beam);
    
    baseEffects.queue.push({
      obj: beam,
      until: now() + 0.3 * FX.timeScale,
      fade: true,
      mat: beamMat
    });
  }
  
  // Shockwave ring
  const shockwave = new THREE.Mesh(
    new THREE.RingGeometry(0.2, 0.4, 32),
    new THREE.MeshBasicMaterial({
      color: 0xff6347,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    })
  );
  shockwave.rotation.x = -Math.PI / 2;
  shockwave.position.set(position.x, 0.1, position.z);
  baseEffects.indicators.add(shockwave);
  
  const startTime = now();
  baseEffects.queue.push({
    obj: shockwave,
    until: startTime + 0.4 * FX.timeScale,
    fade: true,
    mat: shockwave.material,
    shockwave: true,
    shockwaveMaxRadius: 2.5,
    shockwaveThickness: 0.4,
    shockwaveStartTime: startTime,
    shockwaveDuration: 0.4
  });
  
  // Electric sparks burst
  for (let i = 0; i < (particles.count || 20); i++) {
    const spark = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 6, 6),
      new THREE.MeshBasicMaterial({
        color: Math.random() > 0.5 ? 0xffd700 : 0xffa500,
        transparent: true,
        opacity: 1.0
      })
    );
    
    spark.position.copy(position);
    baseEffects.transient.add(spark);
    
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 2.5;
    
    baseEffects.queue.push({
      obj: spark,
      until: now() + (0.4 + Math.random() * 0.3) * FX.timeScale,
      fade: true,
      mat: spark.material,
      particle: true,
      velocity: new THREE.Vector3(
        Math.cos(angle) * speed,
        0.5 + Math.random() * 1.5,
        Math.sin(angle) * speed
      ),
      gravity: -8
    });
  }
  
  // Small fire pillars (concentrated impact)
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2;
    const dist = 0.8;
    
    setTimeout(() => {
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.25, 2, 8),
        new THREE.MeshBasicMaterial({
          color: i % 2 === 0 ? 0xff6347 : 0xffa500,
          transparent: true,
          opacity: 0.8
        })
      );
      pillar.position.set(
        position.x + Math.cos(angle) * dist,
        1,
        position.z + Math.sin(angle) * dist
      );
      baseEffects.transient.add(pillar);
      
      baseEffects.queue.push({
        obj: pillar,
        until: now() + 0.3 * FX.timeScale,
        fade: true,
        mat: pillar.material,
        scaleRate: -3.0
      });
    }, i * 40);
  }
  
  // Small scorch mark
  const scorch = new THREE.Mesh(
    new THREE.CircleGeometry(1.5, 32),
    new THREE.MeshBasicMaterial({
      color: 0x2a1a0a,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    })
  );
  scorch.rotation.x = -Math.PI / 2;
  scorch.position.set(position.x, 0.01, position.z);
  baseEffects.indicators.add(scorch);
  
  baseEffects.queue.push({
    obj: scorch,
    until: now() + 1.0 * FX.timeScale,
    fade: true,
    mat: scorch.material
  });
}