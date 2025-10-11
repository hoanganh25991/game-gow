import * as THREE from "../vendor/three/build/three.module.js";

/**
 * Create a circular village fence visual around the origin village.
 * This is purely visual — gameplay boundaries still come from REST_RADIUS and game logic.
 *
 * Returns:
 *   THREE.Group containing instanced posts, rails, and a subtle ground ring.
 */
export function createVillageFence(VILLAGE_POS, REST_RADIUS, THEME_COLORS) {
  const fenceGroup = new THREE.Group();

  const FENCE_POSTS = 28;
  const fenceRadius = REST_RADIUS - 0.2;

  // Posts
  const postGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.6, 8);
  const postMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2a });
  const postPositions = [];
  const postsInst = new THREE.InstancedMesh(postGeo, postMat, FENCE_POSTS);
  const _m4 = new THREE.Matrix4();
  const _q = new THREE.Quaternion();
  const _s = new THREE.Vector3(1, 1, 1);
  const _p = new THREE.Vector3();

  for (let i = 0; i < FENCE_POSTS; i++) {
    const ang = (i / FENCE_POSTS) * Math.PI * 2;
    const px = VILLAGE_POS.x + Math.cos(ang) * fenceRadius;
    const pz = VILLAGE_POS.z + Math.sin(ang) * fenceRadius;
    _p.set(px, 0.8, pz);
    _q.setFromEuler(new THREE.Euler(0, -ang, 0));
    _s.set(1, 1, 1);
    _m4.compose(_p, _q, _s);
    postsInst.setMatrixAt(i, _m4);
    postPositions.push({ x: px, z: pz });
  }
  postsInst.instanceMatrix.needsUpdate = true;
  postsInst.castShadow = true;
  postsInst.receiveShadow = true;
  fenceGroup.add(postsInst);

  // Rails (three horizontal lines)
  const railMat = new THREE.MeshStandardMaterial({ color: 0x4b3620 });
  const railHeights = [0.45, 0.9, 1.35];
  const _unitRailGeo = new THREE.BoxGeometry(1, 0.06, 0.06);
  const railsCount = FENCE_POSTS * railHeights.length;
  const railsInst = new THREE.InstancedMesh(_unitRailGeo, railMat, railsCount);
  let railIdx = 0;

  for (let i = 0; i < FENCE_POSTS; i++) {
    const a = postPositions[i];
    const b = postPositions[(i + 1) % FENCE_POSTS];
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const len = Math.hypot(dx, dz);
    const angle = Math.atan2(dz, dx);
    const midX = (a.x + b.x) / 2;
    const midZ = (a.z + b.z) / 2;

    for (const h of railHeights) {
      const pos = _p.set(midX, h, midZ);
      const quat = _q.setFromEuler(new THREE.Euler(0, -angle, 0));
      const scl = _s.set(len, 1, 1);
      _m4.compose(pos, quat, scl);
      railsInst.setMatrixAt(railIdx++, _m4);
    }
  }
  railsInst.instanceMatrix.needsUpdate = true;
  railsInst.castShadow = false;
  railsInst.receiveShadow = true;
  fenceGroup.add(railsInst);

  // Subtle ground ring
  const fenceRing = new THREE.Mesh(
    new THREE.RingGeometry(fenceRadius - 0.08, fenceRadius + 0.08, 64),
    new THREE.MeshBasicMaterial({ color: THEME_COLORS.village, transparent: true, opacity: 0.08, side: THREE.DoubleSide })
  );
  fenceRing.rotation.x = -Math.PI / 2;
  fenceRing.position.copy(VILLAGE_POS);
  fenceGroup.add(fenceRing);

  return fenceGroup;
}
