import * as THREE from "../vendor/three/build/three.module.js";
import { createHouse } from "./meshes.js";
import { THEME_COLORS } from "../config/theme.js";

/**
 * Creates a cluster of houses in circular arrangement
 * Shared utility for both environment villages and dynamic villages
 * 
 * @param {THREE.Vector3} center - Center position for the cluster
 * @param {number} count - Number of houses to create
 * @param {number} radius - Placement radius from center
 * @param {object} options - Configuration options
 * @param {string} options.lights - Light mode: 'none' | 'dim' | 'full'
 * @param {boolean} options.decorations - Whether to add ground decorations
 * @param {number} options.scaleMin - Minimum house scale
 * @param {number} options.scaleMax - Additional random scale variation
 * @param {function} options.acquireLight - Function to check if light budget available
 * @returns {THREE.Group} Group containing all houses
 */
export function createHouseCluster(center, count, radius, options = {}) {
  const {
    lights = 'full',
    decorations = true,
    scaleMin = 0.9,
    scaleMax = 0.5,
    acquireLight = null
  } = options;

  const group = new THREE.Group();

  for (let i = 0; i < count; i++) {
    try {
      const house = createHouse();
      const ang = Math.random() * Math.PI * 2;
      const r = radius * (0.3 + Math.random() * 0.9);
      house.position.set(
        center.x + Math.cos(ang) * r,
        0,
        center.z + Math.sin(ang) * r
      );
      house.rotation.y = Math.random() * Math.PI * 2;
      
      // Apply scale variation
      const sc = scaleMin + Math.random() * scaleMax;
      house.scale.setScalar(sc);

      // Add lantern light if budget allows
      let hasLanternLight = false;
      if (lights !== 'none' && (!acquireLight || acquireLight(1))) {
        hasLanternLight = true;
        const intensity = lights === 'dim' ? 0.4 : 0.9;
        const dist = lights === 'dim' ? 4 : 6;
        const decay = 2;
        const lanternLight = new THREE.PointLight(THEME_COLORS.themeYellow, intensity, dist, decay);
        lanternLight.position.set(0.6, 0.8, 0.6);
        lanternLight.castShadow = false;
        house.add(lanternLight);
      }

      // Add emissive lantern bulb
      const emissiveIntensity = lights === 'none' 
        ? (hasLanternLight ? 0.9 : 1.2)
        : (hasLanternLight ? 1.2 : 1.4);
      
      const lanternBulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 8, 8),
        new THREE.MeshStandardMaterial({
          emissive: THEME_COLORS.themeYellow,
          emissiveIntensity,
          color: THEME_COLORS.volcano,
          roughness: 0.7
        })
      );
      lanternBulb.position.set(0.6, 0.8, 0.6);
      house.add(lanternBulb);

      // Add small ground decoration near house entrance
      if (decorations) {
        const peb = new THREE.Mesh(
          new THREE.DodecahedronGeometry(0.22, 0),
          new THREE.MeshStandardMaterial({ color: THEME_COLORS.stem, roughness: 0.95 })
        );
        peb.position.set(0.9, 0.02, 0.2);
        peb.scale.setScalar(0.8 + Math.random() * 0.6);
        house.add(peb);
      }

      group.add(house);
    } catch (e) {
      // Fallback safety - skip this house if creation fails
    }
  }

  return group;
}
